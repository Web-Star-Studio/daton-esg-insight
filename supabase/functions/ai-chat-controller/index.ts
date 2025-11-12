import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, attachments, pageContext, conversationId, companyId, userId } = await req.json();
    
    console.log('🤖 AI Chat Controller - Processing request:', {
      messageLength: message?.length,
      attachmentsCount: attachments?.length || 0,
      pageContext: pageContext?.tables || [],
      companyId,
      userId
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Process attachments if present
    let attachmentContext = '';
    let parsedAttachments: any[] = [];
    let hasStructuredData = false;
    
    if (attachments && attachments.length > 0) {
      console.log('📎 Processing attachments...', {
        count: attachments.length,
        hasParsedContent: attachments.some((a: any) => a.parsedContent || a.structured)
      });
      
      for (const att of attachments) {
        try {
          // Check if attachment is already pre-processed
          if (att.parsedContent || att.structured) {
            console.log(`✅ Using pre-processed attachment: ${att.name}`);
            
            const structured = att.structured || {};
            const dataRows = structured.records || structured.rows || [];
            parsedAttachments.push({
              name: att.name,
              type: att.type,
              size: att.size,
              parsedContent: att.parsedContent,
              structured: structured,
              headers: structured.headers || [],
              records: dataRows,
              rows: dataRows
            });
            
            if (dataRows && dataRows.length > 0) {
              hasStructuredData = true;
              console.log(`✅ Found ${dataRows.length} structured records in ${att.name}`);
            }
          } else if (att.path) {
            // Fallback: parse if not pre-processed
            console.log(`🔄 Parsing attachment: ${att.name}`);
            const { data, error } = await supabase.functions.invoke('parse-chat-document', {
              body: {
                filePath: att.path,
                fileType: att.type,
                useVision: att.type.startsWith('image/')
              }
            });

            if (error) throw error;

            parsedAttachments.push({
              name: att.name,
              type: att.type,
              size: att.size,
              parsedContent: data.parsedContent,
              tables: data.tables,
              rows: data.rows
            });
          }
        } catch (error) {
          console.error(`Failed to parse attachment ${att.name}:`, error);
        }
      }
      
      console.log(`📊 Attachment processing summary:
- Total attachments: ${parsedAttachments.length}
- With structured data: ${parsedAttachments.filter(pa => {
    const dataRows = pa.records || pa.rows || [];
    return dataRows.length > 0;
  }).length}
- Total records: ${parsedAttachments.reduce((sum, pa) => {
    const dataRows = pa.records || pa.rows || [];
    return sum + dataRows.length;
  }, 0)}
`);
    }

    // 2. Get current page data for context
    let existingData: any[] = [];
    if (pageContext?.tables && pageContext.tables.length > 0) {
      console.log(`🔍 Fetching data from current page tables: ${pageContext.tables.join(', ')}`);
      
      // Fetch sample data from relevant tables (limit to avoid overload)
      for (const table of pageContext.tables.slice(0, 3)) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
            existingData.push({
              table,
              sample_records: data,
              count: data.length
            });
          }
        } catch (error) {
          console.error(`Failed to fetch from ${table}:`, error);
        }
      }
    }

    // 3. Fetch recent operation feedback for learning
    const { data: recentFeedback } = await supabase
      .from('ai_operation_feedback')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 4. Build comprehensive system prompt
    const systemPrompt = `Você é o assistente IA avançado de um sistema ESG empresarial.

CONTEXTO DA PÁGINA ATUAL:
${pageContext?.tables?.length > 0 ? `
Usuário está na página com estas tabelas disponíveis:
${pageContext.tables.map((t: string) => `- ${t}`).join('\n')}

