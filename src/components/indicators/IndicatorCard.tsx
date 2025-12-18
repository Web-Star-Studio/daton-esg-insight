import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  ChevronRight,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { ExtendedQualityIndicator, IndicatorPeriodData } from "@/services/indicatorManagement";
import { cn } from "@/lib/utils";

interface IndicatorCardProps {
  indicator: ExtendedQualityIndicator;
  onSelect?: (indicator: ExtendedQualityIndicator) => void;
}

const MONTH_LABELS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function IndicatorCard({ indicator, onSelect }: IndicatorCardProps) {
  // Get current month's data
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = indicator.period_data?.find(pd => pd.period_month === currentMonth);
  
  // Get active target
  const activeTarget = indicator.indicator_targets?.find(t => t.is_active);
  
  // Calculate current value and status
  const currentValue = currentMonthData?.measured_value;
  const targetValue = activeTarget?.target_value;
  const status = currentMonthData?.status || 'pending';

  // Direction icon
  const DirectionIcon = indicator.direction === 'higher_better' 
    ? TrendingUp 
    : indicator.direction === 'lower_better' 
      ? TrendingDown 
      : Minus;

  // Status colors and labels
  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    on_target: { color: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/20', label: 'No Alvo' },
    warning: { color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/20', label: 'Atenção' },
    critical: { color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20', label: 'Crítico' },
    pending: { color: 'text-muted-foreground', bgColor: 'bg-muted border-muted', label: 'Pendente' },
    not_applicable: { color: 'text-muted-foreground', bgColor: 'bg-muted border-muted', label: 'N/A' }
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  // Mini chart data (last 12 months)
  const chartData = MONTH_LABELS.map((_, idx) => {
    const monthData = indicator.period_data?.find(pd => pd.period_month === idx + 1);
    return {
      month: idx + 1,
      value: monthData?.measured_value,
      status: monthData?.status || 'pending'
    };
  });

  const getCellColor = (status: string) => {
    switch (status) {
      case 'on_target': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return '-';
    if (indicator.measurement_unit === '%') {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group border",
        currentStatus.bgColor
      )}
      onClick={() => onSelect?.(indicator)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {indicator.icon && (
                <span className="text-lg">{indicator.icon}</span>
              )}
              <h3 className="font-semibold text-sm truncate">
                {indicator.code && (
                  <span className="text-muted-foreground mr-1">{indicator.code}</span>
                )}
                {indicator.name}
              </h3>
            </div>
            {indicator.location && (
              <p className="text-xs text-muted-foreground mt-1">{indicator.location}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <DirectionIcon className={cn("h-4 w-4", currentStatus.color)} />
              </TooltipTrigger>
              <TooltipContent>
                {indicator.direction === 'higher_better' ? 'Maior melhor' : 
                 indicator.direction === 'lower_better' ? 'Menor melhor' : 'Meta fixa'}
              </TooltipContent>
            </Tooltip>
            <Badge variant="outline" className={cn("text-xs", currentStatus.color)}>
              {currentStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Values */}
        <div className="flex items-baseline gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Atual</p>
            <p className={cn("text-xl font-bold", currentStatus.color)}>
              {formatValue(currentValue)}
            </p>
          </div>
          {targetValue !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Meta
              </p>
              <p className="text-sm font-medium">
                {formatValue(targetValue)}
              </p>
            </div>
          )}
          {currentMonthData?.deviation_percentage !== undefined && currentMonthData.deviation_percentage !== 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Desvio</p>
              <p className={cn(
                "text-sm font-medium",
                currentMonthData.deviation_percentage > 0 
                  ? indicator.direction === 'higher_better' ? 'text-emerald-600' : 'text-destructive'
                  : indicator.direction === 'lower_better' ? 'text-emerald-600' : 'text-destructive'
              )}>
                {currentMonthData.deviation_percentage > 0 ? '+' : ''}
                {currentMonthData.deviation_percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Mini sparkline */}
        <div className="flex gap-1 mb-3">
          {chartData.map((data, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex-1 h-6 rounded-sm transition-all",
                    getCellColor(data.status),
                    idx === currentMonth - 1 && "ring-2 ring-primary ring-offset-1"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{MONTH_LABELS[idx]}</p>
                <p>{data.value !== undefined ? formatValue(data.value) : 'Sem dados'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {indicator.indicator_group?.name && (
              <Badge variant="secondary" className="text-xs">
                {indicator.indicator_group.name}
              </Badge>
            )}
            <span>{indicator.frequency === 'monthly' ? 'Mensal' : indicator.frequency}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Detalhes
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Action plan warning */}
        {currentMonthData?.needs_action_plan && !currentMonthData.action_plan_id && (
          <div className="mt-2 p-2 bg-amber-500/10 rounded-md flex items-center gap-2 text-amber-600 text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>Plano de ação necessário</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
