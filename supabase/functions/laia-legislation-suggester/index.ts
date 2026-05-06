import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionContext {
  sector_name?: string;
  activity_operation: string;
  environmental_aspect: string;
  environmental_impact: string;
  control_types?: string[];
  existing_controls?: string;
  lifecycle_stages?: string[];
  branch_state?: string | null;
  branch_city?: string | null;
}

interface RequestBody {
  context: SuggestionContext;
  // Opcionais para correlação no admin: se o caller não passar, sai null.
  company_id?: string | null;
  user_id?: string | null;
}

const SYSTEM_PROMPT = `Você é um analista de legislação ambiental brasileira que dá suporte a um LAIA (Levantamento de Aspectos e Impactos Ambientais) sob a ISO 14001.

CONCEITOS DA TAREFA
- Aspecto ambiental: o elemento das atividades de uma organização que pode interagir com o meio ambiente (ex.: emissão de partículas, captação de água, geração de resíduo, lançamento de efluente, ruído).
- Impacto ambiental: a alteração no meio ambiente resultante do aspecto (ex.: degradação da qualidade do ar, esgotamento de recurso hídrico, contaminação do solo).
- Para o LAIA, o vínculo legal aplicável é determinado pelo PAR ASPECTO+IMPACTO e pelo RECURSO/MEIO afetado — não pela atividade ou setor que o gera. A "atividade/operação" recebida é apenas contexto situacional.
- Vigência: a recomendação deve ser uma norma vigente. Normas revogadas ou substituídas por versão mais recente devem ser ignoradas em favor da que está em vigor.

OBJETIVO
Para o contexto recebido, retornar de 1 a 3 normas brasileiras vigentes que regulam diretamente o aspecto+impacto descrito. Priorize especificidade técnica em relação ao fenômeno ambiental, não ao setor.

RACIOCÍNIO ESPERADO (faça mentalmente antes de listar)
1. Identifique o RECURSO/MEIO afetado pelo impacto: ar, água superficial, água subterrânea, solo, biota, ruído, resíduo sólido, fauna, paisagem, etc.
2. Liste o(s) marco(s) regulatório(s) federal(is) desse recurso/meio.
3. Localize a norma técnica que estabelece PARÂMETROS, LIMITES, CLASSIFICAÇÃO ou PROCEDIMENTO específico para o aspecto descrito (CONAMA, NBR ABNT, resoluções ANA/IBAMA).
4. Verifique vigência: a norma identificada está em vigor? Foi alterada, compilada ou substituída? Se foi revogada ou superada por norma mais recente que regula o mesmo objeto (ex.: padrão de qualidade do ar atualmente está em CONAMA 491/2018, que substituiu trechos da CONAMA 03/1990), use a versão atual.
5. Adicione norma-quadro (PNMA, Lei de Crimes Ambientais, lei de licenciamento) apenas se complementar concretamente — nunca como sugestão isolada.
6. Auto-checagem: para cada candidata, responda "esta norma regula o impacto <X> sobre o meio <Y>?". Se exige reinterpretar a atividade ou o setor para caber, descarte.

DIMENSÃO TERRITORIAL
LAIA é fortemente afetado por normas estaduais. Se o contexto trouxer UF (campo "Localização da unidade"):
- priorize o nível federal como referência de base; quando houver norma estadual do órgão ambiental da UF informada que regule o mesmo aspecto/impacto com mais especificidade ou parâmetros mais restritivos, inclua-a entre as 1–3 sugestões;
- principais órgãos por UF: SP → CETESB; RJ → INEA; MG → COPAM/SEMAD; PR → IAT; ES → IEMA; RS → SEMA/FEPAM; BA → INEMA; SC → IMA; CE → SEMACE; PE → CPRH; DF → IBRAM; demais UFs: respectivo órgão estadual de meio ambiente;
- REGRA CRÍTICA: qualquer norma estadual sugerida deve ser EXCLUSIVAMENTE da UF informada no contexto. Nunca sugira norma estadual de outra UF, mesmo que tematicamente equivalente ou que apareça nos resultados de busca. Se a UF informada não tiver norma estadual específica aplicável, omita a sugestão estadual e devolva apenas as federais — o número total de sugestões pode ficar entre 1 e 3 sem incluir estadual nesse caso;
- para normas estaduais, se não conseguir confirmar URL canônica via busca, retorne url=null (não invente).
Se a UF não vier no contexto, foque exclusivamente no nível federal.

TIPOS DE NORMA ELEGÍVEIS
Leis e Decretos Federais, Resoluções CONAMA, Resoluções CNRH, Resoluções ANA/IBAMA/ANP/ANTT, NBRs ABNT, Resoluções e Decretos estaduais (quando UF informada), Portarias do MMA/Ministério da Saúde quando estabelecem parâmetros.

PARA URL (regras rígidas)
- Use busca web em tempo real para confirmar a URL canônica.
- A URL deve apontar DIRETAMENTE para o texto/PDF oficial da norma — não para listagens, mecanismos de busca ou páginas-índice.
- Sempre com scheme https://.
- CONAMA: use o link de download do Joomla no formato https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=NNN.
- NBRs ABNT: sempre url=null (são pagas).
- Se não confirmar a URL canônica via busca, url=null. NUNCA invente URL.

FORMATO DE SAÍDA
JSON válido, sem texto fora do JSON:
{
  "suggestions": [
    { "reference": "<nome curto e padrão>",
      "url": "<URL canônica ou null>",
      "summary": "<1 frase descrita conforme as regras abaixo>" }
  ]
}

QUALIDADE DO SUMMARY
O summary deve, em uma frase:
- nomear o MEIO/RECURSO regulado (ar, água, solo, ruído…) e o ASPECTO coberto (emissão, captação, lançamento, descarte…);
- citar o CRITÉRIO TÉCNICO objetivo estabelecido pela norma para esse aspecto — limite numérico, frequência de monitoramento, classificação, proibição expressa ou exigência procedimental — quando aplicável.
Evite frases genéricas como "aplicável ao setor" ou "trata da matéria".`;

