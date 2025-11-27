export interface ISOTemplate {
  id: string;
  name: string;
  standard: string;
  version: string;
  clause_reference: string;
  description: string;
  questions: {
    id: string;
    question: string;
    clause: string;
    guidance: string;
    evidence_required: string[];
  }[];
}

export const ISO_TEMPLATES: ISOTemplate[] = [
  {
    id: 'iso-9001-2015-context',
    name: 'Contexto da Organização',
    standard: 'ISO 9001:2015',
    version: '2015',
    clause_reference: '4',
    description: 'Checklist para auditoria do contexto organizacional e partes interessadas',
    questions: [
      {
        id: '4.1',
        question: 'A organização determinou as questões externas e internas relevantes para seu propósito e direção estratégica?',
        clause: '4.1 - Entendendo a organização e seu contexto',
        guidance: 'Verificar se existe análise SWOT, PESTEL ou similar documentada',
        evidence_required: ['Análise de contexto', 'Atas de reunião estratégica']
      },
      {
        id: '4.2',
        question: 'A organização determinou as partes interessadas relevantes e seus requisitos?',
        clause: '4.2 - Entendendo as necessidades e expectativas',
        guidance: 'Verificar matriz de partes interessadas e requisitos identificados',
        evidence_required: ['Matriz de partes interessadas', 'Registro de requisitos']
      },
      {
        id: '4.3',
        question: 'O escopo do SGQ está determinado, documentado e disponível?',
        clause: '4.3 - Determinando o escopo do SGQ',
        guidance: 'Verificar documento de escopo com exclusões justificadas',
        evidence_required: ['Documento de escopo', 'Manual da qualidade']
      },
      {
        id: '4.4',
        question: 'Os processos necessários para o SGQ foram determinados e suas interações?',
        clause: '4.4 - Sistema de gestão da qualidade',
        guidance: 'Verificar mapa de processos e caracterização',
        evidence_required: ['Mapa de processos', 'Caracterização de processos']
      }
    ]
  },
  {
    id: 'iso-9001-2015-leadership',
    name: 'Liderança e Comprometimento',
    standard: 'ISO 9001:2015',
    version: '2015',
    clause_reference: '5',
    description: 'Checklist para auditoria de liderança e política da qualidade',
    questions: [
      {
        id: '5.1',
        question: 'A alta direção demonstra liderança e comprometimento com o SGQ?',
        clause: '5.1 - Liderança e comprometimento',
        guidance: 'Verificar evidências de envolvimento em análises críticas',
        evidence_required: ['Atas de análise crítica', 'Registro de participação']
      },
      {
        id: '5.2',
        question: 'A política da qualidade está estabelecida, documentada e comunicada?',
        clause: '5.2 - Política',
        guidance: 'Verificar se a política é apropriada ao propósito e contexto',
        evidence_required: ['Política da qualidade', 'Comprovantes de divulgação']
      },
      {
        id: '5.3',
        question: 'As responsabilidades e autoridades estão atribuídas e comunicadas?',
        clause: '5.3 - Papéis, responsabilidades e autoridades',
        guidance: 'Verificar organograma e descrições de cargo',
        evidence_required: ['Organograma', 'Descrições de cargo', 'Matriz de responsabilidades']
      }
    ]
  },
  {
    id: 'iso-14001-2015-context',
    name: 'Contexto da Organização - Ambiental',
    standard: 'ISO 14001:2015',
    version: '2015',
    clause_reference: '4',
    description: 'Checklist para auditoria ambiental do contexto organizacional',
    questions: [
      {
        id: '4.1',
        question: 'A organização determinou questões externas e internas relevantes ao SGA?',
        clause: '4.1 - Entendendo a organização e seu contexto',
        guidance: 'Verificar análise de aspectos ambientais e requisitos legais',
        evidence_required: ['Levantamento de aspectos ambientais', 'Análise de contexto']
      },
      {
        id: '4.2',
        question: 'As necessidades e expectativas das partes interessadas foram determinadas?',
        clause: '4.2 - Necessidades e expectativas',
        guidance: 'Incluir comunidades, órgãos ambientais, clientes',
        evidence_required: ['Matriz de partes interessadas', 'Requisitos de compliance']
      },
      {
        id: '4.3',
        question: 'O escopo do SGA está definido considerando aspectos ambientais significativos?',
        clause: '4.3 - Escopo do SGA',
        guidance: 'Verificar se todos os aspectos significativos estão no escopo',
        evidence_required: ['Documento de escopo', 'Matriz de aspectos e impactos']
      }
    ]
  },
  {
    id: 'iso-45001-2018-risks',
    name: 'Perigos e Riscos de SST',
    standard: 'ISO 45001:2018',
    version: '2018',
    clause_reference: '6',
    description: 'Checklist para identificação de perigos e avaliação de riscos',
    questions: [
      {
        id: '6.1.1',
        question: 'Os perigos de SST foram identificados de forma contínua e proativa?',
        clause: '6.1.1 - Identificação de perigos',
        guidance: 'Verificar metodologia de identificação de perigos',
        evidence_required: ['Inventário de perigos', 'APR/Análise preliminar de riscos']
      },
      {
        id: '6.1.2',
        question: 'Os riscos de SST foram avaliados e oportunidades identificadas?',
        clause: '6.1.2 - Avaliação de riscos',
        guidance: 'Verificar matriz de riscos e hierarquia de controles',
        evidence_required: ['Matriz de riscos', 'Plano de controle de riscos']
      },
      {
        id: '6.1.3',
        question: 'Os requisitos legais e outros requisitos aplicáveis foram determinados?',
        clause: '6.1.3 - Requisitos legais',
        guidance: 'Verificar registro atualizado de legislação de SST',
        evidence_required: ['Registro de requisitos legais', 'Avaliação de conformidade legal']
      }
    ]
  },
  {
    id: 'iso-39001-2012-planning',
    name: 'Planejamento de Segurança Viária',
    standard: 'ISO 39001:2012',
    version: '2012',
    clause_reference: '4',
    description: 'Checklist para sistema de gestão de segurança viária',
    questions: [
      {
        id: '4.1',
        question: 'A organização identificou fatores de risco de segurança viária?',
        clause: '4.1 - Contexto e fatores de risco',
        guidance: 'Verificar análise de acidentes e estatísticas de trânsito',
        evidence_required: ['Análise de acidentes', 'Estatísticas de segurança viária']
      },
      {
        id: '4.2',
        question: 'Fatores de desempenho de segurança viária foram estabelecidos?',
        clause: '4.2 - Fatores de desempenho',
        guidance: 'Verificar KPIs de segurança (frequência, gravidade)',
        evidence_required: ['Dashboard de indicadores', 'Metas de segurança viária']
      },
      {
        id: '4.3',
        question: 'Existe um plano de ação para melhorar o desempenho de segurança viária?',
        clause: '4.3 - Plano de ação',
        guidance: 'Verificar planos de treinamento, manutenção preventiva de veículos',
        evidence_required: ['Plano de ação de segurança', 'Programa de treinamento de motoristas']
      }
    ]
  }
];
