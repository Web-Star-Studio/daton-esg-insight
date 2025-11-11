/**
 * Benchmarks setoriais para investimentos sustentáveis
 * Baseado em pesquisas ESG e GRI Standards 2024
 */

export const SUSTAINABLE_INVESTMENT_BENCHMARKS: Record<string, {
  sector: string;
  investment_percentage_revenue_low: number;
  investment_percentage_revenue_typical: number;
  investment_percentage_revenue_high: number;
  capex_opex_ratio: number; // Razão CAPEX/OPEX típica
  source: string;
}> = {
  'Tecnologia': {
    sector: 'Tecnologia',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.5,
    investment_percentage_revenue_high: 3.0,
    capex_opex_ratio: 0.3, // 30% CAPEX, 70% OPEX
    source: 'Pesquisa Setorial ESG Tech 2024'
  },
  'Manufatura': {
    sector: 'Manufatura',
    investment_percentage_revenue_low: 1.0,
    investment_percentage_revenue_typical: 2.5,
    investment_percentage_revenue_high: 5.0,
    capex_opex_ratio: 0.6, // 60% CAPEX, 40% OPEX
    source: 'Índice ESG Manufatura 2024'
  },
  'Indústria': {
    sector: 'Indústria',
    investment_percentage_revenue_low: 1.0,
    investment_percentage_revenue_typical: 2.5,
    investment_percentage_revenue_high: 5.0,
    capex_opex_ratio: 0.6, // 60% CAPEX, 40% OPEX
    source: 'Índice ESG Industrial 2024'
  },
  'Financeiro': {
    sector: 'Serviços Financeiros',
    investment_percentage_revenue_low: 0.3,
    investment_percentage_revenue_typical: 1.0,
    investment_percentage_revenue_high: 2.0,
    capex_opex_ratio: 0.2, // 20% CAPEX, 80% OPEX
    source: 'GRI Financial Services Report 2024'
  },
  'Varejo': {
    sector: 'Varejo',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.5,
    investment_percentage_revenue_high: 3.5,
    capex_opex_ratio: 0.4, // 40% CAPEX, 60% OPEX
    source: 'Relatório Sustentabilidade Varejo 2024'
  },
  'Energia': {
    sector: 'Energia',
    investment_percentage_revenue_low: 2.0,
    investment_percentage_revenue_typical: 4.0,
    investment_percentage_revenue_high: 8.0,
    capex_opex_ratio: 0.7, // 70% CAPEX, 30% OPEX
    source: 'Energy Sector ESG Report 2024'
  },
  'Saúde': {
    sector: 'Saúde',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.2,
    investment_percentage_revenue_high: 2.5,
    capex_opex_ratio: 0.4, // 40% CAPEX, 60% OPEX
    source: 'Healthcare ESG Standards 2024'
  },
  'Educação': {
    sector: 'Educação',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.5,
    investment_percentage_revenue_high: 3.0,
    capex_opex_ratio: 0.3, // 30% CAPEX, 70% OPEX
    source: 'Education Sector Sustainability 2024'
  },
  'Agricultura': {
    sector: 'Agricultura',
    investment_percentage_revenue_low: 1.0,
    investment_percentage_revenue_typical: 2.0,
    investment_percentage_revenue_high: 4.0,
    capex_opex_ratio: 0.5, // 50% CAPEX, 50% OPEX
    source: 'Agribusiness ESG Report 2024'
  },
  'Transporte': {
    sector: 'Transporte',
    investment_percentage_revenue_low: 1.5,
    investment_percentage_revenue_typical: 3.0,
    investment_percentage_revenue_high: 6.0,
    capex_opex_ratio: 0.6, // 60% CAPEX, 40% OPEX
    source: 'Transport Sector Sustainability 2024'
  },
  'Construção': {
    sector: 'Construção',
    investment_percentage_revenue_low: 1.0,
    investment_percentage_revenue_typical: 2.0,
    investment_percentage_revenue_high: 4.5,
    capex_opex_ratio: 0.7, // 70% CAPEX, 30% OPEX
    source: 'Construction Industry ESG 2024'
  },
  'Serviços': {
    sector: 'Serviços',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.2,
    investment_percentage_revenue_high: 2.5,
    capex_opex_ratio: 0.3, // 30% CAPEX, 70% OPEX
    source: 'Service Industry ESG Standards 2024'
  },
  'Default': {
    sector: 'Geral',
    investment_percentage_revenue_low: 0.5,
    investment_percentage_revenue_typical: 1.5,
    investment_percentage_revenue_high: 3.0,
    capex_opex_ratio: 0.5, // 50% CAPEX, 50% OPEX
    source: 'GRI Standards 2024 (Global Average)'
  }
};

/**
 * Obtém o benchmark para um setor específico
 */
export function getSectorBenchmark(sector: string | null | undefined) {
  if (!sector) return SUSTAINABLE_INVESTMENT_BENCHMARKS['Default'];
  
  // Tentar match exato
  if (SUSTAINABLE_INVESTMENT_BENCHMARKS[sector]) {
    return SUSTAINABLE_INVESTMENT_BENCHMARKS[sector];
  }
  
  // Tentar match parcial (case-insensitive)
  const sectorLower = sector.toLowerCase();
  const matchedKey = Object.keys(SUSTAINABLE_INVESTMENT_BENCHMARKS).find(key =>
    key.toLowerCase().includes(sectorLower) || sectorLower.includes(key.toLowerCase())
  );
  
  if (matchedKey) {
    return SUSTAINABLE_INVESTMENT_BENCHMARKS[matchedKey];
  }
  
  return SUSTAINABLE_INVESTMENT_BENCHMARKS['Default'];
}

/**
 * Classifica o nível de investimento com base nos benchmarks
 */
export function classifyInvestmentLevel(
  investmentPercentage: number,
  benchmark: typeof SUSTAINABLE_INVESTMENT_BENCHMARKS['Default']
): 'Excelente' | 'Bom' | 'Adequado' | 'Atenção' | 'Crítico' {
  if (investmentPercentage >= benchmark.investment_percentage_revenue_high) {
    return 'Excelente';
  }
  if (investmentPercentage >= benchmark.investment_percentage_revenue_typical) {
    return 'Bom';
  }
  if (investmentPercentage >= benchmark.investment_percentage_revenue_low) {
    return 'Adequado';
  }
  if (investmentPercentage >= benchmark.investment_percentage_revenue_low * 0.5) {
    return 'Atenção';
  }
  return 'Crítico';
}
