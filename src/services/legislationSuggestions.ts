// Cliente da feature "Sugestões de Legislação a partir do Perfil".
//
// A edge function `legislation-suggestions-from-profile` roda como job em
// background: o disparo cria uma row em `legislation_suggestion_runs`
// (status='running'), o agente roda no servidor e atualiza a row no fim.
// Aqui invocamos o disparo e lemos as runs (última + histórico) para a UI
// acompanhar status e revisar o que foi sugerido. O aceite de uma sugestão
// vira upsert em bulk em `legislation_unit_compliance`.

import { supabase } from "@/integrations/supabase/client";

export interface MatchedSuggestion {
  legislation_id: string;
  title: string;
  summary: string | null;
  jurisdiction: string;
  origin: string;
  state: string | null;
  municipality: string | null;
  default_applicability: string;
  matched_tags: string[];
  score: number;
  theme_id: string | null;
  norm_type: string | null;
  norm_number: string | null;
}

export interface DiscoveredSuggestion {
  reference: string;
  url: string | null;
  summary: string;
  jurisdiction_hint: string;
  applicability_hint: "real" | "potential";
}

export type SuggestionRunStatus = "running" | "completed" | "failed";
export type SuggestionPublishStatus = "draft" | "published";

// Row completa de `legislation_suggestion_runs`, com os payloads.
export interface SuggestionRun {
  id: string;
  company_id: string;
  branch_id: string;
  triggered_by: string | null;
  status: SuggestionRunStatus;
  expand_ai: boolean;
  ai_used: boolean;
  ai_failed: boolean;
  ai_error: string | null;
  tag_count: number;
  matched_count: number;
  discovered_count: number;
  matched: MatchedSuggestion[];
  discovered: DiscoveredSuggestion[];
  error_text: string | null;
  publish_status: SuggestionPublishStatus;
  published_at: string | null;
  published_by: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

// Versão leve para o histórico — sem os payloads matched/discovered.
export interface SuggestionRunSummary {
  id: string;
  status: SuggestionRunStatus;
  expand_ai: boolean;
  ai_used: boolean;
  ai_failed: boolean;
  tag_count: number;
  matched_count: number;
  discovered_count: number;
  publish_status: SuggestionPublishStatus;
  triggered_by: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

const RUN_COLUMNS =
  "id, company_id, branch_id, triggered_by, status, expand_ai, ai_used, ai_failed, ai_error, " +
  "tag_count, matched_count, discovered_count, matched, discovered, error_text, " +
  "publish_status, published_at, published_by, started_at, completed_at, duration_ms";

const RUN_SUMMARY_COLUMNS =
  "id, status, expand_ai, ai_used, ai_failed, tag_count, matched_count, discovered_count, " +
  "publish_status, triggered_by, started_at, completed_at, duration_ms";

export type StartRunResult =
  | { kind: "started"; runId: string }
  | { kind: "questionnaire-not-completed" };

// Dispara uma nova busca. Retorna o run_id imediatamente — o trabalho
// pesado roda em background e a row é atualizada depois.
export async function startSuggestionRun(
  branchId: string,
  opts?: { expandAi?: boolean },
): Promise<StartRunResult> {
  const { data, error } = await supabase.functions.invoke("legislation-suggestions-from-profile", {
    body: { branch_id: branchId, expand_ai: opts?.expandAi === true },
  });
  if (error) {
    let detail = error.message;
    try {
      const ctx = (error as { context?: { response?: { clone?: () => Response } } }).context;
      if (ctx?.response?.clone) {
        const body = await ctx.response.clone().json();
        if (body?.error) detail = String(body.error);
      }
    } catch {
      // ignora — fica com error.message
    }
    throw new Error(detail);
  }
  const payload = (data ?? {}) as { run_id?: string; status?: string };
  if (payload.status === "questionnaire-not-completed") {
    return { kind: "questionnaire-not-completed" };
  }
  if (!payload.run_id) {
    throw new Error("resposta inesperada da função de sugestões");
  }
  return { kind: "started", runId: payload.run_id };
}

export async function fetchLatestSuggestionRun(branchId: string): Promise<SuggestionRun | null> {
  const { data, error } = await supabase
    .from("legislation_suggestion_runs")
    .select(RUN_COLUMNS)
    .eq("branch_id", branchId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as SuggestionRun | null) ?? null;
}

export async function fetchSuggestionRun(runId: string): Promise<SuggestionRun | null> {
  const { data, error } = await supabase
    .from("legislation_suggestion_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as SuggestionRun | null) ?? null;
}

export async function fetchSuggestionRunHistory(
  branchId: string,
  limit = 20,
): Promise<SuggestionRunSummary[]> {
  const { data, error } = await supabase
    .from("legislation_suggestion_runs")
    .select(RUN_SUMMARY_COLUMNS)
    .eq("branch_id", branchId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as SuggestionRunSummary[] | null) ?? [];
}

// Publica a run (rascunho → publicado). A função SECURITY DEFINER do
// banco valida que o usuário é admin da empresa.
export async function publishSuggestionRun(runId: string): Promise<void> {
  const { error } = await supabase.rpc("publish_suggestion_run", { p_run_id: runId });
  if (error) throw error;
}

interface AcceptablePayload {
  legislation_id: string;
  applicability: "real" | "potential" | "na" | "revoked" | "pending";
}

export async function acceptSuggestions(
  branchId: string,
  companyId: string,
  legislations: AcceptablePayload[],
  evaluatedBy?: string,
): Promise<number> {
  if (legislations.length === 0) return 0;

  // Cada sugestão entra como "para_conhecimento" — alinhado com a
  // definição de Potencial ("inserido para monitoramento, sem pendência
  // automática") e neutro pra Reais (usuário promove a 'pending' /
  // 'adequacao' depois pelo UnitComplianceModal).
  const records = legislations.map((it) => ({
    legislation_id: it.legislation_id,
    branch_id: branchId,
    company_id: companyId,
    applicability: it.applicability,
    compliance_status: "para_conhecimento",
    has_pending_requirements: false,
    evaluated_at: null,
    evaluated_by: evaluatedBy ?? null,
  }));

  const { data, error } = await supabase
    .from("legislation_unit_compliance")
    .upsert(records, { onConflict: "legislation_id,branch_id" })
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}
