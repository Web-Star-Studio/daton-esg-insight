import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  Calendar,
  FileCheck,
  BarChart3,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLicenseAIStats, getCriticalAlerts, getUpcomingConditions } from "@/services/licenseAI";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ComplianceMetric {
  label: string;
  value: number;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

export function ComplianceDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['license-ai-stats'],
    queryFn: getLicenseAIStats,
  });

  const { data: criticalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['critical-alerts'],
    queryFn: getCriticalAlerts,
  });

  const { data: upcomingConditions, isLoading: conditionsLoading } = useQuery({
    queryKey: ['upcoming-conditions'],
    queryFn: () => getUpcomingConditions(30),
  });

  if (statsLoading || alertsLoading || conditionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics: ComplianceMetric[] = [
    {
      label: "Score de Compliance",
      value: stats?.complianceScore || 0,
      target: 95,
      trend: 'up',
      icon: <Target className="h-4 w-4" />,
      color: stats?.complianceScore >= 90 ? "text-success" : stats?.complianceScore >= 70 ? "text-warning" : "text-destructive"
    },
    {
      label: "Confiança da IA",
      value: Math.round((stats?.avgConfidenceScore || 0) * 100),
      target: 85,
      trend: 'up',
      icon: <Zap className="h-4 w-4" />,
      color: "text-primary"
    },
    {
      label: "Alertas Críticos",
      value: stats?.criticalAlerts || 0,
      trend: stats?.criticalAlerts > 0 ? 'up' : 'stable',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-destructive"
    },
    {
      label: "Condicionantes Pendentes",
      value: stats?.pendingConditions || 0,
      trend: 'down',
      icon: <Clock className="h-4 w-4" />,
      color: "text-warning"
    }
  ];

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { level: "Excelente", color: "text-success" };
    if (score >= 80) return { level: "Bom", color: "text-primary" };
    if (score >= 70) return { level: "Regular", color: "text-warning" };
    return { level: "Crítico", color: "text-destructive" };
  };

  const complianceLevel = getComplianceLevel(stats?.complianceScore || 0);

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <div className={metric.color}>
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                  {metric.label.includes("Score") || metric.label.includes("Confiança") ? "%" : ""}
                </div>
                {metric.trend && (
                  <div className="flex items-center">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
              {metric.target && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>{metric.value}% de {metric.target}%</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score de Compliance Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise de Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Nível de Compliance: 
                  <span className={`ml-2 ${complianceLevel.color}`}>
                    {complianceLevel.level}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Score baseado em {stats?.totalAnalyzed || 0} análises de IA
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${complianceLevel.color}`}>
                  {stats?.complianceScore || 0}%
                </div>
              </div>
            </div>
            
            <Progress 
              value={stats?.complianceScore || 0} 
              className="h-3"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalAnalyzed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Licenças Analisadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {stats?.totalConditions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Condicionantes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {stats?.totalAlerts || 0}
                </div>
                <div className="text-sm text-muted-foreground">Alertas Ativos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Críticos */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.slice(0, 5).map((alert, index) => (
                <Alert key={index} className="border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{alert.title}</strong>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>
                      {alert.due_date && (
                        <Badge variant="destructive" className="ml-2">
                          {format(new Date(alert.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condicionantes Vencendo */}
      {upcomingConditions && upcomingConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Condicionantes Vencendo (próximos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingConditions.slice(0, 5).map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-warning" />
                    <div>
                      <p className="font-medium text-sm">
                        {condition.condition_text.substring(0, 80)}...
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
                  </div>
                  {condition.due_date && (
                    <Badge variant="outline">
                      {format(new Date(condition.due_date), "dd/MM", { locale: ptBR })}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}