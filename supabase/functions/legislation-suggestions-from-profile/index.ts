// Sugestões de Legislação a partir do Perfil de Compliance.
//
// Cruza `legislation_compliance_profiles.generated_tags` × `legislations.applicability_tags`
// para produzir uma lista de candidatos a popular a LIRA da unidade. Camada
// determinística usa overlap de array PG (índice GIN já existente). Camada
// opcional de IA chama Perplexity Sonar para sugerir normas que podem não
// estar no catálogo ainda — mesmo padrão do `laia-legislation-suggester`.
//
// Sem persistência: sugestões são compute-on-demand. O usuário aceita pela
// UI, e o aceite vira upsert em `legislation_unit_compliance` (rota separada).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";
import { runAgent, type AgentTool } from "../_shared/agent-runtime.ts";
import { extractFirstJsonObject } from "../_shared/json-utils.ts";

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

interface ResponseShape {
  matched: MatchedSuggestion[];
  discovered: DiscoveredSuggestion[];
  ai_used: boolean;
  ai_failed: boolean;
  ai_error?: string;
  branch: { id: string; name: string; state: string | null; city: string | null };
  profile: { tag_count: number };
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

  // Profile da unidade. Se vazio ou sem tags → erro semântico claro pra UI.
  const { data: profile } = await supabase
    .from("legislation_compliance_profiles")
    .select("generated_tags, responses, completed_at")
    .eq("branch_id", targetBranch.id)
    .maybeSingle();
  const tags = (profile?.generated_tags ?? []) as string[];
  if (tags.length === 0) {
    return new Response(
      JSON.stringify({
        matched: [],
        discovered: [],
        ai_used: false,
        ai_failed: false,
        branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
        profile: { tag_count: 0 },
        error: "questionnaire-not-completed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

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
    return new Response(
      JSON.stringify({ error: `legislations query: ${legErr.message}`, code: legErr.code }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
  const responses = (profile?.responses ?? {}) as Record<string, unknown>;

  const shouldRunAi = (body.expand_ai === true || matched.length < AUTO_AI_THRESHOLD) && !!PERPLEXITY_API_KEY;
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

    const systemPrompt = `Você é analista jurídico brasileiro. Sua missão é COMPLEMENTAR a camada determinística (overlap SQL de tags) com sugestões de normas que podem não estar no catálogo OU não casaram via tags.

PROCESSO E ORÇAMENTO (siga rigorosamente):
1. Comece chamando query_existing_legislations pra ver o catálogo atual da branch.
2. (Opcional) Use inspect_compliance_response pra ver respostas livres do questionário (ex.: 'inst.q4' descreve atividades em texto). Limite: 2 chamadas.
3. Faça NO MÁXIMO 3 search_perplexity, uma por tema/agência diferente. Mire em gaps (temas onde o SQL pegou pouco) ou áreas pouco-padronizadas (LGPD, NRs novas, regulações setoriais recentes).
4. Chame finalize_suggestions OBRIGATORIAMENTE como ÚLTIMA tool, com 3-8 itens (até 12 max).

ORÇAMENTO TOTAL DO LOOP: 8 turnos. Você DEVE chamar finalize_suggestions antes do fim. Se ficar com 2+ turnos restantes e ainda não finalizou, FINALIZE AGORA com o que tiver.

REGRAS DURAS pra cada suggestion:
- url HTTPS quando houver fonte oficial; null aceito quando você não conseguir confirmar a URL.
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
        maxSteps: 8,
        companyId: targetCompanyId,
        branchId: targetBranch.id,
        triggeredBy: userId,
        supabase,
        inputForLog: {
          matched_count: matched.length,
          tag_count: tags.length,
          expand_ai: body.expand_ai === true,
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

  const responseBody: ResponseShape = {
    matched,
    discovered,
    ai_used: shouldRunAi,
    ai_failed: aiFailed,
    ai_error: aiError,
    branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
    profile: { tag_count: tags.length },
  };

  return new Response(
    JSON.stringify(responseBody),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
