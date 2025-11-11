// Helper functions for integrated reports generation

export const calculateEnvironmentalScore = (emissions: any[], indicators: any[], waste: any[], licenses: any[]) => {
  const envIndicators = indicators.filter(i => i.esg_category === 'Environmental');
  
  let score = 70; // Base score
  
  // Score baseado em indicadores
  if (envIndicators.length > 0) {
    const avgPerformance = envIndicators.reduce((sum, ind) => {
      if (!ind.target_value || !ind.current_value) return sum;
      return sum + Math.min((ind.current_value / ind.target_value) * 100, 100);
    }, 0) / envIndicators.length;
    
    score = avgPerformance;
  }
  
  // Penalizar por licenças vencidas
  const expiredLicenses = licenses.filter(l => l.status === 'Vencida').length;
  score -= Math.min(expiredLicenses * 5, 20);
  
  // Bonificar por gestão de resíduos
  const wasteRecycled = waste.filter(w => w.disposal_method?.includes('Reciclagem')).length;
  const recyclingRate = waste.length > 0 ? (wasteRecycled / waste.length) * 100 : 0;
  score += Math.min(recyclingRate / 10, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const calculateSocialScore = (employees: any[], incidents: any[], projects: any[], indicators: any[], trainings: any[]) => {
  const socialIndicators = indicators.filter(i => i.esg_category === 'Social');
  
  let score = 70; // Score base
  
  // Penalizar por acidentes
  const incidentsThisYear = incidents.filter(i => 
    new Date(i.incident_date).getFullYear() === new Date().getFullYear()
  );
  score -= Math.min(incidentsThisYear.length * 2, 20);
  
  // Bonificar por projetos sociais ativos
  const activeProjects = projects.filter(p => p.status === 'Em Andamento');
  score += Math.min(activeProjects.length * 3, 15);
  
  // Bonificar por treinamentos
  const trainingHours = trainings.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
  const hoursPerEmployee = employees.length > 0 ? trainingHours / employees.length : 0;
  score += Math.min(hoursPerEmployee / 2, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const calculateGovernanceScore = (risks: any[], indicators: any[], goals: any[]) => {
  const govIndicators = indicators.filter(i => i.esg_category === 'Governance');
  
  let score = 75; // Score base
  
  // Penalizar por riscos críticos
  const criticalRisks = risks.filter(r => r.inherent_risk_level === 'Crítico');
  score -= Math.min(criticalRisks.length * 5, 25);
  
  // Bonificar por metas em andamento
  const activeGoals = goals.filter(g => g.status === 'Em Andamento');
  const avgGoalProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / activeGoals.length 
    : 0;
  score += Math.min(avgGoalProgress / 10, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const generateKeyHighlights = (employees: any[], incidents: any[], projects: any[], emissions: any[], waste: any[]) => {
  const totalEmissions = emissions.reduce((sum, e) => sum + (e.total_co2e || 0), 0);
  const totalWaste = waste.reduce((sum, w) => sum + (w.quantity || 0), 0);
  
  return [
    `${employees.length} colaboradores ativos na organização`,
    `${incidents.length} incidentes de segurança registrados no período`,
    `${projects.length} projetos sociais em andamento`,
    `${totalEmissions.toFixed(2)} tCO2e de emissões de gases de efeito estufa`,
    `${totalWaste.toFixed(2)} toneladas de resíduos gerenciados`
  ];
};

export const calculateRecyclingRate = (waste: any[]) => {
  if (waste.length === 0) return 0;
  
  const recycled = waste.filter(w => 
    w.disposal_method?.toLowerCase().includes('reciclagem') ||
    w.disposal_method?.toLowerCase().includes('compostagem')
  ).length;
  
  return (recycled / waste.length) * 100;
};

export const calculateDiversityMetrics = (employees: any[]) => {
  const total = employees.length;
  if (total === 0) return {
    gender_distribution: {},
    age_distribution: {},
    diversity_index: 0,
  };
  
  const genderCount = employees.reduce((acc, emp) => {
    const gender = emp.gender || 'Não informado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const ageGroups = employees.reduce((acc, emp) => {
    if (!emp.birth_date) return acc;
    const age = new Date().getFullYear() - new Date(emp.birth_date).getFullYear();
    const group = age < 30 ? '<30' : age < 50 ? '30-50' : '50+';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Simpson Diversity Index (simplified)
  const genderDiversity = (Object.values(genderCount) as number[]).reduce((sum: number, count: number) => {
    return sum + ((count / total) * (count / total));
  }, 0);
  const diversityIndex = (1 - genderDiversity) * 10; // Scale to 0-10
  
  return {
    gender_distribution: Object.entries(genderCount).map(([gender, count]) => ({
      gender,
      count: count as number,
      percentage: ((count as number) / total) * 100,
    })),
    age_distribution: Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count: count as number,
      percentage: ((count as number) / total) * 100,
    })),
    diversity_index: Math.round(diversityIndex * 10) / 10,
  };
};

export const groupByDepartment = (employees: any[]) => {
  return employees.reduce((acc, emp) => {
    const dept = emp.department || 'Não informado';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const groupByRole = (employees: any[]) => {
  return employees.reduce((acc, emp) => {
    const role = emp.position || 'Não informado';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const groupBySeverity = (incidents: any[]) => {
  return incidents.reduce((acc, inc) => {
    const severity = inc.severity || 'Não informado';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const groupByCategory = (risks: any[]) => {
  return risks.reduce((acc, risk) => {
    const category = risk.category || 'Outros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const calculateTrend = (indicator: any) => {
  if (!indicator.target_value || !indicator.current_value) return 0;
  
  const performance = (indicator.current_value / indicator.target_value) * 100;
  
  if (performance >= 100) return 1; // Positive trend
  if (performance >= 80) return 0; // Neutral trend
  return -1; // Negative trend
};

// ============================================
// ENERGY CONSUMPTION CALCULATION
// ============================================

export interface EnergyConsumptionResult {
  total_kwh: number;
  electricity_kwh: number;
  thermal_kwh: number;
  fuel_kwh: number;
  renewable_kwh: number;
  non_renewable_kwh: number;
  renewable_percentage: number;
  breakdown: {
    source: string;
    category: string;
    kwh: number;
    is_renewable: boolean;
  }[];
}

// Fatores de conversão de combustíveis para kWh
const ENERGY_CONVERSION_FACTORS: Record<string, number> = {
  // Líquidos (kWh/L)
  'diesel': 10.8,
  'diesel b': 10.8,
  'diesel s10': 10.8,
  'diesel s500': 10.8,
  'gasolina': 9.1,
  'gasolina comum': 9.1,
  'gasolina premium': 9.1,
  'etanol': 6.5,
  'etanol hidratado': 6.5,
  'etanol anidro': 6.5,
  'biodiesel': 10.0,
  'óleo combustível': 11.2,
  'querosene': 10.2,
  
  // Gasosos (kWh/m³)
  'gás natural': 10.6,
  'gnv': 10.6,
  'biogás': 6.5,
  
  // Sólidos (kWh/kg)
  'glp': 12.8,
  'carvão': 7.5,
  'carvão mineral': 7.5,
  'carvão vegetal': 8.1,
  'lenha': 4.4,
  'biomassa': 4.5,
  'pellet': 5.0,
  'bagaço de cana': 4.2,
};

// Fontes renováveis
const RENEWABLE_SOURCES = [
  'solar', 'eólica', 'hidrelétrica', 'biomassa', 'biogás', 
  'etanol', 'biodiesel', 'bagaço', 'lenha', 'carvão vegetal',
  'bioenergia', 'geotérmica', 'maremotriz'
];

const checkIfRenewable = (sourceName: string, category: string): boolean => {
  const nameLower = sourceName.toLowerCase();
  const categoryLower = category.toLowerCase();
  
  return RENEWABLE_SOURCES.some(renewable => 
    nameLower.includes(renewable) || categoryLower.includes(renewable)
  );
};

const checkIfRenewableFuel = (fuelName: string): boolean => {
  const nameLower = fuelName.toLowerCase();
  return ['etanol', 'biodiesel', 'biogás', 'biomassa', 'bagaço', 'lenha', 'carvão vegetal'].some(
    renewable => nameLower.includes(renewable)
  );
};

const convertToKwhEnergy = (quantity: number, unit: string, fuelType: string): number => {
  const factor = ENERGY_CONVERSION_FACTORS[fuelType.toLowerCase()] || 0;
  let quantityInBaseUnit = quantity;
  const unitLower = unit.toLowerCase();
  
  // Normalizar unidades
  if (['kg', 'quilograma', 'quilogramas'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['l', 'litro', 'litros'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['m³', 'm3', 'metro cúbico', 'metros cúbicos'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['t', 'tonelada', 'toneladas'].includes(unitLower)) {
    quantityInBaseUnit = quantity * 1000; // converter para kg
  } else if (unitLower === 'kwh') {
    return quantity; // Já está em kWh
  } else if (unitLower === 'mwh') {
    return quantity * 1000;
  } else if (unitLower === 'gwh') {
    return quantity * 1000000;
  }

  return quantityInBaseUnit * factor;
};

export const calculateTotalEnergyConsumption = async (year?: number): Promise<EnergyConsumptionResult> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Obter company_id do usuário
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const currentYear = year || new Date().getFullYear();
  const breakdown: EnergyConsumptionResult['breakdown'] = [];

  // 1. ELETRICIDADE ADQUIRIDA (kWh direto)
  const { data: electricityData } = await supabase
    .from('activity_data')
    .select(`
      quantity,
      unit,
      emission_sources!inner(name, category, company_id)
    `)
    .eq('emission_sources.company_id', profile.company_id)
    .eq('emission_sources.category', 'Eletricidade Adquirida')
    .gte('period_start_date', `${currentYear}-01-01`)
    .lte('period_end_date', `${currentYear}-12-31`);

  let electricityKwh = 0;
  let renewableElectricityKwh = 0;

  electricityData?.forEach(item => {
    const sourceName = item.emission_sources?.name || '';
    let kwh = item.quantity || 0;
    
    // Converter se necessário
    const unitLower = (item.unit || '').toLowerCase();
    if (unitLower === 'mwh') kwh *= 1000;
    if (unitLower === 'gwh') kwh *= 1000000;
    
    electricityKwh += kwh;
    
    const isRenewable = checkIfRenewable(sourceName, 'eletricidade');
    if (isRenewable) renewableElectricityKwh += kwh;
    
    breakdown.push({
      source: sourceName,
      category: 'Eletricidade',
      kwh,
      is_renewable: isRenewable
    });
  });

  // 2. COMBUSTÍVEIS (converter para kWh)
  const { data: fuelData } = await supabase
    .from('activity_data')
    .select(`
      quantity,
      unit,
      emission_sources!inner(name, category, company_id)
    `)
    .eq('emission_sources.company_id', profile.company_id)
    .in('emission_sources.category', ['Combustão Móvel', 'Combustão Estacionária'])
    .gte('period_start_date', `${currentYear}-01-01`)
    .lte('period_end_date', `${currentYear}-12-31`);

  let fuelKwh = 0;
  let renewableFuelKwh = 0;

  fuelData?.forEach(item => {
    const fuelType = item.emission_sources?.name || '';
    const kwh = convertToKwhEnergy(item.quantity || 0, item.unit || '', fuelType);
    
    fuelKwh += kwh;
    
    const isRenewable = checkIfRenewableFuel(fuelType);
    if (isRenewable) renewableFuelKwh += kwh;
    
    breakdown.push({
      source: fuelType,
      category: 'Combustível',
      kwh,
      is_renewable: isRenewable
    });
  });

  // 3. ENERGIA TÉRMICA (vapor, calor gerado)
  const { data: thermalData } = await supabase
    .from('activity_data')
    .select(`
      quantity,
      unit,
      emission_sources!inner(name, category, company_id)
    `)
    .eq('emission_sources.company_id', profile.company_id)
    .ilike('emission_sources.name', '%vapor%')
    .gte('period_start_date', `${currentYear}-01-01`)
    .lte('period_end_date', `${currentYear}-12-31`);

  let thermalKwh = 0;
  let renewableThermalKwh = 0;

  thermalData?.forEach(item => {
    const sourceName = item.emission_sources?.name || '';
    let kwh = item.quantity || 0;
    
    // Assumir que já está em kWh térmico
    const unitLower = (item.unit || '').toLowerCase();
    if (unitLower === 'mwh') kwh *= 1000;
    if (unitLower === 'tj') kwh *= 277777.78; // 1 TJ = 277777.78 kWh
    
    thermalKwh += kwh;
    
    const isRenewable = checkIfRenewable(sourceName, 'térmico');
    if (isRenewable) renewableThermalKwh += kwh;
    
    breakdown.push({
      source: sourceName,
      category: 'Energia Térmica',
      kwh,
      is_renewable: isRenewable
    });
  });

  // CÁLCULOS FINAIS
  const totalKwh = electricityKwh + fuelKwh + thermalKwh;
  const renewableKwh = renewableElectricityKwh + renewableFuelKwh + renewableThermalKwh;
  const nonRenewableKwh = totalKwh - renewableKwh;
  const renewablePercentage = totalKwh > 0 ? (renewableKwh / totalKwh) * 100 : 0;

  return {
    total_kwh: Math.round(totalKwh * 100) / 100,
    electricity_kwh: Math.round(electricityKwh * 100) / 100,
    thermal_kwh: Math.round(thermalKwh * 100) / 100,
    fuel_kwh: Math.round(fuelKwh * 100) / 100,
    renewable_kwh: Math.round(renewableKwh * 100) / 100,
    non_renewable_kwh: Math.round(nonRenewableKwh * 100) / 100,
    renewable_percentage: Math.round(renewablePercentage * 100) / 100,
    breakdown: breakdown.filter(b => b.kwh > 0) // Remover entradas zeradas
  };
};
