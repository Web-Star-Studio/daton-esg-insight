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

    console.log(`Starting GHG recalculation for company ${profile.company_id} from ${period_start} to ${period_end}`)

    // Get activity data for the period
    const { data: activityData, error: activityError } = await supabaseClient
      .from('activity_data')
      .select(`
        id,
        quantity,
        unit,
        period_start_date,
        period_end_date,
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

    // Process each activity data record
    for (const activity of activityData || []) {
      try {
        processedRecords++
        console.log(`Processing activity ${activity.id} - ${activity.emission_source.name}`)

        // Get compatible emission factors
        const { data: factors } = await supabaseClient
          .from('emission_factors')
          .select('*')
          .eq('category', activity.emission_source.category)
          .limit(10)

        if (!factors || factors.length === 0) {
          console.log(`No emission factors found for category: ${activity.emission_source.category}`)
          continue
        }

        // Find compatible factor (for now, just use the first one)
        const factor = factors[0]

        // Convert units if needed (simplified conversion)
        let convertedQuantity = activity.quantity
        const unitConversions: { [key: string]: { [key: string]: number } } = {
          'kg': { 'tonnes': 1000, 't': 1000 },
          'tonnes': { 'kg': 0.001 },
          't': { 'kg': 0.001 },
          'litros': { 'L': 1, 'm3': 0.001 },
          'L': { 'litros': 1, 'm3': 0.001 }
        }

        if (activity.unit !== factor.activity_unit) {
          const conversion = unitConversions[activity.unit]?.[factor.activity_unit]
          if (conversion) {
            convertedQuantity = activity.quantity / conversion
          } else {
            console.log(`Cannot convert ${activity.unit} to ${factor.activity_unit}`)
            continue
          }
        }

        // Calculate emissions (kg CO2e)
        const co2Emissions = (factor.co2_factor || 0) * convertedQuantity
        const ch4Emissions = (factor.ch4_factor || 0) * convertedQuantity * 25 // GWP for CH4
        const n2oEmissions = (factor.n2o_factor || 0) * convertedQuantity * 298 // GWP for N2O

        const totalCo2e = (co2Emissions + ch4Emissions + n2oEmissions) / 1000 // Convert to tonnes

        // Save calculation result
        const { error: calculationError } = await supabaseClient
          .from('calculated_emissions')
          .upsert({
            activity_data_id: activity.id,
            emission_factor_id: factor.id,
            total_co2e: totalCo2e,
            details_json: {
              co2_emissions: co2Emissions,
              ch4_emissions: ch4Emissions,
              n2o_emissions: n2oEmissions,
              converted_quantity: convertedQuantity,
              original_quantity: activity.quantity,
              original_unit: activity.unit,
              factor_unit: factor.activity_unit,
              calculation_date: new Date().toISOString()
            }
          }, {
            onConflict: 'activity_data_id'
          })

        if (calculationError) {
          console.error(`Error saving calculation for activity ${activity.id}:`, calculationError)
        } else {
          successfulCalculations++
          console.log(`Successfully calculated emissions for activity ${activity.id}: ${totalCo2e.toFixed(3)} tCO2e`)
        }

      } catch (activityError) {
        console.error(`Error processing activity ${activity.id}:`, activityError)
      }
    }

    const response = {
      success: true,
      message: 'GHG recalculation completed',
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