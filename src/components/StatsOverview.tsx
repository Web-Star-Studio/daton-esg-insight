import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database,
  TrendingUp, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  HardDrive,
  Zap
} from "lucide-react";

interface StatsOverviewProps {
  totalRecords: number;
  totalSections: number;
  activeSections: number;
  isLoading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalRecords,
  totalSections,
  activeSections,
  isLoading
}) => {
  const completionPercentage = totalSections > 0 ? (activeSections / totalSections) * 100 : 0;
  const systemHealth = activeSections > (totalSections * 0.7) ? 'excellent' : 
                      activeSections > (totalSections * 0.5) ? 'good' : 'needs-attention';

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'excellent': return 'hsl(var(--success))';
      case 'good': return 'hsl(var(--warning))';
      default: return 'hsl(var(--destructive))';
    }
  };

  const getHealthLabel = () => {
    switch (systemHealth) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      default: return 'Atenção';
    }
  };

  const stats = [
    {
      title: "Total de Registros",
      value: totalRecords.toLocaleString(),
      description: "Dados no sistema",
      icon: Database,
      color: "hsl(var(--primary))",
      trend: "+12%"
    },
    {
      title: "Seções Ativas",
      value: `${activeSections}/${totalSections}`,
      description: "Módulos com dados",
      icon: CheckCircle,
      color: "hsl(var(--success))",
      progress: completionPercentage
    },
    {
      title: "Status do Sistema",
      value: getHealthLabel(),
      description: "Saúde geral dos dados",
      icon: systemHealth === 'excellent' ? CheckCircle : 
            systemHealth === 'good' ? AlertTriangle : AlertTriangle,
      color: getHealthColor(),
      badge: true
    },
    {
      title: "Última Sincronização",
      value: "Agora",
      description: "Dados atualizados",
      icon: Activity,
      color: "hsl(220, 71%, 60%)",
      pulse: true
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="relative">
                <Icon 
                  className={`h-4 w-4 ${stat.pulse ? 'animate-pulse' : ''}`}
                  style={{ color: stat.color }}
                />
                {stat.pulse && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: `${stat.color}20` }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {stat.value}
                    {stat.badge && (
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${stat.color}15`,
                          color: stat.color,
                          borderColor: `${stat.color}30`
                        }}
                      >
                        {stat.value}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                {stat.trend && (
                  <div className="text-right">
                    <div className="text-xs font-medium text-success flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </div>
                    <div className="text-xs text-muted-foreground">vs. mês anterior</div>
                  </div>
                )}
              </div>
              
              {stat.progress !== undefined && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Completude</span>
                    <span className="font-medium">{Math.round(stat.progress)}%</span>
                  </div>
                  <Progress 
                    value={stat.progress} 
                    className="h-2"
                    style={{
                      '--progress-foreground': stat.color
                    } as React.CSSProperties}
                  />
                </div>
              )}
            </CardContent>
            
            {/* Accent line */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: stat.color }}
            />
          </Card>
        );
      })}
    </div>
  );
};