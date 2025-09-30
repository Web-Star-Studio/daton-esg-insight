import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricData {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

interface ModuleSummaryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: MetricData[];
  onAccess: () => void;
  className?: string;
}

export function ModuleSummaryCard({
  title,
  description,
  icon: Icon,
  metrics,
  onAccess,
  className
}: ModuleSummaryCardProps) {
  const getMetricColor = (variant: MetricData['variant'] = 'default') => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'destructive':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/20",
        className
      )}
      onClick={onAccess}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <span>{title}</span>
          <Button variant="ghost" size="sm" className="ml-auto">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center p-3 border rounded-lg bg-muted/5">
              <div className={cn("text-xl font-bold", getMetricColor(metric.variant))}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}