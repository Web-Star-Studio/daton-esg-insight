import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AIInsightRequest {
  card_type: string
  card_data: any
  context?: any
}

interface AIRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  action_type: string
  estimated_impact: string
}

interface AIInsight {
  id: string
  type: string
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  recommendations: AIRecommendation[]
  data: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const { card_type, card_data, context } = await req.json() as AIInsightRequest

    const insights = await generateInsights(card_type, card_data, profile, supabaseClient)

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-insights-engine function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateInsights(cardType: string, cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  switch (cardType) {
    case 'esg_score':
      return await generateESGInsights(cardData, profile, supabaseClient)
    case 'emissions_total':
      return await generateEmissionsInsights(cardData, profile, supabaseClient)
    case 'license_compliance':
      return await generateLicenseInsights(cardData, profile, supabaseClient)
    default:
      return []
  }
}

async function generateESGInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const score = cardData.overall_esg_score || 0

  if (score < 50) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'esg_improvement',
      title: 'Score ESG Baixo Detectado',
      message: `Seu score ESG atual (${score}) está abaixo da média do setor. Recomendamos ações imediatas.`,
      priority: 'high',
      recommendations: [
        {
          title: 'Implementar Programa de Sustentabilidade',
          description: 'Desenvolva um programa estruturado de sustentabilidade com metas claras',
          priority: 'high',
          action_type: 'program_implementation',
          estimated_impact: 'Aumento de 15-25 pontos no score ESG'
        }
      ],
      data: { current_score: score, target_score: 70 }
    })
  }

  return insights
}

async function generateEmissionsInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  const totalEmissions = cardData.total_emissions || 0

  if (totalEmissions > 50000) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'emissions_alert',
      title: 'Emissões Elevadas Detectadas',
      message: `Suas emissões totais (${totalEmissions.toLocaleString()} tCO₂e) estão acima da média. Considere ações de redução.`,
      priority: 'high',
      recommendations: [
        {
          title: 'Implementar Eficiência Energética',
          description: 'Projetos de eficiência podem reduzir emissões em 15-30%',
          priority: 'high',
          action_type: 'efficiency_project',
          estimated_impact: 'Redução de 15-30% nas emissões'
        }
      ],
      data: { current_emissions: totalEmissions }
    })
  }

  return insights
}

async function generateLicenseInsights(cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = []

  const { data: expiringLicenses } = await supabaseClient
    .from('licenses')
    .select('*')
    .eq('company_id', profile.company_id)
    .lt('expiration_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString())

  if (expiringLicenses && expiringLicenses.length > 0) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'license_expiration',
      title: 'Licenças Próximas do Vencimento',
      message: `${expiringLicenses.length} licença(s) vencem nos próximos 90 dias.`,
      priority: 'medium',
      recommendations: [
        {
          title: 'Iniciar Processo de Renovação',
          description: 'Inicie imediatamente os processos de renovação das licenças',
          priority: 'high',
          action_type: 'license_renewal',
          estimated_impact: 'Evita interrupções operacionais'
        }
      ],
      data: { expiring_count: expiringLicenses.length }
    })
  }

  return insights
}