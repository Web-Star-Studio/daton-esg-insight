import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';
import { logger } from '@/utils/logger';
import type { Json } from '@/integrations/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionValues = Json | Record<string, any>;

export interface ActivityHistoryItem {
  id: string;
  license_id: string;
  company_id: string;
  user_id: string;
  action_type: string;
  action_target_type: string;
  action_target_id: string;
  old_values?: ActionValues;
  new_values?: ActionValues;
  description?: string;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export interface ActionInput {
  license_id: string;
  action_type: string;
  action_target_type: 'alert' | 'observation' | 'condition' | 'document' | 'license';
  action_target_id: string;
  old_values?: ActionValues;
  new_values?: ActionValues;
  description?: string;
}

export interface HistoryFilters {
  action_type?: string;
  action_target_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export async function logAction(action: ActionInput): Promise<void> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) return;

  const { error } = await supabase
    .from('license_action_history')
    .insert({
      ...action,
      company_id: userAndCompany.company_id,
      user_id: userAndCompany.id
    });

  if (error) logger.error('Error logging action', error, 'compliance');
}

export async function getActivityHistory(
  licenseId: string, 
  filters?: HistoryFilters
): Promise<ActivityHistoryItem[]> {
  let query = supabase
    .from('license_action_history')
    .select('*, user:profiles(full_name)')
    .eq('license_id', licenseId)
    .order('created_at', { ascending: false });

  if (filters?.action_type) {
    query = query.eq('action_type', filters.action_type);
  }
  if (filters?.action_target_type) {
    query = query.eq('action_target_type', filters.action_target_type);
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description?: string;
  user?: string;
  icon: string;
  color: string;
}

export async function getActivityTimeline(licenseId: string): Promise<TimelineEvent[]> {
  const activities = await getActivityHistory(licenseId);

  return activities.map(activity => {
    const event: TimelineEvent = {
      id: activity.id,
      date: activity.created_at,
      type: activity.action_type,
      title: getActionTitle(activity.action_type, activity.action_target_type),
      description: activity.description,
      user: activity.user?.full_name,
      icon: getActionIcon(activity.action_type),
      color: getActionColor(activity.action_type)
    };
    return event;
  });
}

function getActionTitle(actionType: string, targetType: string): string {
  const titles: Record<string, string> = {
    'alert_created': 'Alerta criado',
    'alert_resolved': 'Alerta resolvido',
    'alert_snoozed': 'Alerta adiado',
    'alert_updated': 'Alerta atualizado',
    'observation_added': 'Observação adicionada',
    'observation_updated': 'Observação atualizada',
    'observation_archived': 'Observação arquivada',
    'comment_added': 'Comentário adicionado',
    'condition_updated': 'Condicionante atualizada',
    'document_uploaded': 'Documento anexado',
    'license_updated': 'Licença atualizada'
  };
  return titles[actionType] || `${targetType} ${actionType}`;
}

function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    'alert_created': 'AlertTriangle',
    'alert_resolved': 'CheckCircle',
    'alert_snoozed': 'Clock',
    'alert_updated': 'Edit',
    'observation_added': 'FileText',
    'observation_updated': 'Edit',
    'observation_archived': 'Archive',
    'comment_added': 'MessageSquare',
    'condition_updated': 'ListChecks',
    'document_uploaded': 'Upload',
    'license_updated': 'FileEdit'
  };
  return icons[actionType] || 'Activity';
}

function getActionColor(actionType: string): string {
  const colors: Record<string, string> = {
    'alert_created': 'text-yellow-600',
    'alert_resolved': 'text-green-600',
    'alert_snoozed': 'text-blue-600',
    'alert_updated': 'text-purple-600',
    'observation_added': 'text-cyan-600',
    'observation_updated': 'text-purple-600',
    'observation_archived': 'text-gray-600',
    'comment_added': 'text-indigo-600',
    'condition_updated': 'text-orange-600',
    'document_uploaded': 'text-green-600',
    'license_updated': 'text-blue-600'
  };
  return colors[actionType] || 'text-gray-600';
}

export async function getUserActivity(userId: string, period?: string): Promise<ActivityHistoryItem[]> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('User not authenticated');

  let query = supabase
    .from('license_action_history')
    .select('*, user:profiles(full_name)')
    .eq('company_id', userAndCompany.company_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (period) {
    const date = new Date();
    if (period === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (period === 'month') {
      date.setMonth(date.getMonth() - 1);
    } else if (period === 'year') {
      date.setFullYear(date.getFullYear() - 1);
    }
    query = query.gte('created_at', date.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
