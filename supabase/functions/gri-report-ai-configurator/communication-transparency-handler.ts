export async function handleAnalyzeCommunicationTransparencyData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Communication Transparency Data] Starting...');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    // 1. Fetch current report
    const { data: report } = await supabase
      .from('gri_reports')
      .select('*, companies(*)')
      .eq('id', report_id)
      .single();

    if (!report) {
      throw new Error('Report not found');
    }

    // 2. Calculate derived indicators
    const derivedIndicators = {
      communication_effectiveness_score: (
        (quantitative_data.response_rate_percentage || 0) * 0.4 +
        (quantitative_data.aa1000ses_responsiveness_score || 0) * 0.3 +
        (quantitative_data.aa1000ses_inclusivity_score || 0) * 0.3
      ).toFixed(1),
      
      transparency_index: (
        (form_data.has_public_esg_report ? 25 : 0) +
        (form_data.accessibility_compliance ? 25 : 0) +
        (form_data.stakeholder_feedback_collected ? 25 : 0) +
        ((form_data.languages_available || 0) >= 2 ? 25 : 0)
      ),
      
      multi_channel_approach: form_data.communication_channels?.length >= 4 ? 'Diversificado' : 
                              form_data.communication_channels?.length >= 2 ? 'Moderado' : 'Limitado',
      
      stakeholder_centricity: quantitative_data.aa1000ses_inclusivity_score >= 70 ? 'Alto' :
                             quantitative_data.aa1000ses_inclusivity_score >= 40 ? 'Médio' : 'Baixo',
      
      digital_maturity: (
        (form_data.communication_channels?.includes('Site Institucional') ? 25 : 0) +
        (form_data.communication_channels?.includes('Redes Sociais') ? 25 : 0) +
        (form_data.communication_channels?.includes('Webinars') ? 25 : 0) +
        ((form_data.report_page_views || 0) > 1000 ? 25 : 0)
      ),
    };

    // 3. Process documents
    const documentContents = await Promise.all(
      (documents || []).map(async (doc: any) => {
        if (doc.extracted_text) {
          return {
            category: doc.category,
            content: doc.extracted_text.substring(0, 5000)
          };
        }
        return null;
      })
    ).then(results => results.filter(Boolean));

    // 4. Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `Você é um especialista em Comunicação Corporativa, Transparência e frameworks de engajamento de stakeholders (GRI 2-29, AA1000SES).

OBJETIVO: Analisar dados de Comunicação e Transparência ESG e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS APLICÁVEIS:

**GRI 2-29 - Abordagem para Engajamento com Stakeholders (aspecto comunicação):**
Reportar a abordagem da organização para engajar com stakeholders, incluindo:
a. Categorias de stakeholders que a organização engaja
b. Propósito do engajamento com cada categoria
c. Como a organização busca engajamento
d. Como os processos de engajamento são informados (frequência, canais)

**AA1000 Stakeholder Engagement Standard (AA1000SES) - Princípios:**
- **Inclusividade**: Identificar e engajar com stakeholders relevantes
- **Materialidade**: Determinar relevância de temas
- **Responsividade**: Responder consistentemente
- **Impacto**: Monitorar e medir impacto

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS**
2. Estruturar em seções claras
3. Contextualizar com evolução temporal
4. Destacar abordagem multicanal
5. Demonstrar alinhamento AA1000SES com scores
6. Ser transparente sobre gaps

Gere um texto de 1200-1600 palavras profissional e estratégico.`
          },
          {
            role: 'user',
            content: `Analise os seguintes dados e gere texto completo:

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
            name: 'analyze_communication_transparency_content',
            description: 'Analisa dados de comunicação e transparência',
            parameters: {
              type: 'object',
              properties: {
                generated_text: {
                  type: 'string',
                  description: 'Texto completo com números'
                },
                confidence_score: {
                  type: 'number',
                  description: 'Confiança 0-100'
                },
                key_points: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Principais pontos'
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
                communication_channels_analysis: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      channel: { type: 'string' },
                      effectiveness: { type: 'string' },
                      reach: { type: 'string' }
                    }
                  },
                  description: 'Análise por canal'
                },
                aa1000ses_assessment: {
                  type: 'object',
                  properties: {
                    inclusivity_rating: { type: 'string' },
                    materiality_rating: { type: 'string' },
                    responsiveness_rating: { type: 'string' },
                    impact_rating: { type: 'string' }
                  },
                  description: 'Avaliação AA1000SES'
                },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pontos fortes'
                },
                improvement_areas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Áreas de melhoria'
                },
                next_steps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Próximos passos'
                },
                gri_coverage: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Indicadores GRI cobertos'
                }
              },
              required: ['generated_text', 'confidence_score', 'key_points', 'quantitative_highlights', 'aa1000ses_assessment', 'gri_coverage']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_communication_transparency_content' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI Error]:', errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

    console.log('[Analyze Communication Transparency Data] Complete');

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Analyze Communication Transparency Data] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
