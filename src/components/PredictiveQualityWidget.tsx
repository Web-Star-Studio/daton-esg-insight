import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Brain, Target } from 'lucide-react';
import { enhancedQualityService } from '@/services/enhancedQualityService';

interface PredictiveQualityWidgetProps {
  className?: string;
}

export const PredictiveQualityWidget: React.FC<PredictiveQualityWidgetProps> = ({ className }) => {
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['quality-metrics'],
    queryFn: () => enhancedQualityService.getQualityMetrics(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: predictions, isLoading: isPredictionsLoading } = useQuery({
    queryKey: ['predictive-analysis', metrics],
    queryFn: () => metrics ? enhancedQualityService.getPredictiveAnalysis(metrics) : null,
    enabled: !!metrics,
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const { data: trends } = useQuery({
    queryKey: ['quality-trends'],
    queryFn: () => enhancedQualityService.getQualityTrends('7d'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const isLoading = isMetricsLoading || isPredictionsLoading;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'low': return <Target className="h-4 w-4 text-success" />;
      default: return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || !predictions) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Dados insuficientes para análise preditiva</p>
        </CardContent>
      </Card>
    );
  }

  const trendDirection = trends && trends.length > 1 ? 
    trends[trends.length - 1].qualityScore > trends[0].qualityScore ? 'up' : 'down' : 'stable';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>Análise Preditiva</span>
          {getRiskIcon(predictions.riskLevel)}
        </CardTitle>
        <CardDescription>
          Insights baseados em IA para seu Sistema de Qualidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Top Section - Landscape Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Risk Level */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div className="flex items-center space-x-2">
              {getRiskIcon(predictions.riskLevel)}
              <span className="text-sm font-medium">Nível de Risco</span>
            </div>
            <Badge 
              variant={predictions.riskLevel === 'high' ? 'destructive' : 
                      predictions.riskLevel === 'medium' ? 'default' : 'secondary'}
              className={getRiskColor(predictions.riskLevel)}
            >
              {predictions.riskLevel === 'high' ? 'Alto' : 
               predictions.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
            </Badge>
          </div>

          {/* Next Month Prediction */}
          <div className="p-3 rounded-lg border bg-muted/50 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-foreground">NCs Previstas</span>
              <span className="font-bold text-lg text-foreground">{predictions.nextMonthNCs}</span>
            </div>
            <Progress 
              value={Math.min((predictions.nextMonthNCs / 10) * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">Próximo mês</p>
          </div>

          {/* Quality Score Trend */}
          <div className="p-3 rounded-lg border bg-muted/50 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-foreground">Qualidade</span>
              <div className="flex items-center space-x-1">
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : trendDirection === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-muted-foreground/50" />
                )}
                <span className="font-bold text-lg text-foreground">
                  {metrics.qualityScore}%
                </span>
              </div>
            </div>
            <Progress value={metrics.qualityScore} className="h-2" />
            <p className="text-xs text-muted-foreground">Tendência atual</p>
          </div>
        </div>

        {/* Bottom Section - Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Pattern */}
          {predictions.patterns.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Padrão Detectado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {predictions.patterns[0].description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {predictions.patterns[0].confidence}% confiança
                </Badge>
              </div>
            </div>
          )}

          {/* Top Recommendation */}
          {predictions.recommendations.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary">Recomendação IA</p>
              <p className="text-xs text-muted-foreground mt-1">
                {predictions.recommendations[0].description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-xs">
                  Impacto: {predictions.recommendations[0].impact}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Prioridade: {predictions.recommendations[0].priority}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveQualityWidget;