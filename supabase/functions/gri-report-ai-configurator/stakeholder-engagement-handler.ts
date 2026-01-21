const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleAnalyzeStakeholderEngagementData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Stakeholder Engagement Data] Starting...');

  // 1. Buscar relatório
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  // 2. Calcular indicadores derivados
  const derivedIndicators = {
    stakeholder_coverage_rate: quantitative_data.total_stakeholders_mapped > 0 
      ? ((quantitative_data.stakeholders_monthly_engagement + quantitative_data.stakeholders_quarterly_engagement) / quantitative_data.total_stakeholders_mapped * 100).toFixed(1)
      : 0,
    critical_stakeholder_percentage: quantitative_data.total_stakeholders_mapped > 0
      ? ((quantitative_data.critical_stakeholders / quantitative_data.total_stakeholders_mapped) * 100).toFixed(1)
      : 0,
    high_engagement_rate: quantitative_data.total_stakeholders_mapped > 0
      ? ((quantitative_data.stakeholders_monthly_engagement / quantitative_data.total_stakeholders_mapped) * 100).toFixed(1)
      : 0,
    communication_diversity_index: Object.keys(quantitative_data.preferred_communication_channels || {}).length,
    survey_effectiveness: quantitative_data.survey_response_rate_calculated > 50 ? 'Alta' : 
                         quantitative_data.survey_response_rate_calculated > 30 ? 'Média' : 'Baixa',
  };

  // 3. Chamar Lovable AI
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
          content: `Você é um especialista em Engajamento de Stakeholders e relatórios GRI Standards.

OBJETIVO: Analisar dados de Relacionamento com Stakeholders e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS GRI APLICÁVEIS:

**GRI 2-29 - Abordagem para Engajamento de Stakeholders:**
Reportar a abordagem da organização para engajar stakeholders, incluindo:
a. Grupos de stakeholders identificados
b. Objetivo do engajamento
c. Métodos de engajamento (reuniões, consultas, pesquisas, parcerias)
d. Frequência de engajamento por grupo
e. Como o engajamento informa decisões estratégicas e operacionais
f. Se e como resultados de engajamento são comunicados de volta aos stakeholders

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS** no texto narrativo
2. Exemplos de redação:
   - "A organização mapeou ${quantitative_data.total_stakeholders_mapped} stakeholders distribuídos em ${Object.keys(quantitative_data.stakeholders_by_category || {}).length} categorias principais."
   - "Foram identificados ${quantitative_data.critical_stakeholders} stakeholders críticos (${derivedIndicators.critical_stakeholder_percentage}% do total)."
   - "Score médio de engajamento: ${quantitative_data.average_engagement_score}/100."
3. Estruturar em seções:
   - Metodologia de Identificação e Mapeamento
   - Grupos de Stakeholders Prioritários
   - Canais e Frequência de Comunicação
   - Mecanismos de Consulta e Feedback
   - Pesquisas e Avaliações de Satisfação
   - Parcerias e Fóruns Setoriais
   - Como o Engajamento Influencia Decisões
4. Destacar:
   - Mecanismos formais de comunicação
   - Participação em iniciativas multi-stakeholder
   - Resultados de pesquisas
5. Ser transparente sobre áreas de melhoria
6. Sugira inserção de gráficos e matrizes visuais`
        },
        {
          role: 'user',
          content: `Analise os seguintes dados e gere texto descritivo completo para "Relacionamento com Stakeholders":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

Gere um texto de 1000-1400 palavras integrando TODOS os dados numéricos de forma profissional, fluente e estratégica.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_stakeholder_engagement_content',
          description: 'Analisa dados de stakeholder engagement e gera texto com números específicos',
          parameters: {
            type: 'object',
            properties: {
              generated_text: {
                type: 'string',
                description: 'Texto descritivo completo (1000-1400 palavras) com TODOS os números'
              },
              confidence_score: {
                type: 'number',
                description: 'Confiança 0-100'
              },
              key_points: {
                type: 'array',
                items: { type: 'string' },
                description: 'Principais pontos com números'
              },
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
                },
                description: 'Destaques quantitativos'
              },
              stakeholder_matrix_data: {
                type: 'object',
                description: 'Dados para matriz de stakeholders',
                properties: {
                  critical: { type: 'number' },
                  manage_closely: { type: 'number' },
                  keep_informed: { type: 'number' },
                  monitor: { type: 'number' }
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
                },
                description: 'Sugestões de gráficos'
              },
              engagement_highlights: {
                type: 'array',
                items: { type: 'string' },
                description: 'Destaques de engajamento'
              },
              improvement_areas: {
                type: 'array',
                items: { type: 'string' },
                description: 'Áreas de melhoria'
              },
              gri_coverage: {
                type: 'array',
                items: { type: 'string' },
                description: 'Indicadores GRI cobertos'
              }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'quantitative_highlights', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_stakeholder_engagement_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Stakeholder Engagement Data] Error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Stakeholder Engagement Data] Complete');

  // 4. Salvar no banco
  await supabase
    .from('gri_stakeholder_engagement_data')
    .update({
      ai_analysis: analysis,
      ai_generated_text: analysis.generated_text,
      ai_confidence_score: analysis.confidence_score,
      ai_last_analyzed_at: new Date().toISOString(),
    })
    .eq('report_id', report_id);

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
