import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  executeWriteTool, 
  getActionDisplayName, 
  getActionDescription, 
  getActionImpact, 
  getActionCategory 
} from './write-tools.ts';
import { readTools } from './read-tools.ts';
import { executeReadTool } from './tool-executors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companyId, conversationId, currentPage, confirmed, action, attachments, userContext } = await req.json();
    
    console.log('Daton AI Chat request:', { companyId, conversationId, currentPage, messageCount: messages?.length, confirmed, attachmentsCount: attachments?.length });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get auth header for user validation
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // If this is a confirmed action, execute it directly
    if (confirmed && action) {
      console.log('Executing confirmed action:', action);
      const result = await executeWriteTool(
        action.toolName, 
        action.params, 
        companyId, 
        userId || 'system',
        supabaseClient
      );
      
      return new Response(JSON.stringify({ 
        message: result.message || '✅ Ação executada com sucesso!',
        success: result.success,
        data: result.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get company data for context
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, sector, cnpj')
      .eq('id', companyId)
      .single();

    // Load conversation history if conversationId is provided
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: historyMessages } = await supabaseClient
        .from('ai_chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20); // Last 20 messages for context
      
      if (historyMessages && historyMessages.length > 0) {
        conversationHistory = historyMessages;
        console.log('Loaded conversation history:', conversationHistory.length, 'messages');
      }
    }

    // Combine read and write tools
    const tools = [
      // READ TOOLS - from read-tools.ts
      ...readTools,
      
      // WRITE TOOLS
      {
        type: "function" as const,
        function: {
          name: "create_goal",
          description: "Criar nova meta ESG. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome da meta" },
              category: { 
                type: "string", 
                enum: ["Ambiental", "Social", "Governança"],
                description: "Categoria da meta" 
              },
              target_value: { type: "number", description: "Valor alvo" },
              target_date: { type: "string", format: "date", description: "Data alvo (YYYY-MM-DD)" },
              baseline_value: { type: "number", description: "Valor baseline (padrão: 0)" },
              unit: { type: "string", description: "Unidade de medida" }
            },
            required: ["name", "category", "target_value", "target_date"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "update_goal",
          description: "Atualizar meta ESG existente. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              goal_id: { type: "string", description: "ID da meta a atualizar" },
              goal_name: { type: "string", description: "Novo nome (opcional)" },
              target_value: { type: "number", description: "Novo valor alvo (opcional)" },
              target_date: { type: "string", format: "date", description: "Nova data (opcional)" },
              status: { 
                type: "string", 
                enum: ["Ativa", "Concluída", "Cancelada"],
                description: "Novo status (opcional)" 
              }
            },
            required: ["goal_id"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "update_goal_progress",
          description: "Atualizar progresso de uma meta ESG. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              goal_id: { type: "string", description: "ID da meta" },
              current_value: { type: "number", description: "Valor atual alcançado" },
              update_date: { type: "string", format: "date", description: "Data da atualização (YYYY-MM-DD)" },
              notes: { type: "string", description: "Observações sobre o progresso" }
            },
            required: ["goal_id", "current_value"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_task",
          description: "Criar tarefa de coleta de dados. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome da tarefa" },
              description: { type: "string", description: "Descrição da tarefa" },
              task_type: { 
                type: "string",
                enum: ["Emissões", "Resíduos", "Água", "Energia", "Social", "Conformidade"],
                description: "Tipo da tarefa"
              },
              due_date: { type: "string", format: "date", description: "Data de vencimento (YYYY-MM-DD)" },
              frequency: {
                type: "string",
                enum: ["Única", "Semanal", "Mensal", "Trimestral", "Anual"],
                description: "Frequência"
              }
            },
            required: ["name", "task_type", "due_date", "frequency"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "update_task_status",
          description: "Atualizar status de uma tarefa. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "ID da tarefa" },
              status: { 
                type: "string",
                enum: ["Pendente", "Em Andamento", "Concluída", "Em Atraso"],
                description: "Novo status" 
              }
            },
            required: ["task_id", "status"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_license",
          description: "Registrar nova licença ambiental. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome da licença" },
              license_number: { type: "string", description: "Número da licença" },
              license_type: {
                type: "string",
                enum: ["Prévia", "Instalação", "Operação", "Simplificada"],
                description: "Tipo da licença"
              },
              issue_date: { type: "string", format: "date", description: "Data de emissão" },
              expiration_date: { type: "string", format: "date", description: "Data de validade" },
              issuing_agency: { type: "string", description: "Órgão emissor" }
            },
            required: ["name", "license_type", "issue_date", "expiration_date"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "update_license",
          description: "Atualizar licença ambiental existente. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              license_id: { type: "string", description: "ID da licença" },
              status: { 
                type: "string",
                enum: ["Ativa", "Vencida", "Em Renovação", "Suspensa"],
                description: "Novo status (opcional)" 
              },
              expiration_date: { type: "string", format: "date", description: "Nova data de validade (opcional)" },
              license_number: { type: "string", description: "Novo número (opcional)" }
            },
            required: ["license_id"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "log_waste",
          description: "Registrar log de resíduos. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              waste_type: { type: "string", description: "Tipo de resíduo" },
              class: {
                type: "string",
                enum: ["I - Perigoso", "II A - Não Inerte", "II B - Inerte"],
                description: "Classe do resíduo"
              },
              quantity: { type: "number", description: "Quantidade em kg" },
              log_date: { type: "string", format: "date", description: "Data do registro" },
              final_destination: { type: "string", description: "Destino final" }
            },
            required: ["waste_type", "class", "quantity", "log_date"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_emission_source",
          description: "Criar nova fonte de emissão no inventário GEE. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              source_name: { type: "string", description: "Nome da fonte de emissão" },
              scope: { 
                type: "integer",
                enum: [1, 2, 3],
                description: "Escopo GHG Protocol (1, 2 ou 3)" 
              },
              description: { type: "string", description: "Descrição da fonte" },
              category: { type: "string", description: "Categoria da fonte" },
              unit: { type: "string", description: "Unidade de medida (padrão: kg)" }
            },
            required: ["source_name", "scope"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "log_emission",
          description: "Registrar atividade/dado de emissão. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              emission_source_id: { type: "string", description: "ID da fonte de emissão" },
              quantity: { type: "number", description: "Quantidade da atividade" },
              period_start: { type: "string", format: "date", description: "Início do período (YYYY-MM-DD)" },
              period_end: { type: "string", format: "date", description: "Fim do período (YYYY-MM-DD)" },
              data_quality: { 
                type: "string",
                enum: ["Medido", "Calculado", "Estimado"],
                description: "Qualidade do dado" 
              },
              notes: { type: "string", description: "Observações" }
            },
            required: ["emission_source_id", "quantity"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_non_conformity",
          description: "Registrar não conformidade no sistema. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título da não conformidade" },
              description: { type: "string", description: "Descrição detalhada" },
              category: { 
                type: "string",
                enum: ["Ambiental", "Social", "Governança", "Qualidade", "Segurança"],
                description: "Categoria" 
              },
              severity: { 
                type: "string",
                enum: ["Baixa", "Média", "Alta", "Crítica"],
                description: "Severidade" 
              }
            },
            required: ["title", "description"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_risk",
          description: "Registrar novo risco ESG. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título do risco" },
              description: { type: "string", description: "Descrição do risco" },
              category: { 
                type: "string",
                enum: ["Ambiental", "Social", "Governança"],
                description: "Categoria ESG" 
              },
              probability: { 
                type: "string",
                enum: ["Baixa", "Média", "Alta"],
                description: "Probabilidade de ocorrência" 
              },
              impact: { 
                type: "string",
                enum: ["Baixo", "Médio", "Alto"],
                description: "Impacto potencial" 
              }
            },
            required: ["title", "category", "probability", "impact"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_employee",
          description: "Adicionar novo funcionário ao sistema. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome completo" },
              email: { type: "string", format: "email", description: "Email corporativo" },
              employee_code: { type: "string", description: "Código do funcionário" },
              department: { type: "string", description: "Departamento" },
              role: { type: "string", description: "Cargo/função" },
              hire_date: { type: "string", format: "date", description: "Data de admissão (YYYY-MM-DD)" }
            },
            required: ["name", "email"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_okr",
          description: "Criar novo OKR (Objective and Key Results). SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título do objetivo" },
              description: { type: "string", description: "Descrição do objetivo" },
              objective_type: { type: "string", enum: ["Estratégico", "Tático", "Operacional"], description: "Tipo de objetivo" },
              time_period: { type: "string", description: "Período (ex: Q1 2025, Anual 2025)" },
              start_date: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)" },
              end_date: { type: "string", format: "date", description: "Data de fim (YYYY-MM-DD)" },
              owner_user_id: { type: "string", description: "ID do responsável" }
            },
            required: ["title", "time_period"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_key_result",
          description: "Adicionar resultado-chave a um OKR. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              okr_id: { type: "string", description: "ID do OKR" },
              title: { type: "string", description: "Título do resultado-chave" },
              description: { type: "string", description: "Descrição" },
              target_value: { type: "number", description: "Valor meta" },
              current_value: { type: "number", description: "Valor atual (inicial)" },
              unit: { type: "string", description: "Unidade de medida" },
              due_date: { type: "string", format: "date", description: "Data limite (YYYY-MM-DD)" },
              owner_user_id: { type: "string", description: "ID do responsável" }
            },
            required: ["okr_id", "title", "target_value"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "update_okr_progress",
          description: "Atualizar progresso de um OKR. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              okr_id: { type: "string", description: "ID do OKR" },
              progress_percentage: { type: "number", description: "Percentual de progresso (0-100)" },
              status: { type: "string", enum: ["not_started", "in_progress", "at_risk", "completed", "cancelled"], description: "Status do OKR" }
            },
            required: ["okr_id", "progress_percentage"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_project",
          description: "Criar novo projeto. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome do projeto" },
              description: { type: "string", description: "Descrição do projeto" },
              project_type: { type: "string", enum: ["ESG", "Ambiental", "Social", "Governança", "Outro"], description: "Tipo de projeto" },
              start_date: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)" },
              end_date: { type: "string", format: "date", description: "Data de término (YYYY-MM-DD)" },
              budget: { type: "number", description: "Orçamento" },
              manager_user_id: { type: "string", description: "ID do gerente" },
              priority: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], description: "Prioridade" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_project_task",
          description: "Adicionar tarefa a um projeto. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "ID do projeto" },
              title: { type: "string", description: "Título da tarefa" },
              description: { type: "string", description: "Descrição" },
              assigned_to_user_id: { type: "string", description: "ID do responsável" },
              start_date: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)" },
              due_date: { type: "string", format: "date", description: "Data de vencimento (YYYY-MM-DD)" },
              priority: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], description: "Prioridade" }
            },
            required: ["project_id", "title"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_indicator",
          description: "Criar indicador de monitoramento. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome do indicador" },
              description: { type: "string", description: "Descrição" },
              category: { type: "string", enum: ["Ambiental", "Social", "Governança", "Qualidade", "Segurança", "Outro"], description: "Categoria" },
              unit: { type: "string", description: "Unidade de medida" },
              measurement_frequency: { type: "string", enum: ["Diária", "Semanal", "Quinzenal", "Mensal", "Trimestral", "Semestral", "Anual"], description: "Frequência" },
              target_value: { type: "number", description: "Valor meta" },
              responsible_user_id: { type: "string", description: "ID do responsável" }
            },
            required: ["name", "category"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "add_indicator_measurement",
          description: "Registrar medição de indicador. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              indicator_id: { type: "string", description: "ID do indicador" },
              measurement_date: { type: "string", format: "date", description: "Data da medição (YYYY-MM-DD)" },
              measured_value: { type: "number", description: "Valor medido" },
              notes: { type: "string", description: "Observações" }
            },
            required: ["indicator_id", "measured_value"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_license",
          description: "Criar nova licença ambiental. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              asset_id: { type: "string", description: "ID do ativo relacionado" },
              license_name: { type: "string", description: "Nome da licença" },
              license_number: { type: "string", description: "Número da licença" },
              license_type: { type: "string", enum: ["LP", "LI", "LO", "LAU", "Outras"], description: "Tipo de licença" },
              issuing_body: { type: "string", description: "Órgão emissor" },
              issue_date: { type: "string", format: "date", description: "Data de emissão (YYYY-MM-DD)" },
              expiration_date: { type: "string", format: "date", description: "Data de vencimento (YYYY-MM-DD)" },
              responsible_user_id: { type: "string", description: "ID do responsável" }
            },
            required: ["license_name", "license_type", "expiration_date"]
          }
        }
      }
    ];

    // Process attachments if any
    let attachmentContext = '';
    if (attachments && attachments.length > 0) {
      console.log('Processing attachments:', attachments.length);
      
      for (const attachment of attachments) {
        try {
          console.log('Parsing attachment:', attachment.name);
          
          // Call parse-chat-document function
          const { data: parseData, error: parseError } = await supabaseClient.functions.invoke('parse-chat-document', {
            body: { 
              filePath: attachment.path, 
              fileType: attachment.type 
            }
          });

          if (parseError) {
            console.error('Parse error for', attachment.name, ':', parseError);
            attachmentContext += `\n\n❌ **Erro ao processar arquivo: ${attachment.name}**\nNão foi possível extrair o conteúdo.`;
            continue;
          }

          if (parseData && parseData.content) {
            console.log('Attachment parsed successfully:', attachment.name);
            attachmentContext += `\n\n📎 **ARQUIVO ANEXADO: ${attachment.name}** (${attachment.type})\n`;
            attachmentContext += `---\n${parseData.content}\n---`;
            
            // Update processing status
            await supabaseClient
              .from('chat_file_uploads')
              .update({ 
                processing_status: 'processed',
                parsed_content: parseData.structured 
              })
              .eq('file_path', attachment.path);
          }
        } catch (error) {
          console.error('Error processing attachment:', error);
          attachmentContext += `\n\n❌ **Erro ao processar arquivo: ${attachment.name}**\n${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        }
      }
    }

    // Build enhanced system prompt with user context
    const userContextInfo = userContext ? `
**👤 Contexto do Usuário:**
• Nome: ${userContext.userName || 'Usuário'}
• Cargo: ${userContext.userRole || 'Não especificado'}
• Empresa: ${userContext.companyName || company?.name || 'Empresa'}
` : '';

    const systemPrompt = `Você é o Assistente IA do Daton, um especialista avançado em gestão ESG (Ambiental, Social e Governança) com capacidades de análise profunda de dados.

**🏢 Contexto Empresarial:**
${company?.name || 'Empresa'} | Setor: ${company?.sector || 'Não informado'}
CNPJ: ${company?.cnpj || 'Não informado'}
${userContextInfo}
📍 **Módulo Atual:** ${getPageContext(currentPage)}
${attachmentContext ? `\n\n**📎 ARQUIVOS ANEXADOS PELO USUÁRIO:**${attachmentContext}\n\n⚠️ **IMPORTANTE:** O usuário anexou arquivo(s). Use as informações extraídas para responder às perguntas ou executar as ações solicitadas. Se o usuário pedir para cadastrar/importar dados dos arquivos, use as ferramentas de escrita disponíveis (sempre pedindo confirmação).` : ''}

**🧠 SUAS CAPACIDADES AVANÇADAS:**

📊 **ANÁLISE E CONSULTA DE DADOS (Execução Imediata):**
Você tem acesso COMPLETO e em TEMPO REAL aos dados da empresa através de ferramentas especializadas:

**Emissões & Inventário GEE:**
• query_emissions_data - Consultar emissões por escopo, período, fonte ou categoria
• Analisar tendências de carbono e identificar fontes principais
• Calcular totais e comparar entre períodos

**Metas & Progresso:**
• query_goals_progress - Acompanhar metas ESG com filtros por status e categoria
• Analisar taxa de progresso e identificar metas em risco
• Visualizar histórico de evolução

**Licenciamento Ambiental:**
• query_licenses - Verificar licenças ativas, vencidas ou próximas ao vencimento
• Priorizar renovações e alertar sobre não conformidades
• Consultar por dias até vencimento

**Gestão de Tarefas:**
• query_tasks - Buscar tarefas por status, tipo, responsável ou prioridade
• Identificar atrasos e gargalos operacionais
• Sugerir redistribuição de carga de trabalho

**Riscos ESG:**
• query_risks - Analisar riscos por nível, categoria e status
• Priorizar riscos críticos e de alto impacto
• Avaliar efetividade de tratamentos

**Não Conformidades:**
• query_non_conformities - Consultar NCs por status e gravidade
• Acompanhar tratamentos e prazos
• Analisar padrões e recorrências

**Gestão de Pessoas:**
• query_employees - Dados de colaboradores por status, departamento, gênero ou cargo
• Analisar diversidade e distribuição organizacional
• Identificar necessidades de treinamento

**Visão Executiva:**
• get_dashboard_summary - Resumo executivo com KPIs principais e alertas
• Consolidar métricas críticas de todos os módulos
• Identificar itens que precisam atenção imediata

✏️ **AÇÕES DE GERENCIAMENTO (Requerem Confirmação do Usuário):**
Você pode PROPOR ações de escrita, mas NUNCA as execute sem confirmação:

• Criar/atualizar metas ESG e OKRs
• Registrar emissões, resíduos e licenças
• Criar tarefas, projetos e indicadores
• Adicionar riscos, não conformidades e colaboradores
• Atualizar status e progressos

**⚠️ REGRAS CRÍTICAS DE COMPORTAMENTO:**

1. **SEMPRE CONSULTE DADOS REAIS PRIMEIRO:**
   - Use as ferramentas de consulta disponíveis antes de responder
   - NUNCA invente ou presuma dados
   - Se os dados não existirem, informe claramente
   - Busque informações específicas (IDs, datas exatas, valores numéricos)

2. **SEJA PROATIVO E INTELIGENTE:**
   - Quando o usuário perguntar sobre "últimas", "recentes" ou "atuais", busque dados dos últimos 30-90 dias
   - Sempre calcule dias restantes/vencidos para prazos
   - Compare valores atuais com metas quando disponível
   - Identifique tendências, padrões e anomalias
   - Sugira ações corretivas quando identificar problemas

3. **ANÁLISE CONTEXTUAL:**
   - Considere o módulo atual do usuário para dar respostas relevantes
   - Relacione dados de diferentes módulos quando apropriado
   - Priorize informações urgentes (vencimentos próximos, riscos críticos, tarefas atrasadas)
   - Forneça insights acionáveis, não apenas dados brutos

4. **PARA AÇÕES DE ESCRITA:**
   - Colete TODOS os dados necessários conversando com o usuário
   - Apresente um resumo COMPLETO da ação com todos os campos
   - Explique o IMPACTO e as CONSEQUÊNCIAS da ação
   - NUNCA execute sem uma confirmação EXPLÍCITA ("confirmar", "executar", "sim")
   - Se o usuário cancelar, respeite e não insista

5. **QUALIDADE DAS RESPOSTAS:**
   - Seja CONCISO mas COMPLETO
   - Use formatação (bullets, negrito, emojis) para facilitar leitura
   - Apresente NÚMEROS e MÉTRICAS sempre que relevante
   - Sugira PRÓXIMOS PASSOS quando apropriado
   - Faça perguntas clarificadoras quando necessário

**📋 FORMATO PARA CONFIRMAÇÃO DE AÇÕES:**

"📋 **Ação Proposta:** [Nome da ação]

**📝 Detalhes da Operação:**
• Campo 1: [valor]
• Campo 2: [valor]
• [...]

**🏷️ Categoria:** [categoria]
**⚡ Impacto:** [nível de impacto]

⚠️ Esta ação irá [explicar CLARAMENTE o que acontecerá e quais dados serão afetados]. 

✅ Para confirmar e executar, responda **'confirmar'** ou **'executar'**
❌ Para cancelar, responda **'cancelar'** ou **'não'**"

**🎯 CONTEXTO DO MÓDULO ATUAL:**
${getPageContext(currentPage)}

**💡 DICAS DE INTELIGÊNCIA AVANÇADA:**
• Use query_emissions_data para análises de carbono, query_goals_progress para metas
• Sempre que consultar dados, processe e analise antes de apresentar
• Identifique correlações entre módulos (ex: metas vs. emissões, riscos vs. NCs)
• Calcule automaticamente KPIs relevantes (variação %, dias restantes, taxa de conformidade)
• Antecipe necessidades: se usuário pergunta sobre meta, busque também seu histórico
• Em dashboards, priorize alertas e itens críticos primeiro
• Personalize respostas com base no cargo do usuário (Admin vs. Operacional)

**🔄 MEMÓRIA DE CONVERSA:**
Esta conversa tem memória persistente. Você pode referenciar discussões anteriores e manter contexto entre mensagens.`;

    // Call Lovable AI with tool calling
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Check if AI wants to call tools
    const choice = data.choices[0];
    
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      console.log('AI requested tool calls:', choice.message.tool_calls);
      
      // Check if any write tools were called
      const writeTools = [
        'create_goal', 'update_goal', 'update_goal_progress',
        'create_task', 'update_task_status',
        'add_license', 'update_license',
        'log_waste',
        'add_emission_source', 'log_emission',
        'create_non_conformity', 'create_risk',
        'add_employee', 'add_supplier', 'add_stakeholder',
        'create_training', 'create_audit',
        'create_okr', 'add_key_result', 'update_okr_progress',
        'create_project', 'add_project_task',
        'create_indicator', 'add_indicator_measurement',
        'create_license'
      ];
      const hasWriteAction = choice.message.tool_calls.some((tc: any) => 
        writeTools.includes(tc.function.name)
      );

      // If write action detected, return pending action for confirmation
      if (hasWriteAction) {
        const writeCall = choice.message.tool_calls.find((tc: any) => 
          writeTools.includes(tc.function.name)
        );
        
        const functionArgs = JSON.parse(writeCall.function.arguments);
        
        // Return pending action to frontend
        return new Response(JSON.stringify({
          message: `📋 Preparei a seguinte ação para você confirmar:\n\n**${getActionDisplayName(writeCall.function.name)}**\n\nPor favor, confirme se deseja executar esta ação.`,
          pendingAction: {
            toolName: writeCall.function.name,
            displayName: getActionDisplayName(writeCall.function.name),
            description: getActionDescription(writeCall.function.name, functionArgs),
            params: functionArgs,
            impact: getActionImpact(writeCall.function.name),
            category: getActionCategory(writeCall.function.name)
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Execute read-only tools using the new executeReadTool function
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, functionArgs);
          
          const result = await executeReadTool(functionName, functionArgs, companyId, supabaseClient);
          
          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            name: functionName,
            content: JSON.stringify(result)
          };
        })
      );

      // Send tool results back to AI for final response
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            choice.message,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!finalResponse.ok) {
        throw new Error(`AI API error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const assistantMessage = finalData.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        message: assistantMessage,
        dataAccessed: toolResults.map((r: any) => r.name)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tool calls, return direct response
    const assistantMessage = choice.message.content;
    
    return new Response(JSON.stringify({ 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daton-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getPageContext(page: string): string {
  const contexts: Record<string, string> = {
    'dashboard': '📊 Dashboard - Forneça visão geral executiva, KPIs principais, alertas urgentes e tendências',
    'inventario-gee': '🌍 Inventário GEE - Analise emissões por escopo, fontes principais, tendências de carbono e oportunidades de redução',
    'licenciamento': '📄 Licenciamento - Priorize vencimentos próximos, status de conformidade, renovações pendentes',
    'metas': '🎯 Metas ESG - Analise progresso vs. metas, identifique metas em risco, sugira ações corretivas',
    'gestao-esg': '♻️ Gestão ESG - Visão holística de performance ESG, compare categorias (E/S/G), identifique gaps',
    'documentos': '📁 Documentos - Ajude com organização, busca, categorização e gestão documental',
    'auditoria': '🔍 Auditoria - Foque em conformidade, não conformidades, ações corretivas, próximas auditorias',
    'riscos': '⚠️ Riscos - Analise matriz de riscos, priorize riscos críticos, avalie tratamentos',
    'residuos': '♻️ Resíduos - Analise volumes, destinações, taxa de reciclagem, oportunidades de economia circular',
    'tarefas': '✅ Tarefas - Priorize tarefas atrasadas, distribua carga de trabalho, identifique gargalos',
    'projetos': '🚀 Projetos - Analise andamento, recursos, marcos, identifique riscos e atrasos',
    'okrs': '🎯 OKRs - Avalie progresso de objetivos, analise resultados-chave, sugira ajustes',
    'indicadores': '📈 Indicadores - Analise tendências, compare com metas, identifique desvios críticos'
  };
  return contexts[page] || '📋 Visão geral do sistema - Ajude o usuário a navegar e entender seus dados ESG';
}

