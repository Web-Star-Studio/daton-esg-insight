import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Database,
  ListChecks
} from 'lucide-react';
import { fetchQualityPerformanceData, type QualityMetric } from '@/services/qualityPerformanceService';
import { supabase } from '@/integrations/supabase/client';

interface QualityPerformanceWidgetProps {
  className?: string;
}

export const QualityPerformanceWidget: React.FC<QualityPerformanceWidgetProps> = ({ 
  className 
}) => {
  // Buscar company_id do usuário atual
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Buscar dados de performance
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['quality-performance', profile?.company_id],
    queryFn: () => fetchQualityPerformanceData(profile!.company_id),
    enabled: !!profile?.company_id,
  });

  const qualityMetrics = performanceData?.metrics || [];
  const overallScore = Math.round(performanceData?.overallScore || 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
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
  };

  const getProgressValue = (metric: QualityMetric) => {
    // Determinar se menor é melhor baseado no nome
    const lowerIsBetter = ['tempo', 'custo', 'defeito'].some(term => 
      metric.name.toLowerCase().includes(term)
    );
    
    if (lowerIsBetter) {
      // Para métricas onde menor é melhor
      return Math.max(0, Math.min(100, ((metric.target / metric.value) * 100)));
    }
    // Para métricas onde maior é melhor
    return Math.max(0, Math.min(100, (metric.value / metric.target) * 100));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (qualityMetrics.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-l-4 border-l-muted">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance da Qualidade</span>
              <Database className="h-6 w-6 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Nenhum indicador de qualidade configurado
              </p>
              <p className="text-sm text-muted-foreground">
                Configure indicadores de qualidade e registre medições para visualizar a performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Progress value={overallScore} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Pontuação baseada em {qualityMetrics.length} indicadores ativos
          </p>
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qualityMetrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{metric.name}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </span>
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
            <ListChecks className="h-5 w-5" />
            <span>Ações Recomendadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {qualityMetrics
              .filter(m => m.status === 'warning' || m.status === 'critical')
              .map(metric => (
                <div key={metric.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.status === 'critical' 
                        ? 'Ação imediata necessária - valor crítico' 
                        : 'Requer atenção - abaixo da meta'
                      }
                    </p>
                  </div>
                </div>
              ))}
            {qualityMetrics.filter(m => m.status === 'warning' || m.status === 'critical').length === 0 && (
              <div className="text-center py-4 text-success">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Todos os indicadores estão dentro das metas! 🎉</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
