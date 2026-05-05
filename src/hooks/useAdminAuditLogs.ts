import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lê `admin_audit_logs` filtrado por período + (opcionalmente)
 * action_type, actor, target. RLS já restringe a platform_admin.
 */

type Period = "24h" | "7d" | "30d" | "90d";
const periodMs: Record<Period, number> = {
  "24h": 24 * 3_600_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
  "90d": 90 * 86_400_000,
};

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodMs[period]).toISOString();

export type AdminAuditLog = {
  id: string;
  occurred_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
};

export type AdminAuditFilters = {
  period?: Period;
  actionType?: string | null;
  actorUserId?: string | null;
  targetType?: string | null;
};

export const useAdminAuditLogs = (filters: AdminAuditFilters = {}) => {
  const period = filters.period ?? "30d";

  return useQuery({
    queryKey: ["admin-audit-logs", filters],
    queryFn: async (): Promise<AdminAuditLog[]> => {
      let query = supabase
        .from("admin_audit_logs")
        .select(
          "id, occurred_at, actor_user_id, actor_email, actor_role, action_type, target_type, target_id, target_label, before_value, after_value, reason, ip_address, user_agent, request_id",
        )
        .gte("occurred_at", sinceIso(period))
        .order("occurred_at", { ascending: false })
        .limit(500);

      if (filters.actionType) query = query.eq("action_type", filters.actionType);
      if (filters.actorUserId) query = query.eq("actor_user_id", filters.actorUserId);
      if (filters.targetType) query = query.eq("target_type", filters.targetType);

      const { data } = await query;
      return (data ?? []) as AdminAuditLog[];
    },
    staleTime: 30_000,
  });
};
