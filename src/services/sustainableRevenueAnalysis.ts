/**
 * Sustainable Revenue Analysis Service (GRI 201-1, 203-2)
 * Calculates revenue from sustainable products/services and ESG ROI
 */

import { supabase } from "@/integrations/supabase/client";
import { SUSTAINABLE_REVENUE_BENCHMARKS } from "@/data/sustainableRevenueBenchmarks";

export interface SustainableRevenueResult {
  // Total and Percentage
  sustainable_revenue_total: number;
  total_revenue: number;
  sustainable_revenue_percentage: number;
  
  // Breakdown by ESG Category
  by_category: {
    clean_energy: number;
    recycled_products: number;
    circular_economy: number;
    social_programs: number;
    sustainable_services: number;
    other_esg: number;
  };
  
  // Detailed breakdown (flexible)
  detailed_breakdown: Array<{
    category: string;
    subcategory?: string;
    revenue: number;
    percentage_of_esg_revenue: number;
    description?: string;
  }>;
  
  // Growth metrics
  previous_period_revenue: number;
  growth_percentage: number;
  is_increasing: boolean;
  
  // ESG ROI
  total_sustainable_investment: number;
  sustainable_revenue_roi: number; // (Revenue - Investment) / Investment × 100
  payback_period_years?: number;
  net_esg_value: number; // Revenue - Investment
  
  // Sectoral comparison
  sector_average_percentage: number;
  is_above_sector_average: boolean;
  sector_benchmark: {
    low: number;
    typical: number;
    high: number;
    excellence: number;
  };
  performance_level: 'Excelente' | 'Alto' | 'Adequado' | 'Atenção' | 'Crítico';
  
  // Estimated impacts
  environmental_benefits: {
    co2_avoided_tons?: number;
    energy_saved_mwh?: number;
    waste_diverted_tons?: number;
    water_saved_m3?: number;
  };
  
  social_benefits: {
    jobs_created?: number;
    communities_benefited?: number;
    people_trained?: number;
  };
  
  // Compliance
  gri_201_1_compliant: boolean;
  gri_203_2_compliant: boolean;
  missing_data: string[];
  
  calculation_date: string;
}

/**
 * Calculate sustainable revenue and ESG ROI
 */
