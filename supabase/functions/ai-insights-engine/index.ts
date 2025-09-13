import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIInsightRequest {
  card_type: string
  card_data: any
  context?: any
}

interface BenchmarkData {
  current_value: string
  sector_average: string
  best_practice: string
  percentile: string
}

interface AIRecommendation {
  id: string
  title: string
  description: string
  action_type: 'quick_win' | 'strategic' | 'urgent'
  estimated_impact: string
  implementation_effort: 'low' | 'medium' | 'high'
  target_module?: string
}

interface AIInsight {
  id: string
  card_type: string
  insight_type: 'contextual' | 'comparative' | 'predictive' | 'recommendation'
  message: string
  detailed_analysis?: string
  recommendations: AIRecommendation[]
  confidence: number
  benchmark_data?: BenchmarkData
  trigger_condition: string
  created_at: Date
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user info for context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's company info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id, companies(*)')
      .eq('id', user.id)
      .single()

    const { card_type, card_data, context }: AIInsightRequest = await req.json()

    console.log('Processing AI insights for:', { card_type, card_data, user_id: user.id })

    const insights = await generateInsights(card_type, card_data, profile, supabaseClient)

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ai-insights-engine:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function generateInsights(
  cardType: string, 
  cardData: any, 
  profile: any, 
  supabaseClient: any
): Promise<AIInsight[]> {
  const insights: AIInsight[] = []

  switch (cardType) {
    case 'esg_score':
      insights.push(...await generateESGInsights(cardData, profile, supabaseClient))
      break
    case 'emissions_total':
      insights.push(...await generateEmissionsInsights(cardData, profile, supabaseClient))
      break
    case 'emissions_scope':
      insights.push(...await generateScopeInsights(cardData, profile, supabaseClient))
      break
    case 'waste_generation':
      insights.push(...await generateWasteInsights(cardData, profile, supabaseClient))
      break
    case 'license_compliance':
      insights.push(...await generateLicenseInsights(cardData, profile, supabaseClient))
      break
    default:
      console.log('Unknown card type:', cardType)
  }

  return insights
}

async function generateESGInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const esgScore = cardData.overall_esg_score || 0

  // Comparative insight
  const sectorAverage = 45 // Mock sector average
  if (esgScore < sectorAverage) {
    insights.push({
      id: crypto.randomUUID(),
      card_type: 'esg_score',
      insight_type: 'comparative',
      message: `Abaixo da média setorial (${sectorAverage})`,
      detailed_analysis: `Seu score ESG de ${esgScore} está ${sectorAverage - esgScore} pontos abaixo da média setorial. O maior gap está nas emissões de Escopo 2, que representam uma oportunidade de melhoria significativa.`,
      recommendations: [
        {
          id: crypto.randomUUID(),
          title: 'Auditoria Energética Completa',
          description: 'Realizar auditoria energética para identificar oportunidades de eficiência e redução do Escopo 2',
          action_type: 'strategic',
          estimated_impact: '+8-12 pontos no score ESG',
          implementation_effort: 'medium',
          target_module: '/ativos'
        },
        {
          id: crypto.randomUUID(),
          title: 'Migração para Energia Renovável',
          description: 'Avaliar migração parcial para energia solar/eólica para reduzir emissões de Escopo 2',
          action_type: 'strategic',
          estimated_impact: '+10-15 pontos no score ESG',
          implementation_effort: 'high',
          target_module: '/planejador-cenarios'
        }
      ],
      confidence: 0.85,
      benchmark_data: {
        current_value: `${esgScore} pontos`,
        sector_average: `${sectorAverage} pontos`,
        best_practice: '65+ pontos',
        percentile: 'Abaixo do percentil 40'
      },
      trigger_condition: 'esg_score < sector_average',
      created_at: new Date()
    })
  }

  return insights
}

async function generateEmissionsInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const currentEmissions = cardData.total || 0
  const previousEmissions = cardData.previous || currentEmissions * 0.9 // Mock previous value

  // Trend analysis
  if (currentEmissions > previousEmissions * 1.15) { // 15% increase
    const increase = ((currentEmissions - previousEmissions) / previousEmissions * 100).toFixed(1)
    
    insights.push({
      id: crypto.randomUUID(),
      card_type: 'emissions_total',
      insight_type: 'predictive',
      message: `+${increase}% vs. período anterior ⚠️`,
      detailed_analysis: `Detectamos um aumento significativo de ${increase}% nas emissões totais. Esta tendência pode comprometer suas metas de descarbonização e impactar negativamente o score ESG.`,
      recommendations: [
        {
          id: crypto.randomUUID(),
          title: 'Investigação de Anomalias',
          description: 'Verificar equipamentos e processos que podem estar causando o aumento nas emissões',
          action_type: 'urgent',
          estimated_impact: 'Identificar 60-80% das causas',
          implementation_effort: 'low',
          target_module: '/auditoria'
        },
        {
          id: crypto.randomUUID(),
          title: 'Plano de Ação Imediato',
          description: 'Criar cenário de redução para retomar trajetória de descarbonização',
          action_type: 'strategic',
          estimated_impact: 'Redução de 10-20% em 6 meses',
          implementation_effort: 'medium',
          target_module: '/planejador-cenarios'
        }
      ],
      confidence: 0.92,
      trigger_condition: 'emissions_increase > 15%',
      created_at: new Date()
    })
  }

  return insights
}

