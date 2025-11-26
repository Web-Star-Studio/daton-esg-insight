import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Simplified edge function using direct emission factors (kg CO2e per unit)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response('Unauthorized: No authorization header', { status: 401, headers: corsHeaders })
    }

    // Create supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create client with user's token for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response('Unauthorized: Invalid token', { status: 401, headers: corsHeaders })
    }

    console.log(`User authenticated: ${user.id}`)

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      console.error('User profile not found')
      return new Response('User profile not found', { status: 404, headers: corsHeaders })
    }

    console.log(`Profile found for user ${user.id}, company: ${profile.company_id}`)

    // Verificar role da tabela user_roles (fonte de verdade)
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['admin', 'manager', 'super_admin', 'platform_admin'].includes(userRole.role)) {
      console.error('Insufficient permissions for user:', user.id, 'role:', userRole?.role)
      return new Response('Insufficient permissions', { status: 403, headers: corsHeaders })
    }

    console.log(`User ${user.id} has role: ${userRole.role}`)

    // Get request data
    const { period_start, period_end } = await req.json()

    console.log(`Starting simplified GHG recalculation for company ${profile.company_id}`)

    // Get activity data for the period (use admin client for data operations)
    const { data: activityData, error: activityError } = await supabaseAdmin
      .from('activity_data')
      .select(`
        id,
        quantity,
        unit,
        emission_source_id,
        emission_sources!inner(
          id,
          name,
          category,
          scope,
          company_id
        )
      `)
      .eq('emission_sources.company_id', profile.company_id)
      .gte('period_start_date', period_start)
      .lte('period_end_date', period_end)

    if (activityError) {
      console.error('Error fetching activity data:', activityError)
      throw new Error(`Failed to fetch activity data: ${activityError.message}`)
    }

    console.log(`Found ${activityData?.length || 0} activity records to recalculate`)

    if (activityData && activityData.length > 0) {
      console.log('Sample activity record:', JSON.stringify(activityData[0], null, 2))
    } else {
      console.log('No activity data found for the specified period')
    }

    let processedRecords = 0
    let successfulCalculations = 0

    // Process each activity data record using simplified calculation
    for (const activity of activityData || []) {
      try {
        processedRecords++
        console.log(`Processing activity ${activity.id} - ${activity.emission_sources.name}`)

        // Get compatible emission factors
        const { data: factors } = await supabaseClient
          .from('emission_factors')
          .select('*')
          .eq('category', activity.emission_sources.category)
          .eq('type', 'system')
          .limit(5)

        if (!factors || factors.length === 0) {
          console.log(`No emission factors found for category: ${activity.emission_sources.category}, activity: ${activity.id}`)
          continue
        }

        // Find compatible factor by unit or use the first one
        const factor = factors.find(f => f.activity_unit === activity.unit) || factors[0]

        console.log(`Using emission factor: ${factor.name} (${factor.activity_unit}) for activity ${activity.id}`)

        if (!factor.co2_factor && !factor.ch4_factor && !factor.n2o_factor) {
          console.log(`Warning: Emission factor ${factor.id} has no CO2, CH4, or N2O factors`)
        }

        // Use database function for calculation (use admin client)
        const { data: result, error: calcError } = await supabaseAdmin
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

        if (!result) {
          console.error(`No result returned from calculate_simple_emissions for activity ${activity.id}`)
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

        // Save calculation result (use admin client)
        const { error: calculationError } = await supabaseAdmin
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
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})