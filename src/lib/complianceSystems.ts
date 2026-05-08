// Mapa dos 21 temas do questionário de compliance para uma sigla curta
// (≤4 letras) e o título humano. Espelha
// `supabase/functions/_shared/compliance-systems.ts` — qualquer mudança
// aqui precisa ir para lá também (e vice-versa).
//
// Os ids batem com `legislation_themes.id`, que por sua vez vêm de
// `src/components/legislation/compliance-questionnaire/questions.config.ts`.

export interface ComplianceSystem {
  id: string;
  number: number;
  sigla: string;
  title: string;
}

export const COMPLIANCE_SYSTEMS: ComplianceSystem[] = [
  { id: "licenciamento",            number: 1,  sigla: "LIC", title: "Licenciamento" },
  { id: "instalacoes",               number: 2,  sigla: "INS", title: "Instalações" },
  { id: "localizacao_fauna_flora",   number: 3,  sigla: "LOC", title: "Localização / Fauna / Flora" },
  { id: "produtos_insumos",          number: 4,  sigla: "PRD", title: "Produtos, Insumos e Demais Substâncias" },
  { id: "produtos_florestais",       number: 5,  sigla: "FLO", title: "Produtos e Subprodutos Florestais" },
  { id: "combustiveis_inflamaveis",  number: 6,  sigla: "CMB", title: "Combustíveis e Inflamáveis" },
  { id: "produtos_quimicos",         number: 7,  sigla: "QUI", title: "Produtos Químicos e/ou Perigosos" },
  { id: "recursos_hidricos",         number: 8,  sigla: "HID", title: "Recursos Hídricos / Efluentes Líquidos" },
  { id: "emissoes_atmosfericas",     number: 9,  sigla: "ATM", title: "Emissões Atmosféricas" },
  { id: "residuos",                  number: 10, sigla: "RES", title: "Resíduos" },
  { id: "equipamentos",              number: 11, sigla: "EQP", title: "Equipamentos" },
  { id: "energia",                   number: 12, sigla: "ENE", title: "Energia" },
  { id: "transporte",                number: 13, sigla: "TRP", title: "Transporte" },
  { id: "profissionais",             number: 14, sigla: "PRF", title: "Profissionais" },
  { id: "pcd",                       number: 15, sigla: "PCD", title: "PCD" },
  { id: "saude_trabalhador",         number: 16, sigla: "SST", title: "Saúde do Trabalhador" },
  { id: "tipos_trabalho_terceiros",  number: 17, sigla: "TER", title: "Trabalhos com Terceiros" },
  { id: "normas_regulamentadoras",   number: 18, sigla: "NRG", title: "Normas Regulamentadoras - NR" },
  { id: "mineracao",                 number: 19, sigla: "MIN", title: "Mineração" },
  { id: "pesagem",                   number: 20, sigla: "PES", title: "Pesagem" },
  { id: "lgpd",                      number: 21, sigla: "LGP", title: "LGPD" },
];

const BY_ID = new Map(COMPLIANCE_SYSTEMS.map((s) => [s.id, s] as const));

export function systemFor(themeId: string | null | undefined): ComplianceSystem | null {
  if (!themeId) return null;
  return BY_ID.get(themeId) ?? null;
}

export function siglaForTheme(themeId: string | null | undefined): string {
  return systemFor(themeId)?.sigla ?? "—";
}

export function titleForTheme(themeId: string | null | undefined): string {
  return systemFor(themeId)?.title ?? "—";
}

export const JURISDICTION_LABELS: Record<string, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  nbr: "NBR",
  internacional: "Internacional",
};

export const APPLICABILITY_LABELS: Record<string, string> = {
  real: "Real",
  potential: "Potencial",
  revoked: "Revogada",
  na: "Não Aplicável",
  pending: "Pendente",
};

// Espelha a const PT_MONTHS do servidor (`compliance-update-letter-generator`).
// Mantida no client para evitar bug de timezone do `format()` do date-fns:
// `new Date("2026-05-01T00:00:00Z")` em BRT (UTC-3) vira 30/04 21:00 local,
// e o `format()` resolve em local-tz devolvendo "abril".
const PT_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Formata "2026-05-01" em "Maio / 2026" (separator='/') ou "maio de 2026"
// (separator='de'). Faz parsing por split em "-" pra não tocar em Date e
// não cair na armadilha do timezone local.
export function formatReferenceMonthLabel(
  referenceMonthISO: string,
  separator: "/" | "de" = "/",
): string {
  const [yearStr, monthStr] = referenceMonthISO.split("-");
  const monthIdx = Number.parseInt(monthStr, 10) - 1;
  const monthName = PT_MONTHS[monthIdx] ?? "";
  if (separator === "/") {
    const cap = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";
    return `${cap} / ${yearStr}`;
  }
  return `${monthName} de ${yearStr}`;
}
