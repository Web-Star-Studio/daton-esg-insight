import { supabase } from "@/integrations/supabase/client";

export interface ESGRisk {
  id: string;
  company_id: string;
  risk_title: string;
  risk_description: string;
  esg_category: 'Environmental' | 'Social' | 'Governance';
  risk_category?: string;
  probability: 'Baixa' | 'Média' | 'Alta';
  impact: 'Baixo' | 'Médio' | 'Alto';
  inherent_risk_level?: string;
  mitigation_actions?: string;
  control_measures?: string;
  residual_risk_level?: string;
  owner_user_id?: string;
  risk_owner?: string;
  review_frequency?: string;
  last_review_date?: string;
  next_review_date?: string;
  status: string;
  risk_appetite?: string;
  risk_tolerance?: string;
  business_impact?: string;
  regulatory_impact?: string;
  reputation_impact?: string;
  treatment_plan?: string;
  residual_probability?: string;
  residual_impact?: string;
  created_at: string;
  updated_at: string;
}

export const getESGRisks = async () => {
  const { data, error } = await supabase
    .from('esg_risks')
    .select('*')
    .order('inherent_risk_level', { ascending: false });

  if (error) throw error;
  return data;
};

export const getESGRisk = async (id: string) => {
  const { data, error } = await supabase
    .from('esg_risks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createESGRisk = async (risk: Omit<ESGRisk, 'id' | 'inherent_risk_level' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('esg_risks')
    .insert(risk)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateESGRisk = async (id: string, updates: Partial<ESGRisk>) => {
  const { data, error } = await supabase
    .from('esg_risks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteESGRisk = async (id: string) => {
  const { error } = await supabase
    .from('esg_risks')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getRiskMatrix = async () => {
  const { data: risks, error } = await supabase
    .from('esg_risks')
    .select('*')
    .eq('status', 'Ativo');

  if (error) throw error;

  const matrix = {
    'Baixa': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 },
    'Média': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 },
    'Alta': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 }
  };

  risks.forEach(risk => {
    matrix[risk.probability as keyof typeof matrix][risk.impact as keyof typeof matrix['Baixa']]++;
  });

  return matrix;
};

export const getRiskMetrics = async () => {
  const { data: risks, error } = await supabase
    .from('esg_risks')
    .select('*')
    .eq('status', 'Ativo');

  if (error) throw error;

  const totalRisks = risks.length;
  const risksByCategory = risks.reduce((acc, risk) => {
    acc[risk.esg_category] = (acc[risk.esg_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const risksByLevel = risks.reduce((acc, risk) => {
    const level = risk.inherent_risk_level || 'Indefinido';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalRisks = risks.filter(r => r.inherent_risk_level === 'Crítico').length;
  const highRisks = risks.filter(r => r.inherent_risk_level === 'Alto').length;

  const risksNeedingReview = risks.filter(r => 
    r.next_review_date && new Date(r.next_review_date) <= new Date()
  ).length;

  return {
    totalRisks,
    criticalRisks,
    highRisks,
    risksNeedingReview,
    risksByCategory,
    risksByLevel,
    riskTrend: calculateRiskTrend(risks)
  };
};

const calculateRiskTrend = (risks: any[]) => {
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      risks: risks.filter(risk => {
        const riskDate = new Date(risk.created_at);
        return riskDate.getMonth() === date.getMonth() && 
               riskDate.getFullYear() === date.getFullYear();
      }).length
    };
  }).reverse();

  return last6Months;
};

// Service object for easy import
export const esgRisksService = {
  getESGRisks,
  getESGRisk,
  createESGRisk,
  updateESGRisk,
  deleteESGRisk,
  getRiskMatrix,
  getRiskMetrics
};