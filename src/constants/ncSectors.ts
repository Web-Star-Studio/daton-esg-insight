// Lista fixa de setores usada em formulários de Não Conformidade.
// Centralizada aqui pra evitar divergência entre tela de Registro e modal
// de Edição (cliente em 2026-05-19 reportou não conseguir identificar
// unidade — modal de edição não tinha o campo, então duplicação era o
// próximo risco).
export const NC_SECTORS = [
  "Operacional",
  "Frota",
  "Administrativo",
  "Lavagem",
  "Abastecimento",
  "Manutenção",
  "Logística",
  "Qualidade",
  "Segurança",
  "RH",
  "Financeiro",
  "Compras",
  "TI",
  "Comercial",
] as const;

export type NCSector = (typeof NC_SECTORS)[number];
