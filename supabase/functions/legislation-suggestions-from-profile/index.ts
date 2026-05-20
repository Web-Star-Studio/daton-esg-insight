// Sugestões de Legislação a partir do Perfil de Compliance.
//
// Cruza `legislation_compliance_profiles.generated_tags` × `legislations.applicability_tags`
// para produzir uma lista de candidatos a popular a LIRA da unidade. Camada
// determinística usa overlap de array PG (índice GIN já existente). Camada
// opcional de IA chama Perplexity Sonar para sugerir normas que podem não
// estar no catálogo ainda — mesmo padrão do `laia-legislation-suggester`.
//
// Job em background: o disparo cria 1 row em `legislation_suggestion_runs`
// (status='running'), o trabalho roda via `EdgeRuntime.waitUntil` e a row
// é atualizada no fim (completed/failed). A função responde 202 com o
// `run_id` na hora — a UI acompanha o resultado pela tabela (polling +
// realtime). O aceite das sugestões vira upsert em
// `legislation_unit_compliance` (rota separada).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";
import { runAgent, type AgentTool } from "../_shared/agent-runtime.ts";
import { extractFirstJsonObject } from "../_shared/json-utils.ts";

// `EdgeRuntime` existe no runtime Supabase Deno mas não no tipo padrão.
// Tipamos local pra não depender de @ts-ignore. Em ambiente local (worker
// Deno de teste) é undefined — caímos pra `await` direto.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

interface RequestBody {
  branch_id: string;
  expand_ai?: boolean; // força camada IA mesmo quando matched > limite
  cron_internal?: boolean; // chamada server-to-server — pula JWT (admin/test)
}

interface MatchedSuggestion {
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

interface DiscoveredSuggestion {
  reference: string;
  url: string | null;
  summary: string;
  jurisdiction_hint: string;
  applicability_hint: "real" | "potential";
}

interface BranchInfo {
  id: string;
  company_id: string;
  name: string;
  state: string | null;
  city: string | null;
}

interface ComputeResult {
  matched: MatchedSuggestion[];
  discovered: DiscoveredSuggestion[];
  ai_used: boolean;
  ai_failed: boolean;
  ai_error?: string;
}

// Limite de matched abaixo do qual auto-disparamos a camada IA. Mantido
// alto pra cobrir o caso "novo cliente, catálogo curto"; pra clientes
// como o GABARDO (centenas de matches) a IA só roda sob demanda.
const AUTO_AI_THRESHOLD = 20;

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
        function_name: "legislation-suggestions-from-profile",
        feature_tag: `compliance-suggestions:${call}`,
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
    console.warn("[legislation-suggestions] log usage failed:", err);
  }
}

function originLabel(jurisdiction: string, state: string | null, municipality: string | null): string {
  switch ((jurisdiction ?? "").toLowerCase()) {
    case "federal": return "Federal";
    case "estadual": return state ? `Estadual,${state}` : "Estadual";
    case "municipal": return municipality ? `Municipal,${municipality}` : "Municipal";
    case "nbr": return "NBR";
    case "internacional": return "Internacional";
    default: return jurisdiction || "—";
  }
}

function intersect<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

// ---------- agentic discovery ----------

// Zod schema da sugestão final — AI SDK valida automaticamente.
const suggestionZ = z.object({
  reference: z.string(),
  url: z.string().nullable(),
  summary: z.string(),
  jurisdiction_hint: z.enum(["federal", "estadual", "municipal", "nbr", "internacional"]),
  applicability_hint: z.enum(["real", "potential"]),
});
type SuggestionZ = z.infer<typeof suggestionZ>;

