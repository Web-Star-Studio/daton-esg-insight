import { supabase } from "@/integrations/supabase/client";

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
    emissionsData
  ] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('safety_incidents').select('*'),
    supabase.from('social_projects').select('*'),
    supabase.from('esg_risks').select('*'),
    supabase.from('esg_performance_indicators').select('*'),
    supabase.from('calculated_emissions').select('*')
  ]);

  if (employeesData.error) throw employeesData.error;
  if (safetyData.error) throw safetyData.error;
  if (socialProjectsData.error) throw socialProjectsData.error;
  if (risksData.error) throw risksData.error;
  if (performanceData.error) throw performanceData.error;
  if (emissionsData.error) throw emissionsData.error;

  const employees = employeesData.data;
  const safetyIncidents = safetyData.data;
  const socialProjects = socialProjectsData.data;
  const risks = risksData.data;
  const indicators = performanceData.data;
  const emissions = emissionsData.data;

  // Calcular scores ESG
  const environmentalScore = calculateEnvironmentalScore(emissions, indicators);
  const socialScore = calculateSocialScore(employees, safetyIncidents, socialProjects, indicators);
  const governanceScore = calculateGovernanceScore(risks, indicators);
  const overallScore = (environmentalScore + socialScore + governanceScore) / 3;

  // Gerar conteúdo do relatório
  const reportContent = {
    executive_summary: {
      overall_esg_score: overallScore,
      environmental_score: environmentalScore,
      social_score: socialScore,
      governance_score: governanceScore,
      key_highlights: generateKeyHighlights(employees, safetyIncidents, socialProjects, emissions)
    },
    environmental: {
      total_emissions: emissions.reduce((sum, e) => sum + e.total_co2e, 0),
      emission_sources: emissions.length,
      reduction_initiatives: socialProjects.filter(p => p.objective?.toLowerCase().includes('ambiental')).length
    },
    social: {
      total_employees: employees.length,
      safety_incidents: safetyIncidents.length,
      social_projects: socialProjects.length,
      training_hours: 0 // Será calculado quando tivermos os dados de treinamento
    },
    governance: {
      total_risks: risks.length,
      critical_risks: risks.filter(r => r.inherent_risk_level === 'Crítico').length,
      policies_reviewed: 0 // Será implementado
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