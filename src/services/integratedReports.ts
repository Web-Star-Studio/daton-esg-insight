import { supabase } from "@/integrations/supabase/client";
import {
  calculateEnvironmentalScore,
  calculateSocialScore,
  calculateGovernanceScore,
  generateKeyHighlights,
  calculateRecyclingRate,
  calculateDiversityMetrics,
  groupByDepartment,
  groupByRole,
  groupBySeverity,
  groupByCategory,
  calculateTrend,
} from "./integratedReportsHelpers";

export interface IntegratedReport {
  id: string;
  company_id: string;
  report_title: string;
  report_type: 'Anual' | 'Semestral' | 'Trimestral';
  reporting_period_start: string;
  reporting_period_end: string;
  framework?: string;
  content: Record<string, any>;
  environmental_score?: number;
  social_score?: number;
  governance_score?: number;
  overall_esg_score?: number;
  status: string;
  published_at?: string;
  file_path?: string;
  created_by_user_id: string;
  approved_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export const getIntegratedReports = async () => {
  const { data, error } = await supabase
    .from('integrated_reports')
    .select('*')
    .order('reporting_period_start', { ascending: false });

  if (error) throw error;
  return data;
};

export const getIntegratedReport = async (id: string) => {
  const { data, error } = await supabase
    .from('integrated_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createIntegratedReport = async (report: Omit<IntegratedReport, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('integrated_reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateIntegratedReport = async (id: string, updates: Partial<IntegratedReport>) => {
  const { data, error } = await supabase
    .from('integrated_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteIntegratedReport = async (id: string) => {
  const { error } = await supabase
    .from('integrated_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const publishReport = async (id: string, approvedBy: string) => {
  const { data, error } = await supabase
    .from('integrated_reports')
    .update({
      status: 'Publicado',
      published_at: new Date().toISOString(),
      approved_by_user_id: approvedBy
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const generateReportData = async (reportId: string) => {
  // Buscar dados de todos os módulos para gerar o relatório
  const [
    employeesData,
    safetyData,
    socialProjectsData,
    risksData,
    performanceData,
    emissionsData,
    wasteData,
    licensesData,
    goalsData,
    trainingData
  ] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('safety_incidents').select('*'),
    supabase.from('social_projects').select('*'),
    supabase.from('esg_risks').select('*'),
    supabase.from('esg_performance_indicators').select('*'),
    supabase.from('calculated_emissions').select('*'),
    supabase.from('waste_logs').select('*'),
    supabase.from('licenses').select('*'),
    supabase.from('goals').select('*'),
    supabase.from('training_programs').select('*')
  ]);

  if (employeesData.error) throw employeesData.error;
  if (safetyData.error) throw safetyData.error;
  if (socialProjectsData.error) throw socialProjectsData.error;
  if (risksData.error) throw risksData.error;
  if (performanceData.error) throw performanceData.error;
  if (emissionsData.error) throw emissionsData.error;
  if (wasteData.error) throw wasteData.error;
  if (licensesData.error) throw licensesData.error;
  if (goalsData.error) throw goalsData.error;
  if (trainingData.error) throw trainingData.error;

  const employees = employeesData.data;
  const safetyIncidents = safetyData.data;
  const socialProjects = socialProjectsData.data;
  const risks = risksData.data;
  const indicators = performanceData.data;
  const emissions = emissionsData.data;
  const waste = wasteData.data;
  const licenses = licensesData.data;
  const goals = goalsData.data;
  const trainings = trainingData.data;

  // Calcular scores ESG
  const environmentalScore = calculateEnvironmentalScore(emissions, indicators, waste, licenses);
  const socialScore = calculateSocialScore(employees, safetyIncidents, socialProjects, indicators, trainings);
  const governanceScore = calculateGovernanceScore(risks, indicators, goals);
  const overallScore = (environmentalScore + socialScore + governanceScore) / 3;

  // Calcular métricas detalhadas
  const totalEmissions = emissions.reduce((sum, e) => sum + (e.total_co2e || 0), 0);
  const emissionsByScope = {
    scope1: 0, // Placeholder - needs emission_sources table join
    scope2: 0,
    scope3: 0,
  };

  const totalWaste = waste.reduce((sum, w) => sum + (w.quantity || 0), 0);
  const wasteByType = waste.reduce((acc, w) => {
    const type = w.waste_description || 'Outros';
    acc[type] = (acc[type] || 0) + (w.quantity || 0);
    return acc;
  }, {} as Record<string, number>);

  const diversityMetrics = calculateDiversityMetrics(employees);
  const trainingHours = trainings.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
  
  const activeLicenses = licenses.filter(l => l.status === 'Ativa').length;
  const licenseCompliance = licenses.length > 0 ? (activeLicenses / licenses.length) * 100 : 0;

  const goalsProgress = goals.map(g => ({
    id: g.id,
    name: g.name,
    progress: 0, // Placeholder
    status: g.status,
    target_date: g.deadline_date,
  }));

  // Gerar conteúdo do relatório expandido
  const reportContent = {
    executive_summary: {
      overall_esg_score: overallScore,
      environmental_score: environmentalScore,
      social_score: socialScore,
      governance_score: governanceScore,
      key_highlights: generateKeyHighlights(employees, safetyIncidents, socialProjects, emissions, waste),
      year_over_year_comparison: {
        // Placeholder - será implementado com dados históricos
        environmental_trend: 0,
        social_trend: 0,
        governance_trend: 0,
      },
      material_topics: [
        'Emissões de GEE',
        'Gestão de Resíduos',
        'Saúde e Segurança',
        'Diversidade e Inclusão',
        'Ética e Compliance'
      ]
    },
    environmental: {
      total_emissions: totalEmissions,
      emissions_by_scope: emissionsByScope,
      emission_sources: emissions.length,
      waste_management: {
        total_waste: totalWaste,
        waste_by_type: wasteByType,
        recycling_rate: calculateRecyclingRate(waste),
      },
      water_consumption: 0, // Placeholder
      energy_usage: 0, // Placeholder
      reduction_initiatives: socialProjects.filter(p => 
        p.objective?.toLowerCase().includes('ambiental') || 
        p.objective?.toLowerCase().includes('emissão')
      ).length,
      license_compliance: licenseCompliance,
      active_licenses: activeLicenses,
      total_licenses: licenses.length,
    },
    social: {
      workforce_metrics: {
        total_employees: employees.length,
        by_department: groupByDepartment(employees),
        by_role: groupByRole(employees),
        turnover_rate: 0, // Placeholder
      },
      diversity_inclusion: diversityMetrics,
      health_safety: {
        total_incidents: safetyIncidents.length,
        incidents_by_severity: groupBySeverity(safetyIncidents),
        lost_time_incidents: safetyIncidents.filter(i => i.severity === 'Grave').length,
        incident_rate: employees.length > 0 ? (safetyIncidents.length / employees.length) * 100 : 0,
      },
      training_development: {
        total_programs: trainings.length,
        total_hours: trainingHours,
        hours_per_employee: employees.length > 0 ? trainingHours / employees.length : 0,
        mandatory_programs: trainings.filter(t => t.is_mandatory).length,
      },
      social_projects: socialProjects.length,
      community_engagement: socialProjects.map(p => ({
        name: p.name,
        status: p.status,
        beneficiaries: 0, // Placeholder
      })),
    },
    governance: {
      board_composition: {
        // Placeholder - será integrado com dados do conselho
        total_members: 0,
        independent_members: 0,
        diversity_percentage: 0,
      },
      risk_management: {
        total_risks: risks.length,
        critical_risks: risks.filter(r => r.inherent_risk_level === 'Crítico').length,
        high_risks: risks.filter(r => r.inherent_risk_level === 'Alto').length,
        medium_risks: risks.filter(r => r.inherent_risk_level === 'Médio').length,
        low_risks: risks.filter(r => r.inherent_risk_level === 'Baixo').length,
        risks_by_category: groupByCategory(risks),
      },
      ethics_compliance: {
        policies_reviewed: 0, // Placeholder
        training_completion: 0, // Placeholder
        whistleblower_cases: 0, // Placeholder
      },
      policies: [], // Placeholder
    },
    goals_progress: {
      environmental_goals: goalsProgress.filter(g => g.name.toLowerCase().includes('ambient')),
      social_goals: goalsProgress.filter(g => g.name.toLowerCase().includes('social')),
      governance_goals: goalsProgress.filter(g => g.name.toLowerCase().includes('governança') || g.name.toLowerCase().includes('compliance')),
      overall_progress: goalsProgress.reduce((sum, g) => sum + g.progress, 0) / (goalsProgress.length || 1),
    },
    kpis: {
      environmental: indicators.filter(i => i.esg_category === 'Environmental').map(ind => ({
        name: ind.indicator_name,
        value: ind.current_value,
        target: ind.target_value,
        unit: 'unidade',
        trend: calculateTrend(ind),
      })),
      social: indicators.filter(i => i.esg_category === 'Social').map(ind => ({
        name: ind.indicator_name,
        value: ind.current_value,
        target: ind.target_value,
        unit: 'unidade',
        trend: calculateTrend(ind),
      })),
      governance: indicators.filter(i => i.esg_category === 'Governance').map(ind => ({
        name: ind.indicator_name,
        value: ind.current_value,
        target: ind.target_value,
        unit: 'unidade',
        trend: calculateTrend(ind),
      })),
    }
  };

  // Atualizar o relatório com os dados calculados
  await updateIntegratedReport(reportId, {
    content: reportContent,
    environmental_score: environmentalScore,
    social_score: socialScore,
    governance_score: governanceScore,
    overall_esg_score: overallScore
  });

  return reportContent;
};

const calculateEnvironmentalScore = (emissions: any[], indicators: any[]) => {
  // Lógica simplificada para calcular score ambiental
  const envIndicators = indicators.filter(i => i.esg_category === 'Environmental');
  if (envIndicators.length === 0) return 0;
  
  const avgPerformance = envIndicators.reduce((sum, ind) => {
    if (!ind.target_value || !ind.current_value) return sum;
    return sum + Math.min((ind.current_value / ind.target_value) * 100, 100);
  }, 0) / envIndicators.length;
  
  return Math.round(avgPerformance);
};

const calculateSocialScore = (employees: any[], incidents: any[], projects: any[], indicators: any[]) => {
  // Lógica simplificada para calcular score social
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
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculateGovernanceScore = (risks: any[], indicators: any[]) => {
  // Lógica simplificada para calcular score de governança
  const govIndicators = indicators.filter(i => i.esg_category === 'Governance');
  
  let score = 75; // Score base
  
  // Penalizar por riscos críticos
  const criticalRisks = risks.filter(r => r.inherent_risk_level === 'Crítico');
  score -= Math.min(criticalRisks.length * 5, 25);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const generateKeyHighlights = (employees: any[], incidents: any[], projects: any[], emissions: any[]) => {
  return [
    `${employees.length} colaboradores ativos`,
    `${incidents.length} incidentes de segurança registrados`,
    `${projects.length} projetos sociais em andamento`,
    `${emissions.reduce((sum, e) => sum + e.total_co2e, 0).toFixed(2)} tCO2e de emissões calculadas`
  ];
};