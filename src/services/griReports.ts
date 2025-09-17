import { supabase } from "@/integrations/supabase/client";

export interface GRIReport {
  id: string;
  company_id: string;
  title: string;
  year: number;
  status: 'Rascunho' | 'Em Andamento' | 'Em Revisão' | 'Finalizado' | 'Publicado';
  gri_standard_version: string;
  reporting_period_start: string;
  reporting_period_end: string;
  publication_date?: string;
  executive_summary?: string;
  ceo_message?: string;
  methodology?: string;
  materiality_assessment?: any;
  stakeholder_engagement?: any;
  template_config?: any;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface GRIIndicator {
  id: string;
  code: string;
  title: string;
  description: string;
  indicator_type: 'Universal' | 'Econômico' | 'Ambiental' | 'Social' | 'Governança';
  data_type: 'Numérico' | 'Percentual' | 'Texto' | 'Booleano' | 'Data' | 'Anexo';
  unit?: string;
  gri_standard: string;
  is_mandatory: boolean;
  sector_specific: boolean;
  sectors?: string[];
  guidance_text?: string;
  calculation_method?: string;
  data_sources_suggestions?: string[];
}

export interface GRIIndicatorData {
  id: string;
  report_id: string;
  indicator_id: string;
  numeric_value?: number;
  text_value?: string;
  boolean_value?: boolean;
  date_value?: string;
  percentage_value?: number;
  unit?: string;
  methodology?: string;
  data_source?: string;
  verification_level?: string;
  supporting_documents?: string[];
  notes?: string;
  is_complete: boolean;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
  indicator?: GRIIndicator;
}

export interface MaterialityTopic {
  id: string;
  report_id: string;
  topic_name: string;
  description?: string;
  significance_level?: number;
  stakeholder_importance?: number;
  business_impact?: number;
  related_indicators?: string[];
  management_approach?: string;
  policies_commitments?: string;
  goals_targets?: string;
  created_at: string;
  updated_at: string;
}

export interface SDGAlignment {
  id: string;
  report_id: string;
  sdg_number: number;
  sdg_target?: string;
  description?: string;
  contribution_level?: string;
  actions_taken?: string;
  results_achieved?: string;
  future_commitments?: string;
  created_at: string;
}

export interface GRIReportSection {
  id: string;
  report_id: string;
  section_key: string;
  title: string;
  content?: string;
  order_index: number;
  is_complete: boolean;
  completion_percentage: number;
  template_used?: string;
  ai_generated_content: boolean;
  last_ai_update?: string;
  created_at: string;
  updated_at: string;
}

// GRI Reports API
export async function getGRIReports(): Promise<GRIReport[]> {
  const { data, error } = await supabase
    .from('gri_reports')
    .select('*')
    .order('year', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getGRIReport(id: string): Promise<GRIReport | null> {
  const { data, error } = await supabase
    .from('gri_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createGRIReport(report: Partial<GRIReport>): Promise<GRIReport> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  let companyId: string | null = null;
  
  // Try to get company_id from profile first
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    companyId = profile?.company_id;
  } catch (profileError) {
    console.warn('Erro ao buscar company_id do perfil:', profileError);
  }
  
  // Fallback: try to get company_id using RPC function
  if (!companyId) {
    try {
      const { data: rpcCompanyId } = await supabase.rpc('get_user_company_id');
      companyId = rpcCompanyId;
    } catch (rpcError) {
      console.error('Erro ao buscar company_id via RPC:', rpcError);
    }
  }
  
  if (!companyId) {
    throw new Error('Empresa não encontrada. Verifique se seu perfil está associado a uma empresa.');
  }

  const { data, error } = await supabase
    .from('gri_reports')
    .insert([{
      ...report,
      company_id: companyId,
      reporting_period_start: report.reporting_period_start || '',
      reporting_period_end: report.reporting_period_end || '',
      year: report.year || new Date().getFullYear(),
    } as any])
    .select()
    .single();

  if (error) {
    console.error('Erro na inserção do relatório GRI:', error);
    throw error;
  }
  return data;
}

export async function updateGRIReport(id: string, updates: Partial<GRIReport>): Promise<GRIReport> {
  const { data, error } = await supabase
    .from('gri_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGRIReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('gri_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// GRI Indicators Library API
export async function getGRIIndicators(): Promise<GRIIndicator[]> {
  const { data, error } = await supabase
    .from('gri_indicators_library')
    .select('*')
    .order('code');

  if (error) throw error;
  return data || [];
}

export async function getGRIIndicatorsByType(type?: string): Promise<GRIIndicator[]> {
  let query = supabase
    .from('gri_indicators_library')
    .select('*')
    .order('code');

  if (type && type !== 'all') {
    query = query.eq('indicator_type', type as any);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMandatoryGRIIndicators(): Promise<GRIIndicator[]> {
  const { data, error } = await supabase
    .from('gri_indicators_library')
    .select('*')
    .eq('is_mandatory', true)
    .order('code');

  if (error) throw error;
  return data || [];
}

// GRI Indicator Data API
export async function getGRIIndicatorData(reportId: string): Promise<GRIIndicatorData[]> {
  const { data, error } = await supabase
    .from('gri_indicator_data')
    .select(`
      *,
      indicator:gri_indicators_library(*)
    `)
    .eq('report_id', reportId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function createOrUpdateGRIIndicatorData(
  reportId: string, 
  indicatorId: string, 
  data: Partial<GRIIndicatorData>
): Promise<GRIIndicatorData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: existing } = await supabase
    .from('gri_indicator_data')
    .select('*')
    .eq('report_id', reportId)
    .eq('indicator_id', indicatorId)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('gri_indicator_data')
      .update({
        ...data,
        last_updated_by: user.id,
      })
      .eq('id', existing.id)
      .select(`
        *,
        indicator:gri_indicators_library(*)
      `)
      .single();

    if (error) throw error;
    return updated;
  } else {
    // Create new
    const { data: created, error } = await supabase
      .from('gri_indicator_data')
      .insert({
        report_id: reportId,
        indicator_id: indicatorId,
        ...data,
        last_updated_by: user.id,
      })
      .select(`
        *,
        indicator:gri_indicators_library(*)
      `)
      .single();

    if (error) throw error;
    return created;
  }
}

// Report Sections API
export async function getGRIReportSections(reportId: string): Promise<GRIReportSection[]> {
  const { data, error } = await supabase
    .from('gri_report_sections')
    .select('*')
    .eq('report_id', reportId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function createOrUpdateGRIReportSection(
  reportId: string,
  sectionKey: string,
  sectionData: Partial<GRIReportSection>
): Promise<GRIReportSection> {
  const { data: existing } = await supabase
    .from('gri_report_sections')
    .select('*')
    .eq('report_id', reportId)
    .eq('section_key', sectionKey)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('gri_report_sections')
      .update(sectionData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  } else {
    // Create new
    const { data: created, error } = await supabase
      .from('gri_report_sections')
      .insert({
        report_id: reportId,
        section_key: sectionKey,
        title: sectionData.title || '',
        ...sectionData,
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  }
}

// Materiality Topics API
export async function getMaterialityTopics(reportId: string): Promise<MaterialityTopic[]> {
  const { data, error } = await supabase
    .from('materiality_topics')
    .select('*')
    .eq('report_id', reportId)
    .order('significance_level', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMaterialityTopic(topic: Partial<MaterialityTopic>): Promise<MaterialityTopic> {
  const { data, error } = await supabase
    .from('materiality_topics')
    .insert([topic as any])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMaterialityTopic(id: string, updates: Partial<MaterialityTopic>): Promise<MaterialityTopic> {
  const { data, error } = await supabase
    .from('materiality_topics')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMaterialityTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('materiality_topics')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// SDG Alignment API
export async function getSDGAlignment(reportId: string): Promise<SDGAlignment[]> {
  const { data, error } = await supabase
    .from('sdg_alignment')
    .select('*')
    .eq('report_id', reportId)
    .order('sdg_number');

  if (error) throw error;
  return data || [];
}

export async function createSDGAlignment(alignment: Partial<SDGAlignment>): Promise<SDGAlignment> {
  const { data, error } = await supabase
    .from('sdg_alignment')
    .insert([alignment as any])
    .select()
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSDGAlignment(id: string, updates: Partial<SDGAlignment>): Promise<SDGAlignment> {
  const { data, error } = await supabase
    .from('sdg_alignment')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSDGAlignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('sdg_alignment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Utility Functions
export async function calculateReportCompletion(reportId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_gri_report_completion', {
      p_report_id: reportId,
    });

    if (error) {
      console.error('Erro ao recalcular conclusão do relatório:', error);
      return 0;
    }
    return data || 0;
  } catch (e) {
    console.error('Exceção em calculateReportCompletion:', e);
    return 0;
  }
}

export async function initializeGRIReport(reportId: string): Promise<void> {
  // Get mandatory indicators
  const mandatoryIndicators = await getMandatoryGRIIndicators();
  
  // Create indicator data entries for all mandatory indicators
  const promises = mandatoryIndicators.map(indicator =>
    createOrUpdateGRIIndicatorData(reportId, indicator.id, {
      is_complete: false,
    })
  );

  await Promise.all(promises);

  // Create default sections
  const defaultSections = [
    { key: 'organizational_profile', title: 'Perfil Organizacional', order_index: 1 },
    { key: 'strategy', title: 'Estratégia', order_index: 2 },
    { key: 'ethics_integrity', title: 'Ética e Integridade', order_index: 3 },
    { key: 'governance', title: 'Governança', order_index: 4 },
    { key: 'stakeholder_engagement', title: 'Engajamento de Stakeholders', order_index: 5 },
    { key: 'reporting_practices', title: 'Práticas de Relatório', order_index: 6 },
    { key: 'material_topics', title: 'Temas Materiais', order_index: 7 },
    { key: 'economic_performance', title: 'Performance Econômica', order_index: 8 },
    { key: 'environmental_performance', title: 'Performance Ambiental', order_index: 9 },
    { key: 'social_performance', title: 'Performance Social', order_index: 10 },
  ];

  const sectionPromises = defaultSections.map(section =>
    createOrUpdateGRIReportSection(reportId, section.key, {
      title: section.title,
      order_index: section.order_index,
      is_complete: false,
      completion_percentage: 0,
    })
  );

  await Promise.all(sectionPromises);
}

// Export functions for report generation
export async function generateReportContent(reportId: string): Promise<string> {
  const report = await getGRIReport(reportId);
  const sections = await getGRIReportSections(reportId);
  const indicatorData = await getGRIIndicatorData(reportId);
  const materialityTopics = await getMaterialityTopics(reportId);
  const sdgAlignment = await getSDGAlignment(reportId);

  if (!report) throw new Error('Relatório não encontrado');

  // This would generate the final report content
  // For now, return a basic structure
  return `
# ${report.title} - ${report.year}

## Sumário Executivo
${report.executive_summary || 'Aguardando conteúdo...'}

## Mensagem da Liderança
${report.ceo_message || 'Aguardando conteúdo...'}

## Metodologia
${report.methodology || 'Aguardando conteúdo...'}

## Seções do Relatório
${sections.map(section => `
### ${section.title}
${section.content || 'Aguardando conteúdo...'}
`).join('\n')}

## Indicadores GRI
${indicatorData.map(data => `
### ${data.indicator?.code} - ${data.indicator?.title}
Valor: ${data.numeric_value || data.text_value || data.percentage_value || 'Não informado'}
${data.notes ? `Observações: ${data.notes}` : ''}
`).join('\n')}

## Temas Materiais
${materialityTopics.map(topic => `
### ${topic.topic_name}
${topic.description || ''}
Nível de Significância: ${topic.significance_level}/5
`).join('\n')}

## Alinhamento com ODS
${sdgAlignment.map(sdg => `
### ODS ${sdg.sdg_number}
${sdg.description || ''}
Nível de Contribuição: ${sdg.contribution_level || 'Não informado'}
`).join('\n')}
  `;
}