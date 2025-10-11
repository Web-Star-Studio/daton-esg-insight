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
    case 'update_goal':
      return await updateGoalAction(args, companyId, userId, supabase);
    case 'update_goal_progress':
      return await updateGoalProgressAction(args, companyId, userId, supabase);
    case 'create_task':
      return await createTaskAction(args, companyId, userId, supabase);
    case 'update_task_status':
      return await updateTaskStatusAction(args, companyId, userId, supabase);
    case 'add_license':
      return await addLicenseAction(args, companyId, userId, supabase);
    case 'update_license':
      return await updateLicenseAction(args, companyId, userId, supabase);
    case 'log_waste':
      return await logWasteAction(args, companyId, userId, supabase);
    case 'add_emission_source':
      return await addEmissionSourceAction(args, companyId, userId, supabase);
    case 'log_emission':
      return await logEmissionAction(args, companyId, userId, supabase);
    case 'create_non_conformity':
      return await createNonConformityAction(args, companyId, userId, supabase);
    case 'create_risk':
      return await createRiskAction(args, companyId, userId, supabase);
    case 'add_employee':
      return await addEmployeeAction(args, companyId, userId, supabase);
    case 'add_supplier':
      return await addSupplierAction(args, companyId, userId, supabase);
    case 'add_stakeholder':
      return await addStakeholderAction(args, companyId, userId, supabase);
    case 'create_training':
      return await createTrainingAction(args, companyId, userId, supabase);
    case 'create_audit':
      return await createAuditAction(args, companyId, userId, supabase);
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

async function updateGoalAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Updating goal:', args);
  
  if (!args.goal_id) {
    return { success: false, error: "ID da meta não fornecido" };
  }

  const updateData: any = {};
  if (args.goal_name) updateData.goal_name = args.goal_name;
  if (args.target_value !== undefined) updateData.target_value = args.target_value;
  if (args.target_date) updateData.target_date = args.target_date;
  if (args.status) updateData.status = args.status;

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', args.goal_id)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao atualizar meta", details: error.message };
  }

  return {
    success: true,
    message: `✅ Meta atualizada com sucesso!`,
    data: { goalId: data.id, name: data.goal_name }
  };
}

async function updateGoalProgressAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Updating goal progress:', args);
  
  if (!args.goal_id || args.current_value === undefined) {
    return { success: false, error: "Dados incompletos", missing: ["goal_id", "current_value"] };
  }

  const { data, error } = await supabase
    .from('goal_progress_updates')
    .insert({
      goal_id: args.goal_id,
      current_value: args.current_value,
      update_date: args.update_date || new Date().toISOString().split('T')[0],
      notes: args.notes,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao atualizar progresso", details: error.message };
  }

  return {
    success: true,
    message: `✅ Progresso da meta atualizado para ${args.current_value}!`,
    data: { updateId: data.id, currentValue: data.current_value }
  };
}

async function updateTaskStatusAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Updating task status:', args);
  
  if (!args.task_id || !args.status) {
    return { success: false, error: "Dados incompletos", missing: ["task_id", "status"] };
  }

  const { data, error } = await supabase
    .from('data_collection_tasks')
    .update({ status: args.status })
    .eq('id', args.task_id)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao atualizar status", details: error.message };
  }

  return {
    success: true,
    message: `✅ Status da tarefa atualizado para "${args.status}"!`,
    data: { taskId: data.id, status: data.status }
  };
}

async function updateLicenseAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Updating license:', args);
  
  if (!args.license_id) {
    return { success: false, error: "ID da licença não fornecido" };
  }

  const updateData: any = {};
  if (args.status) updateData.status = args.status;
  if (args.expiration_date) updateData.expiration_date = args.expiration_date;
  if (args.license_number) updateData.license_number = args.license_number;

  const { data, error } = await supabase
    .from('licenses')
    .update(updateData)
    .eq('id', args.license_id)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao atualizar licença", details: error.message };
  }

  return {
    success: true,
    message: `✅ Licença "${data.license_name}" atualizada!`,
    data: { licenseId: data.id, status: data.status }
  };
}