Dados existentes relevantes:
${existingData.map(ed => `
Tabela: ${ed.table}
Total de registros mostrados: ${ed.count}
Amostra: ${JSON.stringify(ed.sample_records.slice(0, 2), null, 2)}
`).join('\n')}
` : 'Nenhum contexto de página específico disponível.'}

${parsedAttachments.length > 0 ? `
ANEXOS PROCESSADOS:
${parsedAttachments.map(pa => {
  const dataRows = pa.records || pa.rows || [];
  if (pa.structured && dataRows.length > 0) {
    return `
Arquivo: ${pa.name} (${pa.type})
Estrutura detectada: ${dataRows.length} linhas
Colunas: ${pa.headers?.join(', ') || 'N/A'}
Primeiras linhas:
${JSON.stringify(dataRows.slice(0, 3), null, 2)}
`;
  }
  return `
Arquivo: ${pa.name} (${pa.type})
${pa.tables ? `Tabelas detectadas: ${pa.tables} linhas x ${pa.rows} colunas` : ''}
Conteúdo extraído (primeiras linhas):
${JSON.stringify(pa.parsedContent).substring(0, 500)}...
`;
}).join('\n')}
` : ''}

${recentFeedback && recentFeedback.length > 0 ? `
APRENDIZADO DO HISTÓRICO (últimas decisões do usuário):
${recentFeedback.map(f => `
- Operação proposta: ${(f.operation_proposed as any)?.type} em ${(f.operation_proposed as any)?.table}
- Confiança da IA: ${(f.operation_proposed as any)?.confidence}%
- Decisão do usuário: ${f.user_decision}
${f.user_edits ? `- Ajustes feitos: ${JSON.stringify(f.user_edits)}` : ''}
`).join('\n')}

