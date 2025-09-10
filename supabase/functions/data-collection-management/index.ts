import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      data_collection_tasks: {
        Row: {
          id: string
          company_id: string
          name: string
          description?: string
          frequency: string
          due_date: string
          period_start: string
          period_end: string
          status: string
          assigned_to_user_id?: string
          related_asset_id?: string
          task_type: string
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['data_collection_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['data_collection_tasks']['Insert']>
      }
    }
  }
}

serve(async (req) => {
  console.log(`${req.method} ${req.url}`)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)

    // GET /functions/v1/data-collection-management/tasks
    if (req.method === 'GET' && path[path.length - 1] === 'tasks') {
      const assignee = url.searchParams.get('assignee')
      const status = url.searchParams.get('status')
      
      let query = supabase
        .from('data_collection_tasks')
        .select(`
          *,
          assets:related_asset_id(name),
          profiles:assigned_to_user_id(full_name)
        `)
        .order('due_date', { ascending: true })

      if (assignee === 'me') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          query = query.eq('assigned_to_user_id', user.id)
        }
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tasks:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /functions/v1/data-collection-management/tasks/{id}/complete
    if (req.method === 'PUT' && path.includes('complete')) {
      const taskId = path[path.length - 2]
      
      const { data, error } = await supabase
        .from('data_collection_tasks')
        .update({ status: 'Concluído' })
        .eq('id', taskId)
        .select()

      if (error) {
        console.error('Error completing task:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /functions/v1/data-collection-management/tasks
    if (req.method === 'POST' && path[path.length - 1] === 'tasks') {
      const body = await req.json()
      
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const taskData = {
        ...body,
        company_id: profile.company_id,
      }

      const { data, error } = await supabase
        .from('data_collection_tasks')
        .insert(taskData)
        .select()

      if (error) {
        console.error('Error creating task:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})