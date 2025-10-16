import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { unclassified_data_id, action } = await req.json();

    console.log(`Processing data ID: ${unclassified_data_id}, action: ${action}`);

    // Get unclassified data
    const { data: unclassifiedData, error: fetchError } = await supabaseClient
      .from('unclassified_data')
      .select('*, documents(*)')
      .eq('id', unclassified_data_id)
      .single();

    if (fetchError || !unclassifiedData) {
      throw new Error('Unclassified data not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get company context for better decisions
    const { data: companyData } = await supabaseClient
      .from('companies')
      .select('*, emission_sources(*), esg_metrics(*), licenses(*), assets(*)')
      .eq('id', unclassifiedData.company_id)
      .single();

    const systemPrompt = `Você é um assistente de dados ESG inteligente e autônomo.
Sua missão é ORGANIZAR, ESTRUTURAR e INSERIR dados extraídos de documentos no sistema Daton.

CONTEXTO DA EMPRESA:
${JSON.stringify(companyData, null, 2)}

DADOS EXTRAÍDOS:
${JSON.stringify(unclassifiedData.extracted_data, null, 2)}

SUGESTÕES DA IA ANTERIOR:
${JSON.stringify(unclassifiedData.ai_suggestions, null, 2)}

TABELAS DISPONÍVEIS NO SISTEMA:
1. emission_sources - Fontes de emissão de carbono
2. activity_data - Dados de atividades e emissões
3. esg_metrics - Métricas ESG
4. licenses - Licenças ambientais e regulatórias
5. assets - Ativos da empresa
6. goals - Metas de sustentabilidade
7. suppliers - Fornecedores
8. employees - Funcionários
9. waste_records - Registros de resíduos
10. water_consumption - Consumo de água
11. energy_consumption - Consumo de energia

SUA TAREFA:
1. Analise os dados extraídos
2. Identifique a MELHOR tabela para cada conjunto de dados
3. Mapeie os campos extraídos para os campos da tabela
4. Crie as operações SQL INSERT ou UPDATE necessárias
5. Valide os dados antes de inserir
6. Identifique relações entre dados (foreign keys)

IMPORTANTE:
- Se faltarem dados obrigatórios, crie valores padrão sensatos
- Use o company_id: ${unclassifiedData.company_id}
- Sempre inclua created_at e updated_at
- Normalize unidades e formatos
- Detecte duplicatas antes de inserir

Responda usando a ferramenta fornecida.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Organize e insira esses dados no sistema.' },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'execute_data_operations',
              description: 'Executa operações de inserção ou atualização de dados no banco',
              parameters: {
                type: 'object',
                properties: {
                  operations: {
                    type: 'array',
                    description: 'Lista de operações SQL a executar',
                    items: {
                      type: 'object',
                      properties: {
                        operation_type: {
                          type: 'string',
                          enum: ['INSERT', 'UPDATE'],
                          description: 'Tipo de operação',
                        },
                        table_name: {
                          type: 'string',
                          description: 'Nome da tabela',
                        },
                        data: {
                          type: 'object',
                          description: 'Dados a inserir/atualizar',
                        },
                        where_clause: {
                          type: 'object',
                          description: 'Cláusula WHERE para UPDATE (opcional)',
                        },
                        confidence: {
                          type: 'number',
                          description: 'Confiança na operação (0-100)',
                        },
                        reasoning: {
                          type: 'string',
                          description: 'Justificativa da decisão',
                        },
                      },
                      required: ['operation_type', 'table_name', 'data', 'confidence', 'reasoning'],
                    },
                  },
                  validation_notes: {
                    type: 'array',
                    description: 'Notas de validação e avisos',
                    items: {
                      type: 'object',
                      properties: {
                        severity: { type: 'string', enum: ['info', 'warning', 'error'] },
                        message: { type: 'string' },
                        field: { type: 'string' },
                      },
                    },
                  },
                  data_quality_score: {
                    type: 'number',
                    description: 'Score de qualidade dos dados (0-100)',
                  },
                  relationships_detected: {
                    type: 'array',
                    description: 'Relações detectadas entre dados',
                    items: {
                      type: 'object',
                      properties: {
                        from_table: { type: 'string' },
                        to_table: { type: 'string' },
                        relationship_type: { type: 'string' },
                        foreign_key: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['operations', 'validation_notes', 'data_quality_score'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'execute_data_operations' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const executionPlan = JSON.parse(toolCall.function.arguments);
    console.log('Execution plan:', JSON.stringify(executionPlan, null, 2));

    const results = {
      successful_operations: [],
      failed_operations: [],
      total_operations: executionPlan.operations.length,
    };

    // Execute operations only if action is 'auto_insert'
    if (action === 'auto_insert') {
      for (const operation of executionPlan.operations) {
        try {
          // Add required fields
          const dataToInsert = {
            ...operation.data,
            company_id: unclassifiedData.company_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          let result;
          if (operation.operation_type === 'INSERT') {
            const { data, error } = await supabaseClient
              .from(operation.table_name)
              .insert(dataToInsert)
              .select();

            if (error) throw error;
            result = data;
          } else if (operation.operation_type === 'UPDATE' && operation.where_clause) {
            let query = supabaseClient
              .from(operation.table_name)
              .update(dataToInsert);

            // Apply where clause
            for (const [key, value] of Object.entries(operation.where_clause)) {
              query = query.eq(key, value);
            }

            const { data, error } = await query.select();
            if (error) throw error;
            result = data;
          }

          results.successful_operations.push({
            table: operation.table_name,
            operation: operation.operation_type,
            confidence: operation.confidence,
            reasoning: operation.reasoning,
            result,
          });

          console.log(`✅ Operation successful: ${operation.operation_type} on ${operation.table_name}`);
        } catch (error) {
          console.error(`❌ Operation failed: ${operation.operation_type} on ${operation.table_name}`, error);
          results.failed_operations.push({
            table: operation.table_name,
            operation: operation.operation_type,
            error: error instanceof Error ? error.message : 'Unknown error',
            reasoning: operation.reasoning,
          });
        }
      }

      // Update unclassified_data with results
      await supabaseClient
        .from('unclassified_data')
        .update({
          user_decision: action === 'auto_insert' ? 'inserted' : 'rejected',
          processing_results: {
            execution_plan: executionPlan,
            results,
            processed_at: new Date().toISOString(),
          },
        })
        .eq('id', unclassified_data_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        execution_plan: executionPlan,
        results,
        preview_only: action !== 'auto_insert',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in intelligent-data-processor:', error);
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
