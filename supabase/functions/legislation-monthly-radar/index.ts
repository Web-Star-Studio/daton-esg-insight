// Radar Mensal de Novidades Legais — versão agentic.
//
// Para uma (branch_id, reference_month), o agente (Gemini 2.5 Pro via
// Lovable Gateway) decide quais buscas fazer, valida URLs, dedupe contra
// catálogo e finaliza com a lista curada de normas. Resposta é
// compute-on-demand: a edge function não persiste candidatas — o usuário
// aceita pela UI e o aceite cria `legislations` (com `ai_ingested=true`)
// + `legislation_unit_compliance`. O trigger `create_legislation_history`
// dispara `action='created'` automaticamente, e a próxima carta cobre.
//
// Por que agentic em vez de single-shot:
//   - 1 prompt amplo com Sonar-pro retornava ~1-2 itens (modelo conservador
//     quando faixa temática é grande). Múltiplas buscas focadas (uma por
//     tema/jurisdição) produzem melhor cobertura.
//   - O modelo agora pode validar URL via fetch_url antes de incluir no
//     finalize, reduzindo entradas com link quebrado.
//   - Dedup via tool em vez de prompt — menos tokens, mais confiável.
//
// Contrato com a UI (ResponseShape) preservado: { novelties, branch,
// reference_month, ai_failed, ai_error, duplicate_count }. A camada
// agentic é detalhe interno — a página `LegislationSuggestions` não muda.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";
import { runAgent, type AgentTool, type AgentRunResult } from "../_shared/agent-runtime.ts";
import { extractFirstJsonObject } from "../_shared/json-utils.ts";

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

const VALID_THEME_IDS = new Set([
  "licenciamento", "instalacoes", "localizacao_fauna_flora", "produtos_insumos",
  "produtos_florestais", "combustiveis_inflamaveis", "produtos_quimicos",
  "recursos_hidricos", "emissoes_atmosfericas", "residuos", "equipamentos",
  "energia", "transporte", "profissionais", "pcd", "saude_trabalhador",
  "tipos_trabalho_terceiros", "normas_regulamentadoras", "mineracao",
  "pesagem", "lgpd",
]);

const VALID_JURISDICTIONS = new Set(["federal", "estadual", "municipal", "nbr", "internacional"]);

// ---------- Tools ----------

function buildSearchPerplexityTool(apiKey: string): AgentTool {
  return {
    name: "search_perplexity",
    description:
      "Busca normas legais brasileiras publicadas em uma janela de datas usando Perplexity Sonar-pro com web search. Use UMA query por tema/agência (ex.: 'normas ANTT publicadas abril 2026 transporte cargas'). NÃO faça uma busca única ampla — múltiplas buscas focadas dão melhor cobertura.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Query natural em PT-BR descrevendo o que buscar. Ex: 'portarias ANTT abril 2026 transporte rodoviário cargas' ou 'normas FEPAM-RS resíduos perigosos abril 2026'.",
        },
        date_from: { type: "string", description: "YYYY-MM-DD (início da janela)" },
        date_to: { type: "string", description: "YYYY-MM-DD (fim da janela)" },
      },
      required: ["query", "date_from", "date_to"],
    },
    execute: async (args) => {
      const query = String(args.query ?? "").trim();
      const dateFrom = String(args.date_from ?? "").trim();
      const dateTo = String(args.date_to ?? "").trim();
      if (!query || !dateFrom || !dateTo) {
        return { error: "query, date_from, date_to são obrigatórios" };
      }
      const userPrompt = `Liste normas brasileiras publicadas entre ${dateFrom} e ${dateTo} sobre: ${query}.\n\nPara cada norma: reference (nome curto), norm_type, norm_number, publication_date YYYY-MM-DD, title, summary técnico em 1 frase, jurisdiction (federal|estadual|municipal|nbr|internacional), state (UF se estadual), municipality (cidade se municipal), issuing_body, source_url HTTPS canônica.\n\nFORMATO DE SAÍDA: JSON {"items": [...]}, sem markdown, sem texto antes ou depois. Sem URL canônica → não incluir.`;
      try {
        const resp = await callPerplexityWithRetry(apiKey, {
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "Você é analista jurídico brasileiro. Use busca web para encontrar normas reais publicadas no período pedido (DOU, planalto, agências, portais estaduais/municipais). Retorne APENAS JSON {\"items\":[...]}.",
            },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        });
        if (!resp.ok) {
          return { error: `HTTP ${resp.status}`, items: [] };
        }
        const json = await resp.json() as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = json.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(extractFirstJsonObject(raw)) as { items?: unknown[] };
        return { items: Array.isArray(parsed.items) ? parsed.items : [] };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err), items: [] };
      }
    },
  };
}

