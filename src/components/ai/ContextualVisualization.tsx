// Contextual Visualization - Visualizações automáticas baseadas em dados
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VisualizationData {
  type: 'trend' | 'comparison' | 'distribution' | 'progress';
  title: string;
  data: any;
  insights?: string[];
}

interface ContextualVisualizationProps {
  visualization: VisualizationData;
  className?: string;
}

export function ContextualVisualization({ visualization, className }: ContextualVisualizationProps) {
  
  if (visualization.type === 'trend') {
    return <TrendVisualization data={visualization} className={className} />;
  }
  
  if (visualization.type === 'comparison') {
    return <ComparisonVisualization data={visualization} className={className} />;
  }
  
  return null;
}

function TrendVisualization({ data, className }: { data: VisualizationData; className?: string }) {
  const trend = data.data?.trend || 'stable';
  const value = data.data?.value || 0;
  const change = data.data?.change || 0;
  
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };
  
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };
  
  const Icon = getTrendIcon();
  
  return (
    <Card className={cn("p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{data.title}</h4>
        <Badge variant="outline" className="text-xs">
          Tendência
        </Badge>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center bg-muted", getTrendColor())}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className={cn("text-sm", getTrendColor())}>
            {change > 0 ? '+' : ''}{change}% vs anterior
          </p>
        </div>
      </div>
      
      {data.insights && data.insights.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {data.insights[0]}
          </p>
        </div>
      )}
    </Card>
  );
}

function ComparisonVisualization({ data, className }: { data: VisualizationData; className?: string }) {
  const items = data.data?.items || [];
  
  return (
    <Card className={cn("p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{data.title}</h4>
        <Badge variant="outline" className="text-xs">
          <BarChart3 className="h-3 w-3 mr-1" />
          Comparação
        </Badge>
      </div>
      
      <div className="space-y-2">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${item.percentage || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {data.insights && data.insights.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {data.insights[0]}
          </p>
        </div>
      )}
    </Card>
  );
}