function buildSearchPerplexityTool(apiKey: string): AgentTool {
  return {
    name: "search_perplexity",
    description:
      "Busca normas brasileiras vigentes via Perplexity Sonar-pro com web search. Use UMA query por tema/agência. Útil pra cobrir gaps que o overlap SQL determinístico não pegou.",
    parameters: z.object({
      query: z.string().describe(
        "Query natural em PT-BR. Ex: 'normas LGPD ANPD compliance dados pessoais transportadoras' ou 'NRs MTE saúde do trabalhador motoristas profissionais'.",
      ),
    }),
    execute: async ({ query }) => {
      if (!query.trim()) return { error: "query obrigatória" };
      const userPrompt = `Liste até 6 normas brasileiras vigentes sobre: ${query}.\n\nPara cada norma: reference (nome curto, ex.: "Resolução CONAMA nº 357/2005"), url canônica HTTPS (DOU, planalto, agência), summary técnico em 1 frase, jurisdiction_hint (federal|estadual|municipal|nbr|internacional), applicability_hint (real|potential).\n\nFORMATO DE SAÍDA: JSON {"items":[...]}, sem markdown, sem texto antes ou depois. Sem URL canônica → omita o item.`;
      try {
        const resp = await callPerplexityWithRetry(apiKey, {
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "Você é analista jurídico brasileiro especializado em compliance ambiental, trabalhista e operacional. Use busca web pra normas oficiais. Retorne APENAS JSON {\"items\":[...]}.",
            },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        });
        if (!resp.ok) return { error: `HTTP ${resp.status}`, items: [] };
        const json = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw = json.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(extractFirstJsonObject(raw)) as { items?: unknown[] };
        return { items: Array.isArray(parsed.items) ? parsed.items : [] };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err), items: [] };
      }
    },
  };
}

function buildQueryExistingTool(supabase: SupabaseClient, branchId: string): AgentTool {
  return {
    name: "query_existing_legislations",
    description:
      "Lista normas já vinculadas à unidade. Use pra evitar sugerir duplicata. branch_id é fixo no contexto da run (passe o mesmo do user message).",
    parameters: z.object({
      branch_id: z.string().describe("UUID da branch (placeholder — closure usa o real)."),
    }),
    execute: async () => {
      const { data: linkedRows } = await supabase
        .from("legislation_unit_compliance")
        .select("legislations(norm_type, norm_number, title)")
        .eq("branch_id", branchId);
      const items = ((linkedRows ?? []) as Array<{ legislations: { norm_type: string | null; norm_number: string | null; title: string | null } | null }>)
        .map((r) => {
          const l = r.legislations;
          if (!l) return null;
          return { norm_type: l.norm_type, norm_number: l.norm_number, title: l.title };
        })
        .filter(Boolean);
      return { count: items.length, items: items.slice(0, 80) };
    },
  };
}

function buildInspectComplianceResponseTool(responses: Record<string, unknown>): AgentTool {
  return {
    name: "inspect_compliance_response",
    description:
      "Lê uma resposta específica do questionário de compliance da unidade. Use pra contextualizar antes de buscar (ex.: ver atividades em texto livre, equipamentos específicos, escopo de transporte). Question IDs típicos: 'inst.q4', 'inst.q5', 'TRANSPORTE.q3', 'RES.q2', etc. Sem o ID exato, passe 'list' pra ver os IDs disponíveis.",
    parameters: z.object({
      question_id: z.string().describe(
        "ID exato da pergunta (ex.: 'inst.q4'). Se não souber, passe 'list' pra ver todos os IDs disponíveis.",
      ),
    }),
    execute: async ({ question_id }) => {
      const q = question_id.trim();
      if (q === "list" || !q) {
        const keys = Object.keys(responses).slice(0, 50);
        return { available_question_ids: keys, total: Object.keys(responses).length };
      }
      const value = responses[q];
      if (value === undefined) {
        const partial = Object.keys(responses)
          .filter((k) => k.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 10);
        return { found: false, similar_keys: partial };
      }
      return { found: true, question_id: q, value };
    },
  };
}

