// Cliente da feature "Sugestões de Legislação a partir do Perfil".
//
// Server-side faz o trabalho pesado (overlap de tags + filtro geográfico +
// camada IA Perplexity). Aqui só invocamos a edge function e oferecemos
// uma operação de aceitação que vira `legislation_unit_compliance` em
// bulk com os defaults herdados de `legislations.overall_applicability`.

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

export interface SuggestionsResponse {
  matched: MatchedSuggestion[];
  discovered: DiscoveredSuggestion[];
  ai_used: boolean;
  ai_failed: boolean;
  ai_error?: string;
  branch: { id: string; name: string; state: string | null; city: string | null };
  profile: { tag_count: number };
  error?: "questionnaire-not-completed" | string;
}

export async function fetchSuggestions(
  branchId: string,
  opts?: { expandAi?: boolean },
): Promise<SuggestionsResponse> {
  const { data, error } = await supabase.functions.invoke("legislation-suggestions-from-profile", {
    body: { branch_id: branchId, expand_ai: opts?.expandAi === true },
  });
  if (error) {
    let detail = error.message;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (error as any).context;
      if (ctx?.response?.clone) {
        const body = await ctx.response.clone().json();
        if (body?.error) detail = String(body.error);
      }
    } catch {
      // ignora
    }
    throw new Error(detail);
  }
  return data as SuggestionsResponse;
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
