import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Hourglass,
} from "lucide-react";
import type { ComplianceOverview } from "@/hooks/useBranchComplianceStats";

interface Props {
  data: ComplianceOverview | undefined;
  isLoading: boolean;
}

const formatPct = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v * 100);

const formatNum = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  accent: "neutral" | "good" | "warn" | "bad";
}

const accentMap = {
  neutral: "bg-card",
  good: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/60",
  warn: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/60",
  bad: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/60",
};

const iconAccentMap = {
  neutral: "text-muted-foreground bg-muted",
  good: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50",
  warn: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50",
  bad: "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50",
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, accent }) => (
  <Card className={`border ${accentMap[accent]} transition-colors`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconAccentMap[accent]}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const accentForRate = (rate: number): "good" | "warn" | "bad" => {
  if (rate >= 0.85) return "good";
  if (rate >= 0.6) return "warn";
  return "bad";
};

export const LegislationAnalyticsKPIs: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { totals, globalComplianceRate, branchesAtRisk, evaluatedBranches } = data;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Conformidade global"
        value={`${formatPct(globalComplianceRate)}%`}
        hint={`${formatNum(totals.conforme)} avaliações conformes em ${formatNum(totals.evaluations - totals.na)} aplicáveis`}
        icon={<ShieldCheck className="h-5 w-5" />}
        accent={accentForRate(globalComplianceRate)}
      />
      <KpiCard
        label="Filiais em risco"
        value={`${branchesAtRisk}/${evaluatedBranches}`}
        hint={branchesAtRisk > 0 ? "Mais de 5% das normas em plano de ação" : "Todas dentro do limite saudável"}
        icon={<AlertTriangle className="h-5 w-5" />}
        accent={branchesAtRisk === 0 ? "good" : branchesAtRisk <= 2 ? "warn" : "bad"}
      />
      <KpiCard
        label="Planos de ação ativos"
        value={formatNum(totals.planoAcao)}
        hint="Avaliações marcadas como não conformes"
        icon={<ClipboardList className="h-5 w-5" />}
        accent={totals.planoAcao === 0 ? "good" : totals.planoAcao < 50 ? "warn" : "bad"}
      />
      <KpiCard
        label="Pendentes"
        value={formatNum(totals.pending)}
        hint={totals.pending > 0 ? "Avaliações ainda sem revisão" : "Sem pendências"}
        icon={<Hourglass className="h-5 w-5" />}
        accent={totals.pending === 0 ? "good" : totals.pending < 30 ? "warn" : "bad"}
      />
    </div>
  );
};
