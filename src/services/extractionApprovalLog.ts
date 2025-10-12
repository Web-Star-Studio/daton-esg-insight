import { supabase } from '@/integrations/supabase/client';

export interface ApprovalLogEntry {
  extraction_id: string;
  file_id: string;
  action: 'approved' | 'rejected' | 'batch_approved' | 'edited';
  items_count: number;
  high_confidence_count?: number;
  edited_fields?: Array<{ field: string; old_value: string; new_value: string }>;
  approval_notes?: string;
  processing_time_seconds?: number;
}

export async function createApprovalLog(entry: ApprovalLogEntry) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  const { error } = await supabase
    .from('extraction_approval_log')
    .insert({
      company_id: profile.company_id,
      extraction_id: entry.extraction_id,
      file_id: entry.file_id,
      approved_by_user_id: session.user.id,
      action: entry.action,
      items_count: entry.items_count,
      high_confidence_count: entry.high_confidence_count,
      edited_fields: entry.edited_fields || [],
      approval_notes: entry.approval_notes,
      processing_time_seconds: entry.processing_time_seconds,
    });

  if (error) {
    console.error('Error creating approval log:', error);
    throw new Error(`Failed to create approval log: ${error.message}`);
  }
}

export async function getApprovalLogs(extractionId?: string) {
  let query = supabase
    .from('extraction_approval_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (extractionId) {
    query = query.eq('extraction_id', extractionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch approval logs: ${error.message}`);
  }

  return data || [];
}
