import { supabase } from "@/integrations/supabase/client";

/**
 * Helper pra registrar ações sensíveis de admin de plataforma na
 * tabela `admin_audit_logs`. Inteiramente client-side: o admin
 * autenticado insere com a própria identidade (RLS valida).
 *
 * Uso típico:
 *
 *   await withAdminAudit(
 *     {
 *       action: 'change_company_plan',
 *       targetType: 'company',
 *       targetId: companyId,
 *       targetLabel: company.name,
 *       reason: form.reason,            // UI obriga preencher
 *     },
 *     async (audit) => {
 *       audit.before = { plan: company.plan };
 *       const updated = await changePlan(companyId, newPlan);
 *       audit.after = { plan: updated.plan };
 *       return updated;
 *     }
 *   );
 *
 * O log é gravado **mesmo se a operação falhar** (com `success: false`
 * em metadata) — auditoria precisa ver tentativas, não só sucessos.
 */

export type AdminAuditAction =
  | "impersonate_start"
  | "impersonate_end"
  | "suspend_company"
  | "unsuspend_company"
  | "change_company_plan"
  | "delete_company"
  | "invite_user"
  | "change_user_role"
  | "deactivate_user"
  | "reactivate_user"
  | "delete_user"
  | "reset_user_password"
  | "export_company_data"
  | "export_user_data"
  | "modify_settings"
  | "apply_data_correction"
  | "other";

export type AdminAuditContext = {
  action: AdminAuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  reason?: string;
  /** Capturado server-side via edge function se necessário. */
  requestId?: string;
};

export type AuditEditable = {
  /** Estado antes da operação — preencha antes da chamada que muda. */
  before: Record<string, unknown> | null;
  /** Estado depois — preencha após a chamada bem-sucedida. */
  after: Record<string, unknown> | null;
};

const writeAuditLog = async (
  ctx: AdminAuditContext,
  editable: AuditEditable,
  success: boolean,
  errorMessage?: string,
): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.warn("[adminAudit] sem user autenticado — log ignorado");
      return;
    }

    let actorRole: string | null = null;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      actorRole = profile?.role ?? null;
    } catch {
      // best-effort
    }

    await supabase.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      actor_email: user.email ?? null,
      actor_role: actorRole,
      action_type: ctx.action,
      target_type: ctx.targetType ?? null,
      target_id: ctx.targetId ?? null,
      target_label: ctx.targetLabel ?? null,
      before_value: editable.before,
      after_value: success
        ? editable.after
        : { error: errorMessage ?? "operation_failed" },
      reason: ctx.reason ?? null,
      user_agent:
        typeof navigator !== "undefined"
          ? navigator.userAgent.slice(0, 500)
          : null,
      request_id: ctx.requestId ?? null,
    });
  } catch (err) {
    // Audit nunca pode quebrar o fluxo. Loga warn pra investigação.
    console.warn("[adminAudit] falha ao gravar log:", err);
  }
};

/**
 * Envolve uma operação de admin com gravação automática em
 * `admin_audit_logs`. O callback recebe um objeto `audit` com
 * `before`/`after` mutáveis pra você snapshot do estado.
 *
 * Garantias:
 *   • Se a operação lançar, o log entra com `success=false` e a
 *     mensagem de erro vai pro `after_value`.
 *   • Se a operação retornar, log entra com `success=true` e o
 *     `audit.after` que você setou.
 */
export const withAdminAudit = async <T>(
  ctx: AdminAuditContext,
  fn: (audit: AuditEditable) => Promise<T>,
): Promise<T> => {
  const editable: AuditEditable = { before: null, after: null };
  try {
    const result = await fn(editable);
    void writeAuditLog(ctx, editable, true);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    void writeAuditLog(ctx, editable, false, message);
    throw err;
  }
};

/**
 * Versão simples pra ações que não precisam de wrapper — você grava
 * o log diretamente. Use quando a ação já está espalhada por várias
 * funções e refatorar pro `withAdminAudit` daria muito trabalho.
 */
export const recordAdminAudit = async (
  ctx: AdminAuditContext,
  before: Record<string, unknown> | null = null,
  after: Record<string, unknown> | null = null,
): Promise<void> => {
  await writeAuditLog(ctx, { before, after }, true);
};
