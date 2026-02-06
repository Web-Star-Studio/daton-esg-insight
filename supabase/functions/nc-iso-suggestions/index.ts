import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ISO_CLAUSES_REFERENCE = `
ISO 9001:2015 - Sistema de Gestão da Qualidade:
- 4.1: Entendendo a organização e seu contexto
- 4.2: Necessidades e expectativas de partes interessadas
- 4.3: Escopo do sistema de gestão da qualidade
- 5.1: Liderança e comprometimento
- 5.2: Política da qualidade
- 6.1: Ações para abordar riscos e oportunidades
- 7.1: Recursos
- 7.2: Competência
- 7.3: Conscientização
- 7.4: Comunicação
- 7.5: Informação documentada
- 8.1: Planejamento e controle operacionais
- 8.2: Requisitos para produtos e serviços
- 8.3: Projeto e desenvolvimento
- 8.4: Controle de processos, produtos e serviços providos externamente
- 8.5: Produção e provisão de serviço
- 8.6: Liberação de produtos e serviços
- 8.7: Controle de saídas não conformes
- 9.1: Monitoramento, medição, análise e avaliação
- 9.2: Auditoria interna
- 9.3: Análise crítica pela direção
- 10.1: Melhoria - Generalidades
- 10.2: Não conformidade e ação corretiva
- 10.3: Melhoria contínua

ISO 14001:2015 - Sistema de Gestão Ambiental:
- 4.1: Entendendo a organização e seu contexto
- 4.2: Necessidades e expectativas de partes interessadas
- 4.3: Escopo do sistema de gestão ambiental
- 4.4: Sistema de gestão ambiental
- 5.1: Liderança e comprometimento
- 5.2: Política ambiental
- 6.1: Ações para abordar riscos e oportunidades
- 6.1.2: Aspectos ambientais
- 6.1.3: Requisitos legais e outros requisitos
- 6.2: Objetivos ambientais e planejamento para alcançá-los
- 7.2: Competência
- 7.4: Comunicação
- 8.1: Planejamento e controle operacional
- 8.2: Preparação e resposta a emergências
- 9.1: Monitoramento, medição, análise e avaliação
- 9.2: Auditoria interna
- 10.2: Não conformidade e ação corretiva

ISO 45001:2018 - Saúde e Segurança Ocupacional:
- 4.1: Entendendo a organização e seu contexto
- 4.2: Necessidades e expectativas de trabalhadores
- 5.1: Liderança e comprometimento
- 5.2: Política de SSO
- 5.3: Papéis, responsabilidades e autoridades
- 5.4: Consulta e participação de trabalhadores
- 6.1: Ações para abordar riscos e oportunidades
- 6.1.2: Identificação de perigos e avaliação de riscos
- 6.1.3: Requisitos legais e outros requisitos
- 7.2: Competência
- 7.3: Conscientização
- 8.1: Planejamento e controle operacional
- 8.1.2: Eliminar perigos e reduzir riscos de SSO
- 8.2: Preparação e resposta a emergências
- 9.1: Monitoramento, medição, análise e avaliação
- 9.2: Auditoria interna
- 10.2: Incidente, não conformidade e ação corretiva

ISO 39001:2012 - Segurança Viária:
- 4.1: Entendendo a organização e seu contexto
- 4.2: Necessidades e expectativas de partes interessadas
- 4.3: Escopo do sistema de gestão de segurança viária
- 5.1: Liderança e comprometimento
- 5.2: Política de segurança viária
- 6.1: Ações para abordar riscos e oportunidades
- 6.2: Objetivos de segurança viária
- 6.3: Fatores de desempenho de segurança viária
- 7.2: Competência
- 7.4: Comunicação
- 8.1: Planejamento e controle operacional
- 8.2: Preparação e resposta a emergências de trânsito
- 9.1: Monitoramento, medição, análise e avaliação
- 10.2: Não conformidade e ação corretiva
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { description, context } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing ISO suggestions for:", description.substring(0, 100));

    const systemPrompt = `Você é um especialista em normas ISO de sistemas de gestão (ISO 9001, ISO 14001, ISO 45001, ISO 39001).

Sua tarefa é analisar a descrição de uma não conformidade e identificar as cláusulas ISO mais relevantes.

${ISO_CLAUSES_REFERENCE}

REGRAS:
1. Retorne no máximo 5 sugestões, ordenadas por relevância
2. Cada sugestão deve ter um score de confiança de 0 a 100
3. O score deve refletir quão relevante a cláusula é para o problema descrito
4. Priorize cláusulas diretamente relacionadas ao problema
5. Se o problema envolve mais de uma norma, inclua cláusulas de diferentes normas
6. Use o formato de ID da norma: ISO_9001, ISO_14001, ISO_45001, ISO_39001`;

    const userPrompt = `Analise esta não conformidade e sugira as cláusulas ISO mais relevantes:

Descrição: ${description}
${context?.title ? `Título: ${context.title}` : ''}
${context?.category ? `Categoria: ${context.category}` : ''}
${context?.sector ? `Setor: ${context.sector}` : ''}

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_iso_clauses",
              description: "Retorna sugestões de cláusulas ISO relevantes para a não conformidade",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        standard: { 
                          type: "string", 
                          enum: ["ISO_9001", "ISO_14001", "ISO_45001", "ISO_39001"],
                          description: "ID da norma ISO"
                        },
                        clause_number: { 
                          type: "string",
                          description: "Número da cláusula (ex: 7.2, 8.4)"
                        },
                        clause_title: {
                          type: "string",
                          description: "Título da cláusula"
                        },
                        confidence: { 
                          type: "number",
                          description: "Score de confiança de 0 a 100"
                        }
                      },
                      required: ["standard", "clause_number", "confidence"],
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
        tool_choice: { type: "function", function: { name: "suggest_iso_clauses" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_iso_clauses") {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Suggestions:", result.suggestions?.length || 0);

    return new Response(
      JSON.stringify({ suggestions: result.suggestions || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in nc-iso-suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
