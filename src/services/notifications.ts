import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  priority?: string;
  is_read: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  created_at: string;
  read_at?: string;
  updated_at?: string;
}

export const getNotifications = async (limit: number = 50): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllAsRead = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

export const createNotification = async (
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  actionUrl?: string,
  actionLabel?: string,
  category?: string,
  priority?: string,
  metadata?: any
): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      title,
      message,
      type,
      category,
      priority: priority || 'info',
      action_url: actionUrl,
      action_label: actionLabel,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Map event types to valid edge function actions
const eventToActionMap: Record<string, string | null> = {
  'emission_data_added': 'check_emission_spikes',
  'goal_updated': 'check_goal_deadlines',
  'license_expiring': 'check_legislation_reviews',
  'audit_finding_created': null, // No batch action available
  'compliance_task_overdue': 'check_compliance_tasks',
  'document_uploaded': null, // No batch action available
  'quality_issue_detected': null, // No batch action available
  'gri_indicator_updated': null, // No batch action available
  'risk_assessment_completed': null, // No batch action available
  // Direct actions are also valid
  'check_goal_deadlines': 'check_goal_deadlines',
  'check_compliance_tasks': 'check_compliance_tasks',
  'check_emission_spikes': 'check_emission_spikes',
  'check_efficacy_evaluations': 'check_efficacy_evaluations',
  'check_legislation_reviews': 'check_legislation_reviews',
};

export const triggerSmartNotifications = async (eventType: string): Promise<void> => {
  try {
    const action = eventToActionMap[eventType];
    
    // Skip if no valid action for this event type
    if (!action) {
      console.log(`No smart notification action available for event: ${eventType}`);
      return;
    }

    const { data, error } = await supabase.functions.invoke('smart-notifications', {
      body: { action }
    });

    if (error) {
      console.error(`Error triggering smart notifications for ${eventType} -> ${action}:`, error);
      throw error;
    }

    console.log(`Smart notifications triggered for ${eventType} -> ${action}:`, data);
  } catch (error) {
    console.error(`Failed to trigger smart notifications:`, error);
    throw error;
  }
};