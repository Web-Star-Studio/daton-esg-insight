import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KPI {
  key: string;
  label: string;
  value: string;
  trend: number;
  unit: string;
}

interface PillarData {
  score: number;
  kpis: KPI[];
}

interface ESGDashboardResponse {
  overall_esg_score: number;
  environmental: PillarData;
  social: PillarData;
  governance: PillarData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Get user's company
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Usuario não autenticado')
    }

    // Get user's company ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      throw new Error('Empresa do usuário não encontrada')
    }

    const companyId = profile.company_id

    // === ENVIRONMENTAL PILLAR ===
    
    // Get total emissions from calculated_emissions via activity_data and emission_sources
    const { data: emissions } = await supabaseClient
      .from('calculated_emissions')
      .select(`
        total_co2e,
        activity_data!inner(
          emission_sources!inner(company_id)
        )
      `)
      .eq('activity_data.emission_sources.company_id', companyId)

    const totalEmissions = emissions?.reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0

    // Get waste recycling rate
    const { data: wasteData } = await supabaseClient
      .from('waste_logs')
      .select('quantity, final_treatment_type')
      .eq('company_id', companyId)

    const recycledWaste = wasteData?.filter(w => 
      w.final_treatment_type?.toLowerCase().includes('reciclagem') || 
      w.final_treatment_type?.toLowerCase().includes('reutilização')
    ).reduce((sum, w) => sum + w.quantity, 0) || 0
    
    const totalWaste = wasteData?.reduce((sum, w) => sum + w.quantity, 0) || 1
    const recyclingRate = Math.round((recycledWaste / totalWaste) * 100)

    // Get license compliance
    const { data: licenses } = await supabaseClient
      .from('licenses')
      .select('status')
      .eq('company_id', companyId)

    const activeLicenses = licenses?.filter(l => l.status === 'Ativa').length || 0
    const totalLicenses = licenses?.length || 1
    const complianceRate = Math.round((activeLicenses / totalLicenses) * 100)

    // Calculate Environmental Score
    const environmentalScore = Math.round(
      (complianceRate * 0.4) + (recyclingRate * 0.35) + (Math.max(0, 100 - (totalEmissions / 100)) * 0.25)
    )

    // === SOCIAL PILLAR ===
    
    const { data: socialMetrics } = await supabaseClient
      .from('esg_metrics')
      .select('metric_key, value, unit')
      .eq('company_id', companyId)
      .in('metric_key', ['employee_turnover_rate', 'training_hours_per_employee', 'diversity_index'])
      .order('period', { ascending: false })

    const turnoverRate = socialMetrics?.find(m => m.metric_key === 'employee_turnover_rate')?.value || 15
    const trainingHours = socialMetrics?.find(m => m.metric_key === 'training_hours_per_employee')?.value || 20
    const diversityIndex = socialMetrics?.find(m => m.metric_key === 'diversity_index')?.value || 5

    // Calculate Social Score (lower turnover is better, higher training and diversity is better)
    const socialScore = Math.round(
      (Math.max(0, 100 - turnoverRate * 2) * 0.4) + 
      (Math.min(100, (trainingHours / 40) * 100) * 0.35) + 
      ((diversityIndex / 10) * 100 * 0.25)
    )

    // === GOVERNANCE PILLAR ===
    
    // Get goals on track percentage
    const { data: goals } = await supabaseClient
      .from('goals')
      .select('deadline_date, status')
      .eq('company_id', companyId)

    const goalsOnTrack = goals?.filter(g => 
      g.status === 'No Caminho Certo' || g.status === 'Atingida'
    ).length || 0
    const totalGoals = goals?.length || 1
    const goalsOnTrackPercent = Math.round((goalsOnTrack / totalGoals) * 100)

    const { data: governanceMetrics } = await supabaseClient
      .from('esg_metrics')
      .select('metric_key, value')
      .eq('company_id', companyId)
      .in('metric_key', ['policy_compliance_rate', 'board_diversity_percent'])

    const policyCompliance = governanceMetrics?.find(m => m.metric_key === 'policy_compliance_rate')?.value || 90
    const boardDiversity = governanceMetrics?.find(m => m.metric_key === 'board_diversity_percent')?.value || 30

    // Calculate Governance Score
    const governanceScore = Math.round(
      (goalsOnTrackPercent * 0.5) + (policyCompliance * 0.3) + (boardDiversity * 0.2)
    )

    // === OVERALL ESG SCORE ===
    const overallESGScore = Math.round(
      (environmentalScore * 0.4) + (socialScore * 0.3) + (governanceScore * 0.3)
    )

    const response: ESGDashboardResponse = {
      overall_esg_score: overallESGScore,
      environmental: {
        score: environmentalScore,
        kpis: [
          {
            key: 'total_emissions',
            label: 'Emissões Totais',
            value: `${totalEmissions.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`,
            trend: -1.1,
            unit: 'tCO₂e'
          },
          {
            key: 'recycling_rate',
            label: 'Taxa de Reciclagem',
            value: `${recyclingRate}`,
            trend: 2.5,
            unit: '%'
          },
          {
            key: 'license_compliance',
            label: 'Licenças em Conformidade',
            value: `${complianceRate}`,
            trend: 0,
            unit: '%'
          }
        ]
      },
      social: {
        score: socialScore,
        kpis: [
          {
            key: 'turnover_rate',
            label: 'Taxa de Rotatividade',
            value: `${turnoverRate}`,
            trend: -0.5,
            unit: '%'
          },
          {
            key: 'training_hours',
            label: 'Horas de Treinamento/Colab.',
            value: `${trainingHours}`,
            trend: 3,
            unit: 'h'
          },
          {
            key: 'diversity_index',
            label: 'Índice de Diversidade',
            value: `${diversityIndex.toFixed(1)}/10`,
            trend: 0.2,
            unit: 'índice'
          }
        ]
      },
      governance: {
        score: governanceScore,
        kpis: [
          {
            key: 'goals_on_track',
            label: '% Metas no Prazo',
            value: `${goalsOnTrackPercent}`,
            trend: 5,
            unit: '%'
          },
          {
            key: 'policy_compliance',
            label: 'Conformidade com Políticas',
            value: `${policyCompliance}`,
            trend: 0,
            unit: '%'
          },
          {
            key: 'board_diversity',
            label: 'Diversidade do Conselho',
            value: `${boardDiversity}`,
            trend: 2,
            unit: '%'
          }
        ]
      }
    }

    console.log('ESG Dashboard data calculated:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in esg-dashboard function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})