import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiCall } from "../_shared/ai-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{ function?: { arguments?: string; name?: string } }>;
    };
  }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ncTitle, ncDescription, rootCause, analysisMethod, contributingFactors } = body;

    const systemPrompt = `Você é um especialista em gestão da qualidade e tratamento de não conformidades.
Sua tarefa é sugerir ações corretivas e preventivas baseadas na análise de causa raiz fornecida.

Para cada sugestão, forneça:
1. Uma ação clara e objetiva (what_action)
2. O motivo da ação (why_reason)
3. Como executar (how_method)

Retorne exatamente 3 sugestões de ações no formato JSON.
As ações devem ser práticas, mensuráveis e diretamente relacionadas à causa raiz identificada.`;

    const userPrompt = `
Não Conformidade: ${ncTitle}
Descrição: ${ncDescription || 'Não informada'}

Análise de Causa Raiz:
- Método utilizado: ${analysisMethod || 'Não especificado'}
- Causa raiz identificada: ${rootCause || 'Não identificada'}
- Fatores contribuintes: ${contributingFactors || 'Não especificados'}

Por favor, sugira 3 ações corretivas/preventivas para eliminar esta causa raiz.
Responda APENAS com o JSON, sem texto adicional.`;

    const data = await aiCall<AiResponse>(
      {
        functionName: 'nc-action-suggestions',
        featureTag: 'nc-action',
        companyId: body.company_id ?? null,
        userId: body.user_id ?? null,
        meta: {
          nc_id: body.nc_id ?? null,
          analysis_method: analysisMethod ?? null,
          has_root_cause: Boolean(rootCause),
        },
      },
      {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_actions",
              description: "Retorna sugestões de ações corretivas e preventivas",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        what_action: { type: "string", description: "O que deve ser feito" },
                        why_reason: { type: "string", description: "Por que esta ação é necessária" },
                        how_method: { type: "string", description: "Como executar a ação" }
                      },
                      required: ["what_action", "why_reason", "how_method"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_actions" } },
      },
    );

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ suggestions: args.suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(
          JSON.stringify({ suggestions: parsed.suggestions || parsed }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Return empty suggestions if parsing fails
        return new Response(
          JSON.stringify({ suggestions: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ suggestions: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("NC action suggestions error:", e);
    const status = (e as { status?: number })?.status;
    if (status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (status === 402) {
      return new Response(
        JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (status && status >= 500) {
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
