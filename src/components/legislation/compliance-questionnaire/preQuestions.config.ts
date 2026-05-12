import type { Question } from "./types";

// Pré-questionário curto que define o escopo da unidade. As respostas
// alimentam suppressionRules.ts para suprimir temas/perguntas fora do
// escopo no questionário principal.
//
// IDs prefixados com `pre.` para não colidir com IDs do main form
// (lic.q1, inst.q5, flo.q2 etc).
//
// Mantenha curto (~7 perguntas) — o objetivo é triagem, não detalhamento.
export const PRE_COMPLIANCE_QUESTIONS: Question[] = [
  {
    id: "pre.ocupacao",
    number: "1",
    label: "Como a unidade ocupa seu espaço físico?",
    type: "single",
    options: [
      { id: "propria", label: "Imóvel próprio com infraestrutura própria" },
      { id: "alugado_infra_propria", label: "Alugado, mas a empresa opera e gerencia a infraestrutura" },
      { id: "cliente", label: "Dentro da infraestrutura do cliente" },
      { id: "condominio", label: "Condomínio industrial ou parque empresarial (infra compartilhada)" },
      { id: "escritorio", label: "Escritório administrativo apenas — sem operação industrial" },
    ],
  },
  {
    id: "pre.responsabilidade_infra",
    number: "2",
    label:
      "Quem é responsável pela infraestrutura predial (AVCB, alvará de funcionamento, instalações elétricas, prevenção de incêndio)?",
    type: "single",
    options: [
      { id: "gabardo", label: "A própria unidade / empresa" },
      { id: "host", label: "Cliente / condomínio / locador (host)" },
      { id: "compartilhada", label: "Responsabilidade compartilhada" },
    ],
  },
  {
    id: "pre.atividade",
    number: "3",
    label: "Quais atividades acontecem na unidade? (selecione todas que se aplicam)",
    type: "multi",
    options: [
      { id: "administrativa", label: "Administrativa" },
      { id: "comercial", label: "Comercial" },
      { id: "armazenagem", label: "Armazenagem / logística" },
      { id: "industrial_fabril", label: "Industrial / fabril" },
      { id: "oficina_manutencao", label: "Oficina / manutenção" },
      { id: "mineracao", label: "Mineração" },
    ],
  },
  {
    id: "pre.frota",
    number: "4",
    label: "A unidade gerencia frota ou movimentação de cargas?",
    type: "single",
    options: [
      { id: "sim_propria", label: "Sim — frota própria" },
      { id: "sim_terceirizada", label: "Sim — frota terceirizada gerenciada pela unidade" },
      { id: "nao", label: "Não" },
    ],
  },
  {
    id: "pre.quimicos",
    number: "5",
    label:
      "Há manuseio, armazenamento ou uso de produtos químicos, perigosos ou inflamáveis sob controle da unidade?",
    type: "single",
    options: [
      { id: "sim", label: "Sim" },
      { id: "apenas_no_host", label: "Existem na infra, mas são responsabilidade do host" },
      { id: "nao", label: "Não" },
    ],
  },
  {
    id: "pre.efluentes_residuos",
    number: "6",
    label:
      "Pelo que a unidade é responsável em termos ambientais? (selecione todas que se aplicam)",
    type: "multi",
    options: [
      { id: "efluentes", label: "Efluentes líquidos / recursos hídricos" },
      { id: "residuos_solidos", label: "Resíduos sólidos" },
      { id: "emissoes_atmosfericas", label: "Emissões atmosféricas" },
      {
        id: "nenhum",
        label: "Nenhum — tudo é gerenciado pelo host (cliente/condomínio)",
      },
    ],
  },
  {
    id: "pre.colaboradores",
    number: "7",
    label: "Quem são os trabalhadores presentes na unidade?",
    type: "single",
    options: [
      { id: "proprios", label: "Apenas colaboradores próprios (CLT/PJ direto)" },
      { id: "proprios_terceiros", label: "Colaboradores próprios e terceiros" },
      { id: "apenas_terceiros_host", label: "Apenas terceiros (mão de obra do host)" },
    ],
  },
  {
    id: "pre.licenciamento_responsavel",
    number: "8",
    label: "A empresa é a responsável legal pelo licenciamento ambiental desta unidade?",
    type: "single",
    options: [
      { id: "sim", label: "Sim" },
      { id: "nao", label: "Não — responsabilidade do host" },
      { id: "nao_aplica", label: "Não se aplica" },
    ],
  },
];
