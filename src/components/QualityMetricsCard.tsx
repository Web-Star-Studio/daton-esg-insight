import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Clock,
  Users
} from 'lucide-react';

interface QualityMetricsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  target?: number;
  unit?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  isLoading?: boolean;
}

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({
  title,
  value,
  icon,
  trend,
  target,
  unit,
  description,
  variant = 'default',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const getVariantIcon = () => {
    switch (variant) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'destructive': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return icon;
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <div className="h-3 w-3 rounded-full bg-muted-foreground/50" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getVariantIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}{unit && unit}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {description || 
             (target ? `Meta: ${target}${unit || ''}` : 
              trend !== undefined ? `${trend > 0 ? '+' : ''}${trend}% vs período anterior` : '')}
          </p>
          {getTrendIcon()}
        </div>

        {target && typeof value === 'number' && (
          <div className="mt-2 space-y-1">
            <Progress 
              value={Math.min((value / target) * 100, 100)} 
              className="h-1"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round((value / target) * 100)}% da meta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};