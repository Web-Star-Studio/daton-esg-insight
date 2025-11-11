export const TRAINING_HOURS_BENCHMARKS: Record<string, {
  sector: string;
  excellent: number;
  good: number;
  attention: number;
  critical: number;
  source: string;
}> = {
  'Tecnologia': {
    sector: 'Tecnologia',
    excellent: 60,
    good: 45,
    attention: 30,
    critical: 20,
    source: 'LinkedIn Workplace Learning Report 2024'
  },
  'Financeiro': {
    sector: 'Serviços Financeiros',
    excellent: 55,
    good: 40,
    attention: 25,
    critical: 15,
    source: 'Deloitte Financial Services Industry Report 2024'
  },
  'Saúde': {
    sector: 'Saúde',
    excellent: 70,
    good: 50,
    attention: 35,
    critical: 25,
    source: 'Healthcare Training Requirements 2024'
  },
  'Manufatura': {
    sector: 'Manufatura',
    excellent: 50,
    good: 35,
    attention: 20,
    critical: 10,
    source: 'Manufacturing Skills Gap Report 2024'
  },
  'Varejo': {
    sector: 'Varejo',
    excellent: 45,
    good: 30,
    attention: 18,
    critical: 10,
    source: 'Retail Industry Training Standards 2024'
  },
  'Default': {
    sector: 'Geral',
    excellent: 48,
    good: 40,
    attention: 24,
    critical: 15,
    source: 'OIT - Organização Internacional do Trabalho'
  }
};
