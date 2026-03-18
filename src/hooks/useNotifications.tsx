import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  category: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  _source: 'notifications' | 'audit_notifications';
}

/** Map audit_notifications row into the unified Notification shape */
function mapAuditNotification(row: any): Notification {
  return {
    id: row.id,
    company_id: row.company_id,
    user_id: row.user_id,
    title: row.title,
    message: row.message,
    notification_type: row.priority === 'urgent' || row.priority === 'high' ? 'warning' : 'info',
    category: row.notification_type?.startsWith('sgq_') ? 'tarefas' : 'sistema',
    action_url: row.action_url,
    is_read: !!row.read_at,
    read_at: row.read_at,
    created_at: row.created_at,
    _source: 'audit_notifications',
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch from both tables in parallel
      const [notifResult, auditResult] = await Promise.all([
        supabase
          .from('notifications' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('audit_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const regularNotifs: Notification[] = ((notifResult.data || []) as any[]).map(n => ({
        ...n,
        _source: 'notifications' as const,
      }));

      const auditNotifs: Notification[] = ((auditResult.data || []) as any[]).map(mapAuditNotification);

      // Merge and sort by created_at desc
      const merged = [...regularNotifs, ...auditNotifs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 50);

      setNotifications(merged);
      setUnreadCount(merged.filter((n) => !n.is_read).length);
    } catch (error) {
      logger.error('Error fetching notifications', error, 'notification');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification._source === 'audit_notifications') {
        const { error } = await supabase
          .from('audit_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications' as any)
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId);
        if (error) throw error;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Error marking notification as read', error, 'notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      if (unread.length === 0) return;

      const regularIds = unread.filter(n => n._source === 'notifications').map(n => n.id);
      const auditIds = unread.filter(n => n._source === 'audit_notifications').map(n => n.id);

      const promises: Promise<any>[] = [];

      if (regularIds.length > 0) {
        promises.push(
          supabase
            .from('notifications' as any)
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', regularIds)
            .then()
        );
      }

      if (auditIds.length > 0) {
        promises.push(
          supabase
            .from('audit_notifications')
            .update({ read_at: new Date().toISOString() })
            .in('id', auditIds)
            .then()
        );
      }

      await Promise.all(promises);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({ title: "Todas as notificações foram marcadas como lidas" });
    } catch (error) {
      logger.error('Error marking all as read', error, 'notification');
      toast({ title: "Erro ao marcar notificações", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to both tables
    const channel = supabase
      .channel('all-notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = { ...payload.new, _source: 'notifications' } as Notification;
          setNotifications(prev => [n, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          toast({
            title: n.title,
            description: n.message,
            variant: n.notification_type === 'critical' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_notifications' },
        (payload) => {
          const n = mapAuditNotification(payload.new);
          setNotifications(prev => [n, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          toast({
            title: n.title,
            description: (payload.new as any).message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
