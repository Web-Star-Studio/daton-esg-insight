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

    if (req.method === 'GET' && path.includes('/audit-trail')) {
      return await getAuditTrail(supabaseClient, company_id, url.searchParams)
    } else if (req.method === 'GET' && path.includes('/audits')) {
      return await getAudits(supabaseClient, company_id)
    } else if (req.method === 'POST' && path.includes('/audits')) {
      const body = await req.json()
      return await createAudit(supabaseClient, company_id, user.id, body)
    } else if (req.method === 'GET' && path.includes('/findings')) {
      const auditId = url.searchParams.get('audit_id')
      if (auditId) {
        return await getFindings(supabaseClient, company_id, auditId)
      }
    } else if (req.method === 'POST' && path.includes('/findings')) {
      const body = await req.json()
      return await createFinding(supabaseClient, company_id, user.id, body)
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in audit-management function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getAuditTrail(supabase: any, company_id: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      user:profiles!activity_logs_user_id_fkey(id, full_name)
    `)
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })
    .limit(100)

  const action_type = searchParams.get('action_type')
  if (action_type) {
    query = query.eq('action_type', action_type)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch audit trail: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAudits(supabase: any, company_id: string) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch audits: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createAudit(supabase: any, company_id: string, user_id: string, auditData: any) {
  const { data, error } = await supabase
    .from('audits')
    .insert({
      ...auditData,
      company_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create audit: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getFindings(supabase: any, company_id: string, audit_id: string) {
  const { data, error } = await supabase
    .from('audit_findings')
    .select(`
      *,
      responsible_user:profiles!audit_findings_responsible_user_id_fkey(id, full_name)
    `)
    .eq('audit_id', audit_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch findings: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createFinding(supabase: any, company_id: string, user_id: string, findingData: any) {
  const { data, error } = await supabase
    .from('audit_findings')
    .insert(findingData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create finding: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}