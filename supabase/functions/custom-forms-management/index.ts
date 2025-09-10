import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Custom Forms Management function started")

interface Database {
  public: {
    Tables: {
      custom_forms: {
        Row: {
          id: string
          company_id: string
          created_by_user_id: string
          title: string
          description: string | null
          structure_json: any
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_by_user_id: string
          title: string
          description?: string | null
          structure_json: any
          is_published?: boolean
        }
        Update: {
          title?: string
          description?: string | null
          structure_json?: any
          is_published?: boolean
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_id: string
          submitted_by_user_id: string
          company_id: string
          submission_data: any
          submitted_at: string
        }
        Insert: {
          form_id: string
          submitted_by_user_id: string
          company_id: string
          submission_data: any
        }
      }
    }
  }
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter(Boolean)
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const method = req.method
    const body = method !== 'GET' ? await req.json() : null

    // Route: GET /forms - List all forms
    if (method === 'GET' && segments.length === 0) {
      const { data: forms, error } = await supabase
        .from('custom_forms')
        .select(`
          id,
          title,
          description,
          is_published,
          created_at,
          updated_at,
          form_submissions(count)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const formsWithCount = forms.map(form => ({
        ...form,
        submission_count: form.form_submissions?.[0]?.count || 0
      }))

      return new Response(JSON.stringify(formsWithCount), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Route: POST /forms - Create new form
    if (method === 'POST' && segments.length === 0) {
      const { data, error } = await supabase
        .from('custom_forms')
        .insert({
          company_id: body.company_id,
          created_by_user_id: user.id,
          title: body.title,
          description: body.description,
          structure_json: body.structure_json,
          is_published: body.is_published || false
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    // Route: GET /forms/{formId} - Get specific form
    if (method === 'GET' && segments.length === 1) {
      const formId = segments[0]
      
      const { data: form, error } = await supabase
        .from('custom_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(form), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Route: PUT /forms/{formId} - Update form
    if (method === 'PUT' && segments.length === 1) {
      const formId = segments[0]
      
      const { data, error } = await supabase
        .from('custom_forms')
        .update({
          title: body.title,
          description: body.description,
          structure_json: body.structure_json,
          is_published: body.is_published
        })
        .eq('id', formId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Route: DELETE /forms/{formId} - Delete form
    if (method === 'DELETE' && segments.length === 1) {
      const formId = segments[0]
      
      const { error } = await supabase
        .from('custom_forms')
        .delete()
        .eq('id', formId)

      if (error) throw error

      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      })
    }

    // Route: POST /forms/{formId}/submissions - Submit form response
    if (method === 'POST' && segments.length === 2 && segments[1] === 'submissions') {
      const formId = segments[0]
      
      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          submitted_by_user_id: user.id,
          company_id: body.company_id,
          submission_data: body.submission_data
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    // Route: GET /forms/{formId}/submissions - Get form submissions
    if (method === 'GET' && segments.length === 2 && segments[1] === 'submissions') {
      const formId = segments[0]
      
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select(`
          id,
          submission_data,
          submitted_at,
          profiles!submitted_by_user_id(full_name)
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(submissions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response('Not Found', {
      headers: corsHeaders,
      status: 404,
    })

  } catch (error) {
    console.error('Error in custom-forms-management function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})