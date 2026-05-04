import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
}

const SYSTEM_PROMPT = `Você é um especialista em legislação ambiental brasileira aplicada a sistemas de gestão ambiental ISO 14001 e LAIA (Levantamento de Aspectos e Impactos Ambientais).

Dado o contexto de uma avaliação de aspecto/impacto ambiental, sugira de 1 a 3 referências legais brasileiras realmente aplicáveis, priorizando especificidade.

Tipos de norma a considerar:
- Leis Federais (ex: Lei 12.305/2010 - Política Nacional de Resíduos Sólidos, Lei 9.605/1998 - Crimes Ambientais, Lei 9.433/1997 - Recursos Hídricos)
- Resoluções CONAMA (ex: CONAMA 237/97 - Licenciamento, CONAMA 357/05 - Águas, CONAMA 313/02 - Resíduos Industriais, CONAMA 430/11 - Efluentes)
- NBRs ABNT (ex: NBR 10004 - Resíduos sólidos)
- Decretos Federais e Resoluções de agências (ANA, IBAMA)

Para URL, use:
- planalto.gov.br/ccivil_03/_ato.../[ano]/lei/lXXXX.htm para leis federais
- conama.mma.gov.br para CONAMA (use null se não souber a URL exata)
- null para NBRs (ABNT é pago)

Responda APENAS com JSON válido no formato:
{
  "suggestions": [
    {
      "reference": "Lei 12.305/2010",
      "url": "http://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm",
      "summary": "Política Nacional de Resíduos Sólidos - aplicável por envolver descarte e segregação."
    }
  ]
}

Priorize legislação específica ao contexto. Não sugira normas genéricas se não houver aderência clara.`;

const logUsage = async (
  functionName: string,
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
    (promptTokens / 1000) * 0.00025 + (completionTokens / 1000) * 0.002;

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
        function_name: functionName,
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

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured", suggestions: [] }),
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

  const model = "openai/gpt-5-mini";
  const startedAt = Date.now();

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      await logUsage("laia-legislation-suggester", model, null, latencyMs, false, `HTTP ${response.status}: ${errorText.slice(0, 500)}`);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes.", suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos do workspace Lovable AI insuficientes.", suggestions: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `AI Gateway error: ${response.status}`, suggestions: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    await logUsage("laia-legislation-suggester", model, aiResponse?.usage ?? null, latencyMs, true);

    const content: string = aiResponse?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { suggestions?: unknown[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("Failed to parse AI JSON:", content.slice(0, 200));
    }

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    await logUsage("laia-legislation-suggester", model, null, latencyMs, false, message);
    console.error("laia-legislation-suggester error:", message);
    return new Response(
      JSON.stringify({ error: message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
