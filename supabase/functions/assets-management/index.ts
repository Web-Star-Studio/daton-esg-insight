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
    const pathParts = url.pathname.split('/')
    const assetId = pathParts[pathParts.length - 1]

    if (req.method === 'GET') {
      if (pathParts.includes('assets') && assetId && assetId !== 'assets') {
        return await getAssetWithLinkedData(supabaseClient, company_id, assetId)
      } else {
        return await getAllAssets(supabaseClient, company_id)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()
      return await createAsset(supabaseClient, company_id, body)
    } else if (req.method === 'PUT') {
      const body = await req.json()
      return await updateAsset(supabaseClient, company_id, assetId, body)
    } else if (req.method === 'DELETE') {
      return await deleteAsset(supabaseClient, company_id, assetId)
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Error in assets-management function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getAllAssets(supabase: any, company_id: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`)
  }

  const hierarchy = buildHierarchy(data || [])

  return new Response(
    JSON.stringify({ assets: hierarchy }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAssetWithLinkedData(supabase: any, company_id: string, asset_id: string) {
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', asset_id)
    .eq('company_id', company_id)
    .single()

  if (assetError) {
    throw new Error(`Failed to fetch asset: ${assetError.message}`)
  }

  const { data: emissionSources } = await supabase
    .from('emission_sources')
    .select('*')
    .eq('asset_id', asset_id)

  const { data: licenses } = await supabase
    .from('licenses')
    .select('*')
    .eq('asset_id', asset_id)

  const kpis = await calculateAssetKPIs(supabase, asset_id, company_id)

  const assetWithLinkedData = {
    ...asset,
    emission_sources: emissionSources || [],
    licenses: licenses || [],
    waste_logs: [],
    kpis: kpis
  }

  return new Response(
    JSON.stringify(assetWithLinkedData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createAsset(supabase: any, company_id: string, assetData: any) {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      ...assetData,
      company_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateAsset(supabase: any, company_id: string, asset_id: string, updateData: any) {
  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', asset_id)
    .eq('company_id', company_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteAsset(supabase: any, company_id: string, asset_id: string) {
  const { data: children } = await supabase
    .from('assets')
    .select('id')
    .eq('parent_asset_id', asset_id)
    .eq('company_id', company_id)

  if (children && children.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Cannot delete asset with child assets' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', asset_id)
    .eq('company_id', company_id)

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function buildHierarchy(assets: any[]): any[] {
  const assetMap = new Map()
  const rootAssets = []

  for (const asset of assets) {
    assetMap.set(asset.id, { ...asset, children: [] })
  }

  for (const asset of assets) {
    const assetWithChildren = assetMap.get(asset.id)
    
    if (asset.parent_asset_id) {
      const parent = assetMap.get(asset.parent_asset_id)
      if (parent) {
        parent.children.push(assetWithChildren)
      } else {
        rootAssets.push(assetWithChildren)
      }
    } else {
      rootAssets.push(assetWithChildren)
    }
  }

  return rootAssets
}

async function calculateAssetKPIs(supabase: any, asset_id: string, company_id: string) {
  const kpis = []

  const { data: emissionSources } = await supabase
    .from('emission_sources')
    .select('id')
    .eq('asset_id', asset_id)

  if (emissionSources && emissionSources.length > 0) {
    const sourceIds = emissionSources.map((s: any) => s.id)
    
    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select(`
        total_co2e,
        activity_data!inner(emission_source_id)
      `)
      .in('activity_data.emission_source_id', sourceIds)

    const totalEmissions = emissions?.reduce((sum: number, item: any) => sum + (item.total_co2e || 0), 0) || 0

    kpis.push({
      key: 'total_emissions',
      label: 'Emissões Totais',
      value: totalEmissions.toFixed(2),
      unit: 'tCO₂e'
    })
  }

  return kpis
}