import { supabase } from '@/integrations/supabase/client';

export interface AuditNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  audit_id?: string;
  action_url?: string;
  read_at?: string | null;
  created_at: string;
  scheduled_for?: string | null;
  sent_at?: string | null;
}

export class AuditNotificationService {
  static async createNotification(
    userId: string,
    companyId: string,
    data: {
      title: string;
      message: string;
      notification_type: string;
      priority?: string;
      audit_id?: string;
      action_url?: string;
      scheduled_for?: string;
    }
  ) {
    const { data: notification, error } = await supabase
      .from('audit_notifications')
      .insert({
        user_id: userId,
        company_id: companyId,
        title: data.title,
        message: data.message,
        notification_type: data.notification_type,
        priority: data.priority || 'normal',
        audit_id: data.audit_id,
        action_url: data.action_url,
        scheduled_for: data.scheduled_for,
        sent_at: data.scheduled_for ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  static async getUnreadNotifications(userId: string, companyId: string) {
    const { data, error } = await supabase
      .from('audit_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AuditNotification[];
  }

  static async getAllNotifications(userId: string, companyId: string, limit = 50) {
    const { data, error } = await supabase
      .from('audit_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AuditNotification[];
  }

  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('audit_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async markAllAsRead(userId: string, companyId: string) {
    const { error } = await supabase
      .from('audit_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .is('read_at', null);

    if (error) throw error;
  }

  // Notification creators for specific events
  static async notifyAuditScheduled(
    auditId: string,
    auditTitle: string,
    startDate: string,
    companyId: string,
    userIds: string[]
  ) {
    const auditDate = new Date(startDate);
    const now = new Date();
    
    // Create notifications for 7, 3, and 1 day before
    const intervals = [
      { days: 7, label: '7 dias' },
      { days: 3, label: '3 dias' },
      { days: 1, label: '1 dia' }
    ];

    for (const interval of intervals) {
      const scheduledDate = new Date(auditDate);
      scheduledDate.setDate(scheduledDate.getDate() - interval.days);

      if (scheduledDate > now) {
        for (const userId of userIds) {
          await this.createNotification(userId, companyId, {
            title: `Auditoria em ${interval.label}`,
            message: `A auditoria "${auditTitle}" está agendada para ${auditDate.toLocaleDateString('pt-BR')}`,
            notification_type: 'audit_reminder',
            priority: interval.days === 1 ? 'high' : 'normal',
            audit_id: auditId,
            action_url: `/auditoria/${auditId}`,
            scheduled_for: scheduledDate.toISOString(),
          });
        }
      }
    }
  }

  static async notifyCriticalFinding(
    findingId: string,
    auditId: string,
    auditTitle: string,
    findingDescription: string,
    companyId: string,
    userIds: string[]
  ) {
    for (const userId of userIds) {
      await this.createNotification(userId, companyId, {
        title: 'Achado Crítico Registrado',
        message: `Achado crítico na auditoria "${auditTitle}": ${findingDescription.substring(0, 100)}...`,
        notification_type: 'critical_finding',
        priority: 'critical',
        audit_id: auditId,
        action_url: `/auditoria/${auditId}?tab=achados`,
      });
    }
  }

  static async notifyActionPlanDueSoon(
    findingId: string,
    auditId: string,
    auditTitle: string,
    dueDate: string,
    responsibleUserId: string,
    companyId: string
  ) {
    const dueDateObj = new Date(dueDate);
    const daysUntilDue = Math.ceil((dueDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 3 && daysUntilDue > 0) {
      await this.createNotification(responsibleUserId, companyId, {
        title: 'Prazo de Ação Corretiva Vencendo',
        message: `O plano de ação da auditoria "${auditTitle}" vence em ${daysUntilDue} dia(s)`,
        notification_type: 'action_plan_due',
        priority: daysUntilDue === 1 ? 'high' : 'normal',
        audit_id: auditId,
        action_url: `/auditoria/${auditId}?tab=achados`,
      });
    }
  }

  static async notifyIncompleteChecklist(
    auditId: string,
    auditTitle: string,
    companyId: string,
    auditorIds: string[]
  ) {
    for (const auditorId of auditorIds) {
      await this.createNotification(auditorId, companyId, {
        title: 'Checklist Incompleto',
        message: `O checklist da auditoria "${auditTitle}" está incompleto há mais de 48 horas`,
        notification_type: 'incomplete_checklist',
        priority: 'normal',
        audit_id: auditId,
        action_url: `/auditoria/${auditId}?tab=checklist`,
      });
    }
  }
}
