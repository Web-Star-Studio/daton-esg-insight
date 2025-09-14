import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface KPI {
  key: string
  label: string
  value: string
  trend: number
  unit: string
}

interface PillarData {
  score: number
  kpis: KPI[]
}

interface ESGDashboardResponse {
  overall_esg_score: number
  environmental: PillarData
  social: PillarData
  governance: PillarData
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    // Get user and company
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const company_id = profile.company_id

    // Calculate Environmental Score
    const environmental = await calculateEnvironmentalScore(supabaseClient, company_id)
    
    // Calculate Social Score
    const social = await calculateSocialScore(supabaseClient, company_id)
    
    // Calculate Governance Score
    const governance = await calculateGovernanceScore(supabaseClient, company_id)

    // Calculate Overall ESG Score (weighted average)
    const overall_esg_score = Math.round(
      (environmental.score * 0.4) + (social.score * 0.3) + (governance.score * 0.3)
    )

    const response: ESGDashboardResponse = {
      overall_esg_score,
      environmental,
      social,
      governance
    }

    console.log('ESG Dashboard data calculated:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in esg-dashboard function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function calculateEnvironmentalScore(supabase: any, company_id: string): Promise<PillarData> {
  // Get total emissions
  const { data: emissions } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      activity_data!inner(
        emission_source!inner(company_id)
      )
    `)
    .eq('activity_data.emission_source.company_id', company_id)

  const totalEmissions = emissions?.reduce((sum: number, item: any) => sum + (item.total_co2e || 0), 0) || 0

  // Get recycling data
  const { data: wasteData } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', company_id)

  const recyclingRate = 0 // Placeholder for now

  // Get license compliance
  const { data: licenses } = await supabase
    .from('licenses')
    .select('*')
    .eq('company_id', company_id)

  const activeLicenses = licenses?.filter((l: any) => l.status === 'Ativa').length || 0
  const totalLicenses = licenses?.length || 1
  const licenseCompliance = Math.round((activeLicenses / totalLicenses) * 100)

  const environmentalKPIs: KPI[] = [
    {
      key: 'total_emissions',
      label: 'Emissões Totais',
      value: totalEmissions.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
      trend: -1.1,
      unit: 'tCO₂e'
    },
    {
      key: 'recycling_rate',
      label: 'Taxa de Reciclagem',
      value: recyclingRate.toString(),
      trend: 2.5,
      unit: '%'
    },
    {
      key: 'license_compliance',
      label: 'Licenças em Conformidade',
      value: licenseCompliance.toString(),
      trend: 0,
      unit: '%'
    }
  ]

  // Calculate environmental score based on performance
  let environmentalScore = 0
  if (totalEmissions < 10000) environmentalScore += 40
  else if (totalEmissions < 50000) environmentalScore += 20
  
  if (recyclingRate > 50) environmentalScore += 30
  else if (recyclingRate > 25) environmentalScore += 15

  if (licenseCompliance > 90) environmentalScore += 30
  else if (licenseCompliance > 70) environmentalScore += 15

  return {
    score: Math.min(environmentalScore, 100),
    kpis: environmentalKPIs
  }
}

async function calculateSocialScore(supabase: any, company_id: string): Promise<PillarData> {
  const socialKPIs: KPI[] = [
    {
      key: 'turnover_rate',
      label: 'Taxa de Rotatividade',
      value: '12',
      trend: -0.5,
      unit: '%'
    },
    {
      key: 'training_hours',
      label: 'Horas de Treinamento/Colab.',
      value: '24',
      trend: 3,
      unit: 'h'
    },
    {
      key: 'diversity_index',
      label: 'Índice de Diversidade',
      value: '6.8/10',
      trend: 0.2,
      unit: 'índice'
    }
  ]

  return {
    score: 68,
    kpis: socialKPIs
  }
}

async function calculateGovernanceScore(supabase: any, company_id: string): Promise<PillarData> {
  // Get goals data
  const { data: goals } = await supabase
    .from('goals')
    .select('status')
    .eq('company_id', company_id)

  const onTrackGoals = goals?.filter((g: any) => g.status === 'No Caminho Certo').length || 0
  const totalGoals = goals?.length || 1
  const goalsOnTrack = Math.round((onTrackGoals / totalGoals) * 100)

  const governanceKPIs: KPI[] = [
    {
      key: 'goals_on_track',
      label: '% Metas no Prazo',
      value: goalsOnTrack.toString(),
      trend: 5,
      unit: '%'
    },
    {
      key: 'policy_compliance',
      label: 'Conformidade com Políticas',
      value: '95',
      trend: 0,
      unit: '%'
    },
    {
      key: 'board_diversity',
      label: 'Diversidade do Conselho',
      value: '40',
      trend: 2,
      unit: '%'
    }
  ]

  return {
    score: 87,
    kpis: governanceKPIs
  }
}