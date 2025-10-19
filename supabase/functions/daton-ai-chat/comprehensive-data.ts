/**
 * Comprehensive Company Data Fetcher
 * Provides massive data access for AI intelligence
 */
import { getFromCache, setInCache } from './cache-manager.ts';

export async function getComprehensiveCompanyData(
  companyId: string,
  supabaseClient: any,
  options: {
    includeEmissions?: boolean;
    includeGoals?: boolean;
    includeMateriality?: boolean;
    includeGRI?: boolean;
    includeRisks?: boolean;
    includeEmployees?: boolean;
    includeWaste?: boolean;
    includeDocuments?: boolean;
    maxResults?: number;
  } = {}
) {
  // Check cache first
  const cacheKey = `comprehensive_data_${companyId}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('📦 Returning cached comprehensive data');
    return cached;
  }

  const {
    includeEmissions = true,
    includeGoals = true,
    includeMateriality = false,
    includeGRI = false,
    includeRisks = true,
    includeEmployees = true,
    includeWaste = false,
    includeDocuments = true,
    maxResults = 100
  } = options;

  console.log('📊 Fetching comprehensive company data:', {
    companyId,
    options
  });

  const results: any = {
    companyId,
    fetchedAt: new Date().toISOString(),
    data: {}
  };

  try {
    // Parallel fetch all data sources
    const promises: Promise<any>[] = [];

    // 1. Emissions data (detailed)
    if (includeEmissions) {
      promises.push(
        (async () => {
          const { data: emissions } = await supabaseClient
            .from('calculated_emissions')
            .select(`
              id,
              total_co2e,
              co2_kg,
              ch4_kg,
              n2o_kg,
              created_at,
              activity_data:activity_data_id (
                id,
                quantity,
                period_start_date,
                period_end_date,
                emission_sources:emission_source_id (
                  id,
                  source_name,
                  scope,
                  category
                )
              )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(maxResults);

          results.data.emissions = {
            total: emissions?.length || 0,
            recent: emissions || [],
            byScope: {
              scope1: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 1).length || 0,
              scope2: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 2).length || 0,
              scope3: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 3).length || 0
            },
            totalCO2e: emissions?.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0
          };
        })()
      );
    }

    // 2. Goals with full progress history
    if (includeGoals) {
      promises.push(
        (async () => {
          const { data: goals } = await supabaseClient
            .from('goals')
            .select(`
              id,
              goal_name,
              category,
              baseline_value,
              target_value,
              current_value,
              progress_percentage,
              target_date,
              status,
              created_at,
              goal_progress_updates (
                id,
                update_date,
                current_value,
                progress_percentage,
                notes
              )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(maxResults);

          results.data.goals = {
            total: goals?.length || 0,
            active: goals?.filter((g: any) => g.status === 'Ativa').length || 0,
            completed: goals?.filter((g: any) => g.status === 'Concluída').length || 0,
            atRisk: goals?.filter((g: any) => {
              const daysUntilTarget = g.target_date ? 
                Math.floor((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
              return g.progress_percentage < 50 && daysUntilTarget < 90;
            }).length || 0,
            details: goals || []
          };
        })()
      );
    }

    // 3. Materiality assessments
    if (includeMateriality) {
      promises.push(
        (async () => {
          const { data: assessments } = await supabaseClient
            .from('materiality_assessments')
            .select(`
              id,
              assessment_year,
              methodology,
              status,
              materiality_themes (
                id,
                theme_name,
                category,
                importance_level,
                stakeholder_relevance
              )
            `)
            .eq('company_id', companyId)
            .order('assessment_year', { ascending: false })
            .limit(10);

          results.data.materiality = {
            total: assessments?.length || 0,
            latest: assessments?.[0] || null,
            all: assessments || []
          };
        })()
      );
    }

    // 4. GRI indicators
    if (includeGRI) {
      promises.push(
        (async () => {
          const { data: indicators } = await supabaseClient
            .from('gri_indicator_data')
            .select(`
              id,
              indicator_code,
              indicator_name,
              value,
              unit,
              reporting_period,
              is_complete,
              gri_reports:report_id (
                id,
                report_name,
                reporting_year,
                status
              )
            `)
            .eq('company_id', companyId)
            .order('reporting_period', { ascending: false })
            .limit(maxResults);

          results.data.gri = {
            total: indicators?.length || 0,
            complete: indicators?.filter((i: any) => i.is_complete).length || 0,
            indicators: indicators || []
          };
        })()
      );
    }

    // 5. Risks and opportunities
    if (includeRisks) {
      promises.push(
        (async () => {
          const { data: risks } = await supabaseClient
            .from('esg_risks')
            .select(`
              id,
              title,
              category,
              probability,
              impact,
              inherent_risk_level,
              status,
              risk_occurrences (
                id,
                occurrence_date,
                actual_impact,
                financial_impact
              )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(50);

          const { data: opportunities } = await supabaseClient
            .from('opportunities')
            .select('id, title, category, potential_value, status')
            .eq('company_id', companyId)
            .limit(50);

          results.data.risks = {
            total: risks?.length || 0,
            critical: risks?.filter((r: any) => r.inherent_risk_level === 'Crítico').length || 0,
            details: risks || []
          };

          results.data.opportunities = {
            total: opportunities?.length || 0,
            details: opportunities || []
          };
        })()
      );
    }

    // 6. Employee data
    if (includeEmployees) {
      promises.push(
        (async () => {
          const { data: employees } = await supabaseClient
            .from('employees')
            .select(`
              id,
              full_name,
              gender,
              department,
              position,
              hire_date,
              birth_date,
              status,
              employee_trainings (
                id,
                completion_date,
                training_programs (
                  id,
                  name,
                  category
                )
              )
            `)
            .eq('company_id', companyId)
            .eq('status', 'Ativo')
            .limit(maxResults);

          const demographics = {
            total: employees?.length || 0,
            byGender: employees?.reduce((acc: any, e: any) => {
              acc[e.gender || 'Não informado'] = (acc[e.gender || 'Não informado'] || 0) + 1;
              return acc;
            }, {}),
            byDepartment: employees?.reduce((acc: any, e: any) => {
              acc[e.department || 'Não informado'] = (acc[e.department || 'Não informado'] || 0) + 1;
              return acc;
            }, {})
          };

          results.data.employees = {
            ...demographics,
            details: employees || []
          };
        })()
      );
    }

    // 7. Waste logs
    if (includeWaste) {
      promises.push(
        (async () => {
          const { data: waste } = await supabaseClient
            .from('waste_logs')
            .select('id, waste_type, class, quantity, log_date, final_destination')
            .eq('company_id', companyId)
            .order('log_date', { ascending: false })
            .limit(maxResults);

          results.data.waste = {
            total: waste?.length || 0,
            totalQuantity: waste?.reduce((sum: number, w: any) => sum + (w.quantity || 0), 0) || 0,
            byClass: waste?.reduce((acc: any, w: any) => {
              acc[w.class || 'Unknown'] = (acc[w.class || 'Unknown'] || 0) + w.quantity;
              return acc;
            }, {}),
            details: waste || []
          };
        })()
      );
    }

    // 8. Recent documents
    if (includeDocuments) {
      promises.push(
        (async () => {
          const { data: documents } = await supabaseClient
            .from('documents')
            .select('id, file_name, file_type, upload_date, tags, ai_extracted_category')
            .eq('company_id', companyId)
            .order('upload_date', { ascending: false })
            .limit(50);

          results.data.documents = {
            total: documents?.length || 0,
            recent: documents || []
          };
        })()
      );
    }

    // Wait for all data fetches
    await Promise.all(promises);

    console.log('✅ Comprehensive data fetched:', {
      emissions: !!results.data.emissions,
      goals: !!results.data.goals,
      risks: !!results.data.risks,
      employees: !!results.data.employees
    });

    // Cache results for 5 minutes
    const cacheKey = `comprehensive_data_${companyId}`;
    setInCache(cacheKey, results, 5 * 60 * 1000);

    return results;
  } catch (error) {
    console.error('❌ Error fetching comprehensive data:', error);
    throw error;
  }
}

