// Types for LAIA - Levantamento e Avaliação dos Aspectos e Impactos Ambientais

export interface LAIASector {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LAIAAssessment {
  id: string;
  company_id: string;
  branch_id?: string | null;
  
  // Identification
  sector_id?: string | null;
  aspect_code: string;
  activity_operation: string;
  environmental_aspect: string;
  environmental_impact: string;
  
  // Characterization
  temporality: 'passada' | 'atual' | 'futura';
  operational_situation: 'normal' | 'anormal' | 'emergencia';
  incidence: 'direto' | 'indireto';
  impact_class: 'benefico' | 'adverso';
  
  // Importance Verification
  scope: 'local' | 'regional' | 'global';
  severity: 'baixa' | 'media' | 'alta';
  consequence_score: number;
  frequency_probability: 'baixa' | 'media' | 'alta';
  freq_prob_score: number;
  total_score: number;
  category: 'desprezivel' | 'moderado' | 'critico';
  
  // Significance Assessment
  has_legal_requirements: boolean;
  has_stakeholder_demand: boolean;
  has_strategic_options: boolean;
  significance: 'significativo' | 'nao_significativo';
  
  // Additional Observations
  control_types?: string[] | null;
  existing_controls?: string | null;
  legislation_reference?: string | null;
  
  // Lifecycle Perspective
  has_lifecycle_control: boolean;
  lifecycle_stages?: string[] | null;
  output_actions?: string | null;
  
  // Metadata
  responsible_user_id?: string | null;
  status: 'ativo' | 'inativo' | 'em_revisao';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (joined)
  sector?: LAIASector | null;
  responsible_user?: { full_name: string } | null;
}

export interface LAIAAssessmentFormData {
  branch_id?: string;
  sector_id: string;
  activity_operation: string;
  environmental_aspect: string;
  environmental_impact: string;
  temporality: 'passada' | 'atual' | 'futura';
  operational_situation: 'normal' | 'anormal' | 'emergencia';
  incidence: 'direto' | 'indireto';
  impact_class: 'benefico' | 'adverso';
  scope: 'local' | 'regional' | 'global';
  severity: 'baixa' | 'media' | 'alta';
  frequency_probability: 'baixa' | 'media' | 'alta';
  has_legal_requirements: boolean;
  has_stakeholder_demand: boolean;
  has_strategic_options: boolean;
  control_types: string[];
  existing_controls: string;
  legislation_reference: string;
  has_lifecycle_control: boolean;
  lifecycle_stages: string[];
  output_actions: string;
  responsible_user_id?: string;
  notes: string;
}

export interface LAIADashboardStats {
  total: number;
  significativos: number;
  nao_significativos: number;
  criticos: number;
  moderados: number;
  despreziveis: number;
  by_sector: { sector_name: string; count: number }[];
}

// Constants
export const TEMPORALITY_OPTIONS = [
  { value: 'passada', label: 'Passada' },
  { value: 'atual', label: 'Atual' },
  { value: 'futura', label: 'Futura' },
] as const;

export const OPERATIONAL_SITUATION_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'anormal', label: 'Anormal' },
  { value: 'emergencia', label: 'Emergência' },
] as const;

export const INCIDENCE_OPTIONS = [
  { value: 'direto', label: 'Direto (Sob Controle)' },
  { value: 'indireto', label: 'Indireto (Sob Influência)' },
] as const;

export const IMPACT_CLASS_OPTIONS = [
  { value: 'benefico', label: 'Benéfico' },
  { value: 'adverso', label: 'Adverso' },
] as const;

export const SCOPE_OPTIONS = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'global', label: 'Global' },
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
] as const;

export const FREQUENCY_PROBABILITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa (< 1x/mês)' },
  { value: 'media', label: 'Média (> 1x/mês)' },
  { value: 'alta', label: 'Alta (Diária)' },
] as const;

export const CONTROL_TYPES = [
  { value: 'ST', label: 'Sistemas de Tratamento' },
  { value: 'CO', label: 'Controles Operacionais' },
  { value: 'MO', label: 'Monitoramento' },
  { value: 'PRE', label: 'Planos de Resposta a Emergências' },
  { value: 'NC', label: 'Nenhum Controle' },
] as const;

export const LIFECYCLE_STAGES = [
  'Extração/Origem da matéria-prima',
  'Aquisição/Fornecimento',
  'Armazenamento',
  'Logística/Transporte',
  'Operação/Processo Interno',
  'Manutenção',
  'Embalagem',
  'Distribuição',
  'Uso do produto/serviço',
  'Reuso/Reciclagem',
  'Descarte Final/Destinação',
  'Pós-Consumo/Logística Reversa',
] as const;

export const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'em_revisao', label: 'Em Revisão' },
] as const;

// Scoring Tables
export const CONSEQUENCE_SCORE_TABLE: Record<string, Record<string, number>> = {
  local: { baixa: 20, media: 40, alta: 60 },
  regional: { baixa: 25, media: 45, alta: 65 },
  global: { baixa: 30, media: 50, alta: 70 },
};

export const FREQUENCY_PROBABILITY_SCORE_TABLE: Record<string, number> = {
  baixa: 10,
  media: 20,
  alta: 30,
};

// Utility functions
export function calculateConsequenceScore(scope: string, severity: string): number {
  return CONSEQUENCE_SCORE_TABLE[scope]?.[severity] ?? 0;
}

export function calculateFreqProbScore(freqProb: string): number {
  return FREQUENCY_PROBABILITY_SCORE_TABLE[freqProb] ?? 0;
}

export function calculateCategory(totalScore: number): 'desprezivel' | 'moderado' | 'critico' {
  if (totalScore < 50) return 'desprezivel';
  if (totalScore <= 70) return 'moderado';
  return 'critico';
}

export function calculateSignificance(
  category: string,
  hasLegalRequirements: boolean,
  hasStakeholderDemand: boolean,
  hasStrategicOptions: boolean
): 'significativo' | 'nao_significativo' {
  if (category === 'desprezivel') return 'nao_significativo';
  if (category === 'critico') return 'significativo';
  if (hasLegalRequirements || hasStakeholderDemand || hasStrategicOptions) {
    return 'significativo';
  }
  return 'nao_significativo';
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'desprezivel': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'moderado': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'critico': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getSignificanceColor(significance: string): string {
  switch (significance) {
    case 'significativo': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'nao_significativo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-muted text-muted-foreground';
  }
}
