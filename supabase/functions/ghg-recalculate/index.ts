import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Simplified edge function using direct emission factors (kg CO2e per unit)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    // Get user and company
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['Admin', 'Editor'].includes(profile.role)) {
      return new Response('Insufficient permissions', { status: 403, headers: corsHeaders })
    }

    // Get request data
    const { period_start, period_end } = await req.json()

    console.log(`Starting simplified GHG recalculation for company ${profile.company_id}`)

    // Get activity data for the period
    const { data: activityData, error: activityError } = await supabaseClient
      .from('activity_data')
      .select(`
        id,
        quantity,
        unit,
        emission_source:emission_sources(
          id,
          name,
          category,
          scope,
          company_id
        )
      `)
      .eq('emission_source.company_id', profile.company_id)
      .gte('period_start_date', period_start)
      .lte('period_end_date', period_end)

    if (activityError) {
      console.error('Error fetching activity data:', activityError)
      throw new Error(`Failed to fetch activity data: ${activityError.message}`)
    }

    console.log(`Found ${activityData?.length || 0} activity records to recalculate`)

    let processedRecords = 0
    let successfulCalculations = 0

    // Process each activity data record using simplified calculation
    for (const activity of activityData || []) {
      try {
        processedRecords++
        console.log(`Processing activity ${activity.id} - ${activity.emission_source.name}`)

        // Get compatible emission factors
        const { data: factors } = await supabaseClient
          .from('emission_factors')
          .select('*')
          .eq('category', activity.emission_source.category)
          .eq('type', 'system')
          .limit(5)

        if (!factors || factors.length === 0) {
          console.log(`No emission factors found for category: ${activity.emission_source.category}`)
          continue
        }

        // Find compatible factor by unit or use the first one
        const factor = factors.find(f => f.activity_unit === activity.unit) || factors[0]

        // Use database function for calculation
        const { data: result, error: calcError } = await supabaseClient
          .rpc('calculate_simple_emissions', {
            p_activity_quantity: activity.quantity,
            p_activity_unit: activity.unit,
            p_factor_co2: factor.co2_factor || 0,
            p_factor_ch4: factor.ch4_factor || 0,
            p_factor_n2o: factor.n2o_factor || 0,
            p_factor_unit: factor.activity_unit
          })

        if (calcError) {
          console.error(`Calculation error for activity ${activity.id}:`, calcError)
          continue
        }

        // Cast result to proper type
        const calculationResult = result as {
          total_co2e_tonnes: number;
          co2_kg: number;
          ch4_kg: number;
          n2o_kg: number;
          conversion_factor_used: number;
          calculation_method: string;
        };

        // Save calculation result
        const { error: calculationError } = await supabaseClient
          .from('calculated_emissions')
          .upsert({
            activity_data_id: activity.id,
            emission_factor_id: factor.id,
            total_co2e: calculationResult.total_co2e_tonnes,
            fossil_co2e: calculationResult.total_co2e_tonnes, // Assume all fossil for simplicity
            biogenic_co2e: 0,
            details_json: {
              ...calculationResult,
              factor_name: factor.name,
              calculation_method: 'simple_direct_edge_function'
            }
          }, {
            onConflict: 'activity_data_id'
          })

        if (calculationError) {
          console.error(`Error saving calculation for activity ${activity.id}:`, calculationError)
        } else {
          successfulCalculations++
          console.log(`Successfully calculated emissions for activity ${activity.id}: ${calculationResult.total_co2e_tonnes} tCO2e`)
        }

      } catch (activityError) {
        console.error(`Error processing activity ${activity.id}:`, activityError)
      }
    }

    const response = {
      success: true,
      message: 'Simplified GHG recalculation completed',
      details: {
        period_start,
        period_end,
        company_id: profile.company_id,
        processed_records: processedRecords,
        successful_calculations: successfulCalculations,
        failed_calculations: processedRecords - successfulCalculations
      }
    }

    console.log('Recalculation completed:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in ghg-recalculate function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})