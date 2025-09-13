import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalProgressDisplayProps {
  progress: number;
  target?: number;
  showTrend?: boolean;
  previousProgress?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GoalProgressDisplay({ 
  progress, 
  target,
  showTrend = false,
  previousProgress,
  size = 'md',
  className 
}: GoalProgressDisplayProps) {
  const getProgressColorClass = (progress: number) => {
    if (progress >= 100) return '[&>div]:bg-success';
    if (progress >= 75) return '[&>div]:bg-info';
    if (progress >= 50) return '[&>div]:bg-warning';
    return '[&>div]:bg-destructive';
  };

  const getTrendIcon = () => {
    if (!showTrend || previousProgress === undefined) return null;
    
    if (progress > previousProgress) return TrendingUp;
    if (progress < previousProgress) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!showTrend || previousProgress === undefined) return 'text-muted-foreground';
    
    if (progress > previousProgress) return 'text-success';
    if (progress < previousProgress) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const progressWidth = size === 'sm' ? 'w-16' : size === 'lg' ? 'w-32' : 'w-20';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  
  const TrendIcon = getTrendIcon();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Progress 
          value={Math.min(progress, 100)} 
          className={cn(progressWidth, getProgressColorClass(progress))}
        />
        <span className={cn("font-medium min-w-[3rem]", textSize)}>
          {Math.round(progress)}%
        </span>
      </div>
      
      {target && (
        <Badge variant="outline" className={cn(textSize, "font-normal")}>
          Meta: {target}
        </Badge>
      )}
      
      {TrendIcon && (
        <div className={cn("flex items-center", getTrendColor())}>
          <TrendIcon className="h-3 w-3" />
          {previousProgress !== undefined && (
            <span className="text-xs ml-1">
              {progress > previousProgress ? '+' : ''}{Math.round(progress - previousProgress)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}