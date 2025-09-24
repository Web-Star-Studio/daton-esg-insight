import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: { persistSession: false }
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/quality-management', '');
    const method = req.method;

    // Route handling
    switch (true) {
      case path === '/dashboard' && method === 'GET':
        return await getQualityDashboard(supabase, profile.company_id);
      
      case path === '/non-conformities/stats' && method === 'GET':
        return await getNonConformityStats(supabase, profile.company_id);
      
      case path === '/action-plans/progress' && method === 'GET':
        return await getActionPlansProgress(supabase, profile.company_id);
      
      case path === '/risk-assessment/matrix' && method === 'GET':
        const matrixId = url.searchParams.get('matrix_id');
        return await getRiskMatrix(supabase, profile.company_id, matrixId);
      
      case path === '/process-efficiency' && method === 'GET':
        return await getProcessEfficiency(supabase, profile.company_id);

      case path === '/quality-indicators' && method === 'GET':
        return await getQualityIndicators(supabase, profile.company_id);

      default:
        return new Response(JSON.stringify({ error: 'Route not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in quality-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getQualityDashboard(supabase: any, company_id: string) {
  try {
    // Get general quality metrics
    const [
      { data: totalNCs },
      { data: openNCs },
      { data: totalRisks },
      { data: highRisks },
      { data: actionPlans },
      { data: overdueActions }
    ] = await Promise.all([
      supabase.from('non_conformities').select('id', { count: 'exact' }).eq('company_id', company_id),
      supabase.from('non_conformities').select('id', { count: 'exact' }).eq('company_id', company_id).eq('status', 'Aberta'),
      supabase.from('risk_assessments').select('id', { count: 'exact' }).eq('risk_level', 'Alto'),
      supabase.from('risk_assessments').select('id', { count: 'exact' }).in('risk_level', ['Alto', 'Crítico']),
      supabase.from('action_plans').select('id', { count: 'exact' }).eq('company_id', company_id),
      supabase.from('action_plan_items').select('id', { count: 'exact' }).lt('when_deadline', new Date().toISOString().split('T')[0]).eq('status', 'Pendente')
    ]);

    // Recent non-conformities
    const { data: recentNCs } = await supabase
      .from('non_conformities')
      .select('id, nc_number, title, severity, status, created_at')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Action plans progress
    const { data: plansProgress } = await supabase
      .from('action_plans')
      .select(`
        id, title, status,
        action_plan_items(progress_percentage)
      `)
      .eq('company_id', company_id)
      .limit(5);

    const dashboard = {
      metrics: {
        totalNCs: totalNCs?.length || 0,
        openNCs: openNCs?.length || 0,
        totalRisks: totalRisks?.length || 0,
        highRisks: highRisks?.length || 0,
        actionPlans: actionPlans?.length || 0,
        overdueActions: overdueActions?.length || 0
      },
      recentNCs: recentNCs || [],
      plansProgress: plansProgress?.map(plan => ({
        ...plan,
        avgProgress: plan.action_plan_items?.length > 0 
          ? plan.action_plan_items.reduce((sum: number, item: any) => sum + (item.progress_percentage || 0), 0) / plan.action_plan_items.length
          : 0
      })) || []
    };

    return new Response(JSON.stringify(dashboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw error;
  }
}

async function getNonConformityStats(supabase: any, company_id: string) {
  const { data } = await supabase
    .from('non_conformities')
    .select('severity, status, source, created_at')
    .eq('company_id', company_id);

  const stats = {
    bySeverity: {},
    byStatus: {},
    bySource: {},
    monthly: {}
  };

  data?.forEach((nc: any) => {
    // Group by severity
    stats.bySeverity[nc.severity] = (stats.bySeverity[nc.severity] || 0) + 1;
    
    // Group by status
    stats.byStatus[nc.status] = (stats.byStatus[nc.status] || 0) + 1;
    
    // Group by source
    stats.bySource[nc.source] = (stats.bySource[nc.source] || 0) + 1;
    
    // Group by month
    const month = new Date(nc.created_at).toISOString().substring(0, 7);
    stats.monthly[month] = (stats.monthly[month] || 0) + 1;
  });

  return new Response(JSON.stringify(stats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getActionPlansProgress(supabase: any, company_id: string) {
  const { data } = await supabase
    .from('action_plans')
    .select(`
      id, title, status, created_at,
      action_plan_items(
        id, status, progress_percentage, when_deadline
      )
    `)
    .eq('company_id', company_id);

  const progress = data?.map((plan: any) => {
    const items = plan.action_plan_items || [];
    const totalItems = items.length;
    const completedItems = items.filter((item: any) => item.status === 'Concluído').length;
    const avgProgress = totalItems > 0 
      ? items.reduce((sum: number, item: any) => sum + (item.progress_percentage || 0), 0) / totalItems
      : 0;
    
    const overdueItems = items.filter((item: any) => 
      item.when_deadline && new Date(item.when_deadline) < new Date() && item.status !== 'Concluído'
    ).length;

    return {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      totalItems,
      completedItems,
      avgProgress: Math.round(avgProgress),
      overdueItems,
      created_at: plan.created_at
    };
  });

  return new Response(JSON.stringify(progress || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getRiskMatrix(supabase: any, company_id: string, matrix_id: string | null) {
  if (!matrix_id) {
    return new Response(JSON.stringify({ error: 'Matrix ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: risks } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('risk_matrix_id', matrix_id);

  // Create matrix visualization data
  const probabilityLevels = ['Baixa', 'Média', 'Alta'];
  const impactLevels = ['Baixo', 'Médio', 'Alto'];
  
  const matrix = probabilityLevels.map(probability => 
    impactLevels.map(impact => ({
      probability,
      impact,
      risks: risks?.filter((risk: any) => 
        risk.probability === probability && risk.impact === impact
      ) || []
    }))
  );

  const riskCounts = {
    total: risks?.length || 0,
    critical: risks?.filter((r: any) => r.risk_level === 'Crítico').length || 0,
    high: risks?.filter((r: any) => r.risk_level === 'Alto').length || 0,
    medium: risks?.filter((r: any) => r.risk_level === 'Médio').length || 0,
    low: risks?.filter((r: any) => r.risk_level === 'Baixo').length || 0,
  };

  return new Response(JSON.stringify({ matrix, riskCounts }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getProcessEfficiency(supabase: any, company_id: string) {
  const { data: processes } = await supabase
    .from('process_maps')
    .select(`
      id, name, process_type, status,
      process_activities(
        id, name, duration_minutes, activity_type
      )
    `)
    .eq('company_id', company_id);

  const efficiency = processes?.map((process: any) => {
    const activities = process.process_activities || [];
    const totalDuration = activities.reduce((sum: number, activity: any) => 
      sum + (activity.duration_minutes || 0), 0
    );
    
    const valueAddedActivities = activities.filter((activity: any) => 
      activity.activity_type === 'Atividade'
    ).length;
    
    const totalActivities = activities.length;
    const efficiencyRatio = totalActivities > 0 ? (valueAddedActivities / totalActivities) * 100 : 0;

    return {
      id: process.id,
      name: process.name,
      type: process.process_type,
      status: process.status,
      totalActivities,
      valueAddedActivities,
      totalDuration,
      efficiencyRatio: Math.round(efficiencyRatio)
    };
  });

  return new Response(JSON.stringify(efficiency || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getQualityIndicators(supabase: any, company_id: string) {
  // Calculate key quality indicators
  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);

  const [
    { data: thisMonthNCs },
    { data: lastMonthNCs },
    { data: resolvedNCs },
    { data: overdueActions }
  ] = await Promise.all([
    supabase.from('non_conformities').select('id', { count: 'exact' }).eq('company_id', company_id).gte('created_at', `${thisMonth}-01`),
    supabase.from('non_conformities').select('id', { count: 'exact' }).eq('company_id', company_id).gte('created_at', `${lastMonth}-01`).lt('created_at', `${thisMonth}-01`),
    supabase.from('non_conformities').select('id', { count: 'exact' }).eq('company_id', company_id).eq('status', 'Fechada'),
    supabase.from('action_plan_items').select('id', { count: 'exact' }).lt('when_deadline', now.toISOString().split('T')[0]).eq('status', 'Pendente')
  ]);

  const indicators = {
    ncTrend: {
      current: thisMonthNCs?.length || 0,
      previous: lastMonthNCs?.length || 0,
      change: ((thisMonthNCs?.length || 0) - (lastMonthNCs?.length || 0))
    },
    resolutionRate: {
      resolved: resolvedNCs?.length || 0,
      total: (resolvedNCs?.length || 0) + (thisMonthNCs?.length || 0),
      percentage: (resolvedNCs?.length || 0) > 0 ? 
        Math.round(((resolvedNCs?.length || 0) / ((resolvedNCs?.length || 0) + (thisMonthNCs?.length || 0))) * 100) : 0
    },
    overdueActions: overdueActions?.length || 0,
    qualityScore: Math.max(0, 100 - ((thisMonthNCs?.length || 0) * 5) - ((overdueActions?.length || 0) * 3))
  };

  return new Response(JSON.stringify(indicators), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}