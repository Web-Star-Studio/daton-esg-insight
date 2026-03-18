import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCompanyContext } from '../_shared/company-context-builder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.warn('🧠 Smart Content Analyzer: Starting analysis...');

    const { content, fileType, fileName, companyId } = await req.json();

    if (!content || !fileType || !companyId) {
      throw new Error('content, fileType e companyId são obrigatórios');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Validate JWT token for authenticated requests
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        console.warn('JWT validation failed, but proceeding (public analyzer)');
      } else {
        console.warn('Authenticated analysis request from:', claimsData.claims.sub);
      }
    }

    // Build company context
    const context = await buildCompanyContext(supabaseClient, companyId);

    console.warn('🏢 Company context built:', {
      company: context.company.name,
      sources: context.current_data.emission_sources.length,
      goals: context.current_data.esg_goals.length,
    });

    // Call Gemini 2.5 Pro for intelligent classification
    const systemPrompt = `Você é um especialista em análise de documentos ESG e sustentabilidade com conhecimento profundo do sistema Daton.

CONTEXTO DA EMPRESA:
${JSON.stringify(context, null, 2)}

MISSÃO:
Analise o conteúdo fornecido e classifique-o de forma inteligente, identificando:
1. Tipo de documento (Nota Fiscal, Relatório, Planilha de Dados, Certificado, etc.)
2. Entidades e dados estruturados extraídos (datas, valores, unidades, nomes)
3. Score de confiança para cada campo extraído (0.0 - 1.0)
4. Tabelas do sistema onde os dados devem ser inseridos
5. Mapeamento sugerido (campo do documento → campo da tabela)
6. Score de relevância ESG (0-100)

TABELAS DISPONÍVEIS:
${context.schema_information.available_tables.join(', ')}

DEFINIÇÕES DE CAMPOS:
${JSON.stringify(context.schema_information.field_definitions, null, 2)}

DADOS HISTÓRICOS DA EMPRESA:
- Emissões totais: ${context.current_data.total_emissions.toFixed(2)} tCO2e
- Fontes de emissão: ${context.current_data.emission_sources.length}
- Fornecedores: ${context.current_data.suppliers.length}
- Licenças ativas: ${context.current_data.active_licenses.length}

Seja PRECISO e CONTEXTUALIZADO. Use os dados históricos para validar se os valores extraídos fazem sentido.`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analise este documento:

TIPO: ${fileType}
NOME: ${fileName}

CONTEÚDO:
${content.substring(0, 20000)}`,
      },
    ];

    const toolDefinition = {
      type: 'function',
      function: {
        name: 'classify_and_extract_document',
        description: 'Classifica documento e extrai dados estruturados com alta precisão',
        parameters: {
          type: 'object',
          properties: {
            document_type: {
              type: 'string',
              description: 'Tipo de documento identificado',
              enum: [
                'Nota Fiscal',
                'Relatório de Emissões',
                'Planilha de Dados',
                'Certificado/Licença',
                'Relatório de Fornecedor',
                'Relatório de Resíduos',
                'Relatório de Água',
                'Documento de RH',
                'Outro',
              ],
            },
            document_category: {
              type: 'string',
              description: 'Categoria ESG',
              enum: ['Ambiental', 'Social', 'Governança', 'Múltiplo', 'Não ESG'],
            },
            esg_relevance_score: {
              type: 'number',
              description: 'Score de relevância ESG (0-100)',
              minimum: 0,
              maximum: 100,
            },
            extracted_entities: {
              type: 'array',
              description: 'Entidades e dados extraídos',
              items: {
                type: 'object',
                properties: {
                  entity_name: { type: 'string' },
                  entity_value: { type: 'string' },
                  entity_type: {
                    type: 'string',
                    enum: ['date', 'number', 'text', 'currency', 'unit'],
                  },
                  unit: { type: 'string' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['entity_name', 'entity_value', 'entity_type', 'confidence'],
              },
            },
            target_mappings: {
              type: 'array',
              description: 'Mapeamentos sugeridos para tabelas do sistema',
              items: {
                type: 'object',
                properties: {
                  table_name: { type: 'string' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  field_mappings: {
                    type: 'object',
                    description: 'Mapeamento campo_documento → campo_tabela',
                  },
                  validation_notes: { type: 'string' },
                  requires_review: { type: 'boolean' },
                },
                required: ['table_name', 'confidence', 'field_mappings'],
              },
            },
            data_quality_assessment: {
              type: 'object',
              properties: {
                completeness_score: { type: 'number', minimum: 0, maximum: 100 },
                accuracy_score: { type: 'number', minimum: 0, maximum: 100 },
                issues: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      issue_type: {
                        type: 'string',
                        enum: ['missing_data', 'invalid_format', 'outlier', 'ambiguous', 'duplicate'],
                      },
                      description: { type: 'string' },
                      severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    },
                  },
                },
              },
            },
            contextual_insights: {
              type: 'array',
              items: { type: 'string' },
              description: 'Insights contextualizados baseados nos dados históricos da empresa',
            },
            recommended_actions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Ações recomendadas baseadas na análise',
            },
          },
          required: [
            'document_type',
            'document_category',
            'esg_relevance_score',
            'extracted_entities',
            'target_mappings',
            'data_quality_assessment',
          ],
          additionalProperties: false,
        },
      },
    };

    console.warn('🤖 Calling Gemini 2.5 Pro for classification...');

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
        tool_choice: { type: 'function', function: { name: 'classify_and_extract_document' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API Error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const classification = JSON.parse(toolCall.function.arguments);

    console.warn('✅ Classification complete:', {
      type: classification.document_type,
      relevance: classification.esg_relevance_score,
      entities: classification.extracted_entities?.length,
      mappings: classification.target_mappings?.length,
    });

    // ✅ FASE 1.1: FALLBACK para field_mappings vazios
    if (classification.target_mappings && classification.target_mappings.length > 0) {
      console.warn('🔍 Validating field_mappings...');
      
      for (const mapping of classification.target_mappings) {
        const fieldCount = Object.keys(mapping.field_mappings || {}).length;
        console.warn(`📊 Mapping for ${mapping.table_name}: ${fieldCount} fields`);
        
        // Se field_mappings está vazio, tentar extrair das entidades
        if (!mapping.field_mappings || fieldCount === 0) {
          console.warn(`⚠️ Empty field_mappings for ${mapping.table_name}, applying fallback...`);
          mapping.field_mappings = {};
          
          // Extrair dados das entidades
          for (const entity of classification.extracted_entities || []) {
            const fieldName = entity.entity_name
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^\w_]/g, '');
            
            mapping.field_mappings[fieldName] = entity.entity_value;
          }
          
          console.warn(`✅ Fallback applied: ${Object.keys(mapping.field_mappings).length} fields extracted`);
        }
      }
    }

    // Logging detalhado final
    console.warn('📋 Final Classification Result:', {
      document_type: classification.document_type,
      entities_count: classification.extracted_entities?.length || 0,
      target_mappings_count: classification.target_mappings?.length || 0,
      mappings_detail: classification.target_mappings?.map((m: any) => ({
        table: m.table_name,
        field_count: Object.keys(m.field_mappings || {}).length,
        fields: Object.keys(m.field_mappings || {}).slice(0, 5)
      }))
    });

    return new Response(
      JSON.stringify({
        success: true,
        classification,
        context_used: {
          company_name: context.company.name,
          total_sources: context.current_data.emission_sources.length,
          historical_emissions: context.current_data.total_emissions,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in smart-content-analyzer:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
