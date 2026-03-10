import { supabase } from "@/integrations/supabase/client";

export interface ESGRisk {
  id: string;
  company_id: string;
  risk_title: string;
  risk_description: string;
  esg_category: 'Ambiental' | 'Social' | 'Governança';
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

const isDemoMode = () => typeof window !== 'undefined' && (window as any).__DATON_DEMO_MODE__ === true;

const MOCK_ESG_RISKS: ESGRisk[] = [
  {
    id: "risk-1",
    company_id: "demo-company",
    risk_title: "Vazamento de Efluentes Industriais",
    risk_description: "Risco de contaminação do solo e lençol freático devido a falhas no sistema de tratamento.",
    esg_category: "Ambiental",
    probability: "Média",
    impact: "Alto",
    inherent_risk_level: "Alto",
    mitigation_actions: "Manutenção preventiva trimestral e instalação de sensores de vazamento.",
    control_measures: "Monitoramento contínuo",
    residual_risk_level: "Médio",
    status: "Ativo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "risk-2",
    company_id: "demo-company",
    risk_title: "Acidente de Trabalho Fatal",
    risk_description: "Risco de fatalidade nas operações de içamento de carga.",
    esg_category: "Social",
    probability: "Baixa",
    impact: "Alto",
    inherent_risk_level: "Alto",
    mitigation_actions: "Treinamento obrigatório de NR-35 e NR-11.",
    control_measures: "Equipamentos de proteção individual",
    status: "Ativo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "risk-3",
    company_id: "demo-company",
    risk_title: "Violação de Dados (LGPD)",
    risk_description: "Risco de vazamento de dados pessoais de clientes e colaboradores.",
    esg_category: "Governança",
    probability: "Média",
    impact: "Alto",
    inherent_risk_level: "Crítico",
    mitigation_actions: "Implementação de MFA e auditoria de sistemas.",
    control_measures: "Firewall e criptografia",
    status: "Ativo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const getESGRisks = async (): Promise<ESGRisk[]> => {
  if (isDemoMode()) {
    return MOCK_ESG_RISKS.map(r => ({ ...r }));
  }

  const { data, error } = await supabase
    .from('esg_risks')
    .select('*')
    .order('inherent_risk_level', { ascending: false });

  if (error) throw error;
  return data as ESGRisk[];
};

export const getESGRisk = async (id: string) => {
  const { data, error } = await supabase
    .from('esg_risks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar risco: ${error.message}`);
  if (!data) throw new Error('Risco não encontrado');
  return data;
};

export const createESGRisk = async (risk: Omit<ESGRisk, 'id' | 'inherent_risk_level' | 'created_at' | 'updated_at'>) => {
  if (isDemoMode()) {
    const created: ESGRisk = {
      ...(risk as ESGRisk),
      id: `risk-${Date.now()}`,
      inherent_risk_level: (risk as any).inherent_risk_level ?? 'Médio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_ESG_RISKS.unshift(created);
    return created;
  }
  const { data, error } = await supabase
    .from('esg_risks')
    .insert(risk)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao criar risco: ${error.message}`);
  if (!data) throw new Error('Não foi possível criar o risco');
  return data;
};

export const updateESGRisk = async (id: string, updates: Partial<ESGRisk>) => {
  if (isDemoMode()) {
    const index = MOCK_ESG_RISKS.findIndex((r) => r.id === id);
    if (index < 0) throw new Error('Risco não encontrado');
    MOCK_ESG_RISKS[index] = { ...MOCK_ESG_RISKS[index], ...updates, updated_at: new Date().toISOString() };
    return MOCK_ESG_RISKS[index];
  }
  const { data, error } = await supabase
    .from('esg_risks')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao atualizar risco: ${error.message}`);
  if (!data) throw new Error('Risco não encontrado');
  return data;
};

export const deleteESGRisk = async (id: string) => {
  if (isDemoMode()) {
    const index = MOCK_ESG_RISKS.findIndex((r) => r.id === id);
    if (index >= 0) MOCK_ESG_RISKS.splice(index, 1);
    return;
  }
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

  const typedRisks = risks as ESGRisk[];

  const matrix = {
    'Baixa': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 },
    'Média': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 },
    'Alta': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 }
  };

  typedRisks.forEach((risk: ESGRisk) => {
    const prob = risk.probability as keyof typeof matrix;
    const imp = risk.impact as keyof typeof matrix['Baixa'];
    if (Object.prototype.hasOwnProperty.call(matrix, prob) &&
      Object.prototype.hasOwnProperty.call(matrix['Baixa'], imp)) {
      matrix[prob][imp]++;
    }
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