import React, { useMemo, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface QualityPerformanceWidgetProps {
  className?: string;
}

const QualityPerformanceWidgetComponent: React.FC<QualityPerformanceWidgetProps> = ({
  className 
}) => {
  // Mock data with performance calculations
  const qualityMetrics: QualityMetric[] = useMemo(() => [
    {
      id: 'resolution-rate',
      name: 'Taxa de Resolução',
      value: 87.5,
      target: 85,
      unit: '%',
      trend: 2.3,
      status: 'excellent'
    },
    {
      id: 'avg-resolution-time',
      name: 'Tempo Médio Resolução',
      value: 5.2,
      target: 7,
      unit: 'dias',
      trend: -0.8,
      status: 'good'
    },
    {
      id: 'customer-satisfaction',
      name: 'Satisfação Cliente',
      value: 4.3,
      target: 4.0,
      unit: '/5',
      trend: 0.2,
      status: 'good'
    },
    {
      id: 'first-pass-yield',
      name: 'First Pass Yield',
      value: 92.1,
      target: 95,
      unit: '%',
      trend: -1.2,
      status: 'warning'
    },
    {
      id: 'defect-rate',
      name: 'Taxa de Defeitos',
      value: 2.1,
      target: 1.5,
      unit: '%',
      trend: 0.3,
      status: 'warning'
    },
    {
      id: 'cost-of-quality',
      name: 'Custo da Qualidade',
      value: 3.8,
      target: 3.0,
      unit: '% receita',
      trend: 0.2,
      status: 'critical'
    }
  ], []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  }, []);

  const getProgressValue = useCallback((metric: QualityMetric) => {
    if (metric.id === 'defect-rate' || metric.id === 'cost-of-quality' || metric.id === 'avg-resolution-time') {
      // Para métricas onde menor é melhor
      return Math.max(0, Math.min(100, ((metric.target / metric.value) * 100)));
    }
    // Para métricas onde maior é melhor
    return Math.max(0, Math.min(100, (metric.value / metric.target) * 100));
  }, []);

  const overallScore = useMemo(() => {
    const scores = qualityMetrics.map(getProgressValue);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [qualityMetrics]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Performance Score */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Geral da Qualidade</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{overallScore}%</span>
              {overallScore >= 90 ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : overallScore >= 70 ? (
                <Target className="h-6 w-6 text-warning" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallScore} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {overallScore >= 90 ? 'Excelente performance' : 
             overallScore >= 70 ? 'Performance satisfatória' : 
             'Performance precisa melhorar'}
          </p>
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qualityMetrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="truncate">{metric.name}</span>
                <div className={`${getStatusColor(metric.status)}`}>
                  {getStatusIcon(metric.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </span>
                <div className="flex items-center space-x-1">
                  {metric.trend > 0 ? (
                    <TrendingUp className={`h-3 w-3 ${
                      metric.id === 'defect-rate' || metric.id === 'cost-of-quality' || metric.id === 'avg-resolution-time'
                        ? 'text-destructive' : 'text-success'
                    }`} />
                  ) : (
                    <TrendingDown className={`h-3 w-3 ${
                      metric.id === 'defect-rate' || metric.id === 'cost-of-quality' || metric.id === 'avg-resolution-time'
                        ? 'text-success' : 'text-destructive'
                    }`} />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {Math.abs(metric.trend)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Meta: {metric.target}{metric.unit}</span>
                  <Badge 
                    variant={metric.status === 'excellent' || metric.status === 'good' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.status === 'excellent' ? '🎯 Excelente' :
                     metric.status === 'good' ? '✅ Bom' :
                     metric.status === 'warning' ? '⚠️ Atenção' : '🔴 Crítico'}
                  </Badge>
                </div>
                <Progress 
                  value={getProgressValue(metric)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Ações Recomendadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {qualityMetrics
              .filter(m => m.status === 'warning' || m.status === 'critical')
              .map(metric => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{metric.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {metric.status === 'critical' ? 
                        'Requer ação imediata para corrigir desvio crítico' :
                        'Monitorar tendência e implementar melhorias'
                      }
                    </p>
                  </div>
                  <Badge variant={metric.status === 'critical' ? 'destructive' : 'secondary'}>
                    {metric.status === 'critical' ? 'Urgente' : 'Atenção'}
                  </Badge>
                </div>
              ))
            }
            {qualityMetrics.filter(m => m.status === 'warning' || m.status === 'critical').length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Todos os indicadores estão em níveis satisfatórios</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export memoized component
export const QualityPerformanceWidget = memo(QualityPerformanceWidgetComponent);
export default QualityPerformanceWidget;