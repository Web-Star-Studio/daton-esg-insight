/**
 * Enums centralizados com allowlists para validação
 * 
 * IMPORTANTE: Todos os valores de status, tipos e categorias
 * devem ser definidos aqui e usados via normalizeEnum()
 */

// ============================================
// STATUS DE ENTIDADES
// ============================================

// Status de Não Conformidade
export const NC_STATUS = [
  'Aberta',
  'Em Análise',
  'Em Tratamento',
  'Aguardando Verificação',
  'Fechada',
  'Cancelada'
] as const;
export type NCStatus = typeof NC_STATUS[number];
export const NC_STATUS_DEFAULT: NCStatus = 'Aberta';

// Status de Licença Ambiental
export const LICENSE_STATUS = [
  'Ativa',
  'Vencida',
  'Em Renovação',
  'Suspensa',
  'Cancelada',
  'Em Análise'
] as const;
export type LicenseStatus = typeof LICENSE_STATUS[number];
export const LICENSE_STATUS_DEFAULT: LicenseStatus = 'Em Análise';

// Status de Tarefa
export const TASK_STATUS = [
  'Pendente',
  'Em Andamento',
  'Concluída',
  'Em Atraso',
  'Cancelada',
  'Aguardando'
] as const;
export type TaskStatus = typeof TASK_STATUS[number];
export const TASK_STATUS_DEFAULT: TaskStatus = 'Pendente';

// Status de Meta/Objetivo
export const GOAL_STATUS = [
  'Em Progresso',
  'Concluída',
  'Atrasada',
  'Cancelada',
  'Não Iniciada'
] as const;
export type GoalStatus = typeof GOAL_STATUS[number];
export const GOAL_STATUS_DEFAULT: GoalStatus = 'Não Iniciada';

// Status de Aprovação
export const APPROVAL_STATUS = [
  'pendente',
  'aprovado',
  'rejeitado',
  'em_revisao'
] as const;
export type ApprovalStatus = typeof APPROVAL_STATUS[number];
export const APPROVAL_STATUS_DEFAULT: ApprovalStatus = 'pendente';

// Status de Funcionário
export const EMPLOYEE_STATUS = [
  'Ativo',
  'Inativo',
  'Afastado',
  'Férias',
  'Desligado'
] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUS[number];
export const EMPLOYEE_STATUS_DEFAULT: EmployeeStatus = 'Ativo';

// Status de Fornecedor
export const SUPPLIER_STATUS = [
  'Ativo',
  'Inativo',
  'Em Avaliação',
  'Bloqueado',
  'Pendente'
] as const;
export type SupplierStatus = typeof SUPPLIER_STATUS[number];
export const SUPPLIER_STATUS_DEFAULT: SupplierStatus = 'Pendente';

// Status de Documento
export const DOCUMENT_STATUS = [
  'Vigente',
  'Em Revisão',
  'Obsoleto',
  'Rascunho',
  'Aguardando Aprovação'
] as const;
export type DocumentStatus = typeof DOCUMENT_STATUS[number];
export const DOCUMENT_STATUS_DEFAULT: DocumentStatus = 'Rascunho';

// Status de Treinamento
export const TRAINING_STATUS = [
  'Planejado',
  'Em Andamento',
  'Concluído',
  'Cancelado'
] as const;
export type TrainingStatus = typeof TRAINING_STATUS[number];
export const TRAINING_STATUS_DEFAULT: TrainingStatus = 'Planejado';

// Status de Risco
export const RISK_STATUS = [
  'Ativo',
  'Mitigado',
  'Aceito',
  'Eliminado',
  'Em Análise'
] as const;
export type RiskStatus = typeof RISK_STATUS[number];
export const RISK_STATUS_DEFAULT: RiskStatus = 'Ativo';

// Status de Ação Corretiva/Plano
export const ACTION_STATUS = [
  'Planejada',
  'Em Execução',
  'Concluída',
  'Atrasada',
  'Cancelada'
] as const;
export type ActionStatus = typeof ACTION_STATUS[number];
export const ACTION_STATUS_DEFAULT: ActionStatus = 'Planejada';

// ============================================
// NÍVEIS E CATEGORIAS
// ============================================

// Níveis de Severidade
export const SEVERITY_LEVELS = [
  'Baixa',
  'Média',
  'Alta',
  'Crítica'
] as const;
export type Severity = typeof SEVERITY_LEVELS[number];
export const SEVERITY_DEFAULT: Severity = 'Média';

// Níveis de Prioridade
export const PRIORITY_LEVELS = [
  'Baixa',
  'Normal',
  'Alta',
  'Urgente'
] as const;
export type Priority = typeof PRIORITY_LEVELS[number];
export const PRIORITY_DEFAULT: Priority = 'Normal';

