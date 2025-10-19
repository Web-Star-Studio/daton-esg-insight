import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { companyId } = await req.json();

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Fetch quick stats in parallel
    const [
      emissionsResult,
      goalsResult,
      licensesResult,
      tasksResult,
      employeesResult,
      ncsResult
    ] = await Promise.all([
      // Total emissions last year
      supabaseClient
        .from('calculated_emissions')
        .select('total_co2e, activity_data!inner(period_start_date)')
        .gte('activity_data.period_start_date', oneYearAgo.toISOString())
        .eq('activity_data.company_id', companyId),
      
      // Active goals
      supabaseClient
        .from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      
      // Licenses expiring in 60 days
      supabaseClient
        .from('licenses')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .lte('expiry_date', sixtyDaysFromNow.toISOString())
        .gte('expiry_date', now.toISOString())
        .in('status', ['Válida', 'Em Renovação']),
      
      // Pending tasks
      supabaseClient
        .from('data_collection_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Pendente'),
      
      // Total employees
      supabaseClient
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      
      // Open non-conformities
      supabaseClient
        .from('non_conformities')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['Aberta', 'Em Análise', 'Em Tratamento'])
    ]);

    // Calculate total emissions
    const totalEmissions = emissionsResult.data?.reduce(
      (sum, item) => sum + (item.total_co2e || 0),
      0
    ) || 0;

    const stats = {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      activeGoals: goalsResult.count || 0,
      expiringLicenses: licensesResult.count || 0,
      pendingTasks: tasksResult.count || 0,
      employees: employeesResult.count || 0,
      openNCs: ncsResult.count || 0
    };

    console.log('📊 Quick stats generated:', stats);

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching quick stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
