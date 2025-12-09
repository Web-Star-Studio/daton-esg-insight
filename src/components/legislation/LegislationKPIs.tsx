import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  TrendingUp 
} from "lucide-react";
import { useLegislationStats } from "@/hooks/data/useLegislations";
import { Skeleton } from "@/components/ui/skeleton";

export const LegislationKPIs: React.FC = () => {
  const { data: stats, isLoading } = useLegislationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
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

  const kpis = [
    {
      title: "Total",
      value: stats?.total || 0,
      icon: Scale,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Reais",
      value: stats?.byApplicability.real || 0,
      icon: FileText,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Conformes",
      value: stats?.byStatus.conforme || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Adequação",
      value: stats?.byStatus.adequacao || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Plano de Ação",
      value: stats?.byStatus.plano_acao || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Pendentes",
      value: stats?.byApplicability.pending || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
