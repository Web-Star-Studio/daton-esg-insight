/**
 * Mapa de módulos da V1 (Lovable) que já têm paridade na V2 (novo sistema Daton).
 *
 * Quando um módulo aparece aqui, a página V1 exibe um banner indicando que
 * a funcionalidade migrou para a V2 e que esta versão será descontinuada.
 *
 * Para marcar um módulo como migrado, adicione uma entrada com:
 * - `v2Path`: rota equivalente no novo sistema (apenas o path; a base é `V2_BASE_URL`)
 * - `status`: 'migrated' (banner amarelo, V1 ainda usável) ou 'deprecated' (vermelho, migração obrigatória)
 * - `notes` (opcional): observações para o usuário
 */

export const V2_BASE_URL = "https://daton-web.onrender.com";

export type MigrationStatus = "migrated" | "deprecated";

export interface MigratedModule {
  v1Title: string;
  v2Path: string;
  status: MigrationStatus;
  notes?: string;
}

/**
 * Chave = pathname da V1 (use o path EXATO da rota raiz do módulo).
 * Sub-rotas herdam o aviso via prefixo (ver `getMigrationInfo`).
 */
export const MIGRATED_MODULES: Record<string, MigratedModule> = {
  // === Organização ===
  "/gestao-funcionarios": {
    v1Title: "Gestão de Colaboradores",
    v2Path: "/app/organizacao/colaboradores",
    status: "migrated",
  },
  "/funcionarios": {
    v1Title: "Funcionários",
    v2Path: "/app/organizacao/colaboradores",
    status: "migrated",
  },
  "/descricao-cargos": {
    v1Title: "Descrição de Cargos",
    v2Path: "/app/organizacao/cargos",
    status: "migrated",
    notes: "A V2 inclui matriz de competências versionada por cargo.",
  },
  "/gestao-filiais": {
    v1Title: "Gestão de Filiais",
    v2Path: "/app/organizacao/unidades",
    status: "migrated",
  },
  "/estrutura-organizacional": {
    v1Title: "Estrutura Organizacional",
    v2Path: "/app/organizacao/departamentos",
    status: "migrated",
  },
  "/gestao-usuarios": {
    v1Title: "Gestão de Usuários",
    v2Path: "/app/organizacao/usuarios",
    status: "migrated",
  },
  "/ativos": {
    v1Title: "Ativos",
    v2Path: "/app/organizacao/ativos",
    status: "migrated",
    notes: "A V2 inclui planos de manutenção (preventiva/corretiva/inspeção) com checklist.",
  },

  // === Qualidade (SGQ / ISO) ===
  "/controle-documentos": {
    v1Title: "Controle de Documentos",
    v2Path: "/app/qualidade/documentacao",
    status: "migrated",
  },
  "/mapeamento-processos": {
    v1Title: "Mapeamento de Processos",
    v2Path: "/app/governanca/processos-sgq",
    status: "migrated",
  },
  "/auditorias-internas": {
    v1Title: "Auditorias Internas",
    v2Path: "/app/governanca/auditorias",
    status: "migrated",
  },
  "/nao-conformidades": {
    v1Title: "Não Conformidades",
    v2Path: "/app/governanca/nao-conformidades",
    status: "migrated",
  },
  "/acoes-corretivas": {
    v1Title: "Ações Corretivas",
    v2Path: "/app/governanca/nao-conformidades",
    status: "migrated",
    notes: "Na V2, ações corretivas estão integradas à NC de origem.",
  },
  "/plano-acao-5w2h": {
    v1Title: "Plano de Ação 5W2H",
    v2Path: "/app/governanca/nao-conformidades",
    status: "migrated",
  },

  // === Compliance / Legislações ===
  // (Legislações ainda em correção V1 — manter em 'migrated' apenas após validação do ticket atual)
  "/licenciamento/legislacoes": {
    v1Title: "Legislações",
    v2Path: "/app/qualidade/legislacoes",
    status: "migrated",
    notes: "A V2 inclui questionário de aplicabilidade que gera tags automáticas por unidade.",
  },

  // === Fornecedores ===
  "/gestao-fornecedores": {
    v1Title: "Gestão de Fornecedores",
    v2Path: "/app/qualidade/fornecedores",
    status: "migrated",
  },
  "/avaliacao-fornecedores": {
    v1Title: "Avaliação de Fornecedores",
    v2Path: "/app/qualidade/fornecedores",
    status: "migrated",
    notes: "Qualificação e desempenho unificados no perfil do fornecedor.",
  },

  // === ESG / Ambiental ===
  "/laia": {
    v1Title: "LAIA",
    v2Path: "/app/ambiental/laia",
    status: "migrated",
  },

  // === KPIs / Indicadores ===
  "/indicadores": {
    v1Title: "Indicadores",
    v2Path: "/app/kpi/indicadores",
    status: "migrated",
  },
  "/gestao-indicadores": {
    v1Title: "Gestão de Indicadores",
    v2Path: "/app/kpi/indicadores",
    status: "migrated",
  },

  // === Treinamentos ===
  "/gestao-treinamentos": {
    v1Title: "Gestão de Treinamentos",
    v2Path: "/app/organizacao/colaboradores/treinamentos",
    status: "migrated",
  },

  // === Planejamento Estratégico ===
  "/planejamento-estrategico": {
    v1Title: "Planejamento Estratégico",
    v2Path: "/app/governanca",
    status: "migrated",
    notes: "A V2 inclui SWOT com scores, partes interessadas, riscos/oportunidades e workflow de aprovação.",
  },
};

/**
 * Retorna o registro de migração para uma rota (com fallback por prefixo).
 */
export function getMigrationInfo(pathname: string): MigratedModule | null {
  if (MIGRATED_MODULES[pathname]) return MIGRATED_MODULES[pathname];
  for (const [route, info] of Object.entries(MIGRATED_MODULES)) {
    if (pathname.startsWith(route + "/")) return info;
  }
  return null;
}

/**
 * URL absoluta para o equivalente na V2.
 */
export function getV2Url(info: MigratedModule): string {
  return `${V2_BASE_URL}${info.v2Path}`;
}
