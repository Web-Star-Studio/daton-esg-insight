/**
 * Shared GRI types and constants for type safety across the application
 */

// Valid GRI section keys - used across frontend and edge functions
export const GRI_SECTION_KEYS = {
  ORGANIZATIONAL_PROFILE: 'organizational_profile',
  STRATEGY: 'strategy',
  ETHICS_INTEGRITY: 'ethics_integrity',
  GOVERNANCE: 'governance',
  STAKEHOLDER_ENGAGEMENT: 'stakeholder_engagement',
  REPORTING_PRACTICE: 'reporting_practice',
  MATERIAL_TOPICS: 'material_topics',
  ECONOMIC_PERFORMANCE: 'economic_performance',
  ENVIRONMENTAL_PERFORMANCE: 'environmental_performance',
  SOCIAL_PERFORMANCE: 'social_performance',
} as const;

export type GRISectionKey = typeof GRI_SECTION_KEYS[keyof typeof GRI_SECTION_KEYS];

// Helper to validate section keys
export function isValidGRISectionKey(key: string): key is GRISectionKey {
  return Object.values(GRI_SECTION_KEYS).includes(key as GRISectionKey);
}

// Section metadata for display and ordering
export const GRI_SECTION_METADATA: Record<GRISectionKey, { title: string; order: number; description: string }> = {
  [GRI_SECTION_KEYS.ORGANIZATIONAL_PROFILE]: {
    title: 'Perfil Organizacional',
    order: 1,
    description: 'Informações básicas sobre a organização'
  },
  [GRI_SECTION_KEYS.STRATEGY]: {
    title: 'Estratégia',
    order: 2,
    description: 'Estratégia de sustentabilidade e visão de longo prazo'
  },
  [GRI_SECTION_KEYS.ETHICS_INTEGRITY]: {
    title: 'Ética e Integridade',
    order: 3,
    description: 'Valores, princípios e padrões de conduta'
  },
  [GRI_SECTION_KEYS.GOVERNANCE]: {
    title: 'Governança',
    order: 4,
    description: 'Estrutura de governança e tomada de decisões'
  },
  [GRI_SECTION_KEYS.STAKEHOLDER_ENGAGEMENT]: {
    title: 'Engajamento de Stakeholders',
    order: 5,
    description: 'Como a organização se relaciona com as partes interessadas'
  },
  [GRI_SECTION_KEYS.REPORTING_PRACTICE]: {
    title: 'Práticas de Reporte',
    order: 6,
    description: 'Processo e metodologia de elaboração do relatório'
  },
  [GRI_SECTION_KEYS.MATERIAL_TOPICS]: {
    title: 'Tópicos Materiais',
    order: 7,
    description: 'Análise de materialidade e temas prioritários'
  },
  [GRI_SECTION_KEYS.ECONOMIC_PERFORMANCE]: {
    title: 'Desempenho Econômico',
    order: 8,
    description: 'Indicadores econômicos e geração de valor'
  },
  [GRI_SECTION_KEYS.ENVIRONMENTAL_PERFORMANCE]: {
    title: 'Desempenho Ambiental',
    order: 9,
    description: 'Impactos ambientais e gestão de recursos naturais'
  },
  [GRI_SECTION_KEYS.SOCIAL_PERFORMANCE]: {
    title: 'Desempenho Social',
    order: 10,
    description: 'Práticas trabalhistas, direitos humanos e impacto social'
  },
};
