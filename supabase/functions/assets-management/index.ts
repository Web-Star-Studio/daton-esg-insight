import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Asset {
  id: string
  company_id: string
  name: string
  asset_type: string
  location?: string
  description?: string
  parent_asset_id?: string
  created_at: string
  updated_at: string
  children?: Asset[]
}

interface AssetWithLinkedData extends Asset {
  linked_emission_sources: any[]
  linked_licenses: any[]
  linked_waste_logs: any[]
  kpis: {
    total_emissions: number
    active_licenses: number
    waste_records: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const assetId = pathSegments[pathSegments.length - 1]

    console.log('Assets Management - Method:', req.method, 'Path:', url.pathname)

    // GET /assets - Lista hierárquica de ativos
    if (req.method === 'GET' && !assetId.match(/^[0-9a-f-]{36}$/i)) {
      const { data: assets, error } = await supabaseClient
        .from('assets')
        .select('*')
        .order('created_at')

      if (error) {
        console.error('Error fetching assets:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Organizar em estrutura hierárquica
      const hierarchicalAssets = buildHierarchy(assets || [])

      return new Response(JSON.stringify({ assets: hierarchicalAssets }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /assets/{id} - Detalhes de um ativo com dados vinculados
    if (req.method === 'GET' && assetId.match(/^[0-9a-f-]{36}$/i)) {
      // Buscar detalhes do ativo
      const { data: asset, error: assetError } = await supabaseClient
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single()

      if (assetError || !asset) {
        return new Response(JSON.stringify({ error: 'Asset not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Buscar dados vinculados em paralelo
      const [emissionSourcesRes, licensesRes, wasteLogsRes] = await Promise.all([
        supabaseClient
          .from('emission_sources')
          .select('id, name, category, scope, status')
          .eq('asset_id', assetId),
        supabaseClient
          .from('licenses')
          .select('id, name, type, status, expiration_date, issuing_body')
          .eq('asset_id', assetId),
        supabaseClient
          .from('waste_logs')
          .select('id, mtr_number, waste_description, quantity, unit, collection_date, status')
          .eq('asset_id', assetId)
      ])

      const linked_emission_sources = emissionSourcesRes.data || []
      const linked_licenses = licensesRes.data || []
      const linked_waste_logs = wasteLogsRes.data || []

      // Calcular KPIs
      const kpis = {
        total_emissions: linked_emission_sources.length,
        active_licenses: linked_licenses.filter(l => l.status === 'Ativa').length,
        waste_records: linked_waste_logs.length
      }

      const response: AssetWithLinkedData = {
        ...asset,
        linked_emission_sources,
        linked_licenses,
        linked_waste_logs,
        kpis
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /assets - Criar novo ativo
    if (req.method === 'POST') {
      const body = await req.json()
      
      const { data: asset, error } = await supabaseClient
        .from('assets')
        .insert([{
          name: body.name,
          asset_type: body.asset_type,
          location: body.location,
          description: body.description,
          parent_asset_id: body.parent_asset_id
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating asset:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(asset), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /assets/{id} - Atualizar ativo
    if (req.method === 'PUT' && assetId.match(/^[0-9a-f-]{36}$/i)) {
      const body = await req.json()
      
      const { data: asset, error } = await supabaseClient
        .from('assets')
        .update({
          name: body.name,
          asset_type: body.asset_type,
          location: body.location,
          description: body.description,
          parent_asset_id: body.parent_asset_id
        })
        .eq('id', assetId)
        .select()
        .single()

      if (error) {
        console.error('Error updating asset:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(asset), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /assets/{id} - Excluir ativo
    if (req.method === 'DELETE' && assetId.match(/^[0-9a-f-]{36}$/i)) {
      // Verificar se tem filhos
      const { data: children } = await supabaseClient
        .from('assets')
        .select('id')
        .eq('parent_asset_id', assetId)

      if (children && children.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Cannot delete asset with children. Move or delete child assets first.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabaseClient
        .from('assets')
        .delete()
        .eq('id', assetId)

      if (error) {
        console.error('Error deleting asset:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders,
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

function buildHierarchy(assets: Asset[]): Asset[] {
  const assetMap = new Map<string, Asset>()
  const rootAssets: Asset[] = []

  // Criar mapa de assets
  assets.forEach(asset => {
    assetMap.set(asset.id, { ...asset, children: [] })
  })

  // Construir hierarquia
  assets.forEach(asset => {
    const assetWithChildren = assetMap.get(asset.id)!
    
    if (asset.parent_asset_id) {
      const parent = assetMap.get(asset.parent_asset_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(assetWithChildren)
      }
    } else {
      rootAssets.push(assetWithChildren)
    }
  })

  return rootAssets
}