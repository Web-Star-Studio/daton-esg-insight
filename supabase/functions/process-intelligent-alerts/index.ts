import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Validate JWT token (this is a scheduled/internal function, but validate if called externally)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        console.log('JWT validation failed for external call, proceeding as internal job');
      } else {
        console.log('Authenticated request from user:', claimsData.claims.sub);
      }
    }

    console.log('Processing intelligent alerts...');

    // Get all companies
    const { data: companies, error: companiesError } = await supabaseClient
      .from('companies')
      .select('id, name');

    if (companiesError) throw companiesError;

    const alertsCreated = [];

    for (const company of companies || []) {
      console.log(`Processing alerts for company: ${company.name}`);

      // 1. Check for expiring licenses (30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringLicenses } = await supabaseClient
        .from('licenses')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'Ativa')
        .lte('expiration_date', thirtyDaysFromNow.toISOString())
        .gte('expiration_date', new Date().toISOString());

      for (const license of expiringLicenses || []) {
        const daysUntilExpiry = Math.floor(
          (new Date(license.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const { error: alertError } = await supabaseClient
          .from('intelligent_alerts')
          .insert({
            company_id: company.id,
            alert_type: 'license_expiring',
            severity: daysUntilExpiry <= 15 ? 'critical' : 'high',
            title: `Licença ${license.license_name} vencerá em ${daysUntilExpiry} dias`,
            description: `A licença ${license.license_name} (${license.license_number}) vence em ${new Date(license.expiration_date).toLocaleDateString('pt-BR')}. Inicie o processo de renovação imediatamente.`,
            related_entity_type: 'license',
            related_entity_id: license.id,
            current_value: daysUntilExpiry,
            threshold_value: 30,
            recommended_actions: [
              'Iniciar processo de renovação',
              'Preparar documentação necessária',
              'Contatar órgão licenciador',
              'Verificar requisitos atualizados'
            ]
          });

        if (!alertError) {
          alertsCreated.push({ type: 'license_expiring', license: license.license_name });
        }
      }

      // 2. Check for overdue tasks
      const { data: overdueTasks } = await supabaseClient
        .from('data_collection_tasks')
        .select('*')
        .eq('company_id', company.id)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'Concluída');

      for (const task of overdueTasks || []) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        const { error: alertError } = await supabaseClient
          .from('intelligent_alerts')
          .insert({
            company_id: company.id,
            alert_type: 'task_overdue',
            severity: daysOverdue > 7 ? 'critical' : 'high',
            title: `Tarefa "${task.name}" atrasada há ${daysOverdue} dias`,
            description: `A tarefa "${task.name}" está atrasada desde ${new Date(task.due_date).toLocaleDateString('pt-BR')}. Priorize sua conclusão para manter a conformidade.`,
            related_entity_type: 'task',
            related_entity_id: task.id,
            current_value: daysOverdue,
            threshold_value: 0,
            recommended_actions: [
              'Reatribuir tarefa se necessário',
              'Priorizar execução imediata',
              'Identificar bloqueios',
              'Atualizar cronograma'
            ]
          });

        if (!alertError) {
          alertsCreated.push({ type: 'task_overdue', task: task.name });
        }
      }

      // 3. Check for goals at risk
      const { data: goals } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'Em Andamento');

      for (const goal of goals || []) {
        const progress = goal.progress_percentage || 0;
        const daysToTarget = goal.target_date ? 
          Math.floor((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

        if (daysToTarget !== null && progress < 50 && daysToTarget < 90) {
          const { error: alertError } = await supabaseClient
            .from('intelligent_alerts')
            .insert({
              company_id: company.id,
              alert_type: 'goal_at_risk',
              severity: daysToTarget < 30 ? 'critical' : 'high',
              title: `Meta "${goal.goal_name}" em risco`,
              description: `A meta "${goal.goal_name}" está com apenas ${progress.toFixed(1)}% de progresso e ${daysToTarget} dias até a data limite. Ações urgentes são necessárias.`,
              related_entity_type: 'goal',
              related_entity_id: goal.id,
              current_value: progress,
              threshold_value: 50,
              recommended_actions: [
                'Revisar plano de ação',
                'Acelerar atividades críticas',
                'Alocar recursos adicionais',
                'Avaliar viabilidade da meta'
              ]
            });

          if (!alertError) {
            alertsCreated.push({ type: 'goal_at_risk', goal: goal.goal_name });
          }
        }
      }

      // 4. Check for emission spikes (comparing current month with previous)
      const currentDate = new Date();
      const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastDayPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const { data: currentMonthEmissions } = await supabaseClient
        .from('calculated_emissions')
        .select(`
          total_co2e,
          activity_data!inner(
            emission_source_id,
            period_start_date,
            emission_sources!inner(company_id)
          )
        `)
        .eq('activity_data.emission_sources.company_id', company.id)
        .gte('activity_data.period_start_date', firstDayCurrentMonth.toISOString());

      const { data: previousMonthEmissions } = await supabaseClient
        .from('calculated_emissions')
        .select(`
          total_co2e,
          activity_data!inner(
            emission_source_id,
            period_start_date,
            emission_sources!inner(company_id)
          )
        `)
        .eq('activity_data.emission_sources.company_id', company.id)
        .gte('activity_data.period_start_date', firstDayPreviousMonth.toISOString())
        .lte('activity_data.period_start_date', lastDayPreviousMonth.toISOString());

      const currentTotal = (currentMonthEmissions || []).reduce((sum, e) => sum + (e.total_co2e || 0), 0);
      const previousTotal = (previousMonthEmissions || []).reduce((sum, e) => sum + (e.total_co2e || 0), 0);

      if (previousTotal > 0 && currentTotal > 0) {
        const percentageIncrease = ((currentTotal - previousTotal) / previousTotal) * 100;

        if (percentageIncrease > 20) {
          const { error: alertError } = await supabaseClient
            .from('intelligent_alerts')
            .insert({
              company_id: company.id,
              alert_type: 'emission_spike',
              severity: percentageIncrease > 50 ? 'critical' : 'high',
              title: `Aumento de ${percentageIncrease.toFixed(1)}% nas emissões`,
              description: `Detectado aumento significativo de ${percentageIncrease.toFixed(1)}% nas emissões de GEE comparado ao mês anterior (${previousTotal.toFixed(2)} → ${currentTotal.toFixed(2)} tCO2e).`,
              related_entity_type: 'emissions',
              related_entity_id: company.id,
              current_value: currentTotal,
              threshold_value: previousTotal,
              recommended_actions: [
                'Investigar causas do aumento',
                'Verificar dados lançados',
                'Identificar fontes principais',
                'Implementar ações corretivas'
              ]
            });

          if (!alertError) {
            alertsCreated.push({ type: 'emission_spike', company: company.name });
          }
        }
      }
    }

    console.log(`Alerts created: ${alertsCreated.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        details: alertsCreated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
