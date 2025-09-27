import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export function StatsCard({ title, value, description, icon: Icon, color, trend }: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    
    switch (trend.direction) {
      case 'up':
        return "text-green-600";
      case 'down':
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceStatsCardsProps {
  stats: Array<StatsCardProps>;
}

export function PerformanceStatsCards({ stats }: PerformanceStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}

export function PerformanceDistributionCard() {
  const distributions = [
    { range: "5.0 - 4.5", percentage: 30, color: "bg-green-500" },
    { range: "4.4 - 4.0", percentage: 45, color: "bg-blue-500" },
    { range: "3.9 - 3.5", percentage: 20, color: "bg-yellow-500" },
    { range: "< 3.5", percentage: 5, color: "bg-red-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Notas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição das avaliações por faixa de nota
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distributions.map((item) => (
            <div key={item.range} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium">{item.range}</div>
              <div className="flex-1 relative">
                <Progress value={item.percentage} className="h-2" />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-12 text-sm text-muted-foreground">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsProgressCard() {
  const departments = [
    { name: "Vendas", progress: 85, color: "bg-green-500" },
    { name: "Marketing", progress: 72, color: "bg-blue-500" },
    { name: "TI", progress: 68, color: "bg-yellow-500" },
    { name: "RH", progress: 90, color: "bg-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso das Metas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhamento das metas por departamento
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.map((dept) => (
            <div key={dept.name} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium">{dept.name}</div>
              <div className="flex-1 relative">
                <Progress value={dept.progress} className="h-2" />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${dept.color}`}
                  style={{ width: `${dept.progress}%` }}
                />
              </div>
              <div className="w-12 text-sm text-muted-foreground">{dept.progress}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}