async function addEmissionSourceAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Adding emission source:', args);
  
  if (!args.source_name || !args.scope) {
    return { success: false, error: "Dados incompletos", missing: ["source_name", "scope"] };
  }

  const { data, error } = await supabase
    .from('emission_sources')
    .insert({
      company_id: companyId,
      source_name: args.source_name,
      scope: args.scope,
      description: args.description,
      category: args.category,
      unit: args.unit || 'kg'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao adicionar fonte de emissão", details: error.message };
  }

  return {
    success: true,
    message: `✅ Fonte de emissão "${args.source_name}" (Escopo ${args.scope}) criada!`,
    data: { sourceId: data.id, name: data.source_name, scope: data.scope }
  };
}

async function logEmissionAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Logging emission:', args);
  
  if (!args.emission_source_id || !args.quantity) {
    return { success: false, error: "Dados incompletos", missing: ["emission_source_id", "quantity"] };
  }

  const startDate = args.period_start || new Date().toISOString().split('T')[0];
  const endDate = args.period_end || startDate;

  const { data, error } = await supabase
    .from('activity_data')
    .insert({
      emission_source_id: args.emission_source_id,
      quantity: args.quantity,
      period_start_date: startDate,
      period_end_date: endDate,
      data_quality: args.data_quality || 'Estimado',
      notes: args.notes
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao registrar emissão", details: error.message };
  }

  return {
    success: true,
    message: `✅ Emissão de ${args.quantity} registrada com sucesso!`,
    data: { activityId: data.id, quantity: data.quantity }
  };
}

async function createNonConformityAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Creating non-conformity:', args);
  
  if (!args.title || !args.description) {
    return { success: false, error: "Dados incompletos", missing: ["title", "description"] };
  }

  const { data, error } = await supabase
    .from('non_conformities')
    .insert({
      company_id: companyId,
      nc_number: `NC-${Date.now()}`,
      title: args.title,
      description: args.description,
      category: args.category || 'Ambiental',
      severity: args.severity || 'Média',
      status: 'Aberta',
      identified_by_user_id: userId,
      identification_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao criar não conformidade", details: error.message };
  }

  return {
    success: true,
    message: `✅ Não conformidade "${args.title}" registrada (${data.nc_number})!`,
    data: { ncId: data.id, ncNumber: data.nc_number }
  };
}

async function createRiskAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Creating risk:', args);
  
  if (!args.title || !args.category || !args.probability || !args.impact) {
    return { success: false, error: "Dados incompletos", missing: ["title", "category", "probability", "impact"] };
  }

  const { data, error } = await supabase
    .from('esg_risks')
    .insert({
      company_id: companyId,
      title: args.title,
      description: args.description,
      category: args.category,
      probability: args.probability,
      impact: args.impact,
      status: 'Ativo',
      identification_date: new Date().toISOString().split('T')[0],
      created_by_user_id: userId
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao criar risco", details: error.message };
  }

  return {
    success: true,
    message: `✅ Risco ESG "${args.title}" registrado com nível ${data.inherent_risk_level}!`,
    data: { riskId: data.id, title: data.title, level: data.inherent_risk_level }
  };
}