// Helper: Get context-specific data based on current page
export function getPageSpecificData(allData: any, currentPage: string) {
  const pageData: any = {
    page: currentPage,
    relevantData: {}
  };

  switch (currentPage) {
    case '/dashboard':
      pageData.relevantData = {
        goals: allData.data.goals,
        risks: allData.data.risks,
        tasks: allData.data.tasks,
        recentAlerts: []
      };
      break;

    case '/inventario-gee':
      pageData.relevantData = {
        emissions: allData.data.emissions,
        emissionSources: allData.data.emissionSources
      };
      break;

    case '/metas':
      pageData.relevantData = {
        goals: allData.data.goals,
        goalsProgress: allData.data.goals?.details?.map((g: any) => ({
          id: g.id,
          name: g.goal_name,
          progress: g.progress_percentage,
          updates: g.goal_progress_updates
        }))
      };
      break;

    case '/licenciamento':
      pageData.relevantData = {
        licenses: allData.data.licenses,
        expiringLicenses: allData.data.licenses?.filter((l: any) => {
          const daysUntilExpiry = l.expiration_date ?
            Math.floor((new Date(l.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
          return daysUntilExpiry < 90 && daysUntilExpiry > 0;
        })
      };
      break;

    default:
      pageData.relevantData = {
        summary: 'General dashboard overview'
      };
  }

  return pageData;
}