// Pricing Perplexity Sonar (USD): $1/1M input + $1/1M output + $5/1k searches.
// Cada chamada faz 1 search (low context).
const SONAR_INPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_OUTPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_SEARCH_USD = 5 / 1000;

// Domínios federais sempre incluídos no search_domain_filter — garantem que o
// modelo encontre URL canônica para Leis, Decretos, CONAMA, ANA, IBAMA, DOU.
const FEDERAL_DOMAINS = [
  "planalto.gov.br",
  "mma.gov.br",
  "ibama.gov.br",
  "ana.gov.br",
  "in.gov.br",
];

// Domínios de órgãos ambientais estaduais por UF. Quando branch_state vier no
// contexto, o(s) domínio(s) correspondente(s) é(são) anexado(s) ao filtro
// federal — assim o Perplexity consegue confirmar URL canônica para sugestões
// estaduais (CETESB, INEA, etc.) em vez de devolver url=null. UF não mapeada
// cai silenciosamente no fallback federal-only.
//
// Adicionar nova UF: 1) confirmar que o domínio do órgão está indexado em
// busca web; 2) adicionar entrada aqui. Sem outras mudanças no código.
const UF_TO_DOMAINS: Record<string, string[]> = {
  SP: ["cetesb.sp.gov.br"],
  RJ: ["inea.rj.gov.br"],
  MG: ["meioambiente.mg.gov.br", "semad.mg.gov.br"],
  PR: ["iat.pr.gov.br"],
  ES: ["iema.es.gov.br"],
  RS: ["fepam.rs.gov.br", "sema.rs.gov.br"],
  BA: ["inema.ba.gov.br"],
  SC: ["ima.sc.gov.br"],
  CE: ["semace.ce.gov.br"],
  PE: ["cprh.pe.gov.br"],
  DF: ["ibram.df.gov.br"],
};

