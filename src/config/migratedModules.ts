/**
 * Mapa de módulos da V1 (Lovable) que já têm paridade COMPLETA na V2 (novo sistema Daton).
 *
 * REGRA DE INCLUSÃO: só entram aqui módulos cuja funcionalidade equivalente na V2
 * foi verificada como completa (não apenas parcial). Módulos com gaps funcionais
 * relevantes permanecem fora deste mapa até que a V2 alcance paridade total —
 * isso evita frustrar usuários que cliquem no banner esperando encontrar tudo.
 *
 * Quando um módulo aparece aqui, a página V1 exibe um banner indicando que
 * a funcionalidade migrou para a V2 e que esta versão será descontinuada.
 *
 * Para marcar um módulo como migrado, adicione uma entrada com:
 * - `v2Path`: rota equivalente no novo sistema (apenas o path; a base é `V2_BASE_URL`)
 * - `status`: 'migrated' (banner amarelo, V1 ainda usável) ou 'deprecated' (vermelho, migração obrigatória)
 * - `notes` (opcional): observações para o usuário
 *
 * Última verificação de paridade: 2026-04-17 (cruzamento com código-fonte da V2).
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
    notes: "Na V2, a hierarquia de papéis é simplificada (papel único + permissões por módulo).",
  },

  // === Qualidade (SGQ / ISO) ===
  "/controle-documentos": {
    v1Title: "Controle de Documentos",
    v2Path: "/app/qualidade/documentacao",
    status: "migrated",
    notes: "Paridade completa: ciclo de vida, versionamento, leitura confirmada e vínculo multi-filial.",
  },

  // === ESG / Ambiental ===
  "/laia": {
    v1Title: "LAIA",
    v2Path: "/app/ambiental/laia",
    status: "migrated",
    notes: "Paridade completa: aspectos/impactos por setor, matriz configurável e plano de ação.",
  },

  // === Planejamento Estratégico & Riscos ===
  "/planejamento-estrategico": {
    v1Title: "Planejamento Estratégico",
    v2Path: "/app/governanca",
    status: "migrated",
    notes: "A V2 inclui SWOT com scores, partes interessadas, riscos/oportunidades e workflow de aprovação.",
  },
  "/gestao-riscos": {
    v1Title: "Gestão de Riscos",
    v2Path: "/app/governanca/riscos-oportunidades",
    status: "migrated",
    notes: "Probabilidade × impacto com score e estratégia de resposta, integrado a achados de auditoria.",
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
