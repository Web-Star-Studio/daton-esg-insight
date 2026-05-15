-- Unifica histórico legado (FPLAN-002) na tabela laia_revisions:
--
-- Contexto: o histórico legado da Gabardo (13 entradas: "00" a "12") estava
-- hardcoded em src/components/laia/LAIARevisoes.tsx (constante LEGACY_REVISIONS).
-- O cliente pediu pra editar a "Revisão 12 — Perspectiva de estágio (ajustes)",
-- mas como era array em JS, não havia caminho de edição. Esta migration traz
-- esses registros pro banco, reusando o modelo existente de laia_revisions.
--
-- Estratégia: adicionar uma flag is_legacy (semântica visual / não-editável de
-- changes), renumerar as revisões existentes da Gabardo (1, 2 → 13, 14) pra
-- abrir espaço pros números 0..12 dos legados, e inserir as 13 entradas.
--
-- Segurança: laia_revision_changes referencia revisões por UUID (revision_id),
-- não por revision_number — então renumerar é seguro e não quebra changes.
--
-- Idempotência: o seed só roda se ainda não existirem registros is_legacy=true
-- pra Gabardo. Re-aplicar a migration não duplica nada.

BEGIN;

-- 1) Coluna is_legacy
ALTER TABLE public.laia_revisions
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.laia_revisions.is_legacy IS
  'Revisão importada do histórico legado (ex: FPLAN-002). Edita título/descrição normalmente, mas não possui linhas em laia_revision_changes.';

-- 2) Renumera + 3) Seed do legado pra Gabardo
DO $$
DECLARE
  v_gabardo_id UUID;
BEGIN
  SELECT id INTO v_gabardo_id
    FROM public.companies
    WHERE name = 'Transportes Gabardo'
    LIMIT 1;

  IF v_gabardo_id IS NULL THEN
    RAISE NOTICE 'Empresa "Transportes Gabardo" não encontrada — pulando seed legado.';
    RETURN;
  END IF;

  -- Idempotência
  IF EXISTS (
    SELECT 1 FROM public.laia_revisions
    WHERE company_id = v_gabardo_id AND is_legacy = true
  ) THEN
    RAISE NOTICE 'Legados já presentes para Gabardo — pulando seed.';
    RETURN;
  END IF;

  -- Etapa A: move revisões existentes (não-legadas) pra zona temporária 10001+
  -- para evitar colisão com revision_number 0..12 do seed.
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY revision_number) AS rn
    FROM public.laia_revisions
    WHERE company_id = v_gabardo_id
      AND is_legacy = false
  )
  UPDATE public.laia_revisions r
    SET revision_number = 10000 + o.rn
    FROM ordered o
    WHERE r.id = o.id;

  -- Etapa B: move da zona temp pra zona final (>= 13). Preserva ordem original.
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY revision_number) AS rn
    FROM public.laia_revisions
    WHERE company_id = v_gabardo_id
      AND is_legacy = false
      AND revision_number >= 10000
  )
  UPDATE public.laia_revisions r
    SET revision_number = 12 + o.rn
    FROM ordered o
    WHERE r.id = o.id;

  -- Seed dos 13 legados (titles e datas vêm direto do array hardcoded antigo)
  INSERT INTO public.laia_revisions (
    company_id, revision_number, title, description, status, is_legacy,
    finalized_at, created_at, updated_at
  )
  VALUES
    (v_gabardo_id, 0,  'Emissão inicial do documento',                                                                                                                            NULL, 'finalizada', true, '2020-08-25T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 1,  'Alteração item 5 e 5.3',                                                                                                                                  NULL, 'finalizada', true, '2020-12-04T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 2,  'Detalhamento controles operacionais',                                                                                                                     NULL, 'finalizada', true, '2020-12-17T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 3,  'Alteração FPLAN-003 para LIRA',                                                                                                                           NULL, 'finalizada', true, '2021-10-18T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 4,  'Inclusão Carregamento e Heliponto (PIR) e alteração Construção Civil (atual) (POA e PIR)',                                                                NULL, 'finalizada', true, '2022-05-30T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 5,  'Inclusão Museu (PIR) e Posto Abastecimento (POA)',                                                                                                        NULL, 'finalizada', true, '2022-08-30T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 6,  'Inclusão Espaço Saúde (PIR); Central do Motorista (POA) e Elaboração LAIA SBC e Porto Real',                                                              NULL, 'finalizada', true, '2023-09-05T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 7,  'Revisão geral - análise crítica do documento',                                                                                                            NULL, 'finalizada', true, '2023-10-03T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 8,  'Inclusão aspectos: ruído, odor, tonner e possibilidade de incêndio - POA, PIR',                                                                           NULL, 'finalizada', true, '2022-10-23T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 9,  'Revisão Geral e análise crítica de POA e PIR; Elaboração LAIA de Duque de Caxias, Anápolis e São José dos Pinhais',                                       NULL, 'finalizada', true, '2024-04-15T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 10, 'Revisão Geral (Queimadas Excessivas)',                                                                                                                    NULL, 'finalizada', true, '2024-09-24T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 11, 'Troca de Classificação dos Resíduos de acordo com NBR 10.004-2024, inclusão de Sala de Descanso em GO-CARREGAMENTO, Inclusão das Unidades ES, IRA e CHUÍ', NULL, 'finalizada', true, '2025-06-30T00:00:00Z'::timestamptz, now(), now()),
    (v_gabardo_id, 12, 'Perspectiva de estágio (ajustes)',                                                                                                                        NULL, 'finalizada', true, NULL,                                  now(), now());
END $$;

COMMIT;
