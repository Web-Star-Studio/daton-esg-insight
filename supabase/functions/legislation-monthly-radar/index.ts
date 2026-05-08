// Radar Mensal de Novidades Legais.
//
// Para uma (branch_id, reference_month), pergunta à Perplexity Sonar quais
// normas brasileiras foram PUBLICADAS naquele mês e são potencialmente
// aplicáveis ao perfil da unidade (federal + estadual da UF + municipal
// da cidade + NBR + tratados internacionais relevantes).
//
// Resposta é compute-on-demand — a edge function não persiste. O usuário
// revisa as candidatas na UI e aceita as relevantes; o aceite faz INSERT
// em `legislations` (com `ai_ingested=true`) + `legislation_unit_compliance`,
// e o trigger `create_legislation_history` dispara `action='created'` —
// dali em diante, a norma cai naturalmente na carta do mês como
// "Requisitos Publicados".
//
// Espelha o padrão de `legislation-suggestions-from-profile/index.ts` (JWT
// do usuário + Sonar + JSON Schema + ai_usage_logs).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";

interface RequestBody {
  branch_id: string;
  reference_month: string; // ISO YYYY-MM-DD (qualquer dia do mês — truncamos)
  cron_internal?: boolean; // chamada server-to-server (cron/admin) — pula JWT
}

interface RadarNovelty {
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

interface ResponseShape {
  novelties: RadarNovelty[];
  duplicate_count: number;
  branch: { id: string; name: string; state: string | null; city: string | null };
  reference_month: string;
  ai_failed: boolean;
  ai_error?: string;
}

const PT_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

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
        function_name: "legislation-monthly-radar",
        feature_tag: `radar:${call}`,
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
    console.warn("[radar] log usage failed:", err);
  }
}

interface RadarPromptCtx {
  monthLabel: string;
  monthStartISO: string;
  monthEndISO: string;
  // Range de busca passado ao Perplexity (em geral M-1 até M, pra capturar
  // normas publicadas no fim do mês anterior que entram na curadoria).
  searchStartISO: string;
  searchEndISO: string;
  state: string | null;
  city: string | null;
  topTags: string[];
  duplicateRefs: string[];
  sector: string;
}

// Extrai o primeiro objeto JSON balanceado de uma string. Lida com:
// - resposta crua: `{...}` → retorna ela mesma.
// - markdown: ```json\n{...}\n``` → retorna o miolo.
// - prefixo de texto: "Aqui está...\n{...}" → retorna o objeto.
// Se não achar, devolve "{}".
function extractFirstJsonObject(s: string): string {
  if (!s) return "{}";
  // Remove code fences ```json ... ``` ou ``` ... ```
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : s;
  // Procura primeiro `{` e tenta achar seu par balanceado.
  const start = candidate.indexOf("{");
  if (start < 0) return "{}";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  // Não fechou — devolve o que tem (parser vai falhar com erro útil).
  return candidate.slice(start);
}

