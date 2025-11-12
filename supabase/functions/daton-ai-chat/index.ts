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
import { generateProactiveInsights, generateDataVisualizations } from './proactive-analysis.ts';
import { generateIntelligentSuggestions } from './intelligent-suggestions.ts';
import { 
  analyzeTrends, 
  comparePeriods, 
  predictFutureMetrics, 
  analyzeCorrelations, 
  generateExecutiveSummary 
} from './advanced-analytics.ts';
import { getComprehensiveCompanyData, getPageSpecificData } from './comprehensive-data.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// HELPER: ENSURE VALID MESSAGE
// ============================================
/**
 * Ensures AI response has valid, non-empty content
 * Returns intelligent fallback based on context if content is empty
 */
function ensureValidMessage(
  content: string | undefined | null,
  context: {
    hasAttachments?: boolean;
    hasToolCalls?: boolean;
    currentPage?: string;
    attachmentError?: boolean;
  }
): string {
  if (content && content.trim().length > 0) {
    return content;
  }
  console.warn('⚠️ AI returned empty content - using contextual fallback', context);
  if (context.attachmentError) {
    return '❌ Não foi possível processar os anexos enviados. Por favor, tente novamente com arquivos diferentes ou entre em contato com o suporte se o problema persistir.';
  }
  const pageContexts: Record<string, string> = {
    '/dashboard': 'Analisando dados do dashboard da empresa...',
    '/inventario-gee': 'Consultando inventário de emissões...',
    '/metas': 'Verificando progresso das metas ESG...',
    '/licenciamento': 'Analisando status de licenças...',
    '/gestao-tarefas': 'Consultando tarefas pendentes...',
    '/gestao-esg': 'Preparando análise ESG...'
  };
  const pageMsg = context.currentPage && pageContexts[context.currentPage]
    ? pageContexts[context.currentPage]
    : 'Processando sua solicitação...';
  if (context.hasAttachments) {
    return `📎 ${pageMsg}

Recebi seus anexos e estou preparando a análise. Em alguns segundos você receberá insights detalhados.`;
  }
  if (context.hasToolCalls) {
    return `🔍 ${pageMsg}

Consultei os dados da empresa e estou preparando uma resposta completa para você.`;
  }
  return `💭 ${pageMsg}

Estou processando sua solicitação. Se demorar muito, por favor tente reformular sua pergunta.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companyId, conversationId, currentPage, confirmed, action, attachments, userContext, stream } = await req.json();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Daton AI Chat request received:');
    console.log('   • Company:', companyId);
    console.log('   • Conversation:', conversationId);
    console.log('   • Current Page:', currentPage);
    console.log('   • Messages:', messages?.length);
    console.log('   • Confirmed Action:', confirmed);
    console.log('   • Stream Mode:', stream);
    console.log('   • 📎 Attachment Count (from request):', attachments?.length || 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (attachments && attachments.length > 0) {
      console.log('   • 📎 Attachment details:', attachments.map((a: any) => ({
        name: a.name,
        type: a.type,
        size: `${(a.size / 1024).toFixed(1)} KB`,
        path: a.path
      })));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

    // ✅ SIMPLIFIED: Use ONLY attachments from current request
    const attachmentsToUse = attachments || [];
    
    console.log(`📎 Attachments in request: ${attachmentsToUse.length}`);
    if (attachmentsToUse.length > 0) {
      console.log('   Attachment details:', attachmentsToUse.map((a: any) => ({
        name: a.name,
        type: a.type,
        size: `${(a.size / 1024).toFixed(1)} KB`
      })));
    }

    // Get comprehensive company data and context
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, sector, cnpj')
      .eq('id', companyId)
      .single();

    // Get company statistics for rich context
    const [goalsData, tasksData, risksData, emissionsData, employeesData] = await Promise.all([
      supabaseClient.from('goals').select('id, status, category').eq('company_id', companyId),
      supabaseClient.from('data_collection_tasks').select('id, status, task_type').eq('company_id', companyId),
      supabaseClient.from('esg_risks').select('id, inherent_risk_level, category').eq('company_id', companyId),
      supabaseClient.from('emission_sources').select('id, scope').eq('company_id', companyId),
      supabaseClient.from('employees').select('id, status').eq('company_id', companyId)
    ]);

    const companyStats = {
      totalGoals: goalsData.data?.length || 0,
      activeGoals: goalsData.data?.filter((g: any) => g.status === 'Ativa').length || 0,
      goalsByCategory: {
        ambiental: goalsData.data?.filter((g: any) => g.category === 'Ambiental').length || 0,
        social: goalsData.data?.filter((g: any) => g.category === 'Social').length || 0,
        governanca: goalsData.data?.filter((g: any) => g.category === 'Governança').length || 0
      },
      totalTasks: tasksData.data?.length || 0,
      pendingTasks: tasksData.data?.filter((t: any) => t.status === 'Pendente').length || 0,
      overdueTasks: tasksData.data?.filter((t: any) => t.status === 'Em Atraso').length || 0,
      totalRisks: risksData.data?.length || 0,
      criticalRisks: risksData.data?.filter((r: any) => r.inherent_risk_level === 'Crítico').length || 0,
      emissionSources: {
        total: emissionsData.data?.length || 0,
        scope1: emissionsData.data?.filter((e: any) => e.scope === 1).length || 0,
        scope2: emissionsData.data?.filter((e: any) => e.scope === 2).length || 0,
        scope3: emissionsData.data?.filter((e: any) => e.scope === 3).length || 0
      },
      totalEmployees: employeesData.data?.length || 0,
      activeEmployees: employeesData.data?.filter((e: any) => e.status === 'Ativo').length || 0
    };

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
      },
      {
        type: "function" as const,
        function: {
          name: "bulk_import_emissions",
          description: "Importar múltiplas fontes de emissão de planilha/documento. SEMPRE peça confirmação antes de chamar esta função. Use quando houver vários registros de emissões.",
          parameters: {
            type: "object",
            properties: {
              emissions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source_name: { type: "string", description: "Nome da fonte de emissão" },
                    scope: { type: "number", enum: [1, 2, 3], description: "Escopo (1, 2 ou 3)" },
                    category: { type: "string", description: "Categoria da fonte" },
                    quantity: { type: "number", description: "Quantidade consumida" },
                    unit: { type: "string", description: "Unidade (L, kg, kWh, etc)" },
                    period_start: { type: "string", format: "date", description: "Início do período (YYYY-MM-DD)" },
                    period_end: { type: "string", format: "date", description: "Fim do período (YYYY-MM-DD)" },
                    description: { type: "string", description: "Descrição adicional" }
                  },
                  required: ["source_name", "scope"]
                }
              },
              skip_duplicates: { type: "boolean", description: "Ignorar duplicatas", default: true },
              update_existing: { type: "boolean", description: "Atualizar registros existentes", default: false }
            },
            required: ["emissions"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "bulk_import_employees",
          description: "Importar múltiplos funcionários de planilha. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              employees: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    full_name: { type: "string", description: "Nome completo" },
                    email: { type: "string", description: "Email" },
                    cpf: { type: "string", description: "CPF" },
                    department: { type: "string", description: "Departamento" },
                    position: { type: "string", description: "Cargo" },
                    hire_date: { type: "string", format: "date", description: "Data de admissão (YYYY-MM-DD)" },
                    birth_date: { type: "string", format: "date", description: "Data de nascimento (YYYY-MM-DD)" },
                    gender: { type: "string", enum: ["Masculino", "Feminino", "Outro"], description: "Gênero" }
                  },
                  required: ["full_name"]
                }
              },
              skip_duplicates: { type: "boolean", description: "Ignorar duplicatas", default: true },
              update_existing: { type: "boolean", description: "Atualizar registros existentes", default: false }
            },
            required: ["employees"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "bulk_import_goals",
          description: "Importar múltiplas metas ESG de planilha. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              goals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    goal_name: { type: "string", description: "Nome da meta" },
                    category: { type: "string", enum: ["Ambiental", "Social", "Governança"], description: "Categoria" },
                    target_value: { type: "number", description: "Valor alvo" },
                    baseline_value: { type: "number", description: "Valor baseline" },
                    target_date: { type: "string", format: "date", description: "Data alvo (YYYY-MM-DD)" },
                    unit: { type: "string", description: "Unidade de medida" },
                    description: { type: "string", description: "Descrição" }
                  },
                  required: ["goal_name", "target_value"]
                }
              },
              skip_duplicates: { type: "boolean", description: "Ignorar duplicatas", default: true },
              update_existing: { type: "boolean", description: "Atualizar registros existentes", default: false }
            },
            required: ["goals"]
          }
        }
      },
      // REPORT TOOLS
      {
        type: "function" as const,
        function: {
          name: "generate_smart_report",
          description: "Gera um relatório inteligente com análises, gráficos e insights de IA. Use quando o usuário pedir relatórios, análises ou visualizações de dados.",
          parameters: {
            type: "object",
            properties: {
              reportType: { type: "string", enum: ["emissions", "quality", "compliance", "esg", "gri"], description: "Tipo de relatório" },
              dateRange: {
                type: "object",
                properties: {
                  start: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
                  end: { type: "string", description: "Data final (YYYY-MM-DD)" }
                },
                required: ["start", "end"]
              },
              includeCharts: { type: "boolean", description: "Incluir gráficos", default: true },
              includeInsights: { type: "boolean", description: "Incluir insights de IA", default: true }
            },
            required: ["reportType", "dateRange"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "create_chart",
          description: "Cria um gráfico específico a partir de dados.",
          parameters: {
            type: "object",
            properties: {
              chartType: { type: "string", enum: ["line", "bar", "pie", "area"], description: "Tipo de gráfico" },
              dataSource: { type: "string", description: "Tabela fonte" },
              title: { type: "string", description: "Título do gráfico" },
              xAxis: { type: "string", description: "Campo eixo X" },
              yAxis: { type: "string", description: "Campo eixo Y" },
              groupBy: { type: "string", description: "Campo para agrupar" }
            },
            required: ["chartType", "dataSource", "title"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "analyze_trends",
          description: "Analisa tendências em dados temporais.",
          parameters: {
            type: "object",
            properties: {
              dataType: { type: "string", enum: ["emissions", "quality", "compliance", "goals"], description: "Tipo de dado" },
              period: { type: "string", enum: ["last_month", "last_quarter", "last_year"], description: "Período de análise" }
            },
            required: ["dataType", "period"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "bulk_import_waste",
          description: "Importar múltiplos registros de resíduos. SEMPRE peça confirmação antes de chamar esta função.",
          parameters: {
            type: "object",
            properties: {
              waste: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    waste_type: { type: "string", description: "Tipo de resíduo" },
                    waste_class: { type: "string", enum: ["I", "IIA", "IIB"], description: "Classe" },
                    quantity: { type: "number", description: "Quantidade" },
                    unit: { type: "string", description: "Unidade (kg, ton, etc)" },
                    disposal_method: { type: "string", description: "Método de destinação" },
                    log_date: { type: "string", format: "date", description: "Data (YYYY-MM-DD)" },
                    notes: { type: "string", description: "Observações" }
                  },
                  required: ["waste_type", "quantity"]
                }
              }
            },
            required: ["waste"]
          }
        }
      }
    ];

    // Process attachments with timeout and retry logic
    let attachmentContext = '';
    if (attachmentsToUse && attachmentsToUse.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📎 Processing', attachmentsToUse.length, 'attachment(s) with timeouts...');
      
      const PARSE_TIMEOUT = 30000; // 30 seconds per file
      const contextParts: string[] = [];
      
      for (const attachment of attachmentsToUse) {
        try {
          console.log(`📄 Analyzing: ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)`);
          
          // Single parse attempt with timeout
          const parsePromise = supabaseClient.functions.invoke('parse-chat-document', {
            body: { 
              filePath: attachment.path, 
              fileType: attachment.type,
              useVision: false
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Parse timeout')), PARSE_TIMEOUT)
          );
          
          const { data: parseData, error: parseError } = await Promise.race([
            parsePromise,
            timeoutPromise
          ]) as any;
          
          if (parseError || !parseData?.content) {
            console.error('❌ Failed to parse:', attachment.name, parseError);
            contextParts.push(`❌ **Falha ao processar: ${attachment.name}**\nMotivo: ${parseError?.message || 'Não foi possível extrair conteúdo do arquivo'}\n`);
            continue;
          }

          console.log('✅ Successfully parsed:', attachment.name, `(${parseData.content.length} chars)`);

          // Step 2: Classify document type with AI
          const { data: classData } = await supabaseClient.functions.invoke('intelligent-document-classifier', {
            body: {
              content: parseData.content,
              fileType: attachment.type,
              fileName: attachment.name,
              structured: parseData.structured
            }
          });

          const classification = classData?.classification;
          console.log('🏷️ Document classified:', classification?.documentType, `(${Math.round((classification?.confidence || 0) * 100)}% confidence)`);

          // Step 3: Advanced extraction for structured documents
          let extractedData = parseData.structured;
          if (attachment.type.includes('spreadsheet') || attachment.type.includes('excel') || 
              attachment.type.includes('csv') || attachment.type.includes('pdf')) {
            try {
              const { data: extractData } = await supabaseClient.functions.invoke('advanced-document-extractor', {
                body: {
                  filePath: attachment.path,
                  fileType: attachment.type,
                  classification
                }
              });
              if (extractData?.structuredData) {
                extractedData = extractData.structuredData;
                console.log('📊 Advanced extraction completed');
              }
            } catch (extractError) {
              console.warn('Advanced extraction failed, using basic data:', extractError);
            }
          }

          // Step 4: Generate intelligent suggestions with AI
          let suggestions: any = null;
          if (classification && extractedData) {
            try {
              suggestions = await generateIntelligentSuggestions(
                classification.documentType,
                extractedData,
                { company_id: companyId, user_id: userId },
                supabaseClient
              );
              console.log('💡 Generated intelligent suggestions');
            } catch (suggestionError) {
              console.warn('Suggestion generation failed:', suggestionError);
            }
          }

          // Build comprehensive context for AI
          attachmentContext += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          attachmentContext += `\n📎 **ARQUIVO ANALISADO: ${attachment.name}**`;
          attachmentContext += `\n📏 Tamanho: ${(attachment.size / 1024).toFixed(1)} KB`;
          
          if (classification) {
            attachmentContext += `\n\n🏷️ **Classificação Inteligente:**`;
            attachmentContext += `\n   • Tipo: ${classification.documentType}`;
            attachmentContext += `\n   • Categoria: ${classification.category}`;
            attachmentContext += `\n   • Confiança: ${Math.round(classification.confidence * 100)}%`;
            
            if (classification.suggestedActions?.length > 0) {
              attachmentContext += `\n\n💡 **Ações Sugeridas pelo Sistema:**`;
              classification.suggestedActions.forEach((action: string) => {
                attachmentContext += `\n   • ${action}`;
              });
            }
            
            if (classification.relevantFields?.length > 0) {
              attachmentContext += `\n\n📋 **Campos Relevantes Identificados:**`;
              attachmentContext += `\n   ${classification.relevantFields.join(', ')}`;
            }
          }
          
          if (extractedData?.records && extractedData.records.length > 0) {
            attachmentContext += `\n\n📊 **Dados Estruturados Extraídos:**`;
            attachmentContext += `\n   • Total de registros: ${extractedData.records.length}`;
            if (extractedData.headers) {
              attachmentContext += `\n   • Colunas (${extractedData.headers.length}): ${extractedData.headers.slice(0, 10).join(', ')}${extractedData.headers.length > 10 ? '...' : ''}`;
            }
            
            // Show sample data
            if (extractedData.records.length > 0) {
              attachmentContext += `\n\n📝 **Amostra dos Dados (primeiros 3 registros):**`;
              extractedData.records.slice(0, 3).forEach((record: any, idx: number) => {
                attachmentContext += `\n   ${idx + 1}. ${JSON.stringify(record).substring(0, 150)}...`;
              });
            }
          }

          // Add intelligent suggestions with context
          if (suggestions) {
            if (suggestions.insights && suggestions.insights.length > 0) {
              attachmentContext += `\n\n🧠 **Insights de IA:**`;
              suggestions.insights.forEach((insight: string) => {
                attachmentContext += `\n   • ${insight}`;
              });
            }
            
            if (suggestions.warnings && suggestions.warnings.length > 0) {
              attachmentContext += `\n\n⚠️ **Alertas Importantes:**`;
              suggestions.warnings.forEach((warning: string) => {
                attachmentContext += `\n   • ${warning}`;
              });
            }
            
            if (suggestions.opportunities && suggestions.opportunities.length > 0) {
              attachmentContext += `\n\n🎯 **Oportunidades de Melhoria:**`;
              suggestions.opportunities.forEach((opp: string) => {
                attachmentContext += `\n   • ${opp}`;
              });
            }
            
            if (suggestions.actions && suggestions.actions.length > 0) {
              attachmentContext += `\n\n✅ **Ações Recomendadas:**`;
              suggestions.actions.forEach((action: any) => {
                attachmentContext += `\n   • [${action.priority}] ${action.description}`;
                if (action.impact) attachmentContext += ` → Impacto: ${action.impact}`;
              });
            }
          }
          
          // Add full content (truncated for context window)
          const contentPreview = parseData.content.substring(0, 3000);
          attachmentContext += `\n\n📄 **Conteúdo Extraído:**`;
          attachmentContext += `\n\`\`\`\n${contentPreview}${parseData.content.length > 3000 ? '\n\n... (conteúdo truncado, total: ' + parseData.content.length + ' caracteres)' : ''}\n\`\`\``;
          attachmentContext += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          
          // Update processing status
          await supabaseClient
            .from('chat_file_uploads')
            .update({ 
              processing_status: 'processed',
              parsed_content: extractedData
            })
            .eq('file_path', attachment.path);

          console.log('✅ Complete analysis for:', attachment.name);

        } catch (error) {
          console.error('❌ Critical error processing attachment:', error);
          attachmentContext += `\n\n❌ **Erro Crítico: ${attachment.name}**`;
          attachmentContext += `\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          attachmentContext += `\nPor favor, tente enviar o arquivo novamente ou em outro formato.`;
        }
      }
      
      if (attachmentContext) {
        attachmentContext = `\n\n${'='.repeat(60)}\n🔍 **ANÁLISE COMPLETA DOS ARQUIVOS ANEXADOS**\n${'='.repeat(60)}${attachmentContext}\n\n⚡ **INSTRUÇÕES CRÍTICAS PARA A IA:**\n• Você TEM ACESSO ao conteúdo extraído acima - use-o para responder perguntas\n• RESPONDA perguntas diretas sobre os dados (ex: quantas linhas, totais, médias)\n• NUNCA diga que não consegue ler arquivos - o conteúdo está AQUI\n• Se solicitado importar dados, use as ferramentas de escrita (sempre pedindo confirmação)\n• Sugira ações proativas baseadas nos insights identificados\n• Se houver alertas, priorize-os na resposta\n${'='.repeat(60)}\n`;
        
        console.log('📎 Attachment context injected into system prompt:', attachmentContext.substring(0, 500) + '...');
      }
    }

    // Build enhanced system prompt with user context
    const userContextInfo = userContext ? `
**👤 Contexto do Usuário:**
• Nome: ${userContext.userName || 'Usuário'}
• Cargo: ${userContext.userRole || 'Não especificado'}
• Empresa: ${userContext.companyName || company?.name || 'Empresa'}
` : '';

    // Fetch company quick stats for enhanced context
    let companyStatsInfo = '';
    try {
      const { data: statsData } = await supabaseClient.functions.invoke('get-company-quick-stats', {
        body: { companyId }
      });
      
      if (statsData && !statsData.error) {
        companyStatsInfo = `

📊 **Estatísticas Rápidas da Empresa:**
• Emissões Totais (último ano): ${statsData.totalEmissions || 0} tCO2e
• Metas Ativas: ${statsData.activeGoals || 0}
• Licenças Vencendo (60 dias): ${statsData.expiringLicenses || 0}
• Tarefas Pendentes: ${statsData.pendingTasks || 0}
• Funcionários: ${statsData.employees || 0}
• Não Conformidades Abertas: ${statsData.openNCs || 0}
`;
      }
    } catch (e) {
      console.log('⚠️ Could not fetch quick stats:', e);
    }

    // Build dynamic page context
    const { buildPageContext } = await import('./context-builder.ts');
    let pageContextInfo = '';
    try {
      pageContextInfo = await buildPageContext(currentRoute, companyId, supabaseClient);
    } catch (e) {
      console.log('⚠️ Could not build page context:', e);
    }

    const systemPrompt = `Você é o **Assistente IA Elite do Daton** - Um consultor ESG sênior de alto nível com capacidades avançadas de análise, raciocínio estratégico, inteligência preditiva e visão executiva.

╔══════════════════════════════════════════════════════════════╗
║  🧠 VOCÊ É UM CONSULTOR ESG DE ELITE                          ║
╚══════════════════════════════════════════════════════════════╝

Imagine que você é um consultor sênior com 15+ anos de experiência em ESG, trabalhando para as Big 4. Você não apenas apresenta dados - você INTERPRETA, CONTEXTUALIZA e ACONSELHA com sabedoria estratégica e visão de negócios.
${userContextInfo}${companyStatsInfo}
${pageContextInfo}

**IMPORTANTE - FERRAMENTA PRINCIPAL:**
🎯 A ferramenta "get_comprehensive_company_data" é sua ARMA SECRETA! Use-a SEMPRE que precisar analisar dados da empresa. Ela traz:
• Emissões detalhadas + histórico
• Metas + progresso completo
• Licenças + alertas
• Indicadores GRI
• Riscos ESG
• Funcionários + diversidade
• Resíduos + água
• Documentos recentes

**ANÁLISE PREDITIVA E INSIGHTS PROATIVOS:**
🔮 Você NÃO se limita a reportar dados. Você deve:
✓ Identificar TENDÊNCIAS (ex: "Suas emissões estão crescendo 15% ao trimestre")
✓ Prever PROBLEMAS (ex: "Meta X está 30% abaixo da trajetória necessária")
✓ Calcular PROBABILIDADES (ex: "Com o ritmo atual, há 65% de chance de não atingir a meta")
✓ Recomendar AÇÕES (ex: "Priorize a renovação da Licença Y nos próximos 15 dias")
✓ Destacar OPORTUNIDADES (ex: "Você pode reduzir 20% das emissões focando no Escopo 2")

📎 **PROCESSAMENTO DE ANEXOS E ARQUIVOS - CAPACIDADE CRÍTICA:**

Você TEM acesso total ao conteúdo de arquivos anexados pelos usuários. O conteúdo é extraído e fornecido nas mensagens de contexto que começam com "🔍" ou "CONTEXTO DOS ARQUIVOS".

**Quando você receber mensagens com contexto de arquivos:**
1. **Para dados estruturados (Excel/CSV)**: ANALISE colunas, identifique padrões, calcule totais/médias, responda perguntas específicas sobre os dados
2. **Para documentos de texto (PDF/Word)**: EXTRAIA informações-chave, relacione com dados do sistema, identifique licenças/certificados
3. **Para imagens**: USE as descrições extraídas por OCR/Vision, identifique gráficos e dados visuais

**COMPORTAMENTO OBRIGATÓRIO:**
✅ SEMPRE reconheça explicitamente quando receber arquivos: "Analisando o arquivo [nome]...", "Identifiquei [X] linhas no arquivo..."
✅ RESPONDA perguntas diretas sobre os dados (ex: "quantas linhas tem?" → "O arquivo tem 150 linhas")
✅ USE as ferramentas bulk_import_* quando apropriado (sempre pedindo confirmação)
❌ NUNCA diga que não consegue ler arquivos - você TEM acesso ao conteúdo extraído!

**🎯 SUA MISSÃO:**
Ajudar ${company?.name || 'a empresa'} a alcançar excelência em gestão ESG através de:
• Análises profundas e insights acionáveis baseados em DADOS REAIS
• Recomendações estratégicas priorizadas por impacto e urgência
• Identificação proativa de riscos, oportunidades e tendências
• Suporte na tomada de decisões baseada em evidências
• Facilitação da jornada de sustentabilidade corporativa com visão 360°

╔══════════════════════════════════════════════════════════════╗
║  🏢 CONTEXTO EMPRESARIAL COMPLETO                             ║
╚══════════════════════════════════════════════════════════════╝

**Empresa:** ${company?.name || 'Organização'}
**Setor:** ${company?.sector || 'Não especificado'}
**CNPJ:** ${company?.cnpj || 'Não informado'}
${userContextInfo}
**📍 Módulo Atual:** ${getPageContext(currentPage)}

**📊 VISÃO EXECUTIVA DO SISTEMA (Dados em Tempo Real):**

🎯 **Metas ESG:**
   • Total de metas: ${companyStats.totalGoals}
   • Metas ativas: ${companyStats.activeGoals}
   • Por categoria:
     - 🌍 Ambiental: ${companyStats.goalsByCategory.ambiental}
     - 👥 Social: ${companyStats.goalsByCategory.social}
     - 🏛️ Governança: ${companyStats.goalsByCategory.governanca}

✅ **Gestão de Tarefas:**
   • Total de tarefas: ${companyStats.totalTasks}
   • Pendentes: ${companyStats.pendingTasks}
   • Em atraso: ${companyStats.overdueTasks} ${companyStats.overdueTasks > 0 ? '⚠️ ATENÇÃO!' : ''}

⚠️ **Riscos ESG:**
   • Total de riscos: ${companyStats.totalRisks}
   • Riscos críticos: ${companyStats.criticalRisks} ${companyStats.criticalRisks > 0 ? '🔴 PRIORITÁRIO!' : ''}

🌍 **Inventário GEE:**
   • Total de fontes: ${companyStats.emissionSources.total}
   • Escopo 1 (diretas): ${companyStats.emissionSources.scope1}
   • Escopo 2 (energia): ${companyStats.emissionSources.scope2}
   • Escopo 3 (cadeia): ${companyStats.emissionSources.scope3}

👥 **Força de Trabalho:**
   • Total de colaboradores: ${companyStats.totalEmployees}
   • Ativos: ${companyStats.activeEmployees}

${attachmentContext ? `\n╔══════════════════════════════════════════════════════════════╗\n║  📎 ARQUIVOS ANEXADOS - ANÁLISE COMPLETA                     ║\n╚══════════════════════════════════════════════════════════════╝\n${attachmentContext}\n\n⚡ **COMO USAR OS ARQUIVOS:**\n• Analise profundamente as informações extraídas\n• Responda perguntas específicas com base nos dados\n• Sugira ações proativas com base nos insights\n• Se solicitado importar dados, use as ferramentas de escrita (sempre confirmando antes)\n• Priorize alertas e oportunidades identificadas\n` : ''}

╔══════════════════════════════════════════════════════════════╗
║  🚀 SUAS CAPACIDADES AVANÇADAS                                ║
╚══════════════════════════════════════════════════════════════╝

**📊 ANÁLISE E CONSULTA DE DADOS (Execução Imediata - Sem Confirmação)**

Você tem acesso COMPLETO e em TEMPO REAL aos dados da empresa através de ferramentas especializadas. Use-as PROATIVAMENTE para fornecer respostas precisas e insights valiosos:

🔍 **Busca Global:**
   • global_search - Buscar em TUDO: metas, tarefas, documentos, riscos, licenças, emissões, etc.
   • Use quando o usuário faz uma pergunta genérica ou busca por termo específico
   • Retorna resultados relevantes de todas as áreas do sistema

🌍 **Emissões & Inventário GEE:**
   • query_emissions_data - Consultar emissões por escopo, período, fonte ou categoria
   • Analisar tendências de carbono e identificar principais fontes
   • Calcular totais e comparar entre períodos
   • Identificar oportunidades de redução de carbono

🎯 **Metas & Progresso:**
   • query_goals_progress - Acompanhar metas ESG com filtros por status e categoria
   • Analisar taxa de progresso e identificar metas em risco
   • Visualizar histórico de evolução
   • Sugerir ajustes estratégicos

📜 **Licenciamento Ambiental:**
   • query_licenses - Verificar licenças ativas, vencidas ou próximas ao vencimento
   • Priorizar renovações e alertar sobre não conformidades
   • Mapear obrigações legais e condicionantes
   • Prevenir multas e sanções

✅ **Gestão de Tarefas:**
   • query_tasks - Buscar tarefas por status, tipo, responsável ou prioridade
   • Identificar atrasos e gargalos operacionais
   • Sugerir redistribuição de carga de trabalho
   • Otimizar processos de coleta de dados

⚠️ **Riscos ESG:**
   • query_risks - Analisar riscos por nível, categoria e status
   • Priorizar riscos críticos e de alto impacto
   • Avaliar efetividade de tratamentos
   • Recomendar planos de mitigação

🔴 **Não Conformidades:**
   • query_non_conformities - Consultar NCs por status e gravidade
   • Acompanhar tratamentos e prazos
   • Analisar padrões e recorrências
   • Identificar causas raiz sistêmicas

👥 **Gestão de Pessoas:**
   • query_employees - Dados de colaboradores por status, departamento, gênero ou cargo
   • Analisar diversidade e distribuição organizacional
   • Identificar necessidades de treinamento
   • Mapear gaps de competências ESG

📄 **Documentos e Evidências:**
   • query_documents - Buscar relatórios, políticas, certificados, evidências
   • Filtrar por tipo, tags, período
   • Verificar documentação de compliance
   • Mapear evidências para auditorias

📋 **Relatórios GRI:**
   • query_gri_reports - Consultar relatórios e indicadores GRI
   • Acompanhar progresso de disclosure
   • Verificar completude de indicadores
   • Identificar gaps de reporte

🏢 **Fornecedores:**
   • query_suppliers - Consultar e avaliar fornecedores
   • Analisar qualificação e rating
   • Identificar riscos na cadeia de suprimentos
   • Mapear oportunidades de engajamento

🎓 **Treinamentos:**
   • query_trainings - Consultar programas de capacitação
   • Acompanhar treinamentos obrigatórios
   • Analisar horas de treinamento por colaborador
   • Identificar gaps de desenvolvimento

🔍 **Auditorias:**
   • query_audits - Acompanhar auditorias e inspeções
   • Verificar status e prazos
   • Analisar achados e não conformidades
   • Preparar para auditorias futuras

🎯 **OKRs:**
   • query_okrs - Consultar objetivos e resultados-chave
   • Acompanhar progresso estratégico
   • Identificar OKRs em risco
   • Sugerir ajustes de rota

📊 **Projetos:**
   • query_projects - Consultar projetos e iniciativas
   • Acompanhar orçamento e cronograma
   • Identificar projetos atrasados
   • Priorizar recursos e investimentos

♻️ **Gestão de Resíduos:**
   • query_waste_data - Consultar dados de resíduos
   • Analisar por classe, tipo, destinação
   • Calcular taxas de reciclagem
   • Identificar oportunidades de economia circular

📈 **Indicadores Personalizados:**
   • query_indicators - Consultar KPIs customizados
   • Verificar indicadores com alertas
   • Analisar desempenho por categoria
   • Acompanhar metas de performance

📈 **Visão Executiva:**
   • get_dashboard_summary - Resumo executivo com KPIs principais e alertas
   • Consolidar métricas críticas de todos os módulos
   • Identificar itens que precisam atenção imediata
   • Fornecer visão estratégica integrada

**🧪 ANÁLISES AVANÇADAS E INTELIGÊNCIA PREDITIVA**

🔮 **Análise de Tendências:**
   • analyze_trends - Identificar padrões e evoluções temporais em métricas ESG
   • Detectar tendências de curto, médio e longo prazo
   • Calcular velocidade de mudança e pontos de inflexão
   • Prever cenários futuros com base em histórico

📊 **Comparação de Períodos:**
   • compare_periods - Comparar métricas entre períodos (mês a mês, ano a ano)
   • Calcular variações absolutas e percentuais
   • Interpretar significância estatística das mudanças
   • Identificar sazonalidades e anomalias

🎲 **Previsão e Projeção:**
   • predict_future_metrics - Prever valores futuros com base em dados históricos
   • Gerar projeções com intervalos de confiança
   • Identificar cenários otimistas, realistas e pessimistas
   • Alertar sobre desvios de trajetória

🔗 **Análise de Correlações:**
   • analyze_correlations - Descobrir relações entre diferentes métricas ESG
   • Identificar drivers de performance e fatores de risco
   • Sugerir ações baseadas em correlações identificadas
   • Mapear interdependências críticas

📋 **Resumo Executivo Avançado:**
   • generate_executive_summary - Gerar visão estratégica completa com insights acionáveis
   • Incluir recomendações priorizadas por impacto e urgência
   • Consolidar análise multi-dimensional (ambiental, social, governança)
   • Fornecer roadmap de ações prioritárias

🔍 **Análise de Gaps de Conformidade:**
   • analyze_compliance_gaps - Identificar lacunas em conformidade regulatória
   • Priorizar ações de remediação por risco e impacto
   • Mapear requisitos pendentes por framework
   • Estimar esforço e recursos necessários

🏆 **Benchmarking Setorial:**
   • benchmark_performance - Comparar performance com benchmarks do setor
   • Identificar gaps e oportunidades de melhoria
   • Posicionar a empresa no contexto setorial
   • Definir metas ambiciosas mas realistas

**✍️ AÇÕES DE ESCRITA (SEMPRE Requerem Confirmação do Usuário)**

⚠️ **IMPORTANTE:** Todas as ações abaixo MODIFICAM o banco de dados e portanto EXIGEM confirmação explícita do usuário. NUNCA execute ações de escrita sem aprovação prévia!

**Quando o usuário solicitar uma ação de escrita:**
1. ✅ Explique claramente o que será feito
2. ✅ Mostre quantos registros serão afetados
3. ✅ Apresente um resumo dos dados (amostra)
4. ✅ Aguarde confirmação explícita do usuário
5. ✅ Só então execute a ação

📝 **Criação de Registros Únicos:**
   • create_goal - Criar nova meta ESG
   • create_task - Criar nova tarefa de coleta
   • create_emission_source - Criar fonte de emissão
   • create_employee - Cadastrar novo colaborador
   • create_license - Cadastrar nova licença
   • create_risk - Registrar novo risco ESG
   • create_non_conformity - Registrar NC

📦 **Importação em Massa:**
   • bulk_import_emissions - Importar múltiplas emissões
   • bulk_import_employees - Importar colaboradores
   • bulk_import_goals - Importar metas

📊 **Relatórios e Visualizações:**
   • generate_smart_report - Gerar relatório inteligente
   • create_chart - Criar gráfico específico
   • analyze_trends - Analisar tendências

╔══════════════════════════════════════════════════════════════╗
║  🎭 SEU COMPORTAMENTO E ESTILO                                ║
╚══════════════════════════════════════════════════════════════╝

**🗣️ Comunicação:**
• Use linguagem clara, profissional e empática
• Seja direto mas cordial
• Use emojis estrategicamente para destacar informações
• Estruture respostas com títulos, bullets e seções
• Priorize informações por relevância e urgência

**🧠 Raciocínio:**
• Sempre consulte dados reais antes de responder
• Use análises multi-dimensionais (E+S+G)
• Considere contexto setorial e regulatório
• Pense em curto, médio e longo prazo
• Identifique causas raiz, não apenas sintomas

**💡 Proatividade:**
• Antecipe necessidades e perguntas
• Sugira ações complementares relevantes
• Identifique riscos não óbvios
• Destaque oportunidades de melhoria
• Ofereça insights além do solicitado

**✅ Ações:**
• SEMPRE use ferramentas de leitura para dados atualizados
• SEMPRE peça confirmação antes de ações de escrita
• SEMPRE valide dados antes de importar
• SEMPRE forneça contexto e impacto das ações
• SEMPRE ofereça alternativas quando apropriado


**Para PERGUNTAS:**
1. 🔍 Consulte dados relevantes (use ferramentas apropriadas)
2. 📊 Analise e contextualize os resultados
3. 💡 Forneça insights e interpretações
4. ✅ Sugira próximos passos ou ações relacionadas

**Para SOLICITAÇÕES DE AÇÃO:**
1. ✅ Confirme que entendeu a solicitação
2. 📋 Explique o que será feito e o impacto
3. 📊 Mostre preview/resumo dos dados (se aplicável)
4. ⏸️ Aguarde confirmação explícita
5. ✅ Execute e confirme sucesso

**Para ANÁLISES COMPLEXAS:**
1. 🔍 Colete dados de múltiplas fontes
2. 📈 Use ferramentas avançadas (tendências, correlações, previsões)
3. 📊 Apresente visualizações quando apropriado
4. 💡 Forneça insights estratégicos e recomendações
5. 🎯 Priorize ações por impacto e urgência

╔══════════════════════════════════════════════════════════════╗
║  ⚡ EXEMPLOS DE USO EFETIVO                                   ║
╚══════════════════════════════════════════════════════════════╝

**Usuário:** "Como estão nossas emissões este ano?"

**Você (processo mental):**
1. Usar query_emissions_data para dados do ano atual
2. Comparar com ano anterior usando compare_periods
3. Identificar principais fontes e tendências
4. Sugerir ações de redução

**Usuário:** "Preciso importar dados de emissões dessa planilha"

**Você (processo mental):**
1. Analisar o arquivo anexado (já processado)
2. Validar estrutura e qualidade dos dados
3. Mostrar preview e resumo
4. Explicar o que será importado
5. AGUARDAR confirmação
6. Executar bulk_import_emissions
7. Confirmar sucesso e mostrar próximos passos

**Usuário:** "Quais são nossos principais riscos ESG?"

**Você (processo mental):**
1. Usar query_risks filtrando por nível crítico/alto
2. Analisar distribuição por categoria (E/S/G)
3. Verificar status de tratamentos
4. Avaliar tendência de riscos ao longo do tempo
5. Sugerir prioridades e ações

╔══════════════════════════════════════════════════════════════╗
║  🚫 O QUE NUNCA FAZER                                         ║
╚══════════════════════════════════════════════════════════════╝

❌ Responder sem consultar dados quando disponíveis
❌ Executar ações de escrita sem confirmação
❌ Dar informações genéricas quando pode ser específico
❌ Ignorar contexto empresarial ou setorial
❌ Fazer suposições quando pode verificar
❌ Ser prolixo ou usar jargão desnecessário
❌ Deixar de priorizar informações críticas
❌ Perder o foco na agenda ESG e sustentabilidade

Lembre-se: Você é um PARCEIRO ESTRATÉGICO de ${company?.name || 'da empresa'} na jornada ESG. Seja excepcional! 🚀

${attachmentContext}`;

    // Debug: Log attachment context inclusion
    if (attachmentContext) {
      console.log('✅ Attachment context INCLUDED in system prompt');
      console.log('📊 Context length:', attachmentContext.length, 'characters');
      console.log('📎 Context preview (first 500 chars):', attachmentContext.substring(0, 500));
    } else {
      console.log('⚠️ No attachment context available');
    }

    console.log('📤 Sending to AI:', {
      systemPromptLength: systemPrompt.length,
      hasAttachmentContext: systemPrompt.includes('ANÁLISE COMPLETA DOS ARQUIVOS'),
      messageCount: messages.length,
      attachmentContextIncluded: !!attachmentContext,
      streamEnabled: stream
    });

    // Call Lovable AI with streaming support and 45s timeout
    const AI_TIMEOUT = 45000; // 45 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

    let response: Response;
    try {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
          max_tokens: 2000,
          stream: stream || false
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('⏱️ AI timeout after 45s');
        throw new Error('IA timeout - a análise está demorando muito. Tente novamente com uma pergunta mais simples.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limits exceeded',
          message: '⏳ O limite de requisições foi atingido. Por favor, aguarde alguns instantes e tente novamente.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          message: '💳 Os créditos de IA se esgotaram. Por favor, adicione créditos na sua workspace Lovable para continuar.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Handle streaming response
    if (stream && response.body) {
      console.log('📡 Streaming mode enabled - forwarding SSE stream');
      
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let fullAccumulatedContent = ''; // Accumulate full message
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    continue; // Don't send [DONE] yet
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullAccumulatedContent += content;
                      // Send token delta
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: content })}\n\n`));
                    }
                  } catch (e) {
                    // Ignore parse errors in streaming
                  }
                }
              }
            }
            
            // Send completion event with full message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              complete: true,
              message: fullAccumulatedContent,
              dataAccessed: toolResults?.map((r: any) => r.name) || []
            })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });
      
      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (original logic)
    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));
    
    // Debug: Check if AI acknowledged attachments in response
    if (attachmentContext) {
      const assistantResponse = data.choices[0]?.message?.content || '';
      const mentionedAttachments = assistantResponse.toLowerCase().includes('arquivo') || 
                                   assistantResponse.toLowerCase().includes('planilha') ||
                                   assistantResponse.toLowerCase().includes('documento') ||
                                   assistantResponse.toLowerCase().includes('anexo') ||
                                   assistantResponse.toLowerCase().includes('analisando');
      console.log('🔍 AI Acknowledged Attachments in Response:', mentionedAttachments);
      if (!mentionedAttachments) {
        console.warn('⚠️ AI did NOT explicitly acknowledge attachments in response - possible context issue');
      }
    }

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
        
        // VALIDATION: Ensure message is valid for pending action
        const validMessage = ensureValidMessage(
          `📋 Preparei a seguinte ação para você confirmar:\n\n**${getActionDisplayName(writeCall.function.name)}**\n\nPor favor, confirme se deseja executar esta ação.`,
          {
            hasToolCalls: true,
            currentPage
          }
        );
        
        // Return pending action to frontend
        return new Response(JSON.stringify({
          message: validMessage,
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
        if (finalResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limits exceeded',
            message: '⏳ O limite de requisições foi atingido. Por favor, aguarde alguns instantes e tente novamente.'
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (finalResponse.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'Payment required',
            message: '💳 Os créditos de IA se esgotaram. Por favor, adicione créditos na sua workspace Lovable para continuar.'
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await finalResponse.text();
        console.error('AI final response error:', finalResponse.status, errorText);
        throw new Error(`AI API error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const assistantMessage = finalData.choices[0].message.content;
      
      // VALIDATION: Ensure message is valid after tool calls
      const validMessage = ensureValidMessage(assistantMessage, {
        hasAttachments: attachmentsContext.length > 0,
        hasToolCalls: true,
        currentPage
      });
      
      if (!assistantMessage || assistantMessage.trim().length === 0) {
        console.warn('⚠️ Empty content after tool calls - using fallback');
      }
      
      // Generate proactive insights based on current context and data
      const insights = await generateProactiveInsights(
        companyId, 
        userContext?.currentRoute || currentPage, 
        supabaseClient
      );
      
      // Generate visualizations based on tool results
      const visualizations: any[] = [];
      for (const toolResult of toolResults) {
        const result = JSON.parse(toolResult.content);
        if (result.success && result.data) {
          const viz = await generateDataVisualizations(result, toolResult.name);
          visualizations.push(...viz);
        }
      }
      
      // Check for pending extracted data after attachment processing
      let enrichedMessage = validMessage;
      if (attachmentsToUse && attachmentsToUse.length > 0) {
        try {
          console.log('🔍 Checking for pending extracted data...');
          const { data: pendingPreviews, error: previewError } = await supabaseClient
            .from('extracted_data_preview')
            .select('id, total_records, avg_confidence, target_table')
            .eq('company_id', companyId)
            .eq('validation_status', 'Pendente')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (!previewError && pendingPreviews && pendingPreviews.length > 0) {
            const totalRecords = pendingPreviews.reduce((sum, p) => sum + (p.total_records || 0), 0);
            const avgConfidence = pendingPreviews.reduce((sum, p) => sum + (p.avg_confidence || 0), 0) / pendingPreviews.length;
            
            console.log(`✅ Found ${pendingPreviews.length} pending previews with ${totalRecords} total records`);
            
            enrichedMessage += `\n\n---\n\n✅ **Processamento Concluído!**\n\n📊 **${totalRecords} registros** foram extraídos com confiança média de **${Math.round(avgConfidence * 100)}%**.\n\n🔍 **Próximo Passo:** [Revisar e Aprovar Dados](/reconciliacao-documentos)\n\nVocê pode revisar, editar e aprovar os dados extraídos na página de Reconciliação de Documentos.`;
          }
        } catch (err) {
          console.error('❌ Error checking for pending data:', err);
          // Continue without enrichment
        }
      }
      
      return new Response(JSON.stringify({ 
        message: enrichedMessage,
        dataAccessed: toolResults.map((r: any) => r.name),
        insights: insights.length > 0 ? insights : undefined,
        visualizations: visualizations.length > 0 ? visualizations : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tool calls, return direct response with proactive insights
    const assistantMessage = choice.message.content;
    
    // VALIDATION: Ensure message is valid for direct response
    const validMessage = ensureValidMessage(assistantMessage, {
      hasAttachments: attachmentsContext.length > 0,
      hasToolCalls: false,
      currentPage
    });
    
    if (!assistantMessage || assistantMessage.trim().length === 0) {
      console.warn('⚠️ Empty content in direct response - using fallback');
    }
    
    // Generate proactive insights even without tool calls
    const insights = await generateProactiveInsights(
      companyId, 
      userContext?.currentRoute || currentPage, 
      supabaseClient
    );
    
    // Check for pending extracted data after attachment processing
    let enrichedMessage = validMessage;
    if (attachmentsToUse && attachmentsToUse.length > 0) {
      try {
        console.log('🔍 Checking for pending extracted data (no tool calls)...');
        const { data: pendingPreviews, error: previewError } = await supabaseClient
          .from('extracted_data_preview')
          .select('id, total_records, avg_confidence, target_table')
          .eq('company_id', companyId)
          .eq('validation_status', 'Pendente')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!previewError && pendingPreviews && pendingPreviews.length > 0) {
          const totalRecords = pendingPreviews.reduce((sum, p) => sum + (p.total_records || 0), 0);
          const avgConfidence = pendingPreviews.reduce((sum, p) => sum + (p.avg_confidence || 0), 0) / pendingPreviews.length;
          
          console.log(`✅ Found ${pendingPreviews.length} pending previews with ${totalRecords} total records`);
          
          enrichedMessage += `\n\n---\n\n✅ **Processamento Concluído!**\n\n📊 **${totalRecords} registros** foram extraídos com confiança média de **${Math.round(avgConfidence * 100)}%**.\n\n🔍 **Próximo Passo:** [Revisar e Aprovar Dados](/reconciliacao-documentos)\n\nVocê pode revisar, editar e aprovar os dados extraídos na página de Reconciliação de Documentos.`;
        }
      } catch (err) {
        console.error('❌ Error checking for pending data:', err);
        // Continue without enrichment
      }
    }
    
    return new Response(JSON.stringify({ 
      message: enrichedMessage,
      insights: insights.length > 0 ? insights : undefined
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

