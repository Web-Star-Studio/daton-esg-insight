import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { aiCall } from "../_shared/ai-logger.ts";

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

Tipos de norma a considerar:
- Leis Federais (ex: Lei 12.305/2010 - Política Nacional de Resíduos Sólidos, Lei 9.605/1998 - Crimes Ambientais, Lei 9.433/1997 - Recursos Hídricos)
- Resoluções CONAMA (ex: CONAMA 237/97 - Licenciamento, CONAMA 357/05 - Águas, CONAMA 313/02 - Resíduos Industriais, CONAMA 430/11 - Efluentes)
- NBRs ABNT (ex: NBR 10004 - Resíduos sólidos)
- Decretos Federais e Resoluções de agências (ANA, IBAMA)

Para URL, retorne SEMPRE a URL completa com scheme (https://...) ou null. Nunca retorne hostnames sem scheme.
- Leis federais: https://www.planalto.gov.br/ccivil_03/_ato.../[ano]/lei/lXXXX.htm
- Decretos federais: https://www.planalto.gov.br/ccivil_03/_ato.../[ano]/decreto/dXXXXX.htm
- CONAMA: https://conama.mma.gov.br/?id=conama&pesquisa=resolucao (ou null se não souber a URL exata)
- NBRs (ABNT é pago): null

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

type AiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!Deno.env.get("LOVABLE_API_KEY")) {
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

  try {
    const aiResponse = await aiCall<AiResponse>(
      {
        functionName: "laia-legislation-suggester",
        featureTag: "laia-legislation",
        companyId: body.company_id ?? null,
        userId: body.user_id ?? null,
        meta: { sector: context.sector_name ?? null },
      },
      {
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      },
    );

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
    const message = error instanceof Error ? error.message : String(error);
    const status =
      (error as { status?: number })?.status ?? null;
    console.error("laia-legislation-suggester error:", message);

    if (status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes.", suggestions: [] }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos do workspace Lovable AI insuficientes.", suggestions: [] }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (status && status >= 500) {
      return new Response(
        JSON.stringify({ error: `AI Gateway error: ${status}`, suggestions: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