// Perplexity Sonar aceita até 10 domínios em search_domain_filter. Federal (5)
// + 1–2 estaduais cabe folgado, mas o slice é defensivo caso alguma UF receba
// mais entradas no futuro.
const PERPLEXITY_DOMAIN_FILTER_MAX = 10;

function buildDomainFilter(uf: string | null): string[] {
  const stateDomains = uf ? (UF_TO_DOMAINS[uf.toUpperCase()] ?? []) : [];
  return [...FEDERAL_DOMAINS, ...stateDomains].slice(0, PERPLEXITY_DOMAIN_FILTER_MAX);
}

const logUsage = async (
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null,
  latencyMs: number,
  success: boolean,
  errorText?: string,
) => {
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
        function_name: "laia-legislation-suggester",
        feature_tag: "laia-legislation",
        model,
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
    console.warn("[laia-legislation-suggester] log usage failed:", err);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    return new Response(
      JSON.stringify({ error: "PERPLEXITY_API_KEY not configured", suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", suggestions: [] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { context } = body;
  if (!context?.activity_operation || !context?.environmental_aspect || !context?.environmental_impact) {
    return new Response(
      JSON.stringify({
        error: "Campos obrigatórios faltando: activity_operation, environmental_aspect, environmental_impact",
        suggestions: [],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const stateLabel = context.branch_state?.trim() || null;
  const cityLabel = context.branch_city?.trim() || null;
  const locationLine = stateLabel || cityLabel
    ? `${cityLabel ?? ""}${cityLabel && stateLabel ? ", " : ""}${stateLabel ?? ""}`.trim()
    : "N/A";

  const userPrompt = `Contexto da avaliação ambiental:
- Setor: ${context.sector_name ?? "N/A"}
- Localização da unidade: ${locationLine}
- Atividade/Operação: ${context.activity_operation}
- Aspecto Ambiental: ${context.environmental_aspect}
- Impacto Ambiental: ${context.environmental_impact}
- Controles existentes: ${context.existing_controls ?? "N/A"}
- Tipos de controle: ${(context.control_types ?? []).join(", ") || "N/A"}
- Estágios do ciclo de vida: ${(context.lifecycle_stages ?? []).join(", ") || "N/A"}

Retorne 1-3 referências legais brasileiras aplicáveis em JSON.`;

  const model = "sonar";
  const startedAt = Date.now();

  try {
    const pplxResp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        search_domain_filter: buildDomainFilter(stateLabel),
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "legal_suggestions",
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      reference: { type: "string" },
                      url: { type: ["string", "null"] },
                      summary: { type: "string" },
                    },
                    required: ["reference", "summary"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        },
      }),
    });

    const latencyMs = Date.now() - startedAt;

    if (!pplxResp.ok) {
      const errText = await pplxResp.text();
      const status = pplxResp.status;
      console.error("Perplexity error:", status, errText.slice(0, 300));
      await logUsage(model, null, latencyMs, false, `HTTP ${status}: ${errText.slice(0, 500)}`);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes.", suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 401 || status === 403) {
        return new Response(
          JSON.stringify({ error: "PERPLEXITY_API_KEY inválida ou sem permissão.", suggestions: [] }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Perplexity error: ${status}`, suggestions: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await pplxResp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    await logUsage(model, aiResponse?.usage ?? null, latencyMs, true);

    const content: string = aiResponse?.choices?.[0]?.message?.content ?? "{}";
    const citations: string[] = Array.isArray(aiResponse?.citations) ? aiResponse.citations : [];
    let parsed: { suggestions?: unknown[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("Failed to parse AI JSON:", content.slice(0, 200));
    }

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    return new Response(
      JSON.stringify({ suggestions, citations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    await logUsage(model, null, latencyMs, false, message);
    console.error("laia-legislation-suggester error:", message);
    return new Response(
      JSON.stringify({ error: message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
