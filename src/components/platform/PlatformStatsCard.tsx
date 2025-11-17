import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformStatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'stable';
  };
  icon: LucideIcon;
  className?: string;
}

export function PlatformStatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  className 
}: PlatformStatsCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <div className="flex items-center gap-1 text-sm">
              {change.trend === 'up' && (
                <span className="text-green-600">↑ {change.value}%</span>
              )}
              {change.trend === 'down' && (
                <span className="text-red-600">↓ {change.value}%</span>
              )}
              {change.trend === 'stable' && (
                <span className="text-muted-foreground">→ {change.value}%</span>
              )}
              <span className="text-muted-foreground">vs. período anterior</span>
            </div>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