// Tool `fetch_url` — permite o agente VALIDAR URLs antes de incluí-las
// no finalize. Sem isso, Sonar-pro alucina URLs plausíveis (path inventado
// no gov.br, etc.). HEAD com timeout 6s — 405 cai pra GET.
const fetchUrlTool: AgentTool = {
  name: "fetch_url",
  description:
    "Faz um HEAD request pra validar se uma URL existe. Use ANTES de incluir uma URL no finalize_suggestions. Retorna { status, valid } — `valid=true` se 2xx/3xx OU se servidor flap (5xx/timeout); `valid=false` se 404/410.",
  parameters: z.object({
    url: z.string().url().describe("URL HTTPS pra validar"),
  }),
  execute: async ({ url }) => {
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      return { status: 0, valid: false, reason: "scheme inválido" };
    }
    try {
      let r = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });
      if (r.status === 405 || r.status === 501) {
        r = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(6000),
          redirect: "follow",
        });
      }
      const valid = r.status < 400 || r.status >= 500; // 4xx = morto; 5xx = flap
      return { status: r.status, valid };
    } catch (err) {
      // Timeout/DNS/conn reset — gov.br é flaky, melhor assumir válido.
      return { status: 0, valid: true, reason: "timeout/network (gov.br flap)" };
    }
  },
};

