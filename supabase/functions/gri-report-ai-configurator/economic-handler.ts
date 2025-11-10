export async function handleAnalyzeEconomicData(supabase: any, body: any) {
  const { report_id, quantitative_data } = body;

  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Analise dados econômicos GRI 201-205 e gere texto descritivo com números específicos.`
        },
        {
          role: 'user',
          content: `Dados: ${JSON.stringify(quantitative_data)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_economic_content',
          parameters: {
            type: 'object',
            properties: {
              generated_text: { type: 'string' },
              confidence_score: { type: 'number' },
              gri_coverage: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_economic_content' } }
    })
  });

  const result = await aiResponse.json();
  return JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);
}
