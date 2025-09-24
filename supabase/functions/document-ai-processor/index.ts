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

    const { document_id, processing_type } = await req.json()

    // Create and return processing job
    const { data: job, error } = await supabaseClient
      .from('document_extraction_jobs')
      .insert({
        document_id,
        processing_type: processing_type || 'general_extraction',
        status: 'Processando',
        company_id: user.id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create job: ${error.message}`)

    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})