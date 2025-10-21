import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buildCompanyContext } from '../_shared/company-context-builder.ts'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { document_id, generate_visualizations } = await req.json()
    console.log('Generating insights for document:', document_id);

    // Get document
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    // Download file
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    // Extract content based on file type
    let extractedContent = '';
    let imageBase64 = '';

    if (document.file_type === 'application/pdf') {
      const parseResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/parse-chat-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          filePath: document.file_path,
          fileType: document.file_type
        })
      });

      if (parseResponse.ok) {
        const parseResult = await parseResponse.json();
        extractedContent = parseResult.content || '';
      }
    } else if (document.file_type.startsWith('image/')) {
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageBase64 = `data:${document.file_type};base64,${base64}`;
    } else if (document.file_type.includes('spreadsheet') || document.file_type.includes('excel')) {
      // Call advanced document extractor for Excel files
      const extractResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/advanced-document-extractor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: document.file_path,
          fileType: document.file_type
        })
      });

      if (extractResponse.ok) {
        const extractResult = await extractResponse.json();
        extractedContent = JSON.stringify(extractResult.structuredData);
      }
    }

    // Build company context for contextual analysis
    const context = await buildCompanyContext(supabaseClient, document.company_id);
    
    console.log('Company context built, calling AI for insights...');

    // Enhanced analysis prompt with company context
    const analysisPrompt = `
Você é um analista ESG sênior especializado em sustentabilidade corporativa com conhecimento profundo do sistema Daton.

CONTEXTO DA EMPRESA:
Nome: ${context.company.name}
Emissões Totais (histórico): ${context.current_data.total_emissions.toFixed(2)} tCO2e
Emissões Médias/Mês: ${context.historical_patterns.average_emissions_per_month.toFixed(2)} tCO2e
Fontes de Emissão Ativas: ${context.current_data.emission_sources.length}
Metas ESG Ativas: ${context.current_data.esg_goals.length}
Licenças Ativas: ${context.current_data.active_licenses.length}
Fornecedores: ${context.current_data.suppliers.length}
Funcionários: ${context.current_data.employees_count}

HISTÓRICO DE PROCESSAMENTO:
Total de documentos: ${context.historical_patterns.processing_stats.total_documents}
Taxa de aprovação automática: ${context.historical_patterns.processing_stats.total_documents > 0 
  ? ((context.historical_patterns.processing_stats.auto_approved / context.historical_patterns.processing_stats.total_documents) * 100).toFixed(1)
  : 0}%

DOCUMENTO ATUAL:
Tipo: ${document.file_type}
Nome: ${document.file_name}

MISSÃO:
Analise o documento no CONTEXTO dos dados históricos da empresa e forneça:

1. **Resumo Executivo** (2-3 frases contextualizadas)
   - Compare com dados históricos
   - Identifique desvios significativos

2. **Principais Descobertas** (3-5 insights acionáveis)
   - Relacione com metas ESG existentes
   - Compare com médias históricas
   - Identifique tendências

3. **Análise Comparativa**
   - Compare valores com benchmarks internos
   - Identifique anomalias (valores > 2x média ou < 0.5x média)
   - Calcule desvios percentuais

4. **Insights Preditivos**
   - Projete impacto futuro baseado em tendências
   - Estime atingimento de metas
   - Preveja riscos potenciais

5. **Recomendações Estratégicas** (3-5 ações priorizadas)
   - Quick wins (curto prazo)
   - Ações estratégicas (médio/longo prazo)
   - Ações urgentes (se anomalias críticas)

6. **Score de Qualidade dos Dados** (0-100)
   - Completude, precisão, consistência
   - Lista de problemas encontrados

${generate_visualizations ? '7. **Visualizações Sugeridas** com dados processados' : ''}

CONTEÚDO DO DOCUMENTO:
${extractedContent.substring(0, 15000)}

Seja ESPECÍFICO, CONTEXTUALIZADO e ACIONÁVEL. Use números reais da empresa para comparações.`;

    const aiMessages: any[] = [
      { role: "system", content: "Você é um analista de dados ESG especializado em gerar insights acionáveis." },
      { role: "user", content: analysisPrompt }
    ];

    if (imageBase64) {
      aiMessages[1].content = [
        { type: "text", text: analysisPrompt },
        { type: "image_url", image_url: { url: imageBase64 } }
      ];
    }

    const toolDefinition = {
      type: "function",
      function: {
        name: "generate_document_insights",
        description: "Gera insights completos sobre o documento analisado",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Resumo executivo do documento (2-3 frases)"
            },
            key_findings: {
              type: "array",
              items: { type: "string" },
              description: "Lista de 3-5 descobertas principais"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Lista de 3-5 recomendações acionáveis"
            },
            data_quality: {
              type: "object",
              properties: {
                score: {
                  type: "number",
                  description: "Score de qualidade dos dados (0-100)"
                },
                issues: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de problemas de qualidade identificados"
                }
              }
            },
            visualizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["bar", "line", "pie", "table"],
                    description: "Tipo de visualização"
                  },
                  title: {
                    type: "string",
                    description: "Título do gráfico"
                  },
                  data: {
                    type: "array",
                    description: "Dados para o gráfico no formato [{name: string, value: number}]"
                  }
                }
              },
              description: "Lista de visualizações sugeridas com dados"
            },
            extracted_fields: {
              type: "object",
              description: "Campos principais extraídos do documento"
            },
            field_confidence: {
              type: "object",
              description: "Confiança para cada campo extraído (0.0-1.0)"
            },
            target_tables: {
              type: "array",
              items: { type: "string" },
              description: "Tabelas do sistema onde os dados devem ser inseridos"
            }
          },
          required: ["summary", "key_findings", "recommendations", "data_quality"]
        }
      }
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: aiMessages,
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "generate_document_insights" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const insights = JSON.parse(toolCall.function.arguments);

    console.log('Insights generated successfully');

    return new Response(JSON.stringify({
      insights: {
        summary: insights.summary,
        key_findings: insights.key_findings,
        recommendations: insights.recommendations,
        data_quality: insights.data_quality
      },
      visualizations: insights.visualizations || [],
      extracted_data: {
        fields: insights.extracted_fields || {},
        confidence: insights.field_confidence || {},
        target_tables: insights.target_tables || []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
