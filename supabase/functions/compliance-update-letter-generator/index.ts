// Carta de Atualização Mensal de Compliance — gerador.
//
// Reúne, para uma (branch_id, reference_month), as legislações que sofreram
// mudança no mês e classifica em cinco buckets (publicadas / alteradas /
// revogadas / excluídas / incluídas por revisão) — o mesmo recorte do
// relatório SOGI usado como referência. Em seguida pede ao Perplexity Sonar
// um sumário executivo curto e um diff por legislação alterada
// (lendo legislation_history.old_values/new_values). O conteúdo é persistido
// em `compliance_update_letters` com idempotência por (branch_id, mês).
//
// Padrão segue `laia-legislation-suggester`: JWT no header, JSON Schema mode
// no Perplexity, log em ai_usage_logs, fallback de IA não derruba a geração.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { siglaForThemeOrNull } from "../_shared/compliance-systems.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";

interface RequestBody {
  branch_id: string;
  reference_month: string; // ISO date — qualquer dia do mês; truncamos abaixo.
  // Quando true (e header `x-cron-internal: 1` + Bearer = service role),
  // pula a resolução de usuário e gera com `generated_by: null`. Caminho
  // exclusivo do cron — não é exposto a clientes via UI.
  cron_internal?: boolean;
}

// Subset que usamos da legislação. Ler tudo é desnecessário e custa banda.
interface LegislationRow {
  id: string;
  title: string;
  norm_type: string | null;
  norm_number: string | null;
  summary: string | null;
  observations: string | null;
  general_notes: string | null;
  jurisdiction: string;
  state: string | null;
  municipality: string | null;
  overall_applicability: string | null;
  overall_status: string | null;
  publication_date: string | null;
  is_active: boolean | null;
  theme_id: string | null;
  // applicability_tags armazena os ids dos 21 temas (radar Perplexity).
  // Quando theme_id é null (caso típico de norma ingerida via radar), usamos
  // o primeiro tag aqui pra derivar a sigla na coluna "Sistemas".
  applicability_tags: string[] | null;
  revoked_by_legislation_id: string | null;
  revokes_legislation_id: string | null;
}

interface HistoryRow {
  id: string;
  legislation_id: string;
  action: string;
  changed_at: string | null;
  changed_by: string | null;
}

interface HistoryDiffRow extends HistoryRow {
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
}

interface SerializedLine {
  legislation_id: string;
  code: string;             // "#<id-curto> · <norm_type> nº <norm_number>"
  title: string;
  summary: string;
  applicability: string;    // "real" | "potential" | ...
  systems: string[];        // siglas (LIC, TRP, ...)
  origin: string;           // "Federal" | "Estadual,RS" | ...
  observation: string;      // texto para a coluna "Justificativa/Observação"
  alterador: string;        // nome do profile que mudou (vazio para 'created')
  changed_at: string | null;
}

interface LetterContent {
  unit_name: string;
  unit_city: string | null;
  unit_state: string | null;
  reference_month: string;
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
    incomplete?: boolean; // hit history cap → resultado pode estar truncado
  };
}

// Cap em rows do legislation_history por mês. Em meses normais (poucas
// dezenas de mudanças) nunca atinge; em meses com data import em bulk
// (~10k rows) limita pra evitar OOM no worker Deno.
const MAX_HISTORY_ROWS = 2000;
// Quantos diffs no máximo enviamos pra IA. Cada um precisa carregar
// old_values + new_values (~2KB cada). Limita custo Perplexity e evita
// payload gigante.
const MAX_DIFFS_FOR_AI = 30;

const SONAR_INPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_OUTPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_SEARCH_USD = 5 / 1000;

