import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp } from "lucide-react";
import { IndicatorStats } from "@/services/indicatorManagement";
import { Skeleton } from "@/components/ui/skeleton";

interface IndicatorStatsCardsProps {
  stats?: IndicatorStats;
  isLoading?: boolean;
}

export function IndicatorStatsCards({ stats, isLoading }: IndicatorStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total",
      value: stats?.total || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "No Alvo",
      value: stats?.on_target || 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: "Atenção",
      value: stats?.warning || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Crítico",
      value: stats?.critical || 0,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      label: "Pendente",
      value: stats?.pending || 0,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
