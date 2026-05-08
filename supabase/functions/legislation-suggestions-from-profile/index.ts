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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";

interface RequestBody {
  branch_id: string;
  expand_ai?: boolean; // força camada IA mesmo quando matched > limite
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

async function callPerplexityDiscovery(
  apiKey: string,
  ctx: {
    sector: string;
    state: string | null;
    city: string | null;
    activities: string;
    topTags: string[];
  },
): Promise<{ items: DiscoveredSuggestion[]; failed: boolean; error?: string }> {
  const startedAt = Date.now();
  const userPrompt = `Sugira até 5 normas brasileiras vigentes aplicáveis à unidade abaixo. Considere overlap de obrigações federais, estaduais (se houver UF) e municipais. Não repita normas óbvias do catálogo padrão (CF/88, CLT, lei do meio ambiente).

Setor: ${ctx.sector || "transporte rodoviário de cargas"}
UF: ${ctx.state ?? "—"}
Cidade: ${ctx.city ?? "—"}
Atividades/Características: ${ctx.activities || "—"}
Temas-chave (tags do questionário): ${ctx.topTags.slice(0, 12).join(", ")}

Para cada norma: reference (nome curto e padrão), url canônica do texto oficial (ou null se não confirmar via busca), summary técnico em 1 frase, jurisdiction_hint (federal | estadual | municipal | nbr | internacional), applicability_hint (real | potential).`;

  try {
    const resp = await callPerplexityWithRetry(apiKey, {
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "Você é analista de legislação brasileira focado em compliance ambiental, trabalhista e operacional. Português do Brasil, tom técnico, sem marketing. Retorne apenas JSON.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "discovered_legislation",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reference: { type: "string" },
                    url: { type: ["string", "null"] },
                    summary: { type: "string" },
                    jurisdiction_hint: { type: "string" },
                    applicability_hint: { type: "string" },
                  },
                  required: ["reference", "summary", "jurisdiction_hint", "applicability_hint"],
                },
              },
            },
            required: ["items"],
          },
        },
      },
    });
    const latency = Date.now() - startedAt;
    if (!resp.ok) {
      const errText = await resp.text();
      await logUsage("discovery", null, latency, false, `HTTP ${resp.status}: ${errText.slice(0, 300)}`);
      return { items: [], failed: true, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    await logUsage("discovery", json.usage ?? null, latency, true);
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content) as { items?: DiscoveredSuggestion[] };
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      // Sanitiza enums simples para reduzir surpresa na UI.
      const norm = items.map((it) => ({
        reference: String(it.reference ?? "").trim(),
        url: typeof it.url === "string" && it.url.startsWith("http") ? it.url : null,
        summary: String(it.summary ?? "").trim(),
        jurisdiction_hint: String(it.jurisdiction_hint ?? "").toLowerCase(),
        applicability_hint:
          (String(it.applicability_hint ?? "").toLowerCase() === "real" ? "real" : "potential") as "real" | "potential",
      })).filter((it) => it.reference && it.summary);
      return { items: norm, failed: false };
    } catch {
      return { items: [], failed: true, error: "parse" };
    }
  } catch (err) {
    const latency = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    await logUsage("discovery", null, latency, false, message);
    return { items: [], failed: true, error: message };
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

  // JWT do usuário (mesmo padrão do generator).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authorization header ausente" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userResp?.user) {
    return new Response(
      JSON.stringify({ error: "JWT inválido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const userId = userResp.user.id;

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
  const companyId = profileRow.company_id;

  const { data: branch } = await supabase
    .from("branches")
    .select("id, company_id, name, state, city")
    .eq("id", body.branch_id)
    .maybeSingle();
  if (!branch || branch.company_id !== companyId) {
    return new Response(
      JSON.stringify({ error: "Unidade não encontrada nesta empresa" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Profile da unidade. Se vazio ou sem tags → erro semântico claro pra UI.
  const { data: profile } = await supabase
    .from("legislation_compliance_profiles")
    .select("generated_tags, responses, completed_at")
    .eq("branch_id", branch.id)
    .maybeSingle();
  const tags = (profile?.generated_tags ?? []) as string[];
  if (tags.length === 0) {
    return new Response(
      JSON.stringify({
        matched: [],
        discovered: [],
        ai_used: false,
        ai_failed: false,
        branch: { id: branch.id, name: branch.name, state: branch.state, city: branch.city },
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
    .eq("company_id", companyId)
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
    .eq("branch_id", branch.id);
  const linkedIds = new Set((linkedRows ?? []).map((r) => r.legislation_id));

  const branchState = (branch.state ?? "").toUpperCase();
  const branchCity = (branch.city ?? "").trim().toLowerCase();

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
  const activitiesParts: string[] = [];
  for (const key of ["inst.q4", "inst.q5"]) {
    const v = responses[key];
    if (typeof v === "string" && v.trim().length > 0) activitiesParts.push(v.trim());
  }

  const shouldRunAi = (body.expand_ai === true || matched.length < AUTO_AI_THRESHOLD) && !!PERPLEXITY_API_KEY;
  let discovered: DiscoveredSuggestion[] = [];
  let aiFailed = false;
  let aiError: string | undefined;
  if (shouldRunAi) {
    const result = await callPerplexityDiscovery(PERPLEXITY_API_KEY!, {
      sector: "transporte rodoviário de cargas",
      state: branch.state,
      city: branch.city,
      activities: activitiesParts.join(" | "),
      topTags: tags,
    });
    discovered = result.items;
    aiFailed = result.failed;
    aiError = result.error;
  }

  const responseBody: ResponseShape = {
    matched,
    discovered,
    ai_used: shouldRunAi,
    ai_failed: aiFailed,
    ai_error: aiError,
    branch: { id: branch.id, name: branch.name, state: branch.state, city: branch.city },
    profile: { tag_count: tags.length },
  };

  return new Response(
    JSON.stringify(responseBody),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
