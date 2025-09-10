import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    console.log(`${method} ${path}`);

    // Routes
    if (path === '/compliance-management/tasks' && method === 'GET') {
      const status = url.searchParams.get('status');
      const dueInDays = url.searchParams.get('due_in_days');
      const responsibleMe = url.searchParams.get('responsible') === 'me';

      let query = supabase
        .from('compliance_tasks')
        .select(`
          *,
          requirement:regulatory_requirements(title, reference_code),
          responsible:profiles!compliance_tasks_responsible_user_id_fkey(full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('due_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      if (dueInDays) {
        const daysAhead = parseInt(dueInDays);
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysAhead);
        query = query.lte('due_date', targetDate.toISOString().split('T')[0]);
      }

      if (responsibleMe) {
        query = query.eq('responsible_user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/compliance-management/tasks' && method === 'POST') {
      const body = await req.json();
      
      const { data, error } = await supabase
        .from('compliance_tasks')
        .insert({
          ...body,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: profile.company_id,
        p_user_id: user.id,
        p_action_type: 'compliance_task_created',
        p_description: `Tarefa de compliance criada: ${body.title}`,
        p_details_json: { task_id: data.id }
      });

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/compliance-management/tasks/') && method === 'PUT') {
      const taskId = path.split('/')[3];
      const body = await req.json();

      const { data, error } = await supabase
        .from('compliance_tasks')
        .update(body)
        .eq('id', taskId)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: profile.company_id,
        p_user_id: user.id,
        p_action_type: 'compliance_task_updated',
        p_description: `Tarefa de compliance atualizada: ${data.title}`,
        p_details_json: { task_id: taskId, changes: body }
      });

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/compliance-management/requirements' && method === 'GET') {
      const { data, error } = await supabase
        .from('regulatory_requirements')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requirements:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/compliance-management/requirements' && method === 'POST') {
      const body = await req.json();
      
      const { data, error } = await supabase
        .from('regulatory_requirements')
        .insert({
          ...body,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating requirement:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: profile.company_id,
        p_user_id: user.id,
        p_action_type: 'regulatory_requirement_created',
        p_description: `Requisito regulatório mapeado: ${body.title}`,
        p_details_json: { requirement_id: data.id }
      });

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/compliance-management/stats' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysDate = thirtyDaysFromNow.toISOString().split('T')[0];

      // Get all stats in parallel
      const [requirementsResult, tasksResult, pendingResult, duingSoonResult, overdueResult] = await Promise.all([
        supabase.from('regulatory_requirements').select('id', { count: 'exact' }).eq('company_id', profile.company_id),
        supabase.from('compliance_tasks').select('id', { count: 'exact' }).eq('company_id', profile.company_id),
        supabase.from('compliance_tasks').select('id', { count: 'exact' }).eq('company_id', profile.company_id).eq('status', 'Pendente'),
        supabase.from('compliance_tasks').select('id', { count: 'exact' }).eq('company_id', profile.company_id).lte('due_date', thirtyDaysDate).neq('status', 'Concluído'),
        supabase.from('compliance_tasks').select('id', { count: 'exact' }).eq('company_id', profile.company_id).lt('due_date', today).neq('status', 'Concluído')
      ]);

      const stats = {
        totalRequirements: requirementsResult.count || 0,
        totalTasks: tasksResult.count || 0,
        pendingTasks: pendingResult.count || 0,
        duingSoon: duingSoonResult.count || 0,
        overdueTasks: overdueResult.count || 0
      };

      return new Response(
        JSON.stringify(stats),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});