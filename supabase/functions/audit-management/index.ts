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
    
    // Handle both GET and POST with action-based routing
    let body = null
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await req.json()
    }

    if (req.method === 'GET') {
      const action = url.searchParams.get('action') || body?.action
      
      if (action === 'get-audits' || !action) {
        return await getAudits(supabaseClient, company_id)
      } else if (action === 'get-findings') {
        const auditId = url.searchParams.get('audit_id') || body?.audit_id
        return await getFindings(supabaseClient, company_id, auditId)
      } else if (action === 'audit-trail') {
        return await getAuditTrail(supabaseClient, company_id, url.searchParams)
      }
    } else if (req.method === 'POST') {
      const action = body?.action
      
      if (action === 'create-audit') {
        return await createAudit(supabaseClient, company_id, user.id, body)
      } else if (action === 'create-finding') {
        return await createFinding(supabaseClient, company_id, user.id, body)
      }
    } else if (req.method === 'PUT') {
      const action = url.searchParams.get('action') || body?.action
      
      if (action === 'update-audit') {
        const auditId = url.searchParams.get('audit_id')
        if (!auditId) {
          return new Response('Missing audit_id', { status: 400, headers: corsHeaders })
        }
        return await updateAudit(supabaseClient, company_id, auditId, body)
      } else if (action === 'update-finding') {
        return await updateFinding(supabaseClient, company_id, body.finding_id, body)
      }
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

async function updateAudit(supabase: any, company_id: string, audit_id: string, auditData: any) {
  // Verificar se a auditoria pertence à empresa do usuário
  const { data: existingAudit, error: checkError } = await supabase
    .from('audits')
    .select('id')
    .eq('id', audit_id)
    .eq('company_id', company_id)
    .single()

  if (checkError || !existingAudit) {
    throw new Error('Auditoria não encontrada ou acesso negado')
  }

  const { data, error } = await supabase
    .from('audits')
    .update({
      title: auditData.title,
      audit_type: auditData.audit_type,
      auditor: auditData.auditor,
      start_date: auditData.start_date || null,
      end_date: auditData.end_date || null,
      scope: auditData.scope,
      status: auditData.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', audit_id)
    .eq('company_id', company_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update audit: ${error.message}`)
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
    .select(`
      *,
      profiles!audit_findings_responsible_user_id_fkey(full_name)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create finding: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateFinding(supabase: any, company_id: string, finding_id: string, updateData: any) {
  // First verify the finding belongs to a company audit
  const { data: auditCheck } = await supabase
    .from('audit_findings')
    .select(`
      audit_id,
      audits!inner(company_id)
    `)
    .eq('id', finding_id)
    .single()

  if (!auditCheck || auditCheck.audits.company_id !== company_id) {
    return new Response('Finding not found or unauthorized', { status: 404, headers: corsHeaders })
  }

  const { data, error } = await supabase
    .from('audit_findings')
    .update(updateData)
    .eq('id', finding_id)
    .select(`
      *,
      profiles!audit_findings_responsible_user_id_fkey(full_name)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update finding: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}