Com base nesse histórico, ajuste suas próximas recomendações para maior precisão.
` : ''}

TABELAS DO SISTEMA E SEUS SCHEMAS:

1. waste_logs (Gestão de Resíduos)
   Colunas obrigatórias:
   - waste_type: string (tipo de resíduo)
   - quantity: number (quantidade em kg)
   - log_date: date (data do registro)
   - company_id: uuid (preenchido automaticamente)
   Colunas opcionais:
   - unit: string (unidade de medida)
   - destination: string (destino final)
   - notes: text (observações)

2. emission_sources (Fontes de Emissão)
   Colunas obrigatórias:
   - source_name: string (nome da fonte)
   - scope: number (1, 2 ou 3)
   - category: string (categoria da emissão)
   - company_id: uuid (preenchido automaticamente)
   Colunas opcionais:
   - description: text (descrição)
   - location: string (localização)
   
3. employees (Funcionários)
   Colunas obrigatórias:
   - full_name: string (nome completo)
   - company_id: uuid (preenchido automaticamente)
   Colunas opcionais:
   - email: string
   - cpf: string
   - department: string
   - position: string
   - hire_date: date
   
4. goals (Metas ESG)
   Colunas obrigatórias:
   - goal_name: string (nome da meta)
   - target_value: number (valor alvo)
   - target_date: date (data alvo)
   - company_id: uuid (preenchido automaticamente)
   Colunas opcionais:
   - description: text
   - category: string

REGRAS CRÍTICAS PARA MAPEAMENTO:
- Se o CSV contém "waste_type" e "quantity" → usar tabela "waste_logs"
- Se o CSV contém "source_name" e "scope" → usar tabela "emission_sources"
- Se o CSV contém "full_name" ou "email" → usar tabela "employees"
- Se o CSV contém "goal_name" e "target_value" → usar tabela "goals"
- NUNCA criar nomes de tabela baseados no nome do arquivo
- SEMPRE usar um dos nomes de tabela listados acima: waste_logs, emission_sources, employees, goals

SUAS CAPACIDADES:
1. Analisar dados ESG e fornecer insights
2. Propor operações de dados (INSERT/UPDATE/DELETE) quando anexos são enviados
3. Detectar duplicatas e conflitos automaticamente
4. Validar dados antes de propor inserção
5. Sugerir reconciliações inteligentes

IMPORTANTE: 
- Se o usuário enviou anexos, você DEVE usar a função "plan_data_operations" para propor ações estruturadas
- Se o usuário está apenas conversando, responda normalmente sem usar a função
- Sempre priorize segurança dos dados e confirmação do usuário
- Use confiança alta (>80%) apenas quando tiver certeza absoluta
- SEMPRE use uma das tabelas válidas: waste_logs, emission_sources, employees, goals
`;

    // 5. Call Lovable AI with tool calling
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools: (attachments && attachments.length > 0) ? [{
          type: 'function',
          function: {
            name: 'plan_data_operations',
            description: 'Planejar operações estruturadas de dados baseadas em anexos enviados',
            parameters: {
              type: 'object',
              properties: {
                operations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['INSERT', 'UPDATE', 'DELETE'] },
                      table: { 
                        type: 'string',
                        enum: ['waste_logs', 'emission_sources', 'employees', 'goals'],
                        description: 'Nome da tabela de destino. Usar SOMENTE uma das tabelas válidas do sistema.'
                      },
                      data: { type: 'object' },
                      where_clause: { type: 'object' },
                      confidence: { type: 'number', minimum: 0, maximum: 100 },
                      reasoning: { type: 'string' },
                      reconciliation: {
                        type: 'object',
                        properties: {
                          duplicates_found: { type: 'number' },
                          conflicts_detected: { type: 'array' },
                          resolution_strategy: { type: 'string' },
                          similarity_score: { type: 'number' }
                        }
                      }
                    },
                    required: ['type', 'table', 'data', 'confidence', 'reasoning']
                  }
                },
                validation_checks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      check_type: { type: 'string' },
                      status: { type: 'string', enum: ['pass', 'warning', 'error'] },
                      message: { type: 'string' },
                      affected_fields: { type: 'array' }
                    }
                  }
                },
                summary: { type: 'string' },
                requires_confirmation: { type: 'boolean' }
              },
              required: ['operations', 'validation_checks', 'summary']
            }
          }
        }] : undefined,
        temperature: 0.3,
        max_completion_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ AI response received');

    // Check if AI used the tool
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function.name === 'plan_data_operations') {
      const operationsPlan = JSON.parse(toolCall.function.arguments);
      
      // VALIDAÇÃO: Garantir que todas as tabelas são válidas
      const validTables = ['waste_logs', 'emission_sources', 'employees', 'goals'];
      const operations = operationsPlan.operations || [];
      
      console.log(`📋 AI proposed ${operations.length} operations`);
      
      const invalidOps = operations.filter((op: any) => !validTables.includes(op.table));
      
      if (invalidOps.length > 0) {
        console.warn(`⚠️ IA retornou ${invalidOps.length} tabela(s) inválida(s):`, invalidOps.map((o: any) => o.table));
        
        // Tentar corrigir automaticamente baseando-se nos dados
        for (const op of invalidOps) {
          const data = op.data || {};
          const originalTable = op.table;
          
          if (data.waste_type && data.quantity) {
            op.table = 'waste_logs';
            console.log(`✅ Tabela corrigida: ${originalTable} → waste_logs (detectado: waste_type + quantity)`);
          } else if (data.source_name && data.scope) {
            op.table = 'emission_sources';
            console.log(`✅ Tabela corrigida: ${originalTable} → emission_sources (detectado: source_name + scope)`);
          } else if (data.full_name || data.email) {
            op.table = 'employees';
            console.log(`✅ Tabela corrigida: ${originalTable} → employees (detectado: full_name/email)`);
          } else if (data.goal_name && data.target_value) {
            op.table = 'goals';
            console.log(`✅ Tabela corrigida: ${originalTable} → goals (detectado: goal_name + target_value)`);
          } else {
            console.error(`❌ Não foi possível mapear operação com tabela: ${originalTable}`, data);
            // Tentar detectar pela quantidade de campos conhecidos
            const dataKeys = Object.keys(data);
            if (dataKeys.some(k => ['tipo_residuo', 'residuo', 'lixo'].includes(k.toLowerCase()))) {
              op.table = 'waste_logs';
              console.log(`✅ Tabela corrigida por heurística: ${originalTable} → waste_logs`);
            } else if (dataKeys.some(k => ['fonte', 'emissao', 'co2'].includes(k.toLowerCase()))) {
              op.table = 'emission_sources';
              console.log(`✅ Tabela corrigida por heurística: ${originalTable} → emission_sources`);
            } else if (dataKeys.some(k => ['nome', 'funcionario', 'colaborador'].includes(k.toLowerCase()))) {
              op.table = 'employees';
              console.log(`✅ Tabela corrigida por heurística: ${originalTable} → employees`);
            } else if (dataKeys.some(k => ['meta', 'objetivo', 'target'].includes(k.toLowerCase()))) {
              op.table = 'goals';
              console.log(`✅ Tabela corrigida por heurística: ${originalTable} → goals`);
            } else {
              // Se não conseguir detectar, remover operação
              const index = operations.indexOf(op);
              if (index > -1) {
                operations.splice(index, 1);
                console.error(`❌ Operação removida: não foi possível detectar tabela para ${originalTable}`);
              }
            }
          }
        }
      }
      
      // Logging detalhado das operações finais
      const operationsByTable = operations.reduce((acc: any, op: any) => {
        acc[op.table] = (acc[op.table] || 0) + 1;
        return acc;
      }, {});
      
      console.log('🎯 Operações finais por tabela:', operationsByTable);
      console.log('📊 Total de operações validadas:', operations.length);

      // Return structured plan for preview
      return new Response(JSON.stringify({
        operations_proposed: true,
        operations: operationsPlan.operations,
        validations: operationsPlan.validation_checks,
        summary: operationsPlan.summary,
        response: `Analisei os anexos e identifiquei **${operationsPlan.operations?.length || 0} operações** possíveis.\n\n${operationsPlan.summary}\n\nGostaria de revisar antes de executar?`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fallback: If AI didn't call tool but we have structured data, create operations automatically
    if (hasStructuredData && parsedAttachments.length > 0) {
      console.log('🔄 AI did not call tool, applying fallback for structured data...');
      
      const operations: any[] = [];
      const validations: any[] = [];
      
      const attachmentsWithStructuredData = parsedAttachments.filter(pa => {
        const dataRows = pa.records || pa.rows || [];
        return pa.structured && dataRows.length > 0;
      });
      
      console.log(`📦 Processing ${attachmentsWithStructuredData.length} attachments with structured data`);
      
      for (const attachment of attachmentsWithStructuredData) {
        const headers = attachment.headers || [];
        const dataRows = attachment.records || attachment.rows || [];
        const records = dataRows;
        
        console.log(`🔍 Analisando anexo: ${attachment.name}`);
        console.log(`📋 Headers encontrados: ${headers.join(', ')}`);
        console.log(`📊 Total de registros: ${records.length}`);
        
        // Detect table type based on headers with flexible matching
        let targetTable = '';
        const headersLower = headers.map((h: string) => h.toLowerCase());
        
        // Waste logs detection (mais flexível)
        if (headersLower.some((h: string) => ['waste_type', 'tipo_residuo', 'residuo', 'tipo'].includes(h)) &&
            headersLower.some((h: string) => ['quantity', 'quantidade', 'peso', 'qtd'].includes(h))) {
          targetTable = 'waste_logs';
        } 
        // Emission sources detection
        else if (headersLower.some((h: string) => ['source_name', 'fonte', 'nome'].includes(h)) &&
                 headersLower.some((h: string) => ['scope', 'escopo'].includes(h))) {
          targetTable = 'emission_sources';
        } 
        // Employees detection
        else if (headersLower.some((h: string) => ['full_name', 'nome', 'funcionario', 'colaborador'].includes(h)) ||
                 headersLower.some((h: string) => ['email'].includes(h))) {
          targetTable = 'employees';
        } 
        // Goals detection
        else if (headersLower.some((h: string) => ['goal_name', 'meta', 'objetivo'].includes(h)) &&
                 headersLower.some((h: string) => ['target_value', 'valor_alvo', 'alvo'].includes(h))) {
          targetTable = 'goals';
        }
        
        if (!targetTable) {
          console.warn(`⚠️ Não foi possível detectar tabela para anexo: ${attachment.name}`);
          console.warn(`⚠️ Headers disponíveis: ${headers.join(', ')}`);
          continue;
        }
        
        console.log(`✅ Tabela detectada: ${targetTable} para ${attachment.name} (${records.length} registros)`);
        
        // Convert each record to INSERT operation
        for (const record of records) {
          operations.push({
            type: 'INSERT',
            table: targetTable,
            data: record,
            confidence: 85,
            reasoning: `Importado de ${attachment.name}`,
            reconciliation: {
              duplicates_found: 0,
              conflicts_detected: [],
              resolution_strategy: 'insert_new',
              similarity_score: 0
            }
          });
        }
      }
      
      // Add validation
      if (operations.length === 0) {
        validations.push({
          check_type: 'completeness',
          status: 'error',
          message: 'Nenhum registro detectado nos anexos'
        });
      } else {
        validations.push({
          check_type: 'completeness',
          status: 'pass',
          message: `${operations.length} registro(s) detectado(s)`
        });
      }
      
      console.log(`📦 Fallback created ${operations.length} operations`);
      
      return new Response(JSON.stringify({
        operations_proposed: true,
        operations,
        validations,
        summary: `Importação automática de ${operations.length} registro(s) dos anexos enviados`,
        response: `Identifiquei **${operations.length} operações** de importação.\n\nGostaria de revisar antes de executar?`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normal chat response
    return new Response(JSON.stringify({
      operations_proposed: false,
      response: aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in ai-chat-controller:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