const fetchUrlTool: AgentTool = {
  name: "fetch_url",
  description:
    "Baixa o HTML de uma URL para validar publicação. Use SÓ pra URLs governamentais (in.gov.br, planalto, agências reguladoras, portais estaduais/municipais). Retorna primeiros 4KB do body. Timeout 8s.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", format: "uri", description: "URL HTTPS para validar" },
    },
    required: ["url"],
  },
  execute: async ({ url }) => {
    const u = String(url ?? "").trim();
    if (!u.startsWith("https://") && !u.startsWith("http://")) {
      return { error: "URL precisa começar com http(s)://" };
    }
    try {
      const resp = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const text = await resp.text();
      return { status: resp.status, snippet: text.slice(0, 4000) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
};

function buildQueryExistingTool(supabase: SupabaseClient, branchId: string): AgentTool {
  return {
    name: "query_existing_legislations",
    description:
      "Lista normas já vinculadas a esta unidade (legislation_unit_compliance). Use pra evitar sugerir duplicata. branch_id é fixo no contexto da run; o argumento é só placeholder pra disparar a tool.",
    parameters: {
      type: "object",
      properties: {
        branch_id: {
          type: "string",
          description: "UUID da branch — passe o mesmo do contexto do user message.",
        },
      },
      required: ["branch_id"],
    },
    execute: async () => {
      // Ignoramos o argumento (closure usa a branch real). Evita o agente
      // tentar consultar outra branch.
      const { data: linkedRows } = await supabase
        .from("legislation_unit_compliance")
        .select("legislation_id, legislations(norm_type, norm_number, title, publication_date)")
        .eq("branch_id", branchId);
      const existing = (linkedRows ?? []).map((r: Record<string, unknown>) => {
        const leg = r.legislations as Record<string, unknown> | null;
        if (!leg) return null;
        return {
          norm_type: leg.norm_type ?? null,
          norm_number: leg.norm_number ?? null,
          title: leg.title ?? null,
          publication_date: leg.publication_date ?? null,
        };
      }).filter(Boolean);
      return { count: existing.length, items: existing.slice(0, 80) };
    },
  };
}

interface FinalizeNoveltiesPayload {
  novelties: RadarNovelty[];
}

const finalizeNoveltiesTool: AgentTool = {
  name: "finalize_novelties",
  description:
    "Encerra a busca e devolve a lista curada. Chame UMA vez no final, com 6-12 itens. Após esta chamada, NÃO faça mais buscas.",
  parameters: {
    type: "object",
    properties: {
      novelties: {
        type: "array",
        description: "Lista final de novidades (6-12 itens, ordenadas Real > Potencial).",
        items: {
          type: "object",
          properties: {
            reference: { type: "string" },
            norm_type: { type: "string" },
            norm_number: { type: "string" },
            publication_date: { type: "string", description: "YYYY-MM-DD" },
            title: { type: "string" },
            summary: { type: "string" },
            jurisdiction: { type: "string", enum: ["federal", "estadual", "municipal", "nbr", "internacional"] },
            state: { type: ["string", "null"] },
            municipality: { type: ["string", "null"] },
            issuing_body: { type: "string" },
            source_url: { type: "string", format: "uri" },
            applicability_hint: { type: "string", enum: ["real", "potential"] },
            matched_themes: { type: "array", items: { type: "string" } },
          },
          required: [
            "reference", "title", "summary", "jurisdiction", "source_url",
            "applicability_hint", "matched_themes", "publication_date",
          ],
        },
      },
    },
    required: ["novelties"],
  },
  execute: async ({ novelties }) => {
    const arr = Array.isArray(novelties) ? novelties.length : 0;
    return { saved: true, count: arr };
  },
};

// ---------- handler ----------

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
  // fim de M-1 (curadoria mensal). Mantemos o range ampliado.
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
  let userId: string | null = null;
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
  const targetBranch = branch!;

  // Tags do questionário pra alinhar busca; sem isso o agente dispersa.
  const { data: profile } = await supabase
    .from("legislation_compliance_profiles")
    .select("generated_tags")
    .eq("branch_id", targetBranch.id)
    .maybeSingle();
  const tags = ((profile?.generated_tags ?? []) as string[]).filter((t) => typeof t === "string");

  // ---------- agentic loop ----------

  const tools: AgentTool[] = [
    buildSearchPerplexityTool(PERPLEXITY_API_KEY),
    fetchUrlTool,
    buildQueryExistingTool(supabase, targetBranch.id),
    finalizeNoveltiesTool,
  ];

  const systemPrompt = `Você é analista jurídico brasileiro. Sua missão é levantar legislação publicada em uma janela mensal aplicável a uma unidade específica.

PROCESSO E ORÇAMENTO (siga rigorosamente):
1. PRIMEIRO turno: chame query_existing_legislations (1 chamada).
2. Faça NO MÁXIMO 4 search_perplexity, uma por tema/agência diferente (ANTT, CONTRAN, MTE/NRs, ANP, IBAMA, CONAMA, ANVISA, FEPAM-RS quando estadual). NÃO repita busca semelhante.
3. fetch_url é OPCIONAL — use só quando a URL retornada pela busca parecer suspeita. Limite: 2 fetch_url por run.
4. Chame finalize_novelties OBRIGATORIAMENTE como ÚLTIMA tool. Mesmo que tenha encontrado poucos itens, finalize com o que tiver.

ORÇAMENTO TOTAL DO LOOP: 16 turnos. Você DEVE chamar finalize_novelties antes do fim. Se ficar com 4+ turnos restantes e ainda não finalizou, FINALIZE AGORA com o que tiver.

REGRAS DURAS pra cada novelty:
- publication_date dentro da janela informada (rejeitamos fora dela).
- jurisdiction='estadual' SÓ pra UF da unidade; 'municipal' SÓ pra cidade da unidade.
- source_url HTTPS obrigatório.
- matched_themes: ids EXATOS da lista: licenciamento, instalacoes, localizacao_fauna_flora, produtos_insumos, produtos_florestais, combustiveis_inflamaveis, produtos_quimicos, recursos_hidricos, emissoes_atmosfericas, residuos, equipamentos, energia, transporte, profissionais, pcd, saude_trabalhador, tipos_trabalho_terceiros, normas_regulamentadoras, mineracao, pesagem, lgpd.
- applicability_hint='real' quando obrigatória/diretamente aplicável; 'potential' caso contrário.

ALVO de qualidade: 6-12 itens. Aceita-se menos se a busca não rendeu. NUNCA termine sem chamar finalize_novelties (mesmo com array vazio).`;

  const userPrompt = `Branch: ${targetBranch.name} (${targetBranch.city ?? "—"}/${targetBranch.state ?? "—"}).
Branch ID (para query_existing_legislations): ${targetBranch.id}.
Janela de busca: ${searchStartISO} a ${searchEndISO}.
Mês de referência da carta: ${monthLabel}.
Setor: transporte rodoviário de cargas.
Temas-chave do questionário (top 30): ${tags.slice(0, 30).join(", ") || "(perfil sem tags)"}.

Inclua federais, estaduais de "${targetBranch.state ?? ""}", municipais de "${targetBranch.city ?? ""}", NBRs e tratados internacionais relevantes.`;

  let agentResult: AgentRunResult;
  try {
    agentResult = await runAgent({
      agentName: "legislation-monthly-radar",
      model: "google/gemini-2.5-pro",
      systemPrompt,
      userPrompt,
      tools,
      maxSteps: 16,
      companyId: companyId ?? undefined,
      branchId: targetBranch.id,
      triggeredBy: userId,
      supabase,
      inputForLog: { reference_month: monthStartISO, sector: "transporte rodoviário de cargas" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const responseBody: ResponseShape = {
      novelties: [],
      duplicate_count: 0,
      branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
      reference_month: monthStartISO,
      ai_failed: true,
      ai_error: message,
    };
    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Pega o ÚLTIMO finalize_novelties (caso o agente tenha chamado por engano
  // mais de uma vez). Se não chamou, tratamos como ai_failed.
  const finalizeCalls = agentResult.toolCalls.filter((c) => c.name === "finalize_novelties");
  const finalize = finalizeCalls[finalizeCalls.length - 1];
  if (!finalize) {
    const responseBody: ResponseShape = {
      novelties: [],
      duplicate_count: 0,
      branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
      reference_month: monthStartISO,
      ai_failed: true,
      ai_error: agentResult.reachedMaxSteps
        ? "agent did not finalize within maxSteps"
        : "agent ended without finalize_novelties call",
    };
    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const candidates = ((finalize.input as FinalizeNoveltiesPayload | undefined)?.novelties ?? []) as unknown[];

  // Validação server-side (defesa em profundidade — o agente já recebeu
  // as regras no system, mas validamos novamente). Mesma lógica do
  // single-shot anterior.
  const branchState = (targetBranch.state ?? "").toUpperCase();
  const branchCity = (targetBranch.city ?? "").trim().toLowerCase();
  let duplicateCount = 0;
  const novelties: RadarNovelty[] = [];

  // Lista de já-vinculadas para dedup server-side adicional.
  const { data: linkedRows } = await supabase
    .from("legislation_unit_compliance")
    .select("legislation_id, legislations(norm_type, norm_number)")
    .eq("branch_id", targetBranch.id);
  const linkedKeys = new Set(
    ((linkedRows ?? []) as Array<{ legislations: { norm_type: string | null; norm_number: string | null } | null }>)
      .map((r) => {
        const l = r.legislations;
        if (!l) return null;
        return `${(l.norm_type ?? "").toLowerCase()}::${(l.norm_number ?? "").toLowerCase()}`;
      })
      .filter((v): v is string => v !== null && v !== "::"),
  );

  for (const raw of candidates) {
    if (!raw || typeof raw !== "object") continue;
    const it = raw as Record<string, unknown>;
    const reference = String(it.reference ?? "").trim();
    const sourceUrl = String(it.source_url ?? "").trim();
    const summary = String(it.summary ?? "").trim();
    const title = String(it.title ?? "").trim();
    if (!reference || !title || !summary) continue;
    if (!sourceUrl.startsWith("https://") && !sourceUrl.startsWith("http://")) continue;
    const jurisdiction = String(it.jurisdiction ?? "").toLowerCase();
    if (!VALID_JURISDICTIONS.has(jurisdiction)) continue;
    const publicationDate = String(it.publication_date ?? "").trim();
    if (!publicationDate || publicationDate < searchStartISO || publicationDate > searchEndISO) continue;
    if (jurisdiction === "estadual") {
      const s = String(it.state ?? "").toUpperCase();
      if (!s || s !== branchState) continue;
    } else if (jurisdiction === "municipal") {
      const c = String(it.municipality ?? "").trim().toLowerCase();
      if (!c || c !== branchCity) continue;
    }
    const themesRaw = Array.isArray(it.matched_themes) ? it.matched_themes : [];
    const themes = themesRaw
      .map((t) => String(t).toLowerCase())
      .filter((t) => VALID_THEME_IDS.has(t));

    const normType = String(it.norm_type ?? "").trim();
    const normNumber = String(it.norm_number ?? "").trim();
    const dedupKey = `${normType.toLowerCase()}::${normNumber.toLowerCase()}`;
    if (dedupKey !== "::" && linkedKeys.has(dedupKey)) {
      duplicateCount++;
      continue;
    }

    novelties.push({
      reference,
      norm_type: normType,
      norm_number: normNumber,
      publication_date: publicationDate,
      title,
      summary,
      jurisdiction: jurisdiction as RadarNovelty["jurisdiction"],
      state: typeof it.state === "string" && it.state.length > 0 ? it.state : null,
      municipality: typeof it.municipality === "string" && it.municipality.length > 0 ? it.municipality : null,
      issuing_body: String(it.issuing_body ?? "").trim(),
      source_url: sourceUrl,
      applicability_hint: String(it.applicability_hint ?? "").toLowerCase() === "real" ? "real" : "potential",
      matched_themes: themes,
    });
  }

  const responseBody: ResponseShape = {
    novelties,
    duplicate_count: duplicateCount,
    branch: { id: targetBranch.id, name: targetBranch.name, state: targetBranch.state, city: targetBranch.city },
    reference_month: monthStartISO,
    ai_failed: false,
  };

  return new Response(
    JSON.stringify(responseBody),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
