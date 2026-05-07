import type { Theme } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Produtos Químicos — perguntas 18 a 22.
// Cada uma das 5 perguntas no gabarito tem uma lista própria (não é a mesma
// repetida). q18 (fabrica) e q21 (armazena) coincidem. q19 (importa) e q20
// (comercializa) compartilham o subconjunto de bens importados/distribuídos.
// q22 (utiliza) é a mais distinta — exclui bens de consumo final (Pneu,
// Pilha/Bateria, Domissanitários, Detergente em pó) e inclui itens técnicos
// específicos (Perigosos por FDS/Fispq, Óleos Combustíveis, Cloro/Ácido
// clorídrico puro). Itens são definidos uma vez em PROD_QUIM_ITEMS e cada
// pergunta enumera os IDs aplicáveis na ordem do PDF.
// ─────────────────────────────────────────────────────────────────────────────
type Verb = "fab" | "imp" | "com" | "arm" | "uti";

const PROD_QUIM_ITEMS = {
  biometano: { label: "Biometano", tags: ["biometano"] },
  negro_fumo: { label: "Negro de Fumo", tags: ["negro_fumo", "produtos_perigosos"] },
  veterinarios: { label: "Produtos veterinários", tags: ["produtos_veterinarios"] },
  saneantes: { label: "Saneantes", tags: ["saneantes"] },
  solventes_pf_60: {
    label: "Solventes controlados pela Polícia Federal com concentração acima de 60%",
    tags: ["solventes", "controlados_pf", "produtos_perigosos"],
  },
  chumbo: { label: "Chumbo", tags: ["chumbo", "produtos_perigosos"] },
  soda_caustica: { label: "Soda Cáustica", tags: ["soda_caustica", "produtos_perigosos"] },
  acido_fluoridrico: { label: "Ácido Fluorídrico", tags: ["acido_fluoridrico", "produtos_perigosos"] },
  nitrato_amonio: { label: "Nitrato de Amônio", tags: ["nitrato_amonio", "produtos_perigosos"] },
  mercurio: { label: "Mercúrio", tags: ["mercurio", "produtos_perigosos"] },
  solventes: { label: "Solventes", tags: ["solventes"] },
  cola_adesivos: {
    label: "Cola de Sapateiro, Adesivos Ou Corretivos",
    tags: ["cola_adesivos", "produtos_quimicos"],
  },
  thiner: { label: "Thiner", tags: ["thiner", "produtos_quimicos"] },
  tolueno: { label: "Tolueno", tags: ["tolueno", "produtos_perigosos"] },
  cloro: { label: "Cloro", tags: ["cloro", "produtos_perigosos"] },
  detergente_po: { label: "Detergente em pó", tags: ["detergente_po"] },
  benzeno: { label: "Benzeno", tags: ["benzeno", "produtos_perigosos"] },
  fertilizantes: { label: "Fertilizantes", tags: ["fertilizantes"] },
  controlados_pc: { label: "Controlados Pela Polícia Civil", tags: ["controlados_pc"] },
  controlados_pf: { label: "Controlados Pela Polícia Federal", tags: ["controlados_pf"] },
  controlados_exercito: { label: "Controlados Pelo Exército", tags: ["controlados_exercito"] },
  biodiesel: { label: "Biodiesel", tags: ["biodiesel"] },
  gas_natural: { label: "Gás Natural", tags: ["gas_natural"] },
  glp: { label: "GLP - Gás Liquefeito de Petróleo", tags: ["glp"] },
  agrotoxicos: { label: "Agrotóxicos", tags: ["agrotoxicos", "produtos_perigosos"] },
  oleo_lubrificante: { label: "Óleo Lubrificante", tags: ["oleo_lubrificante"] },
  oleo_diesel: { label: "Óleo Diesel", tags: ["oleo_diesel"] },
  medicamentos: {
    label: "Medicamentos, Drogas, Insumos Farmacêuticos e Afins",
    tags: ["medicamentos_insumos"],
  },
  controle_pragas: {
    label: "Produtos Para Controle de Pragas e Vetores",
    tags: ["controle_pragas_vetores"],
  },
  higienizacao: {
    label: "Produtos Para Higienização E/ou Desinfecção",
    tags: ["higienizacao"],
  },
  pilha_bateria: { label: "Pilha/Bateria", tags: ["pilhas_baterias"] },
  metanol: { label: "Metanol", tags: ["metanol", "produtos_perigosos"] },
  pneu: { label: "Pneu", tags: ["pneu"] },
  domissanitarios: { label: "Domissanitários", tags: ["domissanitarios"] },
  perigosos_fds: {
    label: "Perigosos (conforme FDS/Fispq do Produto)",
    tags: ["produtos_perigosos"],
  },
  oleos_combustiveis: { label: "Óleos Combustíveis", tags: ["oleos_combustiveis"] },
  cloro_acido_clor: {
    label:
      "Cloro/Ácido clorídrico puro (não considerar produtos de limpeza ou tratamento de água diluídos)",
    tags: ["acido_cloridrico", "produtos_perigosos"],
  },
} as const satisfies Record<string, { label: string; tags?: readonly string[] }>;

type ProdQuimKey = keyof typeof PROD_QUIM_ITEMS;

// q18 (fabrica) e q21 (armazena) — mesma lista, 33 itens.
const PROD_QUIM_FAB_ARM: readonly ProdQuimKey[] = [
  "biometano", "negro_fumo", "veterinarios", "saneantes", "solventes_pf_60",
  "chumbo", "soda_caustica", "acido_fluoridrico", "nitrato_amonio", "mercurio",
  "solventes", "cola_adesivos", "thiner", "tolueno", "cloro", "detergente_po",
  "benzeno", "fertilizantes", "controlados_pc", "controlados_pf", "controlados_exercito",
  "biodiesel", "gas_natural", "glp", "agrotoxicos", "oleo_lubrificante", "oleo_diesel",
  "medicamentos", "controle_pragas", "higienizacao", "pilha_bateria", "metanol", "pneu",
];

// q19 (importa) — sem Biometano, Negro de Fumo, Detergente em pó, Metanol;
// inclui Domissanitários. 30 itens.
const PROD_QUIM_IMP: readonly ProdQuimKey[] = [
  "veterinarios", "saneantes", "solventes_pf_60", "solventes", "cola_adesivos",
  "thiner", "tolueno", "cloro", "mercurio", "nitrato_amonio", "acido_fluoridrico",
  "chumbo", "oleo_lubrificante", "agrotoxicos", "domissanitarios", "glp",
  "gas_natural", "biodiesel", "controlados_exercito", "controlados_pf", "controlados_pc",
  "fertilizantes", "benzeno", "soda_caustica", "pilha_bateria", "pneu", "oleo_diesel",
  "medicamentos", "controle_pragas", "higienizacao",
];

// q20 (comercializa) — q19 + Biometano + Metanol; sem Negro de Fumo nem
// Detergente em pó. 32 itens.
const PROD_QUIM_COM: readonly ProdQuimKey[] = [
  "biometano", "veterinarios", "saneantes", "solventes_pf_60", "solventes",
  "cola_adesivos", "thiner", "tolueno", "cloro", "mercurio", "nitrato_amonio",
  "acido_fluoridrico", "soda_caustica", "chumbo", "oleo_lubrificante", "agrotoxicos",
  "domissanitarios", "glp", "gas_natural", "biodiesel", "controlados_exercito",
  "controlados_pf", "controlados_pc", "fertilizantes", "benzeno", "oleo_diesel",
  "medicamentos", "controle_pragas", "higienizacao", "pilha_bateria", "metanol", "pneu",
];

// q22 (utiliza) — sem bens de consumo final (Detergente, Pilha/Bateria, Pneu,
// Domissanitários, Cloro puro); inclui Cloro/Ácido clorídrico puro, Perigosos
// por FDS/Fispq e Óleos Combustíveis. 32 itens.
const PROD_QUIM_UTI: readonly ProdQuimKey[] = [
  "biometano", "negro_fumo", "veterinarios", "saneantes", "solventes_pf_60",
  "chumbo", "mercurio", "cloro_acido_clor", "cola_adesivos", "thiner", "tolueno",
  "solventes", "acido_fluoridrico", "soda_caustica", "oleo_lubrificante", "agrotoxicos",
  "glp", "gas_natural", "biodiesel", "controlados_exercito", "controlados_pf",
  "controlados_pc", "fertilizantes", "benzeno", "perigosos_fds", "oleos_combustiveis",
  "oleo_diesel", "nitrato_amonio", "controle_pragas", "medicamentos", "higienizacao",
  "metanol",
];

