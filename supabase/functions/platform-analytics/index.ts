import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      'https://dqlvioijqzlvnvvajmft.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é platform admin
    const { data: platformAdmin, error: adminError } = await supabaseClient
      .from('platform_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !platformAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { period = '30d' } = await req.json().catch(() => ({}));

    console.log('Generating platform analytics...', { period });

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // 1. Estatísticas de Empresas
    const { count: totalCompanies } = await supabaseClient
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { count: activeCompanies } = await supabaseClient
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: newCompanies } = await supabaseClient
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // 2. Estatísticas de Usuários
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', startDate.toISOString());

    // 3. Uso de Features (estimativas baseadas em activity_logs)
    const { count: totalActivities } = await supabaseClient
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // 4. Crescimento por mês
    const { data: companiesGrowth } = await supabaseClient
      .from('companies')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Agrupar por mês
    const growthByMonth: Record<string, number> = {};
    companiesGrowth?.forEach(company => {
      const month = new Date(company.created_at).toISOString().substring(0, 7);
      growthByMonth[month] = (growthByMonth[month] || 0) + 1;
    });

    // 5. Top empresas por atividade
    const { data: topCompanies } = await supabaseClient
      .from('activity_logs')
      .select('company_id, companies(name, cnpj)')
      .gte('created_at', startDate.toISOString())
      .limit(1000);

    const activityByCompany: Record<string, { name: string; cnpj: string; count: number }> = {};
    topCompanies?.forEach(log => {
      const companyId = log.company_id;
      if (companyId && log.companies) {
        if (!activityByCompany[companyId]) {
          activityByCompany[companyId] = {
            name: (log.companies as any).name,
            cnpj: (log.companies as any).cnpj,
            count: 0,
          };
        }
        activityByCompany[companyId].count++;
      }
    });

    const topCompaniesByActivity = Object.values(activityByCompany)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 6. Distribuição de Planos
    const { data: planDistribution } = await supabaseClient
      .from('companies')
      .select('subscription_plan');

    const plans: Record<string, number> = {};
    planDistribution?.forEach(company => {
      const plan = company.subscription_plan || 'free';
      plans[plan] = (plans[plan] || 0) + 1;
    });

    const result = {
      period,
      timestamp: new Date().toISOString(),
      overview: {
        totalCompanies: totalCompanies || 0,
        activeCompanies: activeCompanies || 0,
        suspendedCompanies: (totalCompanies || 0) - (activeCompanies || 0),
        newCompanies: newCompanies || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalActivities: totalActivities || 0,
      },
      growth: {
        byMonth: growthByMonth,
        trend: newCompanies && newCompanies > 0 ? 'up' : 'stable',
      },
      engagement: {
        topCompanies: topCompaniesByActivity,
        averageActivitiesPerCompany: totalCompanies 
          ? Math.round((totalActivities || 0) / totalCompanies) 
          : 0,
      },
      planDistribution: plans,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in platform-analytics:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao gerar analytics' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
