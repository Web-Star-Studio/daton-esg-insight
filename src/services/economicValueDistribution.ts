import { supabase } from "@/integrations/supabase/client";

export interface EconomicValueDistributionResult {
  // Valor Econômico Gerado (DEG)
  generated: {
    gross_revenue: number;
    financial_income: number;
    asset_sales_income: number;
    other_income: number;
    total: number;
  };
  
  // Valor Econômico Distribuído (DED)
  distributed: {
    operational_costs: {
      raw_materials: number;
      suppliers: number;
      other: number;
      total: number;
    };
    
    employees: {
      salaries: number;
      benefits: number;
      total: number;
    };
    
    capital_providers: {
      interest_payments: number;
      dividends: number;
      loan_repayments: number;
      total: number;
    };
    
    government: {
      income_taxes: number;
      sales_taxes: number;
      payroll_taxes: number;
      other_taxes: number;
      total: number;
    };
    
    community: {
      donations: number;
      sponsorships: number;
      infrastructure: number;
      total: number;
    };
    
    total: number;
  };
  
  // Valor Econômico Retido (VER)
  retained: {
    value: number;
    percentage_of_generated: number;
  };
  
  // Distribuição Percentual
  distribution_percentage: {
    operational_costs: number;
    employees: number;
    capital_providers: number;
    government: number;
    community: number;
    retained: number;
  };
  
  // Comparação com Período Anterior
  previous_period: {
    deg: number;
    ded: number;
    ver: number;
  };
  
  growth: {
    deg_percentage: number;
    ded_percentage: number;
    ver_percentage: number;
  };
  
  // Ranking de Stakeholders
  stakeholder_ranking: Array<{
    stakeholder: string;
    value: number;
    percentage: number;
  }>;
  
  // Compliance
  gri_201_1_compliant: boolean;
  missing_data: string[];
  completeness_percentage: number;
  
  calculation_date: string;
}

