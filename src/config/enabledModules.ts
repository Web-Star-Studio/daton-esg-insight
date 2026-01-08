/**
 * Configuração centralizada de módulos habilitados/desabilitados
 * 
 * Esta configuração permite ocultar módulos do sistema sem deletar código.
 * Para reativar um módulo, basta mudar o valor para `true`.
 */

export const ENABLED_MODULES = {
  // ============================================
  // MÓDULOS DESABILITADOS TEMPORARIAMENTE
  // ============================================
  
  /** Módulo Financeiro completo */
  financial: false,
  
  /** Módulo Dados e Relatórios */
  dataReports: false,
  
  /** ESG Ambiental (categoria dentro do ESG) */
  esgEnvironmental: false,
  
  /** ESG Governança (categoria dentro do ESG) */
  esgGovernance: false,
  
  // ============================================
  // MÓDULOS ATIVOS
  // ============================================
  
  /** ESG Social (categoria dentro do ESG) */
  esgSocial: true,
  
  /** Módulo de Qualidade (SGQ) */
  quality: true,
  
  /** Módulo de Fornecedores */
  suppliers: true,
  
  /** Configurações do sistema */
  settings: true,
  
  /** Ajuda e suporte */
  help: true,
  
  /** Gestão ESG (painel principal) */
  esgManagement: true,
} as const;

export type ModuleKey = keyof typeof ENABLED_MODULES;

/**
 * Verifica se um módulo está habilitado
 */
export const isModuleEnabled = (moduleKey: ModuleKey): boolean => {
  return ENABLED_MODULES[moduleKey];
};

/**
 * IDs das seções do menu que devem ser filtradas
 */
export const DISABLED_SECTION_IDS = Object.entries(ENABLED_MODULES)
  .filter(([_, enabled]) => !enabled)
  .map(([key]) => {
    switch (key) {
      case 'financial': return 'financial';
      case 'dataReports': return 'data-reports';
      default: return null;
    }
  })
  .filter(Boolean) as string[];

/**
 * IDs das categorias ESG que devem ser filtradas
 */
export const DISABLED_ESG_CATEGORY_IDS = Object.entries(ENABLED_MODULES)
  .filter(([_, enabled]) => !enabled)
  .map(([key]) => {
    switch (key) {
      case 'esgEnvironmental': return 'environmental-category';
      case 'esgGovernance': return 'governance-category';
      default: return null;
    }
  })
  .filter(Boolean) as string[];

/**
 * Paths que devem ser redirecionados quando módulos estão desabilitados
 */
export const DISABLED_ROUTES: { pattern: RegExp; moduleKey: ModuleKey }[] = [
  // Financeiro
  { pattern: /^\/financeiro/, moduleKey: 'financial' },
  
  // Dados e Relatórios
  { pattern: /^\/coleta-dados/, moduleKey: 'dataReports' },
  { pattern: /^\/relatorios-integrados/, moduleKey: 'dataReports' },
  { pattern: /^\/sdg-dashboard/, moduleKey: 'dataReports' },
  { pattern: /^\/indicadores-recomendados/, moduleKey: 'dataReports' },
  { pattern: /^\/ativos/, moduleKey: 'dataReports' },
  
  // ESG Ambiental
  { pattern: /^\/inventario-gee/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/dashboard-ghg/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/projetos-carbono/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/monitoramento-esg/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/monitoramento-agua/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/monitoramento-energia/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/monitoramento-emissoes/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/monitoramento-residuos/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/residuos/, moduleKey: 'esgEnvironmental' },
  { pattern: /^\/metas-sustentabilidade/, moduleKey: 'esgEnvironmental' },
  
  // ESG Governança
  { pattern: /^\/governanca-esg/, moduleKey: 'esgGovernance' },
  { pattern: /^\/gestao-riscos/, moduleKey: 'esgGovernance' },
  { pattern: /^\/compliance/, moduleKey: 'esgGovernance' },
  { pattern: /^\/auditoria/, moduleKey: 'esgGovernance' },
  { pattern: /^\/gestao-stakeholders/, moduleKey: 'esgGovernance' },
  { pattern: /^\/analise-materialidade/, moduleKey: 'esgGovernance' },
];

/**
 * Verifica se uma rota está desabilitada
 */
export const isRouteDisabled = (path: string): boolean => {
  return DISABLED_ROUTES.some(
    ({ pattern, moduleKey }) => pattern.test(path) && !ENABLED_MODULES[moduleKey]
  );
};
