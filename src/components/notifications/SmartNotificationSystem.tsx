import { Bell, AlertCircle, Info, CheckCircle, X, ExternalLink, Scale, Target, ClipboardCheck, Cloud, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSmartNotifications, getCategoryConfig } from '@/hooks/data/useSmartNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SmartNotificationSystem() {
  const { 
    notifications, 
    isLoading, 
    criticalCount, 
    totalUnread,
    markAsRead,
    markAllAsRead 
  } = useSmartNotifications();
  const navigate = useNavigate();

  const getPriorityIcon = (priority: string, category?: string) => {
    // Use category-specific icon if available
    const categoryConfig = getCategoryConfig(category);
    
    switch (priority) {
      case 'critical':
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'important':
      case 'high':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        // Use category icon for non-critical notifications
        return getCategoryIcon(category);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'legislation':
        return <Scale className="h-4 w-4 text-blue-500" />;
      case 'goal':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'compliance':
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      case 'ghg':
        return <Cloud className="h-4 w-4 text-orange-500" />;
      case 'training':
        return <GraduationCap className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return 'bg-destructive/10 border-destructive/20';
      case 'important':
      case 'high':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const handleAction = (notification: any) => {
    markAsRead(notification.id);
    
    // Check for action_url first (from database triggers)
    if (notification.action_url) {
      navigate(notification.action_url);
      return;
    }
    
    // Fallback to action_data.url
    if (notification.action_type === 'view' && notification.action_data?.url) {
      navigate(notification.action_data.url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant={criticalCount > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {totalUnread} não lidas
            </p>
          </div>
          {totalUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação pendente</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors cursor-pointer border-l-2",
                    getPriorityColor(notification.priority)
                  )}
                  onClick={() => handleAction(notification)}
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(notification.priority, notification.category)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm leading-tight">
                            {notification.title}
                          </p>
                          {notification.category && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {getCategoryConfig(notification.category).label}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        {(notification.action_url || notification.action_type) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(notification);
                            }}
                          >
                            {notification.action_label || 'Ver detalhes'}
                            <ExternalLink className="h-3 w-3 ml-1" />
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
      </PopoverContent>
    </Popover>
  );
}
