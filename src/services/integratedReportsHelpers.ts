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
  const genderDiversity = Object.values(genderCount).reduce((sum: number, count) => {
    return sum + ((count / total) * (count / total));
  }, 0);
  const diversityIndex = (1 - genderDiversity) * 10; // Scale to 0-10
  
  return {
    gender_distribution: Object.entries(genderCount).map(([gender, count]) => ({
      gender,
      count,
      percentage: (count / total) * 100,
    })),
    age_distribution: Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count,
      percentage: (count / total) * 100,
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
