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
  legislation_references: LegislationReference[];
  /** @deprecated use legislation_references */
  legislation_reference?: string | null;
  /** @deprecated use legislation_references */
  legislation_reference_url?: string | null;
  
  // Lifecycle Perspective
  has_lifecycle_control: boolean;
  lifecycle_stages?: string[] | null;
  output_actions?: string | null;
  
  // Metadata
  responsible_user_id?: string | null;
  status: 'ativo' | 'inativo' | 'em_revisao';
  is_vigente: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

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
  legislation_references: LegislationReference[];
  has_lifecycle_control: boolean;
  lifecycle_stages: string[];
  output_actions: string;
  responsible_user_id?: string;
  notes: string;
  is_vigente: boolean;
}

export interface LegislationReference {
  reference: string;
  url: string | null;
}

/** Setor da empresa exibido no seletor de origem do fluxo de clonagem. */
export interface LAIASectorForClone {
  id: string;
  code: string;
  name: string;
  description: string | null;
  branch_id: string | null;
  branch_name: string | null;
  assessment_count: number;
}

/** Payload para criar um setor reaproveitando as avaliações de outro. */
export interface CloneSectorInput {
  branch_id?: string;
  code: string;
  name: string;
  description?: string;
  assessments: LAIAAssessmentFormData[];
}

export interface LegislationSuggestion {
  reference: string;
  url: string | null;
  summary: string;
}

/** Prepends https:// when missing so URLs from AI/import always render correctly. */
export function normalizeLegislationUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Converte um assessment persistido nos dados do formulário de edição/rascunho. */
export function mapAssessmentToFormData(
  a: LAIAAssessment,
  branchId: string
): LAIAAssessmentFormData {
  // Migrated rows always have legislation_references populated. Fallback to the
  // deprecated single-reference fields handles any record the backfill missed.
  let references: LegislationReference[] = Array.isArray(a.legislation_references)
    ? a.legislation_references
    : [];
  if (references.length === 0 && a.legislation_reference?.trim()) {
    references = [
      {
        reference: a.legislation_reference.trim(),
        url: a.legislation_reference_url?.trim()
          ? normalizeLegislationUrl(a.legislation_reference_url)
          : null,
      },
    ];
  }

  return {
    branch_id: a.branch_id || branchId,
    sector_id: a.sector_id || "",
    activity_operation: a.activity_operation,
    environmental_aspect: a.environmental_aspect,
    environmental_impact: a.environmental_impact,
    temporality: a.temporality,
    operational_situation: a.operational_situation,
    incidence: a.incidence,
    impact_class: a.impact_class,
    scope: a.scope,
    severity: a.severity,
    frequency_probability: a.frequency_probability,
    has_legal_requirements: a.has_legal_requirements,
    has_stakeholder_demand: a.has_stakeholder_demand,
    has_strategic_options: a.has_strategic_options,
    control_types: a.control_types || [],
    existing_controls: a.existing_controls || "",
    legislation_references: references,
    has_lifecycle_control: a.has_lifecycle_control,
    lifecycle_stages: a.lifecycle_stages || [],
    output_actions: a.output_actions || "",
    notes: a.notes || "",
    is_vigente: a.is_vigente ?? true,
  };
}

export interface LAIADashboardStats {
  total: number;
  significativos: number;
  nao_significativos: number;
  criticos: number;
  moderados: number;
  despreziveis: number;
  by_sector: { sector_name: string; count: number }[];
  by_temporality: { name: string; value: number }[];
  by_operational_situation: { name: string; value: number }[];
  by_incidence: { name: string; value: number }[];
  by_impact_class: { name: string; value: number }[];
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
