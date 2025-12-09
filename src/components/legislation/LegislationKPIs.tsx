import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  TrendingUp,
  Bell
} from "lucide-react";
import { useLegislationStats } from "@/hooks/data/useLegislations";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const LegislationKPIs: React.FC = () => {
  const { data: stats, isLoading } = useLegislationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const total = stats?.total || 0;
  const realCount = stats?.byApplicability.real || 0;
  const conformeCount = stats?.byStatus.conforme || 0;
  const adequacaoCount = stats?.byStatus.adequacao || 0;
  const planoAcaoCount = stats?.byStatus.plano_acao || 0;
  const pendingCount = stats?.byApplicability.pending || 0;
  const alertsCount = stats?.alerts || 0;
  
  // Calculate percentages
  const realPercentage = total > 0 ? Math.round((realCount / total) * 100) : 0;
  const conformePercentage = realCount > 0 ? Math.round((conformeCount / realCount) * 100) : 0;
  const pendingPercentage = total > 0 ? Math.round((pendingCount / total) * 100) : 0;

  const kpis = [
    {
      title: "Total",
      value: total,
      subtitle: null,
      icon: Scale,
      color: "text-primary",
      bgColor: "bg-primary/10",
      progress: null,
    },
    {
      title: "Reais",
      value: realCount,
      subtitle: `${realPercentage}% do total`,
      icon: FileText,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      progress: realPercentage,
      progressColor: "bg-pink-500",
    },
    {
      title: "Conformes",
      value: conformeCount,
      subtitle: realCount > 0 ? `${conformePercentage}% das reais` : null,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      progress: conformePercentage,
      progressColor: "bg-green-500",
    },
    {
      title: "Adequação",
      value: adequacaoCount,
      subtitle: realCount > 0 ? `${Math.round((adequacaoCount / realCount) * 100)}% das reais` : null,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      progress: null,
    },
    {
      title: "Plano de Ação",
      value: planoAcaoCount,
      subtitle: realCount > 0 ? `${Math.round((planoAcaoCount / realCount) * 100)}% das reais` : null,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      progress: null,
    },
    {
      title: "Pendentes",
      value: pendingCount,
      subtitle: `${pendingPercentage}% do total`,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      progress: pendingPercentage,
      progressColor: "bg-yellow-500",
    },
    {
      title: "Alertas",
      value: alertsCount,
      subtitle: alertsCount > 0 ? "Requer atenção" : "Nenhum alerta",
      icon: Bell,
      color: alertsCount > 0 ? "text-red-600" : "text-green-600",
      bgColor: alertsCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30",
      progress: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            {kpi.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
            )}
            {kpi.progress !== null && kpi.progress > 0 && (
              <div className="mt-2">
                <Progress 
                  value={kpi.progress} 
                  className="h-1.5"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
