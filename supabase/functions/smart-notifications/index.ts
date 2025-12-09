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
      case 'check_efficacy_evaluations':
        result = await checkEfficacyEvaluations(supabase)
        break
      case 'check_legislation_reviews':
        result = await checkLegislationReviews(supabase)
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

async function checkEfficacyEvaluations(supabase: any) {
  try {
    console.log('Checking efficacy evaluation deadlines...')
    
    const { data: programs, error: programsError } = await supabase
      .from('training_programs')
      .select('id, name, efficacy_evaluation_deadline, notify_responsible_email, responsible_email, responsible_name, created_by_user_id, company_id')
      .not('efficacy_evaluation_deadline', 'is', null)
      .eq('status', 'Ativo')

    if (programsError) {
      console.error('Error fetching training programs:', programsError)
      throw programsError
    }

    console.log(`Found ${programs?.length || 0} programs with efficacy deadlines`)
    let notificationsCreated = 0

    const now = new Date()

    for (const program of programs || []) {
      try {
        const deadlineDate = new Date(program.efficacy_evaluation_deadline)
        const daysUntilDeadline = Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('category', 'training')
            .ilike('message', `%${program.name}%`)
            .ilike('title', '%eficácia%')
            .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (!existingAlert && program.created_by_user_id) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: program.created_by_user_id,
              company_id: program.company_id,
              title: 'Avaliação de Eficácia Pendente',
              message: `O treinamento "${program.name}" precisa de avaliação de eficácia até ${deadlineDate.toLocaleDateString('pt-BR')}`,
              type: daysUntilDeadline <= 2 ? 'error' : 'warning',
              category: 'training',
              priority: daysUntilDeadline <= 2 ? 'urgent' : 'high',
              is_read: false,
              action_url: '/gestao-treinamentos',
              action_label: 'Ver Treinamentos',
              metadata: { 
                program_id: program.id, 
                days_remaining: daysUntilDeadline,
                responsible_name: program.responsible_name
              }
            })

            if (insertError) {
              console.error('Error creating efficacy notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created efficacy notification for program: ${program.name}`)
            }
          }
        }
      } catch (programError) {
        console.error(`Error processing program ${program.id}:`, programError)
        continue
      }
    }

    return { processed: programs?.length || 0, created: notificationsCreated }
  } catch (error) {
    console.error('Error in checkEfficacyEvaluations:', error)
    throw error
  }
}