// Níveis de Risco
export const RISK_LEVELS = [
  'Muito Baixo',
  'Baixo',
  'Médio',
  'Alto',
  'Crítico'
] as const;
export type RiskLevel = typeof RISK_LEVELS[number];
export const RISK_LEVEL_DEFAULT: RiskLevel = 'Médio';

// Escopos de Emissões GHG
export const EMISSION_SCOPES = [1, 2, 3] as const;
export type EmissionScope = typeof EMISSION_SCOPES[number];
export const EMISSION_SCOPE_DEFAULT: EmissionScope = 1;

// ============================================
// DADOS PESSOAIS
// ============================================

// Gênero
export const GENDER_OPTIONS = [
  'Masculino',
  'Feminino',
  'Outro',
  'Prefiro não informar'
] as const;
export type Gender = typeof GENDER_OPTIONS[number];
export const GENDER_DEFAULT: Gender = 'Prefiro não informar';

// Estado Civil
export const MARITAL_STATUS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável'
] as const;
export type MaritalStatus = typeof MARITAL_STATUS[number];

// ============================================
// CATEGORIAS ESG
// ============================================

// Pilares ESG
export const ESG_PILLARS = [
  'Environmental',
  'Social',
  'Governance'
] as const;
export type ESGPillar = typeof ESG_PILLARS[number];

// Categorias de Emissão
export const EMISSION_CATEGORIES = [
  'Combustão Estacionária',
  'Combustão Móvel',
  'Processos Industriais',
  'Fugitivas',
  'Energia Elétrica',
  'Transporte',
  'Resíduos',
  'Viagens a Negócios',
  'Deslocamento de Funcionários',
  'Outros'
] as const;
export type EmissionCategory = typeof EMISSION_CATEGORIES[number];

// Tipos de Licença Ambiental
export const LICENSE_TYPES = [
  'LP',
  'LI',
  'LO',
  'LAU',
  'LAS',
  'Autorização',
  'Outorga',
  'Outro'
] as const;
export type LicenseType = typeof LICENSE_TYPES[number];
export const LICENSE_TYPE_DEFAULT: LicenseType = 'Outro';

// ============================================
// TIPOS DE AÇÃO/EVENTO
// ============================================

// Tipos de Ação de Auditoria
export const AUDIT_ACTION_TYPES = [
  'task_created',
  'task_updated',
  'task_completed',
  'task_deleted',
  'requirement_added',
  'requirement_updated',
  'bulk_update',
  'status_changed',
  'approval_requested',
  'approval_granted',
  'approval_rejected',
  'document_uploaded',
  'comment_added'
] as const;
export type AuditActionType = typeof AUDIT_ACTION_TYPES[number];

// ============================================
// FREQUÊNCIAS
// ============================================

export const FREQUENCY_OPTIONS = [
  'Diária',
  'Semanal',
  'Quinzenal',
  'Mensal',
  'Bimestral',
  'Trimestral',
  'Semestral',
  'Anual',
  'Sob Demanda'
] as const;
export type Frequency = typeof FREQUENCY_OPTIONS[number];
export const FREQUENCY_DEFAULT: Frequency = 'Mensal';

// ============================================
// CORES PARA GRÁFICOS (Determinísticas)
// ============================================

export const CHART_COLORS = {
  // Paleta primária
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  
  // ESG
  environmental: '#16a34a',
  social: '#2563eb',
  governance: '#9333ea',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Categorias de Emissão
  emissionCategories: {
    'Combustão Estacionária': '#2563eb',
    'Combustão Móvel': '#16a34a',
    'Processos Industriais': '#ea580c',
    'Fugitivas': '#9333ea',
    'Energia Elétrica': '#f59e0b',
    'Transporte': '#06b6d4',
    'Resíduos': '#84cc16',
    'Viagens a Negócios': '#ec4899',
    'Deslocamento de Funcionários': '#8b5cf6',
    'Outros': '#64748b'
  } as const,
  
  // Paleta sequencial para múltiplos itens
  sequential: [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#ef4444',
    '#9333ea',
    '#06b6d4',
    '#ec4899',
    '#84cc16',
    '#8b5cf6',
    '#64748b'
  ] as const
} as const;

/**
 * Obtém cor para categoria de emissão
 */
export function getEmissionCategoryColor(category: string): string {
  return CHART_COLORS.emissionCategories[category as keyof typeof CHART_COLORS.emissionCategories] 
    || CHART_COLORS.emissionCategories['Outros'];
}

/**
 * Obtém cor da paleta sequencial por índice
 */
export function getSequentialColor(index: number): string {
  return CHART_COLORS.sequential[index % CHART_COLORS.sequential.length];
}