function produtosQuimicosOptions(verb: Verb, keys: readonly ProdQuimKey[]) {
  return [
    { id: "nao_aplica", label: "Não Se Aplica" },
    ...keys.map((key) => {
      const item = PROD_QUIM_ITEMS[key];
      const baseTags = item.tags ?? [];
      return {
        id: `${verb}_${key}`,
        label: item.label,
        tags: [...baseTags, `quimicos_${verb}`],
      };
    }),
  ];
}

// Themes 5-12 and 14-21 extracted from the Brazilian-Portuguese compliance PDFs.
// Themes 1-4 and 13 already live in `questions.config.ts`.
export const EXTRACTED_THEMES: Theme[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Theme 5 — Produtos e Subprodutos Florestais
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "produtos_florestais",
    number: 5,
    title: "Produtos e Subprodutos Florestais",
    questions: [
      {
        id: "flo.q1",
        number: "1",
        label: "A unidade possui sistema orgânico de produção?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["sistema_organico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q2",
        number: "2",
        label:
          "A unidade realiza o plantio, consome/explora ou utiliza produtos (estado bruto ou in natura) e subprodutos (submetido a processo de beneficiamento) florestais?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "consome_plantio_nativa",
            label: "Consome ou realiza plantio de Produtos de Origem Nativa",
            tags: ["produtos_florestais", "florestal_nativa"],
          },
          {
            id: "consome_plantio_plantada",
            label: "Consome ou realiza plantio de Produtos de Origem Plantada/exótica",
            tags: ["produtos_florestais", "florestal_plantada"],
          },
          {
            id: "subprodutos_nativa",
            label: "Consome Subprodutos de Origem Nativa",
            tags: ["produtos_florestais", "florestal_nativa"],
          },
          {
            id: "subprodutos_plantada",
            label: "Consome Subprodutos de Origem Plantada/exótica",
            tags: ["produtos_florestais", "florestal_plantada"],
          },
          {
            id: "palletes_plantada",
            label: "Apenas Consome Ou Utiliza Palletes de Madeira Plantada/exótica",
            tags: ["palletes_madeira"],
          },
          {
            id: "palletes_nativa",
            label: "Apenas Consome Ou Utiliza Palletes de Madeira Nativa",
            tags: ["palletes_madeira", "florestal_nativa"],
          },
          {
            id: "outros_acabados",
            label:
              "Apenas Consome Ou Utiliza Outros Subprodutos de Madeira Acabados, Exceto Palletes (ex: Portas, Janelas, Mobiliário)",
            tags: ["subprodutos_madeira_acabados"],
          },
          {
            id: "exploracao_concessao",
            label: "Realiza Exploração de Florestas Sob Regime de Concessão Federal e/ou Estadual",
            tags: ["concessao_florestal"],
          },
          {
            id: "patrimonio_genetico_florestal",
            label:
              "Realiza Exploração Econômica de Produto Acabado Ou Material Reprodutivo Oriundo de Acesso Ao Patrimônio Genético Ou Ao Conhecimento Tradicional Associado",
            tags: ["patrimonio_genetico"],
          },
        ],
      },
      {
        id: "flo.q3",
        number: "3",
        label: "A unidade consome ou transporta carvão vegetal?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["carvao_vegetal"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q4",
        number: "4",
        label: "É realizada importação e/ou exportação de produtos e subprodutos madeireiros?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["importacao_exportacao_madeira"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q5",
        number: "5",
        label: "A unidade realiza importação ou exportação de produtos embalados em madeira?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["embalagem_madeira_internacional"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q6",
        number: "6",
        label: "A unidade importa ou exporta produtos sujeitos a controle de requisitos fitossanitários?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "paletes_embalagens",
            label: "Produtos Em Paletes Ou Outras Embalagens de Madeira",
            tags: ["fitossanitario", "embalagem_madeira_internacional"],
          },
          {
            id: "produtos_vegetais",
            label: "Produtos Vegetais Tais Como Madeira, Mudas, Sementes, Frutos, Etc.",
            tags: ["fitossanitario", "produtos_vegetais"],
          },
        ],
      },
      {
        id: "flo.q7",
        number: "7",
        label: "A unidade utiliza e/ou comercializa mudas?",
        type: "multi",
        options: [
          { id: "utiliza", label: "Utiliza", tags: ["mudas"] },
          { id: "comercializa", label: "Comercializa", tags: ["mudas", "comercializa_mudas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q8",
        number: "8",
        label: "Há exigência de Plano de Manejo Florestal Sustentável para a área da unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["manejo_florestal_sustentavel"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "flo.q9",
        number: "9",
        label: "A unidade realiza ou contrata o transporte rodoviário de toras ou madeira bruta?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_madeira_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["transporte_madeira_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 6 — Combustíveis e Inflamáveis
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "combustiveis_inflamaveis",
    number: 6,
    title: "Combustíveis e Inflamáveis",
    questions: [
      {
        id: "com.q1",
        number: "1",
        label: "A unidade possui armazenamento de combustíveis e inflamáveis?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["combustiveis_inflamaveis"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "com.q1_1",
        number: "1.1",
        label: "O armazenamento é em recipientes estacionários ou em transportáveis?",
        type: "multi",
        showIf: { questionId: "com.q1", anyOf: ["sim"] },
        options: [
          { id: "estacionarios", label: "Estacionários", tags: ["recipientes_estacionarios"] },
          { id: "transportaveis", label: "Transportáveis", tags: ["recipientes_transportaveis"] },
        ],
      },
      {
        id: "com.q1_2",
        number: "1.2",
        label: "Se em tanque, o mesmo é aéreo ou subterrâneo?",
        type: "multi",
        showIf: { questionId: "com.q1", anyOf: ["sim"] },
        options: [
          { id: "aereo_15", label: "Aéreo Até 15 m³", tags: ["tanque_aereo"] },
          { id: "subterraneo", label: "Subterrâneo", tags: ["tanque_subterraneo"] },
          { id: "aereo_acima_15", label: "Aéreo Acima de 15 m³", tags: ["tanque_aereo_grande"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "com.q2",
        number: "2",
        label: "A unidade utiliza GLP - Gás Liquefeito de Petróleo ou Gás Natural?",
        type: "multi",
        options: [
          { id: "glp", label: "GLP - Gás Liquefeito de Petróleo", tags: ["glp"] },
          { id: "gas_natural", label: "Gás Natural", tags: ["gas_natural"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "com.q2_1",
        number: "2.1",
        label: "O armazenamento de GLP ocorre em recipientes transportáveis ou estacionários?",
        type: "multi",
        showIf: { questionId: "com.q2", anyOf: ["glp"] },
        options: [
          {
            id: "sem_armazenamento",
            label: "Não há armazenamento em reservatório",
          },
          { id: "transportaveis", label: "Transportáveis", tags: ["glp_transportaveis"] },
          { id: "estacionarios", label: "Estacionários", tags: ["glp_estacionarios"] },
        ],
      },
      {
        id: "com.q3",
        number: "3",
        label: "A unidade faz uso de instalações de transporte dutoviário de gás natural?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["dutoviario_gas_natural"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "com.q4",
        number: "4",
        label: "Há posto de abastecimento de combustíveis automotivos na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["posto_abastecimento"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "com.q4_1",
        number: "4.1",
        label: "Como é o armazenamento de combustível no posto?",
        type: "multi",
        showIf: { questionId: "com.q4", anyOf: ["sim"] },
        options: [
          { id: "aereo", label: "Aéreo", tags: ["posto_aereo"] },
          { id: "subterraneo", label: "Subterrâneo", tags: ["posto_subterraneo"] },
        ],
      },
      {
        id: "com.q5",
        number: "5",
        label: "A unidade utiliza Gás Natural Veicular (GNV) em sua frota de veículos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["gnv"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 7 — Produtos Químicos e/ou Perigosos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "produtos_quimicos",
    number: 7,
    title: "Produtos Químicos E/ou Perigosos",
    questions: [
      {
        id: "qui.q1",
        number: "1",
        label:
          "A unidade possui equipamento (transformador, capacitor) contaminado por ascarel / bifenilas policloradas (ou óleos contaminados por PCB em teores maiores que 50 ppm)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ascarel_pcb", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q2",
        number: "2",
        label:
          "Existe atividade ou situação na empresa em que gere exposição ocupacional dos trabalhadores ao amianto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["amianto_exposicao", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q3",
        number: "3",
        label:
          "A unidade gera resíduos de amianto ou possui em suas edificações telhas ou caixa d'água de amianto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["amianto_residuos", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q4",
        number: "4",
        label: "É feito uso de explosivo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["explosivos", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q5",
        number: "5",
        label: "A unidade importa solventes?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["importa_solventes", "produtos_quimicos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q6",
        number: "6",
        label: "A unidade utiliza pilhas e baterias?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pilhas_baterias"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q7",
        number: "7",
        label: "Existem Poluentes Orgânicos Persistentes (POPs) no processo da unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pops", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q8",
        number: "8",
        label: "A unidade realiza testes com combustíveis não especificados?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["testes_combustiveis"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q9",
        number: "9",
        label: "A unidade utiliza algum produto classificado como remediador?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["produto_remediador"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q10",
        number: "10",
        label:
          "Os trabalhadores estão sujeitos a exposição ocupacional de produtos químicos que contenham benzeno?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["benzeno", "produtos_perigosos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q11",
        number: "11",
        label: "A unidade faz uso de substância controlada pelo Protocolo de Montreal?",
        type: "multi",
        options: [
          {
            id: "materia_prima",
            label:
              "Utiliza substâncias controladas como matéria-prima no processo produtivo, manufatura, fitossanitário, laboratorial ou farmacêutico",
            tags: ["protocolo_montreal", "produtos_quimicos"],
          },
          {
            id: "ar_refrigeracao",
            label: "Utiliza em aparelhos de ar condicionado ou de refrigeração",
            tags: ["protocolo_montreal", "ar_refrigeracao"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q12",
        number: "12",
        label: "A unidade produz produtos biológicos terminados?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["produtos_biologicos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q13",
        number: "13",
        label:
          "A unidade produz ou importa drogas, medicamentos, produtos intermediários e/ou insumos farmacêuticos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["medicamentos_insumos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q14",
        number: "14",
        label: "A unidade comercializa/utiliza produtos pré-medidos, sob a forma de aerossol?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["aerossol"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q15",
        number: "15",
        label: "A unidade fabrica e/ou importa produtos de higiene pessoal, cosméticos e perfumes?",
        type: "multi",
        options: [
          { id: "importa", label: "Importa", tags: ["cosmeticos_importa"] },
          { id: "fabrica", label: "Fabrica", tags: ["cosmeticos_fabrica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q16",
        number: "16",
        label: "A unidade fabrica e/ou realiza análise de eficácia de medicamentos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["analise_medicamentos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q17",
        number: "17",
        label:
          "A unidade possui área com potencial ou suspeita de contaminação das águas superficiais, subterrâneas, do solo ou realiza atividades que possam gerar tal contaminação?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["area_contaminada"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q18",
        number: "18",
        label: "Indique quais os produtos a unidade fabrica/produz:",
        type: "multi",
        options: produtosQuimicosOptions("fab", PROD_QUIM_FAB_ARM),
      },
      {
        id: "qui.q19",
        number: "19",
        label: "Indique quais os produtos a unidade importa:",
        type: "multi",
        options: produtosQuimicosOptions("imp", PROD_QUIM_IMP),
      },
      {
        id: "qui.q20",
        number: "20",
        label: "Indique quais os produtos químicos a unidade comercializa:",
        type: "multi",
        options: produtosQuimicosOptions("com", PROD_QUIM_COM),
      },
      {
        id: "qui.q21",
        number: "21",
        label: "Indique quais os produtos a unidade armazena:",
        type: "multi",
        options: produtosQuimicosOptions("arm", PROD_QUIM_FAB_ARM),
      },
      {
        id: "qui.q22",
        number: "22",
        label: "Indique quais os produtos químicos a unidade utiliza:",
        type: "multi",
        options: produtosQuimicosOptions("uti", PROD_QUIM_UTI),
      },
      {
        id: "qui.q22_1",
        number: "22.1",
        label: "A unidade utiliza solventes como matéria-prima para uso em seu processo produtivo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["solventes_materia_prima"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "qui.q23",
        number: "23",
        label:
          "A transportadora de resíduos/produtos perigosos contratada pela unidade realiza esse transporte somente dentro do estado?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transporte_perigosos_intraestadual"] },
          {
            id: "outros_estados",
            label: "Não, a transportadora transita em outros estados",
            tags: ["transporte_perigosos_interestadual"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 8 — Recursos Hídricos / Efluentes Líquidos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "recursos_hidricos",
    number: 8,
    title: "Recursos Hídricos / Efluentes Líquidos",
    questions: [
      {
        id: "agu.q1",
        number: "1",
        label: "A unidade está localizada em área de proteção a mananciais?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["area_protecao_mananciais"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q2",
        number: "2",
        label:
          "Há curso de água próximo ao site da empresa, de forma que haja intervenção ou interação com o mesmo?",
        type: "single",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "mais_200m", label: "A mais de 200 m", tags: ["curso_agua_distante"] },
          { id: "menos_200m", label: "A menos de 200 m", tags: ["curso_agua_proximo"] },
        ],
      },
      {
        id: "agu.q3",
        number: "3",
        label: "A unidade faz uso de recursos hídricos sujeito a outorga?",
        type: "multi",
        options: [
          { id: "sim", label: "Sim", tags: ["outorga_hidrica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "derivacao_captacao",
            label: "Derivação ou captação de parcela da água existente em corpo de água",
            tags: ["outorga_hidrica", "captacao_superficial"],
          },
          {
            id: "extracao_subterraneo",
            label: "Extração de água de aquífero subterrâneo para consumo final ou insumo",
            tags: ["outorga_hidrica", "captacao_subterranea"],
          },
          {
            id: "lancamento",
            label: "Lançamento em corpo de água de esgotos e demais resíduos líquidos ou gasosos",
            tags: ["outorga_hidrica", "lancamento_efluente"],
          },
          {
            id: "hidreletrico",
            label: "Aproveitamento dos potenciais hidrelétricos",
            tags: ["outorga_hidrica", "hidreletrico"],
          },
          {
            id: "outros_usos",
            label:
              "Outros usos que alterem o regime, a quantidade ou a qualidade da água existente em um corpo de água",
            tags: ["outorga_hidrica"],
          },
          {
            id: "usos_insignificantes",
            label: "Usos insignificantes de recursos hídricos",
            tags: ["usos_insignificantes_hidricos"],
          },
        ],
      },
      {
        id: "agu.q4",
        number: "4",
        label: "Indique qual(is) bacia(s) hidrográfica(s) a unidade está localizada:",
        type: "multi",
        options: [
          { id: "rio_mortes", label: "Bacia Hidrográfica do Rio das Mortes", tags: ["bacia_hidrografica"] },
          { id: "rio_cabacal", label: "Bacia Hidrográfica do Rio Cabaçal", tags: ["bacia_hidrografica"] },
          { id: "rio_piratinim", label: "Bacia Hidrográfica do Rio Piratinim", tags: ["bacia_hidrografica"] },
          { id: "rio_jaguaribe", label: "Bacia Hidrográfica do Rio Jaguaribe", tags: ["bacia_hidrografica"] },
          {
            id: "baixo_paraiba_sul",
            label: "Bacia Hidrográfica do Baixo Paraíba do Sul e Itabapoana",
            tags: ["bacia_hidrografica"],
          },
          { id: "macae_ostras", label: "Bacia Hidrográfica do Macaé e das Ostras", tags: ["bacia_hidrografica"] },
          { id: "rio_dois_rios", label: "Bacia Hidrográfica do Rio Dois Rios", tags: ["bacia_hidrografica"] },
          { id: "lagos_sao_joao", label: "Bacia Hidrográfica do Lagos São João", tags: ["bacia_hidrografica"] },
          { id: "guanabara", label: "Bacia Hidrográfica da Baía de Guanabara", tags: ["bacia_hidrografica"] },
          { id: "piabanha", label: "Bacia Hidrográfica da Piabanha", tags: ["bacia_hidrografica"] },
          {
            id: "medio_paraiba_sul",
            label: "Bacia Hidrográfica do Médio Paraíba do Sul",
            tags: ["bacia_hidrografica"],
          },
          { id: "guandu", label: "Bacia Hidrográfica do Guandu", tags: ["bacia_hidrografica"] },
          { id: "ilha_grande", label: "Bacia Hidrográfica da Baía da Ilha Grande", tags: ["bacia_hidrografica"] },
          { id: "rio_formoso", label: "Bacia Hidrográfica do Rio Formoso", tags: ["bacia_hidrografica"] },
          { id: "rio_paraibuna", label: "Bacia Hidrográfica do Rio Paraibuna", tags: ["bacia_hidrografica"] },
          { id: "rio_preto", label: "Bacia Hidrográfica do Rio Preto", tags: ["bacia_hidrografica"] },
          { id: "rio_muriae", label: "Bacia Hidrográfica do Rio Muriaé", tags: ["bacia_hidrografica"] },
          { id: "rio_pomba", label: "Bacia Hidrográfica do Rio Pomba", tags: ["bacia_hidrografica"] },
          { id: "alto_paraguai", label: "Bacia Hidrográfica do Alto Paraguai - BAP", tags: ["bacia_hidrografica"] },
          { id: "rio_meia_ponte", label: "Bacia Hidrográfica do Rio Meia Ponte", tags: ["bacia_hidrografica"] },
          { id: "rio_turvo", label: "Bacia Hidrográfica do Rio Turvo", tags: ["bacia_hidrografica"] },
          { id: "alto_parana", label: "Bacia Hidrográfica do Alto Rio Paraná", tags: ["bacia_hidrografica"] },
          {
            id: "tres_marias",
            label: "Bacia Hidrográfica do Entorno da Represa de Três Marias",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "afluentes_mucuri",
            label: "Bacia Hidrográfica dos Afluentes Mineiros do Rio Mucuri",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_piranga", label: "Bacia Hidrográfica do Rio Piranga", tags: ["bacia_hidrografica"] },
          { id: "rio_suacui", label: "Bacia Hidrográfica do Rio Suaçuí", tags: ["bacia_hidrografica"] },
          { id: "rio_para", label: "Bacia Hidrográfica do Rio Pará", tags: ["bacia_hidrografica"] },
          { id: "rio_manhuacu", label: "Bacia Hidrográfica do Rio Manhuaçu", tags: ["bacia_hidrografica"] },
          { id: "rio_caratinga", label: "Bacia Hidrográfica do Rio Caratinga", tags: ["bacia_hidrografica"] },
          { id: "rio_sao_mateus", label: "Bacia Hidrográfica do Rio São Mateus", tags: ["bacia_hidrografica"] },
          {
            id: "rio_santo_antonio",
            label: "Bacia Hidrográfica do Rio Santo Antônio",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_bezerra", label: "Bacia Hidrográfica do Rio Bezerra", tags: ["bacia_hidrografica"] },
          { id: "tocantins", label: "Bacia Hidrográfica do Tocantins", tags: ["bacia_hidrografica"] },
          { id: "platina", label: "Bacia Hidrográfica Platina", tags: ["bacia_hidrografica"] },
          { id: "amazonica", label: "Bacia Hidrográfica Amazônica", tags: ["bacia_hidrografica"] },
          { id: "rio_verde", label: "Bacia Hidrográfica do Rio Verde", tags: ["bacia_hidrografica"] },
          {
            id: "furnas",
            label: "Bacia Hidrográfica do Entorno do Reservatório de Furnas",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "vertentes_grande",
            label: "Bacia Hidrográfica Vertentes do Rio Grande",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_paranaiba", label: "Bacia Hidrográfica do Rio Paranaíba", tags: ["bacia_hidrografica"] },
          { id: "rio_sao_marcos", label: "Bacia Hidrográfica do Rio São Marcos", tags: ["bacia_hidrografica"] },
          { id: "outros", label: "Outros", tags: ["bacia_hidrografica_outros"] },
          { id: "rio_sao_miguel", label: "Bacia Hidrográfica do Rio São Miguel", tags: ["bacia_hidrografica"] },
          { id: "rio_itapemirim", label: "Bacia Hidrográfica do Rio Itapemirim", tags: ["bacia_hidrografica"] },
          { id: "rio_vermelho", label: "Bacia Hidrográfica do Rio Vermelho", tags: ["bacia_hidrografica"] },
          { id: "rio_pratagy", label: "Bacia Hidrográfica do Rio Pratagy", tags: ["bacia_hidrografica"] },
          { id: "rio_jucurucu", label: "Bacia Hidrográfica do Rio Jucuruçu", tags: ["bacia_hidrografica"] },
          { id: "rio_peixe", label: "Bacia Hidrográfica do Rio do Peixe", tags: ["bacia_hidrografica"] },
          {
            id: "baixo_pardo",
            label: "Bacia Hidrográfica do Baixo Pardo Grande",
            tags: ["bacia_hidrografica"],
          },
          { id: "mogi_guacu", label: "Bacia Hidrográfica do Rio Mogi Guaçu", tags: ["bacia_hidrografica"] },
          { id: "rio_uruguai", label: "Bacia Hidrográfica do Rio Uruguai", tags: ["bacia_hidrografica"] },
          {
            id: "rio_jucurucu_sul",
            label: "Bacia Hidrográfica do Rio Jucuruçu do Sul",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "rio_doce_barra_seca",
            label: "Bacia Hidrográfica do Rio Doce / Rio Barra Seca",
            tags: ["bacia_hidrografica"],
          },
          { id: "tiete_batalha", label: "Bacia Hidrográfica do Tietê Batalha", tags: ["bacia_hidrografica"] },
          { id: "tiete_jacare", label: "Bacia Hidrográfica do Tietê Jacaré", tags: ["bacia_hidrografica"] },
          {
            id: "ribeira_iguape",
            label: "Bacia Hidrográfica do Rio Ribeira de Iguape e Litoral Sul",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "paraopeba_paracatu",
            label: "Bacias Hidrográficas dos Rios Paraopeba e Paracatu",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "mantiqueira",
            label: "Bacia Hidrográfica da Serra da Mantiqueira",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "sapucai_grande",
            label: "Bacia Hidrográfica dos Rios Sapucaí Mirim/Grande",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "sete_lagoas",
            label: "Bacia Hidrográfica do Município de Sete Lagoas",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "grande_pequeno_mogi",
            label: "Bacias Hidrográficas dos Rios Grande, Pequeno e Mogi",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_pequeno", label: "Bacia Hidrográfica do Rio Pequeno", tags: ["bacia_hidrografica"] },
          {
            id: "metropolitana_fortaleza",
            label: "Bacias Hidrográficas da Região Metropolitana de Fortaleza",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "litoral_norte",
            label: "Bacias Hidrográficas do Litoral Norte",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_gravatai", label: "Bacia Hidrográfica do Rio Gravataí", tags: ["bacia_hidrografica"] },
          {
            id: "tocantins_araguaia",
            label: "Bacia Hidrográfica dos Rios Tocantins e Araguaia",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "sao_francisco",
            label: "Bacia Hidrográfica do Rio São Francisco",
            tags: ["bacia_hidrografica"],
          },
          { id: "das_velhas", label: "Bacia Hidrográfica do Rio Das Velhas", tags: ["bacia_hidrografica"] },
          {
            id: "cai_pardo_tramandai_guaiba",
            label: "Bacias Hidrográficas dos Rios Caí, Pardo, Tramandaí e do Lago Guaíba",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "sinos_gravatai",
            label: "Bacias Hidrográficas do Rio dos Sinos e do Rio Gravataí",
            tags: ["bacia_hidrografica"],
          },
          { id: "rio_salitre", label: "Bacia Hidrográfica do Rio Salitre", tags: ["bacia_hidrografica"] },
          { id: "alto_tiete", label: "Bacia Hidrográfica do Alto Tietê", tags: ["bacia_hidrografica"] },
          {
            id: "baixada_santista",
            label: "Bacias Hidrográficas da Baixada Santista",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "billings",
            label: "Bacia Hidrográfica do Reservatório Billings",
            tags: ["bacia_hidrografica"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "piracicaba_capivari_jundiai",
            label: "Bacias Hidrográficas dos Rios Piracicaba, Capivari e Jundiaí",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "paraiba_sul",
            label: "Bacia Hidrográfica do Rio Paraíba do Sul",
            tags: ["bacia_hidrografica"],
          },
          {
            id: "sorocaba_medio_tiete",
            label: "Bacia Hidrográfica do Rio Sorocaba e do Médio Tietê",
            tags: ["bacia_hidrografica"],
          },
        ],
      },
      {
        id: "agu.q5",
        number: "5",
        label: "A unidade realiza captação de recursos hídricos?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "superficial",
            label: "Curso d'água Superficial",
            tags: ["captacao_superficial"],
          },
          {
            id: "subterraneo",
            label: "Curso d'água Subterrâneo",
            tags: ["captacao_subterranea"],
          },
        ],
      },
      {
        id: "agu.q6",
        number: "6",
        label: "Existem bebedouros na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["bebedouros"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q6_1",
        number: "6.1",
        label: "Os bebedouros são classificados como:",
        type: "multi",
        showIf: { questionId: "agu.q6", anyOf: ["sim"] },
        options: [
          {
            id: "tradicionais",
            label: "Equipamentos Tradicionalmente Classificado Como Bebedouros",
            tags: ["bebedouros_tradicionais"],
          },
          {
            id: "agua_galao",
            label: "Pontos de fornecimento de água mineral envasada em galões",
            tags: ["bebedouros_galao"],
          },
        ],
      },
      {
        id: "agu.q7",
        number: "7",
        label:
          "A unidade gera efluentes líquidos e os encaminha para destinação direta ou indireta em corpo hídrico, ou realiza por conta própria o lançamento (direto ou indireto) de efluentes em curso d'água?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["efluentes_corpo_hidrico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q8",
        number: "8",
        label:
          "A unidade realiza o lançamento direto ou indireto de efluentes líquidos (não domésticos) em rede pública de esgoto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["efluentes_rede_publica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q9",
        number: "9",
        label: "A unidade faz captação da água da chuva?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["captacao_chuva"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q10",
        number: "10",
        label: "A unidade contrata caminhão pipa?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["caminhao_pipa"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q11",
        number: "11",
        label: "Há estação de tratamento de efluentes industriais?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["etei"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q12",
        number: "12",
        label: "Existe estação de tratamento de esgoto sanitário?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ete"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q13",
        number: "13",
        label: "Há estação de tratamento de água?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["eta"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q14",
        number: "14",
        label: "Há caixas separadoras de água e óleo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["caixa_separadora_agua_oleo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q15",
        number: "15",
        label: "A unidade possui fossa séptica?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["fossa_septica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q16",
        number: "16",
        label: "A unidade reutiliza água?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["reuso_agua"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "agu.q17",
        number: "17",
        label: "A unidade possui sistema de irrigação agrícola?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["irrigacao_agricola"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 9 — Emissões Atmosféricas
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "emissoes_atmosfericas",
    number: 9,
    title: "Emissões Atmosféricas",
    questions: [
      {
        id: "atm.q1",
        number: "1",
        label: "A unidade possui fontes fixas e/ou móveis de poluição do ar?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "fixas", label: "Fontes Fixas", tags: ["emissoes", "fontes_fixas"] },
          { id: "moveis", label: "Fontes Móveis", tags: ["emissoes", "fontes_moveis"] },
        ],
      },
      {
        id: "atm.q2",
        number: "2",
        label: "A unidade possui incinerador de resíduos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["incinerador", "emissoes"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q3",
        number: "3",
        label: "Há armazenamento de material fragmentado ou particulado na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["material_particulado"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q4",
        number: "4",
        label:
          "Existem áreas que apresentem risco de inalação de contaminantes nocivos no ar (poeiras, fumos, névoas, gases e vapores) e/ou risco de inalação de ar com deficiência de oxigênio?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["risco_inalacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q5",
        number: "5",
        label: "Existem aparelhos de ar condicionado na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ar_condicionado"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q6",
        number: "6",
        label: "São realizadas atividades de pintura na empresa?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["atividades_pintura"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q6_1",
        number: "6.1",
        label:
          "Há cobertura de superfícies realizadas por aspersão, tais como pintura ou aplicação de verniz a revólver?",
        type: "single",
        showIf: { questionId: "atm.q6", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["pintura_aspersao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "atm.q6_2",
        number: "6.2",
        label: "A unidade possui cabine de pintura?",
        type: "single",
        showIf: { questionId: "atm.q6", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["cabine_pintura"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 10 — Resíduos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "residuos",
    number: 10,
    title: "Resíduos",
    questions: [
      {
        id: "res.q1",
        number: "1",
        label: "A unidade está sujeita a implementação da logística reversa?",
        type: "multi",
        options: [
          { id: "consumidores", label: "Consumidores", tags: ["logistica_reversa", "consumidores"] },
          { id: "comerciantes", label: "Comerciantes", tags: ["logistica_reversa", "comerciantes"] },
          { id: "distribuidores", label: "Distribuidores", tags: ["logistica_reversa", "distribuidores"] },
          { id: "fabricantes", label: "Fabricantes", tags: ["logistica_reversa", "fabricantes"] },
          { id: "importadores", label: "Importadores", tags: ["logistica_reversa", "importadores"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q2",
        number: "2",
        label: "A unidade realiza coleta de lixo seletiva?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["coleta_seletiva"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q3",
        number: "3",
        label: "A unidade envia resíduos para co-processamento ou possui fornos de clínquer?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["coprocessamento"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q4",
        number: "4",
        label: "A unidade envia resíduos para incineração?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["incineracao_residuos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q5",
        number: "5",
        label: "A unidade envia resíduos para aterro?",
        type: "multi",
        options: [
          { id: "sanitario", label: "Aterro Sanitário", tags: ["aterro_sanitario"] },
          { id: "controlado", label: "Aterro Controlado", tags: ["aterro_controlado"] },
          { id: "lixao", label: "Lixão", tags: ["lixao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "industrial", label: "Aterro Industrial", tags: ["aterro_industrial"] },
        ],
      },
      {
        id: "res.q6",
        number: "6",
        label: "A unidade gera resíduos de serviço de saúde (ambulatoriais)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["rss"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q7",
        number: "7",
        label: "A unidade gera resíduos de óleo lubrificante?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["oleo_lubrificante_residuo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q8",
        number: "8",
        label: "A unidade realiza ou encaminha resíduos para compostagem?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["compostagem_realiza"] },
          { id: "encaminha", label: "Encaminha", tags: ["compostagem_encaminha"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q9",
        number: "9",
        label: "A unidade está sujeita à elaboração de inventário de resíduos sólidos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["inventario_residuos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q10",
        number: "10",
        label: "A unidade gera resíduos da construção civil?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["residuos_construcao_civil"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q11",
        number: "11",
        label: "A unidade possui aterro sanitário ou controlado?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "sanitario", label: "Aterro Sanitário", tags: ["aterro_proprio_sanitario"] },
          { id: "controlado", label: "Aterro Controlado", tags: ["aterro_proprio_controlado"] },
          { id: "industrial", label: "Aterro Industrial", tags: ["aterro_proprio_industrial"] },
        ],
      },
      {
        id: "res.q12",
        number: "12",
        label: "A unidade gera resíduos perigosos conforme classificação prevista na NBR 10004?",
        type: "single",
        options: [
          {
            id: "sim",
            label: "Sim",
            tags: ["residuos_perigosos", "produtos_perigosos", "nbr_10004"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q13",
        number: "13",
        label: "A unidade realiza a importação de algum tipo de resíduo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["importacao_residuo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "res.q14",
        number: "14",
        label: "A unidade realiza a exportação de algum tipo de resíduo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["exportacao_residuo"] },
          { id: "nao", label: "Não" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 11 — Equipamentos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "equipamentos",
    number: 11,
    title: "Equipamentos",
    questions: [
      {
        id: "equ.q1",
        number: "1",
        label:
          "A unidade possui medidores de gás natural, biometano e GLP (quando em sua fase gasosa)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["medidores_gas"] },
          { id: "nao", label: "Não" },
        ],
      },
      {
        id: "equ.q2",
        number: "2",
        label:
          "A empresa utiliza 'drone' para fins de controle ambiental e mapeamento aéreo (barragem, floresta, reservas aquáticas, etc.)?",
        type: "single",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "sim", label: "Sim", tags: ["drone"] },
        ],
      },
      {
        id: "equ.q3",
        number: "3",
        label: "A unidade possui tanques metálicos de armazenamento?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["tanques_metalicos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q4",
        number: "4",
        label: "A unidade possui caldeiras?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["caldeiras"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q5",
        number: "5",
        label: "Existem fontes de radiação ou há geração rejeitos radioativos?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "ionizante",
            label: "Fonte Ionizante (ex: Equipamentos Gamagrafia, Raio-X, Radioativos Em Geral)",
            tags: ["radiacao_ionizante"],
          },
          { id: "nao_ionizante", label: "Fonte Não Ionizante (ex: Solda)", tags: ["radiacao_nao_ionizante"] },
          { id: "rejeitos", label: "Geração de Rejeitos Radioativos", tags: ["rejeitos_radioativos"] },
        ],
      },
      {
        id: "equ.q6",
        number: "6",
        label: "A unidade realiza a manutenção de equipamentos e maquinários em suas instalações?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["manutencao_propria"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q7",
        number: "7",
        label: "A unidade possui vasos sob pressão?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["vasos_pressao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q7_1",
        number: "7.1",
        label: "A empresa utiliza vasos sob pressão ou caldeiras de fabricação seriada (em série)?",
        type: "single",
        showIf: { questionId: "equ.q7", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["vasos_pressao_seriada"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q7_2",
        number: "7.2",
        label: "A unidade possui Serviço Próprio de Inspeção de Equipamentos (SPIE)?",
        type: "single",
        showIf: { questionId: "equ.q7", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["spie"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q8",
        number: "8",
        label: "Quais as máquinas/equipamentos são utilizados na unidade?",
        type: "multi",
        options: [
          { id: "motores_trifasicos", label: "Motores elétricos trifásicos", tags: ["motores_trifasicos"] },
          { id: "prensas", label: "Prensas e similares", tags: ["prensas", "nr_12"] },
          {
            id: "cestas_aereas",
            label:
              "Cestas aéreas ou cestos acoplados para elevação de pessoas e realização de trabalho em altura",
            tags: ["cestas_aereas", "trabalho_altura"],
          },
          {
            id: "agricola_florestal",
            label: "Máquinas e implementos para uso agrícola e florestal",
            tags: ["maquinas_agricolas", "nr_12"],
          },
          {
            id: "injetoras_plasticos",
            label: "Injetoras de materiais plásticos",
            tags: ["injetoras_plasticos", "nr_12"],
          },
          {
            id: "acougue",
            label: "Máquinas para açougue, mercearia, bares e restaurantes",
            tags: ["maquinas_acougue", "nr_12"],
          },
          { id: "motosserras", label: "Motosserras", tags: ["motosserras", "nr_12"] },
          {
            id: "transportadores",
            label: "Transportadores de materiais",
            tags: ["transportadores", "nr_12"],
          },
          { id: "gruas", label: "Gruas", tags: ["gruas", "nr_12"] },
          { id: "cestos_suspensos", label: "Cestos suspensos", tags: ["cestos_suspensos"] },
          { id: "moedor_carne", label: "Moedor de carne", tags: ["moedor_carne", "nr_12"] },
          { id: "amaciador_bife", label: "Amaciador de bife", tags: ["amaciador_bife", "nr_12"] },
          { id: "moinho_rosca", label: "Moinho para farinha de rosca", tags: ["moinho_rosca", "nr_12"] },
          { id: "serra_fita", label: "Serra de fita", tags: ["serra_fita", "nr_12"] },
          { id: "fatiadoras", label: "Fatiadoras para pães", tags: ["fatiadoras", "nr_12"] },
          { id: "modeladoras", label: "Modeladoras", tags: ["modeladoras", "nr_12"] },
          { id: "laminadoras", label: "Laminadoras", tags: ["laminadoras", "nr_12"] },
          { id: "cilindros", label: "Cilindros", tags: ["cilindros", "nr_12"] },
          { id: "batedeira", label: "Batedeira", tags: ["batedeira", "nr_12"] },
          { id: "amassadeira", label: "Amassadeira", tags: ["amassadeira", "nr_12"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q9",
        number: "9",
        label: "Existem na empresa Estações Rádio Base (ERBs) fixas de telecomunicação?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["erb_telecomunicacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q10",
        number: "10",
        label:
          "A unidade possui/instala torres de energia elétrica, antenas, mastros, linhas elétricas de transmissão próximo a aeroportos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["torres_aeroporto"] },
          { id: "nao", label: "Não" },
        ],
      },
      {
        id: "equ.q11",
        number: "11",
        label: "Quais os equipamentos de combate a incêndio?",
        type: "multi",
        options: [
          { id: "porta_corta_fogo", label: "Porta Corta-fogo", tags: ["porta_corta_fogo"] },
          { id: "mangueiras", label: "Mangueiras", tags: ["mangueiras_incendio"] },
          { id: "hidrante", label: "Hidrante", tags: ["hidrante"] },
          { id: "espuma", label: "Sistema de Proteção Por Espuma", tags: ["espuma"] },
          { id: "extintor", label: "Extintor", tags: ["extintor"] },
          { id: "iluminacao_emergencia", label: "Iluminação de Emergência", tags: ["iluminacao_emergencia"] },
          { id: "chuveiros_automaticos", label: "Chuveiros Automáticos", tags: ["sprinklers"] },
          { id: "alarme", label: "Alarme", tags: ["alarme_incendio"] },
          { id: "escada_seguranca", label: "Escada de Segurança", tags: ["escada_seguranca"] },
          { id: "mangotinho", label: "Mangote ou Mangotinho", tags: ["mangotinho"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "controle_fumaca", label: "Sistema ou Medidas de Controle de Fumaça", tags: ["controle_fumaca"] },
          { id: "gases_fixo", label: "Sistema Fixo de Gases", tags: ["sistema_gases"] },
        ],
      },
      {
        id: "equ.q12",
        number: "12",
        label: "Existe SPDA (Sistema de Proteção contra Descargas Atmosféricas)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["spda"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q13",
        number: "13",
        label:
          "Existe projeto de combate e prevenção a incêndios aprovado pelo Corpo de Bombeiros (PCPI)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pcpi"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q14",
        number: "14",
        label: "Existem elevadores para transporte de pessoas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["elevador_pessoas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q15",
        number: "15",
        label: "Existem elevadores para transporte de carga?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["elevador_carga"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q16",
        number: "16",
        label: "Existe aeródromo na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["aerodromo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q17",
        number: "17",
        label: "A unidade possui Mecanismos de Desenvolvimento Limpo (MDL)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["mdl"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q18",
        number: "18",
        label: "A unidade importa máquinas ou maquinismos com risco de periculosidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["importa_maquinas_periculosas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q19",
        number: "19",
        label: "Existem geladeiras na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["geladeiras"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q20",
        number: "20",
        label: "A unidade realiza jateamento de areia a seco em algum de seus processos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["jateamento_areia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q21",
        number: "21",
        label:
          "A unidade utiliza aparelhos de comunicação emissores de radiofrequência nas suas atividades?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["radiofrequencia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "equ.q22",
        number: "22",
        label: "A unidade possui cabine audiométrica?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["cabine_audiometrica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 12 — Energia
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "energia",
    number: 12,
    title: "Energia",
    questions: [
      {
        id: "ene.q1",
        number: "1",
        label: "Quais as fontes de energia que a unidade utiliza?",
        type: "multi",
        options: [
          { id: "outra", label: "Outra", tags: ["energia_outra"] },
          { id: "vapor", label: "Vapor", tags: ["energia_vapor"] },
          { id: "pneumatica", label: "Pneumática", tags: ["energia_pneumatica"] },
          { id: "termeletrica", label: "Termelétrica", tags: ["energia_termeletrica"] },
          { id: "glp", label: "GLP - Gás Liquefeito de Petróleo", tags: ["energia_glp"] },
          { id: "gas_natural", label: "Gás Natural", tags: ["energia_gas_natural"] },
          { id: "eolica", label: "Eólica", tags: ["energia_eolica"] },
          { id: "eletrica", label: "Elétrica", tags: ["energia_eletrica"] },
          { id: "solar", label: "Solar", tags: ["energia_solar"] },
        ],
      },
      {
        id: "ene.q2",
        number: "2",
        label: "A unidade possui inventário de emissões de carbono?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["inventario_carbono"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q3",
        number: "3",
        label: "A unidade possui algum projeto relacionado ao Protocolo de Kyoto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["protocolo_kyoto"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q4",
        number: "4",
        label: "A unidade realiza alguma das atividades abaixo relacionadas ao ramo de energia elétrica?",
        type: "multi",
        options: [
          {
            id: "permissionaria",
            label: "Permissionária/Concessionária Pública de Energia Elétrica",
            tags: ["concessionaria_energia"],
          },
          {
            id: "transformacao",
            label: "Transformação de Energia Elétrica",
            tags: ["transformacao_energia"],
          },
          {
            id: "distribuicao",
            label: "Distribuição (externa) de Energia Elétrica",
            tags: ["distribuicao_energia"],
          },
          { id: "transmissao", label: "Transmissão de Energia Elétrica", tags: ["transmissao_energia"] },
          {
            id: "geracao",
            label: "Geração/produção de Energia Elétrica (para distribuição externa ou comercialização)",
            tags: ["geracao_energia"],
          },
          { id: "comercializacao", label: "Comercialização de Energia Elétrica", tags: ["comercializacao_energia"] },
          { id: "somente_usuaria", label: "Não, é Somente Usuária de Energia Elétrica" },
        ],
      },
      {
        id: "ene.q5",
        number: "5",
        label: "A unidade possui fonte alternativa de energia?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["fonte_alternativa_energia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q5_1",
        number: "5.1",
        label:
          "A unidade possui centrais geradoras de energia termelétrica, eólica e de outras fontes alternativas de energia?",
        type: "multi",
        showIf: { questionId: "ene.q5", anyOf: ["sim"] },
        options: [
          { id: "termeletrica", label: "Termelétrica", tags: ["central_termeletrica"] },
          { id: "eolica", label: "Eólica", tags: ["central_eolica"] },
          { id: "outras", label: "Outras", tags: ["central_outras"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q6",
        number: "6",
        label: "A unidade possui em seu site alguma PCH (Pequena Central Hidrelétrica)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pch"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q7",
        number: "7",
        label:
          "A unidade possui sistema de gestão de energia/eficiência energética seguindo as diretrizes da ISO 50001:2011?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["iso_50001"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ene.q8",
        number: "8",
        label: "A unidade contrata energia elétrica por meio de uma das modalidades abaixo?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "acl",
            label: "Ambiente de Contratação Livre - ACL",
            tags: ["acl_energia"],
          },
          {
            id: "ler",
            label: "Leilões de Energia de Reserva (LER)",
            tags: ["ler_energia"],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 14 — Profissionais
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "profissionais",
    number: 14,
    title: "Profissionais",
    questions: [
      {
        id: "pro.q1",
        number: "1",
        label: "A unidade contrata trabalhador avulso?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["trabalhador_avulso"] },
          { id: "nao", label: "Não" },
        ],
      },
      {
        id: "pro.q2",
        number: "2",
        label:
          "Selecione os profissionais que fazem parte do quadro de empregados da unidade (cargos chave para o SGI, incluindo prestadores de serviço contínuos):",
        type: "multi",
        options: [
          { id: "assistente_social", label: "Assistente Social", tags: ["prof_assistente_social"] },
          { id: "sociologo", label: "Sociólogo", tags: ["prof_sociologo"] },
          { id: "tec_laboratorio", label: "Técnico de Laboratório", tags: ["prof_tec_laboratorio"] },
          { id: "piloto", label: "Piloto", tags: ["prof_piloto"] },
          { id: "tec_eletrotecnica", label: "Técnicos em Eletrotécnica", tags: ["prof_tec_eletrotecnica"] },
          { id: "aux_enfermagem", label: "Auxiliar de Enfermagem", tags: ["prof_aux_enfermagem"] },
          { id: "tec_enfermagem", label: "Técnico de Enfermagem", tags: ["prof_tec_enfermagem"] },
          { id: "tec_agricola", label: "Técnico Agrícola", tags: ["prof_tec_agricola"] },
          { id: "tec_industrial", label: "Técnico Industrial", tags: ["prof_tec_industrial"] },
          { id: "medico", label: "Médico", tags: ["prof_medico"] },
          { id: "fonoaudiologo", label: "Fonoaudiólogo", tags: ["prof_fonoaudiologo"] },
          { id: "enfermeiro", label: "Enfermeiro", tags: ["prof_enfermeiro"] },
          { id: "nutricionista", label: "Nutricionista", tags: ["prof_nutricionista"] },
          { id: "quimico", label: "Químico", tags: ["prof_quimico"] },
          { id: "fisioterapeuta", label: "Fisioterapeuta", tags: ["prof_fisioterapeuta"] },
          { id: "terapeuta_ocupacional", label: "Terapeuta Ocupacional", tags: ["prof_terapeuta_ocupacional"] },
          { id: "dentista", label: "Dentista", tags: ["prof_dentista"] },
          { id: "engenheiro", label: "Engenheiro", tags: ["prof_engenheiro"] },
          { id: "bombeiro_civil", label: "Bombeiro Civil", tags: ["prof_bombeiro_civil"] },
          { id: "advogado", label: "Advogado / Consultor Jurídico", tags: ["prof_advogado"] },
          { id: "biomedico", label: "Biomédico", tags: ["prof_biomedico"] },
          { id: "farmaceutico", label: "Farmacêutico", tags: ["prof_farmaceutico"] },
          { id: "radiologista", label: "Radiologista / Técnico de Raio X", tags: ["prof_radiologista"] },
          { id: "arquiteto", label: "Arquiteto", tags: ["prof_arquiteto"] },
          { id: "agronomo", label: "Agrônomo", tags: ["prof_agronomo"] },
          { id: "vet", label: "Médico Veterinário", tags: ["prof_veterinario"] },
          { id: "edu_fisica", label: "Profissional de Educação Física", tags: ["prof_edu_fisica"] },
          { id: "geografo", label: "Geógrafo", tags: ["prof_geografo"] },
          { id: "geologo", label: "Geólogo", tags: ["prof_geologo"] },
          { id: "psicologo", label: "Psicólogo", tags: ["prof_psicologo"] },
          { id: "biologo", label: "Biólogo", tags: ["prof_biologo"] },
          { id: "oceanografo", label: "Oceanógrafo", tags: ["prof_oceanografo"] },
          { id: "nenhum", label: "Nenhum dos Profissionais Listados" },
          {
            id: "tec_seguranca_trabalho",
            label: "Técnico de Segurança do Trabalho",
            tags: ["prof_tec_seguranca_trabalho"],
          },
        ],
      },
      {
        id: "pro.q3",
        number: "3",
        label: "São contratados estudantes em regime de estágio?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["estagiarios"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 15 — PCD
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "pcd",
    number: 15,
    title: "PCD",
    questions: [
      {
        id: "pcd.q1",
        number: "1",
        label: "A unidade possui mais de 100 empregados?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["mais_100_empregados", "cota_pcd"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "pcd.q2",
        number: "2",
        label: "A empresa contrata pessoa com deficiência (PCD)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pcd"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 16 — Saúde do Trabalhador
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "saude_trabalhador",
    number: 16,
    title: "Saúde do Trabalhador",
    questions: [
      {
        id: "sau.q1",
        number: "1",
        label: "Existem medicamentos para uso de funcionários na unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["medicamentos_uso_funcionarios"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q2",
        number: "2",
        label: "A unidade possui esfigmomanômetros?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["esfigmomanometros"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q3",
        number: "3",
        label: "A unidade contrata serviços de atendimento de urgência e emergência?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["urgencia_emergencia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q4",
        number: "4",
        label: "A unidade participa do PAT - Programa de Alimentação do Trabalhador?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["pat"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q5",
        number: "5",
        label: "A unidade contrata ou realiza a aplicação de vacinas em seus funcionários?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["vacinacao_funcionarios"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q6",
        number: "6",
        label: "A unidade realiza ou contrata transporte aeromédico?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transporte_aeromedico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q7",
        number: "7",
        label:
          "Há regime de trabalho para empregados que trabalham no interior de câmaras frigoríficas ou movimentando mercadorias em ambientes frios?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["camara_frigorifica", "ambiente_frio"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q8",
        number: "8",
        label: "Existem reservatórios de água potável no site da empresa?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["reservatorio_agua_potavel"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "sau.q9",
        number: "9",
        label: "A unidade possui ambulância?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ambulancia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 17 — Tipos de Trabalho Realizados Ou Contratados Junto A Terceiros
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "tipos_trabalho_terceiros",
    number: 17,
    title: "Tipos de Trabalho Realizados Ou Contratados Junto A Terceiros",
    questions: [
      {
        id: "ter.q1",
        number: "1",
        label:
          "A unidade realiza atividades (utilização, transporte, armazenamento, fabricação, processamento, acondicionamento, distribuição e comercialização) com hidrogênio ou seus derivados?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["hidrogenio"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q2",
        number: "2",
        label:
          "A unidade realiza suas atividades em recinto alfandegado ou sob regime aduaneiro especial?",
        type: "single",
        options: [
          { id: "realiza", label: "Realiza", tags: ["recinto_alfandegado"] },
          { id: "nao_aplica", label: "Não Realiza" },
        ],
      },
      {
        id: "ter.q3",
        number: "3",
        label: "É realizado trabalho em plataformas marítimas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["plataforma_maritima", "nr_37"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q4",
        number: "4",
        label:
          "A unidade realiza atividades que envolvam gás e óleo (extração, exploração, prospecção)?",
        type: "single",
        options: [
          { id: "realiza", label: "Realiza", tags: ["gas_oleo"] },
          { id: "nao_aplica", label: "Não Realiza" },
        ],
      },
      {
        id: "ter.q5",
        number: "5",
        label: "É realizado trabalho submerso?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["trabalho_submerso"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q6",
        number: "6",
        label: "Existe trabalho portuário envolvido com as atividades da unidade?",
        type: "multi",
        options: [
          {
            id: "contrata_porto_seco",
            label: "A empresa apenas contrata terceiro/fornecedor que realiza atividades em portos secos",
            tags: ["porto_seco_terceiros"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "atividades_porto_maritimo",
            label: "A empresa realiza suas atividades em portos marítimos",
            tags: ["porto_maritimo", "nr_29"],
          },
          {
            id: "administra_porto",
            label: "A empresa realiza administração e/ou operação de um porto marítimo",
            tags: ["administracao_porto", "nr_29"],
          },
          {
            id: "terceiriza_portuario",
            label: "A empresa apenas terceiriza trabalho portuário marítimo",
            tags: ["terceiriza_portuario"],
          },
          {
            id: "contrata_portuario",
            label: "A empresa apenas contrata fornecedores que realizam atividades em portos marítimos",
            tags: ["contrata_portuario"],
          },
          {
            id: "atividades_porto_seco",
            label: "A empresa realiza suas atividades em portos secos",
            tags: ["porto_seco"],
          },
        ],
      },
      {
        id: "ter.q7",
        number: "7",
        label: "A unidade realiza atividades que envolvam diretamente o trabalho aquaviário?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["trabalho_aquaviario", "nr_30"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q8",
        number: "8",
        label:
          "É realizado trabalho que envolve agricultura, pecuária, silvicultura ou exploração florestal?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "agricultura", label: "Agricultura", tags: ["agricultura", "nr_31"] },
          { id: "pecuaria", label: "Pecuária", tags: ["pecuaria", "nr_31"] },
          { id: "silvicultura", label: "Silvicultura", tags: ["silvicultura", "nr_31"] },
          { id: "exploracao_florestal", label: "Exploração Florestal", tags: ["exploracao_florestal", "nr_31"] },
        ],
      },
      {
        id: "ter.q9",
        number: "9",
        label: "Existe vigilância patrimonial / segurança privada?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["vigilancia_patrimonial"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q10",
        number: "10",
        label: "Há serviço de teleatendimento (telemarketing)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["telemarketing"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q11",
        number: "11",
        label: "A unidade executa obras em vias e logradouros públicos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["obras_via_publica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q12",
        number: "12",
        label: "A unidade disponibiliza vale-transporte a seus funcionários?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["vale_transporte"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q13",
        number: "13",
        label: "A unidade realiza ou contrata serviços de concretagem?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["concretagem"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q14",
        number: "14",
        label:
          "Existem atividades em que o manuseio/exposição de produtos nocivos à saúde possam contaminar uniformes e demandar lavanderia para higienização de uniformes/EPIs?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["lavanderia_uniforme_epi"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q15",
        number: "15",
        label: "A unidade contrata análises laboratoriais?",
        type: "multi",
        options: [
          {
            id: "potabilidade",
            label: "De Potabilidade de Água (microbiológica ou físico-química)",
            tags: ["analise_potabilidade"],
          },
          {
            id: "alimentos",
            label: "Em Alimentos (incluindo seus resíduos, embalagens etc.)",
            tags: ["analise_alimentos"],
          },
          {
            id: "ambientais",
            label:
              "Análises Ambientais (emissões atmosféricas, efluentes, solo, águas subterrâneas, superficiais)",
            tags: ["analise_ambiental"],
          },
          {
            id: "clinicas",
            label: "Análises Clínicas (amostras de paciente/funcionário, exames PCMSO)",
            tags: ["analise_clinica"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q16",
        number: "16",
        label:
          "A unidade realiza ou contrata atividades relacionadas à dragagem e/ou disposição final do material dragado?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["dragagem"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q17",
        number: "17",
        label:
          "A unidade fornece produtos e/ou serviços diretamente para o consumidor (residencial, pessoa física e/ou hipossuficiente, conforme CDC)?",
        type: "multi",
        options: [
          { id: "pessoa_fisica", label: "Pessoa Física", tags: ["consumidor_pessoa_fisica", "cdc"] },
          { id: "sim", label: "Sim", tags: ["consumidor_final", "cdc"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "ter.q18",
        number: "18",
        label:
          "A unidade possui ou contrata algum dos profissionais abaixo para realizar o controle de pragas e vetores?",
        type: "multi",
        options: [
          { id: "agronomo", label: "Agrônomo", tags: ["pragas_agronomo"] },
          { id: "biologo", label: "Biólogo", tags: ["pragas_biologo"] },
          { id: "quimico", label: "Químico", tags: ["pragas_quimico"] },
          { id: "engenheiro", label: "Engenheiro", tags: ["pragas_engenheiro"] },
          { id: "farmaceutico", label: "Farmacêutico", tags: ["pragas_farmaceutico"] },
          { id: "vet", label: "Médico Veterinário", tags: ["pragas_veterinario"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 18 — Normas Regulamentadoras (NR)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "normas_regulamentadoras",
    number: 18,
    title: "Normas Regulamentadoras - NR",
    questions: [
      {
        id: "nr.q1",
        number: "1",
        label:
          "Selecione as atividades aplicáveis à unidade relacionadas às Normas Regulamentadoras (NR) do Ministério do Trabalho. Obs: NRs 01-10, 17 e 23-28 são disponibilizadas obrigatoriamente.",
        type: "multi",
        options: [
          {
            id: "nr_37",
            label: "Realiza atividades em Plataformas de Petróleo (NR 37)",
            tags: ["nr_37"],
          },
          {
            id: "nr_11",
            label:
              "Possui empilhadeiras, ponte rolantes, talhas ou equipamentos de movimentação de material (NR 11)",
            tags: ["nr_11"],
          },
          {
            id: "nr_12",
            label:
              "Possui máquinas e/ou equipamentos autopropelidos (prensas, injetoras, fornos industriais, compressores, etc.) (NR 12)",
            tags: ["nr_12"],
          },
          { id: "nr_14", label: "Possui forno industrial (NR 14)", tags: ["nr_14"] },
          {
            id: "nr_15",
            label: "Conforme descrito no PGR, realiza atividades e operações insalubres (NR 15)",
            tags: ["nr_15"],
          },
          {
            id: "nr_16",
            label:
              "Realiza atividades perigosas (eletricidade em alta tensão, combustíveis, inflamáveis, explosivos, etc.) que determinem o pagamento do adicional de periculosidade (NR 16)",
            tags: ["nr_16"],
          },
          { id: "nr_19", label: "Utiliza explosivos (NR 19)", tags: ["nr_19"] },
          {
            id: "nr_20",
            label: "Consome líquidos combustíveis e inflamáveis (NR 20)",
            tags: ["nr_20"],
          },
          { id: "nr_22", label: "Realiza atividade de mineração (NR 22)", tags: ["nr_22", "mineracao"] },
          { id: "nr_29", label: "Realiza trabalho portuário (NR 29)", tags: ["nr_29"] },
          { id: "nr_30", label: "Realiza trabalho aquaviário (NR 30)", tags: ["nr_30"] },
          {
            id: "nr_31",
            label: "Realiza atividades de agricultura, pecuária, silvicultura ou exploração florestal (NR 31)",
            tags: ["nr_31"],
          },
          { id: "nr_33", label: "Possui espaço confinado (NR 33)", tags: ["nr_33"] },
          {
            id: "nr_34",
            label: "Realiza atividade de construção e reparação naval (NR 34)",
            tags: ["nr_34"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "nr_36",
            label: "Realiza atividades de abate e processamento de carnes e derivados (NR 36)",
            tags: ["nr_36"],
          },
        ],
      },
      {
        id: "nr.q2",
        number: "2",
        label: "A unidade realiza ou contrata atividades envolvendo trabalho em altura?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["trabalho_altura", "nr_35"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 19 — Mineração
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "mineracao",
    number: 19,
    title: "Mineração",
    questions: [
      {
        id: "min.q1",
        number: "1",
        label: "A unidade realiza atividade minerária? Em qual classe?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          {
            id: "classe_ix",
            label: "Classe IX - Jazidas de Águas Subterrâneas",
            tags: ["mineracao", "mineracao_classe_ix"],
          },
          {
            id: "classe_viii",
            label: "Classe VIII - Jazidas de Águas Minerais",
            tags: ["mineracao", "mineracao_classe_viii"],
          },
          {
            id: "classe_vii",
            label: "Classe VII - Jazidas de Minerais Industriais",
            tags: ["mineracao", "mineracao_classe_vii"],
          },
          {
            id: "classe_vi",
            label: "Classe VI - Jazidas de Gemas e Pedras Ornamentais",
            tags: ["mineracao", "mineracao_classe_vi"],
          },
          {
            id: "classe_v",
            label: "Classe V - Jazidas de Rochas Betuminosas e Pirobetuminosas",
            tags: ["mineracao", "mineracao_classe_v"],
          },
          {
            id: "classe_iv",
            label: "Classe IV - Jazidas de Combustíveis Fósseis Sólidos",
            tags: ["mineracao", "mineracao_classe_iv"],
          },
          {
            id: "classe_iii",
            label: "Classe III - Jazidas de Fertilizantes",
            tags: ["mineracao", "mineracao_classe_iii"],
          },
          {
            id: "classe_ii",
            label: "Classe II - Jazidas de Substâncias Minerais de Emprego Imediato na Construção Civil",
            tags: ["mineracao", "mineracao_classe_ii"],
          },
          {
            id: "classe_i",
            label: "Classe I - Jazidas de Substâncias Minerais Metalíferas",
            tags: ["mineracao", "mineracao_classe_i"],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 20 — Pesagem
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "pesagem",
    number: 20,
    title: "Pesagem",
    questions: [
      {
        id: "pes.q1",
        number: "1",
        label: "A unidade utiliza instrumentos de pesagem?",
        type: "multi",
        options: [
          { id: "nao_aplica", label: "Não Se Aplica" },
          { id: "automatico", label: "Automático", tags: ["pesagem_automatico"] },
          { id: "nao_automatico", label: "Não-automáticos", tags: ["pesagem_nao_automatico"] },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Theme 21 — LGPD
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "lgpd",
    number: 21,
    title: "LGPD",
    questions: [
      {
        id: "lgpd.q1",
        number: "1",
        label: "A unidade fornece produtos e/ou serviços diretamente ao consumidor (pessoa física)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["lgpd", "consumidor_pessoa_fisica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
];
