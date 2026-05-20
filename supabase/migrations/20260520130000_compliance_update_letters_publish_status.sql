-- Rascunho/publicado para as Cartas de Atualização Mensal.
--
-- Cartas passam a nascer como rascunho (`publish_status='draft'`):
-- visíveis só para quem gerou e para admins da empresa, até serem
-- validadas. Um admin publica (RPC abaixo) para liberar à empresa toda.
-- Regerar uma carta volta o status para rascunho — feito na edge
-- function `compliance-update-letter-generator` (conteúdo novo precisa
-- de nova validação).

ALTER TABLE public.compliance_update_letters
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft','published')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: cartas que já existiam antes desta feature já estavam
-- visíveis para a empresa. Marca todas como 'published' para a nova
-- policy de SELECT não escondê-las retroativamente de não-admins. Só
-- cartas geradas a partir de agora nascem como rascunho (DEFAULT 'draft').
UPDATE public.compliance_update_letters
  SET publish_status = 'published'
  WHERE publish_status = 'draft';

-- SELECT: dentro da empresa; rascunho só para quem gerou ou admin da
-- empresa; carta publicada para todos da empresa.
DROP POLICY IF EXISTS compliance_update_letters_select ON public.compliance_update_letters;
CREATE POLICY compliance_update_letters_select
  ON public.compliance_update_letters FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
      publish_status = 'published'
      OR generated_by = auth.uid()
      OR EXISTS (
        -- `user_roles` é company-scoped: o papel de admin precisa ser DA
        -- empresa dona da carta.
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND company_id = compliance_update_letters.company_id
          AND role IN ('admin','platform_admin')
      )
    )
  );

-- UPDATE direto da tabela passa a ser admin-only — senão um membro comum
-- conseguiria marcar `publish_status='published'` por fora da RPC,
-- furando o gate de validação. O gerador escreve via service role e não
-- é afetado por RLS.
DROP POLICY IF EXISTS compliance_update_letters_update ON public.compliance_update_letters;
CREATE POLICY compliance_update_letters_update
  ON public.compliance_update_letters FOR UPDATE
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND company_id = compliance_update_letters.company_id
        AND role IN ('admin','platform_admin')
    )
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT direto da tabela é removido: cartas são criadas EXCLUSIVAMENTE
-- pela edge function `compliance-update-letter-generator` (service role,
-- não passa por RLS). Sem isto, a policy antiga permitia qualquer membro
-- da empresa inserir uma carta via PostgREST já com
-- `publish_status='published'`, furando o gate de validação.
DROP POLICY IF EXISTS compliance_update_letters_insert ON public.compliance_update_letters;

-- Publica uma carta: admin/platform_admin da empresa marca como
-- 'published', liberando para a empresa inteira.
CREATE OR REPLACE FUNCTION public.publish_compliance_update_letter(p_letter_id uuid)
RETURNS public.compliance_update_letters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_company uuid;
  v_is_admin boolean;
  v_letter public.compliance_update_letters;
BEGIN
  SELECT company_id INTO v_caller_company
  FROM public.profiles WHERE id = auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = v_caller_company
      AND role IN ('admin','platform_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'apenas admin pode publicar uma carta';
  END IF;

  UPDATE public.compliance_update_letters
  SET publish_status = 'published',
      published_at = now(),
      published_by = auth.uid()
  WHERE id = p_letter_id
    AND company_id = v_caller_company
  RETURNING * INTO v_letter;

  IF v_letter.id IS NULL THEN
    RAISE EXCEPTION 'carta não encontrada nesta empresa';
  END IF;

  RETURN v_letter;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_compliance_update_letter(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_compliance_update_letter(uuid) TO authenticated;

-- Persistência atômica da carta gerada. A edge function geradora chama
-- esta função em vez de fazer um upsert direto: o SELECT ... FOR UPDATE
-- trava a row e re-checa o gate de publicação NO MOMENTO da escrita,
-- fechando a corrida em que um admin publica a carta durante os 30-60s
-- de geração (o upsert resetava `publish_status` para 'draft' e
-- sobrescrevia a publicação). `p_is_admin` é resolvido pelo gerador —
-- o cron interno conta como autoritativo.
CREATE OR REPLACE FUNCTION public.persist_compliance_update_letter(
  p_company_id uuid,
  p_branch_id uuid,
  p_reference_month date,
  p_content jsonb,
  p_generated_by uuid,
  p_is_admin boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_existing_status text;
BEGIN
  SELECT publish_status INTO v_existing_status
  FROM public.compliance_update_letters
  WHERE branch_id = p_branch_id AND reference_month = p_reference_month
  FOR UPDATE;

  -- Carta já publicada só é regerável por admin (ou cron). O FOR UPDATE
  -- acima serializa contra um publish concorrente — sem corrida.
  IF v_existing_status = 'published' AND NOT p_is_admin THEN
    RAISE EXCEPTION 'letter_published_concurrently';
  END IF;

  INSERT INTO public.compliance_update_letters
    (company_id, branch_id, reference_month, content, generated_by,
     publish_status, published_at, published_by)
  VALUES
    (p_company_id, p_branch_id, p_reference_month, p_content, p_generated_by,
     'draft', NULL, NULL)
  ON CONFLICT (branch_id, reference_month) DO UPDATE
  SET content        = EXCLUDED.content,
      generated_by   = EXCLUDED.generated_by,
      publish_status = 'draft',
      published_at   = NULL,
      published_by   = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Chamada só pelo gerador (service role). Usuários não invocam direto.
REVOKE ALL ON FUNCTION public.persist_compliance_update_letter(uuid, uuid, date, jsonb, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_compliance_update_letter(uuid, uuid, date, jsonb, uuid, boolean) TO service_role;
