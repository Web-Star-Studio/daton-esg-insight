// Mapa dos 21 temas do questionário de compliance para uma sigla curta
// (≤4 letras) e o título humano. Usado pela edge function
// `compliance-update-letter-generator` ao serializar cada legislação na carta.
// O frontend tem uma cópia espelhada em `src/lib/complianceSystems.ts` —
// mantenha as duas em sincronia. Os ids batem com `legislation_themes.id`,
// que por sua vez vêm de `src/components/legislation/compliance-questionnaire/questions.config.ts`.

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

const BY_ID = new Map(COMPLIANCE_SYSTEMS.map((s) => [s.id, s]));

// Aceita o id do tema OU o slug normalizado do título. Quando não encontra
// nenhuma das duas formas, devolve null — o caller decide como apresentar.
// (Sem fallback "primeiras 3 letras" porque uuids legados de
// legislation_themes acabavam virando "6F5", "A2D", etc., poluindo a
// coluna "Sistemas" da carta.)
export function siglaForThemeOrNull(input: string | null | undefined): string | null {
  if (!input) return null;
  const direct = BY_ID.get(input);
  if (direct) return direct.sigla;
  const norm = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return BY_ID.get(norm)?.sigla ?? null;
}

// Compat: callers antigos usam string com fallback. Agora retorna "—"
// quando não casa, sem inventar siglas a partir do uuid.
export function siglaForTheme(input: string | null | undefined): string {
  return siglaForThemeOrNull(input) ?? "—";
}
