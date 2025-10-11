// Write tool execution functions
export async function executeWriteTool(
  toolName: string,
  args: any,
  companyId: string,
  userId: string,
  supabase: any
): Promise<any> {
  console.log(`[WRITE ACTION] ${toolName}`, { companyId, userId, args });

  // Log to audit trail
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: `ai_${toolName}`,
    target_id: companyId,
    details: { tool: toolName, args }
  });

  switch (toolName) {
    case 'create_goal':
      return await createGoalAction(args, companyId, userId, supabase);
    case 'create_task':
      return await createTaskAction(args, companyId, userId, supabase);
    case 'add_license':
      return await addLicenseAction(args, companyId, userId, supabase);
    case 'log_waste':
      return await logWasteAction(args, companyId, userId, supabase);
    default:
      return { error: `Ferramenta de escrita desconhecida: ${toolName}` };
  }
}

async function createGoalAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Creating goal:', args);
  
  // Validate required fields
  if (!args.name || !args.target_value) {
    return { 
      success: false, 
      error: "Dados incompletos", 
      missing: ["name", "target_value"] 
    };
  }

  // Insert goal
  const { data, error } = await supabase
    .from('goals')
    .insert({
      company_id: companyId,
      goal_name: args.name,
      category: args.category,
      target_value: args.target_value,
      target_date: args.target_date,
      baseline_value: args.baseline_value || 0,
      unit: args.unit,
      status: 'Ativa',
      progress: 0,
      created_by_user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    return { 
      success: false, 
      error: "Falha ao criar meta", 
      details: error.message 
    };
  }

  return {
    success: true,
    message: `✅ Meta "${args.name}" criada com sucesso!`,
    data: {
      goalId: data.id,
      name: data.goal_name,
      category: data.category
    }
  };
}

async function createTaskAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Creating task:', args);
  
  if (!args.name || !args.task_type || !args.due_date) {
    return { 
      success: false, 
      error: "Dados incompletos", 
      missing: ["name", "task_type", "due_date"] 
    };
  }

  // Calculate period dates (30 days before due date)
  const dueDate = new Date(args.due_date);
  const periodStart = new Date(dueDate);
  periodStart.setDate(dueDate.getDate() - 30);

  const { data, error } = await supabase
    .from('data_collection_tasks')
    .insert({
      company_id: companyId,
      name: args.name,
      description: args.description,
      task_type: args.task_type,
      due_date: args.due_date,
      frequency: args.frequency,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: args.due_date,
      status: 'Pendente'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return { 
      success: false, 
      error: "Falha ao criar tarefa", 
      details: error.message 
    };
  }

  return {
    success: true,
    message: `✅ Tarefa "${args.name}" criada com sucesso!`,
    data: {
      taskId: data.id,
      name: data.name,
      dueDate: data.due_date
    }
  };
}

async function addLicenseAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Adding license:', args);
  
  if (!args.name || !args.license_type || !args.expiration_date) {
    return { 
      success: false, 
      error: "Dados incompletos", 
      missing: ["name", "license_type", "expiration_date"] 
    };
  }

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      company_id: companyId,
      license_name: args.name,
      license_number: args.license_number,
      license_type: args.license_type,
      issue_date: args.issue_date,
      expiration_date: args.expiration_date,
      issuing_agency: args.issuing_agency,
      status: 'Ativa'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding license:', error);
    return { 
      success: false, 
      error: "Falha ao adicionar licença", 
      details: error.message 
    };
  }

  return {
    success: true,
    message: `✅ Licença "${args.name}" registrada com sucesso!`,
    data: {
      licenseId: data.id,
      name: data.license_name,
      expirationDate: data.expiration_date
    }
  };
}

async function logWasteAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Logging waste:', args);
  
  if (!args.waste_type || !args.class || !args.quantity) {
    return { 
      success: false, 
      error: "Dados incompletos", 
      missing: ["waste_type", "class", "quantity"] 
    };
  }

  const { data, error } = await supabase
    .from('waste_logs')
    .insert({
      company_id: companyId,
      waste_type: args.waste_type,
      class: args.class,
      quantity: args.quantity,
      log_date: args.log_date || new Date().toISOString().split('T')[0],
      final_destination: args.final_destination
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging waste:', error);
    return { 
      success: false, 
      error: "Falha ao registrar resíduo", 
      details: error.message 
    };
  }

  return {
    success: true,
    message: `✅ Log de resíduo "${args.waste_type}" registrado com sucesso!`,
    data: {
      logId: data.id,
      wasteType: data.waste_type,
      quantity: data.quantity
    }
  };
}

// Helper functions for action display
export function getActionDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    'create_goal': 'Criar Nova Meta ESG',
    'create_task': 'Criar Tarefa de Coleta de Dados',
    'add_license': 'Registrar Licença Ambiental',
    'log_waste': 'Registrar Log de Resíduos'
  };
  return names[toolName] || toolName;
}

export function getActionDescription(toolName: string, params: any): string {
  switch (toolName) {
    case 'create_goal':
      return `Criar meta "${params.name}" com valor alvo de ${params.target_value} ${params.unit || ''} até ${params.target_date}`;
    case 'create_task':
      return `Criar tarefa "${params.name}" do tipo ${params.task_type} com vencimento em ${params.due_date}`;
    case 'add_license':
      return `Registrar licença "${params.name}" do tipo ${params.license_type} válida até ${params.expiration_date}`;
    case 'log_waste':
      return `Registrar ${params.quantity}kg de resíduo "${params.waste_type}" classe ${params.class}`;
    default:
      return 'Ação não especificada';
  }
}

export function getActionImpact(toolName: string): 'low' | 'medium' | 'high' {
  const impacts: Record<string, 'low' | 'medium' | 'high'> = {
    'create_goal': 'medium',
    'create_task': 'low',
    'add_license': 'high',
    'log_waste': 'low'
  };
  return impacts[toolName] || 'medium';
}

export function getActionCategory(toolName: string): string {
  const categories: Record<string, string> = {
    'create_goal': 'Metas ESG',
    'create_task': 'Gestão de Tarefas',
    'add_license': 'Licenciamento',
    'log_waste': 'Gestão de Resíduos'
  };
  return categories[toolName] || 'Geral';
}
