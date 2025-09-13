import { supabase } from "@/integrations/supabase/client"

export interface CenarioDescarbonizacao {
  id: string
  nome: string
  descricao: string
  periodo_projecao: { inicio: Date; fim: Date }
  acoes: AcaoDescarbonizacao[]
  baseline: {
    emissoes_totais: number
    emissoes_por_escopo: { escopo1: number; escopo2: number; escopo3: number }
    custo_atual_energia: number
    score_esg_atual: number
  }
  resultados_projetados: ResultadosProjecao
}

export interface AcaoDescarbonizacao {
  id: string
  categoria: 'energia' | 'transporte' | 'processos' | 'materiais' | 'edificacoes'
  tipo: string
  nome: string
  parametros: Record<string, any>
  cronograma: { inicio: Date; fim: Date }
  investimento_estimado: number
  reducao_co2e_estimada: number
  status: 'planejada' | 'em_implementacao' | 'implementada'
}

export interface ResultadosProjecao {
  reducao_emissoes: {
    total_tco2e: number
    por_escopo: { escopo1: number; escopo2: number; escopo3: number }
    por_ano: Array<{ ano: number; reducao: number }>
  }
  impacto_financeiro: {
    investimento_total: number
    economia_anual: number
    payback_simples: number
    vpl_10_anos: number
  }
  score_esg: {
    score_atual: number
    score_projetado: number
    melhoria: number
    comparacao_setor: string
  }
  riscos_identificados: RiscoProjecao[]
  oportunidades: OportunidadeProjecao[]
}

export interface RiscoProjecao {
  id: string
  categoria: 'regulatorio' | 'tecnologico' | 'financeiro' | 'operacional'
  descricao: string
  probabilidade: 'baixa' | 'media' | 'alta'
  impacto: 'baixo' | 'medio' | 'alto'
  mitigacao: string
}

export interface OportunidadeProjecao {
  id: string
  categoria: 'financeira' | 'comercial' | 'reputacional' | 'operacional'
  descricao: string
  potencial_valor: number
  prazo_realizacao: string
}

// Biblioteca de ações pré-configuradas
export const BIBLIOTECA_ACOES = {
  energia: [
    {
      tipo: "energia-solar",
      nome: "Instalação de Energia Solar",
      descricao: "Implementar sistema fotovoltaico",
      parametros_padrao: { potencia_kw: 100, area_m2: 600 },
      fator_reducao_co2e: 0.45, // kg CO2e por kWh gerado
      custo_por_kw: 4200
    },
    {
      tipo: "energia-eolica", 
      nome: "Energia Eólica",
      descricao: "Instalação de turbinas eólicas",
      parametros_padrao: { potencia_kw: 50, altura_m: 30 },
      fator_reducao_co2e: 0.42,
      custo_por_kw: 5800
    },
    {
      tipo: "eficiencia-energetica",
      nome: "Eficiência Energética",
      descricao: "Melhorias em sistemas de climatização, iluminação LED",
      parametros_padrao: { reducao_percentual: 20 },
      fator_reducao_co2e: 0.48,
      custo_por_kwh_economizado: 0.35
    }
  ],
  transporte: [
    {
      tipo: "eletrificacao-frota",
      nome: "Eletrificação da Frota",
      descricao: "Substituição de veículos a combustão por elétricos",
      parametros_padrao: { numero_veiculos: 5, tipo_veiculo: "leve" },
      fator_reducao_co2e: 2.1, // tCO2e por veículo/ano
      custo_por_veiculo: 85000
    },
    {
      tipo: "otimizacao-rotas",
      nome: "Otimização de Rotas",
      descricao: "Sistema inteligente de roteamento logístico",
      parametros_padrao: { reducao_km: 15 },
      fator_reducao_co2e: 0.32,
      custo_implementacao: 45000
    }
  ],
  processos: [
    {
      tipo: "captura-carbono",
      nome: "Captura de Carbono",
      descricao: "Sistema de captura e armazenamento de CO2",
      parametros_padrao: { capacidade_tco2_ano: 100 },
      fator_reducao_co2e: 1.0,
      custo_por_tco2: 150
    }
  ]
}

// Cálculo de projeções
export const calcularProjecoesCenario = (cenario: CenarioDescarbonizacao): ResultadosProjecao => {
  let reducao_total = 0
  let investimento_total = 0
  let economia_anual = 0

  // Calcular impacto de cada ação
  cenario.acoes.forEach(acao => {
    reducao_total += acao.reducao_co2e_estimada
    investimento_total += acao.investimento_estimado
    
    // Estimar economia baseada na redução de emissões
    // Assumindo custo de R$ 150 por tCO2e evitada
    economia_anual += acao.reducao_co2e_estimada * 150
  })

  const payback_simples = investimento_total > 0 ? investimento_total / economia_anual : 0
  const score_melhoria = (reducao_total / cenario.baseline.emissoes_totais) * 100
  const score_projetado = Math.min(cenario.baseline.score_esg_atual + score_melhoria, 100)

  return {
    reducao_emissoes: {
      total_tco2e: reducao_total,
      por_escopo: {
        escopo1: reducao_total * 0.4,
        escopo2: reducao_total * 0.5, 
        escopo3: reducao_total * 0.1
      },
      por_ano: Array.from({ length: 7 }, (_, i) => ({
        ano: 2024 + i,
        reducao: reducao_total * (i + 1) / 7 // Rampeamento linear
      }))
    },
    impacto_financeiro: {
      investimento_total,
      economia_anual,
      payback_simples,
      vpl_10_anos: economia_anual * 10 - investimento_total
    },
    score_esg: {
      score_atual: cenario.baseline.score_esg_atual,
      score_projetado,
      melhoria: score_projetado - cenario.baseline.score_esg_atual,
      comparacao_setor: score_projetado > 70 ? "Top 10%" : score_projetado > 50 ? "Acima da média" : "Abaixo da média"
    },
    riscos_identificados: [
      {
        id: "risco-1",
        categoria: "regulatorio",
        descricao: "Mudanças na regulamentação de energia renovável",
        probabilidade: "media",
        impacto: "medio",
        mitigacao: "Acompanhar consultas públicas da ANEEL"
      }
    ],
    oportunidades: [
      {
        id: "oportunidade-1", 
        categoria: "financeira",
        descricao: "Acesso a linhas de crédito verde",
        potencial_valor: investimento_total * 0.3,
        prazo_realizacao: "6 meses"
      }
    ]
  }
}

// Serviços de API
export const salvarCenario = async (cenario: CenarioDescarbonizacao) => {
  // Aqui salvaria no Supabase
  console.log("Salvando cenário:", cenario)
}

export const carregarCenarios = async (): Promise<CenarioDescarbonizacao[]> => {
  // Aqui carregaria do Supabase
  return []
}

export const gerarRecomendacoesIA = async (cenario: CenarioDescarbonizacao): Promise<string[]> => {
  // Aqui chamaria edge function de IA
  return [
    "Considere priorizar energia solar devido ao alto potencial de ROI",
    "A eletrificação da frota pode ser escalonada gradualmente",
    "Implemente medições para validar os resultados projetados"
  ]
}