async function addEmployeeAction(args: any, companyId: string, userId: string, supabase: any) {
  console.log('Adding employee:', args);
  
  if (!args.name || !args.email) {
    return { success: false, error: "Dados incompletos", missing: ["name", "email"] };
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({
      company_id: companyId,
      name: args.name,
      email: args.email,
      employee_code: args.employee_code || `EMP-${Date.now()}`,
      department: args.department,
      role: args.role,
      hire_date: args.hire_date || new Date().toISOString().split('T')[0],
      status: 'Ativo'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Falha ao adicionar funcionário", details: error.message };
  }

  return {
    success: true,
    message: `✅ Funcionário "${args.name}" adicionado ao sistema!`,
    data: { employeeId: data.id, name: data.name, code: data.employee_code }
  };
}

async function addSupplierAction(args: any, companyId: string, userId: string, supabase: any) {
  if (!args.name || !args.category) {
    return { success: false, error: "Dados incompletos", missing: ["name", "category"] };
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      company_id: companyId,
      name: args.name,
      cnpj: args.cnpj,
      contact_email: args.contact_email,
      contact_phone: args.contact_phone,
      category: args.category,
      status: 'Ativo'
    })
    .select()
    .single();

  if (error) return { success: false, error: "Falha ao adicionar fornecedor", details: error.message };
  return { success: true, message: `✅ Fornecedor "${args.name}" adicionado!`, data: { supplierId: data.id } };
}

async function addStakeholderAction(args: any, companyId: string, userId: string, supabase: any) {
  if (!args.name || !args.category) {
    return { success: false, error: "Dados incompletos", missing: ["name", "category"] };
  }

  const { data, error } = await supabase
    .from('stakeholders')
    .insert({
      company_id: companyId,
      name: args.name,
      organization: args.organization,
      category: args.category,
      contact_email: args.contact_email,
      influence_level: args.influence_level,
      interest_level: args.interest_level
    })
    .select()
    .single();

  if (error) return { success: false, error: "Falha ao adicionar stakeholder", details: error.message };
  return { success: true, message: `✅ Stakeholder "${args.name}" adicionado!`, data: { stakeholderId: data.id } };
}

async function createTrainingAction(args: any, companyId: string, userId: string, supabase: any) {
  if (!args.name || !args.duration_hours) {
    return { success: false, error: "Dados incompletos", missing: ["name", "duration_hours"] };
  }

  const { data, error } = await supabase
    .from('training_programs')
    .insert({
      company_id: companyId,
      name: args.name,
      description: args.description,
      category: args.category,
      duration_hours: args.duration_hours,
      is_mandatory: args.is_mandatory || false,
      status: 'Ativo',
      created_by_user_id: userId
    })
    .select()
    .single();

  if (error) return { success: false, error: "Falha ao criar treinamento", details: error.message };
  return { success: true, message: `✅ Treinamento "${args.name}" criado!`, data: { trainingId: data.id } };
}

async function createAuditAction(args: any, companyId: string, userId: string, supabase: any) {
  if (!args.title || !args.audit_type) {
    return { success: false, error: "Dados incompletos", missing: ["title", "audit_type"] };
  }

  const { data, error } = await supabase
    .from('audits')
    .insert({
      company_id: companyId,
      title: args.title,
      audit_type: args.audit_type,
      start_date: args.start_date,
      end_date: args.end_date,
      auditor: args.auditor,
      scope: args.scope,
      status: 'Planejada'
    })
    .select()
    .single();

  if (error) return { success: false, error: "Falha ao criar auditoria", details: error.message };
  return { success: true, message: `✅ Auditoria "${args.title}" criada!`, data: { auditId: data.id } };
}

// Helper functions for action display
export function getActionDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    'create_goal': 'Criar Nova Meta ESG',
    'update_goal': 'Atualizar Meta ESG',
    'update_goal_progress': 'Atualizar Progresso de Meta',
    'create_task': 'Criar Tarefa de Coleta de Dados',
    'update_task_status': 'Atualizar Status de Tarefa',
    'add_license': 'Registrar Licença Ambiental',
    'update_license': 'Atualizar Licença',
    'log_waste': 'Registrar Log de Resíduos',
    'add_emission_source': 'Criar Fonte de Emissão',
    'log_emission': 'Registrar Atividade de Emissão',
    'create_non_conformity': 'Registrar Não Conformidade',
    'create_risk': 'Registrar Risco ESG',
    'add_employee': 'Adicionar Funcionário',
    'add_supplier': 'Adicionar Fornecedor',
    'add_stakeholder': 'Adicionar Stakeholder',
    'create_training': 'Criar Programa de Treinamento',
    'create_audit': 'Criar Auditoria'
  };
  return names[toolName] || toolName;
}