export async function calculateSustainableRevenue(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<SustainableRevenueResult> {
  
  // 1. Fetch company revenue and sector
  const { data: company } = await supabase
    .from('companies')
    .select('annual_revenue, sector')
    .eq('id', companyId)
    .single();
  
  const totalRevenue = company?.annual_revenue || 0;
  const sector = company?.sector || 'Default';
  
  // 2. Fetch sustainable revenue data (manual input)
  const { data: economicData } = await supabase
    .from('gri_economic_data_collection')
    .select(`
      sustainable_revenue_total,
      revenue_clean_energy,
      revenue_recycled_products,
      revenue_circular_economy,
      revenue_social_programs,
      revenue_sustainable_services,
      revenue_other_esg,
      sustainable_revenue_breakdown,
      previous_period_sustainable_revenue
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const sustainableRevenue = economicData?.sustainable_revenue_total || 0;
  
  // 3. Calculate breakdown by category
  const byCategory = {
    clean_energy: economicData?.revenue_clean_energy || 0,
    recycled_products: economicData?.revenue_recycled_products || 0,
    circular_economy: economicData?.revenue_circular_economy || 0,
    social_programs: economicData?.revenue_social_programs || 0,
    sustainable_services: economicData?.revenue_sustainable_services || 0,
    other_esg: economicData?.revenue_other_esg || 0,
  };
  
  // 4. Fetch sustainable investments (for ROI calculation)
  const { data: investmentData } = await supabase
    .from('gri_economic_data_collection')
    .select('total_sustainable_investment')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const totalInvestment = investmentData?.total_sustainable_investment || 0;
  
  // 5. Calculate ESG ROI: (Revenue - Investment) / Investment × 100
  const netValue = sustainableRevenue - totalInvestment;
  const roi = totalInvestment > 0
    ? (netValue / totalInvestment) * 100
    : 0;
  
  const paybackYears = roi > 0 && netValue > 0
    ? totalInvestment / netValue
    : undefined;
  
  // 6. Growth vs previous period
  const previousRevenue = economicData?.previous_period_sustainable_revenue || 0;
  const growthPercentage = previousRevenue > 0
    ? ((sustainableRevenue - previousRevenue) / previousRevenue) * 100
    : 0;
  
  // 7. Sectoral benchmark
  const sectorBenchmark = SUSTAINABLE_REVENUE_BENCHMARKS[sector] || SUSTAINABLE_REVENUE_BENCHMARKS['Default'];
  const sectorAverage = sectorBenchmark.typical;
  const revenuePercentage = totalRevenue > 0 ? (sustainableRevenue / totalRevenue) * 100 : 0;
  const isAboveSectorAverage = revenuePercentage >= sectorAverage;
  
  // 8. Performance level
  let performanceLevel: 'Excelente' | 'Alto' | 'Adequado' | 'Atenção' | 'Crítico';
  if (revenuePercentage >= sectorBenchmark.excellence) performanceLevel = 'Excelente';
  else if (revenuePercentage >= sectorBenchmark.high) performanceLevel = 'Alto';
  else if (revenuePercentage >= sectorBenchmark.typical) performanceLevel = 'Adequado';
  else if (revenuePercentage >= sectorBenchmark.low) performanceLevel = 'Atenção';
  else performanceLevel = 'Crítico';
  
  // 9. GRI Compliance
  const gri_201_1_compliant = sustainableRevenue > 0;
  const gri_203_2_compliant = sustainableRevenue > 0 && totalRevenue > 0;
  
  const missingData: string[] = [];
  if (sustainableRevenue === 0) missingData.push('Receita sustentável não informada');
  if (totalRevenue === 0) missingData.push('Receita total da empresa não informada');
  if (Object.values(byCategory).every(v => v === 0)) {
    missingData.push('Breakdown por categoria ESG não informado');
  }
  
  // 10. Detailed breakdown
  const detailedBreakdown: Array<{
    category: string;
    revenue: number;
    percentage_of_esg_revenue: number;
  }> = [];
  
  if (sustainableRevenue > 0) {
    Object.entries(byCategory).forEach(([key, value]) => {
      if (value > 0) {
        const categoryNames: Record<string, string> = {
          clean_energy: 'Energia Limpa',
          recycled_products: 'Produtos Reciclados',
          circular_economy: 'Economia Circular',
          social_programs: 'Programas Sociais',
          sustainable_services: 'Serviços Sustentáveis',
          other_esg: 'Outros ESG'
        };
        
        detailedBreakdown.push({
          category: categoryNames[key],
          revenue: value,
          percentage_of_esg_revenue: (value / sustainableRevenue) * 100
        });
      }
    });
  }
  
  return {
    sustainable_revenue_total: sustainableRevenue,
    total_revenue: totalRevenue,
    sustainable_revenue_percentage: revenuePercentage,
    by_category: byCategory,
    detailed_breakdown: detailedBreakdown,
    previous_period_revenue: previousRevenue,
    growth_percentage: growthPercentage,
    is_increasing: growthPercentage > 0,
    total_sustainable_investment: totalInvestment,
    sustainable_revenue_roi: roi,
    payback_period_years: paybackYears,
    net_esg_value: netValue,
    sector_average_percentage: sectorAverage,
    is_above_sector_average: isAboveSectorAverage,
    sector_benchmark: {
      low: sectorBenchmark.low,
      typical: sectorBenchmark.typical,
      high: sectorBenchmark.high,
      excellence: sectorBenchmark.excellence
    },
    performance_level: performanceLevel,
    environmental_benefits: {},
    social_benefits: {},
    gri_201_1_compliant,
    gri_203_2_compliant,
    missing_data: missingData,
    calculation_date: new Date().toISOString()
  };
}
