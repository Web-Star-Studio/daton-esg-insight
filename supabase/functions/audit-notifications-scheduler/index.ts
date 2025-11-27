import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))

    // Check for audits starting soon
    const { data: upcomingAudits } = await supabaseClient
      .from('audits')
      .select('id, title, start_date, company_id')
      .gte('start_date', now.toISOString())
      .lte('start_date', threeDaysFromNow.toISOString())
      .in('status', ['planned', 'scheduled'])

    // Check for action plans due soon
    const { data: dueSoonFindings } = await supabaseClient
      .from('audit_findings')
      .select(`
        id,
        due_date,
        responsible_user_id,
        audit_id,
        audits!inner(title, company_id)
      `)
      .gte('due_date', now.toISOString())
      .lte('due_date', threeDaysFromNow.toISOString())
      .eq('status', 'open')

    // Check for incomplete checklists (more than 48h old)
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000))
    const { data: incompleteChecklists } = await supabaseClient
      .from('audits')
      .select(`
        id,
        title,
        company_id,
        created_at,
        audit_plans!inner(team_members)
      `)
      .eq('status', 'in_progress')
      .lte('created_at', twoDaysAgo.toISOString())

    console.log('Scheduler results:', {
      upcomingAudits: upcomingAudits?.length || 0,
      dueSoonFindings: dueSoonFindings?.length || 0,
      incompleteChecklists: incompleteChecklists?.length || 0
    })

    // Process upcoming audits notifications
    if (upcomingAudits) {
      for (const audit of upcomingAudits) {
        // Get team members
        const { data: plan } = await supabaseClient
          .from('audit_plans')
          .select('team_members')
          .eq('audit_id', audit.id)
          .single()

        const teamMembers = (plan?.team_members as any[] || []).map((m: any) => m.userId)
        
        const startDate = new Date(audit.start_date)
        const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if ([7, 3, 1].includes(daysUntil) && teamMembers.length > 0) {
          for (const userId of teamMembers) {
            await supabaseClient.from('audit_notifications').insert({
              user_id: userId,
              company_id: audit.company_id,
              title: `Auditoria em ${daysUntil} dia(s)`,
              message: `A auditoria "${audit.title}" está agendada para ${startDate.toLocaleDateString('pt-BR')}`,
              notification_type: 'audit_reminder',
              priority: daysUntil === 1 ? 'high' : 'normal',
              audit_id: audit.id,
              action_url: `/auditoria/${audit.id}`,
              sent_at: now.toISOString()
            })
          }
        }
      }
    }

    // Process action plans due soon
    if (dueSoonFindings) {
      for (const finding of dueSoonFindings) {
        if (!finding.responsible_user_id) continue

        const dueDate = new Date(finding.due_date)
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil <= 3 && daysUntil > 0) {
          await supabaseClient.from('audit_notifications').insert({
            user_id: finding.responsible_user_id,
            company_id: (finding as any).audits.company_id,
            title: 'Prazo de Ação Corretiva Vencendo',
            message: `O plano de ação da auditoria "${(finding as any).audits.title}" vence em ${daysUntil} dia(s)`,
            notification_type: 'action_plan_due',
            priority: daysUntil === 1 ? 'high' : 'normal',
            audit_id: finding.audit_id,
            action_url: `/auditoria/${finding.audit_id}?tab=achados`,
            sent_at: now.toISOString()
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: {
          audits: upcomingAudits?.length || 0,
          findings: dueSoonFindings?.length || 0,
          checklists: incompleteChecklists?.length || 0
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in notification scheduler:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
