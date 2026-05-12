// Cliente do watchdog semanal de legislações.
//
// O watchdog roda server-side via edge function `legislation-weekly-watchdog`
// (auth: admin/platform_admin). Por enquanto sem cron — disparado manualmente
// pela UI admin. Quando virar produção, schedule via pg_cron + vault token.

import { supabase } from "@/integrations/supabase/client";

export interface WatchdogTriggerRequest {
  scope?: "global" | "company";
  company_id?: string;
  /** Cap defensivo: máximo de normas únicas checadas nesta run. */
  max_unique_normas?: number;
}

export interface WatchdogTriggerResponse {
  run_id: string;
  normas_total: number;
  normas_unique: number;
  normas_checked: number;
  change_events_created: number;
  total_cost_usd: number;
  duration_ms: number;
  message?: string;
}

export async function triggerWatchdog(
  req: WatchdogTriggerRequest = {},
): Promise<WatchdogTriggerResponse> {
  const { data, error } = await supabase.functions.invoke("legislation-weekly-watchdog", {
    body: req,
  });
  if (error) {
    let detail = error.message;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (error as any).context;
      if (ctx instanceof Response) {
        try {
          const parsed = await ctx.clone().json();
          if (parsed && typeof parsed === "object" && "error" in parsed) {
            detail = String(parsed.error);
          }
        } catch { /* not json */ }
      }
    } catch { /* ignora */ }
    throw new Error(detail);
  }
  return data as WatchdogTriggerResponse;
}

export interface WatchdogAuditRow {
  id: string;
  scope: "global" | "company";
  scope_company_id: string | null;
  status: "running" | "completed" | "failed";
  normas_total: number;
  normas_unique: number;
  normas_checked: number;
  change_events_created: number;
  total_cost_usd: number;
  duration_ms: number | null;
  error_text: string | null;
  started_at: string;
  finished_at: string | null;
}

export async function listRecentWatchdogRuns(limit = 20): Promise<WatchdogAuditRow[]> {
  const { data, error } = await supabase
    .from("watchdog_run_audit")
    .select(
      "id, scope, scope_company_id, status, normas_total, normas_unique, normas_checked, change_events_created, total_cost_usd, duration_ms, error_text, started_at, finished_at",
    )
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WatchdogAuditRow[];
}
