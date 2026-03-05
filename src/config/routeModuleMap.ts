/**
 * Mapeamento centralizado de rotas para módulos.
 * Usado pelo ProtectedRoute para bloquear acesso direto por URL
 * quando o usuário não tem permissão no módulo.
 */

export const ROUTE_MODULE_MAP: Record<string, string> = {
  // === ESG Ambiental ===
  '/inventario-gee': 'esgEnvironmental',
  '/dashboard-ghg': 'esgEnvironmental',
  '/projetos-carbono': 'esgEnvironmental',
  '/residuos': 'esgEnvironmental',
  '/metas': 'esgEnvironmental',
  '/biblioteca-fatores': 'esgEnvironmental',
  '/licenciamento': 'esgEnvironmental',
  '/ativos': 'esgEnvironmental',

  // === ESG Governança ===
  '/governanca-esg': 'esgGovernance',
  '/compliance': 'esgGovernance',
  '/auditoria': 'esgGovernance',
  '/gestao-riscos': 'esgGovernance',
  '/gestao-stakeholders': 'esgGovernance',
  '/analise-materialidade': 'esgGovernance',

  // === ESG Social ===
  '/social-esg': 'esgSocial',

  // === ESG Management ===
  '/gestao-esg': 'esgManagement',
  '/relatorios-integrados': 'esgManagement',
  '/planejamento-estrategico': 'esgManagement',

  // === Qualidade (SGQ) ===
  '/sgq-dashboard': 'quality',
  '/quality-dashboard': 'quality',
  '/matriz-partes-interessadas': 'quality',
  '/auditorias-internas': 'quality',
  '/acoes-corretivas': 'quality',
  '/controle-documentos': 'quality',
  '/nao-conformidades': 'quality',
  '/plano-acao-5w2h': 'quality',
  '/mapeamento-processos': 'quality',
  '/base-conhecimento': 'quality',

  // === Fornecedores ===
  '/gestao-fornecedores': 'suppliers',
  '/avaliacao-fornecedores': 'suppliers',

  // === Financeiro ===
  '/financeiro': 'financial',

  // === Dados e Relatórios ===
  '/coleta-dados': 'dataReports',
  '/relatorios': 'dataReports',
  '/formularios-customizados': 'dataReports',

  // === Configurações (apenas organizacional — /configuracao é acessível a todos) ===
  '/configuracao-organizacional': 'settings',
};

/**
 * Retorna o moduleKey associado a uma rota, ou null se não mapeada.
 * Suporta rotas com sub-paths (ex: /residuos/relatorios → esgEnvironmental).
 */
export function getModuleKeyForRoute(pathname: string): string | null {
  // Exact match first
  if (ROUTE_MODULE_MAP[pathname]) {
    return ROUTE_MODULE_MAP[pathname];
  }

  // Check prefix match for sub-routes
  for (const [route, moduleKey] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname.startsWith(route + '/')) {
      return moduleKey;
    }
  }

  return null;
}
