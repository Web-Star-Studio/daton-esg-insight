import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from '@/services/notifications';
import { toast } from 'sonner';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  priority: 'all' | 'high' | 'critical';
}

export const SmartNotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    soundEnabled: false,
    priority: 'all'
  });
  
  const queryClient = useQueryClient();

  // Smart cache for notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['smart-notifications'],
    queryFn: () => getNotifications(50),
    staleTime: 1 * 60 * 1000, // 1 minute - high priority
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['smart-notifications-unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds - very high priority
  });

  // Auto-refresh notifications with real-time updates
  const { refresh, isRefreshing, lastRefresh } = useAutoRefresh({
    queryKeys: [['smart-notifications'], ['smart-notifications-unread-count']],
    interval: 15000, // 15 seconds
    enableRealtime: true,
    realtimeTable: 'notifications',
    onDataChange: (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newNotification = payload.new as Notification;
        
        // Smart notification based on type and user preferences
        if (shouldShowNotification(newNotification.type, preferences)) {
          showSmartNotification(newNotification);
        }
      }
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['smart-notifications-unread-count'] });
    },
    onError: () => {
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
    onError: () => {
      toast.error('Erro ao marcar todas as notificações como lidas');
    },
  });

  const shouldShowNotification = (type: string, prefs: NotificationPreferences): boolean => {
    if (prefs.priority === 'critical' && type !== 'error') return false;
    if (prefs.priority === 'high' && !['error', 'warning'].includes(type)) return false;
    return true;
  };

  const showSmartNotification = (notification: Notification) => {
    const config = getNotificationConfig(notification.type);
    
    toast(notification.title, {
      description: notification.message,
      duration: config.duration,
      action: notification.action_url ? {
        label: 'Ver',
        onClick: () => window.open(notification.action_url, '_blank')
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
  };

  const getNotificationConfig = (type: string) => {
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
  };

  const playNotificationSound = (type: string) => {
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
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

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

  const groupedNotifications = notifications.reduce((groups, notification) => {
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
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

          {showSettings && (
            <Card className="m-4 mb-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações por email</span>
                  <Switch
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, emailEnabled: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Som das notificações</span>
                  <Switch
                    checked={preferences.soundEnabled}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, soundEnabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

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

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Última atualização: {formatDistanceToNow(lastRefresh, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};