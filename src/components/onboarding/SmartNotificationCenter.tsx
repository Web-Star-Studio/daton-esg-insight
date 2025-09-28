import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

interface SmartNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip' | 'achievement' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    text: string;
    onClick: () => void;
  };
  autoExpire?: number; // seconds
}

interface SmartNotificationCenterProps {
  onboardingData: {
    currentStep: number;
    selectedModules: string[];
    timeSpent: number;
    completionPercentage: number;
  };
  userBehavior: {
    engagementLevel: 'high' | 'medium' | 'low';
    strugglingAreas: string[];
    achievements: string[];
  };
}

export function SmartNotificationCenter({
  onboardingData,
  userBehavior
}: SmartNotificationCenterProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSmartNotifications = () => {
    const newNotifications: SmartNotification[] = [];

    // Achievement notifications
    if (onboardingData.completionPercentage > 50 && !notifications.some(n => n.id === 'halfway_achievement')) {
      newNotifications.push({
        id: 'halfway_achievement',
        type: 'achievement',
        title: '🎉 Meio caminho percorrido!',
        message: 'Você já completou mais da metade da configuração. Continue assim!',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionable: false,
        autoExpire: 10
      });
    }

    // Module selection milestones
    if (onboardingData.selectedModules.length >= 3 && !notifications.some(n => n.id === 'good_selection')) {
      newNotifications.push({
        id: 'good_selection',
        type: 'success',
        title: '✅ Seleção equilibrada',
        message: `${onboardingData.selectedModules.length} módulos selecionados - uma quantidade ideal para começar.`,
        timestamp: new Date(),
        read: false,
        priority: 'low',
        actionable: false,
        autoExpire: 8
      });
    }

    // Struggling area notifications
    if (userBehavior.strugglingAreas.includes('module_selection')) {
      newNotifications.push({
        id: 'help_module_selection',
        type: 'tip',
        title: '💡 Dica inteligente',
        message: 'Tendo dificuldades? Use nossas recomendações baseadas no seu setor.',
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionable: true,
        action: {
          text: 'Ver recomendações',
          onClick: () => console.log('Show recommendations')
        }
      });
    }

    // Time-based notifications
    if (onboardingData.timeSpent > 600 && !notifications.some(n => n.id === 'time_reminder')) { // 10 minutes
      newNotifications.push({
        id: 'time_reminder',
        type: 'info',
        title: '⏰ Progresso salvo',
        message: 'Você pode pausar a qualquer momento. Seu progresso está sendo salvo automaticamente.',
        timestamp: new Date(),
        read: false,
        priority: 'low',
        actionable: false,
        autoExpire: 12
      });
    }

    // Engagement-based notifications
    if (userBehavior.engagementLevel === 'low') {
      newNotifications.push({
        id: 'engagement_boost',
        type: 'tip',
        title: '🚀 Acelere sua configuração',
        message: 'Use o modo de configuração rápida para terminar em menos de 5 minutos.',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionable: true,
        action: {
          text: 'Ativar modo rápido',
          onClick: () => console.log('Enable quick mode')
        }
      });
    }

    // Smart industry-specific tips
    if (onboardingData.selectedModules.includes('inventario_gee')) {
      newNotifications.push({
        id: 'gee_tip',
        type: 'tip',
        title: '🌱 Dica sobre Inventário GEE',
        message: 'Configure primeiro os escopos 1 e 2 - são os mais fáceis de implementar.',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionable: false,
        autoExpire: 15
      });
    }

    // Progress notifications
    if (onboardingData.completionPercentage === 100) {
      newNotifications.push({
        id: 'completion_celebration',
        type: 'achievement',
        title: '🎊 Configuração concluída!',
        message: 'Parabéns! Sua plataforma está pronta para uso. Vamos começar?',
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionable: true,
        action: {
          text: 'Ir para dashboard',
          onClick: () => console.log('Navigate to dashboard')
        }
      });
    }

    return newNotifications;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'tip': return <Lightbulb className="h-4 w-4 text-purple-600" />;
      case 'achievement': return <Sparkles className="h-4 w-4 text-indigo-600" />;
      case 'reminder': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationStyle = (type: SmartNotification['type']) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'tip': return 'border-purple-200 bg-purple-50';
      case 'achievement': return 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50';
      case 'reminder': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  useEffect(() => {
    const newNotifications = generateSmartNotifications();
    setNotifications(prev => [...prev, ...newNotifications]);
  }, [onboardingData, userBehavior]);

  useEffect(() => {
    // Auto-expire notifications
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.filter(notification => {
          if (notification.autoExpire) {
            const age = (Date.now() - notification.timestamp.getTime()) / 1000;
            return age < notification.autoExpire;
          }
          return true;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <div className={`w-5 h-5 rounded-full text-xs font-medium text-white ${
              highPriorityCount > 0 ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {unreadCount}
            </div>
          </div>
        )}
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="p-3 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Notificações Inteligentes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação no momento
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 ${getNotificationStyle(notification.type)} ${
                      !notification.read ? 'border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-xs">{notification.title}</h4>
                          {notification.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {notification.actionable && notification.action && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => {
                                  notification.action?.onClick();
                                  markAsRead(notification.id);
                                }}
                              >
                                {notification.action.text}
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 w-6 p-0"
                              onClick={() => dismissNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}