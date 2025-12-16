import { supabase } from '@/integrations/supabase/client';

// Types
export interface MandatoryReading {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_path: string | null;
  category_id: string | null;
  is_active: boolean;
  requires_confirmation: boolean;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export interface ReadingConfirmation {
  id: string;
  supplier_id: string;
  reading_id: string;
  confirmed_at: string;
  ip_address: string | null;
}

export interface SupplierSurvey {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  custom_form_id: string | null;
  category_id: string | null;
  is_mandatory: boolean;
  due_days: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  custom_form?: { id: string; title: string } | null;
}

export interface SurveyResponse {
  id: string;
  supplier_id: string;
  survey_id: string;
  form_submission_id: string | null;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  started_at: string | null;
  completed_at: string | null;
}

// =============================================
// MANDATORY READINGS (Admin)
// =============================================

export async function getMandatoryReadings(companyId: string): Promise<MandatoryReading[]> {
  const { data, error } = await supabase
    .from('supplier_mandatory_readings')
    .select(`
      *,
      category:supplier_categories(id, name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mandatory readings:', error);
    throw error;
  }

  return data || [];
}

export async function createMandatoryReading(reading: Omit<MandatoryReading, 'id' | 'created_at' | 'updated_at'>): Promise<MandatoryReading> {
  const { data, error } = await supabase
    .from('supplier_mandatory_readings')
    .insert(reading)
    .select()
    .single();

  if (error) {
    console.error('Error creating mandatory reading:', error);
    throw error;
  }

  return data;
}

export async function updateMandatoryReading(id: string, updates: Partial<MandatoryReading>): Promise<MandatoryReading> {
  const { data, error } = await supabase
    .from('supplier_mandatory_readings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating mandatory reading:', error);
    throw error;
  }

  return data;
}

export async function deleteMandatoryReading(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_mandatory_readings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting mandatory reading:', error);
    throw error;
  }
}

export async function getReadingConfirmations(readingId: string): Promise<ReadingConfirmation[]> {
  const { data, error } = await supabase
    .from('supplier_reading_confirmations')
    .select('*')
    .eq('reading_id', readingId)
    .order('confirmed_at', { ascending: false });

  if (error) {
    console.error('Error fetching reading confirmations:', error);
    throw error;
  }

  return data || [];
}

// =============================================
// SURVEYS (Admin)
// =============================================

export async function getSupplierSurveys(companyId: string): Promise<SupplierSurvey[]> {
  const { data, error } = await supabase
    .from('supplier_surveys')
    .select(`
      *,
      category:supplier_categories(id, name),
      custom_form:custom_forms(id, title)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier surveys:', error);
    throw error;
  }

  return data || [];
}

export async function createSupplierSurvey(survey: Omit<SupplierSurvey, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierSurvey> {
  const { data, error } = await supabase
    .from('supplier_surveys')
    .insert(survey)
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier survey:', error);
    throw error;
  }

  return data;
}

export async function updateSupplierSurvey(id: string, updates: Partial<SupplierSurvey>): Promise<SupplierSurvey> {
  const { data, error } = await supabase
    .from('supplier_surveys')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier survey:', error);
    throw error;
  }

  return data;
}

export async function deleteSupplierSurvey(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_surveys')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier survey:', error);
    throw error;
  }
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const { data, error } = await supabase
    .from('supplier_survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching survey responses:', error);
    throw error;
  }

  return (data || []) as SurveyResponse[];
}

// =============================================
// SUPPLIER PORTAL (External access)
// =============================================

// Helper to get supplier categories
async function getSupplierCategoryIds(supplierId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('supplier_category_assignments')
    .select('category_id')
    .eq('supplier_id', supplierId);
  
  if (error) {
    console.error('Error fetching supplier categories:', error);
    return [];
  }
  
  return (data || []).map(d => d.category_id);
}

export async function getSupplierReadings(supplierId: string, companyId: string): Promise<(MandatoryReading & { confirmed: boolean })[]> {
  // Get supplier's categories for EXT→CAT filtering
  const categoryIds = await getSupplierCategoryIds(supplierId);

  let query = supabase
    .from('supplier_mandatory_readings')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  // Filter by category if supplier has categories assigned (EXT→CAT)
  if (categoryIds.length > 0) {
    query = query.or(`category_id.is.null,category_id.in.(${categoryIds.join(',')})`);
  }

  const { data: readings, error: readingsError } = await query;

  if (readingsError) throw readingsError;

  const { data: confirmations, error: confError } = await supabase
    .from('supplier_reading_confirmations')
    .select('reading_id')
    .eq('supplier_id', supplierId);

  if (confError) throw confError;

  const confirmedIds = new Set((confirmations as any[] || []).map(c => c.reading_id));

  return (readings || []).map(reading => ({
    ...reading,
    confirmed: confirmedIds.has(reading.id)
  }));
}

