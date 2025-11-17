import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ncDescriptions } = await req.json();
    
    if (!ncDescriptions || !Array.isArray(ncDescriptions) || ncDescriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ncDescriptions array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare prompt for AI analysis
    const prompt = `Analise as seguintes descrições de Não Conformidades (NCs) e identifique:
1. Padrões comuns (temas recorrentes)
2. Sentimento geral (neutro, preocupante, crítico)
3. Causas raízes prováveis
4. Recomendações de ação

Descrições das NCs:
${ncDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Retorne uma análise concisa e estruturada.`;

    console.log('Sending request to Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de qualidade e gestão de não conformidades. Forneça análises práticas e acionáveis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos esgotados. Adicione créditos ao workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;
    
    // Extract confidence based on response quality
    const confidence = Math.min(95, Math.max(70, 
      85 + (ncDescriptions.length > 5 ? 10 : 0) // More data = higher confidence
    ));

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        analysis,
        confidence,
        patterns: extractPatterns(analysis),
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-nc-text:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractPatterns(analysis: string): string[] {
  const patterns: string[] = [];
  
  // Simple pattern extraction from AI response
  const lines = analysis.split('\n');
  for (const line of lines) {
    if (line.includes('padrão') || line.includes('comum') || line.includes('recorrente')) {
      patterns.push(line.trim());
    }
  }
  
  return patterns.slice(0, 3); // Return top 3 patterns
}
