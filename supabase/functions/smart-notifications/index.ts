import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    switch (action) {
      case 'check_goal_deadlines':
        await checkGoalDeadlines(supabase)
        break
      case 'check_compliance_tasks':
        await checkComplianceTasks(supabase)
        break
      case 'check_emission_spikes':
        await checkEmissionSpikes(supabase)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkGoalDeadlines(supabase: any) {
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('status', 'Ativa')
    .not('target_date', 'is', null)

  for (const goal of goals || []) {
    const daysUntilDeadline = Math.ceil(
      (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
      // Check if alert already sent
      const { data: existingAlert } = await supabase
        .from('notifications')
        .select('id')
        .eq('category', 'goal')
        .eq('type', 'warning')
        .ilike('message', `%${goal.title}%`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (!existingAlert) {
        await supabase.from('notifications').insert({
          user_id: goal.created_by_user_id,
          title: 'Meta próxima do prazo',
          message: `A meta "${goal.title}" vence em ${daysUntilDeadline} dias`,
          type: 'warning',
          category: 'goal',
          priority: daysUntilDeadline <= 7 ? 'high' : 'medium',
          is_read: false,
          action_url: '/metas',
          action_label: 'Ver Metas',
          metadata: { goal_id: goal.id, days_remaining: daysUntilDeadline }
        })
      }
    }
  }
}

async function checkComplianceTasks(supabase: any) {
  const { data: tasks } = await supabase
    .from('compliance_tasks')
    .select('*')
    .eq('status', 'Pendente')
    .not('due_date', 'is', null)

  for (const task of tasks || []) {
    const daysUntilDue = Math.ceil(
      (new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue <= 7 && daysUntilDue >= 0) {
      const { data: existingAlert } = await supabase
        .from('notifications')
        .select('id')
        .eq('category', 'compliance')
        .ilike('message', `%${task.title}%`)
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (!existingAlert) {
        await supabase.from('notifications').insert({
          user_id: task.responsible_user_id || task.created_by_user_id,
          title: 'Tarefa de compliance urgente',
          message: `A tarefa "${task.title}" vence em ${daysUntilDue} dias`,
          type: daysUntilDue <= 1 ? 'error' : 'warning',
          category: 'compliance',
          priority: daysUntilDue <= 1 ? 'urgent' : 'high',
          is_read: false,
          action_url: '/compliance',
          action_label: 'Ver Compliance',
          metadata: { task_id: task.id, days_remaining: daysUntilDue }
        })
      }
    }
  }
}

async function checkEmissionSpikes(supabase: any) {
  const { data: emissions } = await supabase
    .from('calculated_emissions')
    .select('*, activity_data(*, emission_sources(*))')
    .gte('calculation_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('calculation_date', { ascending: false })
    .limit(100)

  if (!emissions || emissions.length === 0) return

  const recentEmissions = emissions.slice(0, 10)
  const totalRecent = recentEmissions.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0)
  const avgEmissions = totalRecent / Math.max(1, recentEmissions.length)

  const latestEmission = emissions[0]
  if (latestEmission && latestEmission.total_co2e > avgEmissions * 1.5) {
    await supabase.from('notifications').insert({
      user_id: latestEmission.activity_data?.user_id,
      title: 'Pico de emissões detectado',
      message: `Emissões atuais (${latestEmission.total_co2e.toFixed(2)} tCO2e) 50% acima da média`,
      type: 'warning',
      category: 'ghg',
      priority: 'high',
      is_read: false,
      action_url: '/inventario-gee',
      action_label: 'Ver Inventário',
      metadata: { 
        current_emission: latestEmission.total_co2e,
        average_emission: avgEmissions,
        source_id: latestEmission.activity_data?.emission_sources?.id
      }
    })
  }
}