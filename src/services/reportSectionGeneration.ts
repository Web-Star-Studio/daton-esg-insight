import { supabase } from '@/integrations/supabase/client';

export interface ReportSectionTemplate {
  id: string;
  template_key: string;
  template_name: string;
  category: string;
  section_order: number;
  description: string;
  required_data_sources: string[];
  subsections: any;
  visual_types: string[];
  is_active: boolean;
}

export interface GeneratedSection {
  id: string;
  report_id: string;
  template_id: string;
  section_content: any;
  generated_text: string;
  generated_visuals: GeneratedVisual[];
  data_sources_used: string[];
  ai_generated: boolean;
  generation_timestamp: string;
  manually_edited: boolean;
  approved: boolean;
  template?: ReportSectionTemplate;
}

export interface GeneratedVisual {
  type: 'bar_chart' | 'pie_chart' | 'line_chart' | 'table' | 'matrix';
  title: string;
  data: any[];
  config: any;
}

export async function getReportTemplates(): Promise<ReportSectionTemplate[]> {
  const { data, error } = await supabase
    .from('report_section_templates')
    .select('*')
    .eq('is_active', true)
    .order('section_order');

  if (error) throw error;
  return data || [];
}

export async function generateReportSection(
  reportId: string,
  templateKey: string,
  regenerate: boolean = false
): Promise<GeneratedSection> {
  const { data, error } = await supabase.functions.invoke('report-section-generator', {
    body: { reportId, templateKey, regenerate }
  });

  if (error) throw error;
  return data.section;
}

export async function getGeneratedSections(reportId: string): Promise<GeneratedSection[]> {
  const { data, error } = await supabase
    .from('report_generated_sections')
    .select(`
      *,
      template:report_section_templates(*)
    `)
    .eq('report_id', reportId)
    .order('template.section_order');

  if (error) throw error;
  return (data || []) as any;
}

export async function updateGeneratedSection(
  sectionId: string,
  updates: Partial<GeneratedSection>
): Promise<GeneratedSection> {
  const { data, error } = await supabase
    .from('report_generated_sections')
    .update({
      ...updates as any,
      manually_edited: true,
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function approveSection(
  sectionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('report_generated_sections')
    .update({
      approved: true,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', sectionId);

  if (error) throw error;
}

export async function deleteGeneratedSection(sectionId: string): Promise<void> {
  const { error } = await supabase
    .from('report_generated_sections')
    .delete()
    .eq('id', sectionId);

  if (error) throw error;
}