async function callPerplexityRadar(
  apiKey: string,
  ctx: RadarPromptCtx,
): Promise<{ items: RadarNovelty[]; failed: boolean; error?: string }> {
  const startedAt = Date.now();
  const dupBlock = ctx.duplicateRefs.length > 0
    ? `\nNormas já no catálogo (não repetir):\n${ctx.duplicateRefs.slice(0, 60).map((r) => `- ${r}`).join("\n")}`
    : "";

  // Prompt enxuto — sonar-pro funciona melhor com instruções diretas.
  // Range ampliado pra M-1..M (curadoria SOGI inclui M-1 publicações).
  const userPrompt = `Sua tarefa: liste 6 a 12 normas brasileiras PUBLICADAS entre ${ctx.searchStartISO} e ${ctx.searchEndISO} aplicáveis a uma transportadora rodoviária de cargas em ${ctx.city ?? "—"}/${ctx.state ?? "—"}.

Foque em: ANTT, CONTRAN, DENATRAN, MTE/NRs, ANP, IBAMA, CONAMA, ANVISA, COANA/RFB, LGPD/ANPD, FEPAM-RS, e portais municipais. Inclua portarias, resoluções, leis, decretos, instruções normativas, deliberações, NBRs.

Temas do questionário (use pra filtrar relevância): ${ctx.topTags.slice(0, 30).join(", ")}.${dupBlock}

REGRAS:
- publication_date DEVE estar em ${ctx.searchStartISO}..${ctx.searchEndISO}.
- source_url HTTPS obrigatório (DOU/in.gov.br, planalto, agência, ou fonte secundária confiável: legisweb, lex.com.br, normaslegais).
- jurisdiction='estadual' só para "${ctx.state ?? ""}"; jurisdiction='municipal' só para "${ctx.city ?? ""}".
- Quando houver dúvida sobre aplicabilidade direta, marque como 'potential' e inclua mesmo assim.
- matched_themes: 1-3 ids da lista: licenciamento, instalacoes, localizacao_fauna_flora, produtos_insumos, produtos_florestais, combustiveis_inflamaveis, produtos_quimicos, recursos_hidricos, emissoes_atmosfericas, residuos, equipamentos, energia, transporte, profissionais, pcd, saude_trabalhador, tipos_trabalho_terceiros, normas_regulamentadoras, mineracao, pesagem, lgpd.

Meta de 6-12 itens — um único item não justifica a chamada. Busque amplo.`;

  try {
    const resp = await callPerplexityWithRetry(apiKey, {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "Você é analista jurídico brasileiro especializado em compliance ambiental, trabalhista e operacional. Português do Brasil, tom técnico. Use a busca web para encontrar normas reais publicadas no período pedido (DOU, planalto, agências reguladoras, portais estaduais/municipais, fontes secundárias confiáveis).\n\nFORMATO DE SAÍDA: retorne APENAS um objeto JSON válido (sem texto antes ou depois, sem code fences, sem markdown), no formato:\n{\n  \"novelties\": [\n    {\n      \"reference\": string,\n      \"norm_type\": string,\n      \"norm_number\": string,\n      \"publication_date\": \"YYYY-MM-DD\",\n      \"title\": string,\n      \"summary\": string,\n      \"jurisdiction\": \"federal\"|\"estadual\"|\"municipal\"|\"nbr\"|\"internacional\",\n      \"state\": string|null,\n      \"municipality\": string|null,\n      \"issuing_body\": string,\n      \"source_url\": string,\n      \"applicability_hint\": \"real\"|\"potential\",\n      \"matched_themes\": [string]\n    }\n  ]\n}",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });
    const latency = Date.now() - startedAt;
    if (!resp.ok) {
      const errText = await resp.text();
      await logUsage("search", null, latency, false, `HTTP ${resp.status}: ${errText.slice(0, 300)}`);
      return { items: [], failed: true, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    await logUsage("search", json.usage ?? null, latency, true);
    const rawContent = json.choices?.[0]?.message?.content ?? "{}";
    // Sonar-pro às vezes embrulha o JSON em ```json ... ``` ou prefixa com
    // texto explicativo. Extraímos o primeiro objeto JSON balanceado.
    const content = extractFirstJsonObject(rawContent);
    try {
      const parsed = JSON.parse(content) as { novelties?: unknown[] };
      const items = Array.isArray(parsed.novelties) ? parsed.novelties : [];
      const norm: RadarNovelty[] = [];
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue;
        const it = raw as Record<string, unknown>;
        const reference = String(it.reference ?? "").trim();
        const sourceUrl = String(it.source_url ?? "").trim();
        const summary = String(it.summary ?? "").trim();
        const title = String(it.title ?? "").trim();
        if (!reference || !title || !summary) continue;
        if (!sourceUrl.startsWith("https://") && !sourceUrl.startsWith("http://")) continue;
        const jurisdiction = String(it.jurisdiction ?? "").toLowerCase();
        if (!["federal", "estadual", "municipal", "nbr", "internacional"].includes(jurisdiction)) continue;
        const applicability = String(it.applicability_hint ?? "").toLowerCase();
        const themes = Array.isArray(it.matched_themes)
          ? (it.matched_themes as unknown[]).map((t) => String(t)).filter(Boolean)
          : [];
        norm.push({
          reference,
          norm_type: String(it.norm_type ?? "").trim(),
          norm_number: String(it.norm_number ?? "").trim(),
          publication_date: String(it.publication_date ?? "").trim(),
          title,
          summary,
          jurisdiction: jurisdiction as RadarNovelty["jurisdiction"],
          state: typeof it.state === "string" && it.state.length > 0 ? it.state : null,
          municipality: typeof it.municipality === "string" && it.municipality.length > 0 ? it.municipality : null,
          issuing_body: String(it.issuing_body ?? "").trim(),
          source_url: sourceUrl,
          applicability_hint: applicability === "real" ? "real" : "potential",
          matched_themes: themes,
        });
      }
      return { items: norm, failed: false };
    } catch {
      return { items: [], failed: true, error: "parse" };
    }
  } catch (err) {
    const latency = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    await logUsage("search", null, latency, false, message);
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
    console.error("[legislation-monthly-radar] uncaught:", message, stack);
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
  if (!PERPLEXITY_API_KEY) {
    return new Response(
      JSON.stringify({ error: "PERPLEXITY_API_KEY não configurada" }),
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

  const refDate = new Date(body.reference_month);
  if (Number.isNaN(refDate.getTime())) {
    return new Response(
      JSON.stringify({ error: "reference_month inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const monthStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 0, 23, 59, 59));
  const monthStartISO = monthStart.toISOString().slice(0, 10);
  const monthEndISO = monthEnd.toISOString().slice(0, 10);
  const monthLabel = `${PT_MONTHS[monthStart.getUTCMonth()]} de ${monthStart.getUTCFullYear()}`;
  // SOGI inclui na carta de M tanto normas publicadas em M quanto as do
  // fim de M-1. Buscamos a janela maior; o filtro server-side aceita as duas.
  const searchStart = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() - 1, 1, 0, 0, 0));
  const searchStartISO = searchStart.toISOString().slice(0, 10);
  const searchEndISO = monthEndISO;

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

  let companyId: string | null = null;
  let branch: { id: string; company_id: string; name: string; state: string | null; city: string | null } | null = null;

  if (isCronInternal) {
    // Caminho server-to-server: identifica empresa pelo branch.
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
    // Caminho normal — JWT do usuário.
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

  // Após o if/else, branch é garantido não-null (ambos paths atribuem).
  // O `!` só silencia o type-narrowing — runtime já está coberto.
  const targetBranch = branch!;

  // Tags do questionário pra alinhar busca; sem isso a Perplexity dispersa.
  const { data: profile } = await supabase
    .from("legislation_compliance_profiles")
    .select("generated_tags, responses")
    .eq("branch_id", targetBranch.id)
    .maybeSingle();
  const tags = ((profile?.generated_tags ?? []) as string[]).filter((t) => typeof t === "string");

  // Lista curta das normas já vinculadas — alimenta o de-dup do prompt.
  // Limita aos últimos 12 meses pra não inflar (norm_type + norm_number já
  // identifica suficientemente; se faltar dados, manda só o título).
  const { data: linkedRows } = await supabase
    .from("legislation_unit_compliance")
    .select("legislation_id")
    .eq("branch_id", targetBranch.id);
  const linkedIds = new Set((linkedRows ?? []).map((r) => r.legislation_id as string));

  let duplicateRefs: string[] = [];
  if (linkedIds.size > 0) {
    // pega referência textual de até 60 das mais recentes
    const ids = Array.from(linkedIds).slice(0, 60);
    const { data: legRows } = await supabase
      .from("legislations")
      .select("title, norm_type, norm_number")
      .in("id", ids);
    duplicateRefs = (legRows ?? []).map((r) => {
      const parts = [r.norm_type, r.norm_number ? `nº ${r.norm_number}` : null]
        .filter((v): v is string => typeof v === "string" && v.length > 0);
      return parts.length > 0 ? parts.join(" ") : (r.title ?? "");
    }).filter(Boolean);
  }

  const result = await callPerplexityRadar(PERPLEXITY_API_KEY, {
    monthLabel,
    monthStartISO,
    monthEndISO,
    searchStartISO,
    searchEndISO,
    state: targetBranch.state,
    city: targetBranch.city,
    topTags: tags,
    duplicateRefs,
    sector: "transporte rodoviário de cargas",
  });

  // Validação server-side: drop fora da janela de busca + jurisdição
  // inconsistente. A janela é M-1..M (segue a curadoria SOGI).
  const branchState = (targetBranch.state ?? "").toUpperCase();
  const branchCity = (targetBranch.city ?? "").trim().toLowerCase();
  let duplicateCount = 0;
  const novelties: RadarNovelty[] = [];
  for (const it of result.items) {
    if (!it.publication_date || it.publication_date < searchStartISO || it.publication_date > searchEndISO) continue;
    if (it.jurisdiction === "estadual") {
      if (!it.state || it.state.toUpperCase() !== branchState) continue;
    } else if (it.jurisdiction === "municipal") {
      const c = (it.municipality ?? "").trim().toLowerCase();
      if (!c || c !== branchCity) continue;
    }
    // de-dup leve: se o título coincide com algo já listado, ignora
    const dupHit = duplicateRefs.some((r) =>
      r && it.reference && r.toLowerCase().includes(it.norm_number?.toLowerCase() ?? "_______")
    );
    if (dupHit) {
      duplicateCount++;
      continue;
    }
    novelties.push(it);
  }

  const responseBody: ResponseShape = {
    novelties,
    duplicate_count: duplicateCount,
    branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
    reference_month: monthStartISO,
    ai_failed: result.failed,
    ai_error: result.error,
  };

  return new Response(
    JSON.stringify(responseBody),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
