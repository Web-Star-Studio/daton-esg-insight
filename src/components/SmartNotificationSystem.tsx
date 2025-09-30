import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from '@/services/notifications';
import { NotificationPreferencesModal, NotificationPreferences } from '@/components/NotificationPreferencesModal';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { toast } from 'sonner';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useSmartCache } from '@/hooks/useSmartCache';

const SmartNotificationSystemComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    // Carregar preferências do localStorage se disponível
    try {
      const stored = localStorage.getItem('notification-preferences');
      return stored ? JSON.parse(stored) : {
        enabled: true,
        emailEnabled: true,
        emailAddress: '',
        emailFrequency: 'immediate',
        pushEnabled: true,
        soundEnabled: false,
        priority: 'all',
        categories: {
          emissions: true,
          goals: true,
          compliance: true,
          audit: true,
          documents: true,
          quality: true,
          gri: true,
          risk: true,
          predictive: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        maxNotificationsPerHour: 20
      };
    } catch {
      return {
        enabled: true,
        emailEnabled: true,
        emailAddress: '',
        emailFrequency: 'immediate',
        pushEnabled: true,
        soundEnabled: false,
        priority: 'all',
        categories: {
          emissions: true,
          goals: true,
          compliance: true,
          audit: true,
          documents: true,
          quality: true,
          gri: true,
          risk: true,
          predictive: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        maxNotificationsPerHour: 20
      };
    }
  });
  
  const queryClient = useQueryClient();
  
  // Initialize notification triggers
  useNotificationTriggers();

  // Persistir preferências quando mudarem
  useEffect(() => {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Falha ao salvar preferências de notificação:', error);
    }
  }, [preferences]);

  // Smart cache for notifications (high priority)
  const { data: notifications = [], isLoading, refetch: refetchNotifications } = useSmartCache<Notification[]>({
    queryKey: ['smart-notifications'],
    queryFn: async () => {
      try {
        return await getNotifications(50);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        toast.error('Falha ao carregar notificações');
        return [];
      }
    },
    priority: 'high',
    staleTime: 60000, // 1 minute
    preloadRelated: [['smart-notifications-unread-count']],
  });

  // Smart cache for unread count (very high priority)
  const { data: unreadCount = 0, refetch: refetchUnread } = useSmartCache<number>({
    queryKey: ['smart-notifications-unread-count'],
    queryFn: async () => {
      try {
        return await getUnreadCount();
      } catch (error) {
        console.error('Erro ao carregar contagem de não lidas:', error);
        return 0;
      }
    },
    priority: 'high',
    staleTime: 30000, // 30 seconds
  });

  // Auto-refresh notifications with real-time updates
  const { refresh, isRefreshing } = useAutoRefresh({
    queryKeys: [['smart-notifications'], ['smart-notifications-unread-count']],
    interval: 15000, // 15 seconds
    enableRealtime: true,
    realtimeTable: 'notifications',
    onDataChange: useCallback((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newNotification = payload.new as Notification;
        
        // Smart notification based on type and user preferences
        if (shouldShowNotification(newNotification.type, preferences)) {
          showSmartNotification(newNotification);
        }
      }
      refetchNotifications();
      refetchUnread();
    }, [preferences, refetchNotifications, refetchUnread])
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['smart-notifications-unread-count'] });
    },
    onError: (error) => {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['smart-notifications-unread-count'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
    onError: (error) => {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar todas as notificações como lidas');
    },
  });

  const shouldShowNotification = useCallback((type: string, prefs: NotificationPreferences): boolean => {
    if (!prefs.enabled) return false;
    if (prefs.priority === 'critical' && type !== 'error') return false;
    if (prefs.priority === 'high' && !['error', 'warning'].includes(type)) return false;
    
    // Check quiet hours
    if (prefs.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime >= prefs.quietHours.startTime || currentTime <= prefs.quietHours.endTime) {
        return type === 'error'; // Only show critical errors during quiet hours
      }
    }
    
    return true;
  }, []);

  const showSmartNotification = useCallback((notification: Notification) => {
    const config = getNotificationConfig(notification.type);
    
    toast(notification.title, {
      description: notification.message,
      duration: config.duration,
      action: notification.action_url ? {
        label: 'Ver',
        onClick: () => {
          try {
            window.open(notification.action_url, '_blank');
          } catch (error) {
            console.error('Erro ao abrir URL:', error);
            toast.error('Não foi possível abrir o link');
          }
        }
      } : undefined,
      style: {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      }
    });

    // Play sound if enabled
    if (preferences.soundEnabled && config.playSound) {
      playNotificationSound(notification.type);
    }
  }, [preferences.soundEnabled]);

  const getNotificationConfig = useCallback((type: string) => {
    const configs = {
      error: {
        duration: 8000,
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        borderColor: 'hsl(var(--destructive))',
        playSound: true
      },
      warning: {
        duration: 6000,
        backgroundColor: 'hsl(var(--warning) / 0.1)',
        borderColor: 'hsl(var(--warning))',
        playSound: true
      },
      success: {
        duration: 4000,
        backgroundColor: 'hsl(var(--success) / 0.1)',
        borderColor: 'hsl(var(--success))',
        playSound: false
      },
      info: {
        duration: 5000,
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        borderColor: 'hsl(var(--primary))',
        playSound: false
      }
    };
    return configs[type as keyof typeof configs] || configs.info;
  }, []);

  const playNotificationSound = useCallback((type: string) => {
    try {
      // Simple audio feedback - could be enhanced with actual sound files
      if ('AudioContext' in window) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = type === 'error' ? 400 : 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.warn('Não foi possível reproduzir som da notificação:', error);
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.action_url) {
      try {
        window.open(notification.action_url, '_blank');
      } catch (error) {
        console.error('Erro ao abrir URL:', error);
        toast.error('Não foi possível abrir o link');
      }
    }
  }, [markAsReadMutation]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-destructive bg-destructive/5';
      case 'warning': return 'border-l-warning bg-warning/5';
      case 'success': return 'border-l-success bg-success/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  // Memoizar agrupamento de notificações para melhor performance
  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const today = new Date();
      const notificationDate = new Date(notification.created_at);
      const diffInHours = (today.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
      
      let group = 'Antigas';
      if (diffInHours < 1) group = 'Última hora';
      else if (diffInHours < 24) group = 'Hoje';
      else if (diffInHours < 48) group = 'Ontem';
      else if (diffInHours < 168) group = 'Esta semana';
      
      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

  // Função para atualizar preferências com validação
  const updatePreference = useCallback((key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => {
      try {
        return { ...prev, [key]: value };
      } catch (error) {
        console.error('Erro ao atualizar preferência:', error);
        toast.error('Erro ao salvar configuração');
        return prev;
      }
    });
  }, []);

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            {isRefreshing && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notificações</h3>
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPreferencesModal
                preferences={preferences}
                onPreferencesChange={setPreferences}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <Bell className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>


          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                  <div key={group}>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                      {group}
                    </div>
                    <div className="divide-y">
                      {groupNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${getPriorityColor(notification.type)} ${
                            !notification.is_read ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

        </PopoverContent>
      </Popover>
    </>
  );
};

// Export memoized component
export const SmartNotificationSystem = memo(SmartNotificationSystemComponent);