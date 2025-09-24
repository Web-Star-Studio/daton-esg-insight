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

    if (!supabase) {
      throw new Error('Failed to initialize Supabase client')
    }

    const body = await req.json().catch(() => ({}))
    const { action } = body

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing action: ${action}`)

    let result
    switch (action) {
      case 'check_goal_deadlines':
        result = await checkGoalDeadlines(supabase)
        break
      case 'check_compliance_tasks':
        result = await checkComplianceTasks(supabase)
        break
      case 'check_emission_spikes':
        result = await checkEmissionSpikes(supabase)
        break
      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Smart notifications error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkGoalDeadlines(supabase: any) {
  try {
    console.log('Checking goal deadlines...')
    
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, target_date, created_by_user_id, company_id')
      .eq('status', 'Ativa')
      .not('target_date', 'is', null)

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      throw goalsError
    }

    console.log(`Found ${goals?.length || 0} active goals`)
    let notificationsCreated = 0

    for (const goal of goals || []) {
      try {
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
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: goal.created_by_user_id,
              company_id: goal.company_id,
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

            if (insertError) {
              console.error('Error creating goal notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created notification for goal: ${goal.title}`)
            }
          }
        }
      } catch (goalError) {
        console.error(`Error processing goal ${goal.id}:`, goalError)
        continue
      }
    }

    return { processed: goals?.length || 0, created: notificationsCreated }
  } catch (error) {
    console.error('Error in checkGoalDeadlines:', error)
    throw error
  }
}

async function checkComplianceTasks(supabase: any) {
  try {
    console.log('Checking compliance tasks...')
    
    const { data: tasks, error: tasksError } = await supabase
      .from('compliance_tasks')
      .select('id, title, due_date, responsible_user_id, company_id')
      .eq('status', 'Pendente')
      .not('due_date', 'is', null)

    if (tasksError) {
      console.error('Error fetching compliance tasks:', tasksError)
      throw tasksError
    }

    console.log(`Found ${tasks?.length || 0} pending compliance tasks`)
    let notificationsCreated = 0

    for (const task of tasks || []) {
      try {
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

          if (!existingAlert && task.responsible_user_id) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: task.responsible_user_id,
              company_id: task.company_id,
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

            if (insertError) {
              console.error('Error creating compliance notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created notification for task: ${task.title}`)
            }
          }
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError)
        continue
      }
    }

    return { processed: tasks?.length || 0, created: notificationsCreated }
  } catch (error) {
    console.error('Error in checkComplianceTasks:', error)
    throw error
  }
}

async function checkEmissionSpikes(supabase: any) {
  try {
    console.log('Checking emission spikes...')
    
    const { data: emissions, error: emissionsError } = await supabase
      .from('calculated_emissions')
      .select(`
        id,
        total_co2e,
        calculation_date,
        activity_data (
          id,
          user_id,
          emission_sources (
            id,
            company_id,
            name
          )
        )
      `)
      .gte('calculation_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('calculation_date', { ascending: false })
      .limit(100)

    if (emissionsError) {
      console.error('Error fetching emissions:', emissionsError)
      throw emissionsError
    }

    if (!emissions || emissions.length === 0) {
      console.log('No emissions data found')
      return { processed: 0, created: 0 }
    }

    console.log(`Found ${emissions.length} emission records`)
    
    const recentEmissions = emissions.slice(0, 10)
    const totalRecent = recentEmissions.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0)
    const avgEmissions = totalRecent / Math.max(1, recentEmissions.length)

    const latestEmission = emissions[0]
    let notificationsCreated = 0

    if (latestEmission && latestEmission.total_co2e > avgEmissions * 1.5 && latestEmission.activity_data?.user_id) {
      const { error: insertError } = await supabase.from('notifications').insert({
        user_id: latestEmission.activity_data.user_id,
        company_id: latestEmission.activity_data.emission_sources?.company_id,
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
          source_id: latestEmission.activity_data.emission_sources?.id,
          source_name: latestEmission.activity_data.emission_sources?.name
        }
      })

      if (insertError) {
        console.error('Error creating emission spike notification:', insertError)
      } else {
        notificationsCreated++
        console.log('Created emission spike notification')
      }
    }

    return { processed: emissions.length, created: notificationsCreated }
  } catch (error) {
    console.error('Error in checkEmissionSpikes:', error)
    throw error
  }
}