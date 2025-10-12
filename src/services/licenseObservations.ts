import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';
import { 
  LicenseObservation, 
  CreateObservationInput, 
  UpdateObservationInput,
  ObservationFilters,
  ObservationStats,
  Comment
} from '@/types/licenseObservations';

export async function createObservation(data: CreateObservationInput): Promise<LicenseObservation> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('User not authenticated');

  const { data: observation, error } = await supabase
    .from('license_observations')
    .insert({
      ...data,
      company_id: userAndCompany.company_id,
      created_by_user_id: userAndCompany.id,
      related_document_ids: data.related_document_ids || []
    })
    .select()
    .single();

  if (error) throw error;
  return observation as LicenseObservation;
}

export async function updateObservation(id: string, data: UpdateObservationInput): Promise<void> {
  const { error } = await supabase
    .from('license_observations')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

export async function archiveObservation(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_observations')
    .update({ 
      is_archived: true,
      archived_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteObservation(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_observations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAllObservations(
  licenseId: string, 
  filters?: ObservationFilters
): Promise<LicenseObservation[]> {
  let query = supabase
    .from('license_observations')
    .select('*')
    .eq('license_id', licenseId)
    .order('created_at', { ascending: false });

  if (filters?.observation_type) {
    query = query.eq('observation_type', filters.observation_type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.is_archived !== undefined) {
    query = query.eq('is_archived', filters.is_archived);
  }
  if (filters?.requires_followup !== undefined) {
    query = query.eq('requires_followup', filters.requires_followup);
  }
  if (filters?.created_by) {
    query = query.eq('created_by_user_id', filters.created_by);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as LicenseObservation[];
}

export async function getObservationById(id: string): Promise<LicenseObservation> {
  const { data, error } = await supabase
    .from('license_observations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as LicenseObservation;
}

export async function getObservationsRequiringFollowup(): Promise<LicenseObservation[]> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('license_observations')
    .select('*')
    .eq('company_id', userAndCompany.company_id)
    .eq('requires_followup', true)
    .eq('is_archived', false)
    .order('followup_date', { ascending: true });

  if (error) throw error;
  return (data || []) as LicenseObservation[];
}

export async function searchObservations(query: string): Promise<LicenseObservation[]> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('license_observations')
    .select('*')
    .eq('company_id', userAndCompany.company_id)
    .or(`title.ilike.%${query}%,observation_text.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as LicenseObservation[];
}

export async function addComment(
  targetId: string, 
  type: 'alert' | 'observation', 
  text: string
): Promise<Comment> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('User not authenticated');

  const commentData = {
    [type === 'alert' ? 'alert_id' : 'observation_id']: targetId,
    company_id: userAndCompany.company_id,
    user_id: userAndCompany.id,
    comment_text: text,
    is_internal: true
  };

  const { data, error } = await supabase
    .from('license_alert_comments')
    .insert(commentData)
    .select('*, user:profiles(full_name)')
    .single();

  if (error) throw error;
  return data;
}

export async function getComments(
  targetId: string, 
  type: 'alert' | 'observation'
): Promise<Comment[]> {
  const column = type === 'alert' ? 'alert_id' : 'observation_id';
  
  const { data, error } = await supabase
    .from('license_alert_comments')
    .select('*, user:profiles(full_name)')
    .eq(column, targetId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateComment(id: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('license_alert_comments')
    .update({ comment_text: text })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('license_alert_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getObservationStatistics(licenseId: string): Promise<ObservationStats> {
  const observations = await getAllObservations(licenseId, { is_archived: false });

  const by_type = observations.reduce((acc, obs) => {
    acc[obs.observation_type] = (acc[obs.observation_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const by_priority = observations.reduce((acc, obs) => {
    acc[obs.priority] = (acc[obs.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: observations.length,
    by_type,
    by_priority,
    requiring_followup: observations.filter(o => o.requires_followup).length,
    archived: observations.filter(o => o.is_archived).length
  };
}
