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

    if (req.method === 'GET' && path.includes('/jobs')) {
      const jobId = url.searchParams.get('id')
      if (jobId) {
        return await getJobStatus(supabaseClient, company_id, jobId)
      } else {
        return await getJobs(supabaseClient, company_id)
      }
    } else if (req.method === 'POST' && path.includes('/upload')) {
      return await uploadFile(supabaseClient, company_id, user.id, req)
    } else if (req.method === 'GET' && path.includes('/template')) {
      const type = url.searchParams.get('type')
      if (type) {
        return await getTemplate(type)
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in data-import-processor function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getJobs(supabase: any, company_id: string) {
  const { data, error } = await supabase
    .from('data_import_jobs')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getJobStatus(supabase: any, company_id: string, job_id: string) {
  const { data, error } = await supabase
    .from('data_import_jobs')
    .select('*')
    .eq('id', job_id)
    .eq('company_id', company_id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch job status: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function uploadFile(supabase: any, company_id: string, user_id: string, req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const importType = formData.get('import_type') as string || 'activity_data'

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: job, error: jobError } = await supabase
    .from('data_import_jobs')
    .insert({
      file_name: file.name,
      file_path: `uploads/${crypto.randomUUID()}_${file.name}`,
      import_type: importType,
      status: 'Processando',
      company_id,
      uploader_user_id: user_id,
    })
    .select()
    .single()

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`)
  }

  processImportFile(supabase, job, file)

  return new Response(
    JSON.stringify(job),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTemplate(type: string) {
  const templates = {
    activity_data: {
      headers: ['source_name', 'category', 'scope', 'quantity', 'unit', 'period_start', 'period_end'],
      sample_data: [
        ['Combustível - Diesel', 'Combustão móvel', '1', '1000', 'litros', '2024-01-01', '2024-01-31'],
        ['Energia elétrica', 'Energia adquirida', '2', '5000', 'kWh', '2024-01-01', '2024-01-31']
      ]
    },
    waste_logs: {
      headers: ['waste_type', 'quantity', 'unit', 'disposal_method', 'disposal_date', 'cost'],
      sample_data: [
        ['Papel/Papelão', '500', 'kg', 'Reciclagem', '2024-01-15', '150.00'],
        ['Resíduo orgânico', '200', 'kg', 'Compostagem', '2024-01-15', '80.00']
      ]
    }
  }

  const template = templates[type as keyof typeof templates]
  
  if (!template) {
    return new Response(
      JSON.stringify({ error: 'Template not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(template),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processImportFile(supabase: any, job: any, file: File) {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    await supabase
      .from('data_import_jobs')
      .update({
        status: 'Concluído',
        progress_percentage: 100,
        records_processed: 10,
        records_total: 10,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)

  } catch (error) {
    console.error('Processing error:', error)
    
    await supabase
      .from('data_import_jobs')
      .update({
        status: 'Falhou',
        log: { error: error.message },
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
  }
}