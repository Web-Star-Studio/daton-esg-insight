import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Target,
  RefreshCw,
  X,
  Brain,
  Calendar,
  CheckCircle2,
  ArrowUp
} from 'lucide-react';
import { usePredictiveAlerts } from '@/hooks/usePredictiveAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PredictiveAlertsWidget: React.FC = () => {
  const {
    alerts,
    isProcessing,
    refreshPredictions,
    dismissAlert,
    getCriticalAlerts,
    getUpcomingDeadlines,
    stats
  } = usePredictiveAlerts();

  const [selectedTab, setSelectedTab] = useState<'all' | 'critical' | 'deadlines'>('all');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline_risk':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'performance_decline':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'compliance_risk':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'goal_deviation':
        return <Target className="h-4 w-4 text-warning" />;
      default:
        return <Brain className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getDisplayAlerts = () => {
    switch (selectedTab) {
      case 'critical':
        return getCriticalAlerts();
      case 'deadlines':
        return getUpcomingDeadlines();
      default:
        return alerts;
    }
  };

  const formatTimeToEvent = (days: number) => {
    if (days <= 0) return 'Agora';
    if (days === 1) return '1 dia';
    if (days <= 7) return `${days} dias`;
    if (days <= 30) return `${Math.round(days / 7)} semanas`;
    return `${Math.round(days / 30)} meses`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Alertas Preditivos</CardTitle>
            {isProcessing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPredictions}
            disabled={isProcessing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-destructive">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">{stats.deadlines}</div>
            <div className="text-xs text-muted-foreground">Prazos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-success">{Math.round(stats.avgProbability * 100)}%</div>
            <div className="text-xs text-muted-foreground">Confiança</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-3">
          <Button
            variant={selectedTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('all')}
            className="text-xs"
          >
            Todos ({alerts.length})
          </Button>
          <Button
            variant={selectedTab === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('critical')}
            className="text-xs"
          >
            Críticos ({stats.critical})
          </Button>
          <Button
            variant={selectedTab === 'deadlines' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('deadlines')}
            className="text-xs"
          >
            Prazos ({stats.deadlines})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {getDisplayAlerts().length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
              {isProcessing ? (
                <p>Analisando dados para gerar predições...</p>
              ) : (
                <div>
                  <p className="mb-2">Nenhum alerta encontrado</p>
                  <p className="text-xs">Seus sistemas estão funcionando bem!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {getDisplayAlerts().map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.type)}
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                        {alert.severity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

                  {/* Entity Info */}
                  <div className="flex items-center space-x-4 mb-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Entidade:</span>
                      <span className="font-medium">{alert.affectedEntity.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTimeToEvent(alert.daysToEvent)}</span>
                    </div>
                  </div>

                  {/* Probability */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs text-muted-foreground">Probabilidade:</span>
                    <Progress value={alert.probability * 100} className="h-1 flex-1 max-w-20" />
                    <span className="text-xs font-medium flex items-center">
                      {Math.round(alert.probability * 100)}%
                      {alert.probability > 0.7 && <ArrowUp className="h-3 w-3 ml-1 text-warning" />}
                    </span>
                  </div>

                  {/* Impact */}
                  <div className="text-xs text-muted-foreground mb-3">
                    <strong>Impacto:</strong> {alert.predictedImpact}
                  </div>

                  {/* Preventive Actions */}
                  {alert.preventiveActions && alert.preventiveActions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium mb-2">Ações Preventivas:</h5>
                      <div className="space-y-1">
                        {alert.preventiveActions.slice(0, 2).map((action, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{action}</span>
                          </div>
                        ))}
                        {alert.preventiveActions.length > 2 && (
                          <div className="text-xs text-muted-foreground ml-5">
                            +{alert.preventiveActions.length - 2} mais ações...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auto-generated badge */}
                  {alert.autoGenerated && (
                    <div className="flex justify-end mt-3">
                      <Badge variant="outline" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};