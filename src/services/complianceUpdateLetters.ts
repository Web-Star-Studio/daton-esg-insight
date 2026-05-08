// Cliente da feature "Carta de Atualização Mensal de Compliance".
// Mantém só CRUD de leitura + invocação da edge function geradora; a IA e
// a montagem dos buckets ficam no servidor (ver
// supabase/functions/compliance-update-letter-generator/index.ts).

import { supabase } from "@/integrations/supabase/client";
import { fetchAllPaginated } from "@/utils/supabasePagination";

// `compliance_update_letters` foi criada na migration
// 20260507120000_compliance_update_letters.sql; o `types.ts` é regenerado
// fora deste worktree. Enquanto o tipo não chega ao client, escapamos a
// checagem do builder Supabase com um cast pontual — runtime é idêntico,
// só desliga a verificação compile-time. Também evita TS2589
// (instanciação profunda) que aparece com tabelas extras.
const sb: any = supabase;

export interface SerializedLine {
  legislation_id: string;
  code: string;
  title: string;
  summary: string;
  applicability: string;
  systems: string[];
  origin: string;
  observation: string;
  alterador: string;
  changed_at: string | null;
}

export interface LetterContent {
  unit_name: string;
  unit_city?: string | null;
  unit_state?: string | null;
  reference_month: string; // YYYY-MM-DD do dia 1 do mês
  generated_at: string;
  executive_summary: string;
  sections: {
    published: SerializedLine[];
    modified: SerializedLine[];
    revoked: SerializedLine[];
    excluded: SerializedLine[];
    included_by_review: SerializedLine[];
  };
  ai_meta: {
    summary_failed: boolean;
    diffs_failed: boolean;
    error?: string;
    incomplete?: boolean;
  };
}

export interface ComplianceUpdateLetter {
  id: string;
  company_id: string;
  branch_id: string;
  reference_month: string;
  generated_at: string;
  generated_by: string | null;
  generator_name?: string | null; // preenchido após join
  content: LetterContent;
}

const TABLE = "compliance_update_letters";

// Lista cartas de uma branch ordenadas pelo mês mais recente. Sem filtro
// de empresa explícito porque a RLS já restringe ao company_id do usuário.
export async function fetchLettersByBranch(branchId: string): Promise<ComplianceUpdateLetter[]> {
  const rows = await fetchAllPaginated<ComplianceUpdateLetter>((from, to) =>
    sb
      .from(TABLE)
      .select("id, company_id, branch_id, reference_month, generated_at, generated_by, content")
      .eq("branch_id", branchId)
      .order("reference_month", { ascending: false })
      .range(from, to),
  );

  // Resolve nomes dos geradores numa query separada para evitar embed
  // circular (RLS de profiles é restrita).
  const userIds = Array.from(new Set(rows.map((r) => r.generated_by).filter((v): v is string => !!v)));
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    const nameById = new Map<string, string>(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? ""] as const),
    );
    for (const r of rows) {
      r.generator_name = r.generated_by ? nameById.get(r.generated_by) ?? null : null;
    }
  }
  return rows;
}

export async function fetchLetterById(id: string): Promise<ComplianceUpdateLetter | null> {
  const { data, error } = await sb
    .from(TABLE)
    .select("id, company_id, branch_id, reference_month, generated_at, generated_by, content")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const letter = data as ComplianceUpdateLetter;
  if (letter.generated_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", letter.generated_by)
      .maybeSingle();
    letter.generator_name = profile?.full_name ?? null;
  }
  return letter;
}

// Resumo por branch usado no seletor da página: indica se a unidade tem
// questionário concluído e quantas legislações estão vinculadas. Antes
// disso, a carta sai vazia ou pouco representativa, então sinalizamos
// na UI para escolher uma unidade com dado real.
export interface BranchReadiness {
  branchId: string;
  profileCompletedAt: string | null;
  legislationCount: number;
}

export async function fetchBranchReadiness(companyId: string): Promise<Map<string, BranchReadiness>> {
  const map = new Map<string, BranchReadiness>();

  // Profiles concluídos.
  const { data: profiles } = await supabase
    .from("legislation_compliance_profiles")
    .select("branch_id, completed_at")
    .eq("company_id", companyId);
  for (const p of profiles ?? []) {
    if (!p.branch_id) continue;
    map.set(p.branch_id, {
      branchId: p.branch_id,
      profileCompletedAt: p.completed_at ?? null,
      legislationCount: 0,
    });
  }

  // legislation_unit_compliance pode ter milhares de linhas; fetchAllPaginated
  // é o padrão do projeto pra estourar o limite 1k do PostgREST.
  const luc = await fetchAllPaginated<{ branch_id: string }>((from, to) =>
    supabase
      .from("legislation_unit_compliance")
      .select("branch_id")
      .eq("company_id", companyId)
      .range(from, to),
  );
  for (const row of luc) {
    if (!row.branch_id) continue;
    const existing = map.get(row.branch_id);
    if (existing) {
      existing.legislationCount += 1;
    } else {
      map.set(row.branch_id, {
        branchId: row.branch_id,
        profileCompletedAt: null,
        legislationCount: 1,
      });
    }
  }
  return map;
}

export interface GenerateLetterInput {
  branchId: string;
  // Pode ser qualquer Date dentro do mês desejado; o servidor trunca.
  referenceMonth: Date;
}

export interface GenerateLetterResult {
  id: string;
  content: LetterContent;
}

export async function generateLetter({
  branchId,
  referenceMonth,
}: GenerateLetterInput): Promise<GenerateLetterResult> {
  // ISO date YYYY-MM-DD do dia 1 do mês. Servidor revalida com CHECK.
  const monthStart = new Date(
    Date.UTC(referenceMonth.getUTCFullYear(), referenceMonth.getUTCMonth(), 1),
  );
  const referenceMonthISO = monthStart.toISOString().slice(0, 10);

  const { data, error } = await supabase.functions.invoke("compliance-update-letter-generator", {
    body: { branch_id: branchId, reference_month: referenceMonthISO },
  });
  if (error) {
    // O `supabase-js` envolve 4xx/5xx num FunctionsHttpError genérico — o
    // body útil fica em `error.context` (Response) em algumas versões e em
    // `error.context.response` em outras. Tentamos várias estratégias e
    // logamos tudo no console pra debug rápido.
    console.error("[generateLetter] edge function error:", error);
    let detail = error.message;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (error as any).context;
      console.error("[generateLetter] error.context:", ctx);
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
        console.error("[generateLetter] body candidate:", parsed);
        if (parsed && typeof parsed === "object" && "error" in parsed) {
          detail = String((parsed as { error: unknown }).error);
          break;
        }
        if (typeof parsed === "string" && parsed.length > 0) {
          detail = parsed;
          break;
        }
      }
    } catch (extractErr) {
      console.error("[generateLetter] extract failed:", extractErr);
    }
    throw new Error(detail);
  }
  if (!data || typeof data !== "object" || !("id" in data)) {
    throw new Error("Resposta inesperada da edge function");
  }
  return data as GenerateLetterResult;
}
