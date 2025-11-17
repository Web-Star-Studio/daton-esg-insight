import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthScoreResult {
  companyId: string;
  companyName: string;
  score: number;
  category: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
  factors: {
    loginFrequency: { score: number; weight: number };
    featureAdoption: { score: number; weight: number };
    dataCompleteness: { score: number; weight: number };
    userEngagement: { score: number; weight: number };
    systemHealth: { score: number; weight: number };
  };
  recommendations: string[];
  lastCalculated: string;
}

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

    const { companyId } = await req.json().catch(() => ({}));

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calculating health score for company:', companyId);

    // Buscar dados da empresa
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Empresa não encontrada');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Login Frequency (peso: 25%)
    const { data: recentLogins } = await supabaseClient
      .from('profiles')
      .select('last_login_at')
      .eq('company_id', companyId)
      .gte('last_login_at', thirtyDaysAgo.toISOString());

    const loginScore = Math.min(100, (recentLogins?.length || 0) * 10);

    // 2. Feature Adoption (peso: 30%)
    const { count: totalActivities } = await supabaseClient
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const featureScore = Math.min(100, (totalActivities || 0) * 2);

    // 3. Data Completeness (peso: 20%)
    let dataScore = 0;
    if (company.cnpj) dataScore += 20;
    if (company.logo_url) dataScore += 20;
    if (company.address) dataScore += 20;
    if (company.phone) dataScore += 20;
    if (company.website) dataScore += 20;

    // 4. User Engagement (peso: 15%)
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    const { count: activeUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('last_login_at', thirtyDaysAgo.toISOString());

    const engagementScore = totalUsers && totalUsers > 0
      ? Math.round((activeUsers || 0) / totalUsers * 100)
      : 0;

    // 5. System Health (peso: 10%)
    const systemScore = company.status === 'active' ? 100 : 0;

    // Calcular score final ponderado
    const weights = {
      loginFrequency: 0.25,
      featureAdoption: 0.30,
      dataCompleteness: 0.20,
      userEngagement: 0.15,
      systemHealth: 0.10,
    };

    const finalScore = Math.round(
      loginScore * weights.loginFrequency +
      featureScore * weights.featureAdoption +
      dataScore * weights.dataCompleteness +
      engagementScore * weights.userEngagement +
      systemScore * weights.systemHealth
    );

    // Determinar categoria
    let category: HealthScoreResult['category'];
    if (finalScore <= 20) category = 'critical';
    else if (finalScore <= 40) category = 'low';
    else if (finalScore <= 60) category = 'medium';
    else if (finalScore <= 80) category = 'high';
    else category = 'excellent';

    // Gerar recomendações
    const recommendations: string[] = [];
    if (loginScore < 50) {
      recommendations.push('Aumentar frequência de login dos usuários');
    }
    if (featureScore < 50) {
      recommendations.push('Incentivar uso de mais features da plataforma');
    }
    if (dataScore < 80) {
      recommendations.push('Completar informações cadastrais da empresa');
    }
    if (engagementScore < 50) {
      recommendations.push('Melhorar engajamento dos usuários ativos');
    }
    if (systemScore < 100) {
      recommendations.push('Resolver problemas de status do sistema');
    }

    const result: HealthScoreResult = {
      companyId: company.id,
      companyName: company.name,
      score: finalScore,
      category,
      factors: {
        loginFrequency: { score: loginScore, weight: weights.loginFrequency },
        featureAdoption: { score: featureScore, weight: weights.featureAdoption },
        dataCompleteness: { score: dataScore, weight: weights.dataCompleteness },
        userEngagement: { score: engagementScore, weight: weights.userEngagement },
        systemHealth: { score: systemScore, weight: weights.systemHealth },
      },
      recommendations,
      lastCalculated: now.toISOString(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in company-health-score:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao calcular health score' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
