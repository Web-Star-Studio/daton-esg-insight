import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export interface IntelligentSuggestion {
  insights: string[];
  actions: Array<{
    description: string;
    toolName: string;
    params: any;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }>;
  warnings: string[];
  opportunities: string[];
}

export async function generateIntelligentSuggestions(
  documentType: string,
  extractedData: any,
  companyContext: any,
  supabaseClient: SupabaseClient
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  try {
    // Get company historical data for context
    const { data: goals } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('company_id', companyContext.company_id)
      .eq('status', 'Ativa');

    const { data: emissions } = await supabaseClient
      .from('emission_sources')
      .select('*')
      .eq('company_id', companyContext.company_id);

    const { data: licenses } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('company_id', companyContext.company_id);

    // Generate suggestions based on document type
    switch (documentType) {
      case 'waste_invoice':
        return generateWasteSuggestions(extractedData, companyContext, supabaseClient);
      
      case 'emissions_report':
      case 'emissions_spreadsheet':
        return generateEmissionsSuggestions(extractedData, companyContext, goals, emissions);
      
      case 'environmental_license':
        return generateLicenseSuggestions(extractedData, companyContext, licenses);
      
      case 'employee_spreadsheet':
        return generateEmployeeSuggestions(extractedData, companyContext, supabaseClient);
      
      case 'goals_spreadsheet':
        return generateGoalsSuggestions(extractedData, companyContext, goals);
      
      default:
        return generateGenericSuggestions(extractedData, documentType);
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return suggestions;
  }
}

async function generateWasteSuggestions(
  extractedData: any,
  companyContext: any,
  supabaseClient: SupabaseClient
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  // Get waste data from last month for comparison
  const { data: recentWaste } = await supabaseClient
    .from('waste_logs')
    .select('quantity, waste_type')
    .eq('company_id', companyContext.company_id)
    .gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalRecent = recentWaste?.reduce((sum, w) => sum + (w.quantity || 0), 0) || 0;
  const quantity = extractedData.structured_data?.quantity || 0;

  // Generate insights
  if (totalRecent > 0) {
    const percentage = (quantity / totalRecent) * 100;
    suggestions.insights.push(`Esta destinação representa ${percentage.toFixed(1)}% do total do mês`);
  }

  // Generate actions
  suggestions.actions.push({
    description: 'Registrar destinação de resíduos no sistema',
    toolName: 'create_waste_log',
    params: {
      waste_type: extractedData.structured_data?.waste_type,
      quantity: quantity,
      unit: extractedData.structured_data?.unit || 'kg',
      disposal_method: extractedData.structured_data?.disposal_method,
      supplier_name: extractedData.structured_data?.supplier
    },
    priority: 'high',
    estimatedImpact: 'Atualiza indicadores de reciclagem e PGRS'
  });

  // Check recycling rate
  const recyclableTypes = ['Plástico', 'Papel', 'Metal', 'Vidro'];
  if (extractedData.structured_data?.waste_type && 
      recyclableTypes.some(type => extractedData.structured_data.waste_type.includes(type))) {
    suggestions.opportunities.push('Material reciclável identificado - contribui para meta de reciclagem');
  }

  return suggestions;
}

async function generateEmissionsSuggestions(
  extractedData: any,
  companyContext: any,
  goals: any[],
  emissions: any[]
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  const records = extractedData.structured_data?.records || [];
  const totalEmissions = records.reduce((sum: number, r: any) => sum + (r.total_co2e || 0), 0);

  // Calculate scope breakdown
  const scope1 = records.filter((r: any) => r.scope === 1).reduce((sum: number, r: any) => sum + (r.total_co2e || 0), 0);
  const scope2 = records.filter((r: any) => r.scope === 2).reduce((sum: number, r: any) => sum + (r.total_co2e || 0), 0);
  const scope3 = records.filter((r: any) => r.scope === 3).reduce((sum: number, r: any) => sum + (r.total_co2e || 0), 0);

  // Generate insights
  suggestions.insights.push(`Total de emissões identificadas: ${totalEmissions.toFixed(2)} tCO2e`);
  if (scope1 > 0) suggestions.insights.push(`Escopo 1: ${scope1.toFixed(2)} tCO2e (${((scope1/totalEmissions)*100).toFixed(1)}%)`);
  if (scope2 > 0) suggestions.insights.push(`Escopo 2: ${scope2.toFixed(2)} tCO2e (${((scope2/totalEmissions)*100).toFixed(1)}%)`);
  if (scope3 > 0) suggestions.insights.push(`Escopo 3: ${scope3.toFixed(2)} tCO2e (${((scope3/totalEmissions)*100).toFixed(1)}%)`);

  // Compare with goals
  const emissionGoal = goals?.find(g => g.category === 'Ambiental' && g.goal_name.toLowerCase().includes('emiss'));
  if (emissionGoal && emissionGoal.target_value) {
    const percentage = (totalEmissions / emissionGoal.target_value) * 100;
    if (percentage > 100) {
      suggestions.warnings.push(`⚠️ Emissões ${(percentage - 100).toFixed(1)}% acima da meta anual`);
      suggestions.opportunities.push(`Necessário reduzir ${(totalEmissions - emissionGoal.target_value).toFixed(2)} tCO2e`);
    } else {
      suggestions.insights.push(`✅ Emissões ${(100 - percentage).toFixed(1)}% abaixo da meta`);
    }
  }

  // Suggest bulk import
  if (records.length > 0) {
    suggestions.actions.push({
      description: `Importar ${records.length} registros de emissões`,
      toolName: 'bulk_import_emissions',
      params: { emissions: records },
      priority: 'high',
      estimatedImpact: `Cadastra ${records.length} fontes de emissão e atualiza inventário GEE`
    });
  }

  // Identify top sources
  const topSources = records.sort((a: any, b: any) => (b.total_co2e || 0) - (a.total_co2e || 0)).slice(0, 3);
  if (topSources.length > 0) {
    suggestions.opportunities.push(
      `Principais fontes: ${topSources.map((s: any) => `${s.source_name} (${s.total_co2e?.toFixed(1)} tCO2e)`).join(', ')}`
    );
  }

  return suggestions;
}

async function generateLicenseSuggestions(
  extractedData: any,
  companyContext: any,
  licenses: any[]
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  const licenseData = extractedData.structured_data;
  
  // Check expiration
  if (licenseData?.expiry_date) {
    const expiryDate = new Date(licenseData.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      suggestions.warnings.push('⚠️ CRÍTICO: Licença vencida!');
    } else if (daysUntilExpiry < 90) {
      suggestions.warnings.push(`⚠️ Licença vence em ${daysUntilExpiry} dias - iniciar renovação`);
    } else {
      suggestions.insights.push(`Licença válida por mais ${daysUntilExpiry} dias`);
    }
  }

  // Suggest registration
  suggestions.actions.push({
    description: 'Cadastrar licença ambiental no sistema',
    toolName: 'create_license',
    params: {
      license_name: licenseData?.license_name,
      license_number: licenseData?.license_number,
      license_type: licenseData?.license_type,
      issuing_body: licenseData?.issuing_body,
      issue_date: licenseData?.issue_date,
      expiry_date: licenseData?.expiry_date
    },
    priority: (licenseData?.expiry_date ? Math.floor((new Date(licenseData.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) < 90 : true) ? 'high' : 'medium',
    estimatedImpact: 'Mantém controle de compliance regulatório'
  });

  return suggestions;
}

async function generateEmployeeSuggestions(
  extractedData: any,
  companyContext: any,
  supabaseClient: SupabaseClient
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  const employees = extractedData.structured_data?.records || [];
  
  // Get current employee count
  const { count } = await supabaseClient
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyContext.company_id);

  suggestions.insights.push(`${employees.length} funcionários identificados na planilha`);
  if (count) {
    suggestions.insights.push(`Base atual: ${count} funcionários cadastrados`);
  }

  // Analyze demographics
  const genderCount = employees.reduce((acc: any, e: any) => {
    acc[e.gender || 'Não informado'] = (acc[e.gender || 'Não informado'] || 0) + 1;
    return acc;
  }, {});

  const deptCount = employees.reduce((acc: any, e: any) => {
    acc[e.department || 'Não informado'] = (acc[e.department || 'Não informado'] || 0) + 1;
    return acc;
  }, {});

  suggestions.insights.push(`Distribuição por gênero: ${Object.entries(genderCount).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  suggestions.insights.push(`Departamentos: ${Object.keys(deptCount).length}`);

  // Suggest import
  suggestions.actions.push({
    description: `Importar ${employees.length} funcionários`,
    toolName: 'bulk_import_employees',
    params: { employees },
    priority: 'high',
    estimatedImpact: 'Atualiza base de RH e indicadores GRI de diversidade'
  });

  // Check for diversity opportunities
  const femaleCount = genderCount['Feminino'] || 0;
  const maleCount = genderCount['Masculino'] || 0;
  const total = femaleCount + maleCount;
  if (total > 0) {
    const femalePercentage = (femaleCount / total) * 100;
    if (femalePercentage < 30) {
      suggestions.opportunities.push(`Oportunidade de melhorar diversidade de gênero (atual: ${femalePercentage.toFixed(1)}% feminino)`);
    }
  }

  return suggestions;
}

async function generateGoalsSuggestions(
  extractedData: any,
  companyContext: any,
  existingGoals: any[]
): Promise<IntelligentSuggestion> {
  const suggestions: IntelligentSuggestion = {
    insights: [],
    actions: [],
    warnings: [],
    opportunities: []
  };

  const goals = extractedData.structured_data?.records || [];
  
  suggestions.insights.push(`${goals.length} metas identificadas`);
  
  // Analyze categories
  const categories = goals.reduce((acc: any, g: any) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  suggestions.insights.push(`Categorias: ${Object.entries(categories).map(([k, v]) => `${k} (${v})`).join(', ')}`);

  // Check alignment with existing goals
  const newGoals = goals.filter((g: any) => 
    !existingGoals?.some(eg => eg.goal_name === g.goal_name)
  );

  if (newGoals.length > 0) {
    suggestions.actions.push({
      description: `Importar ${newGoals.length} novas metas`,
      toolName: 'bulk_import_goals',
      params: { goals: newGoals },
      priority: 'high',
      estimatedImpact: 'Expande framework de metas ESG'
    });
  }

  // Check for ambitious goals
  const ambitiousGoals = goals.filter((g: any) => {
    if (!g.baseline_value || !g.target_value) return false;
    const improvement = Math.abs((g.target_value - g.baseline_value) / g.baseline_value) * 100;
    return improvement > 50;
  });

  if (ambitiousGoals.length > 0) {
    suggestions.insights.push(`${ambitiousGoals.length} metas com targets ambiciosos (>50% de melhoria)`);
  }

  return suggestions;
}

function generateGenericSuggestions(
  extractedData: any,
  documentType: string
): IntelligentSuggestion {
  return {
    insights: [
      `Documento do tipo "${documentType}" processado com sucesso`,
      `${Object.keys(extractedData.structured_data || {}).length} campos identificados`
    ],
    actions: [],
    warnings: [],
    opportunities: []
  };
}
