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
    let path = url.pathname;
    let method = req.method;
    let requestBody: any = {};

    // Parse request body if it exists
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        requestBody = await req.json();
      } catch (e) {
        requestBody = {};
      }
    }

    // Check if this is a request with _method and _path in body
    if (requestBody._method && requestBody._path) {
      method = requestBody._method;
      path = `/compliance-management${requestBody._path}`;
      console.log(`Service request: ${method} ${path}`);
    } else {
      console.log(`Direct request: ${method} ${path}`);
    }

    // Routes
    if (path === '/compliance-management/tasks' && method === 'GET') {
      // Extract filters from URL params or request body
      const status = url.searchParams.get('status') || requestBody.status;
      const dueInDays = url.searchParams.get('due_in_days') || requestBody.due_in_days;
      const responsible = url.searchParams.get('responsible') || requestBody.responsible;

      let query = supabase
        .from('compliance_tasks')
        .select(`
          *,
          requirement:regulatory_requirements(title, reference_code, jurisdiction),
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

      if (responsible === 'me') {
        query = query.eq('responsible_user_id', user.id);
      } else if (responsible && responsible !== 'me') {
        query = query.eq('responsible_user_id', responsible);
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
      // Create new task - extract data from requestBody, excluding internal fields
      const taskData = {
        title: requestBody.title,
        description: requestBody.description,
        frequency: requestBody.frequency,
        due_date: requestBody.due_date,
        requirement_id: requestBody.requirement_id || null,
        responsible_user_id: requestBody.responsible_user_id || null,
        notes: requestBody.notes,
        status: 'Pendente',
        company_id: profile.company_id
      };
      
      const { data, error } = await supabase
        .from('compliance_tasks')
        .insert(taskData)
        .select(`
          *,
          requirement:regulatory_requirements(title, reference_code, jurisdiction),
          responsible:profiles!compliance_tasks_responsible_user_id_fkey(full_name)
        `)
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      try {
        await supabase.rpc('log_activity', {
          p_company_id: profile.company_id,
          p_user_id: user.id,
          p_action_type: 'compliance_task_created',
          p_description: `Tarefa de compliance criada: ${taskData.title}`,
          p_details_json: { task_id: data.id }
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Don't fail the request if logging fails
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/compliance-management/tasks/') && method === 'PUT') {
      const taskId = path.split('/')[3];
      
      // Update task - extract data from requestBody, excluding internal fields
      const updateData: any = {};
      if (requestBody.title !== undefined) updateData.title = requestBody.title;
      if (requestBody.description !== undefined) updateData.description = requestBody.description;
      if (requestBody.frequency !== undefined) updateData.frequency = requestBody.frequency;
      if (requestBody.due_date !== undefined) updateData.due_date = requestBody.due_date;
      if (requestBody.status !== undefined) updateData.status = requestBody.status;
      if (requestBody.responsible_user_id !== undefined) updateData.responsible_user_id = requestBody.responsible_user_id;
      if (requestBody.evidence_document_id !== undefined) updateData.evidence_document_id = requestBody.evidence_document_id;
      if (requestBody.notes !== undefined) updateData.notes = requestBody.notes;

      const { data, error } = await supabase
        .from('compliance_tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('company_id', profile.company_id)
        .select(`
          *,
          requirement:regulatory_requirements(title, reference_code, jurisdiction),
          responsible:profiles!compliance_tasks_responsible_user_id_fkey(full_name)
        `)
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      try {
        await supabase.rpc('log_activity', {
          p_company_id: profile.company_id,
          p_user_id: user.id,
          p_action_type: 'compliance_task_updated',
          p_description: `Tarefa de compliance atualizada: ${data.title}`,
          p_details_json: { task_id: taskId, changes: updateData }
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Don't fail the request if logging fails
      }

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
      // Create new requirement - extract data from requestBody, excluding internal fields
      const requirementData = {
        title: requestBody.title,
        reference_code: requestBody.reference_code,
        jurisdiction: requestBody.jurisdiction,
        summary: requestBody.summary,
        source_url: requestBody.source_url,
        company_id: profile.company_id
      };
      
      const { data, error } = await supabase
        .from('regulatory_requirements')
        .insert(requirementData)
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
      try {
        await supabase.rpc('log_activity', {
          p_company_id: profile.company_id,
          p_user_id: user.id,
          p_action_type: 'regulatory_requirement_created',
          p_description: `Requisito regulatório mapeado: ${requirementData.title}`,
          p_details_json: { requirement_id: data.id }
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Don't fail the request if logging fails
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/compliance-management/stats' && method === 'GET') {
      console.log(`Service request: GET /compliance-management/stats for company ${profile.company_id}`);
      
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