import { Building2, CheckCircle2, XCircle, Crown, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchWithManager } from "@/services/branches";

interface BranchStatsCardsProps {
  branches: BranchWithManager[];
  isLoading: boolean;
}

export function BranchStatsCards({ branches, isLoading }: BranchStatsCardsProps) {
  const totalBranches = branches.length;
  const headquartersCount = branches.filter((b) => b.is_headquarters).length;
  const linkedBranches = branches.filter((b) => !b.is_headquarters && b.parent_branch_id).length;
  const independentBranches = branches.filter((b) => !b.is_headquarters && !b.parent_branch_id).length;
  const inactiveBranches = branches.filter((b) => b.status === "Inativa").length;

  const stats = [
    {
      title: "Total de Unidades",
      value: totalBranches,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Matrizes",
      value: headquartersCount,
      icon: Crown,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Filiais Vinculadas",
      value: linkedBranches,
      icon: GitBranch,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Filiais Independentes",
      value: independentBranches,
      icon: Building2,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Inativas",
      value: inactiveBranches,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
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
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
              <div className="text-2xl font-bold">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