async function checkLegislationReviews(supabase: any) {
  try {
    console.log('Checking legislation review deadlines...')
    
    // Get legislations with next_review_date approaching or overdue
    const { data: legislations, error: legislationsError } = await supabase
      .from('legislations')
      .select('id, title, next_review_date, responsible_user_id, created_by, company_id, overall_applicability')
      .not('next_review_date', 'is', null)
      .neq('overall_applicability', 'revogada')

    if (legislationsError) {
      console.error('Error fetching legislations:', legislationsError)
      throw legislationsError
    }

    console.log(`Found ${legislations?.length || 0} legislations with review dates`)
    let notificationsCreated = 0

    const now = new Date()

    for (const legislation of legislations || []) {
      try {
        const reviewDate = new Date(legislation.next_review_date)
        const daysUntilReview = Math.ceil(
          (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const userId = legislation.responsible_user_id || legislation.created_by
        if (!userId) continue

        // Check for overdue reviews
        if (daysUntilReview < 0) {
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('category', 'legislation')
            .ilike('title', '%vencida%')
            .ilike('message', `%${legislation.title}%`)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (!existingAlert) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: userId,
              company_id: legislation.company_id,
              title: 'Revisão de legislação vencida',
              message: `A revisão da legislação "${legislation.title}" está ${Math.abs(daysUntilReview)} dias atrasada`,
              type: 'error',
              category: 'legislation',
              priority: 'urgent',
              is_read: false,
              action_url: `/licenciamento/legislacoes/${legislation.id}`,
              action_label: 'Ver Legislação',
              metadata: { 
                legislation_id: legislation.id, 
                days_overdue: Math.abs(daysUntilReview),
                review_date: legislation.next_review_date
              }
            })

            if (insertError) {
              console.error('Error creating overdue review notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created overdue notification for legislation: ${legislation.title}`)
            }
          }
        }
        // Check for reviews due in 30 days
        else if (daysUntilReview <= 30 && daysUntilReview > 7) {
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('category', 'legislation')
            .ilike('title', '%próxima%')
            .ilike('message', `%${legislation.title}%`)
            .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (!existingAlert) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: userId,
              company_id: legislation.company_id,
              title: 'Revisão de legislação próxima',
              message: `A legislação "${legislation.title}" precisa ser revisada em ${daysUntilReview} dias`,
              type: 'info',
              category: 'legislation',
              priority: 'medium',
              is_read: false,
              action_url: `/licenciamento/legislacoes/${legislation.id}`,
              action_label: 'Ver Legislação',
              metadata: { 
                legislation_id: legislation.id, 
                days_remaining: daysUntilReview,
                review_date: legislation.next_review_date
              }
            })

            if (insertError) {
              console.error('Error creating upcoming review notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created 30-day notification for legislation: ${legislation.title}`)
            }
          }
        }
        // Check for reviews due in 7 days
        else if (daysUntilReview <= 7 && daysUntilReview >= 0) {
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('category', 'legislation')
            .ilike('title', '%urgente%')
            .ilike('message', `%${legislation.title}%`)
            .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (!existingAlert) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: userId,
              company_id: legislation.company_id,
              title: 'Revisão de legislação urgente',
              message: `A legislação "${legislation.title}" precisa ser revisada em ${daysUntilReview} dias`,
              type: 'warning',
              category: 'legislation',
              priority: 'high',
              is_read: false,
              action_url: `/licenciamento/legislacoes/${legislation.id}`,
              action_label: 'Ver Legislação',
              metadata: { 
                legislation_id: legislation.id, 
                days_remaining: daysUntilReview,
                review_date: legislation.next_review_date
              }
            })

            if (insertError) {
              console.error('Error creating urgent review notification:', insertError)
            } else {
              notificationsCreated++
              console.log(`Created 7-day notification for legislation: ${legislation.title}`)
            }
          }
        }
      } catch (legError) {
        console.error(`Error processing legislation ${legislation.id}:`, legError)
        continue
      }
    }

    // Also check for pending requirements in unit compliance
    const { data: pendingCompliances, error: complianceError } = await supabase
      .from('legislation_unit_compliance')
      .select(`
        id,
        legislation_id,
        unit_id,
        pending_requirements,
        unit_responsible_id,
        legislations!inner (
          id,
          title,
          company_id,
          responsible_user_id,
          created_by
        )
      `)
      .not('pending_requirements', 'is', null)
      .neq('pending_requirements', '')

    if (!complianceError && pendingCompliances) {
      console.log(`Found ${pendingCompliances.length} pending compliance items`)
      
      for (const compliance of pendingCompliances) {
        try {
          const legislation = compliance.legislations as any
          const userId = compliance.unit_responsible_id || legislation?.responsible_user_id || legislation?.created_by
          
          if (!userId || !legislation) continue

          // Check if notification already exists
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('category', 'legislation')
            .ilike('title', '%pendência%')
            .eq('metadata->>legislation_id', legislation.id)
            .eq('metadata->>unit_id', compliance.unit_id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (!existingAlert) {
            const { error: insertError } = await supabase.from('notifications').insert({
              user_id: userId,
              company_id: legislation.company_id,
              title: 'Pendência em legislação',
              message: `Há pendências a resolver para "${legislation.title}"`,
              type: 'warning',
              category: 'legislation',
              priority: 'high',
              is_read: false,
              action_url: `/licenciamento/legislacoes/${legislation.id}`,
              action_label: 'Ver Legislação',
              metadata: { 
                legislation_id: legislation.id, 
                unit_id: compliance.unit_id,
                pending: compliance.pending_requirements
              }
            })

            if (insertError) {
              console.error('Error creating pending compliance notification:', insertError)
            } else {
              notificationsCreated++
            }
          }
        } catch (compError) {
          console.error(`Error processing compliance ${compliance.id}:`, compError)
          continue
        }
      }
    }

    return { processed: legislations?.length || 0, created: notificationsCreated }
  } catch (error) {
    console.error('Error in checkLegislationReviews:', error)
    throw error
  }
}
