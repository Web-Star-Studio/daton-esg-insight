import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, XCircle, Info, X, Bell } from 'lucide-react';
import { usePerformanceManager } from '@/hooks/usePerformanceManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissed?: boolean;
}

export const SystemAlerts = () => {
  const { metrics, recommendations } = usePerformanceManager();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Critical system health
    if (metrics.system_health === 'critical') {
      newAlerts.push({
        id: 'critical-health',
        type: 'error',
        title: 'Sistema em Estado Crítico',
        message: 'O sistema está operando em condições críticas. Ação imediata necessária.',
        timestamp: new Date()
      });
    }

    // Performance warnings
    if (metrics.performance_score < 70) {
      newAlerts.push({
        id: 'low-performance',
        type: 'warning',
        title: 'Performance Baixa',
        message: `Score de performance em ${metrics.performance_score}%. Considere otimizar o sistema.`,
        timestamp: new Date()
      });
    }

    // Memory warnings
    if (metrics.memory_usage > 80) {
      newAlerts.push({
        id: 'high-memory',
        type: 'warning',
        title: 'Uso Alto de Memória',
        message: `Memória em ${metrics.memory_usage}%. Limpeza recomendada.`,
        timestamp: new Date()
      });
    }

    // API response time
    if (metrics.api_response_time > 300) {
      newAlerts.push({
        id: 'slow-api',
        type: 'warning',
        title: 'API Lenta',
        message: `Tempo de resposta da API em ${metrics.api_response_time}ms. Otimização necessária.`,
        timestamp: new Date()
      });
    }

    // Cache hit rate
    if (metrics.cache_hit_rate < 70) {
      newAlerts.push({
        id: 'low-cache',
        type: 'info',
        title: 'Taxa de Cache Baixa',
        message: `Taxa de acerto do cache em ${metrics.cache_hit_rate}%. Considere ajustar configurações.`,
        timestamp: new Date()
      });
    }

    // Recommendations
    if (recommendations.cache_optimization) {
      newAlerts.push({
        id: 'rec-cache',
        type: 'info',
        title: 'Otimização de Cache Recomendada',
        message: 'O sistema recomenda otimizar as configurações de cache.',
        timestamp: new Date()
      });
    }

    if (recommendations.memory_cleanup) {
      newAlerts.push({
        id: 'rec-memory',
        type: 'warning',
        title: 'Limpeza de Memória Recomendada',
        message: 'Uso de memória elevado. Limpeza recomendada.',
        timestamp: new Date()
      });
    }

    // Update alerts, keeping dismissed ones
    setAlerts(prev => {
      const dismissedIds = prev.filter(a => a.dismissed).map(a => a.id);
      const updatedAlerts = newAlerts.filter(a => !dismissedIds.includes(a.id));
      const existingDismissed = prev.filter(a => a.dismissed);
      return [...updatedAlerts, ...existingDismissed];
    });
  }, [metrics, recommendations]);

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  };

  const handleDismissAll = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, dismissed: true })));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      case 'info':
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Alertas do Sistema</CardTitle>
              <CardDescription>
                {activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''} ativo{activeAlerts.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
          {activeAlerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDismissAll}>
              Dispensar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">Nenhum Alerta Ativo</p>
              <p className="text-sm text-muted-foreground">
                Sistema operando normalmente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.title}</p>
                          <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(alert.timestamp, "PPp", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
