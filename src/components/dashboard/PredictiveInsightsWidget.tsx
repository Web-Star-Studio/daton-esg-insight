import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { getFullAnalysis, FullAnalysis } from '@/services/predictiveAnalytics';
import { cn } from '@/lib/utils';

export function PredictiveInsightsWidget() {
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getFullAnalysis(3);
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching predictive analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const { predictions, risk } = analysis;

  const getTrendIcon = () => {
    switch (predictions.trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <Activity className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Análise Preditiva & Score de Risco</h3>
      </div>

      <div className="space-y-6">
        {/* Emission Predictions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Previsão de Emissões (3 meses)</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-semibold",
                predictions.trend === 'increasing' ? 'text-red-600' : 
                predictions.trend === 'decreasing' ? 'text-green-600' : 
                'text-gray-600'
              )}>
                {predictions.trend === 'increasing' ? '+' : predictions.trend === 'decreasing' ? '-' : ''}
                {Math.abs(predictions.trend_percentage)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {predictions.predictions.map((pred, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">{pred.date}</p>
                <p className="text-sm font-semibold">{pred.predicted_value.toFixed(2)} tCO2e</p>
                <p className="text-xs text-muted-foreground">
                  ±{((pred.confidence_interval.upper - pred.confidence_interval.lower) / 2).toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Acurácia da previsão</span>
            <Badge variant="outline">{predictions.forecast_accuracy}%</Badge>
          </div>

          {predictions.anomalies.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-xs font-medium text-yellow-800 mb-1">
                ⚠️ {predictions.anomalies.length} anomalia(s) detectada(s)
              </p>
              <p className="text-xs text-yellow-700">
                Valores fora do padrão esperado identificados nos últimos meses
              </p>
            </div>
          )}
        </div>

        {/* Compliance Risk Score */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Score de Risco de Conformidade</h4>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border-2",
              getRiskColor(risk.risk_level)
            )}>
              {getRiskIcon(risk.risk_level)}
              <span className="text-sm font-semibold capitalize">{risk.risk_level}</span>
            </div>
          </div>

          <div className="text-center py-4">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - risk.overall_score / 100)}`}
                  className={cn(
                    "transition-all duration-1000",
                    risk.risk_level === 'critical' || risk.risk_level === 'high' ? 'text-red-600' :
                    risk.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  )}
                />
              </svg>
              <div className="absolute">
                <p className="text-3xl font-bold">{risk.overall_score}</p>
                <p className="text-xs text-muted-foreground">de 100</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Licenças</p>
              <p className="text-sm font-semibold">{risk.factors.expiring_licenses}/100</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Tarefas</p>
              <p className="text-sm font-semibold">{risk.factors.overdue_tasks}/100</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Metas</p>
              <p className="text-sm font-semibold">{risk.factors.goals_at_risk}/100</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Emissões</p>
              <p className="text-sm font-semibold">{risk.factors.emission_trends}/100</p>
            </div>
          </div>

          {risk.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Recomendações prioritárias:</p>
              <ul className="space-y-1">
                {risk.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}