async function logUsage(
  call: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null,
  latencyMs: number,
  success: boolean,
  errorText?: string,
) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
  const costUsd =
    promptTokens * SONAR_INPUT_USD_PER_TOKEN +
    completionTokens * SONAR_OUTPUT_USD_PER_TOKEN +
    (success ? SONAR_SEARCH_USD : 0);
  try {
    await fetch(`${url}/rest/v1/ai_usage_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        function_name: "compliance-update-letter-generator",
        feature_tag: `compliance-update-letter:${call}`,
        model: "sonar",
        prompt_tokens: promptTokens || null,
        completion_tokens: completionTokens || null,
        total_tokens: totalTokens || null,
        estimated_cost_usd: costUsd,
        latency_ms: latencyMs,
        success,
        error_text: errorText ?? null,
      }),
    });
  } catch (err) {
    console.warn("[compliance-update-letter] log usage failed:", err);
  }
}

function monthBoundsUTC(monthStart: Date): { startISO: string; endISO: string } {
  const startISO = monthStart.toISOString();
  const next = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));
  return { startISO, endISO: next.toISOString() };
}

function originLabel(row: LegislationRow): string {
  switch ((row.jurisdiction ?? "").toLowerCase()) {
    case "federal": return "Federal";
    case "estadual": return row.state ? `Estadual,${row.state}` : "Estadual";
    case "municipal": return row.municipality ? `Municipal,${row.municipality}` : "Municipal";
    case "nbr": return "NBR";
    case "internacional": return "Internacional";
    default: return row.jurisdiction || "—";
  }
}

function buildCode(row: LegislationRow): string {
  const shortId = row.id.slice(0, 8);
  const head = [row.norm_type, row.norm_number].filter(Boolean).join(" nº ");
  return head ? `#${shortId} · ${head}` : `#${shortId}`;
}

function serialize(
  row: LegislationRow,
  alteradorName: string | null,
  changedAt: string | null,
  observation?: string,
): SerializedLine {
  return {
    legislation_id: row.id,
    code: buildCode(row),
    title: row.title,
    summary: row.summary ?? "",
    applicability: row.overall_applicability ?? "pending",
    // Sistemas: tenta theme_id (mas só aceita match real, não fallback "6F5");
    // cai pros applicability_tags (canal usado pelo radar). Dedup pra não
    // repetir sigla.
    systems: (() => {
      const out = new Set<string>();
      const direct = siglaForThemeOrNull(row.theme_id);
      if (direct) out.add(direct);
      const tags = Array.isArray(row.applicability_tags) ? row.applicability_tags : [];
      for (const t of tags) {
        const s = siglaForThemeOrNull(t);
        if (s) out.add(s);
      }
      return Array.from(out);
    })(),
    origin: originLabel(row),
    observation: observation ?? row.observations ?? row.general_notes ?? "",
    alterador: alteradorName ?? "",
    changed_at: changedAt,
  };
}

async function callPerplexitySummary(
  apiKey: string,
  unitName: string,
  monthLabel: string,
  counts: Record<string, number>,
  highlights: string[],
): Promise<{ text: string; failed: boolean; error?: string }> {
  const startedAt = Date.now();
  // IMPORTANTE: o monthLabel passa duas vezes (no system + user) e o prompt
  // é EXPLÍCITO de que esse é o mês de referência IMUTÁVEL. Sem isso, a
  // Perplexity às vezes substitui pelo mês corrente (a carta de abril
  // chegou com "maio de 2026" no sumário porque o modelo confundiu com o
  // dia da chamada).
  const userPrompt = `Unidade: ${unitName}
Mês de referência (USE EXATAMENTE ESTE LABEL): ${monthLabel}
Quantidades por categoria — Publicadas: ${counts.published}, Alteradas: ${counts.modified}, Revogadas: ${counts.revoked}, Excluídas: ${counts.excluded}, Incluídas por revisão: ${counts.included_by_review}.
Destaques (até 5 normas com aplicabilidade real):
${highlights.map((h) => `- ${h}`).join("\n") || "- (sem destaques)"}

Escreva um único parágrafo curto (4–6 frases) abrindo a Carta de Atualização Mensal de Compliance dessa unidade. Tom técnico, direto, sem jargão de marketing. Cite o volume total de normas afetadas e mencione, no máximo, dois destaques pelo nome. Sempre que mencionar o mês, use exatamente "${monthLabel}" — nunca substitua por outro mês (mesmo que seja o atual).`;

  try {
    const resp = await callPerplexityWithRetry(apiKey, {
      model: "sonar",
      messages: [
        { role: "system", content: `Você redige sumários executivos técnicos para relatórios mensais de compliance ambiental e legal de empresas brasileiras. Português do Brasil, tom objetivo, sem marketing. O mês de referência da carta atual é "${monthLabel}" — use EXATAMENTE esse label sempre que precisar nomear o mês, nunca substitua por outro mês ou pelo mês corrente.` },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "executive_summary",
          schema: {
            type: "object",
            properties: { summary: { type: "string" } },
            required: ["summary"],
          },
        },
      },
    });
    const latency = Date.now() - startedAt;
    if (!resp.ok) {
      const errText = await resp.text();
      await logUsage("summary", null, latency, false, `HTTP ${resp.status}: ${errText.slice(0, 300)}`);
      return { text: "", failed: true, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    await logUsage("summary", json.usage ?? null, latency, true);
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content) as { summary?: string };
      return { text: (parsed.summary ?? "").trim(), failed: false };
    } catch {
      return { text: "", failed: true, error: "parse" };
    }
  } catch (err) {
    const latency = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    await logUsage("summary", null, latency, false, message);
    return { text: "", failed: true, error: message };
  }
}

