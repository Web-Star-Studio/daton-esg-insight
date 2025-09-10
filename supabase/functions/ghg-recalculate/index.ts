import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    // Check permissions (Admin or Editor required)
    if (profile.role !== 'Admin' && profile.role !== 'Editor') {
      throw new Error('Insufficient permissions');
    }

    const { period_start, period_end } = await req.json();
    
    console.log(`Starting recalculation for company ${profile.company_id}, period: ${period_start} to ${period_end}`);

    // Get all activity data within the specified period for the company
    const { data: activityData, error: activityError } = await supabase
      .from('activity_data')
      .select(`
        *,
        emission_sources!inner (
          id,
          name,
          category,
          company_id
        )
      `)
      .eq('emission_sources.company_id', profile.company_id)
      .gte('period_start_date', period_start || '2024-01-01')
      .lte('period_end_date', period_end || '2024-12-31');

    if (activityError) {
      throw new Error(`Failed to fetch activity data: ${activityError.message}`);
    }

    console.log(`Found ${activityData?.length || 0} activity records to recalculate`);

    let recalculatedCount = 0;
    let errorCount = 0;

    // Process each activity data record
    for (const activity of activityData || []) {
      try {
        console.log(`Recalculating emissions for activity ${activity.id}`);

        // Get emission factors for this category
        const { data: factors, error: factorsError } = await supabase
          .from('emission_factors')
          .select('*')
          .eq('category', activity.emission_sources.category);

        if (factorsError) {
          console.error(`Failed to fetch emission factors: ${factorsError.message}`);
          errorCount++;
          continue;
        }

        // Find compatible emission factor (improved unit matching)
        const compatibleFactor = factors.find(factor => {
          const factorUnit = factor.activity_unit.toLowerCase();
          const activityUnit = activity.unit.toLowerCase();
          
          // Direct match
          if (factorUnit === activityUnit) return true;
          
          // Common unit conversions
          const unitEquivalents = {
            'litros': ['l', 'litro', 'liters'],
            'l': ['litros', 'litro', 'liters'],
            'kwh': ['kw.h', 'kw-h', 'quilowatt-hora'],
            'm³': ['m3', 'metros cúbicos', 'metro cúbico'],
            'm3': ['m³', 'metros cúbicos', 'metro cúbico'],
            'kg': ['quilograma', 'quilogramas', 'kilograma'],
            't': ['tonelada', 'toneladas', 'ton']
          };
          
          return unitEquivalents[factorUnit]?.includes(activityUnit) || 
                 unitEquivalents[activityUnit]?.includes(factorUnit);
        });

        if (!compatibleFactor) {
          console.log(`No compatible emission factor found for activity ${activity.id}`);
          continue;
        }

        // Calculate emissions using corrected GWP values (IPCC AR5)
        const co2Emissions = activity.quantity * (compatibleFactor.co2_factor || 0);
        const ch4Emissions = activity.quantity * (compatibleFactor.ch4_factor || 0);
        const n2oEmissions = activity.quantity * (compatibleFactor.n2o_factor || 0);

        // Convert to CO2 equivalent using correct GWP factors (IPCC AR6 - Correção Emergencial)
        const gwpCH4 = 27;  // IPCC AR6 (não-fóssil/combustão)
        const gwpN2O = 273; // IPCC AR6

        const totalCo2eGrams = co2Emissions + (ch4Emissions * gwpCH4) + (n2oEmissions * gwpN2O);
        const totalCo2eKg = totalCo2eGrams / 1000;
        const totalCo2eTonnes = totalCo2eKg / 1000;

        // Create calculation details
        const calculationDetails = {
          activity_quantity: activity.quantity,
          activity_unit: activity.unit,
          emission_factor_name: compatibleFactor.name,
          co2_grams: co2Emissions,
          ch4_grams: ch4Emissions,
          n2o_grams: n2oEmissions,
          gwp_ch4: gwpCH4,
          gwp_n2o: gwpN2O,
          total_co2e_grams: totalCo2eGrams,
          total_co2e_kg: totalCo2eKg,
          calculation_date: new Date().toISOString()
        };

        // Delete existing calculation for this activity
        await supabase
          .from('calculated_emissions')
          .delete()
          .eq('activity_data_id', activity.id);

        // Insert new calculation
        const { error: insertError } = await supabase
          .from('calculated_emissions')
          .insert({
            activity_data_id: activity.id,
            emission_factor_id: compatibleFactor.id,
            total_co2e: totalCo2eTonnes,
            details_json: calculationDetails
          });

        if (insertError) {
          console.error(`Failed to insert calculated emission: ${insertError.message}`);
          errorCount++;
        } else {
          recalculatedCount++;
          console.log(`Successfully recalculated emissions for activity ${activity.id}: ${totalCo2eTonnes} tCO2e`);
        }

      } catch (error) {
        console.error(`Error processing activity ${activity.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Recalculation complete. Successfully recalculated: ${recalculatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emissões recalculadas com sucesso!`,
        details: {
          total_records: activityData?.length || 0,
          recalculated: recalculatedCount,
          errors: errorCount,
          period: { start: period_start, end: period_end }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ghg-recalculate function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});