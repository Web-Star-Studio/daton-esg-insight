import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Activity, RefreshCw, FileCheck, ListTodo, Target, Cloud } from 'lucide-react';
import { getFullAnalysis, FullAnalysis } from '@/services/predictiveAnalytics';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

export function PredictiveInsightsWidget() {
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 [Widget] Fetching predictive analysis...');
      const data = await getFullAnalysis(3);
      setAnalysis(data);
      console.log('✅ [Widget] Analysis loaded successfully');
    } catch (error: any) {
      console.error('❌ [Widget] Error:', error);
      logger.error('Error fetching predictive analysis', error);
      setError(error?.message || 'Erro ao carregar análise preditiva');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-semibold">Análise Preditiva & Score de Risco</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isInsufficientData = error.includes('insuficientes') || error.includes('pelo menos');
    const isAuthError = error.includes('login') || error.includes('Sessão') || error.includes('autorizado');
    
    return (
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-semibold">Análise Preditiva & Score de Risco</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 py-2">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
              isInsufficientData ? "bg-blue-100" : "bg-yellow-100"
            )}>
              {isInsufficientData ? (
                <Activity className="h-7 w-7 text-blue-600" />
              ) : (
                <AlertTriangle className="h-7 w-7 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {isInsufficientData 
                  ? 'Dados insuficientes para análise' 
                  : isAuthError
                  ? 'Erro de autenticação'
                  : 'Não foi possível carregar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {error}
              </p>
            </div>
            {!isAuthError && (
              <Button 
                onClick={fetchAnalysis} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="flex-shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
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
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Activity className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const factorItems = [
    { key: 'licenses', label: 'Licenças', value: risk.factors.expiring_licenses, icon: FileCheck, color: 'text-blue-600 bg-blue-50' },
    { key: 'tasks', label: 'Tarefas', value: risk.factors.overdue_tasks, icon: ListTodo, color: 'text-purple-600 bg-purple-50' },
    { key: 'goals', label: 'Metas', value: risk.factors.goals_at_risk, icon: Target, color: 'text-orange-600 bg-orange-50' },
    { key: 'emissions', label: 'Emissões', value: risk.factors.emission_trends, icon: Cloud, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-semibold">Análise Preditiva & Score de Risco</CardTitle>
          </div>
          <Badge variant="outline" className={cn("gap-1.5 border", getRiskColor(risk.risk_level))}>
            {getRiskIcon(risk.risk_level)}
            <span className="capitalize font-medium">{risk.risk_level}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Emission Predictions - Left Side */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Previsão de Emissões</h4>
              {predictions.predictions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {getTrendIcon()}
                  <span className={cn(
                    "text-sm font-semibold",
                    predictions.trend === 'increasing' ? 'text-red-600' : 
                    predictions.trend === 'decreasing' ? 'text-green-600' : 
                    'text-muted-foreground'
                  )}>
                    {predictions.trend === 'increasing' ? '+' : predictions.trend === 'decreasing' ? '-' : ''}
                    {Math.abs(predictions.trend_percentage)}%
                  </span>
                </div>
              )}
            </div>

            {predictions.predictions.length > 0 ? (
              <div className="space-y-2">
                {predictions.predictions.map((pred, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">{pred.date}</p>
                      <p className="text-sm font-semibold text-foreground">{pred.predicted_value.toFixed(2)} tCO2e</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      ±{((pred.confidence_interval.upper - pred.confidence_interval.lower) / 2).toFixed(1)}
                    </Badge>
                  </div>
                ))}
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Acurácia</span>
                  <span className="text-xs font-medium text-foreground">{predictions.forecast_accuracy}%</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Dados insuficientes</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Registre 3+ meses de emissões para previsões
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Score Gauge - Center */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/50"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - risk.overall_score / 100)}`}
                  className={cn("transition-all duration-1000", getScoreColor(risk.risk_level))}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={cn("text-2xl font-bold", getScoreColor(risk.risk_level))}>{risk.overall_score}</p>
                <p className="text-[10px] text-muted-foreground">de 100</p>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-2">Score Geral</p>
          </div>

          {/* Risk Factors - Right Side */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Fatores de Risco</h4>
            
            <div className="grid grid-cols-2 gap-2">
              {factorItems.map((factor) => {
                const Icon = factor.icon;
                return (
                  <div key={factor.key} className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center", factor.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-muted-foreground">{factor.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={factor.value} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold text-foreground w-8 text-right">{factor.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {risk.recommendations.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-medium text-foreground mb-1.5">Recomendações:</p>
                <ul className="space-y-1">
                  {risk.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="line-clamp-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
