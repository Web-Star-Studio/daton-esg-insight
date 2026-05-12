import type { ComplianceResponses } from "@/services/complianceProfiles";

// Suppression engine: traduz pre_responses (escopo da unidade) em um
// conjunto de temas e perguntas que devem ser ocultados do questionário
// principal, do cálculo de progresso e da geração de tags.
//
// As regras são puras, declarativas e testáveis. Cada regra é independente;
// o resultado final é a união aditiva de todas as regras que casam.
//
// Theme IDs aqui são os MESMOS usados em questions.config.ts /
// themes_extracted.ts e na lista hard-coded do agente de IA em
// supabase/functions/legislation-monthly-radar/index.ts (linha ~391).
// Não alterar IDs sem coordenar com aquele agente.

export interface Suppression {
  themeIds: Set<string>;
  questionIds: Set<string>;
}

export interface SuppressionRule {
  id: string;
  when: (pre: ComplianceResponses) => boolean;
  suppressThemes?: string[];
  suppressQuestions?: string[];
}

const asString = (v: ComplianceResponses[string] | undefined): string =>
  typeof v === "string" ? v : "";

const asArray = (v: ComplianceResponses[string] | undefined): string[] =>
  Array.isArray(v) ? v : [];

const hasNone = (v: ComplianceResponses[string] | undefined, values: string[]): boolean => {
  const arr = asArray(v);
  return arr.length > 0 && values.every((val) => !arr.includes(val));
};

export const SUPPRESSION_RULES: SuppressionRule[] = [
  // Ocupação ────────────────────────────────────────────────────────────────
  {
    id: "ocupacao_host",
    when: (pre) => ["cliente", "condominio"].includes(asString(pre["pre.ocupacao"])),
    suppressThemes: ["instalacoes", "recursos_hidricos", "emissoes_atmosfericas", "energia"],
  },
  {
    id: "ocupacao_escritorio",
    when: (pre) => asString(pre["pre.ocupacao"]) === "escritorio",
    suppressThemes: [
      "produtos_florestais",
      "combustiveis_inflamaveis",
      "produtos_quimicos",
      "recursos_hidricos",
      "emissoes_atmosfericas",
      "residuos",
      "mineracao",
      "pesagem",
      "produtos_insumos",
      "transporte",
      "equipamentos",
    ],
  },

  // Responsabilidade pela infraestrutura ────────────────────────────────────
  {
    id: "infra_host",
    when: (pre) => asString(pre["pre.responsabilidade_infra"]) === "host",
    suppressThemes: ["instalacoes"],
  },

  // Atividade ───────────────────────────────────────────────────────────────
  {
    id: "atividade_sem_industrial",
    when: (pre) => hasNone(pre["pre.atividade"], ["industrial_fabril", "oficina_manutencao", "mineracao"]),
    suppressThemes: ["mineracao", "pesagem"],
  },
  {
    id: "atividade_sem_mineracao",
    when: (pre) => {
      const arr = asArray(pre["pre.atividade"]);
      return arr.length > 0 && !arr.includes("mineracao");
    },
    suppressThemes: ["mineracao"],
  },

  // Frota ───────────────────────────────────────────────────────────────────
  {
    id: "sem_frota",
    when: (pre) => asString(pre["pre.frota"]) === "nao",
    suppressThemes: ["transporte"],
  },

  // Químicos ────────────────────────────────────────────────────────────────
  {
    id: "sem_quimicos",
    when: (pre) => ["nao", "apenas_no_host"].includes(asString(pre["pre.quimicos"])),
    suppressThemes: ["produtos_quimicos", "combustiveis_inflamaveis"],
  },

  // Efluentes / resíduos ────────────────────────────────────────────────────
  {
    id: "ambiental_tudo_host",
    when: (pre) => {
      const arr = asArray(pre["pre.efluentes_residuos"]);
      return arr.length === 1 && arr[0] === "nenhum";
    },
    suppressThemes: ["recursos_hidricos", "residuos", "emissoes_atmosfericas"],
  },
  {
    id: "ambiental_sem_efluentes",
    when: (pre) => {
      const arr = asArray(pre["pre.efluentes_residuos"]);
      return arr.length > 0 && !arr.includes("efluentes") && !arr.includes("nenhum");
    },
    suppressThemes: ["recursos_hidricos"],
  },
  {
    id: "ambiental_sem_residuos",
    when: (pre) => {
      const arr = asArray(pre["pre.efluentes_residuos"]);
      return arr.length > 0 && !arr.includes("residuos_solidos") && !arr.includes("nenhum");
    },
    suppressThemes: ["residuos"],
  },
  {
    id: "ambiental_sem_emissoes",
    when: (pre) => {
      const arr = asArray(pre["pre.efluentes_residuos"]);
      return arr.length > 0 && !arr.includes("emissoes_atmosfericas") && !arr.includes("nenhum");
    },
    suppressThemes: ["emissoes_atmosfericas"],
  },

  // Colaboradores ───────────────────────────────────────────────────────────
  {
    id: "sem_proprios",
    when: (pre) => asString(pre["pre.colaboradores"]) === "apenas_terceiros_host",
    suppressThemes: ["profissionais", "pcd", "saude_trabalhador", "normas_regulamentadoras"],
  },
  {
    id: "sem_terceiros",
    when: (pre) => asString(pre["pre.colaboradores"]) === "proprios",
    suppressThemes: ["tipos_trabalho_terceiros"],
  },

  // Licenciamento ───────────────────────────────────────────────────────────
  {
    id: "licenciamento_host",
    when: (pre) => asString(pre["pre.licenciamento_responsavel"]) === "nao",
    suppressThemes: ["licenciamento", "localizacao_fauna_flora"],
  },
];

export const computeSuppression = (pre: ComplianceResponses): Suppression => {
  const themeIds = new Set<string>();
  const questionIds = new Set<string>();
  for (const rule of SUPPRESSION_RULES) {
    if (!rule.when(pre)) continue;
    rule.suppressThemes?.forEach((t) => themeIds.add(t));
    rule.suppressQuestions?.forEach((q) => questionIds.add(q));
  }
  return { themeIds, questionIds };
};

// Forma achatada para storage em suppressed_keys TEXT[].
// Sempre sorted pra estabilidade em diffs/round-trips.
export const suppressionToKeys = (s: Suppression): string[] =>
  [
    ...Array.from(s.themeIds).map((id) => `theme:${id}`),
    ...Array.from(s.questionIds).map((id) => `q:${id}`),
  ].sort();

export const keysToSuppression = (keys: string[] | null | undefined): Suppression => {
  const themeIds = new Set<string>();
  const questionIds = new Set<string>();
  for (const k of keys ?? []) {
    if (k.startsWith("theme:")) themeIds.add(k.slice("theme:".length));
    else if (k.startsWith("q:")) questionIds.add(k.slice("q:".length));
  }
  return { themeIds, questionIds };
};

export const EMPTY_SUPPRESSION: Suppression = {
  themeIds: new Set<string>(),
  questionIds: new Set<string>(),
};