export async function calculateEconomicValueDistribution(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<EconomicValueDistributionResult> {
  
  // 1. Buscar dados econômicos cadastrados
  const { data: economicData } = await supabase
    .from('gri_economic_data_collection')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  // 2. Calcular DEG (Valor Econômico Gerado)
  const deg = {
    gross_revenue: economicData?.gross_revenue || economicData?.revenue_total || 0,
    financial_income: economicData?.financial_income || 0,
    asset_sales_income: economicData?.asset_sales_income || 0,
    other_income: economicData?.other_income || 0,
    total: 0
  };
  deg.total = deg.gross_revenue + deg.financial_income + deg.asset_sales_income + deg.other_income;
  
  // 3. Calcular DED (Valor Econômico Distribuído)
  
  // 3.1 Custos Operacionais
  const operationalCosts = {
    raw_materials: economicData?.raw_materials_costs || 0,
    suppliers: economicData?.supplier_payments || 0,
    other: economicData?.other_operational_costs || 0,
    total: 0
  };
  operationalCosts.total = operationalCosts.raw_materials + operationalCosts.suppliers + operationalCosts.other;
  
  // 3.2 Empregados
  const employees = {
    salaries: economicData?.employee_salaries || 0,
    benefits: economicData?.employee_benefits || 0,
    total: 0
  };
  employees.total = employees.salaries + employees.benefits;
  
  // 3.3 Provedores de Capital
  const capitalProviders = {
    interest_payments: economicData?.interest_payments || 0,
    dividends: economicData?.dividends_paid || 0,
    loan_repayments: economicData?.loan_repayments || 0,
    total: 0
  };
  capitalProviders.total = capitalProviders.interest_payments + capitalProviders.dividends + capitalProviders.loan_repayments;
  
  // 3.4 Governo
  const government = {
    income_taxes: economicData?.income_taxes || 0,
    sales_taxes: economicData?.sales_taxes || 0,
    payroll_taxes: economicData?.payroll_taxes || 0,
    other_taxes: economicData?.other_taxes || 0,
    total: 0
  };
  government.total = government.income_taxes + government.sales_taxes + government.payroll_taxes + government.other_taxes;
  
  // 3.5 Comunidade (integrar com projetos sociais existentes)
  const { data: socialProjects } = await supabase
    .from('social_projects')
    .select('invested_amount')
    .eq('company_id', companyId)
    .gte('start_date', startDate)
    .lte('start_date', endDate);
  
  const socialInvestmentsFromProjects = socialProjects?.reduce((sum, p) => sum + (p.invested_amount || 0), 0) || 0;
  
  const community = {
    donations: economicData?.voluntary_donations || 0,
    sponsorships: economicData?.sponsorships || 0,
    infrastructure: economicData?.infrastructure_investments || 0,
    total: economicData?.community_investments || socialInvestmentsFromProjects || 0
  };
  
  // Total DED
  const ded = {
    operational_costs: operationalCosts,
    employees: employees,
    capital_providers: capitalProviders,
    government: government,
    community: community,
    total: operationalCosts.total + employees.total + capitalProviders.total + government.total + community.total
  };
  
  // 4. Calcular VER (Valor Econômico Retido)
  const ver = {
    value: deg.total - ded.total,
    percentage_of_generated: deg.total > 0 ? ((deg.total - ded.total) / deg.total) * 100 : 0
  };
  
  // 5. Calcular distribuição percentual
  const distributionPercentage = {
    operational_costs: deg.total > 0 ? (operationalCosts.total / deg.total) * 100 : 0,
    employees: deg.total > 0 ? (employees.total / deg.total) * 100 : 0,
    capital_providers: deg.total > 0 ? (capitalProviders.total / deg.total) * 100 : 0,
    government: deg.total > 0 ? (government.total / deg.total) * 100 : 0,
    community: deg.total > 0 ? (community.total / deg.total) * 100 : 0,
    retained: ver.percentage_of_generated
  };
  
  // 6. Ranking de stakeholders
  const stakeholderRanking = [
    { stakeholder: 'Custos Operacionais', value: operationalCosts.total, percentage: distributionPercentage.operational_costs },
    { stakeholder: 'Empregados', value: employees.total, percentage: distributionPercentage.employees },
    { stakeholder: 'Governo', value: government.total, percentage: distributionPercentage.government },
    { stakeholder: 'Provedores de Capital', value: capitalProviders.total, percentage: distributionPercentage.capital_providers },
    { stakeholder: 'Comunidade', value: community.total, percentage: distributionPercentage.community },
    { stakeholder: 'Valor Retido (Reinvestimento)', value: ver.value, percentage: distributionPercentage.retained }
  ].sort((a, b) => b.value - a.value);
  
  // 7. Comparação com período anterior
  const previousPeriod = {
    deg: economicData?.previous_period_deg || 0,
    ded: economicData?.previous_period_ded || 0,
    ver: economicData?.previous_period_ver || 0
  };
  
  const growth = {
    deg_percentage: previousPeriod.deg > 0 ? ((deg.total - previousPeriod.deg) / previousPeriod.deg) * 100 : 0,
    ded_percentage: previousPeriod.ded > 0 ? ((ded.total - previousPeriod.ded) / previousPeriod.ded) * 100 : 0,
    ver_percentage: previousPeriod.ver > 0 ? ((ver.value - previousPeriod.ver) / previousPeriod.ver) * 100 : 0
  };
  
  // 8. Compliance GRI 201-1
  const missingData: string[] = [];
  if (deg.gross_revenue === 0) missingData.push('Receita bruta não informada');
  if (operationalCosts.total === 0) missingData.push('Custos operacionais não informados');
  if (employees.total === 0) missingData.push('Salários e benefícios não informados');
  if (government.total === 0) missingData.push('Pagamentos ao governo não informados');
  
  const requiredFields = 4;
  const filledFields = requiredFields - missingData.length;
  const completenessPercentage = (filledFields / requiredFields) * 100;
  
  const gri_201_1_compliant = completenessPercentage >= 75;
  
  return {
    generated: deg,
    distributed: ded,
    retained: ver,
    distribution_percentage: distributionPercentage,
    previous_period: previousPeriod,
    growth: growth,
    stakeholder_ranking: stakeholderRanking,
    gri_201_1_compliant,
    missing_data: missingData,
    completeness_percentage: completenessPercentage,
    calculation_date: new Date().toISOString()
  };
}
