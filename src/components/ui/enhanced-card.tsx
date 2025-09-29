import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  value?: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'premium' | 'stat';
  loading?: boolean;
  hoverable?: boolean;
}

export function EnhancedCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  value,
  change,
  changeType = 'neutral',
  trend,
  actions,
  variant = 'default',
  loading = false,
  hoverable = true,
  className,
  children,
  ...props
}: EnhancedCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const cardVariants = {
    default: "shadow-sm hover:shadow-lg",
    minimal: "border border-border/20 bg-background/50",
    premium: "shadow-md hover:shadow-xl bg-gradient-to-br from-background to-muted/20",
    stat: "border-0 shadow-sm hover:shadow-md bg-card"
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", cardVariants[variant], className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-muted loading-shimmer" />
            <div className="w-6 h-6 rounded bg-muted loading-shimmer" />
          </div>
          <div className="w-24 h-4 rounded bg-muted loading-shimmer" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="w-20 h-8 rounded bg-muted loading-shimmer mb-2" />
          <div className="w-32 h-3 rounded bg-muted loading-shimmer" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-300",
        hoverable && "card-hover cursor-pointer",
        cardVariants[variant],
        className
      )} 
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
          )}
          
          {actions || (
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        
        {title && (
          <CardTitle className="text-sm font-medium text-muted-foreground mt-3">
            {title}
          </CardTitle>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {children || (
          <div className="space-y-2">
            {value && (
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {value}
                </span>
                
                {(change !== undefined || trend) && (
                  <div className={cn("flex items-center gap-1", getChangeColor())}>
                    {trend}
                    {change !== undefined && (
                      <span className="text-sm font-medium">
                        {change > 0 ? '+' : ''}{change}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}