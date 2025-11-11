export const WHISTLEBLOWER_BENCHMARKS: Record<string, {
  sector: string;
  
  // Denúncias por 100 funcionários/ano
  reports_per_100_employees_low: number;
  reports_per_100_employees_typical: number;
  reports_per_100_employees_high: number;
  
  // Tempo de resolução (dias)
  typical_resolution_time_days: number;
  excellent_resolution_time_days: number;
  attention_resolution_time_days: number;
  
  // Taxa de resolução (%)
  typical_resolution_rate: number;
  excellent_resolution_rate: number;
  minimum_resolution_rate: number;
  
  source: string;
}> = {
  'Tecnologia': {
    sector: 'Tecnologia',
    reports_per_100_employees_low: 0.5,
    reports_per_100_employees_typical: 1.5,
    reports_per_100_employees_high: 3.0,
    typical_resolution_time_days: 45,
    excellent_resolution_time_days: 30,
    attention_resolution_time_days: 60,
    typical_resolution_rate: 85,
    excellent_resolution_rate: 90,
    minimum_resolution_rate: 70,
    source: 'Tech Ethics Report 2024'
  },
  'Financeiro': {
    sector: 'Serviços Financeiros',
    reports_per_100_employees_low: 1.0,
    reports_per_100_employees_typical: 2.5,
    reports_per_100_employees_high: 5.0,
    typical_resolution_time_days: 40,
    excellent_resolution_time_days: 25,
    attention_resolution_time_days: 55,
    typical_resolution_rate: 88,
    excellent_resolution_rate: 93,
    minimum_resolution_rate: 75,
    source: 'Financial Compliance Standards 2024'
  },
  'Manufatura': {
    sector: 'Manufatura',
    reports_per_100_employees_low: 1.5,
    reports_per_100_employees_typical: 3.0,
    reports_per_100_employees_high: 6.0,
    typical_resolution_time_days: 50,
    excellent_resolution_time_days: 35,
    attention_resolution_time_days: 70,
    typical_resolution_rate: 80,
    excellent_resolution_rate: 88,
    minimum_resolution_rate: 68,
    source: 'Manufacturing Ethics Index 2024'
  },
  'Varejo': {
    sector: 'Varejo',
    reports_per_100_employees_low: 2.0,
    reports_per_100_employees_typical: 4.0,
    reports_per_100_employees_high: 8.0,
    typical_resolution_time_days: 55,
    excellent_resolution_time_days: 40,
    attention_resolution_time_days: 75,
    typical_resolution_rate: 78,
    excellent_resolution_rate: 85,
    minimum_resolution_rate: 65,
    source: 'Retail Compliance Report 2024'
  },
  'Saúde': {
    sector: 'Saúde',
    reports_per_100_employees_low: 1.2,
    reports_per_100_employees_typical: 2.8,
    reports_per_100_employees_high: 5.5,
    typical_resolution_time_days: 42,
    excellent_resolution_time_days: 28,
    attention_resolution_time_days: 65,
    typical_resolution_rate: 83,
    excellent_resolution_rate: 91,
    minimum_resolution_rate: 72,
    source: 'Healthcare Ethics Report 2024'
  },
  'Default': {
    sector: 'Geral',
    reports_per_100_employees_low: 1.0,
    reports_per_100_employees_typical: 2.5,
    reports_per_100_employees_high: 5.0,
    typical_resolution_time_days: 45,
    excellent_resolution_time_days: 30,
    attention_resolution_time_days: 60,
    typical_resolution_rate: 82,
    excellent_resolution_rate: 90,
    minimum_resolution_rate: 70,
    source: 'Global Ethics Standards 2024 (ISO 37001, GRI)'
  }
};

// Categorias típicas de denúncias (ISO 37001, OCDE)
export const WHISTLEBLOWER_CATEGORIES = [
  'Assédio Moral',
  'Assédio Sexual',
  'Discriminação',
  'Corrupção',
  'Fraude',
  'Conflito de Interesses',
  'Uso Indevido de Recursos',
  'Violação de Normas de Segurança',
  'Violação de Privacidade (LGPD)',
  'Meio Ambiente',
  'Outros'
];
