import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface IntelligentAlert {
  id: string;
  company_id: string;
  alert_type: 'emission_spike' | 'goal_at_risk' | 'license_expiring' | 'task_overdue' | 'compliance_breach' | 'anomaly_detected' | 'target_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  related_entity_type: string;
  related_entity_id: string;
  threshold_value?: number | null;
  current_value?: number | null;
  recommended_actions: string[] | null;
  is_resolved: boolean;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
  resolution_notes?: string | null;
  auto_generated: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<IntelligentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('license_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts((data || []) as unknown as IntelligentAlert[]);
    } catch (error) {
      logger.error('Error fetching alerts', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('license_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido com sucesso.",
      });
    } catch (error) {
      logger.error('Error resolving alert', error);
      toast({
        title: "Erro ao resolver alerta",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'license_alerts'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-600 bg-red-50 border-red-200',
          badge: 'destructive'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          badge: 'default'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          badge: 'secondary'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badge: 'outline'
        };
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Alertas Inteligentes</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum alerta ativo! Tudo está funcionando perfeitamente.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold">Alertas Inteligentes</h3>
        </div>
        <Badge variant="destructive">{alerts.length} ativo{alerts.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                config.color
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1">
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight">{alert.title}</h4>
                      <Badge variant={config.badge as any} className="text-xs flex-shrink-0">
                        {alert.severity === 'critical' ? 'Crítico' : 
                         alert.severity === 'high' ? 'Alto' :
                         alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">{alert.description}</p>
                    
                    {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Ações recomendadas:</p>
                        <ul className="text-xs space-y-1 opacity-90">
                          {alert.recommended_actions.slice(0, 3).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-xs mt-0.5">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => resolveAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
