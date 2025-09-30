import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Shield
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCriticalAlerts, getUpcomingConditions, resolveAlert } from "@/services/licenseAI";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useCallback } from "react";

interface AlertPrediction {
  type: 'renewal_urgent' | 'condition_overdue' | 'document_missing' | 'regulatory_change';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  predictedDate: Date;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export function IntelligentAlertsSystem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: criticalAlerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['critical-alerts'],
    queryFn: async () => {
      try {
        return await getCriticalAlerts();
      } catch (error) {
        console.error('Erro ao carregar alertas críticos:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar alertas",
          description: "Não foi possível carregar os alertas críticos. Tente novamente."
        });
        return [];
      }
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: upcomingConditions, isLoading: conditionsLoading, error: conditionsError } = useQuery({
    queryKey: ['upcoming-conditions'],
    queryFn: async () => {
      try {
        return await getUpcomingConditions(60); // 60 dias
      } catch (error) {
        console.error('Erro ao carregar condições próximas:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar condições",
          description: "Não foi possível carregar as condições próximas."
        });
        return [];
      }
    },
    retry: 2,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['critical-alerts'] });
    },
    onError: (error) => {
      console.error('Erro ao resolver alerta:', error);
      toast({
        variant: "destructive",
        title: "Erro ao resolver alerta",
        description: error.message || "Não foi possível resolver o alerta"
      });
    }
  });

  // Gerar predições inteligentes com validação robusta
  const generatePredictions = useCallback((): AlertPrediction[] => {
    if (!upcomingConditions || upcomingConditions.length === 0) {
      return [];
    }

    const predictions: AlertPrediction[] = [];
    
    try {
      // Predições baseadas em condicionantes vencendo
      upcomingConditions.forEach(condition => {
        if (!condition.due_date) return;

        const dueDate = new Date(condition.due_date);
        if (!isValid(dueDate)) return;

        const daysUntilDue = differenceInDays(dueDate, new Date());
        
        if (daysUntilDue <= 7 && daysUntilDue > 0) {
          predictions.push({
            type: 'condition_overdue',
            urgency: daysUntilDue <= 3 ? 'critical' : 'high',
            predictedDate: dueDate,
            probability: Math.max(70, 100 - (daysUntilDue * 5)), // Probabilidade baseada em proximidade
            impact: condition.priority === 'high' ? 'high' : 'medium',
            recommendations: [
              'Priorizar cumprimento desta condicionante',
              'Preparar documentação necessária',
              'Contatar área responsável',
              'Verificar histórico de cumprimento'
            ]
          });
        }
      });
    } catch (error) {
      console.error('Erro ao gerar predições:', error);
    }

    return predictions;
  }, [upcomingConditions]);

  const predictions = useMemo(() => generatePredictions(), [generatePredictions]);

  // Funções memoizadas para melhor performance
  const getAlertIcon = useCallback((type: string) => {
    const iconMap = {
      'renewal': RefreshCw,
      'condition_due': Calendar,
      'compliance_issue': Shield,
      'document_required': FileText,
      'regulatory_change': TrendingUp,
    };
    const IconComponent = iconMap[type as keyof typeof iconMap] || Bell;
    return <IconComponent className="h-4 w-4" />;
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    const colorMap = {
      'critical': 'border-destructive bg-destructive/5 text-destructive',
      'high': 'border-orange-500 bg-orange-50 text-orange-700',
      'medium': 'border-warning bg-warning/5 text-warning',
      'low': 'border-primary bg-primary/5 text-primary',
    };
    return colorMap[severity as keyof typeof colorMap] || 'border-muted bg-muted/5 text-muted-foreground';
  }, []);

  const getUrgencyBadge = useCallback((urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Alto</Badge>;
      case 'medium':
        return <Badge variant="outline">Médio</Badge>;
      case 'low':
        return <Badge variant="secondary">Baixo</Badge>;
      default:
        return null;
    }
  }, []);

  // Estatísticas calculadas dinamicamente
  const stats = useMemo(() => {
    const currentAlerts = criticalAlerts?.length || 0;
    const upcomingIn7Days = upcomingConditions?.filter(c => {
      if (!c.due_date) return false;
      const dueDate = new Date(c.due_date);
      if (!isValid(dueDate)) return false;
      return differenceInDays(dueDate, new Date()) <= 7;
    }).length || 0;

    return {
      currentAlerts,
      upcomingIn7Days,
      predictionsCount: predictions.length,
      resolutionRate: 95 // TODO: Calcular baseado em dados reais
    };
  }, [criticalAlerts, upcomingConditions, predictions]);

  if (alertsLoading || conditionsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sistema de Alertas Inteligentes</h2>
          <p className="text-muted-foreground">Monitoramento preditivo e alertas automatizados</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Resumo de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                 <div className="text-2xl font-bold text-destructive">
                   {stats.currentAlerts}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {stats.currentAlerts > 0 ? 'Requer atenção imediata' : 'Tudo sob controle'}
                 </p>
               </div>
               <AlertTriangle className="h-8 w-8 text-destructive" />
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Vencendo em 7 dias</p>
                 <div className="text-2xl font-bold text-warning">
                   {stats.upcomingIn7Days}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {stats.upcomingIn7Days > 0 ? 'Planeje com antecedência' : 'Sem vencimentos próximos'}
                 </p>
               </div>
               <Clock className="h-8 w-8 text-warning" />
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Predições IA</p>
                 <div className="text-2xl font-bold text-primary">
                   {stats.predictionsCount}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {stats.predictionsCount > 0 ? 'Insights disponíveis' : 'Nenhuma predição'}
                 </p>
               </div>
               <Zap className="h-8 w-8 text-primary" />
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                <div className="text-2xl font-bold text-success">
                  {stats.resolutionRate}%
                </div>
                <p className="text-xs text-muted-foreground">Performance excelente</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos Ativos ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAlerts.map((alert, index) => (
                <Alert key={index} className={getSeverityColor(alert.severity)}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.alert_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          {getUrgencyBadge(alert.severity)}
                          {alert.action_required && (
                            <Badge variant="outline" className="text-xs">
                              Ação Requerida
                            </Badge>
                          )}
                        </div>
                        <AlertDescription>
                          {alert.message}
                        </AlertDescription>
                        {alert.due_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Prazo: {format(new Date(alert.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predições da IA */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Predições Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {prediction.type === 'condition_overdue' && 'Condicionante Vencendo'}
                        {prediction.type === 'renewal_urgent' && 'Renovação Urgente'}
                        {prediction.type === 'document_missing' && 'Documento Faltando'}
                        {prediction.type === 'regulatory_change' && 'Mudança Regulamentária'}
                      </h4>
                      {getUrgencyBadge(prediction.urgency)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Probabilidade</p>
                      <p className="font-bold">{prediction.probability}%</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    Previsão: {format(prediction.predictedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Recomendações:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de Condicionantes */}
      {upcomingConditions && upcomingConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline de Condicionantes (próximos 60 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingConditions
                .filter(c => c.due_date)
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .slice(0, 10)
                .map((condition, index) => {
                  const daysUntilDue = differenceInDays(new Date(condition.due_date!), new Date());
                  const isUrgent = daysUntilDue <= 7;
                  
                  return (
                    <div key={index} className={`flex items-center gap-4 p-3 border rounded-lg ${isUrgent ? 'border-warning bg-warning/5' : ''}`}>
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-warning' : 'bg-primary'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {condition.condition_text.substring(0, 60)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {condition.priority}
                          </Badge>
                          {condition.frequency && (
                            <Badge variant="secondary" className="text-xs">
                              {condition.frequency}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(condition.due_date!), "dd/MM", { locale: ptBR })}
                        </p>
                        <p className={`text-xs ${isUrgent ? 'text-warning' : 'text-muted-foreground'}`}>
                          {daysUntilDue > 0 ? `${daysUntilDue} dias` : 'Vencido'}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}