async function callPerplexityDiffs(
  apiKey: string,
  items: Array<{ legislation_id: string; title: string; old: unknown; new: unknown }>,
): Promise<{ map: Map<string, string>; failed: boolean; error?: string }> {
  if (items.length === 0) return { map: new Map(), failed: false };
  const startedAt = Date.now();
  const userPrompt = `Para cada item abaixo, descreva em UMA frase (≤30 palavras) a diferença material entre old_values e new_values. Foque em mudança de status, aplicabilidade, observações relevantes e datas. Se não houver mudança técnica relevante, retorne "Atualização cadastral sem mudança de obrigação."

${items.map((it, idx) => `[${idx}] ${it.title}\nOLD: ${JSON.stringify(it.old).slice(0, 600)}\nNEW: ${JSON.stringify(it.new).slice(0, 600)}`).join("\n\n")}

Devolva um array com a mesma ordem.`;

  try {
    const resp = await callPerplexityWithRetry(apiKey, {
      model: "sonar",
      messages: [
        { role: "system", content: "Você compara versões de uma legislação (old_values vs new_values em JSON) e descreve em uma frase curta o que mudou de fato para o operador de compliance. Português do Brasil." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diff_descriptions",
          schema: {
            type: "object",
            properties: { diffs: { type: "array", items: { type: "string" } } },
            required: ["diffs"],
          },
        },
      },
    });
    const latency = Date.now() - startedAt;
    if (!resp.ok) {
      const errText = await resp.text();
      await logUsage("diffs", null, latency, false, `HTTP ${resp.status}: ${errText.slice(0, 300)}`);
      return { map: new Map(), failed: true, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    await logUsage("diffs", json.usage ?? null, latency, true);
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content) as { diffs?: string[] };
      const arr = Array.isArray(parsed.diffs) ? parsed.diffs : [];
      const map = new Map<string, string>();
      items.forEach((it, idx) => {
        const text = (arr[idx] ?? "").trim();
        if (text) map.set(it.legislation_id, text);
      });
      return { map, failed: false };
    } catch {
      return { map: new Map(), failed: true, error: "parse" };
    }
  } catch (err) {
    const latency = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    await logUsage("diffs", null, latency, false, message);
    return { map: new Map(), failed: true, error: message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    return await handle(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[compliance-update-letter-generator] uncaught:", message, stack);
    return new Response(
      JSON.stringify({ error: message, stack: stack?.split("\n").slice(0, 5).join(" | ") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function handle(req: Request): Promise<Response> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(
      JSON.stringify({ error: "Supabase env vars missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!body?.branch_id || !body?.reference_month) {
    return new Response(
      JSON.stringify({ error: "branch_id e reference_month são obrigatórios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Truncamos qualquer data recebida para o primeiro dia do mês (UTC). A
  // tabela ainda valida com CHECK, mas garantimos antes do roundtrip.
  const refDate = new Date(body.reference_month);
  if (Number.isNaN(refDate.getTime())) {
    return new Response(
      JSON.stringify({ error: "reference_month inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const monthStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1, 0, 0, 0));
  const referenceMonthISO = monthStart.toISOString().slice(0, 10);
  const { startISO, endISO } = monthBoundsUTC(monthStart);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1a. Cron interno: header e bearer = service role pulam a checagem de
  //     usuário e identificam a empresa pelo branch. Esse caminho roda só
  //     a partir da edge function compliance-update-letter-cron.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cronInternalHeader = req.headers.get("x-cron-internal") === "1";
  const isCronInternal = !!body.cron_internal && cronInternalHeader && token === SERVICE_ROLE;

  let userId: string | null = null;
  let companyId: string | null = null;
  let branch: { id: string; company_id: string; name: string; state: string | null; city: string | null } | null = null;

  if (isCronInternal) {
    const { data: branchRow } = await supabase
      .from("branches")
      .select("id, company_id, name, state, city")
      .eq("id", body.branch_id)
      .maybeSingle();
    if (!branchRow) {
      return new Response(
        JSON.stringify({ error: "Unidade não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    branch = branchRow;
    companyId = branchRow.company_id;
  } else {
    // 1b. Caminho normal — JWT do usuário.
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authorization header ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResp?.user) {
      return new Response(
        JSON.stringify({ error: "JWT inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    userId = userResp.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "Usuário sem company_id no profile" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    companyId = profile.company_id;

    const { data: branchRow } = await supabase
      .from("branches")
      .select("id, company_id, name, state, city")
      .eq("id", body.branch_id)
      .maybeSingle();
    if (!branchRow || branchRow.company_id !== profile.company_id) {
      return new Response(
        JSON.stringify({ error: "Unidade não encontrada nesta empresa" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    branch = branchRow;
  }

  // Branch e companyId estão garantidos a partir daqui.
  const profileCompanyId = companyId!;
  const targetBranch = branch!;

  // 2. Lista de legislações vinculadas à unidade (carrega o universo onde
  //    aplicaremos os filtros de mudança no mês).
  const { data: linkedRows, error: linkedErr } = await supabase
    .from("legislation_unit_compliance")
    .select("legislation_id, created_at")
    .eq("branch_id", targetBranch.id)
    .eq("company_id", profileCompanyId);
  if (linkedErr) {
    return new Response(
      JSON.stringify({ error: linkedErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const linkedIds = new Set((linkedRows ?? []).map((r) => r.legislation_id));
  const includedByReviewIds = new Set(
    (linkedRows ?? [])
      .filter((r) => r.created_at && r.created_at >= startISO && r.created_at < endISO)
      .map((r) => r.legislation_id),
  );

  if (linkedIds.size === 0) {
    // Nenhuma legislação vinculada → carta vazia. Persiste mesmo assim para
    // dar feedback claro de "nada a reportar este mês".
    const empty: LetterContent = {
      unit_name: targetBranch.name,
      unit_city: targetBranch.city ?? null,
      unit_state: targetBranch.state ?? null,
      reference_month: referenceMonthISO,
      generated_at: new Date().toISOString(),
      executive_summary: "Nenhuma legislação vinculada à unidade no período. Nada a reportar.",
      sections: { published: [], modified: [], revoked: [], excluded: [], included_by_review: [] },
      ai_meta: { summary_failed: false, diffs_failed: false },
    };
    const { data: persisted, error: persistErr } = await supabase
      .from("compliance_update_letters")
      .upsert(
        {
          company_id: profileCompanyId,
          branch_id: targetBranch.id,
          reference_month: referenceMonthISO,
          content: empty,
          generated_by: userId,
        },
        { onConflict: "branch_id,reference_month" },
      )
      .select("id")
      .single();
    if (persistErr) {
      return new Response(
        JSON.stringify({ error: persistErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ id: persisted.id, content: empty }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 3. Histórico do mês — versão leve (sem old_values/new_values). Esses
  // campos JSONB são pesados (~2KB cada) e estouravam memória do worker
  // ao trazer 10k rows. Carregamos só o necessário pra categorizar; os
  // diffs JSONB são buscados sob demanda pra um subconjunto pequeno
  // (MAX_DIFFS_FOR_AI) já que só servem pro enriquecimento Perplexity.
  const { data: historyRows, error: histErr } = await supabase
    .from("legislation_history")
    .select("id, legislation_id, action, changed_at, changed_by")
    .eq("company_id", profileCompanyId)
    .gte("changed_at", startISO)
    .lt("changed_at", endISO)
    .order("changed_at", { ascending: false })
    .range(0, MAX_HISTORY_ROWS - 1);
  if (histErr) {
    return new Response(
      JSON.stringify({ error: `legislation_history query: ${histErr.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const incompleteHistory = (historyRows?.length ?? 0) >= MAX_HISTORY_ROWS;
  const history = ((historyRows ?? []) as HistoryRow[]).filter((h) => linkedIds.has(h.legislation_id));

  // 4. Snapshot atual das legislações tocadas + as incluídas por revisão.
  // Paginamos por chunks de 200 IDs em `.in(...)` pra não estourar URL do
  // PostgREST quando há centenas de mudanças no mês.
  const touchedIds = new Set<string>([
    ...history.map((h) => h.legislation_id),
    ...includedByReviewIds,
  ]);
  const touchedIdArr = Array.from(touchedIds);
  const legislations: LegislationRow[] = [];
  const ID_CHUNK = 200;
  for (let i = 0; i < touchedIdArr.length; i += ID_CHUNK) {
    const slice = touchedIdArr.slice(i, i + ID_CHUNK);
    const { data: legRows, error: legErr } = await supabase
      .from("legislations")
      .select("id, title, norm_type, norm_number, summary, observations, general_notes, jurisdiction, state, municipality, overall_applicability, overall_status, publication_date, is_active, theme_id, applicability_tags, revoked_by_legislation_id, revokes_legislation_id")
      .in("id", slice);
    if (legErr) {
      return new Response(
        JSON.stringify({ error: `legislations chunk ${i}: ${legErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (legRows) legislations.push(...(legRows as LegislationRow[]));
  }
  const legById = new Map<string, LegislationRow>(legislations.map((l) => [l.id, l]));

  // 5. Resolve nomes dos alteradores (changed_by → profiles.full_name).
  const changerIds = Array.from(new Set(history.map((h) => h.changed_by).filter((v): v is string => !!v)));
  let nameById = new Map<string, string>();
  if (changerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", changerIds);
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));
  }

  // 6. Particiona o histórico em buckets. Mantém só o evento mais recente
  //    por legislação dentro de cada bucket — repetidos no mês viram ruído.
  //
  //    KNOWN BUG (workaround): o trigger `legislation_history_trigger`
  //    grava DUAS rows ao INSERT em `legislations` — uma `action='created'`
  //    e outra `action='updated'` com o mesmo timestamp microsecond. Causa
  //    raiz não confirmada — provavelmente o BEFORE trigger
  //    `trigger_calculate_legislation_alert` (que muta `NEW.has_alert`) faz
  //    o engine repassar como UPDATE em algum cenário. Sem MCP/psql a mão
  //    não dá pra investigar via `pg_stat_statements`.
  //
  //    Workaround: se uma legislação tem 'created' no mês, ignoramos os
  //    'updated' do mesmo mês — created tem precedência. Resolve o caso
  //    de carta mostrando a mesma norma duplicada em "Publicadas" e
  //    "Alteradas". Remover este filter quando o trigger for fixado.
  const createdLegIds = new Set<string>();
  for (const h of history) if (h.action === "created") createdLegIds.add(h.legislation_id);
  const latestByActionAndId = new Map<string, HistoryRow>();
  for (const h of history) {
    if (h.action === "updated" && createdLegIds.has(h.legislation_id)) continue;
    const key = `${h.action}::${h.legislation_id}`;
    const prev = latestByActionAndId.get(key);
    if (!prev || (h.changed_at && (!prev.changed_at || h.changed_at > prev.changed_at))) {
      latestByActionAndId.set(key, h);
    }
  }
  const dedupedHistory = Array.from(latestByActionAndId.values());

  const published: SerializedLine[] = [];
  const modified: SerializedLine[] = [];
  const revoked: SerializedLine[] = [];
  const excluded: SerializedLine[] = [];

  // Diffs JSONB são buscados em segunda etapa (apenas pros top-N que vão
  // pra IA). Aqui só anotamos quais history ids vão precisar.
  const modifiedHistoryIds: string[] = [];
  // Para detectar excluded (action=status_changed com is_active=false)
  // precisamos do new_values dessas linhas — buscamos depois também.
  const statusChangedHistoryIds: string[] = [];

  for (const h of dedupedHistory) {
    const row = legById.get(h.legislation_id);
    if (!row) continue;
    const alterador = h.changed_by ? (nameById.get(h.changed_by) ?? "") : "";
    const line = serialize(row, alterador, h.changed_at);
    switch (h.action) {
      case "created":
        published.push(line);
        break;
      case "updated":
        modified.push(line);
        modifiedHistoryIds.push(h.id);
        break;
      case "revoked":
        revoked.push(line);
        break;
      case "status_changed":
        statusChangedHistoryIds.push(h.id);
        // Decisão (excluded vs modified) acontece após carregar new_values
        // — por ora não adicionamos a nenhum bucket. Será resolvido abaixo.
        break;
      default:
        modified.push(line);
    }
  }

  // Carrega JSONB pesado só pros ids que importam, em volume controlado.
  const idsForJsonb = [
    ...statusChangedHistoryIds,
    ...modifiedHistoryIds.slice(0, MAX_DIFFS_FOR_AI),
  ];
  const diffPayload: Array<{ legislation_id: string; title: string; old: unknown; new: unknown }> = [];
  if (idsForJsonb.length > 0) {
    const { data: diffRows } = await supabase
      .from("legislation_history")
      .select("id, legislation_id, action, old_values, new_values, changed_at, changed_by")
      .in("id", idsForJsonb);
    const diffById = new Map<string, HistoryDiffRow>(
      ((diffRows ?? []) as HistoryDiffRow[]).map((r) => [r.id, r] as const),
    );

    // Resolve status_changed agora que temos new_values.
    for (const histId of statusChangedHistoryIds) {
      const h = diffById.get(histId);
      if (!h) continue;
      const row = legById.get(h.legislation_id);
      if (!row) continue;
      const alterador = h.changed_by ? (nameById.get(h.changed_by) ?? "") : "";
      const line = serialize(row, alterador, h.changed_at);
      const newActive = (h.new_values as Record<string, unknown> | null)?.["is_active"];
      if (newActive === false) {
        excluded.push(line);
      } else {
        modified.push(line);
        diffPayload.push({
          legislation_id: row.id,
          title: row.title,
          old: h.old_values,
          new: h.new_values,
        });
      }
    }

    // Diff payload pros 'updated' top-N.
    for (const histId of modifiedHistoryIds.slice(0, MAX_DIFFS_FOR_AI)) {
      const h = diffById.get(histId);
      if (!h) continue;
      const row = legById.get(h.legislation_id);
      if (!row) continue;
      diffPayload.push({
        legislation_id: row.id,
        title: row.title,
        old: h.old_values,
        new: h.new_values,
      });
    }
  }

  const includedByReview: SerializedLine[] = [];
  for (const id of includedByReviewIds) {
    const row = legById.get(id);
    if (!row) continue;
    // Se a legislação também aparece como 'created' no mesmo mês, ela já
    // está em "published" — não duplicamos.
    if (published.some((p) => p.legislation_id === id)) continue;
    includedByReview.push(serialize(row, "", null));
  }

  const counts = {
    published: published.length,
    modified: modified.length,
    revoked: revoked.length,
    excluded: excluded.length,
    included_by_review: includedByReview.length,
  };

  // 7. Enriquecimento IA — só faz sentido se há conteúdo. Sem chave, segue
  //    sem enriquecer (ai_meta.failed=true sinaliza para a UI).
  let executiveSummary = "";
  const aiMeta: LetterContent["ai_meta"] = {
    summary_failed: false,
    diffs_failed: false,
    incomplete: incompleteHistory || undefined,
  };
  const totalChanges =
    counts.published + counts.modified + counts.revoked + counts.excluded + counts.included_by_review;

  // Formatação manual — Deno Deploy tem ICU enxuto e "pt-BR" + month:"long"
  // pode retornar inglês ou cair em erro silencioso dependendo da build.
  const PT_MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const monthLabel = `${PT_MONTHS[monthStart.getUTCMonth()]} de ${monthStart.getUTCFullYear()}`;

  if (totalChanges > 0 && PERPLEXITY_API_KEY) {
    const highlights = [...published, ...modified, ...includedByReview]
      .filter((l) => l.applicability === "real")
      .slice(0, 5)
      .map((l) => `${l.code} — ${l.title}`);

    const summaryRes = await callPerplexitySummary(
      PERPLEXITY_API_KEY,
      targetBranch.name,
      monthLabel,
      counts,
      highlights,
    );
    executiveSummary = summaryRes.text;
    aiMeta.summary_failed = summaryRes.failed;
    if (summaryRes.error) aiMeta.error = summaryRes.error;

    if (diffPayload.length > 0) {
      const diffRes = await callPerplexityDiffs(PERPLEXITY_API_KEY, diffPayload);
      aiMeta.diffs_failed = diffRes.failed;
      if (diffRes.error && !aiMeta.error) aiMeta.error = diffRes.error;
      if (diffRes.map.size > 0) {
        const apply = (lines: SerializedLine[]) => {
          for (const ln of lines) {
            const diff = diffRes.map.get(ln.legislation_id);
            if (diff) ln.observation = diff;
          }
        };
        apply(modified);
      }
    }
  } else if (totalChanges > 0 && !PERPLEXITY_API_KEY) {
    aiMeta.summary_failed = true;
    aiMeta.diffs_failed = diffPayload.length > 0;
    aiMeta.error = "PERPLEXITY_API_KEY não configurada";
  } else {
    executiveSummary = `Nenhuma mudança normativa registrada para a unidade ${targetBranch.name} em ${monthLabel}.`;
  }

  const content: LetterContent = {
    unit_name: targetBranch.name,
    unit_city: targetBranch.city ?? null,
    unit_state: targetBranch.state ?? null,
    reference_month: referenceMonthISO,
    generated_at: new Date().toISOString(),
    executive_summary: executiveSummary,
    sections: {
      published,
      modified,
      revoked,
      excluded,
      included_by_review: includedByReview,
    },
    ai_meta: aiMeta,
  };

  const { data: persisted, error: persistErr } = await supabase
    .from("compliance_update_letters")
    .upsert(
      {
        company_id: profileCompanyId,
        branch_id: targetBranch.id,
        reference_month: referenceMonthISO,
        content,
        generated_by: userId,
      },
      { onConflict: "branch_id,reference_month" },
    )
    .select("id")
    .single();
  if (persistErr) {
    return new Response(
      JSON.stringify({ error: persistErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ id: persisted.id, content }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
