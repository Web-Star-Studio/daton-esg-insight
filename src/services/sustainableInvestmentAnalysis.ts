import { supabase } from "@/integrations/supabase/client";
import { SUSTAINABLE_INVESTMENT_BENCHMARKS } from "@/data/sustainableInvestmentBenchmarks";

/**
 * GRI 201-1, 203-1: Investimentos em Projetos Sustentáveis
 * Total de CAPEX e OPEX destinados a projetos com benefícios ambientais ou sociais
 */

export interface SustainableInvestmentResult {
  // Total agregado (∑ Projetos ESG)
  total_sustainable_investment: number; // CAPEX + OPEX
  
  // Separação CAPEX vs OPEX
  capex_sustainable: number; // Investimentos de capital (ativos fixos)
  opex_sustainable: number; // Investimentos operacionais (despesas)
  capex_percentage: number; // % do total
  opex_percentage: number; // % do total
  
  // Breakdown por categoria ESG
  environmental_investment: number; // Projetos ambientais
  social_investment: number; // Projetos sociais
  governance_investment: number; // Projetos de governança
  
  // Breakdown por tipo de projeto
  by_project_type: Array<{
    type: string;
    investment: number;
    projects_count: number;
    percentage: number;
    category: 'Ambiental' | 'Social' | 'Governança';
  }>;
  
  // Contadores
  total_projects_count: number;
  active_projects_count: number;
  completed_projects_count: number;
  
  // Percentual da receita
  investment_percentage_revenue: number; // (Total Investment / Revenue) × 100
  
  // Comparação com período anterior
  previous_period_investment: number;
  investment_growth_percentage: number;
  is_increasing: boolean;
  
  // ROI Estimado
  estimated_roi_percentage?: number;
  environmental_benefits?: Record<string, any>;
  social_benefits?: Record<string, any>;
  
  // Benchmarks setoriais
  sector_average_investment_percentage: number;
  is_above_sector_average: boolean;
  
  // Compliance GRI
  gri_201_1_compliant: boolean;
  gri_203_1_compliant: boolean;
  missing_data: string[];
  
