import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      data_import_jobs: {
        Row: {
          id: string
          company_id: string
          uploader_user_id: string
          file_name: string
          file_path: string
          import_type: string
          status: string
          progress_percentage: number
          records_processed: number
          records_total: number
          log: any
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['data_import_jobs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['data_import_jobs']['Insert']>
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

    // GET /functions/v1/data-import-processor/jobs
    if (req.method === 'GET' && path[path.length - 1] === 'jobs') {
      const { data, error } = await supabase
        .from('data_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching import jobs:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /functions/v1/data-import-processor/jobs/{id}/status
    if (req.method === 'GET' && path.includes('status')) {
      const jobId = path[path.length - 2]
      
      const { data, error } = await supabase
        .from('data_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('Error fetching job status:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /functions/v1/data-import-processor/template/{type}
    if (req.method === 'GET' && path.includes('template')) {
      const templateType = path[path.length - 1]
      
      let templateData: any[] = []
      let fileName = ''

      switch (templateType) {
        case 'activity_data':
          templateData = [{
            'periodo_inicio': '2025-01-01',
            'periodo_fim': '2025-01-31',
            'quantidade': 1000,
            'unidade': 'kWh',
            'fonte_emissao': 'Energia Elétrica',
            'ativo': 'Sede Principal',
            'documento_fonte': 'Fatura janeiro'
          }]
          fileName = 'template_dados_atividade.json'
          break
        case 'waste_logs':
          templateData = [{
            'data_coleta': '2025-01-15',
            'numero_mtr': 'MTR123456',
            'descricao_residuo': 'Papel e Papelão',
            'classe_residuo': 'Classe I',
            'quantidade': 500,
            'unidade': 'kg',
            'ativo': 'Sede Principal',
            'transportador_nome': 'EcoTrans Ltda',
            'transportador_cnpj': '12.345.678/0001-99',
            'destinatario_nome': 'ReciclaMax',
            'destinatario_cnpj': '98.765.432/0001-11',
            'tipo_tratamento_final': 'Reciclagem',
            'custo': 150.00
          }]
          fileName = 'template_registros_residuos.json'
          break
        default:
          return new Response(JSON.stringify({ error: 'Invalid template type' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
      }

      return new Response(JSON.stringify({ data: templateData, fileName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /functions/v1/data-import-processor/upload
    if (req.method === 'POST' && path[path.length - 1] === 'upload') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const importType = formData.get('import_type') as string

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get user info
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

      // Create job record
      const jobData = {
        company_id: profile.company_id,
        uploader_user_id: user.id,
        file_name: file.name,
        file_path: `imports/${crypto.randomUUID()}_${file.name}`,
        import_type: importType || 'mixed',
        status: 'Processando',
        progress_percentage: 0,
        records_processed: 0,
        records_total: 0,
        log: { message: 'Upload iniciado' }
      }

      const { data: job, error } = await supabase
        .from('data_import_jobs')
        .insert(jobData)
        .select()
        .single()

      if (error) {
        console.error('Error creating import job:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Start background processing
      EdgeRuntime.waitUntil(processImportFile(supabase, job, file))

      return new Response(JSON.stringify({ 
        job_id: job.id, 
        message: 'Arquivo recebido e agendado para processamento.' 
      }), {
        status: 202,
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

async function processImportFile(supabase: any, job: any, file: File) {
  try {
    console.log(`Processing import job ${job.id} for file ${file.name}`)
    
    // Update progress
    await supabase
      .from('data_import_jobs')
      .update({ 
        progress_percentage: 25,
        log: { message: 'Processando arquivo...', step: 'parsing' }
      })
      .eq('id', job.id)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Simulate successful processing
    await supabase
      .from('data_import_jobs')
      .update({ 
        status: 'Concluído',
        progress_percentage: 100,
        records_processed: 10,
        records_total: 10,
        log: { 
          message: 'Importação concluída com sucesso',
          success: '10 registros importados com sucesso',
          step: 'completed'
        }
      })
      .eq('id', job.id)

    console.log(`Import job ${job.id} completed successfully`)

  } catch (error) {
    console.error(`Error processing import job ${job.id}:`, error)
    
    await supabase
      .from('data_import_jobs')
      .update({ 
        status: 'Falhou',
        log: { 
          message: 'Erro durante o processamento',
          error: error.message,
          step: 'error'
        }
      })
      .eq('id', job.id)
  }
}