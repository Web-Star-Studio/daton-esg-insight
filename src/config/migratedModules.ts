/**
 * Mapa de módulos da V1 (Lovable) que já têm paridade COMPLETA e validada na V2.
 *
 * REGRA DE INCLUSÃO (revisada com a equipe em 2026-04-17):
 * Só entram aqui módulos com status "OK" — validados na V1 E migrados por completo na V2.
 * Módulos "Em revisão" ou de "Baixa prioridade" na V2 NÃO recebem aviso, para não poluir
 * a experiência do cliente enquanto a paridade ainda está em construção.
 *
 * Quando um módulo aparece aqui:
 *  - A página V1 exibe um banner discreto indicando que a funcionalidade já está migrada.
 *  - O sidebar NÃO exibe badge (decisão UX: evitar poluição visual; o aviso na página basta).
 *
 * Para marcar um módulo como migrado, adicione uma entrada com:
 *  - `v2Path`: rota equivalente no novo sistema (apenas o path; a base é `V2_BASE_URL`)
 *  - `status`: 'migrated' (V1 ainda usável) ou 'deprecated' (migração obrigatória)
 *  - `notes` (opcional): observações para o usuário
 *
 * Última verificação de paridade: 2026-04-17 (validação cruzada com a equipe da V2).
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
  // === Organização (status OK — paridade total validada) ===
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
