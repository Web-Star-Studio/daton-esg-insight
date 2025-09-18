import { supabase } from "@/integrations/supabase/client"
import { PGRSDocumentData, generatePGRSDocument, downloadPGRSDocument } from "./pgrsDocumentGenerator"

// Export the function at the top level to ensure proper module resolution
export const getActivePGRSPlan = async () => {
  const { data, error } = await supabase
    .from('pgrs_plans')
    .select(`
      *,
      sources:pgrs_waste_sources(
        *,
        waste_types:pgrs_waste_types(*)
      )
    `)
    .eq('status', 'Ativo')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active PGRS plan:', error)
    throw error
  }

  return data
}

export interface PGRSPlanWithDetails {
  id: string
  plan_name: string
  version: string
  status: string
  creation_date: Date
  responsible_user_id?: string
  sources: Array<{
    id: string
    source_name: string
    source_type: string
    location: string
    description: string
    waste_types: Array<{
      id: string
      waste_name: string
      hazard_class: string
      ibama_code: string
      composition: string
      estimated_quantity_monthly: number
      unit: string
    }>
  }>
  procedures: Array<{
    id: string
    procedure_type: string
    title: string
    description: string
    infrastructure_details: string
    responsible_role: string
    frequency: string
  }>
  goals: Array<{
    id: string
    goal_type: string
    baseline_value: number
    target_value: number
    unit: string
    deadline: string
  }>
}

export async function getPGRSPlanForReport(planId: string): Promise<PGRSPlanWithDetails | null> {
  try {
    // Get plan basic info
    const { data: plan, error: planError } = await supabase
      .from('pgrs_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Error fetching PGRS plan:', planError)
      return null
    }

    // Get sources with waste types
    const { data: sources, error: sourcesError } = await supabase
      .from('pgrs_waste_sources')
      .select(`
        *,
        waste_types:pgrs_waste_types(*)
      `)
      .eq('pgrs_plan_id', planId)

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      return null
    }

    // Get procedures
    const { data: procedures, error: proceduresError } = await supabase
      .from('pgrs_procedures')
      .select('*')
      .eq('pgrs_plan_id', planId)

    if (proceduresError) {
      console.error('Error fetching procedures:', proceduresError)
      return null
    }

    // Get goals
    const { data: goals, error: goalsError } = await supabase
      .from('pgrs_goals')
      .select('*')
      .eq('pgrs_plan_id', planId)

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return null
    }

    return {
      ...plan,
      creation_date: new Date(plan.created_at),
      sources: sources || [],
      procedures: procedures || [],
      goals: goals || []
    }
  } catch (error) {
    console.error('Error in getPGRSPlanForReport:', error)
    return null
  }
}

export async function generatePGRSReport(planId: string): Promise<string | null> {
  try {
    const planData = await getPGRSPlanForReport(planId)
    if (!planData) return null

    // Get company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!profile?.company_id) return null

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (!company) return null

    // Convert to document format
    const documentData: PGRSDocumentData = {
      company: {
        name: company.name,
        cnpj: company.cnpj,
        address: company.headquarters_address || 'Endereço não informado',
        responsible_name: 'Responsável Técnico', // TODO: Get from user profile
        responsible_title: 'Cargo/Função', // TODO: Get from user profile
        art_number: undefined // TODO: Add ART field to company or profile
      },
      plan: {
        plan_name: planData.plan_name,
        version: planData.version,
        creation_date: planData.creation_date,
        revision_date: undefined // TODO: Add revision tracking
      },
      sources: planData.sources,
      procedures: planData.procedures,
      goals: planData.goals
    }

    return generatePGRSDocument(documentData)
  } catch (error) {
    console.error('Error generating PGRS report:', error)
    return null
  }
}

export async function downloadPGRSReport(planId: string, filename?: string): Promise<boolean> {
  try {
    const planData = await getPGRSPlanForReport(planId)
    if (!planData) return false

    // Get company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!profile?.company_id) return false

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (!company) return false

    // Convert to document format
    const documentData: PGRSDocumentData = {
      company: {
        name: company.name,
        cnpj: company.cnpj,
        address: company.headquarters_address || 'Endereço não informado',
        responsible_name: 'Responsável Técnico',
        responsible_title: 'Cargo/Função',
        art_number: undefined
      },
      plan: {
        plan_name: planData.plan_name,
        version: planData.version,
        creation_date: planData.creation_date,
        revision_date: undefined
      },
      sources: planData.sources,
      procedures: planData.procedures,
      goals: planData.goals
    }

    downloadPGRSDocument(documentData, filename)
    return true
  } catch (error) {
    console.error('Error downloading PGRS report:', error)
    return false
  }
}

export async function getActivePGRSStatus() {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!profile?.company_id) return null

    const { data: plans, error } = await supabase
      .from('pgrs_plans')
      .select(`
        *,
        sources:pgrs_waste_sources(id),
        procedures:pgrs_procedures(id),
        goals:pgrs_goals(id)
      `)
      .eq('company_id', profile.company_id)
      .eq('status', 'Ativo')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !plans || plans.length === 0) return null

    const plan = plans[0]
    
    return {
      id: plan.id,
      plan_name: plan.plan_name,
      status: plan.status,
      creation_date: new Date(plan.created_at),
      next_review_date: plan.next_review_date ? new Date(plan.next_review_date) : undefined,
      completion_percentage: 85, // TODO: Calculate based on filled fields
      goals_count: plan.goals?.length || 0,
      procedures_count: plan.procedures?.length || 0,
      sources_count: plan.sources?.length || 0
    }
  } catch (error) {
    console.error('Error getting active PGRS status:', error)
    return null
  }
}