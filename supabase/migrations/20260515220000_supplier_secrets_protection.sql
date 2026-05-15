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
-- 1) REVOKE column-level SELECT
-- =============================================================================
REVOKE SELECT (password_hash, temporary_password, access_code)
  ON public.supplier_management
  FROM authenticated;

-- Garantir explicitamente que service_role mantém o acesso (default geralmente
-- já permite, mas registramos para evitar regressão silenciosa).
GRANT SELECT (password_hash, temporary_password, access_code)
  ON public.supplier_management
  TO service_role;

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
