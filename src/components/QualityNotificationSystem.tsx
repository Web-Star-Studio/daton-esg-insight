import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

interface QualityAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface QualityNotificationSystemProps {
  alerts: QualityAlert[];
  onDismiss?: (alertId: string) => void;
  autoDismissTime?: number; // in milliseconds
}

export const QualityNotificationSystem: React.FC<QualityNotificationSystemProps> = ({
  alerts,
  onDismiss,
  autoDismissTime = 5000
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    alerts.forEach((alert) => {
      const icon = getAlertIcon(alert.type);
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            {icon}
            <span>{alert.title}</span>
          </div>
        ) as any,
        description: alert.message,
        variant: alert.type === 'error' ? 'destructive' : 'default',
        action: alert.action ? (
          <button
            onClick={alert.action.onClick}
            className="text-sm underline hover:no-underline"
          >
            {alert.action.label}
          </button>
        ) : undefined,
      });

      // Auto dismiss if configured
      if (autoDismissTime > 0 && onDismiss) {
        setTimeout(() => {
          onDismiss(alert.id);
        }, autoDismissTime);
      }
    });
  }, [alerts, toast, onDismiss, autoDismissTime]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'info':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return null; // This component only triggers toasts
};

// Hook for managing quality alerts
export const useQualityAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = React.useState<QualityAlert[]>([]);

  const addAlert = (alert: Omit<QualityAlert, 'id' | 'timestamp'>) => {
    const newAlert: QualityAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Pre-configured alert creators
  const qualityAlerts = {
    ncCreated: (ncTitle: string) => addAlert({
      type: 'warning',
      title: 'Nova Não Conformidade',
      message: `"${ncTitle}" foi registrada no sistema`,
      action: {
        label: 'Ver Detalhes',
        onClick: () => navigate('/nao-conformidades')
      }
    }),

    actionPlanOverdue: (planTitle: string) => addAlert({
      type: 'error',
      title: 'Plano de Ação em Atraso',
      message: `"${planTitle}" passou do prazo estabelecido`,
      action: {
        label: 'Atualizar',
        onClick: () => navigate('/plano-acao-5w2h')
      }
    }),

    qualityImproved: (newScore: number) => addAlert({
      type: 'success',
      title: 'Melhoria na Qualidade',
      message: `Índice de qualidade subiu para ${newScore}%`,
    }),

    criticalRiskDetected: (riskDescription: string) => addAlert({
      type: 'error',
      title: 'Risco Crítico Detectado',
      message: riskDescription,
      action: {
        label: 'Avaliar Riscos',
        onClick: () => navigate('/gestao-riscos')
      }
    }),

    auditScheduled: (auditDate: string) => addAlert({
      type: 'info',
      title: 'Auditoria Agendada',
      message: `Auditoria interna agendada para ${auditDate}`,
      action: {
        label: 'Ver Cronograma',
        onClick: () => navigate('/auditoria')
      }
    })
  };

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAllAlerts,
    qualityAlerts
  };
};

export default QualityNotificationSystem;