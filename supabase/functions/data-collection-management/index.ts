import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate authorization header first
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Validate user with JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return await getTasks(supabaseClient, company_id, user.id, url.searchParams)
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getTasks(supabase: any, company_id: string, user_id: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('data_collection_tasks')
    .select('*')
    .eq('company_id', company_id)
    .order('due_date', { ascending: true })

  const assignee = searchParams.get('assignee')
  if (assignee === 'me') {
    query = query.eq('assigned_to_user_id', user_id)
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