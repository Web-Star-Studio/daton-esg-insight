const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleAnalyzeInnovationData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Innovation Data] Starting...');

  // 1. Buscar relatório
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  // 2. Processar documentos
  const documentContents = await Promise.all(
    documents.map(async (doc: any) => {
      if (doc.extracted_text) {
        return {
          category: doc.category,
          content: doc.extracted_text.substring(0, 5000)
        };
      }
      return null;
    })
  ).then(results => results.filter(Boolean));

  // 3. Calcular indicadores derivados
  const derivedIndicators = {
    innovation_intensity: quantitative_data.total_innovation_investment > 0 && report.companies?.annual_revenue
      ? ((quantitative_data.total_innovation_investment / report.companies.annual_revenue) * 100).toFixed(2)
      : 0,
    patents_per_rd_investment: quantitative_data.rd_annual_investment > 0 && quantitative_data.patents_filed
      ? (quantitative_data.patents_filed / (quantitative_data.rd_annual_investment / 1000000)).toFixed(2)
      : 0,
    environmental_roi: quantitative_data.technologies_investment_total > 0 && quantitative_data.cost_savings_annual
      ? ((quantitative_data.cost_savings_annual / quantitative_data.technologies_investment_total) * 100).toFixed(1)
      : 0,
    partnership_effectiveness: quantitative_data.total_partnerships > 0 && quantitative_data.collaborative_projects_count
      ? (quantitative_data.collaborative_projects_count / quantitative_data.total_partnerships).toFixed(1)
      : 0,
  };

  // 4. Chamar Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Gestão de Inovação e relatórios GRI Standards.

OBJETIVO: Analisar dados de Inovação e Desenvolvimento Tecnológico e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS GRI APLICÁVEIS:
- GRI 203-1: Investimentos em Infraestrutura e Serviços
- GRI 203-2: Impactos Econômicos Indiretos Significativos

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES:
1. SEMPRE incluir números específicos no texto
2. Estruturar em seções: Estratégia de Inovação, Investimentos, Tecnologias, Parcerias, Impactos
3. Destacar inovações sustentáveis e impactos ambientais/econômicos
4. Mencionar ROI e benchmarks quando possível
5. Texto de 1200-1600 palavras`
        },
        {
          role: 'user',
          content: `Analise e gere texto para "Inovação e Desenvolvimento Tecnológico":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_innovation_content',
          description: 'Analisa dados de inovação e gera texto',
          parameters: {
            type: 'object',
            properties: {
              generated_text: { type: 'string', description: 'Texto completo 1200-1600 palavras' },
              confidence_score: { type: 'number', description: 'Confiança 0-100' },
              key_points: { type: 'array', items: { type: 'string' } },
              quantitative_highlights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator: { type: 'string' },
                    value: { type: 'string' },
                    unit: { type: 'string' },
                    context: { type: 'string' }
                  }
                }
              },
              gri_coverage: { type: 'array', items: { type: 'string' } }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_innovation_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Innovation Data] Error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Innovation Data] Complete');

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
