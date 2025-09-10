import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return new Response('Company not found', { status: 404, headers: corsHeaders })
    }

    const companyId = profile.company_id

    // Route: GET /audit-trail
    if (pathSegments[0] === 'audit-trail' && method === 'GET') {
      const userId = url.searchParams.get('user_id')
      const actionType = url.searchParams.get('action_type')
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = (page - 1) * limit

      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles!activity_logs_user_id_fkey(full_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (userId) query = query.eq('user_id', userId)
      if (actionType) query = query.eq('action_type', actionType)
      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching audit trail:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ data, count, page, limit }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /audits
    if (pathSegments[0] === 'audits' && method === 'GET' && pathSegments.length === 1) {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audits:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /audits
    if (pathSegments[0] === 'audits' && method === 'POST' && pathSegments.length === 1) {
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('audits')
        .insert({
          ...body,
          company_id: companyId
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating audit:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: companyId,
        p_user_id: user.id,
        p_action_type: 'CREATE_AUDIT',
        p_description: `Criou a auditoria "${data.title}"`,
        p_details_json: { audit_id: data.id, audit_title: data.title }
      })

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /audits/{auditId}/findings
    if (pathSegments[0] === 'audits' && pathSegments[2] === 'findings' && method === 'GET') {
      const auditId = pathSegments[1]

      const { data, error } = await supabase
        .from('audit_findings')
        .select(`
          *,
          profiles!audit_findings_responsible_user_id_fkey(full_name)
        `)
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audit findings:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /audits/{auditId}/findings
    if (pathSegments[0] === 'audits' && pathSegments[2] === 'findings' && method === 'POST') {
      const auditId = pathSegments[1]
      const body = await req.json()

      const { data, error } = await supabase
        .from('audit_findings')
        .insert({
          ...body,
          audit_id: auditId
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating audit finding:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: companyId,
        p_user_id: user.id,
        p_action_type: 'CREATE_FINDING',
        p_description: `Adicionou um achado de auditoria: "${data.description.substring(0, 50)}..."`,
        p_details_json: { finding_id: data.id, audit_id: auditId }
      })

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /findings/{findingId}
    if (pathSegments[0] === 'findings' && method === 'PUT') {
      const findingId = pathSegments[1]
      const body = await req.json()

      const { data, error } = await supabase
        .from('audit_findings')
        .update(body)
        .eq('id', findingId)
        .select()
        .single()

      if (error) {
        console.error('Error updating audit finding:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_company_id: companyId,
        p_user_id: user.id,
        p_action_type: 'UPDATE_FINDING',
        p_description: `Atualizou achado de auditoria: "${data.description.substring(0, 50)}..."`,
        p_details_json: { finding_id: data.id, status: data.status }
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Error in audit-management function:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})