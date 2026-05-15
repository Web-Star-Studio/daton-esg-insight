-- F-017 da auditoria 2026-05-15: proteger colunas sensíveis em supplier_management.
--
-- Estado anterior: a SELECT policy em supplier_management permite que qualquer
-- usuário autenticado da empresa leia TODAS as colunas, incluindo password_hash,
-- temporary_password e access_code. Viewer/auditor sem privilégio administrativo
-- conseguia ver credenciais de portal de fornecedores.
--
-- Fix:
--   1. REVOKE SELECT (password_hash, temporary_password, access_code) FROM
--      role `authenticated`. Qualquer SELECT por usuário logado normal que
--      tente projetar essas colunas falha. service_role (usado por edge
--      functions como supplier-auth) continua tendo acesso.
--   2. Função RPC get_supplier_credentials(uuid) SECURITY DEFINER, que devolve
--      access_code + must_change_password apenas se o caller for admin/super_admin/
--      platform_admin da mesma empresa do fornecedor. Permite admin reexibir o
--      código de acesso na tela de detalhes sem expor a coluna globalmente.

BEGIN;

-- =============================================================================
-- 1) Substituir o GRANT table-level SELECT por GRANT coluna-nivel só nas colunas
--    seguras. Em Postgres, table-level e column-level são aditivos (OR), então
--    apenas REVOKE column-level seria no-op enquanto o table-level existir.
--    Aqui derrubamos o table-level e re-emitimos GRANT explícito apenas pelas
--    colunas seguras. password_hash, temporary_password e access_code ficam
--    inacessíveis para o role `authenticated` (qualquer SELECT direto falha
--    com "permission denied for column ...").
--
--    Também aplicamos o mesmo a `anon` (esse role nunca deveria ler a tabela,
--    mas o GRANT default da Supabase deixou aberto historicamente; RLS bloqueia
--    em prática, mas defesa em profundidade).
-- =============================================================================
REVOKE SELECT ON public.supplier_management FROM authenticated;
REVOKE SELECT ON public.supplier_management FROM anon;

GRANT SELECT (
  id, company_id, person_type, full_name, cpf, company_name, cnpj,
  responsible_name, nickname, full_address, cep, street, street_number,
  neighborhood, city, state, phone_1, phone_2, email, registration_date,
  status, created_at, updated_at, must_change_password, last_login_at,
  login_attempts, is_locked, portal_enabled, supply_failure_count,
  last_failure_date, auto_inactivation_reason, auto_inactivated_at,
  reactivation_blocked_until, inactivation_reason, status_changed_at,
  status_changed_by
) ON public.supplier_management TO authenticated;

-- service_role bypassa RLS e tem table-level SELECT por default da Supabase;
-- nada precisa ser ajustado aqui (edge functions supplier-auth etc. continuam
-- lendo todas as colunas).

-- =============================================================================
-- 2) RPC para admins consultarem credenciais
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_supplier_credentials(p_supplier_id uuid)
RETURNS TABLE (
  access_code text,
  must_change_password boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_company_id uuid;
  target_company_id uuid;
  is_caller_admin boolean;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  caller_company_id := public.get_user_company_id();
  IF caller_company_id IS NULL THEN
    RAISE EXCEPTION 'Caller has no company' USING ERRCODE = '42501';
  END IF;

  SELECT s.company_id INTO target_company_id
  FROM public.supplier_management s
  WHERE s.id = p_supplier_id;

  IF target_company_id IS NULL THEN
    RAISE EXCEPTION 'Supplier not found' USING ERRCODE = 'P0002';
  END IF;

  IF target_company_id <> caller_company_id THEN
    RAISE EXCEPTION 'Cross-tenant access denied' USING ERRCODE = '42501';
  END IF;

  is_caller_admin := public.has_role(caller_id, 'admin'::public.user_role_type)
                  OR public.has_role(caller_id, 'super_admin'::public.user_role_type)
                  OR public.is_platform_admin();

  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Admin role required to view supplier credentials' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT s.access_code, s.must_change_password
    FROM public.supplier_management s
    WHERE s.id = p_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.get_supplier_credentials(uuid) IS
'Retorna access_code e flag de troca de senha de um fornecedor. Apenas para admin/super_admin/platform_admin da mesma empresa. Substitui leitura direta da coluna access_code (revogada para o role authenticated).';

REVOKE ALL ON FUNCTION public.get_supplier_credentials(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_supplier_credentials(uuid) TO authenticated;

COMMIT;