export function getActionDescription(toolName: string, params: any): string {
  switch (toolName) {
    case 'create_goal':
      return `Criar meta "${params.name}" com valor alvo de ${params.target_value} ${params.unit || ''} até ${params.target_date}`;
    case 'update_goal':
      return `Atualizar meta com as alterações especificadas`;
    case 'update_goal_progress':
      return `Atualizar progresso da meta para ${params.current_value}`;
    case 'create_task':
      return `Criar tarefa "${params.name}" do tipo ${params.task_type} com vencimento em ${params.due_date}`;
    case 'update_task_status':
      return `Alterar status da tarefa para "${params.status}"`;
    case 'add_license':
      return `Registrar licença "${params.name}" do tipo ${params.license_type} válida até ${params.expiration_date}`;
    case 'update_license':
      return `Atualizar dados da licença`;
    case 'log_waste':
      return `Registrar ${params.quantity}kg de resíduo "${params.waste_type}" classe ${params.class}`;
    case 'add_emission_source':
      return `Criar fonte de emissão "${params.source_name}" no Escopo ${params.scope}`;
    case 'log_emission':
      return `Registrar atividade com ${params.quantity} unidades de emissão`;
    case 'create_non_conformity':
      return `Registrar não conformidade "${params.title}" categoria ${params.category || 'Ambiental'}`;
    case 'create_risk':
      return `Registrar risco ESG "${params.title}" com probabilidade ${params.probability} e impacto ${params.impact}`;
    case 'add_employee':
      return `Adicionar funcionário "${params.name}" ao departamento ${params.department || 'não especificado'}`;
    case 'add_supplier':
      return `Adicionar fornecedor "${params.name}" categoria ${params.category}`;
    case 'add_stakeholder':
      return `Adicionar stakeholder "${params.name}" categoria ${params.category}`;
    case 'create_training':
      return `Criar treinamento "${params.name}" com ${params.duration_hours}h`;
    case 'create_audit':
      return `Criar auditoria "${params.title}" tipo ${params.audit_type}`;
    default:
      return 'Ação não especificada';
  }
}

export function getActionImpact(toolName: string): 'low' | 'medium' | 'high' {
  const impacts: Record<string, 'low' | 'medium' | 'high'> = {
    'create_goal': 'medium',
    'update_goal': 'medium',
    'update_goal_progress': 'low',
    'create_task': 'low',
    'update_task_status': 'low',
    'add_license': 'high',
    'update_license': 'medium',
    'log_waste': 'low',
    'add_emission_source': 'medium',
    'log_emission': 'low',
    'create_non_conformity': 'high',
    'create_risk': 'high',
    'add_employee': 'medium',
    'add_supplier': 'medium',
    'add_stakeholder': 'medium',
    'create_training': 'medium',
    'create_audit': 'high'
  };
  return impacts[toolName] || 'medium';
}

export function getActionCategory(toolName: string): string {
  const categories: Record<string, string> = {
    'create_goal': 'Metas ESG',
    'update_goal': 'Metas ESG',
    'update_goal_progress': 'Metas ESG',
    'create_task': 'Gestão de Tarefas',
    'update_task_status': 'Gestão de Tarefas',
    'add_license': 'Licenciamento',
    'update_license': 'Licenciamento',
    'log_waste': 'Gestão de Resíduos',
    'add_emission_source': 'Inventário GEE',
    'log_emission': 'Inventário GEE',
    'create_non_conformity': 'Conformidade',
    'create_risk': 'Gestão de Riscos',
    'add_employee': 'Recursos Humanos',
    'add_supplier': 'Fornecedores',
    'add_stakeholder': 'Stakeholders',
    'create_training': 'Treinamentos',
    'create_audit': 'Auditoria'
  };
  return categories[toolName] || 'Geral';
}
