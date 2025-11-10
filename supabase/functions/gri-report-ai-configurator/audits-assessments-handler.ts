import { corsHeaders } from '../_shared/cors.ts';

export async function handleAnalyzeAuditsAssessmentsData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Audits Assessments Data] Starting...');

  try {
    // 1. Fetch current report
    const { data: report } = await supabase
      .from('gri_reports')
      .select('*, companies(*)')
      .eq('id', report_id)
      .single();

    // 2. Calculate derived indicators
    const derivedIndicators = {
      audit_effectiveness_score: (
        (quantitative_data.non_conformities_closure_rate || 0) * 0.5 +
        ((quantitative_data.external_audits_count || 0) >= 1 ? 25 : 0) +
        ((form_data.certifications_count || 0) >= 3 ? 25 : 0)
      ).toFixed(1),
      
      certification_maturity: (form_data.certifications_count || 0) >= 5 ? 'Alto' :
                              (form_data.certifications_count || 0) >= 2 ? 'Médio' : 'Baixo',
      
      verification_credibility: form_data.has_external_verification && 
                               form_data.verification_level === 'Reasonable' ? 'Alto' :
                               form_data.has_external_verification ? 'Médio' : 'Baixo',
      
      corrective_action_efficiency: quantitative_data.non_conformities_closure_rate >= 80 ? 'Excelente' :
                                    quantitative_data.non_conformities_closure_rate >= 60 ? 'Boa' :
                                    quantitative_data.non_conformities_closure_rate >= 40 ? 'Regular' : 'Insuficiente',
      
      impact_assessment_coverage: (
        (form_data.environmental_impact_assessment_done ? 14.3 : 0) +
        (form_data.social_impact_assessment_done ? 14.3 : 0) +
        (form_data.human_rights_impact_assessment_done ? 14.3 : 0) +
        (form_data.lifecycle_assessment_done ? 14.3 : 0) +
        (form_data.carbon_footprint_calculated ? 14.3 : 0) +
        (form_data.water_footprint_calculated ? 14.3 : 0) +
        (form_data.biodiversity_assessment_done ? 14.2 : 0)
      ).toFixed(1),
    };

    // 3. Process documents
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

    // 4. Call Lovable AI
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
            content: `Você é um especialista em Auditorias, Certificações e Verificação de Relatórios ESG (GRI 2-5, ISAE 3000, AA1000AS, ISSA 5000).

OBJETIVO: Analisar dados de Auditorias e Avaliações e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS APLICÁVEIS:

**GRI 2-5 - Verificação Externa:**
Reportar se o relatório foi verificado externamente, incluindo:
a. Se o relatório foi verificado externamente
b. Descrição da política e prática de buscar verificação externa, incluindo se e como o mais alto órgão de governança está envolvido
c. Se verificado externamente:
   - Link ou referência à declaração de verificação externa
   - O que foi verificado e em que base (padrão de verificação usado, nível de asseguração obtido)
   - A relação entre a organização e o provedor de verificação

**ISAE 3000 (Revised):**
Padrão internacional para engajamentos de asseguração além de auditorias e revisões de informações financeiras históricas. Aplica-se a verificações de relatórios de sustentabilidade.

**AA1000 Assurance Standard (AA1000AS):**
Padrão de asseguração focado em sustentabilidade baseado nos Princípios de AccountAbility (Inclusividade, Materialidade, Responsividade, Impacto).

**ISSA 5000:**
Novo padrão global da IAASB para asseguração de relatórios de sustentabilidade (efetivo a partir de 2025).

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS** no texto narrativo
2. Exemplos de redação:
   - "Foram realizadas ${quantitative_data.internal_audits_count} auditorias internas e ${quantitative_data.external_audits_count} auditorias externas no período de reporte."
   - "A organização possui certificações ativas relevantes ao setor."
   - "O relatório de sustentabilidade foi verificado externamente por ${form_data.verification_provider}, utilizando o padrão ${form_data.verification_standard} com nível de asseguração ${form_data.verification_level}."
   - "Das ${quantitative_data.total_non_conformities} não conformidades identificadas, ${quantitative_data.closed_non_conformities} foram resolvidas, resultando em taxa de fechamento de ${quantitative_data.non_conformities_closure_rate}%."
3. Estruturar em seções:
   - Programa de Auditorias Internas e Externas
   - Certificações e Selos de Conformidade
   - Verificação Externa do Relatório (GRI 2-5) - DETALHADO
   - Avaliações de Impacto Socioambiental
   - Gestão de Não Conformidades e Ações Corretivas
   - Maturidade do Sistema de Auditorias
4. Contextualize com práticas do setor
5. Destacar independência e credibilidade das verificações
6. Ser transparente sobre limitações e áreas de melhoria

IMPORTANTE:
- Sempre mencionar todos os padrões de verificação utilizados
- Incluir dados de todas as auditorias realizadas
- Demonstrar envolvimento do Conselho/Alta Direção
- Contextualizar taxa de fechamento de não conformidades`
          },
          {
            role: 'user',
            content: `Analise os seguintes dados e gere texto descritivo completo para "Auditorias e Avaliações":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**CONTEÚDO DOS DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere um texto de 1400-1800 palavras integrando TODOS os dados numéricos de forma profissional, transparente e estratégica, com FOCO ESPECIAL em GRI 2-5 (Verificação Externa).`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_audits_assessments_content',
            description: 'Analisa dados de auditorias e avaliações e gera texto com números específicos',
            parameters: {
              type: 'object',
              properties: {
                generated_text: {
                  type: 'string',
                  description: 'Texto descritivo completo (1400-1800 palavras) com TODOS os números'
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
                external_verification_details: {
                  type: 'object',
                  properties: {
                    provider: { type: 'string' },
                    standard: { type: 'string' },
                    level: { type: 'string' },
                    coverage: { type: 'string' },
                    governance_involvement: { type: 'boolean' }
                  },
                  description: 'Detalhes da verificação externa (GRI 2-5)'
                },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pontos fortes do sistema de auditorias'
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
        tool_choice: { type: 'function', function: { name: 'analyze_audits_assessments_content' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Analyze Audits Assessments Data] Error:', errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

    console.log('[Analyze Audits Assessments Data] Complete');

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Analyze Audits Assessments Data] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
