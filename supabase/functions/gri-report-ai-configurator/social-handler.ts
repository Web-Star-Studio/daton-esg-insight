const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleAnalyzeSocialData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Social Data] Starting...');

  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

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

  const derivedIndicators = {
    gender_diversity_ratio: quantitative_data.total_employees > 0
      ? (quantitative_data.employees_women / quantitative_data.total_employees * 100).toFixed(1)
      : 0,
    training_investment_per_employee: quantitative_data.training_investment_total && quantitative_data.total_employees
      ? (quantitative_data.training_investment_total / quantitative_data.total_employees).toFixed(2)
      : 0,
  };

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Gestão de Pessoas e relatórios GRI Standards (401-406, 413).

OBJETIVO: Analisar dados de Desempenho Social e gerar texto descritivo profissional com NÚMEROS ESPECÍFICOS.

NORMAS GRI: 401 (Emprego), 403 (Saúde e Segurança), 404 (Treinamento), 405 (Diversidade), 406 (Não Discriminação), 413 (Comunidades Locais).

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}

DIRETRIZES:
1. SEMPRE incluir números específicos (ex: "234 colaboradores, 54% mulheres")
2. Mencionar taxas, percentuais e indicadores quantitativos
3. Contextualizar com comparações e benchmarks
4. Destacar políticas formais e certificações
5. Estrutura: emprego → saúde/segurança → treinamento → diversidade → projetos sociais
6. Usar linguagem humanizada mas profissional
7. Sugerir gráficos relevantes`
        },
        {
          role: 'user',
          content: `Analise e gere texto descritivo completo para "Desempenho Social":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere texto de 1200-1600 palavras integrando TODOS os dados numéricos.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_social_content',
          description: 'Analisa dados sociais e gera texto com números específicos',
          parameters: {
            type: 'object',
            properties: {
              generated_text: { type: 'string', description: 'Texto completo (1200-1600 palavras)' },
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
              suggested_charts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    title: { type: 'string' },
                    data_points: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              gri_coverage: { type: 'array', items: { type: 'string' } }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_social_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Social Data] Error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Social Data] Complete');

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
