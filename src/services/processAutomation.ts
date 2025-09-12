import { supabase } from "@/integrations/supabase/client";

export interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  type: 'license_renewal' | 'condition_compliance' | 'document_submission' | 'monitoring_report';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  assigned_to?: string;
  license_id?: string;
  condition_id?: string;
  metadata: any;
  automation_rules: AutomationRule[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  created_at: string;
}

export interface AutomationRule {
  trigger: 'date_based' | 'condition_based' | 'document_based' | 'ai_prediction';
  condition: string;
  action: 'create_task' | 'send_alert' | 'generate_document' | 'schedule_meeting';
  parameters: any;
}

export interface RenewalWorkflow {
  license_id: string;
  estimated_start_date: string;
  estimated_completion_date: string;
  required_documents: string[];
  estimated_cost: number;
  tasks: WorkflowTask[];
  milestones: WorkflowMilestone[];
}

export interface WorkflowTask {
  title: string;
  description: string;
  estimated_duration_days: number;
  dependencies: string[];
  responsible_area: string;
  required_documents: string[];
}

export interface WorkflowMilestone {
  title: string;
  target_date: string;
  description: string;
  critical: boolean;
}

// Criar tarefas automáticas baseadas em condicionantes
export async function createAutomatedTasksFromConditions(
  licenseId: string
): Promise<{ success: boolean; tasksCreated: number; error?: string }> {
  try {
    // Buscar condicionantes da licença
    const { data: conditions, error: conditionsError } = await supabase
      .from('license_conditions')
      .select('*')
      .eq('license_id', licenseId)
      .eq('status', 'pending');

    if (conditionsError) {
      throw conditionsError;
    }

    let tasksCreated = 0;

    for (const condition of conditions || []) {
      const taskData = {
        name: `Cumprir: ${condition.condition_text.substring(0, 50)}...`,
        description: condition.condition_text,
        task_type: 'compliance_task',
        due_date: condition.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_start: new Date().toISOString().split('T')[0],
        period_end: condition.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequency: 'Unica',
        status: 'Pendente',
        company_id: '', // Will be set by RLS
        metadata: {
          condition_id: condition.id,
          priority: condition.priority,
          category: condition.condition_category,
          automation_created: true
        }
      };

      const { data, error } = await supabase
        .from('data_collection_tasks')
        .insert(taskData);

      if (!error) {
        tasksCreated++;
      }
    }

    return {
      success: true,
      tasksCreated
    };
  } catch (error: any) {
    return {
      success: false,
      tasksCreated: 0,
      error: error.message
    };
  }
}