const finalizeSuggestionsTool: AgentTool = {
  name: "finalize_suggestions",
  description:
    "Encerra o loop e devolve a lista final de sugestões. Chame UMA vez como ÚLTIMA tool. Aceita lista vazia se nenhuma busca foi conclusiva.",
  parameters: z.object({
    suggestions: z.array(suggestionZ).describe(
      "Lista final (3-8 itens recomendados; até 12 max).",
    ),
  }),
  execute: async ({ suggestions }) => {
    return { saved: true, count: suggestions.length };
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    return await handle(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[legislation-suggestions-from-profile] uncaught:", message, stack);
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
  if (!body?.branch_id) {
    return new Response(
      JSON.stringify({ error: "branch_id é obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cronInternalHeader = req.headers.get("x-cron-internal") === "1";
  const isCronInternal = !!body.cron_internal && cronInternalHeader && token === SERVICE_ROLE;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authorization header ausente" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

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
    const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResp?.user) {
      return new Response(
        JSON.stringify({ error: "JWT inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    userId = userResp.user.id;
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profileRow?.company_id) {
      return new Response(
        JSON.stringify({ error: "Usuário sem company_id no profile" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    companyId = profileRow.company_id;
    const { data: branchRow } = await supabase
      .from("branches")
      .select("id, company_id, name, state, city")
      .eq("id", body.branch_id)
      .maybeSingle();
    if (!branchRow || branchRow.company_id !== companyId) {
      return new Response(
        JSON.stringify({ error: "Unidade não encontrada nesta empresa" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    branch = branchRow;
  }
  // Após if/else, branch e companyId são garantidos. O `!` silencia o
  // narrow-type — runtime já está coberto pelos checks acima.
  const targetBranch = branch!;
  const targetCompanyId = companyId!;

  // Profile da unidade. Sem tags → questionário não concluído: erro
  // semântico para a UI, sem criar run (não há o que registrar).
  const { data: profile } = await supabase
    .from("legislation_compliance_profiles")
    .select("generated_tags, responses, completed_at")
    .eq("branch_id", targetBranch.id)
    .maybeSingle();
  const tags = (profile?.generated_tags ?? []) as string[];
  if (tags.length === 0) {
    return new Response(
      JSON.stringify({ status: "questionnaire-not-completed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const responses = (profile?.responses ?? {}) as Record<string, unknown>;

  // Registra a run ANTES de computar — assim, mesmo que a compute falhe,
  // existe uma row de auditoria (status vira 'failed' no catch).
  const { data: runRow, error: runErr } = await supabase
    .from("legislation_suggestion_runs")
    .insert({
      company_id: targetCompanyId,
      branch_id: targetBranch.id,
      triggered_by: userId,
      status: "running",
      expand_ai: body.expand_ai === true,
      tag_count: tags.length,
    })
    .select("id")
    .single();
  if (runErr || !runRow) {
    console.error("[suggestions] falha ao criar run:", runErr);
    return new Response(
      JSON.stringify({ error: `não foi possível registrar a run: ${runErr?.message ?? "unknown"}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const runId = runRow.id as string;

  // Compute em background: a função responde 202 imediatamente e o agente
  // segue rodando via EdgeRuntime.waitUntil. Mesmo se o cliente fechar a
  // aba, a run termina e a row é atualizada (completed/failed).
  const task = (async () => {
    const startedMs = Date.now();
    try {
      const result = await computeSuggestions({
        supabase,
        branch: targetBranch,
        companyId: targetCompanyId,
        userId,
        tags,
        responses,
        expandAi: body.expand_ai === true,
        perplexityApiKey: PERPLEXITY_API_KEY,
      });
      // supabase-js não lança em erro de update — checamos `error` à mão.
      // Se gravar o resultado falhar, jogamos pro catch pra ao menos
      // marcar a run como 'failed' (senão fica 'running' pra sempre e a
      // UI faz polling infinito).
      const { error: updErr } = await supabase
        .from("legislation_suggestion_runs")
        .update({
          status: "completed",
          matched: result.matched,
          discovered: result.discovered,
          matched_count: result.matched.length,
          discovered_count: result.discovered.length,
          ai_used: result.ai_used,
          ai_failed: result.ai_failed,
          ai_error: result.ai_error ?? null,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startedMs,
        })
        .eq("id", runId);
      if (updErr) {
        throw new Error(`falha ao gravar resultado da run: ${updErr.message}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[suggestions] run falhou:", runId, message);
      const { error: failErr } = await supabase
        .from("legislation_suggestion_runs")
        .update({
          status: "failed",
          error_text: message,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startedMs,
        })
        .eq("id", runId);
      if (failErr) {
        console.error("[suggestions] não conseguiu marcar run como failed:", runId, failErr.message);
      }
    }
  })();

  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(task);
  } else {
    // Ambiente sem EdgeRuntime (worker local/teste): roda síncrono.
    await task;
  }

  return new Response(
    JSON.stringify({ run_id: runId, status: "running" }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

interface ComputeArgs {
  supabase: SupabaseClient;
  branch: BranchInfo;
  companyId: string;
  userId: string | null;
  tags: string[];
  responses: Record<string, unknown>;
  expandAi: boolean;
  perplexityApiKey: string | undefined;
}

// Núcleo de cálculo das sugestões: camada determinística (overlap SQL de
// tags + filtro geográfico) + camada IA opcional (agente Perplexity).
// Lança exceção em erro de query — o caller converte em status='failed'.
async function computeSuggestions(args: ComputeArgs): Promise<ComputeResult> {
  const {
    supabase,
    branch: targetBranch,
    companyId: targetCompanyId,
    userId,
    tags,
    responses,
    expandAi,
    perplexityApiKey: PERPLEXITY_API_KEY,
  } = args;

  // Camada determinística: overlap de tags + filtro geográfico.
  // `applicability_tags` é JSONB (array de strings). O operador `&&` não
  // existe pra JSONB, então `.overlaps()` quebra; usamos OR de `@>` (cs)
  // por tag — equivalente lógico, e o índice GIN cobre cada `@>`.
  // Tags do questionário são snake_case, então não precisam escape extra.
  // Limitamos a 64 tags por chamada pra não estourar limite de URL do
  // PostgREST com OR-filter; tags excedentes não casam matches mas não
  // travam a função.
  const safeTags = tags.filter((t) => /^[a-z0-9_]+$/i.test(t)).slice(0, 64);
  const orFilter = safeTags
    .map((t) => `applicability_tags.cs.["${t}"]`)
    .join(",");
  let legQuery = supabase
    .from("legislations")
    .select(
      "id, title, summary, jurisdiction, state, municipality, overall_applicability, theme_id, applicability_tags, norm_type, norm_number",
    )
    .eq("company_id", targetCompanyId)
    .eq("is_active", true);
  if (orFilter.length > 0) {
    legQuery = legQuery.or(orFilter);
  } else {
    // Sem tags válidas → nenhum match possível.
    legQuery = legQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }
  const { data: legRows, error: legErr } = await legQuery;
  if (legErr) {
    console.error("[suggestions] legislations query failed:", legErr);
    throw new Error(`legislations query: ${legErr.message}`);
  }

  // Já vinculadas a esta branch — saem da sugestão.
  const { data: linkedRows } = await supabase
    .from("legislation_unit_compliance")
    .select("legislation_id")
    .eq("branch_id", targetBranch.id);
  const linkedIds = new Set((linkedRows ?? []).map((r) => r.legislation_id));

  const branchState = (targetBranch.state ?? "").toUpperCase();
  const branchCity = (targetBranch.city ?? "").trim().toLowerCase();

  const matched: MatchedSuggestion[] = [];
  for (const row of legRows ?? []) {
    if (linkedIds.has(row.id)) continue;
    const j = (row.jurisdiction ?? "").toLowerCase();
    if (j === "estadual") {
      if (!row.state || row.state.toUpperCase() !== branchState) continue;
    } else if (j === "municipal") {
      const c = (row.municipality ?? "").trim().toLowerCase();
      if (!c || c !== branchCity) continue;
    }
    const legTags = Array.isArray(row.applicability_tags) ? row.applicability_tags as string[] : [];
    const matchedTags = intersect(legTags, tags);
    if (matchedTags.length === 0) continue; // defesa contra falso positivo do .overlaps
    matched.push({
      legislation_id: row.id,
      title: row.title,
      summary: row.summary,
      jurisdiction: row.jurisdiction,
      origin: originLabel(row.jurisdiction, row.state, row.municipality),
      state: row.state,
      municipality: row.municipality,
      default_applicability: row.overall_applicability ?? "potential",
      matched_tags: matchedTags,
      score: matchedTags.length,
      theme_id: row.theme_id,
      norm_type: row.norm_type,
      norm_number: row.norm_number,
    });
  }

  matched.sort((a, b) => {
    const aReal = a.default_applicability === "real" ? 1 : 0;
    const bReal = b.default_applicability === "real" ? 1 : 0;
    if (aReal !== bReal) return bReal - aReal;
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  // Camada IA: dispara se cliente pediu OU se matched é raso.
  const shouldRunAi = (expandAi === true || matched.length < AUTO_AI_THRESHOLD) && !!PERPLEXITY_API_KEY;
  let discovered: DiscoveredSuggestion[] = [];
  let aiFailed = false;
  let aiError: string | undefined;

  if (shouldRunAi) {
    // Camada determinística cobre o caso massivo (overlap SQL com tags).
    // O agente entra pra preencher gaps: temas com poucos matches no SQL,
    // normas que talvez não estejam no catálogo ainda, etc. inspect_*
    // permite ler responses específicos do questionário pra contextualizar.
    const tools: AgentTool[] = [
      buildSearchPerplexityTool(PERPLEXITY_API_KEY!),
      fetchUrlTool,
      buildQueryExistingTool(supabase, targetBranch.id),
      buildInspectComplianceResponseTool(responses),
      finalizeSuggestionsTool,
    ];

    const matchedThemeIds = Array.from(
      new Set(matched.map((m) => m.theme_id).filter((v): v is string => !!v)),
    ).slice(0, 10);
    const weakAreasHint = tags.length > matched.length
      ? `Apenas ${matched.length} matches SQL pra ${tags.length} tags — provavelmente alguns temas estão sub-cobertos.`
      : `Catálogo já cobre bem (${matched.length} matches). Foque em normas marginais, novidades regulatórias ou temas pouco padronizados.`;

    const isLicensingInProgress = tags.includes("licenciamento_em_andamento");
    const inProgressBlock = isLicensingInProgress
      ? `
CONTEXTO ESPECIAL — LICENCIAMENTO EM ANDAMENTO:
A unidade está em PROCESSO de licenciamento (LP/LI/LO ainda não emitida).
ANTES de buscar, chame inspect_compliance_response em 'lic.q1_5' (protocolo),
'lic.q1_6' (órgão licenciador), 'lic.q1_7' (data protocolo), 'lic.q1_8' (fase).
Use o órgão e a fase pra montar queries específicas no search_perplexity:
  - condicionantes típicas da fase atual (LP/LI/LO)
  - prazos legais de manifestação do órgão e validade da fase atual
  - requisitos durante o trâmite (regras de operação provisória, TAC)
  - audiências públicas obrigatórias (se LP ainda não emitida)
  - monitoramento exigido na fase atual
EVITE sugerir requisitos pós-LO (ex: relatórios anuais de LO, taxa anual de
fiscalização ambiental atrelada à licença emitida) — a unidade ainda não
está nessa fase.
`
      : "";

    const systemPrompt = `Você é analista jurídico brasileiro. Sua missão é COMPLEMENTAR a camada determinística (overlap SQL de tags) com sugestões de normas que podem não estar no catálogo OU não casaram via tags.
${inProgressBlock}
PROCESSO E ORÇAMENTO (siga rigorosamente):
1. Comece chamando query_existing_legislations pra ver o catálogo atual da branch.
2. (Opcional) Use inspect_compliance_response pra ver respostas livres do questionário (ex.: 'inst.q4' descreve atividades em texto). Limite: 2 chamadas.
3. Faça NO MÁXIMO 3 search_perplexity, uma por tema/agência diferente. Mire em gaps (temas onde o SQL pegou pouco) ou áreas pouco-padronizadas (LGPD, NRs novas, regulações setoriais recentes).
4. **ANTES** de chamar finalize_suggestions, valide cada URL via fetch_url. Se valid=false (404/410), substitua a URL por null ou omita o item. Limite: até 6 fetch_url no total.
5. Chame finalize_suggestions com 3-8 itens (até 12 max). Pode ser chamado mais de uma vez — o ÚLTIMO finalize vence. Use isso pra fazer um "save-point" cedo (ex: depois de 1-2 buscas) e depois enriquecer se houver budget.

ORÇAMENTO TOTAL DO LOOP: 14 turnos. Você DEVE chamar finalize_suggestions antes do fim — mesmo que a lista esteja parcial. Se ficar com 3+ turnos restantes e ainda não finalizou pela primeira vez, FAÇA UM FINALIZE AGORA com o que tiver e depois siga refinando.

BUSCA: livre. Sonar-pro pode varrer qualquer fonte — DOU, planalto, agências, portais estaduais/municipais, mídia especializada, jusbrasil, legisweb, repercussão setorial. NÃO restrinja temas nem origens.

URL DA NORMA — DICAS de padrão (NÃO regra fechada):
Quando você tiver uma URL candidata, antes de incluir, use fetch_url pra confirmar. Estes padrões TENDEM a ser corretos quando aplicáveis:
- Leis/decretos federais: planalto.gov.br/ccivil_03/_atoYYYY-YYYY/YYYY/lei/lXXXXX.htm (ex: LGPD = .../2018/lei/l13709.htm)
- DOU: in.gov.br/web/dou/-/<slug>
- ANTT resoluções: anttlegis.antt.gov.br/... (atenção: gov.br/antt/legislacao/resolucoes dá 404, evite)
- NRs: gov.br/trabalho-e-emprego/.../normas-regulamentadoras (subpath de cada NR varia — sempre valide)

Qualquer URL HTTPS confiável é aceitável (legisweb, jusbrasil, sites de agências, mídia especializada) — desde que fetch_url confirme.
Quando você acha uma norma boa mas a URL parece duvidosa: prefira url: null (UI lida com isso) em vez de inventar.

REGRAS DURAS pra cada suggestion:
- url HTTPS qualquer fonte confiável, OU null se não conseguir validar.
- jurisdiction_hint: federal | estadual | municipal | nbr | internacional.
- applicability_hint='real' quando obrigatória/diretamente aplicável; 'potential' caso contrário.
- NÃO sugira normas óbvias (CF/88, CLT genérica). NÃO sugira normas que já apareceram em query_existing_legislations.

NUNCA termine sem chamar finalize_suggestions (mesmo com lista vazia).`;

    const userPrompt = `Branch: ${targetBranch.name} (${targetBranch.city ?? "—"}/${targetBranch.state ?? "—"}).
Branch ID (para query_existing_legislations): ${targetBranch.id}.
Setor: transporte rodoviário de cargas.
Temas-chave do questionário (top 30): ${tags.slice(0, 30).join(", ") || "(perfil sem tags)"}.
${matched.length} sugestões já vieram da camada determinística (catálogo × tags).
Temas já cobertos por essas matches: ${matchedThemeIds.join(", ") || "(nenhum theme_id)"}.

Diagnóstico: ${weakAreasHint}

Sua tarefa: descobrir 3-8 sugestões NOVAS focando em temas/agências que o SQL não cobriu bem. Use inspect_compliance_response pra contextualizar dúvidas específicas (ex.: que tipos de transporte a unidade faz, equipamentos críticos).`;

    try {
      const agentResult = await runAgent({
        agentName: "legislation-suggestions-from-profile",
        model: "google/gemini-2.5-pro",
        systemPrompt,
        userPrompt,
        tools,
        // Bump 8 → 14 (commit fix-suggestions-maxsteps): em 9/10 runs históricos
        // o agente batia o cap sem chamar finalize_suggestions. Workload típico
        // usa 1 query + 2 inspect + 3 search + 4-6 fetch_url + 1 finalize ≈ 11-13
        // tool calls, mais ~1 turno extra de "pensar" entre eles. Cap em 14 dá
        // folga sem aproximar do radar (16). Custo/run sobe ~$0,01.
        maxSteps: 14,
        companyId: targetCompanyId,
        branchId: targetBranch.id,
        triggeredBy: userId,
        supabase,
        inputForLog: {
          matched_count: matched.length,
          tag_count: tags.length,
          expand_ai: expandAi === true,
        },
      });

      const finalizeCalls = agentResult.toolCalls.filter((c) => c.name === "finalize_suggestions");
      const finalize = finalizeCalls[finalizeCalls.length - 1];
      if (!finalize) {
        aiFailed = true;
        aiError = agentResult.reachedMaxSteps
          ? "agent did not finalize within maxSteps"
          : "agent ended without finalize_suggestions call";
      } else {
        const items = ((finalize.input as { suggestions?: SuggestionZ[] } | undefined)?.suggestions ?? []) as unknown[];
        // Validação backend de URL removida (visto que gov.br é flaky e
        // descartava URLs intermitentes). Prevenção fica do lado do prompt
        // do agent — padrões canônicos + instrução pra usar fetch_url
        // antes do finalize.
        discovered = items
          .map((it) => {
            if (!it || typeof it !== "object") return null;
            const x = it as Record<string, unknown>;
            const reference = String(x.reference ?? "").trim();
            const summary = String(x.summary ?? "").trim();
            const jurisdiction = String(x.jurisdiction_hint ?? "").toLowerCase();
            const applicability = String(x.applicability_hint ?? "").toLowerCase();
            const urlRaw = typeof x.url === "string" ? x.url.trim() : "";
            const url = urlRaw.startsWith("http") ? urlRaw : null;
            if (!reference || !summary) return null;
            return {
              reference,
              url,
              summary,
              jurisdiction_hint: jurisdiction,
              applicability_hint: (applicability === "real" ? "real" : "potential") as "real" | "potential",
            } satisfies DiscoveredSuggestion;
          })
          .filter((v): v is DiscoveredSuggestion => v !== null);
      }
    } catch (err) {
      aiFailed = true;
      aiError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    matched,
    discovered,
    ai_used: shouldRunAi,
    ai_failed: aiFailed,
    ai_error: aiError,
  };
}
