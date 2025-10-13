import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface BulkImportOptions {
  companyId: string;
  userId: string;
  validateBeforeInsert?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface BulkImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ record: any; error: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entityType, records, options } = await req.json();

    console.log('🔄 Bulk import started:', { entityType, recordCount: records?.length });

    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new Error('Records array is required and must not be empty');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result: BulkImportResult;

    switch (entityType) {
      case 'emissions':
        result = await bulkImportEmissions(records, options, supabaseClient);
        break;
      case 'employees':
        result = await bulkImportEmployees(records, options, supabaseClient);
        break;
      case 'goals':
        result = await bulkImportGoals(records, options, supabaseClient);
        break;
      case 'waste':
        result = await bulkImportWaste(records, options, supabaseClient);
        break;
      case 'licenses':
        result = await bulkImportLicenses(records, options, supabaseClient);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    console.log('✅ Bulk import completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Bulk import error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============= EMISSIONS BULK IMPORT =============
async function bulkImportEmissions(
  records: any[],
  options: BulkImportOptions,
  supabase: any
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const record of records) {
    try {
      // Validate required fields
      if (!record.source_name || !record.scope) {
        result.errors.push({ record, error: 'Missing required fields: source_name, scope' });
        result.skipped++;
        continue;
      }

      // Check for duplicates
      if (options.skipDuplicates) {
        const { data: existing } = await supabase
          .from('emission_sources')
          .select('id')
          .eq('company_id', options.companyId)
          .eq('source_name', record.source_name)
          .eq('scope', record.scope)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          continue;
        }
      }

      // Insert emission source
      const { data: source, error: sourceError } = await supabase
        .from('emission_sources')
        .insert({
          company_id: options.companyId,
          source_name: record.source_name,
          scope: record.scope,
          description: record.description || null,
          category: record.category || null,
          unit: record.unit || 'kg'
        })
        .select()
        .single();

      if (sourceError) throw sourceError;

      result.inserted++;

      // If activity data is provided, insert it
      if (record.quantity && source) {
        await supabase
          .from('activity_data')
          .insert({
            emission_source_id: source.id,
            company_id: options.companyId,
            quantity: record.quantity,
            unit: record.unit || 'kg',
            period_start_date: record.period_start || new Date().toISOString().split('T')[0],
            period_end_date: record.period_end || new Date().toISOString().split('T')[0],
            data_quality: record.data_quality || 'Calculado',
            notes: record.notes || null
          });
      }

    } catch (error) {
      result.errors.push({ 
        record, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}

// ============= EMPLOYEES BULK IMPORT =============
async function bulkImportEmployees(
  records: any[],
  options: BulkImportOptions,
  supabase: any
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const record of records) {
    try {
      if (!record.full_name && !record.name) {
        result.errors.push({ record, error: 'Missing required field: name' });
        result.skipped++;
        continue;
      }

      const employeeData = {
        company_id: options.companyId,
        full_name: record.full_name || record.name,
        email: record.email || null,
        employee_code: record.employee_code || null,
        department: record.department || null,
        position: record.position || record.role || null,
        hire_date: record.hire_date || null,
        birth_date: record.birth_date || null,
        gender: record.gender || null,
        status: 'Ativo'
      };

      // Check for duplicates by email or code
      if (options.skipDuplicates && (record.email || record.employee_code)) {
        let query = supabase
          .from('employees')
          .select('id')
          .eq('company_id', options.companyId);

        if (record.email) {
          query = query.eq('email', record.email);
        } else if (record.employee_code) {
          query = query.eq('employee_code', record.employee_code);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          if (options.updateExisting) {
            await supabase
              .from('employees')
              .update(employeeData)
              .eq('id', existing.id);
            result.updated++;
          } else {
            result.skipped++;
          }
          continue;
        }
      }

      const { error } = await supabase
        .from('employees')
        .insert(employeeData);

      if (error) throw error;

      result.inserted++;

    } catch (error) {
      result.errors.push({ 
        record, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}

// ============= GOALS BULK IMPORT =============
async function bulkImportGoals(
  records: any[],
  options: BulkImportOptions,
  supabase: any
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const record of records) {
    try {
      if (!record.goal_name && !record.name) {
        result.errors.push({ record, error: 'Missing required field: goal_name' });
        result.skipped++;
        continue;
      }

      const goalData = {
        company_id: options.companyId,
        goal_name: record.goal_name || record.name,
        category: record.category || 'Ambiental',
        target_value: record.target_value || 0,
        target_date: record.target_date || record.deadline,
        baseline_value: record.baseline_value || 0,
        unit: record.unit || 'unidade',
        status: 'Ativa'
      };

      // Check for duplicates by name
      if (options.skipDuplicates) {
        const { data: existing } = await supabase
          .from('goals')
          .select('id')
          .eq('company_id', options.companyId)
          .eq('goal_name', goalData.goal_name)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          continue;
        }
      }

      const { error } = await supabase
        .from('goals')
        .insert(goalData);

      if (error) throw error;

      result.inserted++;

    } catch (error) {
      result.errors.push({ 
        record, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}

// ============= WASTE BULK IMPORT =============
async function bulkImportWaste(
  records: any[],
  options: BulkImportOptions,
  supabase: any
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const record of records) {
    try {
      if (!record.waste_type) {
        result.errors.push({ record, error: 'Missing required field: waste_type' });
        result.skipped++;
        continue;
      }

      const wasteData = {
        company_id: options.companyId,
        waste_type: record.waste_type,
        class: record.class || record.waste_class || 'II A - Não Inerte',
        quantity: record.quantity || 0,
        unit: record.unit || 'kg',
        log_date: record.log_date || record.date || new Date().toISOString().split('T')[0],
        final_destination: record.final_destination || record.destination || null,
        disposal_company: record.disposal_company || null,
        mtr_number: record.mtr_number || record.mtr || null
      };

      const { error } = await supabase
        .from('waste_logs')
        .insert(wasteData);

      if (error) throw error;

      result.inserted++;

    } catch (error) {
      result.errors.push({ 
        record, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}

// ============= LICENSES BULK IMPORT =============
async function bulkImportLicenses(
  records: any[],
  options: BulkImportOptions,
  supabase: any
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const record of records) {
    try {
      if (!record.name && !record.license_name) {
        result.errors.push({ record, error: 'Missing required field: license_name' });
        result.skipped++;
        continue;
      }

      const licenseData = {
        company_id: options.companyId,
        name: record.name || record.license_name,
        license_number: record.license_number || null,
        license_type: record.license_type || 'Operação',
        issue_date: record.issue_date || null,
        expiration_date: record.expiration_date || record.expiry_date,
        issuing_agency: record.issuing_agency || record.agency || null,
        status: 'Ativa'
      };

      // Check for duplicates by number
      if (options.skipDuplicates && record.license_number) {
        const { data: existing } = await supabase
          .from('licenses')
          .select('id')
          .eq('company_id', options.companyId)
          .eq('license_number', record.license_number)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          continue;
        }
      }

      const { error } = await supabase
        .from('licenses')
        .insert(licenseData);

      if (error) throw error;

      result.inserted++;

    } catch (error) {
      result.errors.push({ 
        record, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}