// Gerar cronograma de renovação automático
export async function generateRenewalWorkflow(
  licenseId: string
): Promise<{ success: boolean; workflow?: RenewalWorkflow; error?: string }> {
  try {
    // Buscar dados da licença
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (licenseError) {
      throw licenseError;
    }

    // Calcular datas baseadas no vencimento
    const expirationDate = new Date(license.expiration_date);
    const recommendedStartDate = new Date(expirationDate);
    recommendedStartDate.setMonth(recommendedStartDate.getMonth() - 6); // 6 meses antes

    // Definir tarefas padrão baseadas no tipo de licença
    const tasks = generateTasksByLicenseType(license.type);
    
    // Definir marcos críticos
    const milestones: WorkflowMilestone[] = [
      {
        title: "Início do Processo de Renovação",
        target_date: recommendedStartDate.toISOString().split('T')[0],
        description: "Iniciar coleta de documentos e preparação",
        critical: true
      },
      {
        title: "Documentação Completa",
        target_date: new Date(recommendedStartDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "Todos os documentos devem estar prontos",
        critical: true
      },
      {
        title: "Protocolo da Renovação",
        target_date: new Date(recommendedStartDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "Submissão oficial do pedido de renovação",
        critical: true
      },
      {
        title: "Renovação Aprovada",
        target_date: new Date(expirationDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "Nova licença deve estar emitida",
        critical: true
      }
    ];

    const workflow: RenewalWorkflow = {
      license_id: licenseId,
      estimated_start_date: recommendedStartDate.toISOString().split('T')[0],
      estimated_completion_date: new Date(expirationDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_documents: getRequiredDocumentsByType(license.type),
      estimated_cost: estimateCostByType(license.type),
      tasks,
      milestones
    };

    return {
      success: true,
      workflow
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Gerar tarefas baseadas no tipo de licença
function generateTasksByLicenseType(licenseType: string): WorkflowTask[] {
  const baseTasks: WorkflowTask[] = [
    {
      title: "Levantamento da Situação Atual",
      description: "Verificar cumprimento de condicionantes e status atual",
      estimated_duration_days: 7,
      dependencies: [],
      responsible_area: "Meio Ambiente",
      required_documents: ["Relatórios de monitoramento", "Evidências de cumprimento"]
    },
    {
      title: "Preparação da Documentação",
      description: "Organizar e atualizar documentos necessários",
      estimated_duration_days: 21,
      dependencies: ["Levantamento da Situação Atual"],
      responsible_area: "Meio Ambiente",
      required_documents: ["Formulários atualizados", "Plantas e projetos", "Laudos técnicos"]
    },
    {
      title: "Revisão Jurídica",
      description: "Análise jurídica da documentação e processo",
      estimated_duration_days: 5,
      dependencies: ["Preparação da Documentação"],
      responsible_area: "Jurídico",
      required_documents: ["Documentação completa"]
    },
    {
      title: "Protocolo no Órgão Ambiental",
      description: "Submissão formal do pedido de renovação",
      estimated_duration_days: 2,
      dependencies: ["Revisão Jurídica"],
      responsible_area: "Meio Ambiente",
      required_documents: ["Protocolo preenchido", "Documentos originais", "Comprovante de pagamento"]
    }
  ];

  // Adicionar tarefas específicas por tipo
  if (licenseType?.includes('LO')) {
    baseTasks.push({
      title: "Atualização de Programas Ambientais",
      description: "Revisar e atualizar programas de monitoramento",
      estimated_duration_days: 14,
      dependencies: ["Levantamento da Situação Atual"],
      responsible_area: "Meio Ambiente",
      required_documents: ["Programas de monitoramento atualizados"]
    });
  }

  if (licenseType?.includes('LI')) {
    baseTasks.push({
      title: "Verificação de Obras Executadas",
      description: "Confirmar conformidade das obras com o projeto aprovado",
      estimated_duration_days: 10,
      dependencies: ["Levantamento da Situação Atual"],
      responsible_area: "Engenharia",
      required_documents: ["As built", "Relatórios de obra"]
    });
  }

  return baseTasks;
}

// Documentos necessários por tipo de licença
function getRequiredDocumentsByType(licenseType: string): string[] {
  const baseDocuments = [
    "Formulário de renovação preenchido",
    "Comprovante de pagamento de taxas",
    "Cópia da licença anterior",
    "Relatórios de monitoramento do período",
    "Declaração de cumprimento de condicionantes"
  ];

  if (licenseType?.includes('LO')) {
    baseDocuments.push(
      "Programas de monitoramento atualizados",
      "Relatórios de automonitoramento",
      "Plano de gerenciamento de resíduos atualizado"
    );
  }

  if (licenseType?.includes('LI')) {
    baseDocuments.push(
      "Projetos as built",
      "Relatórios de conclusão de obras",
      "Certificados de equipamentos de controle"
    );
  }

  if (licenseType?.includes('LP')) {
    baseDocuments.push(
      "Estudos ambientais atualizados",
      "Anuência de órgãos competentes",
      "Planos e programas ambientais"
    );
  }

  return baseDocuments;
}

// Estimar custo baseado no tipo de licença
function estimateCostByType(licenseType: string): number {
  const baseCosts = {
    'LP': 15000,
    'LI': 12000,
    'LO': 8000,
    'LAS': 5000,
    'LAU': 3000
  };

  for (const [type, cost] of Object.entries(baseCosts)) {
    if (licenseType?.includes(type)) {
      return cost;
    }
  }

  return 10000; // Valor padrão
}

// Criar alertas baseados em predições de IA
export async function createPredictiveAlerts(
  licenseId: string,
  predictions: any[]
): Promise<{ success: boolean; alertsCreated: number; error?: string }> {
  try {
    let alertsCreated = 0;

    for (const prediction of predictions) {
      const alertData = {
        license_id: licenseId,
        alert_type: prediction.type,
        title: `Predição IA: ${prediction.title}`,
        message: `Probabilidade: ${prediction.probability}% - ${prediction.description}`,
        severity: prediction.urgency,
        due_date: prediction.predictedDate,
        action_required: prediction.urgency === 'high' || prediction.urgency === 'critical',
        company_id: '', // Will be set by RLS
        metadata: {
          prediction_id: prediction.id,
          probability: prediction.probability,
          ai_generated: true,
          recommendations: prediction.recommendations
        }
      };

      const { error } = await supabase
        .from('license_alerts')
        .insert(alertData);

      if (!error) {
        alertsCreated++;
      }
    }

    return {
      success: true,
      alertsCreated
    };
  } catch (error: any) {
    return {
      success: false,
      alertsCreated: 0,
      error: error.message
    };
  }
}

// Verificar e atualizar tarefas automaticamente
export async function updateAutomatedTasksStatus(): Promise<{
  success: boolean;
  tasksUpdated: number;
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Marcar tarefas vencidas
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('data_collection_tasks')
      .update({ status: 'Em Atraso' })
      .lt('due_date', today)
      .eq('status', 'Pendente')
      .select();

    if (overdueError) {
      throw overdueError;
    }

    // Criar alertas para tarefas vencendo em 3 dias
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('data_collection_tasks')
      .select('*')
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
      .gte('due_date', today)
      .eq('status', 'Pendente');

    if (upcomingError) {
      throw upcomingError;
    }

    return {
      success: true,
      tasksUpdated: (overdueTasks?.length || 0) + (upcomingTasks?.length || 0)
    };
  } catch (error: any) {
    return {
      success: false,
      tasksUpdated: 0,
      error: error.message
    };
  }
}