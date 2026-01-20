import { Building2, CheckCircle2, XCircle, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchWithManager } from "@/services/branches";

interface BranchStatsCardsProps {
  branches: BranchWithManager[];
  isLoading: boolean;
}

export function BranchStatsCards({ branches, isLoading }: BranchStatsCardsProps) {
  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.status === "Ativa").length;
  const inactiveBranches = branches.filter((b) => b.status === "Inativa").length;
  const headquarters = branches.find((b) => b.is_headquarters);

  const stats = [
    {
      title: "Total de Filiais",
      value: totalBranches,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Filiais Ativas",
      value: activeBranches,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Filiais Inativas",
      value: inactiveBranches,
      icon: XCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Matriz",
      value: headquarters?.name || "Não definida",
      icon: Crown,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      isText: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.isText ? "text-base" : ""}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
