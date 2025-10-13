import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ActionSchema } from './validation.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      console.error('❌ Profile not found:', profileError)
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Company found:', profile.company_id)

    const company_id = profile.company_id
    const body = await req.json()
    
    // Validate request body with Zod
    try {
      const validatedData = ActionSchema.parse(body)
      console.log('✅ Request validated:', validatedData.action)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('❌ Validation failed:', validationError.errors)
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed',
            details: validationError.errors 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw validationError
    }
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
    console.error('❌ Error in custom-forms-management function:', error)
    
    // Log structured error
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : 'Unknown error',
      function: 'custom-forms-management'
    }
    console.error('Error details:', JSON.stringify(errorLog, null, 2))
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
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
      *
    `)
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch forms: ${error.message}`)
  }

  // Manually fetch user data for each form
  const formsWithUsers = await Promise.all(
    (data || []).map(async (form: any) => {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', form.created_by_user_id)
        .single()

      return {
        ...form,
        created_by: userData
      }
    })
  )

  return new Response(
    JSON.stringify(formsWithUsers),
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
    .select('*')
    .eq('form_id', form_id)
    .eq('company_id', company_id)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`)
  }

  // Manually fetch user data for each submission
  const submissionsWithUsers = await Promise.all(
    (data || []).map(async (submission: any) => {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', submission.submitted_by_user_id)
        .single()

      return {
        ...submission,
        submitted_by: userData
      }
    })
  )

  return new Response(
    JSON.stringify(submissionsWithUsers),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}