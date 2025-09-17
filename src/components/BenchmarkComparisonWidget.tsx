import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { useSmartCache } from "@/hooks/useSmartCache";
import { getBenchmarkData } from "@/services/advancedAnalytics";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  Building2,
  Lightbulb
} from "lucide-react";

interface BenchmarkComparisonWidgetProps {
  currentData?: {
    total_emissions: number;
    intensity: number;
    scope1_percentage: number;
    scope2_percentage: number;
  };
  isLoading?: boolean;
}

export function BenchmarkComparisonWidget({ currentData, isLoading }: BenchmarkComparisonWidgetProps) {
  const { data: benchmarkData, isLoading: isBenchmarkLoading } = useSmartCache({
    queryKey: ['benchmark-data'],
    queryFn: () => getBenchmarkData(),
    priority: 'medium',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const loading = isLoading || isBenchmarkLoading;

  const getPerformanceStatus = (value: number, average: number, bestPractice: number) => {
    if (value <= bestPractice * 1.1) return { status: 'Excelente', color: 'success', icon: Award };
    if (value <= average) return { status: 'Acima da Média', color: 'primary', icon: TrendingUp };
    if (value <= average * 1.2) return { status: 'Na Média', color: 'warning', icon: Target };
    return { status: 'Abaixo da Média', color: 'destructive', icon: TrendingDown };
  };

  const calculateProgress = (value: number, average: number, bestPractice: number) => {
    const range = average - bestPractice;
    const position = Math.max(0, Math.min(100, ((average - value) / range) * 100));
    return position;
  };

  return (
    <div className="space-y-6">
      {/* Sector Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Comparação Setorial</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <SmartSkeleton variant="list" className="space-y-3" />
          ) : (
            benchmarkData?.sector_comparison.map((metric, index) => {
              const performance = getPerformanceStatus(
                metric.your_company, 
                metric.sector_average, 
                metric.best_practice
              );
              const IconComponent = performance.icon;
              const progress = calculateProgress(
                metric.your_company, 
                metric.sector_average, 
                metric.best_practice
              );

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <Badge variant={performance.color as any} className="flex items-center space-x-1">
                      <IconComponent className="h-3 w-3" />
                      <span>{performance.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sua empresa: {metric.your_company}</span>
                      <span>Média: {metric.sector_average}</span>
                      <span>Melhor: {metric.best_practice}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Indicadores de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <SmartSkeleton variant="list" className="space-y-4" />
          ) : (
            benchmarkData?.performance_indicators.map((indicator, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray={`${indicator.score * 10}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">{indicator.score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{indicator.name}</h4>
                  <p className="text-sm text-muted-foreground">{indicator.description}</p>
                  <Badge 
                    variant={
                      indicator.score >= 8 ? 'success' : 
                      indicator.score >= 6 ? 'default' : 
                      'destructive'
                    }
                    className="mt-1"
                  >
                    {indicator.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Oportunidades de Melhoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Eficiência Energética</p>
                <p className="text-xs text-muted-foreground">
                  Sua performance está 15% abaixo da média setorial. Considere investir em tecnologias mais eficientes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Energia Renovável</p>
                <p className="text-xs text-muted-foreground">
                  Aumentar o uso de renováveis para 50% poderia melhorar significativamente sua posição.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <Award className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Gestão de Resíduos</p>
                <p className="text-xs text-muted-foreground">
                  Já está acima da média. Mantenha as boas práticas e considere certificações adicionais.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}