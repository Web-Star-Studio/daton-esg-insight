import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Filter,
  Settings,
  BellRing,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/services/notifications';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { useToast } from '@/hooks/use-toast';

interface AdvancedNotificationPanelProps {
  className?: string;
}

export const AdvancedNotificationPanel: React.FC<AdvancedNotificationPanelProps> = ({ className }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoMarkRead, setAutoMarkRead] = useState(false);
  const { toast } = useToast();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(50),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: unreadCount = 0, refetch: refetchCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  // Auto-play notification sound
  useEffect(() => {
    if (soundEnabled && unreadCount > 0) {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [unreadCount, soundEnabled]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <X className="h-4 w-4 text-destructive" />;
      case 'info': return <Info className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read);
        break;
      case 'priority':
        filtered = notifications.filter(n => n.priority === 'high');
        break;
      default:
        break;
    }
    
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      await refetch();
      await refetchCount();
      
      if (autoMarkRead) {
        toast({
          title: "Notificação marcada como lida",
          description: "A notificação foi automaticamente marcada como lida",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar notificação como lida",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await refetch();
      await refetchCount();
      toast({
        title: "Todas as notificações foram marcadas como lidas",
        description: `${unreadCount} notificações atualizadas`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar todas as notificações como lidas",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="h-5 w-5" />
            <CardTitle>Central de Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Sistema inteligente de notificações em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">
              Não Lidas
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="priority">Prioritárias</TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-mark-read"
                checked={autoMarkRead}
                onCheckedChange={setAutoMarkRead}
              />
              <Label htmlFor="auto-mark-read" className="text-xs">
                Marcar como lida automaticamente
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sound-notifications"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
              <Label htmlFor="sound-notifications" className="text-xs">
                Som
              </Label>
            </div>
          </div>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação encontrada</p>
                  <p className="text-sm">Quando houver novidades, elas aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                      }`}
                      onClick={() => autoMarkRead && !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {notification.priority && (
                                  <Badge 
                                    variant={getPriorityColor(notification.priority) as any}
                                    className="text-xs"
                                  >
                                    {notification.priority}
                                  </Badge>
                                )}
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(notification.created_at)}</span>
                                {notification.category && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>{notification.category}</span>
                                  </>
                                )}
                              </div>
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="h-6 text-xs"
                                >
                                  Marcar lida
                                </Button>
                              )}
                            </div>
                            {notification.action_url && notification.action_label && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to action URL
                                  window.location.href = notification.action_url!;
                                }}
                              >
                                {notification.action_label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedNotificationPanel;