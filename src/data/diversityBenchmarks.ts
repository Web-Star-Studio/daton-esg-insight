/**
 * Benchmarks setoriais de diversidade
 * Baseado em estudos de mercado, relatórios ESG e metas globais
 */

export interface DiversityBenchmark {
  sector: string;
  
  // Women in leadership (C-Level + Board)
  women_leadership_excellent: number;
  women_leadership_good: number;
  women_leadership_attention: number;
  
  // PCD total workforce
  pcd_excellent: number;
  pcd_good: number;
  pcd_legal_minimum: number; // Brazil Lei 8.213/91
  
  // Ethnic minorities
  minorities_excellent: number;
  minorities_good: number;
  minorities_attention: number;
  
  source: string;
}

export const DIVERSITY_BENCHMARKS: Record<string, DiversityBenchmark> = {
  'Tecnologia': {
    sector: 'Tecnologia',
    women_leadership_excellent: 40,
    women_leadership_good: 30,
    women_leadership_attention: 20,
    pcd_excellent: 5,
    pcd_good: 3,
    pcd_legal_minimum: 2,
    minorities_excellent: 35,
    minorities_good: 25,
    minorities_attention: 15,
    source: 'Tech Diversity Report 2024 (McKinsey, Deloitte)'
  },
  'Financeiro': {
    sector: 'Serviços Financeiros',
    women_leadership_excellent: 35,
    women_leadership_good: 25,
    women_leadership_attention: 15,
    pcd_excellent: 4,
    pcd_good: 2.5,
    pcd_legal_minimum: 2,
    minorities_excellent: 30,
    minorities_good: 20,
    minorities_attention: 10,
    source: 'Financial Services Diversity Index 2024 (BCG)'
  },
  'Saúde': {
    sector: 'Saúde',
    women_leadership_excellent: 50,
    women_leadership_good: 40,
    women_leadership_attention: 30,
    pcd_excellent: 6,
    pcd_good: 4,
    pcd_legal_minimum: 2,
    minorities_excellent: 40,
    minorities_good: 30,
    minorities_attention: 20,
    source: 'Healthcare Diversity Report 2024 (WHO)'
  },
  'Manufatura': {
    sector: 'Manufatura',
    women_leadership_excellent: 30,
    women_leadership_good: 20,
    women_leadership_attention: 12,
    pcd_excellent: 5,
    pcd_good: 3,
    pcd_legal_minimum: 2,
    minorities_excellent: 30,
    minorities_good: 20,
    minorities_attention: 12,
    source: 'Manufacturing Diversity Standards 2024'
  },
  'Varejo': {
    sector: 'Varejo',
    women_leadership_excellent: 45,
    women_leadership_good: 35,
    women_leadership_attention: 25,
    pcd_excellent: 5,
    pcd_good: 3,
    pcd_legal_minimum: 2,
    minorities_excellent: 40,
    minorities_good: 30,
    minorities_attention: 20,
    source: 'Retail Industry Diversity Report 2024'
  },
  'Educação': {
    sector: 'Educação',
    women_leadership_excellent: 55,
    women_leadership_good: 45,
    women_leadership_attention: 35,
    pcd_excellent: 6,
    pcd_good: 4,
    pcd_legal_minimum: 2,
    minorities_excellent: 45,
    minorities_good: 35,
    minorities_attention: 25,
    source: 'Education Sector Diversity Standards 2024'
  },
  'Energia': {
    sector: 'Energia',
    women_leadership_excellent: 30,
    women_leadership_good: 22,
    women_leadership_attention: 15,
    pcd_excellent: 4,
    pcd_good: 2.5,
    pcd_legal_minimum: 2,
    minorities_excellent: 28,
    minorities_good: 18,
    minorities_attention: 10,
    source: 'Energy Sector Diversity Report 2024'
  },
  'Default': {
    sector: 'Geral',
    women_leadership_excellent: 40,
    women_leadership_good: 30,
    women_leadership_attention: 20,
    pcd_excellent: 5,
    pcd_good: 3,
    pcd_legal_minimum: 2,
    minorities_excellent: 35,
    minorities_good: 25,
    minorities_attention: 15,
    source: 'Global Diversity Standards 2024 (B3, WEF, ONU)'
  }
};

/**
 * Metas ESG globais para 2030
 * Baseado em: ONU ODS 5 e 8, WEF Global Gender Gap Report, B3 ISE
 */
export const ESG_2030_TARGETS = {
  women_leadership: 40,        // Mínimo 40% mulheres em cargos de liderança
  women_board: 30,             // Mínimo 30% mulheres em conselhos
  pcd_workforce: 5,            // Mínimo 5% PCD no quadro total
  pay_gap_max: 5,              // Gap salarial máximo de 5%
  minorities_leadership: 30,   // Mínimo 30% minorias étnicas em liderança
  promotion_parity: 1.0,       // Paridade em promoções (ratio 1:1)
};

/**
 * Lei de Cotas - Lei 8.213/91 (Brasil)
 * Percentual mínimo de PCD por tamanho de empresa
 */
export function getQuotaLawRequirement(totalEmployees: number): {
  percentage: number;
  description: string;
  legal_reference: string;
} {
  if (totalEmployees >= 1001) {
    return {
      percentage: 0.05,
      description: '5% de vagas para PCD',
      legal_reference: 'Lei 8.213/91 Art. 93 - Empresas com 1001+ funcionários'
    };
  }
  if (totalEmployees >= 501) {
    return {
      percentage: 0.04,
      description: '4% de vagas para PCD',
      legal_reference: 'Lei 8.213/91 Art. 93 - Empresas com 501-1000 funcionários'
    };
  }
  if (totalEmployees >= 201) {
    return {
      percentage: 0.03,
      description: '3% de vagas para PCD',
      legal_reference: 'Lei 8.213/91 Art. 93 - Empresas com 201-500 funcionários'
    };
  }
  if (totalEmployees >= 100) {
    return {
      percentage: 0.02,
      description: '2% de vagas para PCD',
      legal_reference: 'Lei 8.213/91 Art. 93 - Empresas com 100-200 funcionários'
    };
  }
  return {
    percentage: 0,
    description: 'Não se aplica',
    legal_reference: 'Lei 8.213/91 Art. 93 - Empresas com menos de 100 funcionários'
  };
}

/**
 * Get benchmark for specific sector
 */
export function getSectorBenchmark(sector: string): DiversityBenchmark {
  return DIVERSITY_BENCHMARKS[sector] || DIVERSITY_BENCHMARKS['Default'];
}
