/**
 * Notification entity types
 */

export interface NotificationMetadata {
  source?: string;
  priority?: number;
  actionType?: string;
  entityId?: string;
  entityType?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'critical' | 'success';
  category: 'emissoes' | 'metas' | 'licencas' | 'tarefas' | 'riscos' | 'nao_conformidades' | 'sistema';
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  metadata?: NotificationMetadata;
  created_at: string;
  updated_at: string;
}

export type NotificationType = Notification['notification_type'];
export type NotificationCategory = Notification['category'];
