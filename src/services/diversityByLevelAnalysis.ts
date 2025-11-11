import { supabase } from "@/integrations/supabase/client";

/**
 * GRI 405-1: Diversidade por Nível Hierárquico
 * Análise completa de diversidade (gênero, PCD, etnia) distribuída por níveis hierárquicos
 */

// Hierarchy level configuration
const HIERARCHY_LEVELS = {
  'C-Level': { 
    order: 1, 
    keywords: ['ceo', 'cfo', 'cto', 'coo', 'presidente', 'vice-presidente', 'c-level', 'chief'] 
  },
  'Diretoria': { 
    order: 2, 
    keywords: ['diretor', 'diretora', 'director'] 
  },
  'Gerência': { 
    order: 3, 
    keywords: ['gerente', 'manager', 'gestor', 'gestora'] 
  },
  'Coordenação': { 
    order: 4, 
    keywords: ['coordenador', 'coordenadora', 'coordinator'] 
  },
  'Operacional': { 
    order: 5, 
    keywords: ['analista', 'assistente', 'técnico', 'técnica', 'especialista', 'operador', 'operadora'] 
  },
  'Trainee/Estágio': { 
    order: 6, 
    keywords: ['trainee', 'estagiário', 'estagiária', 'intern', 'aprendiz'] 
  }
} as const;

export interface HierarchyLevelBreakdown {
  level: string;
  level_order: number;
  total_employees: number;
  
  // Gender
  women_count: number;
  women_percentage: number;
  men_count: number;
  men_percentage: number;
  other_gender_count: number;
  other_gender_percentage: number;
  
  // PCD
  pcd_count: number;
  pcd_percentage: number;
  
  // Ethnicity
  white_count: number;
  white_percentage: number;
  black_count: number;
  black_percentage: number;
  brown_count: number;
  brown_percentage: number;
  asian_count: number;
  asian_percentage: number;
  indigenous_count: number;
  indigenous_percentage: number;
  not_declared_count: number;
  not_declared_percentage: number;
  
  // Intersectionality
  women_minorities_count: number;
  women_minorities_percentage: number;
}

export interface PipelineAnalysis {
  leadership_diversity_gap: number;
  gender_gap_top_vs_base: number;
  pcd_gap_top_vs_base: number;
  ethnicity_gap_top_vs_base: number;
  funnel: Array<{
    level: string;
    women_percentage: number;
    pcd_percentage: number;
    minorities_percentage: number;
  }>;
}

export interface PayEquityPreview {
  avg_salary_women: number;
  avg_salary_men: number;
  pay_gap_percentage: number;
  has_significant_gap: boolean;
}

export interface DepartmentDiversity {
  department: string;
  diversity_score: number;
  women_percentage: number;
  pcd_percentage: number;
  minorities_percentage: number;
}

export interface QuotaLawCompliance {
  required_pcd_percentage: number;
  current_pcd_percentage: number;
  is_compliant: boolean;
  missing_pcd_hires: number;
}

export interface GRI405Compliance {
  is_compliant: boolean;
  missing_data: string[];
  recommendations: string[];
  breakdown_complete: boolean;
}

export interface DiversityByLevelResult {
  total_employees: number;
  total_women: number;
  total_pcd: number;
  total_minorities_ethnicity: number;
  
  women_percentage: number;
  pcd_percentage: number;
  minorities_percentage: number;
  
  by_hierarchy_level: HierarchyLevelBreakdown[];
  pipeline_analysis: PipelineAnalysis;
  pay_equity_preview: PayEquityPreview;
  
  comparison: {
    previous_women_percentage: number;
    change_women_percentage: number;
    previous_pcd_percentage: number;
    change_pcd_percentage: number;
    is_improving: boolean;
  };
  
  top_5_diverse_departments: DepartmentDiversity[];
  bottom_5_diverse_departments: DepartmentDiversity[];
  
  performance_classification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  gri_405_1_compliance: GRI405Compliance;
  quota_law_compliance: QuotaLawCompliance;
  
  calculation_date: string;
}

// Detect hierarchy level from position title
function detectHierarchyLevel(positionTitle: string): { level: string; order: number } {
  const titleLower = positionTitle?.toLowerCase() || '';
  
  for (const [level, config] of Object.entries(HIERARCHY_LEVELS)) {
    if (config.keywords.some(keyword => titleLower.includes(keyword))) {
      return { level, order: config.order };
    }
  }
  
  return { level: 'Operacional', order: 5 };
}

// Calculate quota requirement based on company size
function calculateQuotaRequirement(totalEmployees: number): number {
  if (totalEmployees >= 1001) return 0.05; // 5%
  if (totalEmployees >= 501) return 0.04;  // 4%
  if (totalEmployees >= 201) return 0.03;  // 3%
  if (totalEmployees >= 100) return 0.02;  // 2%
  return 0; // Not applicable
}

