import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CompanyContext {
  company: {
    name: string;
    cnpj: string;
    sector?: string;
    size?: string;
  };
  current_data: {
    emission_sources: any[];
    total_emissions: number;
    esg_goals: any[];
    active_licenses: any[];
    suppliers: any[];
    employees_count: number;
  };
  historical_patterns: {
    average_emissions_per_month: number;
    typical_document_types: string[];
    common_data_formats: string[];
    processing_stats: {
      total_documents: number;
      auto_approved: number;
      manual_review: number;
    };
  };
  schema_information: {
    available_tables: string[];
    field_definitions: Record<string, any>;
  };
}

export async function buildCompanyContext(
  supabaseClient: SupabaseClient,
  companyId: string
): Promise<CompanyContext> {
  console.log(`Building context for company: ${companyId}`);

  try {
    // 1. Get company info
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, cnpj')
      .eq('id', companyId)
      .single();

    // 2. Get emission sources
    const { data: emissionSources } = await supabaseClient
      .from('emission_sources')
      .select('id, source_name, scope, category')
      .eq('company_id', companyId)
      .eq('status', 'Ativo')
      .limit(100);

    // 3. Get total emissions (last 12 months)
    const { data: emissions } = await supabaseClient
      .from('calculated_emissions')
      .select('total_co2e, activity_data!inner(emission_sources!inner(company_id))')
      .eq('activity_data.emission_sources.company_id', companyId)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    const totalEmissions = emissions?.reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0;
    const avgEmissionsPerMonth = emissions?.length ? totalEmissions / 12 : 0;

    // 4. Get active goals
    const { data: goals } = await supabaseClient
      .from('goals')
      .select('id, goal_name, target_date, progress')
      .eq('company_id', companyId)
      .eq('status', 'Em Progresso')
      .limit(50);

    // 5. Get active licenses
    const { data: licenses } = await supabaseClient
      .from('licenses')
      .select('id, license_name, license_type, expiry_date')
      .eq('company_id', companyId)
      .eq('status', 'Válida')
      .limit(50);

    // 6. Get suppliers
    const { data: suppliers } = await supabaseClient
      .from('suppliers')
      .select('id, name, category')
      .eq('company_id', companyId)
      .limit(100);

    // 7. Get employees count
    const { count: employeesCount } = await supabaseClient
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'Ativo');

    // 8. Get document processing stats
    const { data: documents } = await supabaseClient
      .from('documents')
      .select('file_type')
      .eq('company_id', companyId)
      .order('upload_date', { ascending: false })
      .limit(200);

    const typeCounts: Record<string, number> = {};
    documents?.forEach(doc => {
      typeCounts[doc.file_type] = (typeCounts[doc.file_type] || 0) + 1;
    });

    const typicalTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    // 9. Get AI performance metrics
    const { data: aiMetrics } = await supabaseClient
      .from('ai_performance_metrics')
      .select('documents_processed, auto_approved_count, manual_review_count')
      .eq('company_id', companyId)
      .order('metric_date', { ascending: false })
      .limit(30);

    const totalProcessed = aiMetrics?.reduce((sum, m) => sum + (m.documents_processed || 0), 0) || 0;
    const totalAutoApproved = aiMetrics?.reduce((sum, m) => sum + (m.auto_approved_count || 0), 0) || 0;
    const totalManualReview = aiMetrics?.reduce((sum, m) => sum + (m.manual_review_count || 0), 0) || 0;

    // 10. Schema information (key tables for data insertion)
    const availableTables = [
      'emission_sources',
      'activity_data',
      'suppliers',
      'licenses',
      'goals',
      'employees',
      'waste_logs',
      'water_consumption',
      'non_conformities',
      'esg_risks',
    ];

    const fieldDefinitions = {
      emission_sources: {
        required: ['source_name', 'scope', 'category'],
        optional: ['description', 'emission_factor_id'],
      },
      activity_data: {
        required: ['emission_source_id', 'quantity', 'unit', 'period_start_date'],
        optional: ['period_end_date', 'notes'],
      },
      suppliers: {
        required: ['name', 'category'],
        optional: ['contact_email', 'phone', 'address'],
      },
      licenses: {
        required: ['license_name', 'license_type', 'issue_date', 'expiry_date'],
        optional: ['license_number', 'issuing_authority'],
      },
    };

    const context: CompanyContext = {
      company: {
        name: company?.name || 'Empresa',
        cnpj: company?.cnpj || '',
        sector: undefined,
        size: undefined,
      },
      current_data: {
        emission_sources: emissionSources || [],
        total_emissions: totalEmissions,
        esg_goals: goals || [],
        active_licenses: licenses || [],
        suppliers: suppliers || [],
        employees_count: employeesCount || 0,
      },
      historical_patterns: {
        average_emissions_per_month: avgEmissionsPerMonth,
        typical_document_types: typicalTypes,
        common_data_formats: ['pdf', 'xlsx', 'csv', 'image'],
        processing_stats: {
          total_documents: totalProcessed,
          auto_approved: totalAutoApproved,
          manual_review: totalManualReview,
        },
      },
      schema_information: {
        available_tables: availableTables,
        field_definitions: fieldDefinitions,
      },
    };

    console.log('Company context built successfully');
    return context;
  } catch (error) {
    console.error('Error building company context:', error);
    // Return minimal context on error
    return {
      company: { name: 'Empresa', cnpj: '' },
      current_data: {
        emission_sources: [],
        total_emissions: 0,
        esg_goals: [],
        active_licenses: [],
        suppliers: [],
        employees_count: 0,
      },
      historical_patterns: {
        average_emissions_per_month: 0,
        typical_document_types: [],
        common_data_formats: [],
        processing_stats: { total_documents: 0, auto_approved: 0, manual_review: 0 },
      },
      schema_information: {
        available_tables: [],
        field_definitions: {},
      },
    };
  }
}
