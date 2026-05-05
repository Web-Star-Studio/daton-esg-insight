-- Auditoria estruturada de ações sensíveis de admin de plataforma.
--
-- Por que existe:
--   • `activity_logs` é livre (formato per-caller), atende auditoria
--     genérica mas não dá pra responder "quem alterou o plano da
--     empresa X em 12/04?" sem ler texto livre de 38 entradas.
--   • LGPD: cliente pode pedir relatório de toda ação que admin da
--     plataforma fez nos dados deles. Sem schema fechado, é caos.
--   • Acountability: 2+ admins, dado sumiu, schema rígido com
--     before/after garante quem foi e o que mudou exatamente.
--
-- Diferença pra `activity_logs`:
--   • `action_type` é vocabulário fechado (CHECK constraint)
--   • `before_value` / `after_value` snapshot do antes/depois (jsonb)
--   • `reason` obrigatório no client (UI deve forçar preenchimento)
--   • `actor_email`/`target_label` snapshots — sobrevivem a delete
--     do usuário/empresa
--   • `request_id` correlaciona com edge function logs

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  -- Quem fez. user_id pode ficar null se admin foi deletado depois.
  -- Email é snapshot do momento da ação (sobrevive delete).
  actor_user_id   uuid,
  actor_email     text,
  actor_role      text,                  -- 'platform_admin', 'super_admin' etc.
  -- O que fez. Lista fechada — adicionar novo tipo? CREATE-OR-REPLACE
  -- this constraint na próxima migration.
  action_type     text NOT NULL CHECK (action_type IN (
    'impersonate_start',
    'impersonate_end',
    'suspend_company',
    'unsuspend_company',
    'change_company_plan',
    'delete_company',
    'invite_user',
    'change_user_role',
    'deactivate_user',
    'reactivate_user',
    'delete_user',
    'reset_user_password',
    'export_company_data',
    'export_user_data',
    'modify_settings',
    'apply_data_correction',
    'other'
  )),
  -- Em quem/o que.
  target_type     text,                  -- 'user', 'company', 'document', 'config'
  target_id       text,                  -- uuid/slug do alvo
  target_label    text,                  -- snapshot do nome (sobrevive delete)
  -- Estado pré e pós (jsonb pra flexibilidade).
  before_value    jsonb,
  after_value     jsonb,
  -- Justificativa textual (UI obriga).
  reason          text,
  -- Contexto de request.
  ip_address      text,
  user_agent      text,
  request_id      text                   -- correlação com edge functions
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_occurred
  ON public.admin_audit_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor
  ON public.admin_audit_logs (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target
  ON public.admin_audit_logs (target_type, target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs (action_type, occurred_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: só platform_admin (mas cobre o caller pra não bloquear se
-- service_role estiver inserindo via edge function).
DROP POLICY IF EXISTS "Platform admins can insert audit logs"
  ON public.admin_audit_logs;
CREATE POLICY "Platform admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    AND (actor_user_id = auth.uid() OR actor_user_id IS NULL)
  );

-- SELECT: só platform_admin.
DROP POLICY IF EXISTS "Platform admins can read audit logs"
  ON public.admin_audit_logs;
CREATE POLICY "Platform admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Append-only: ninguém pode UPDATE/DELETE (audit trail imutável).
-- Nem mesmo platform_admin. Se precisar corrigir, faz nova entry com
-- action_type='apply_data_correction' referenciando a anterior.
-- (Sem POLICY pra UPDATE/DELETE = bloqueado pra todos exceto service_role.)
