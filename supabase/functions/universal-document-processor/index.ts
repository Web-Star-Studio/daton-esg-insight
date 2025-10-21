import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildCompanyContext } from '../_shared/company-context-builder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { document_id, mode = 'exploratory' } = await req.json();

    console.log(`Processing document: ${document_id} in ${mode} mode`);

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*, companies(*)')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    console.log(`File downloaded, size: ${fileData.size}`);

    // Extract content based on file type
    let extractedContent = '';
    let hasImage = false;

    if (document.file_type === 'application/pdf') {
      // Call parse-pdf-document function
      const { data: pdfData, error: pdfError } = await supabaseClient.functions.invoke(
        'parse-pdf-document',
        {
          body: { file_path: document.file_path },
        }
      );

      if (!pdfError && pdfData) {
        extractedContent = pdfData.text || '';
        hasImage = pdfData.hasImage || false;
      }
    } else if (
      document.file_type.startsWith('image/') ||
      document.file_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      document.file_type === 'application/vnd.ms-excel'
    ) {
      // Use spreadsheet or image extraction
      const { data: extractData, error: extractError } = await supabaseClient.functions.invoke(
        'parse-chat-document',
        {
          body: { file_path: document.file_path, file_type: document.file_type },
        }
      );

      if (!extractError && extractData) {
        extractedContent = extractData.content || '';
        hasImage = extractData.hasImage || false;
      }
    }

    console.log(`Content extracted, length: ${extractedContent.length}, hasImage: ${hasImage}`);

    // Build comprehensive company context
    const context = await buildCompanyContext(supabaseClient, document.company_id);
    
    console.log('Company context built:', {
      company: context.company.name,
      sources: context.current_data.emission_sources.length,
      total_emissions: context.current_data.total_emissions,
    });

    // Call Lovable AI for intelligent analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiMessages = [
      {
        role: 'system',
        content: `Você é um especialista sênior em análise de documentos ESG e sustentabilidade com conhecimento profundo do sistema Daton.

CONTEXTO COMPLETO DA EMPRESA:
${JSON.stringify(context, null, 2)}

MODO EXPLORATÓRIO INTELIGENTE ATIVADO:

1. **EXTRAÇÃO CONTEXTUALIZADA**
   - Extraia TODOS os dados estruturados
   - Compare valores com dados históricos da empresa
   - Identifique se valores estão dentro do esperado (±30% da média)
   - Detecte anomalias críticas (valores > 2x ou < 0.5x média histórica)

2. **CLASSIFICAÇÃO INTELIGENTE**
   - Use dados históricos para inferir categoria do documento
   - Identifique padrões recorrentes nos tipos de documentos processados
   - Calcule score de relevância ESG baseado no contexto empresarial

3. **MAPEAMENTO CONTEXTUAL**
   - Sugira tabelas considerando dados já existentes
   - Identifique relações com fontes de emissão existentes
   - Detecte potenciais duplicatas
   - Valide se dados complementam metas ESG ativas

4. **INSIGHTS PREDITIVOS**
   - Projete impacto nos totais de emissões
   - Estime impacto no atingimento de metas
   - Identifique riscos ou oportunidades

5. **RECOMENDAÇÕES ESTRATÉGICAS**
   - Ações baseadas em gaps identificados
   - Priorização por impacto vs esforço
   - Alertas para licenças próximas do vencimento

DADOS HISTÓRICOS PARA COMPARAÇÃO:
- Emissões médias/mês: ${context.historical_patterns.average_emissions_per_month.toFixed(2)} tCO2e
- Total de fontes: ${context.current_data.emission_sources.length}
- Taxa de processamento automático: ${context.historical_patterns.processing_stats.total_documents > 0 
  ? ((context.historical_patterns.processing_stats.auto_approved / context.historical_patterns.processing_stats.total_documents) * 100).toFixed(1)
  : 0}%

TABELAS DISPONÍVEIS NO SISTEMA:
${context.schema_information.available_tables.join(', ')}

Empresa: ${context.company.name}
Tipo de documento: ${document.file_type}
Nome do arquivo: ${document.file_name}

Responda SEMPRE usando a estrutura de tool calling fornecida.`,
      },
      {
        role: 'user',
        content: extractedContent || 'Documento vazio ou não foi possível extrair conteúdo.',
      },
    ];

    console.log('Calling Lovable AI for intelligent analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: aiMessages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_unstructured_document',
              description: 'Analisa documento não estruturado e extrai todos os dados possíveis',
              parameters: {
                type: 'object',
                properties: {
                  document_category: {
                    type: 'string',
                    description: 'Categoria identificada do documento',
                  },
                  relevance_score: {
                    type: 'number',
                    description: 'Score de relevância para ESG (0-100)',
                  },
                  extracted_entities: {
                    type: 'array',
                    description: 'Todas as entidades/dados estruturados extraídos',
                    items: {
                      type: 'object',
                      properties: {
                        entity_type: { type: 'string' },
                        entity_name: { type: 'string' },
                        value: { type: 'string' },
                        unit: { type: 'string' },
                        confidence: { type: 'number' },
                      },
                    },
                  },
                  potential_uses: {
                    type: 'array',
                    description: 'Possíveis usos dos dados',
                    items: {
                      type: 'object',
                      properties: {
                        table: { type: 'string' },
                        confidence: { type: 'number' },
                        reason: { type: 'string' },
                        mapping_suggestion: { type: 'object' },
                      },
                    },
                  },
                  new_metric_suggestions: {
                    type: 'array',
                    description: 'Sugestões de novos indicadores a criar',
                    items: {
                      type: 'object',
                      properties: {
                        metric_name: { type: 'string' },
                        description: { type: 'string' },
                        justification: { type: 'string' },
                      },
                    },
                  },
                  data_quality_issues: {
                    type: 'array',
                    description: 'Problemas de qualidade identificados',
                    items: {
                      type: 'object',
                      properties: {
                        issue_type: { type: 'string' },
                        description: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                  recommendations: {
                    type: 'array',
                    description: 'Recomendações de ação',
                    items: { type: 'string' },
                  },
                },
                required: [
                  'document_category',
                  'relevance_score',
                  'extracted_entities',
                  'potential_uses',
                  'recommendations',
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_unstructured_document' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI analysis complete');

    // Parse AI response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Save to unclassified_data table
    const { data: unclassifiedData, error: saveError } = await supabaseClient
      .from('unclassified_data')
      .insert({
        company_id: document.company_id,
        document_id: document.id,
        extracted_data: {
          entities: analysis.extracted_entities || [],
          raw_content: extractedContent.substring(0, 1000), // First 1000 chars for reference
        },
        ai_suggestions: {
          category: analysis.document_category,
          potential_uses: analysis.potential_uses || [],
          new_metrics: analysis.new_metric_suggestions || [],
          data_quality: analysis.data_quality_issues || [],
          recommendations: analysis.recommendations || [],
          relevance_score: analysis.relevance_score,
        },
        ai_confidence: analysis.relevance_score || 0,
        data_category: analysis.document_category,
        potential_tables: analysis.potential_uses?.map((u: any) => u.table) || [],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving unclassified data:', saveError);
      throw saveError;
    }

    console.log('Analysis saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        unclassified_data_id: unclassifiedData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in universal-document-processor:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
