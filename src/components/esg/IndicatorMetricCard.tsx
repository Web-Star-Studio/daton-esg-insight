import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Info, Target, BarChart3 } from "lucide-react";
import { ESGIndicator } from "@/services/esgRecommendedIndicators";

interface IndicatorMetricCardProps {
  indicator: ESGIndicator;
}

export function IndicatorMetricCard({ indicator }: IndicatorMetricCardProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'N/A';
    }
  };

  const isBelowBenchmark = indicator.benchmark && indicator.value < indicator.benchmark;
  const isAboveTarget = indicator.target && indicator.value >= indicator.target;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {indicator.name}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-xs">Fórmula:</p>
                        <p className="text-xs text-muted-foreground">{indicator.formula}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-xs">Fontes:</p>
                        <p className="text-xs text-muted-foreground">{indicator.sources.join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-xs">Código:</p>
                        <p className="text-xs text-muted-foreground">{indicator.code}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{indicator.subcategory}</p>
          </div>
          <Badge variant="outline" className={getQualityColor(indicator.dataQuality)}>
            {getQualityLabel(indicator.dataQuality)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {indicator.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-muted-foreground">{indicator.unit}</span>
            {indicator.trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${indicator.trend > 0 ? 'text-green-600' : indicator.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {indicator.trend > 0 ? <TrendingUp className="h-3 w-3" /> : indicator.trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                {Math.abs(indicator.trend)}%
              </div>
            )}
          </div>

          {/* Benchmarks and Targets */}
          <div className="space-y-2">
            {indicator.benchmark !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  <span>Benchmark:</span>
                </div>
                <span className={`font-medium ${isBelowBenchmark ? 'text-orange-600' : 'text-green-600'}`}>
                  {indicator.benchmark} {indicator.unit}
                </span>
              </div>
            )}

            {indicator.target !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>Meta:</span>
                </div>
                <span className={`font-medium ${isAboveTarget ? 'text-green-600' : 'text-blue-600'}`}>
                  {indicator.target} {indicator.unit}
                </span>
              </div>
            )}
          </div>

          {/* Metadata Alert */}
          {indicator.metadata?.note && (
            <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground italic">
              {indicator.metadata.note}
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Atualizado: {new Date(indicator.lastUpdated).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
