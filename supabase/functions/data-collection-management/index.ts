import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const company_id = profile.company_id
    const url = new URL(req.url)
    const path = url.pathname

    if (req.method === 'GET' && path.includes('/tasks')) {
      return await getTasks(supabaseClient, company_id, url.searchParams)
    } else if (req.method === 'POST' && path.includes('/tasks')) {
      const body = await req.json()
      return await createTask(supabaseClient, company_id, user.id, body)
    } else if (req.method === 'PUT' && path.includes('/complete')) {
      const taskId = url.searchParams.get('id')
      if (taskId) {
        return await completeTask(supabaseClient, company_id, taskId)
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in data-collection-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getTasks(supabase: any, company_id: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('data_collection_tasks')
    .select(`
      *,
      assigned_user:profiles!data_collection_tasks_assigned_to_user_id_fkey(id, full_name),
      related_asset:assets(id, name)
    `)
    .eq('company_id', company_id)
    .order('due_date', { ascending: true })

  const assignee = searchParams.get('assignee')
  if (assignee === 'me') {
    query = query.eq('assigned_to_user_id', company_id)
  } else if (assignee && assignee !== 'all') {
    query = query.eq('assigned_to_user_id', assignee)
  }

  const status = searchParams.get('status')
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createTask(supabase: any, company_id: string, user_id: string, taskData: any) {
  const { data, error } = await supabase
    .from('data_collection_tasks')
    .insert({
      ...taskData,
      company_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function completeTask(supabase: any, company_id: string, task_id: string) {
  const { data, error } = await supabase
    .from('data_collection_tasks')
    .update({ 
      status: 'Concluído',
      updated_at: new Date().toISOString()
    })
    .eq('id', task_id)
    .eq('company_id', company_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to complete task: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}