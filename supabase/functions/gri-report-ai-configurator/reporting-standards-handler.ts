export async function handleAnalyzeReportingStandardsData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Reporting Standards Data] Starting...');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    // 1. Buscar relatório atual
    const { data: report } = await supabase
      .from('gri_reports')
      .select('*, companies(*)')
      .eq('id', report_id)
      .single();

    // 2. Calcular indicadores derivados
    const derivedIndicators = {
      reporting_consistency_score: quantitative_data.report_frequency === 'Anual' ? 100 : 
                                   quantitative_data.report_frequency === 'Bienal' ? 70 : 40,
      
      framework_diversity_index: (form_data.frameworks_adopted?.length || 0) * 20,
      
      assurance_maturity: form_data.has_external_assurance && form_data.assurance_level === 'Reasonable' ? 'Alto' :
                         form_data.has_external_assurance ? 'Médio' : 'Baixo',
      
      benchmark_position: quantitative_data.company_score && quantitative_data.sector_average_score
        ? quantitative_data.company_score > quantitative_data.sector_average_score ? 'Acima da Média' : 'Abaixo da Média'
        : 'Não Disponível',
      
      gri_completeness_rate: quantitative_data.gri_universal_standards_coverage || 0,
      
      evolution_trajectory: quantitative_data.years_of_reporting >= 5 ? 'Consolidado' :
                           quantitative_data.years_of_reporting >= 2 ? 'Em Desenvolvimento' : 'Inicial',
    };

    // 3. Processar documentos
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
            content: `Você é um especialista em Relatórios de Sustentabilidade e frameworks ESG (GRI, SASB, TCFD, ABNT PR 2030).

OBJETIVO: Analisar dados de Práticas de Reporte e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS GRI APLICÁVEIS:

**GRI 2-3 - Período de Reporte, Frequência e Ponto de Contato:**
a. Período de reporte e frequência
b. Data de publicação do relatório anterior
c. Ponto de contato para questões sobre o relatório

**GRI 2-4 - Reexpressão de Informações:**
Reportar se há reexpressões de informações de relatórios anteriores e as razões

**GRI 2-5 - Verificação Externa:**
Reportar política e prática de buscar verificação externa, incluindo:
a. Se o relatório foi verificado externamente
b. Descrição da política e prática de verificação
c. Se o mais alto órgão de governança está envolvido

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS** no texto narrativo
2. Exemplos de redação:
   - "A organização publica relatórios de sustentabilidade desde ${quantitative_data.first_report_year}, totalizando ${quantitative_data.total_reports_published} edições."
   - "O relatório atual cobre ${quantitative_data.total_gri_indicators_reported} indicadores GRI, sendo ${quantitative_data.mandatory_indicators_reported} obrigatórios e ${quantitative_data.optional_indicators_reported} opcionais."
   - "Verificação externa realizada por ${form_data.assurance_provider} com nível de asseguração ${form_data.assurance_level}, cobrindo ${form_data.assurance_coverage_percentage}% do relatório."
   - "Benchmarking setorial: score de ${quantitative_data.company_score} vs média do setor de ${quantitative_data.sector_average_score}."
3. Estruturar em seções:
   - Histórico e Evolução do Reporte
   - Frameworks e Padrões Adotados
   - Período de Reporte e Frequência (GRI 2-3)
   - Cobertura de Indicadores e Content Index
   - Verificação Externa e Asseguração (GRI 2-5)
   - Reexpressão de Informações (GRI 2-4)
   - Benchmarking e Posicionamento Setorial
   - Nível de Maturidade do Reporte
   - Reconhecimento e Prêmios
   - Planos de Melhoria Contínua
4. Contextualize com:
   - Evolução da cobertura de indicadores ao longo do tempo
   - Comparação com benchmarks do setor
   - Aderência a múltiplos frameworks (relatório integrado)
   - Feedbacks de stakeholders
5. Destacar:
   - Consistência temporal do reporte
   - Transparência e rastreabilidade
   - Alinhamento com melhores práticas internacionais
   - Compromisso com verificação externa
6. Ser transparente sobre:
   - Gaps de cobertura de indicadores
   - Áreas não verificadas
   - Reexpressões de dados anteriores
   - Limitações e planos de melhoria

IMPORTANTE:
- Sempre mencionar frameworks específicos (GRI 2021, SASB v1.2, TCFD 2023)
- Incluir números concretos de indicadores, anos, percentuais
- Contextualizar nível de maturidade (Iniciante/Emergente/Estabelecido/Liderança)
- Demonstrar evolução temporal`
          },
          {
            role: 'user',
            content: `Analise os seguintes dados e gere texto descritivo completo para "Relatórios e Normas":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**CONTEÚDO DOS DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere um texto de 1200-1600 palavras integrando TODOS os dados numéricos de forma profissional, transparente e estratégica.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_reporting_standards_content',
            description: 'Analisa dados de práticas de reporte e gera texto com números específicos',
            parameters: {
              type: 'object',
              properties: {
                generated_text: {
                  type: 'string',
                  description: 'Texto descritivo completo (1200-1600 palavras) com TODOS os números'
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
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pontos fortes do reporte'
                },
                improvement_areas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Áreas de melhoria identificadas'
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
        tool_choice: { type: 'function', function: { name: 'analyze_reporting_standards_content' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Analyze Reporting Standards Data] Error:', errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

    console.log('[Analyze Reporting Standards Data] Complete');

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Analyze Reporting Standards Data] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