  calculation_date: string;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  invested_amount?: number;
  spent_budget?: number;
  investment_type?: 'CAPEX' | 'OPEX';
  esg_category?: 'Ambiental' | 'Social' | 'Governança';
  status?: string;
  project_type?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Classifica automaticamente projetos como CAPEX ou OPEX com base em palavras-chave
 */
function classifyInvestmentType(project: ProjectData): 'CAPEX' | 'OPEX' {
  if (project.investment_type) return project.investment_type;
  
  const text = `${project.name} ${project.description || ''}`.toLowerCase();
  
  const capexKeywords = [
    'infraestrutura', 'equipamento', 'construção', 'instalação', 
    'aquisição', 'reforma', 'modernização', 'implantação',
    'sistema', 'tecnologia', 'hardware', 'maquinário'
  ];
  
  const isCapex = capexKeywords.some(kw => text.includes(kw));
  return isCapex ? 'CAPEX' : 'OPEX';
}

/**
 * Classifica automaticamente projetos em categorias ESG
 */
function classifyESGCategory(project: ProjectData): 'Ambiental' | 'Social' | 'Governança' {
  if (project.esg_category) return project.esg_category;
  
  const text = `${project.name} ${project.description || ''} ${project.project_type || ''}`.toLowerCase();
  
  const environmentalKeywords = [
    'ambiental', 'carbono', 'emissão', 'energia', 'água', 
    'resíduo', 'reciclagem', 'renovável', 'sustentável', 
    'ecológico', 'verde', 'clima', 'biodiversidade'
  ];
  
  const socialKeywords = [
    'social', 'comunidade', 'educação', 'saúde', 'cultura',
    'capacitação', 'treinamento', 'voluntariado', 'inclusão',
    'diversidade', 'direitos humanos', 'bem-estar'
  ];
  
  const governanceKeywords = [
    'governança', 'compliance', 'ética', 'integridade', 
    'transparência', 'auditoria', 'controle', 'gestão de risco'
  ];
  
  if (environmentalKeywords.some(kw => text.includes(kw))) return 'Ambiental';
  if (socialKeywords.some(kw => text.includes(kw))) return 'Social';
  if (governanceKeywords.some(kw => text.includes(kw))) return 'Governança';
  
  return 'Social'; // Default
}

/**
 * Calcula investimentos sustentáveis agregando projetos ESG
 */
export async function calculateSustainableInvestments(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<SustainableInvestmentResult> {
  try {
    // 1. Buscar projetos sociais
    const { data: socialProjects } = await supabase
      .from('social_projects')
      .select('*')
      .eq('company_id', companyId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    // 2. Buscar projetos gerais ESG
    const { data: esgProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    // Filtrar apenas projetos ESG
    const esgFilteredProjects = esgProjects?.filter(p => {
      const projectType = (p.project_type || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return projectType.includes('esg') || 
             projectType.includes('sustentabilidade') || 
             projectType.includes('ambiental') ||
             projectType.includes('social') ||
             name.includes('sustentável') ||
             name.includes('ambiental') ||
             name.includes('social');
    }) || [];

    // 3. Buscar projetos de carbono
    const { data: carbonProjects } = await supabase
      .from('carbon_projects')
      .select('*')
      .eq('company_id', companyId);

    // Calcular investimento em carbono (usando estimated_cost se disponível)
    const carbonInvestment = carbonProjects?.reduce((sum, p: any) => 
      sum + (p.estimated_cost || p.total_cost || 0), 0) || 0;

    // Agregar todos os projetos
    const allProjects: ProjectData[] = [
      ...(socialProjects || []).map(p => ({
        id: p.id,
        name: p.name || 'Projeto Social',
        description: p.description,
        invested_amount: p.invested_amount || 0,
        investment_type: p.investment_type as 'CAPEX' | 'OPEX',
        esg_category: p.esg_category as 'Ambiental' | 'Social' | 'Governança' || 'Social',
        status: p.status,
        project_type: 'Projeto Social',
        start_date: p.start_date,
        end_date: p.end_date,
      })),
      ...(esgFilteredProjects || []).map(p => ({
        id: p.id,
        name: p.name || 'Projeto ESG',
        description: p.description,
        spent_budget: p.spent_budget || 0,
        investment_type: undefined,
        esg_category: undefined,
        status: p.status,
        project_type: p.project_type,
        start_date: p.start_date,
        end_date: p.end_date,
      })),
    ];

    // Adicionar projeto virtual de carbono se houver investimento
    if (carbonInvestment > 0) {
      allProjects.push({
        id: 'carbon-projects',
        name: 'Compensação de Carbono',
        invested_amount: carbonInvestment,
        investment_type: 'OPEX',
        esg_category: 'Ambiental',
        status: 'Ativo',
        project_type: 'Carbono',
      });
    }

    // Classificar projetos
    const classifiedProjects = allProjects.map(p => ({
      ...p,
      investment_type: classifyInvestmentType(p),
      esg_category: classifyESGCategory(p),
      amount: p.invested_amount || p.spent_budget || 0,
    }));

    // Calcular totais
    const totalInvestment = classifiedProjects.reduce((sum, p) => sum + p.amount, 0);
    const capexTotal = classifiedProjects
      .filter(p => p.investment_type === 'CAPEX')
      .reduce((sum, p) => sum + p.amount, 0);
    const opexTotal = classifiedProjects
      .filter(p => p.investment_type === 'OPEX')
      .reduce((sum, p) => sum + p.amount, 0);

    // Calcular por categoria ESG
    const environmentalInvestment = classifiedProjects
      .filter(p => p.esg_category === 'Ambiental')
      .reduce((sum, p) => sum + p.amount, 0);
    const socialInvestment = classifiedProjects
      .filter(p => p.esg_category === 'Social')
      .reduce((sum, p) => sum + p.amount, 0);
    const governanceInvestment = classifiedProjects
      .filter(p => p.esg_category === 'Governança')
      .reduce((sum, p) => sum + p.amount, 0);

    // Agrupar por tipo de projeto
    const projectTypeGroups: Record<string, { investment: number; count: number; category: string }> = {};
    classifiedProjects.forEach(p => {
      const type = p.project_type || 'Outros';
      if (!projectTypeGroups[type]) {
        projectTypeGroups[type] = { investment: 0, count: 0, category: p.esg_category || 'Social' };
      }
      projectTypeGroups[type].investment += p.amount;
      projectTypeGroups[type].count += 1;
    });

    const byProjectType = Object.entries(projectTypeGroups).map(([type, data]) => ({
      type,
      investment: data.investment,
      projects_count: data.count,
      percentage: totalInvestment > 0 ? (data.investment / totalInvestment) * 100 : 0,
      category: data.category as 'Ambiental' | 'Social' | 'Governança',
    }));

    // Buscar receita da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('annual_revenue, sector')
      .eq('id', companyId)
      .single();

    const investmentPercentageRevenue = company?.annual_revenue 
      ? (totalInvestment / company.annual_revenue) * 100 
      : 0;

    // Calcular período anterior para comparação
    const periodDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const previousStart = new Date(new Date(startDate).getTime() - periodDuration).toISOString().split('T')[0];
    const previousEnd = startDate;

    // Buscar investimento do período anterior (simplificado)
    const { data: previousSocialProjects } = await supabase
      .from('social_projects')
      .select('invested_amount')
      .eq('company_id', companyId)
      .gte('start_date', previousStart)
      .lte('start_date', previousEnd);

    const previousInvestment = previousSocialProjects?.reduce((sum, p) => 
      sum + (p.invested_amount || 0), 0) || 0;

    const investmentGrowth = previousInvestment > 0
      ? ((totalInvestment - previousInvestment) / previousInvestment) * 100
      : 0;

    // Buscar benchmarks setoriais
    const sectorKey = company?.sector || 'Default';
    const benchmark = SUSTAINABLE_INVESTMENT_BENCHMARKS[sectorKey] || SUSTAINABLE_INVESTMENT_BENCHMARKS['Default'];

    // Verificar compliance GRI
    const missingData: string[] = [];
    if (totalInvestment === 0) missingData.push('Nenhum projeto ESG registrado');
    if (!company?.annual_revenue) missingData.push('Receita anual não cadastrada');
    
    const gri201Compliant = totalInvestment > 0 && company?.annual_revenue !== undefined;
    const gri203Compliant = environmentalInvestment > 0 || socialInvestment > 0;

    // Contadores de status
    const activeCount = classifiedProjects.filter(p => 
      p.status?.toLowerCase().includes('ativo') || 
      p.status?.toLowerCase().includes('em andamento')
    ).length;
    const completedCount = classifiedProjects.filter(p => 
      p.status?.toLowerCase().includes('concluído') || 
      p.status?.toLowerCase().includes('finalizado')
    ).length;

    return {
      total_sustainable_investment: totalInvestment,
      capex_sustainable: capexTotal,
      opex_sustainable: opexTotal,
      capex_percentage: totalInvestment > 0 ? (capexTotal / totalInvestment) * 100 : 0,
      opex_percentage: totalInvestment > 0 ? (opexTotal / totalInvestment) * 100 : 0,
      environmental_investment: environmentalInvestment,
      social_investment: socialInvestment,
      governance_investment: governanceInvestment,
      by_project_type: byProjectType,
      total_projects_count: classifiedProjects.length,
      active_projects_count: activeCount,
      completed_projects_count: completedCount,
      investment_percentage_revenue: investmentPercentageRevenue,
      previous_period_investment: previousInvestment,
      investment_growth_percentage: investmentGrowth,
      is_increasing: investmentGrowth > 0,
      estimated_roi_percentage: undefined,
      environmental_benefits: undefined,
      social_benefits: undefined,
      sector_average_investment_percentage: benchmark.investment_percentage_revenue_typical,
      is_above_sector_average: investmentPercentageRevenue > benchmark.investment_percentage_revenue_typical,
      gri_201_1_compliant: gri201Compliant,
      gri_203_1_compliant: gri203Compliant,
      missing_data: missingData,
      calculation_date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating sustainable investments:', error);
    throw error;
  }
}
