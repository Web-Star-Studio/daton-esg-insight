import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Calendar,
  Clock,
  ArrowRight,
  Settings,
  Filter,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionUrl?: string;
  actionText?: string;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Licença Ambiental Vencendo',
    message: 'A licença de operação LO-001 vence em 15 dias. Agende a renovação.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    isRead: false,
    priority: 'high',
    category: 'Licenciamento',
    actionUrl: '/licenciamento/renovar/LO-001',
    actionText: 'Renovar Agora'
  },
  {
    id: '2',
    title: 'Inventário GEE Atualizado',
    message: 'Novos dados de emissões foram processados com sucesso.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
    isRead: false,
    priority: 'medium',
    category: 'Emissões',
    actionUrl: '/inventario-gee',
    actionText: 'Ver Relatório'
  },
  {
    id: '3',
    title: 'Auditoria SGQ Agendada',
    message: 'Auditoria interna do Sistema de Gestão da Qualidade programada para próxima semana.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4h ago
    isRead: true,
    priority: 'medium',
    category: 'Qualidade'
  },
  {
    id: '4',
    title: 'Meta ESG Atingida',
    message: 'Parabéns! A meta de redução de 15% nas emissões foi alcançada.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
    priority: 'high',
    category: 'ESG'
  },
  {
    id: '5',
    title: 'Treinamento Obrigatório',
    message: 'Lembrete: treinamento de segurança deve ser concluído até sexta-feira.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    isRead: false,
    priority: 'medium',
    category: 'Treinamento',
    actionUrl: '/treinamentos/seguranca',
    actionText: 'Acessar'
  }
];

export function SmartNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityUnread = notifications.filter(n => !n.isRead && n.priority === 'high').length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'priority' && notification.priority !== 'high') return false;
    if (selectedCategory && notification.category !== selectedCategory) return false;
    return true;
  });

  const categories = [...new Set(notifications.map(n => n.category))];

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover-scale transition-all"
        data-notifications
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge 
            className={`absolute -top-1 -right-1 w-5 h-5 p-0 text-xs animate-pulse ${
              highPriorityUnread > 0 ? 'bg-red-500' : 'bg-primary'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel */}
          <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-2xl border-0 animate-slide-in-right max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="animate-fade-in">
                      {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs hover-scale"
                    disabled={unreadCount === 0}
                  >
                    Marcar todas
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs hover-scale"
                >
                  Todas
                </Button>
                
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="text-xs hover-scale"
                >
                  Não lidas
                </Button>
                
                <Button
                  variant={filter === 'priority' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('priority')}
                  className="text-xs hover-scale"
                >
                  Prioritárias
                </Button>
              </div>

              {/* Categories */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                <Button
                  variant={selectedCategory === null ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs whitespace-nowrap"
                >
                  Todas
                </Button>
                
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                <div className="space-y-1 p-4 pt-0">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação encontrada</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer group ${
                            notification.isRead 
                              ? 'bg-gray-50/50 border-gray-100' 
                              : 'bg-white border-border/50 shadow-sm'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {notification.title}
                                </h4>
                                
                                <div className="flex items-center gap-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                                
                                {notification.actionText && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 gap-1 hover-scale"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {notification.actionText}
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              
              {/* Footer */}
              <div className="border-t p-3 bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-center gap-2 text-xs hover-scale"
                >
                  <Settings className="w-4 h-4" />
                  Configurar Notificações
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}