// Calculate diversity score using Simpson Diversity Index
function calculateDiversityScore(employees: any[]): number {
  const total = employees.length;
  if (total === 0) return 0;
  
  const groups = employees.reduce((acc, emp) => {
    const key = `${emp.gender || 'unknown'}_${emp.ethnicity || 'unknown'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const simpsonIndex = 1 - (Object.values(groups) as number[]).reduce((sum: number, count: number) => {
    return sum + Math.pow(count / total, 2);
  }, 0);
  
  return simpsonIndex * 100;
}

// Classify performance based on diversity metrics
function classifyPerformance(
  womenLeadershipPercentage: number,
  pcdPercentage: number,
  quotaCompliant: boolean
): 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' {
  // Critical: Non-compliant with quota law OR <15% women in leadership
  if (!quotaCompliant || womenLeadershipPercentage < 15) {
    return 'Crítico';
  }
  
  // Attention: <25% women in leadership OR <2% PCD
  if (womenLeadershipPercentage < 25 || pcdPercentage < 2) {
    return 'Atenção';
  }
  
  // Good: 25-35% women in leadership AND 2-4% PCD
  if (womenLeadershipPercentage < 35 || pcdPercentage < 4) {
    return 'Bom';
  }
  
  // Excellent: ≥35% women in leadership AND ≥4% PCD
  return 'Excelente';
}

export async function calculateDiversityByLevelMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<DiversityByLevelResult> {
  // Fetch employees with position data
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select(`
      id,
      full_name,
      gender,
      ethnicity,
      is_pcd,
      pcd_type,
      department,
      salary,
      status,
      position_id
    `)
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  if (employeesError) throw employeesError;
  if (!employees || employees.length === 0) {
    throw new Error('No active employees found');
  }

  // Fetch positions separately to avoid type issues
  const { data: positions } = await supabase
    .from('positions')
    .select('id, title, level');

  const positionsMap = new Map(
    positions?.map(p => [p.id, p]) || []
  );

  const totalEmployees = employees.length;

  // Add hierarchy level to each employee
  const employeesWithLevel = employees.map(emp => {
    const position = emp.position_id ? positionsMap.get(emp.position_id) : null;
    const positionTitle = position?.title || '';
    const hierarchyInfo = detectHierarchyLevel(positionTitle);
    
    return {
      ...emp,
      hierarchy_level: hierarchyInfo.level,
      hierarchy_order: hierarchyInfo.order
    };
  });

  // Calculate totals
  const totalWomen = employeesWithLevel.filter(e => e.gender === 'Feminino').length;
  const totalPcd = employeesWithLevel.filter(e => e.is_pcd === true).length;
  const totalMinorities = employeesWithLevel.filter(e => 
    ['Preto', 'Pardo', 'Amarelo', 'Indígena'].includes(e.ethnicity || '')
  ).length;

  const womenPercentage = (totalWomen / totalEmployees) * 100;
  const pcdPercentage = (totalPcd / totalEmployees) * 100;
  const minoritiesPercentage = (totalMinorities / totalEmployees) * 100;

  // Group by hierarchy level
  const byLevel: Record<string, any[]> = {};
  employeesWithLevel.forEach(emp => {
    const level = emp.hierarchy_level;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(emp);
  });

  // Calculate breakdown by hierarchy level
  const byHierarchyLevel: HierarchyLevelBreakdown[] = Object.entries(byLevel)
    .map(([level, levelEmployees]) => {
      const total = levelEmployees.length;
      const women = levelEmployees.filter(e => e.gender === 'Feminino').length;
      const men = levelEmployees.filter(e => e.gender === 'Masculino').length;
      const otherGender = total - women - men;
      const pcd = levelEmployees.filter(e => e.is_pcd === true).length;
      
      const white = levelEmployees.filter(e => e.ethnicity === 'Branco').length;
      const black = levelEmployees.filter(e => e.ethnicity === 'Preto').length;
      const brown = levelEmployees.filter(e => e.ethnicity === 'Pardo').length;
      const asian = levelEmployees.filter(e => e.ethnicity === 'Amarelo').length;
      const indigenous = levelEmployees.filter(e => e.ethnicity === 'Indígena').length;
      const notDeclared = levelEmployees.filter(e => !e.ethnicity || e.ethnicity === 'Não declarado').length;
      
      const womenMinorities = levelEmployees.filter(e => 
        e.gender === 'Feminino' && ['Preto', 'Pardo', 'Amarelo', 'Indígena'].includes(e.ethnicity || '')
      ).length;

      return {
        level,
        level_order: HIERARCHY_LEVELS[level as keyof typeof HIERARCHY_LEVELS]?.order || 5,
        total_employees: total,
        women_count: women,
        women_percentage: (women / total) * 100,
        men_count: men,
        men_percentage: (men / total) * 100,
        other_gender_count: otherGender,
        other_gender_percentage: (otherGender / total) * 100,
        pcd_count: pcd,
        pcd_percentage: (pcd / total) * 100,
        white_count: white,
        white_percentage: (white / total) * 100,
        black_count: black,
        black_percentage: (black / total) * 100,
        brown_count: brown,
        brown_percentage: (brown / total) * 100,
        asian_count: asian,
        asian_percentage: (asian / total) * 100,
        indigenous_count: indigenous,
        indigenous_percentage: (indigenous / total) * 100,
        not_declared_count: notDeclared,
        not_declared_percentage: (notDeclared / total) * 100,
        women_minorities_count: womenMinorities,
        women_minorities_percentage: (womenMinorities / total) * 100
      };
    })
    .sort((a, b) => a.level_order - b.level_order);

  // Pipeline analysis
  const operationalLevel = byHierarchyLevel.find(l => l.level === 'Operacional');
  const leadershipLevels = byHierarchyLevel.filter(l => ['C-Level', 'Diretoria'].includes(l.level));
  
  const leadershipWomenAvg = leadershipLevels.length > 0
    ? leadershipLevels.reduce((sum, l) => sum + l.women_percentage, 0) / leadershipLevels.length
    : 0;
  const leadershipPcdAvg = leadershipLevels.length > 0
    ? leadershipLevels.reduce((sum, l) => sum + l.pcd_percentage, 0) / leadershipLevels.length
    : 0;
  const leadershipMinoritiesAvg = leadershipLevels.length > 0
    ? leadershipLevels.reduce((sum, l) => sum + (l.black_percentage + l.brown_percentage + l.asian_percentage + l.indigenous_percentage), 0) / leadershipLevels.length
    : 0;

  const baseWomen = operationalLevel?.women_percentage || 0;
  const basePcd = operationalLevel?.pcd_percentage || 0;
  const baseMinorities = operationalLevel 
    ? operationalLevel.black_percentage + operationalLevel.brown_percentage + operationalLevel.asian_percentage + operationalLevel.indigenous_percentage
    : 0;

  const pipelineAnalysis: PipelineAnalysis = {
    leadership_diversity_gap: baseWomen - leadershipWomenAvg,
    gender_gap_top_vs_base: baseWomen - leadershipWomenAvg,
    pcd_gap_top_vs_base: basePcd - leadershipPcdAvg,
    ethnicity_gap_top_vs_base: baseMinorities - leadershipMinoritiesAvg,
    funnel: byHierarchyLevel.map(l => ({
      level: l.level,
      women_percentage: l.women_percentage,
      pcd_percentage: l.pcd_percentage,
      minorities_percentage: l.black_percentage + l.brown_percentage + l.asian_percentage + l.indigenous_percentage
    }))
  };

  // Pay equity (GRI 405-2)
  const womenEmployees = employeesWithLevel.filter(e => e.gender === 'Feminino' && e.salary);
  const menEmployees = employeesWithLevel.filter(e => e.gender === 'Masculino' && e.salary);
  
  const avgSalaryWomen = womenEmployees.length > 0
    ? womenEmployees.reduce((sum, e) => sum + (e.salary || 0), 0) / womenEmployees.length
    : 0;
  const avgSalaryMen = menEmployees.length > 0
    ? menEmployees.reduce((sum, e) => sum + (e.salary || 0), 0) / menEmployees.length
    : 0;
  
  const payGapPercentage = avgSalaryMen > 0
    ? ((avgSalaryMen - avgSalaryWomen) / avgSalaryMen) * 100
    : 0;

  const payEquityPreview: PayEquityPreview = {
    avg_salary_women: avgSalaryWomen,
    avg_salary_men: avgSalaryMen,
    pay_gap_percentage: payGapPercentage,
    has_significant_gap: payGapPercentage > 10
  };

  // Comparison with previous period (fetch last calculation)
  const previousEndDate = new Date(startDate);
  previousEndDate.setMonth(previousEndDate.getMonth() - 12);
  
  const { data: previousData } = await supabase
    .from('gri_social_data_collection')
    .select('diversity_women_percentage, diversity_pcd_percentage')
    .eq('company_id', companyId)
    .lte('period_end', previousEndDate.toISOString())
    .order('period_end', { ascending: false })
    .limit(1)
    .single();

  const comparison = {
    previous_women_percentage: previousData?.diversity_women_percentage || 0,
    change_women_percentage: womenPercentage - (previousData?.diversity_women_percentage || 0),
    previous_pcd_percentage: previousData?.diversity_pcd_percentage || 0,
    change_pcd_percentage: pcdPercentage - (previousData?.diversity_pcd_percentage || 0),
    is_improving: (womenPercentage - (previousData?.diversity_women_percentage || 0)) > 0
  };

  // Diversity by department
  const byDepartment: Record<string, any[]> = {};
  employeesWithLevel.forEach(emp => {
    const dept = emp.department || 'Não especificado';
    if (!byDepartment[dept]) byDepartment[dept] = [];
    byDepartment[dept].push(emp);
  });

  const departmentScores: DepartmentDiversity[] = Object.entries(byDepartment)
    .map(([dept, deptEmployees]) => {
      const total = deptEmployees.length;
      const women = deptEmployees.filter(e => e.gender === 'Feminino').length;
      const pcd = deptEmployees.filter(e => e.is_pcd === true).length;
      const minorities = deptEmployees.filter(e => 
        ['Preto', 'Pardo', 'Amarelo', 'Indígena'].includes(e.ethnicity || '')
      ).length;

      return {
        department: dept,
        diversity_score: calculateDiversityScore(deptEmployees),
        women_percentage: (women / total) * 100,
        pcd_percentage: (pcd / total) * 100,
        minorities_percentage: (minorities / total) * 100
      };
    })
    .sort((a, b) => b.diversity_score - a.diversity_score);

  const top_5_diverse_departments = departmentScores.slice(0, 5);
  const bottom_5_diverse_departments = departmentScores.slice(-5).reverse();

  // Quota law compliance (Lei 8.213/91)
  const requiredPcdPercentage = calculateQuotaRequirement(totalEmployees);
  const currentPcdPercentage = pcdPercentage / 100;
  const isQuotaCompliant = currentPcdPercentage >= requiredPcdPercentage;
  const missingPcdHires = isQuotaCompliant 
    ? 0 
    : Math.ceil((requiredPcdPercentage * totalEmployees) - totalPcd);

  const quotaLawCompliance: QuotaLawCompliance = {
    required_pcd_percentage: requiredPcdPercentage,
    current_pcd_percentage: pcdPercentage,
    is_compliant: isQuotaCompliant,
    missing_pcd_hires: missingPcdHires
  };

  // GRI 405-1 compliance check
  const employeesWithGender = employeesWithLevel.filter(e => e.gender).length;
  const employeesWithEthnicity = employeesWithLevel.filter(e => e.ethnicity && e.ethnicity !== 'Não declarado').length;
  const dataCompletenessGender = (employeesWithGender / totalEmployees) * 100;
  const dataCompletenessEthnicity = (employeesWithEthnicity / totalEmployees) * 100;

  const missingData: string[] = [];
  const recommendations: string[] = [];

  if (dataCompletenessGender < 90) {
    missingData.push(`Dados de gênero incompletos (${dataCompletenessGender.toFixed(1)}%)`);
    recommendations.push('Preencher campo gender para todos os funcionários ativos');
  }
  if (dataCompletenessEthnicity < 90) {
    missingData.push(`Dados de etnia incompletos (${dataCompletenessEthnicity.toFixed(1)}%)`);
    recommendations.push('Solicitar autodeclaração de raça/cor para compliance GRI 405-1');
  }
  if (byHierarchyLevel.length < 3) {
    missingData.push('Estrutura hierárquica limitada');
    recommendations.push('Definir níveis hierárquicos claros na estrutura organizacional');
  }

  const breakdownComplete = dataCompletenessGender >= 90 && dataCompletenessEthnicity >= 90;

  const gri405Compliance: GRI405Compliance = {
    is_compliant: missingData.length === 0 && breakdownComplete,
    missing_data: missingData,
    recommendations: recommendations,
    breakdown_complete: breakdownComplete
  };

  // Performance classification
  const performanceClassification = classifyPerformance(
    leadershipWomenAvg,
    pcdPercentage,
    isQuotaCompliant
  );

  return {
    total_employees: totalEmployees,
    total_women: totalWomen,
    total_pcd: totalPcd,
    total_minorities_ethnicity: totalMinorities,
    women_percentage: womenPercentage,
    pcd_percentage: pcdPercentage,
    minorities_percentage: minoritiesPercentage,
    by_hierarchy_level: byHierarchyLevel,
    pipeline_analysis: pipelineAnalysis,
    pay_equity_preview: payEquityPreview,
    comparison,
    top_5_diverse_departments,
    bottom_5_diverse_departments,
    performance_classification: performanceClassification,
    gri_405_1_compliance: gri405Compliance,
    quota_law_compliance: quotaLawCompliance,
    calculation_date: new Date().toISOString()
  };
}
