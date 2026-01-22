import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ncTitle, ncDescription, category, source } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em gestão da qualidade e tratamento de não conformidades.
Sua tarefa é sugerir AÇÕES IMEDIATAS de contenção baseadas na descrição da não conformidade.

IMPORTANTE: Ações imediatas são DIFERENTES de ações corretivas. São ações de contenção para:
- Minimizar o impacto imediato do problema
- Comunicar as partes afetadas
- Segregar produtos/processos não conformes
- Interromper atividades de risco
- Implementar controles temporários

Para cada sugestão, forneça:
1. Uma ação clara e objetiva (action)
2. A justificativa da urgência (justification)

Retorne exatamente 3 sugestões no formato JSON.
As ações devem ser práticas, imediatas e focadas em contenção (não correção definitiva).`;

    const userPrompt = `
Não Conformidade: ${ncTitle}
Descrição: ${ncDescription || 'Não informada'}
Categoria: ${category || 'Não especificada'}
Fonte: ${source || 'Não especificada'}

Por favor, sugira 3 ações IMEDIATAS de contenção para esta não conformidade.
Foque em ações que podem ser executadas AGORA para minimizar o impacto.
Responda APENAS com o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_immediate_actions",
              description: "Retorna sugestões de ações imediatas de contenção",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "Descrição da ação imediata" },
                        justification: { type: "string", description: "Por que esta ação é urgente" }
                      },
                      required: ["action", "justification"],
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
        tool_choice: { type: "function", function: { name: "suggest_immediate_actions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido, tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log("AI suggestions generated:", args.suggestions?.length || 0);
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
    console.error("NC immediate suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
