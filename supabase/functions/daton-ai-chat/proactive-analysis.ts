/**
 * Proactive Analysis Engine
 * Generates intelligent insights and alerts based on company data
 */
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { predictGoalAchievement, calculateLicenseRiskScore } from './predictive-analytics.ts';

export async function generateProactiveInsights(
  companyId: string,
  currentRoute: string,
  supabaseClient: SupabaseClient
): Promise<any[]> {
  const insights: any[] = [];
  
  try {
    // Always check critical alerts first
    const criticalAlerts = await checkCriticalAlerts(companyId, supabaseClient);
    insights.push(...criticalAlerts);
    
    // Analyze based on current page context
    if (currentRoute.includes('/metas')) {
      const goalInsights = await analyzeGoalsAdvanced(companyId, supabaseClient);
      insights.push(...goalInsights);
    }
    
    if (currentRoute.includes('/inventario')) {
      const emissionInsights = await analyzeEmissions(companyId, supabaseClient);
      insights.push(...emissionInsights);
    }
    
    if (currentRoute.includes('/dashboard')) {
      const dashboardInsights = await analyzeDashboard(companyId, supabaseClient);
      insights.push(...dashboardInsights);
    }
    
    if (currentRoute.includes('/licenciamento')) {
      const licenseInsights = await analyzeLicensesAdvanced(companyId, supabaseClient);
      insights.push(...licenseInsights);
    }
    
    console.log(`✅ Generated ${insights.length} proactive insights`);
  } catch (error) {
    console.error('Error generating proactive insights:', error);
  }
  
  return insights;
}

// Advanced goal analysis with predictive insights
async function analyzeGoalsAdvanced(companyId: string, supabase: SupabaseClient) {
  const insights: any[] = [];
  
  const { data: goals } = await supabase
    .from('goals')
    .select('*, goal_progress_updates(*)')
    .eq('company_id', companyId)
    .in('status', ['Ativo', 'Em Andamento']);
  
  if (!goals || goals.length === 0) return insights;
  
  // Use predictive analytics for each goal
  for (const goal of goals) {
    if (goal.goal_progress_updates && goal.goal_progress_updates.length >= 2) {
      const prediction = await predictGoalAchievement(goal.id, supabase);
      
      if (prediction.probability < 50) {
        insights.push({
          id: `goal_risk_${goal.id}`,
          type: 'alert',
          title: `🚨 Meta em risco: ${goal.goal_name}`,
          description: `Probabilidade de atingimento: ${prediction.probability}%. ${prediction.recommendation}`,
          priority: 'high',
          category: 'Metas ESG',
          data: {
            goalId: goal.id,
            prediction
          }
        });
      } else if (prediction.probability >= 80) {
        insights.push({
          id: `goal_success_${goal.id}`,
          type: 'success',
          title: `✅ Meta no caminho certo: ${goal.goal_name}`,
          description: `Probabilidade de atingimento: ${prediction.probability}%. Continue assim!`,
          priority: 'low',
          category: 'Metas ESG',
          data: {
            goalId: goal.id,
            prediction
          }
        });
      }
    }
  }
  
  return insights;
}

// Advanced license analysis with risk scoring
async function analyzeLicensesAdvanced(companyId: string, supabase: SupabaseClient) {
  const insights: any[] = [];
  
  const { data: licenses } = await supabase
    .from('licenses')
    .select('*')
    .eq('company_id', companyId);
  
  if (!licenses) return insights;
  
  // Calculate risk score for each license
  const highRiskLicenses = licenses
    .map((license: any) => ({
      ...license,
      riskAnalysis: calculateLicenseRiskScore(license)
    }))
    .filter((l: any) => l.riskAnalysis.level === 'high' || l.riskAnalysis.level === 'critical')
    .sort((a: any, b: any) => b.riskAnalysis.score - a.riskAnalysis.score);
  
  if (highRiskLicenses.length > 0) {
    const topRisk = highRiskLicenses[0];
    insights.push({
      id: `license_risk_${topRisk.id}`,
      type: 'alert',
      title: `⚠️ Licença de alto risco: ${topRisk.license_name}`,
      description: `Score de risco: ${topRisk.riskAnalysis.score}/100. Fatores: ${topRisk.riskAnalysis.factors.join(', ')}`,
      priority: topRisk.riskAnalysis.level === 'critical' ? 'critical' : 'high',
      category: 'Licenciamento',
      data: {
        licenseId: topRisk.id,
        riskAnalysis: topRisk.riskAnalysis
      }
    });
  }
  
  return insights;
}