async function generateScopeInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const scope2Percentage = cardData.scope2_percentage || 0

  // Scope 2 dominance insight
  if (scope2Percentage > 60) {
    insights.push({
      id: crypto.randomUUID(),
      card_type: 'emissions_scope',
      insight_type: 'recommendation',
      message: `Escopo 2 representa ${scope2Percentage}% das emissões`,
      detailed_analysis: `O Escopo 2 (energia elétrica) é dominante em seu perfil de emissões. Esta é uma excelente oportunidade para descarbonização através de eficiência energética e migração para fontes renováveis.`,
      recommendations: [
        {
          id: crypto.randomUUID(),
          title: 'Programa de Eficiência Energética',
          description: 'Implementar medidas de eficiência: LED, HVAC eficiente, gestão inteligente',
          action_type: 'quick_win',
          estimated_impact: 'Redução de 15-25% no Escopo 2',
          implementation_effort: 'low',
          target_module: '/ativos'
        },
        {
          id: crypto.randomUUID(),
          title: 'Energia Solar Corporativa',
          description: 'Avaliar instalação de sistema fotovoltaico ou migração para energia renovável',
          action_type: 'strategic',
          estimated_impact: 'Redução de 70-90% no Escopo 2',
          implementation_effort: 'high',
          target_module: '/planejador-cenarios'
        }
      ],
      confidence: 0.88,
      trigger_condition: 'scope2_percentage > 60%',
      created_at: new Date()
    })
  }

  return insights
}

async function generateWasteInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const recyclingRate = cardData.recycling_rate || 0

  // Low recycling rate insight
  if (recyclingRate < 50) {
    insights.push({
      id: crypto.randomUUID(),
      card_type: 'waste_generation',
      insight_type: 'comparative',
      message: `Taxa de reciclagem ${recyclingRate}% (abaixo da média)`,
      detailed_analysis: `Sua taxa de reciclagem de ${recyclingRate}% está abaixo da média setorial de 65%. Há potencial para melhorar significativamente através de melhores práticas de separação e parcerias.`,
      recommendations: [
        {
          id: crypto.randomUUID(),
          title: 'Programa de Educação Ambiental',
          description: 'Capacitar colaboradores sobre separação correta e redução de resíduos',
          action_type: 'quick_win',
          estimated_impact: 'Aumento de 10-15% na reciclagem',
          implementation_effort: 'low'
        },
        {
          id: crypto.randomUUID(),
          title: 'Parceria com Cooperativas',
          description: 'Estabelecer parcerias com cooperativas locais para otimizar coleta seletiva',
          action_type: 'strategic',
          estimated_impact: 'Aumento de 20-30% na reciclagem',
          implementation_effort: 'medium',
          target_module: '/residuos'
        }
      ],
      confidence: 0.79,
      benchmark_data: {
        current_value: `${recyclingRate}%`,
        sector_average: '65%',
        best_practice: '85%+',
        percentile: 'Percentil 25'
      },
      trigger_condition: 'recycling_rate < 50%',
      created_at: new Date()
    })
  }

  return insights
}

async function generateLicenseInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const complianceRate = cardData.compliance_rate || 0
  const upcomingExpirations = cardData.upcoming_expirations || 0

  // License expiration warning
  if (upcomingExpirations > 0) {
    insights.push({
      id: crypto.randomUUID(),
      card_type: 'license_compliance',
      insight_type: 'predictive',
      message: `${upcomingExpirations} licenças vencem em 60 dias`,
      detailed_analysis: `Identificamos ${upcomingExpirations} licenças que vencem nos próximos 60 dias. É crítico iniciar os processos de renovação para evitar não conformidades.`,
      recommendations: [
        {
          id: crypto.randomUUID(),
          title: 'Cronograma de Renovações',
          description: 'Criar cronograma detalhado para renovação de todas as licenças próximas ao vencimento',
          action_type: 'urgent',
          estimated_impact: 'Prevenir não conformidades',
          implementation_effort: 'low',
          target_module: '/licenciamento'
        },
        {
          id: crypto.randomUUID(),
          title: 'Sistema de Alertas Automáticos',
          description: 'Implementar sistema de alertas automáticos para licenças com vencimento em 90, 60 e 30 dias',
          action_type: 'strategic',
          estimated_impact: 'Melhorar gestão preventiva',
          implementation_effort: 'medium',
          target_module: '/compliance'
        }
      ],
      confidence: 0.95,
      trigger_condition: 'upcoming_expirations > 0',
      created_at: new Date()
    })
  }

  return insights
}