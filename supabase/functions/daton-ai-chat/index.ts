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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companyId, currentPage, confirmed, action, attachments } = await req.json();
    
    console.log('Daton AI Chat request:', { companyId, currentPage, messageCount: messages?.length, confirmed, attachmentsCount: attachments?.length });

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

    // Define tools for AI to access data (READ + WRITE)
    const tools = [
      // READ TOOLS
      {
        type: "function" as const,
        function: {
          name: "get_emissions_data",
          description: "Buscar dados de emissões de GEE da empresa, incluindo totais por escopo e fontes de emissão",
          parameters: {
            type: "object",
            properties: {
              scope: {
                type: "string",
                enum: ["1", "2", "3", "all"],
                description: "Escopo de emissões (1, 2, 3 ou 'all' para todos)"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_licenses_status",
          description: "Verificar status de licenças ambientais, incluindo vencimentos próximos",
          parameters: {
            type: "object",
            properties: {
              urgency: {
                type: "string",
                enum: ["all", "expiring_soon", "expired"],
                description: "Filtrar por urgência"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_goals_progress",
          description: "Obter progresso das metas ESG e de sustentabilidade da empresa",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["all", "environmental", "social", "governance"],
                description: "Categoria das metas"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_compliance_status",
          description: "Verificar status geral de conformidade regulatória",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_waste_metrics",
          description: "Obter métricas de gestão de resíduos",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_employee_metrics",
          description: "Obter dados sobre colaboradores e métricas sociais",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_pending_tasks",
          description: "Buscar tarefas pendentes ou em atraso",
          parameters: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["all", "pending", "overdue", "in_progress"],
                description: "Filtrar por status"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_goal_details",
          description: "Obter detalhes completos de uma meta específica incluindo histórico de progresso",
          parameters: {
            type: "object",
            properties: {
              goal_id: {
                type: "string",
                description: "ID da meta"
              }
            },
            required: ["goal_id"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_risks_summary",
          description: "Obter resumo de riscos ESG por categoria e nível",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["all", "Ambiental", "Social", "Governança"],
                description: "Filtrar por categoria"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "search_across_modules",
          description: "Buscar informações em múltiplos módulos do sistema",
          parameters: {
            type: "object",
            properties: {
              search_term: {
                type: "string",
                description: "Termo de busca"
              },
              modules: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["goals", "tasks", "licenses", "emissions", "waste", "risks", "employees"]
                },
                description: "Módulos para buscar (deixe vazio para buscar em todos)"
              }
            },
            required: ["search_term"]
          }
        }
      },
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

    // Build system prompt with context
    const systemPrompt = `Você é o Assistente IA do Daton, especialista em gestão ESG (Ambiental, Social e Governança).

**Contexto da Empresa:**
🏢 ${company?.name || 'Empresa'} | 🏭 ${company?.sector || 'Setor não informado'}
📍 Módulo atual: ${getPageContext(currentPage)}
${attachmentContext ? `\n\n**📎 ARQUIVOS ANEXADOS PELO USUÁRIO:**${attachmentContext}\n\n⚠️ **IMPORTANTE:** O usuário anexou arquivo(s). Use as informações extraídas para responder às perguntas ou executar as ações solicitadas. Se o usuário pedir para cadastrar/importar dados dos arquivos, use as ferramentas de escrita disponíveis (sempre pedindo confirmação).` : ''}

**SUAS CAPACIDADES:**

📊 **ANÁLISE E CONSULTA (Imediata):**
Você tem acesso total aos dados da empresa e pode:
• Analisar emissões de GEE por escopo e fonte
• Verificar status e vencimentos de licenças
• Acompanhar progresso de metas e OKRs
• Avaliar conformidade e riscos ESG
• Consultar métricas de resíduos e destinação
• Verificar dados de colaboradores por departamento
• Buscar tarefas pendentes e em atraso
• Obter detalhes completos de registros específicos
• Fazer buscas inteligentes em múltiplos módulos

✏️ **AÇÕES DE GERENCIAMENTO (Requer Confirmação):**
Você pode propor ações de escrita que incluem:

**Metas & Estratégia:**
• Criar e atualizar metas ESG
• Criar OKRs e adicionar resultados-chave
• Atualizar progresso de metas e OKRs
• Criar projetos ESG e adicionar tarefas

**Operacional:**
• Criar tarefas de coleta de dados
• Registrar licenças ambientais
• Adicionar fontes de emissão
• Registrar atividades de emissões
• Adicionar logs de resíduos

**Conformidade & Riscos:**
• Registrar não conformidades
• Criar riscos ESG
• Criar auditorias
• Criar indicadores de monitoramento
• Registrar medições de indicadores

**Gestão de Pessoas:**
• Adicionar funcionários
• Criar programas de treinamento
• Adicionar fornecedores e stakeholders

**⚠️ REGRAS CRÍTICAS:**

1. **Para Ações de Escrita:**
   - SEMPRE colete todos os dados necessários primeiro
   - Apresente um resumo claro e completo da ação
   - Liste todos os campos que serão preenchidos
   - Explique o impacto da ação
   - NUNCA execute sem confirmação explícita do usuário

2. **Para Consultas:**
   - Use as ferramentas disponíveis para buscar dados reais
   - Sempre que possível, busque informações específicas (IDs, datas, valores)
   - Forneça análises com base nos dados, não suposições
   - Se não encontrar dados, informe claramente

3. **Qualidade das Respostas:**
   - Seja conciso mas completo
   - Use formatação (bullets, negrito, emojis) para clareza
   - Apresente números e métricas quando relevantes
   - Sugira próximos passos quando apropriado
   - Se o usuário perguntar algo vago, faça perguntas clarificadoras

**FORMATO PARA CONFIRMAÇÃO DE AÇÕES:**

"📋 **Ação Proposta:** [Nome da ação]

**Detalhes da Operação:**
• Campo 1: [valor]
• Campo 2: [valor]
• ...

**Categoria:** [categoria]
**Impacto:** [nível de impacto]

⚠️ Esta ação irá [explicar o que acontecerá]. 

✅ Para confirmar, responda 'confirmar' ou 'executar'
❌ Para cancelar, responda 'cancelar'"

**CONTEXTO DO MÓDULO ATUAL:**
${getPageContext(currentPage)}

**DICAS DE INTELIGÊNCIA:**
• Quando o usuário mencionar "última", "recente" ou "atual", busque os dados mais recentes
• Quando perguntar sobre prazos, sempre calcule dias restantes ou vencidos
• Quando analisar métricas, compare com metas quando disponível
• Seja proativo em identificar problemas ou oportunidades nos dados`;

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
      
      // Execute read-only tools
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, functionArgs);
          
          const result = await executeTool(functionName, functionArgs, companyId, supabaseClient);
          
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

async function executeTool(
  toolName: string, 
  args: any, 
  companyId: string, 
  supabase: any
): Promise<any> {
  console.log(`Executing tool: ${toolName} for company ${companyId}`);

  switch (toolName) {
    case 'get_emissions_data': {
      const { scope } = args;
      
      // Get emission sources
      let query = supabase
        .from('emission_sources')
        .select('*, calculated_emissions(total_co2e, calculation_date)')
        .eq('company_id', companyId);
      
      if (scope !== 'all') {
        query = query.eq('scope', parseInt(scope));
      }
      
      const { data: sources, error } = await query;
      
      if (error) {
        console.error('Error fetching emissions:', error);
        return { error: 'Erro ao buscar dados de emissões' };
      }

      // Calculate totals by scope
      const totalsByScope = sources?.reduce((acc: any, source: any) => {
        const scopeKey = `scope${source.scope}`;
        const emissions = source.calculated_emissions?.[0]?.total_co2e || 0;
        acc[scopeKey] = (acc[scopeKey] || 0) + emissions;
        return acc;
      }, {}) || {};

      return {
        totalSources: sources?.length || 0,
        totalsByScope,
        totalEmissions: Object.values(totalsByScope).reduce((a: any, b: any) => a + b, 0),
        sources: sources?.map(s => ({
          name: s.name,
          category: s.category,
          scope: s.scope,
          emissions: s.calculated_emissions?.[0]?.total_co2e || 0
        })) || []
      };
    }

    case 'get_licenses_status': {
      const { urgency } = args;
      const now = new Date().toISOString();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('licenses')
        .select('*')
        .eq('company_id', companyId);
      
      if (urgency === 'expiring_soon') {
        query = query.gte('expiration_date', now).lte('expiration_date', thirtyDaysFromNow);
      } else if (urgency === 'expired') {
        query = query.lt('expiration_date', now);
      }
      
      const { data: licenses, error } = await query.order('expiration_date');
      
      if (error) {
        console.error('Error fetching licenses:', error);
        return { error: 'Erro ao buscar licenças' };
      }

      return {
        total: licenses?.length || 0,
        expiringSoon: licenses?.filter(l => 
          new Date(l.expiration_date) > new Date() && 
          new Date(l.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length || 0,
        expired: licenses?.filter(l => new Date(l.expiration_date) < new Date()).length || 0,
        licenses: licenses?.map(l => ({
          name: l.name,
          type: l.type,
          status: l.status,
          expirationDate: l.expiration_date,
          daysUntilExpiration: Math.ceil((new Date(l.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        })) || []
      };
    }

    case 'get_goals_progress': {
      const { category } = args;
      
      let query = supabase
        .from('goals')
        .select('*')
        .eq('company_id', companyId);
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data: goals, error } = await query;
      
      if (error) {
        console.error('Error fetching goals:', error);
        return { error: 'Erro ao buscar metas' };
      }

      const summary = {
        total: goals?.length || 0,
        onTrack: goals?.filter(g => g.progress >= 80).length || 0,
        atRisk: goals?.filter(g => g.progress >= 50 && g.progress < 80).length || 0,
        delayed: goals?.filter(g => g.progress < 50).length || 0,
        averageProgress: goals?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goals?.length || 1),
        goals: goals?.map(g => ({
          name: g.name,
          category: g.category,
          progress: g.progress,
          targetDate: g.target_date,
          status: g.status
        })) || []
      };

      return summary;
    }

    case 'get_compliance_status': {
      // Check various compliance indicators
      const [licensesResult, auditsResult, risksResult] = await Promise.all([
        supabase.from('licenses').select('*').eq('company_id', companyId).eq('status', 'Ativa'),
        supabase.from('audits').select('*').eq('company_id', companyId),
        supabase.from('risks').select('*').eq('company_id', companyId).in('risk_level', ['Alto', 'Crítico'])
      ]);

      return {
        activeLicenses: licensesResult.data?.length || 0,
        recentAudits: auditsResult.data?.length || 0,
        highRisks: risksResult.data?.length || 0,
        complianceScore: calculateComplianceScore(licensesResult.data, risksResult.data)
      };
    }

    case 'get_waste_metrics': {
      const { data: wasteLogs, error } = await supabase
        .from('waste_logs')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) {
        console.error('Error fetching waste data:', error);
        return { error: 'Erro ao buscar dados de resíduos' };
      }

      const byClass = wasteLogs?.reduce((acc: any, log: any) => {
        const classKey = log.class || 'Não classificado';
        acc[classKey] = (acc[classKey] || 0) + (log.quantity || 0);
        return acc;
      }, {}) || {};

      return {
        totalRecords: wasteLogs?.length || 0,
        totalQuantity: wasteLogs?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0,
        byClass,
        recycled: wasteLogs?.filter(l => l.final_destination?.includes('Reciclagem')).length || 0
      };
    }

    case 'get_employee_metrics': {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Ativo');
      
      if (error) {
        console.error('Error fetching employee data:', error);
        return { error: 'Erro ao buscar dados de colaboradores' };
      }

      return {
        totalActive: employees?.length || 0,
        byDepartment: employees?.reduce((acc: any, emp: any) => {
          const dept = emp.department || 'Não especificado';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {}) || {},
        averageTenure: 'N/A'
      };
    }

    case 'get_pending_tasks': {
      const { status } = args;
      const now = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('data_collection_tasks')
        .select('*')
        .eq('company_id', companyId);
      
      if (status === 'pending') {
        query = query.eq('status', 'Pendente');
      } else if (status === 'overdue') {
        query = query.eq('status', 'Em Atraso').lt('due_date', now);
      } else if (status === 'in_progress') {
        query = query.eq('status', 'Em Andamento');
      }
      
      const { data: tasks, error } = await query.order('due_date');
      
      if (error) return { error: 'Erro ao buscar tarefas' };

      return {
        total: tasks?.length || 0,
        tasks: tasks?.map(t => ({
          id: t.id,
          name: t.name,
          type: t.task_type,
          status: t.status,
          dueDate: t.due_date,
          daysUntilDue: Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        })) || []
      };
    }

    case 'get_goal_details': {
      const { goal_id } = args;
      
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goal_id)
        .eq('company_id', companyId)
        .single();
      
      if (goalError) return { error: 'Meta não encontrada' };

      const { data: updates } = await supabase
        .from('goal_progress_updates')
        .select('*')
        .eq('goal_id', goal_id)
        .order('update_date', { ascending: false })
        .limit(10);

      return {
        goal: {
          name: goal.goal_name,
          category: goal.category,
          targetValue: goal.target_value,
          baselineValue: goal.baseline_value,
          currentProgress: goal.progress,
          status: goal.status,
          targetDate: goal.target_date,
          unit: goal.unit
        },
        recentUpdates: updates?.map(u => ({
          date: u.update_date,
          value: u.current_value,
          progress: u.progress_percentage,
          notes: u.notes
        })) || []
      };
    }

    case 'get_risks_summary': {
      const { category } = args;
      
      let query = supabase
        .from('esg_risks')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Ativo');
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data: risks, error } = await query;
      
      if (error) return { error: 'Erro ao buscar riscos' };

      const byLevel = risks?.reduce((acc: any, risk: any) => {
        const level = risk.inherent_risk_level || 'Indefinido';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        total: risks?.length || 0,
        byLevel,
        critical: risks?.filter(r => r.inherent_risk_level === 'Crítico').length || 0,
        high: risks?.filter(r => r.inherent_risk_level === 'Alto').length || 0,
        risks: risks?.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          level: r.inherent_risk_level,
          probability: r.probability,
          impact: r.impact
        })) || []
      };
    }

    case 'search_across_modules': {
      const { search_term, modules } = args;
      const results: any = {};
      
      const searchModules = modules?.length > 0 ? modules : ['goals', 'tasks', 'licenses', 'emissions', 'risks'];
      
      for (const module of searchModules) {
        try {
          switch (module) {
            case 'goals': {
              const { data } = await supabase
                .from('goals')
                .select('id, goal_name, category, status')
                .eq('company_id', companyId)
                .ilike('goal_name', `%${search_term}%`)
                .limit(5);
              results.goals = data || [];
              break;
            }
            case 'tasks': {
              const { data } = await supabase
                .from('data_collection_tasks')
                .select('id, name, task_type, status, due_date')
                .eq('company_id', companyId)
                .ilike('name', `%${search_term}%`)
                .limit(5);
              results.tasks = data || [];
              break;
            }
            case 'licenses': {
              const { data } = await supabase
                .from('licenses')
                .select('id, license_name, license_type, status')
                .eq('company_id', companyId)
                .ilike('license_name', `%${search_term}%`)
                .limit(5);
              results.licenses = data || [];
              break;
            }
            case 'risks': {
              const { data } = await supabase
                .from('esg_risks')
                .select('id, title, category, inherent_risk_level')
                .eq('company_id', companyId)
                .ilike('title', `%${search_term}%`)
                .limit(5);
              results.risks = data || [];
              break;
            }
          }
        } catch (e) {
          console.error(`Error searching ${module}:`, e);
        }
      }

      return results;
    }

    default:
      return { error: `Ferramenta desconhecida: ${toolName}` };
  }
}

function calculateComplianceScore(licenses: any[], risks: any[]): number {
  let score = 100;
  
  // Penalize for missing/expired licenses
  const inactiveLicenses = licenses?.filter(l => l.status !== 'Ativa').length || 0;
  score -= inactiveLicenses * 5;
  
  // Penalize for high risks
  score -= (risks?.length || 0) * 10;
  
  return Math.max(0, Math.min(100, score));
}