export async function confirmReading(supplierId: string, readingId: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_reading_confirmations')
    .insert({
      supplier_id: supplierId,
      reading_id: readingId
    });

  if (error) throw error;
}

export async function getSupplierSurveysForPortal(supplierId: string, companyId: string): Promise<(SupplierSurvey & { response?: SurveyResponse })[]> {
  // Get supplier's categories for EXT→CAT filtering
  const categoryIds = await getSupplierCategoryIds(supplierId);

  let query = supabase
    .from('supplier_surveys')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  // Filter by category if supplier has categories assigned (EXT→CAT)
  if (categoryIds.length > 0) {
    query = query.or(`category_id.is.null,category_id.in.(${categoryIds.join(',')})`);
  }

  const { data: surveys, error: surveysError } = await query;

  if (surveysError) throw surveysError;

  const { data: responses, error: respError } = await supabase
    .from('supplier_survey_responses')
    .select('*')
    .eq('supplier_id', supplierId);

  if (respError) throw respError;

  const responseMap = new Map((responses as any[] || []).map(r => [r.survey_id, r as SurveyResponse]));

  return (surveys || []).map(survey => ({
    ...survey,
    response: responseMap.get(survey.id)
  }));
}

export async function startSurveyResponse(supplierId: string, surveyId: string): Promise<SurveyResponse> {
  const { data, error } = await supabase
    .from('supplier_survey_responses')
    .upsert({
      supplier_id: supplierId,
      survey_id: surveyId,
      status: 'Em Andamento',
      started_at: new Date().toISOString()
    }, {
      onConflict: 'supplier_id,survey_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data as SurveyResponse;
}

export async function completeSurveyResponse(supplierId: string, surveyId: string, formSubmissionId?: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_survey_responses')
    .update({
      status: 'Concluído',
      completed_at: new Date().toISOString(),
      form_submission_id: formSubmissionId
    })
    .eq('supplier_id', supplierId)
    .eq('survey_id', surveyId);

  if (error) throw error;
}

// =============================================
// SUPPLIER TRAININGS (for portal)
// =============================================

export async function getSupplierTrainingsForPortal(supplierId: string, companyId: string) {
  // Get supplier's categories for EXT→CAT filtering
  const categoryIds = await getSupplierCategoryIds(supplierId);

  // Get all active trainings for company
  const { data: trainings, error: trainError } = await supabase
    .from('supplier_training_materials')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (trainError) throw trainError;

  // Get training-category links to filter (EXT→CAT)
  let filteredTrainings = trainings || [];
  if (categoryIds.length > 0) {
    const { data: categoryLinks } = await supabase
      .from('supplier_training_category_links')
      .select('training_material_id, category_id')
      .in('category_id', categoryIds);

    const linkedTrainingIds = new Set((categoryLinks || []).map(l => l.training_material_id));
    
    // Include trainings that are either linked to supplier's categories OR have no category links (general trainings)
    const { data: allLinks } = await supabase
      .from('supplier_training_category_links')
      .select('training_material_id');
    
    const trainingsWithLinks = new Set((allLinks || []).map(l => l.training_material_id));
    
    filteredTrainings = filteredTrainings.filter(t => 
      !trainingsWithLinks.has(t.id) || linkedTrainingIds.has(t.id)
    );
  }

  const { data: progress, error: progError } = await supabase
    .from('supplier_training_progress')
    .select('*')
    .eq('supplier_id', supplierId);

  if (progError) throw progError;

  const progressMap = new Map((progress as any[] || []).map(p => [p.training_material_id, p]));

  return filteredTrainings.map(training => ({
    ...training,
    progress: progressMap.get(training.id)
  }));
}

export async function updateTrainingProgress(
  supplierId: string, 
  trainingId: string, 
  status: 'Não Iniciado' | 'Em Andamento' | 'Concluído',
  score?: number
): Promise<void> {
  const updateData: any = {
    supplier_id: supplierId,
    training_material_id: trainingId,
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'Em Andamento') {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'Concluído') {
    updateData.completed_at = new Date().toISOString();
    if (score !== undefined) {
      updateData.score = score;
    }
  }

  const { error } = await supabase
    .from('supplier_training_progress')
    .upsert(updateData, {
      onConflict: 'supplier_id,training_material_id'
    });

  if (error) throw error;
}