async function analyzeGoals(companyId: string, supabase: SupabaseClient) {
  const insights: any[] = [];
  
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Em Andamento');
  
  if (!goals) return insights;
  
  // Check for goals at risk
  const atRiskGoals = goals.filter((g: any) => {
    const progress = g.progress_percentage || 0;
    const daysToTarget = g.target_date ? 
      Math.floor((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    return progress < 50 && daysToTarget < 90;
  });
  
  if (atRiskGoals.length > 0) {
    insights.push({
      id: 'goal_risk_' + Date.now(),
      type: 'alert',
      title: `${atRiskGoals.length} meta(s) em risco`,
      description: 'Algumas metas estão com progresso baixo e prazo próximo. Revisar e acelerar ações.',
      priority: 'high',
      category: 'Metas ESG',
      action: {
        label: 'Ver metas em risco',
        prompt: 'Mostre detalhes das metas que estão em risco e sugira ações para acelerá-las'
      }
    });
  }
  
  // Check for achievable goals
  const almostCompleteGoals = goals.filter((g: any) => 
    g.progress_percentage >= 80 && g.progress_percentage < 100
  );
  
  if (almostCompleteGoals.length > 0) {
    insights.push({
      id: 'goal_achievement_' + Date.now(),
      type: 'achievement',
      title: `${almostCompleteGoals.length} meta(s) próxima(s) de conclusão`,
      description: 'Parabéns! Você está perto de concluir algumas metas. Mantenha o ritmo!',
      priority: 'medium',
      category: 'Metas ESG',
      action: {
        label: 'Ver progresso',
        prompt: 'Mostre o progresso das metas que estão próximas de conclusão'
      }
    });
  }
  
  return insights;
}

async function analyzeEmissions(companyId: string, supabase: any) {
  const insights: any[] = [];
  
  const { data: sources } = await supabase
    .from('emission_sources')
    .select(`
      id,
      source_name,
      scope,
      activity_data(
        quantity,
        period_start_date,
        calculated_emissions(total_co2e)
      )
    `)
    .eq('company_id', companyId);
  
  if (!sources || sources.length === 0) {
    insights.push({
      id: 'emission_start_' + Date.now(),
      type: 'suggestion',
      title: 'Comece seu inventário de emissões',
      description: 'Cadastre suas fontes de emissão para começar a medir seu impacto ambiental.',
      priority: 'high',
      category: 'Inventário GEE',
      action: {
        label: 'Criar fonte de emissão',
        prompt: 'Me ajude a criar minhas primeiras fontes de emissão GEE'
      }
    });
  }
  
  return insights;
}

async function analyzeDashboard(companyId: string, supabase: any) {
  const insights: any[] = [];
  
  // Check overall system health
  const [
    { data: goals },
    { data: tasks },
    { data: licenses }
  ] = await Promise.all([
    supabase.from('goals').select('status').eq('company_id', companyId),
    supabase.from('data_collection_tasks').select('status').eq('company_id', companyId),
    supabase.from('licenses').select('status, expiration_date').eq('company_id', companyId)
  ]);
  
  // Analyze task completion rate
  if (tasks && tasks.length > 0) {
    const completionRate = (tasks.filter((t: any) => t.status === 'Concluída').length / tasks.length) * 100;
    
    if (completionRate < 50) {
      insights.push({
        id: 'task_completion_' + Date.now(),
        type: 'alert',
        title: 'Taxa de conclusão de tarefas baixa',
        description: `Apenas ${completionRate.toFixed(0)}% das tarefas foram concluídas. Foque nas prioridades.`,
        priority: 'high',
        category: 'Gestão de Tarefas',
        action: {
          label: 'Ver tarefas pendentes',
          prompt: 'Mostre as tarefas pendentes mais urgentes e sugira prioridades'
        }
      });
    }
  }
  
  return insights;
}

async function checkCriticalAlerts(companyId: string, supabase: any) {
  const insights: any[] = [];
  
  // Check expiring licenses (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const { data: expiringLicenses } = await supabase
    .from('licenses')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Ativa')
    .lte('expiration_date', thirtyDaysFromNow.toISOString())
    .gte('expiration_date', new Date().toISOString());
  
  if (expiringLicenses && expiringLicenses.length > 0) {
    insights.push({
      id: 'license_expiring_' + Date.now(),
      type: 'alert',
      title: `${expiringLicenses.length} licença(s) vencendo em breve`,
      description: 'Você tem licenças ambientais que vencem nos próximos 30 dias. Inicie o processo de renovação.',
      priority: 'high',
      category: 'Licenciamento',
      action: {
        label: 'Ver licenças',
        prompt: 'Mostre as licenças que estão vencendo e o que preciso fazer para renovar'
      }
    });
  }
  
  // Check overdue tasks
  const { data: overdueTasks } = await supabase
    .from('data_collection_tasks')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Em Atraso');
  
  if (overdueTasks && overdueTasks.length > 0) {
    insights.push({
      id: 'tasks_overdue_' + Date.now(),
      type: 'alert',
      title: `${overdueTasks.length} tarefa(s) atrasada(s)`,
      description: 'Você tem tarefas atrasadas que precisam de atenção imediata.',
      priority: 'high',
      category: 'Gestão de Tarefas',
      action: {
        label: 'Ver tarefas atrasadas',
        prompt: 'Mostre as tarefas atrasadas e sugira como priorizá-las'
      }
    });
  }
  
  return insights;
}

export async function generateDataVisualizations(
  queryResults: any,
  queryType: string
): Promise<any[]> {
  const visualizations: any[] = [];
  
  try {
    // Generate visualizations based on query type and results
    if (queryType === 'emissions' && queryResults.data) {
      const emissionData = queryResults.data;
      
      if (emissionData.breakdown) {
        visualizations.push({
          type: 'bar',
          title: 'Emissões por Escopo',
          data: Object.entries(emissionData.breakdown).map(([key, value]) => ({
            label: `Escopo ${key}`,
            value: value as number
          }))
        });
      }
      
      visualizations.push({
        type: 'metric',
        title: 'Total de Emissões',
        data: {
          title: 'Emissões Totais',
          value: `${emissionData.totalEmissions?.toFixed(2) || 0} tCO2e`,
          status: emissionData.totalEmissions > 1000 ? 'warning' : 'success'
        }
      });
    }
    
    if (queryType === 'goals' && queryResults.data) {
      visualizations.push({
        type: 'metric',
        title: 'Progresso Médio',
        data: {
          title: 'Progresso Médio das Metas',
          value: `${queryResults.data.avgProgress?.toFixed(1) || 0}%`,
          trend: queryResults.data.avgProgress >= 50 ? 'up' : 'down',
          trendValue: `${queryResults.goals?.length || 0} metas ativas`,
          status: queryResults.data.avgProgress >= 70 ? 'success' : 
                  queryResults.data.avgProgress >= 50 ? 'warning' : 'danger'
        }
      });
    }
    
  } catch (error) {
    console.error('Error generating visualizations:', error);
  }
  
  return visualizations;
}
