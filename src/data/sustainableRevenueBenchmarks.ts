/**
 * Sectoral benchmarks for sustainable revenue percentage (GRI 201-1, 203-2)
 * Based on industry ESG reports and sustainability indices 2024
 */

export const SUSTAINABLE_REVENUE_BENCHMARKS: Record<string, {
  sector: string;
  low: number; // Minimum % of revenue from ESG products/services
  typical: number; // Average % in the sector
  high: number; // High performance %
  excellence: number; // Excellence threshold %
  source: string;
}> = {
  'Tecnologia': {
    sector: 'Tecnologia',
    low: 5,
    typical: 15,
    high: 30,
    excellence: 50,
    source: 'Tech ESG Report 2024'
  },
  'Energia': {
    sector: 'Energia',
    low: 10,
    typical: 25,
    high: 45,
    excellence: 70,
    source: 'Clean Energy Transition Index 2024'
  },
  'Manufatura': {
    sector: 'Manufatura',
    low: 5,
    typical: 12,
    high: 25,
    excellence: 40,
    source: 'Sustainable Manufacturing Report 2024'
  },
  'Varejo': {
    sector: 'Varejo',
    low: 3,
    typical: 10,
    high: 20,
    excellence: 35,
    source: 'Retail Sustainability Index 2024'
  },
  'Financeiro': {
    sector: 'Serviços Financeiros',
    low: 2,
    typical: 8,
    high: 15,
    excellence: 25,
    source: 'Green Finance Report 2024'
  },
  'Alimentos e Bebidas': {
    sector: 'Alimentos e Bebidas',
    low: 4,
    typical: 12,
    high: 25,
    excellence: 40,
    source: 'Sustainable Food Systems Report 2024'
  },
  'Químico': {
    sector: 'Químico',
    low: 6,
    typical: 15,
    high: 30,
    excellence: 45,
    source: 'Green Chemistry Index 2024'
  },
  'Construção': {
    sector: 'Construção',
    low: 5,
    typical: 13,
    high: 25,
    excellence: 40,
    source: 'Green Building Report 2024'
  },
  'Default': {
    sector: 'Geral',
    low: 3,
    typical: 10,
    high: 20,
    excellence: 35,
    source: 'GRI Global Standards 2024'
  }
};

/**
 * Get sector-specific benchmark for sustainable revenue
 */
export function getSectorRevenueBenchmark(sector: string | null | undefined) {
  if (!sector) return SUSTAINABLE_REVENUE_BENCHMARKS['Default'];
  
  const benchmark = SUSTAINABLE_REVENUE_BENCHMARKS[sector];
  return benchmark || SUSTAINABLE_REVENUE_BENCHMARKS['Default'];
}

/**
 * Classify sustainable revenue performance level
 */
export function classifySustainableRevenueLevel(
  revenuePercentage: number,
  benchmark: typeof SUSTAINABLE_REVENUE_BENCHMARKS['Default']
): 'Excelente' | 'Alto' | 'Adequado' | 'Atenção' | 'Crítico' {
  if (revenuePercentage >= benchmark.excellence) return 'Excelente';
  if (revenuePercentage >= benchmark.high) return 'Alto';
  if (revenuePercentage >= benchmark.typical) return 'Adequado';
  if (revenuePercentage >= benchmark.low) return 'Atenção';
  return 'Crítico';
}
