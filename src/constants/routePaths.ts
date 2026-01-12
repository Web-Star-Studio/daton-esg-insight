/**
 * Canonical Route Paths
 * Single source of truth for all route paths in the application
 */

export const ROUTE_PATHS = {
  // Public Routes
  PUBLIC: {
    LANDING: '/',
    AUTH: '/auth',
    CONTACT: '/contato',
    FEATURES: '/funcionalidades',
    DOCUMENTATION: '/documentacao',
    FAQ: '/faq',
  },

  // Protected Routes - Core
  CORE: {
    DASHBOARD: '/dashboard',
    ONBOARDING: '/onboarding',
    SETTINGS: '/configuracao',
    SYSTEM_STATUS: '/system-status',
  },

  // ESG Module
  ESG: {
    MANAGEMENT: '/gestao-esg',
    INVENTORY_GHG: '/inventario-gee',
    DASHBOARD_GHG: '/dashboard-ghg',
    EMISSIONS: '/inventario-gee', // Canonical
    WASTE: '/residuos',
    WASTE_DISPOSAL: '/residuos/registrar-destinacao',
    WASTE_REPORTS: '/residuos/relatorios',
    WASTE_SUPPLIERS: '/fornecedores-residuos',
    LICENSES: '/licenciamento',
    LICENSE_NEW: '/licenciamento/novo',
    LICENSE_DETAIL: (id: string) => `/licenciamento/${id}`,
    LICENSE_EDIT: (id: string) => `/licenciamento/${id}/editar`,
    LICENSE_MONITORING: '/licenciamento/monitoramento',
    LICENSE_PROCESS: '/licenciamento/processar',
    GOALS: '/metas',
    GOALS_NEW: '/metas/nova',
    CARBON_PROJECTS: '/projetos-carbono',
    CARBON_ACTIVITY: '/projetos-carbono/registrar-atividade',
    MATERIALITY: '/analise-materialidade',
    STAKEHOLDERS: '/gestao-stakeholders',
    SUPPLIERS: '/fornecedores',
    INDICATORS: '/indicadores-esg',
    SOCIAL: '/social-esg',
    GOVERNANCE: '/governanca-esg',
  },

  // Quality Module (SGQ)
  QUALITY: {
    DASHBOARD: '/quality-dashboard',
    STRATEGIC_PLANNING: '/planejamento-estrategico',
    PROCESS_MAPPING: '/mapeamento-processos',
    NON_CONFORMITIES: '/nao-conformidades',
    CORRECTIVE_ACTIONS: '/acoes-corretivas',
    DOCUMENT_CONTROL: '/controle-documentos',
    RISK_MANAGEMENT: '/gestao-riscos',
    SUPPLIER_EVALUATION: '/avaliacao-fornecedores',
    LAIA: '/laia',
  },

  // HR Module
  HR: {
    ORGANIZATIONAL_STRUCTURE: '/estrutura-organizacional',
    JOB_DESCRIPTIONS: '/descricao-cargos',
    EMPLOYEES: '/gestao-funcionarios',
    TRAINING: '/gestao-treinamentos',
    PERFORMANCE: '/gestao-desempenho',
    BENEFITS: '/beneficios-remuneracao',
    RECRUITMENT: '/recrutamento',
    SAFETY: '/seguranca-trabalho',
    TIME_ATTENDANCE: '/ponto-frequencia',
    CAREER_DEVELOPMENT: '/desenvolvimento-carreira',
    CUSTOMER_OMBUDSMAN: '/ouvidoria-clientes',
  },

  // Documents & Data
  DATA: {
    DOCUMENTS: '/documentos',
    DOCUMENTS_EXTRACTIONS: '/documentos?tab=extracoes',
    DOCUMENTS_RECONCILIATION: '/documentos?tab=reconciliacao',
    DATA_COLLECTION: '/coleta-dados',
    CUSTOM_FORMS: '/formularios-customizados',
    FORM_DASHBOARD: (formId: string) => `/formularios-customizados/${formId}/dashboard`,
    ASSETS: '/ativos',
    PERFORMANCE: '/desempenho',
    FACTOR_LIBRARY: '/biblioteca-fatores',
  },

  // Reports
  REPORTS: {
    INTEGRATED: '/relatorios-integrados', // Canonical
    SUSTAINABILITY: '/relatorios-integrados',
    GENERATOR: '/relatorios-integrados',
  },

  // Compliance & Audit
  COMPLIANCE: {
    COMPLIANCE: '/compliance',
    AUDIT: '/auditoria',
  },

  // Advanced Features
  ADVANCED: {
    AI_INSIGHTS: '/ia-insights',
    INTELLIGENCE_CENTER: '/intelligence-center',
    MARKETPLACE: '/marketplace',
    PRODUCTION_MONITORING: '/production-monitoring',
  },

  // System & Notifications
  SYSTEM: {
    NOTIFICATIONS: '/smart-notifications',
    ALERTS: '/intelligent-alerts',
    ADVANCED_REPORTS: '/advanced-reports',
  },

  // Configuration
  CONFIG: {
    ORGANIZATIONAL: '/configuracao-organizacional',
    USER_MANAGEMENT: '/gestao-usuarios',
  },

  // Financial Module
  FINANCIAL: {
    DASHBOARD: '/financeiro/dashboard',
    BUDGET: '/financeiro/orcamento',
    CASH_FLOW: '/financeiro/fluxo-caixa',
    COST_CENTERS: '/financeiro/centros-custo',
    REPORTS: '/financeiro/relatorios',
    PROFITABILITY: '/financeiro/rentabilidade',
    PAYABLES: '/financeiro/residuos/contas-pagar',
    RECEIVABLES: '/financeiro/residuos/contas-receber',
    CHART_OF_ACCOUNTS: '/financeiro/plano-contas',
    ACCOUNTING_ENTRIES: '/financeiro/lancamentos-contabeis',
  ACCOUNTS_PAYABLE_GENERAL: '/financeiro/contas-pagar',
  ACCOUNTS_RECEIVABLE_GENERAL: '/financeiro/contas-receber',
  FINANCIAL_APPROVALS: '/financeiro/aprovacoes',
  },
} as const;

/**
 * Legacy route redirects - map old paths to new canonical paths
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/emissoes': ROUTE_PATHS.ESG.INVENTORY_GHG,
  '/metas-sustentabilidade': ROUTE_PATHS.ESG.GOALS,
  '/relatorios': ROUTE_PATHS.REPORTS.INTEGRATED,
  '/relatorios-sustentabilidade': ROUTE_PATHS.REPORTS.INTEGRATED,
  '/gerador-relatorios': ROUTE_PATHS.REPORTS.INTEGRATED,
  '/extracoes-documentos': ROUTE_PATHS.DATA.DOCUMENTS_EXTRACTIONS,
  '/reconciliacao-documentos': ROUTE_PATHS.DATA.DOCUMENTS_RECONCILIATION,
  '/licenciamento/nova': ROUTE_PATHS.ESG.LICENSE_NEW,
  '/licenciamento/analise': ROUTE_PATHS.ESG.LICENSE_PROCESS,
} as const;

/**
 * Get the canonical path for a given route
 */
export function getCanonicalPath(path: string): string {
  return LEGACY_REDIRECTS[path] || path;
}

/**
 * Check if a path is a legacy path that should be redirected
 */
export function isLegacyPath(path: string): boolean {
  return path in LEGACY_REDIRECTS;
}