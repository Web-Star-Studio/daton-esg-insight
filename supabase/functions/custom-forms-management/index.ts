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
    if (!authHeader) {
      return new Response('Authorization header missing', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
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
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'GET_FORMS':
        return await getForms(supabaseClient, company_id)
      
      case 'GET_FORM':
        return await getForm(supabaseClient, company_id, body.formId)
      
      case 'CREATE_FORM':
        return await createForm(supabaseClient, company_id, user.id, body)
      
      case 'UPDATE_FORM':
        return await updateForm(supabaseClient, company_id, body.formId, body)
      
      case 'DELETE_FORM':
        return await deleteForm(supabaseClient, company_id, body.formId)
      
      case 'SUBMIT_FORM':
        return await submitForm(supabaseClient, company_id, user.id, body)
      
      case 'GET_SUBMISSIONS':
        return await getSubmissions(supabaseClient, company_id, body.formId)
      
      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders })
    }

  } catch (error) {
    console.error('Error in custom-forms-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getForms(supabase: any, company_id: string) {
  const { data, error } = await supabase
    .from('custom_forms')
    .select(`
      *,
      created_by:profiles!custom_forms_created_by_user_id_fkey(id, full_name)
    `)
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch forms: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getForm(supabase: any, company_id: string, form_id: string) {
  const { data, error } = await supabase
    .from('custom_forms')
    .select('*')
    .eq('id', form_id)
    .eq('company_id', company_id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch form: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createForm(supabase: any, company_id: string, user_id: string, formData: any) {
  const { data, error } = await supabase
    .from('custom_forms')
    .insert({
      title: formData.title,
      description: formData.description,
      structure_json: formData.structure_json,
      is_published: formData.is_published || false,
      company_id,
      created_by_user_id: user_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create form: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateForm(supabase: any, company_id: string, form_id: string, updateData: any) {
  const { data, error } = await supabase
    .from('custom_forms')
    .update({
      title: updateData.title,
      description: updateData.description,
      structure_json: updateData.structure_json,
      is_published: updateData.is_published,
      updated_at: new Date().toISOString()
    })
    .eq('id', form_id)
    .eq('company_id', company_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update form: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteForm(supabase: any, company_id: string, form_id: string) {
  const { error } = await supabase
    .from('custom_forms')
    .delete()
    .eq('id', form_id)
    .eq('company_id', company_id)

  if (error) {
    throw new Error(`Failed to delete form: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function submitForm(supabase: any, company_id: string, user_id: string, submissionData: any) {
  const { data, error } = await supabase
    .from('form_submissions')
    .insert({
      form_id: submissionData.form_id,
      submission_data: submissionData.submission_data,
      company_id,
      submitted_by_user_id: user_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to submit form: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getSubmissions(supabase: any, company_id: string, form_id: string) {
  const { data, error } = await supabase
    .from('form_submissions')
    .select(`
      *,
      submitted_by:profiles!form_submissions_submitted_by_user_id_fkey(id, full_name)
    `)
    .eq('form_id', form_id)
    .eq('company_id', company_id)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}