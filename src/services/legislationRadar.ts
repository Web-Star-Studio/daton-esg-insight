// Cliente do Radar Mensal de Novidades Legais.
//
// Server-side faz a busca via Perplexity Sonar e devolve até 12 candidatas
// com URL canônica + publication_date dentro do mês requisitado. Aqui só
// invocamos a edge function e oferecemos `acceptRadarNovelties` que faz o
// roundtrip de ingestão: INSERT em `legislations` (com `ai_ingested=true`)
// + INSERT em `legislation_unit_compliance` da branch. O trigger
// `create_legislation_history` dispara `action='created'` automaticamente,
// então a próxima geração da carta cobre essa novidade em "Publicadas".

import { supabase } from "@/integrations/supabase/client";

export interface RadarNovelty {
  reference: string;
  norm_type: string;
  norm_number: string;
  publication_date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  jurisdiction: "federal" | "estadual" | "municipal" | "nbr" | "internacional";
  state: string | null;
  municipality: string | null;
  issuing_body: string;
  source_url: string;
  applicability_hint: "real" | "potential";
  matched_themes: string[];
}

export interface RadarResponse {
  novelties: RadarNovelty[];
  duplicate_count: number;
  branch: { id: string; name: string; state: string | null; city: string | null };
  reference_month: string; // YYYY-MM-DD do dia 1 do mês
  ai_failed: boolean;
  ai_error?: string;
}

export async function fetchMonthlyRadar(
  branchId: string,
  referenceMonth: string,
): Promise<RadarResponse> {
  const { data, error } = await supabase.functions.invoke("legislation-monthly-radar", {
    body: { branch_id: branchId, reference_month: referenceMonth },
  });
  if (error) {
    let detail = error.message;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (error as any).context;
      const tryParse = async (target: unknown): Promise<unknown> => {
        if (target instanceof Response) {
          try { return await target.clone().json(); } catch { /* not json */ }
          try { return await target.clone().text(); } catch { /* unreadable */ }
        }
        return null;
      };
      const candidates = [ctx, (ctx as { response?: Response })?.response];
      for (const c of candidates) {
        const parsed = await tryParse(c);
        if (parsed && typeof parsed === "object" && "error" in parsed) {
          detail = String((parsed as { error: unknown }).error);
          break;
        }
        if (typeof parsed === "string" && parsed.length > 0) {
          detail = parsed;
          break;
        }
      }
    } catch { /* ignora */ }
    throw new Error(detail);
  }
  return data as RadarResponse;
}

export interface AcceptableNovelty extends RadarNovelty {
  override_applicability?: "real" | "potential";
}

export interface AcceptResult {
  legislationsCreated: number;
  complianceLinks: number;
}

// Aceita uma lista de novidades: cria as linhas em `legislations` (uma por
// novidade) e vincula cada uma à branch via `legislation_unit_compliance`.
// O trigger `create_legislation_history` cobre a auditoria. Compliance
// status default = "para_conhecimento" (alinhado com a página de Sugestões),
// e applicability vem do override OU do hint da IA.
export async function acceptRadarNovelties(
  branchId: string,
  companyId: string,
  novelties: AcceptableNovelty[],
  acceptedBy?: string,
): Promise<AcceptResult> {
  if (novelties.length === 0) return { legislationsCreated: 0, complianceLinks: 0 };

  const ingestedAt = new Date().toISOString();
  const insertRows = novelties.map((n) => ({
    company_id: companyId,
    title: n.title,
    norm_type: n.norm_type || "Outros",
    norm_number: n.norm_number || null,
    publication_date: n.publication_date || null,
    issuing_body: n.issuing_body || null,
    summary: n.summary || null,
    full_text_url: n.source_url || null,
    jurisdiction: n.jurisdiction,
    state: n.state,
    municipality: n.municipality,
    overall_applicability: n.override_applicability ?? n.applicability_hint,
    overall_status: "pending",
    is_active: true,
    theme_id: null, // legislation_themes tem taxonomia distinta dos 21 temas
    applicability_tags: n.matched_themes,
    ai_ingested: true,
    ai_source_url: n.source_url,
    ai_ingestion_meta: {
      ingested_at: ingestedAt,
      accepted_by: acceptedBy ?? null,
      reference: n.reference,
      applicability_hint: n.applicability_hint,
      matched_themes: n.matched_themes,
    },
    created_by: acceptedBy ?? null,
  }));

  const { data: created, error: insertErr } = await supabase
    .from("legislations")
    .insert(insertRows as never[])
    .select("id");
  if (insertErr) throw insertErr;
  const legIds = (created ?? []).map((r) => r.id);

  // Vincula cada nova legislação à branch. compliance_status="para_conhecimento"
  // alinha com a definição de Potencial ("inserido para monitoramento, sem
  // pendência automática"); para Real, o usuário promove depois pelo
  // UnitComplianceModal.
  const complianceRows = novelties.map((n, idx) => ({
    legislation_id: legIds[idx],
    branch_id: branchId,
    company_id: companyId,
    applicability: n.override_applicability ?? n.applicability_hint,
    compliance_status: "para_conhecimento",
    has_pending_requirements: false,
    evaluated_at: null,
    evaluated_by: acceptedBy ?? null,
  })).filter((r) => !!r.legislation_id);

  if (complianceRows.length === 0) {
    return { legislationsCreated: legIds.length, complianceLinks: 0 };
  }

  const { error: linkErr } = await supabase
    .from("legislation_unit_compliance")
    .insert(complianceRows as never[]);
  if (linkErr) throw linkErr;

  return { legislationsCreated: legIds.length, complianceLinks: complianceRows.length };
}
