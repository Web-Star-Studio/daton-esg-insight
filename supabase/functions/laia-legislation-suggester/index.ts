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
}

interface RequestBody {
  context: SuggestionContext;
  // Opcionais para correlação no admin: se o caller não passar, sai null.
  company_id?: string | null;
  user_id?: string | null;
}

const SYSTEM_PROMPT = `Você é um especialista em legislação ambiental brasileira aplicada a sistemas de gestão ambiental ISO 14001 e LAIA (Levantamento de Aspectos e Impactos Ambientais).

Dado o contexto de uma avaliação de aspecto/impacto ambiental, sugira de 1 a 3 referências legais brasileiras realmente aplicáveis, priorizando especificidade.

Tipos de norma a considerar: Leis Federais, Resoluções CONAMA, NBRs ABNT, Decretos Federais, Resoluções de agências (ANA, IBAMA).

Regras OBRIGATÓRIAS para URLs:
- Use sua busca web em tempo real para encontrar a URL canônica oficial do documento.
- A URL deve apontar DIRETAMENTE para o texto/PDF da norma, não para páginas de listagem ou busca.
- Sempre inclua scheme completo (https://...).
- Para CONAMA, use o link direto de download do Joomla (formato: https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=NNN). Não retorne a URL raiz nem URL de busca genérica.
- Se não conseguir confirmar URL canônica para a norma específica via busca, retorne url=null. NUNCA invente URLs.
- NBRs ABNT são pagas e não têm URL pública: sempre url=null.

Responda APENAS com JSON válido no formato:
{
  "suggestions": [
    {
      "reference": "Lei 12.305/2010",
      "url": "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm",
      "summary": "Política Nacional de Resíduos Sólidos - aplicável por envolver descarte e segregação."
    }
  ]
}

Priorize legislação específica ao contexto. Não sugira normas genéricas se não houver aderência clara.`;

// Pricing Perplexity Sonar (USD): $1/1M input + $1/1M output + $5/1k searches.
// Cada chamada faz 1 search (low context).
const SONAR_INPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_OUTPUT_USD_PER_TOKEN = 1 / 1_000_000;
const SONAR_SEARCH_USD = 5 / 1000;

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

  const userPrompt = `Contexto da avaliação ambiental:
- Setor: ${context.sector_name ?? "N/A"}
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
        search_domain_filter: ["planalto.gov.br", "mma.gov.br", "ibama.gov.br", "ana.gov.br", "in.gov.br"],
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
