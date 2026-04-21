import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface Props {
  totals:
    | {
        evaluations: number;
        conforme: number;
        planoAcao: number;
        na: number;
        pending: number;
        outros: number;
      }
    | undefined;
  isLoading: boolean;
}

const SLICE_COLORS = {
  conforme: "hsl(151, 75%, 40%)",
  plano_acao: "hsl(0, 75%, 55%)",
  pending: "hsl(38, 92%, 55%)",
  na: "hsl(220, 10%, 70%)",
  outros: "hsl(220, 15%, 50%)",
};

const numberFmt = new Intl.NumberFormat("pt-BR");
const pctFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const ComplianceStatusDonut: React.FC<Props> = ({ totals, isLoading }) => {
  const data = useMemo(() => {
    if (!totals) return [];
    const total = totals.evaluations || 1;
    const raw = [
      { key: "conforme", name: "Conforme", value: totals.conforme, color: SLICE_COLORS.conforme },
      { key: "plano_acao", name: "Plano de ação", value: totals.planoAcao, color: SLICE_COLORS.plano_acao },
      { key: "pending", name: "Pendente", value: totals.pending, color: SLICE_COLORS.pending },
      { key: "na", name: "Não aplicável", value: totals.na, color: SLICE_COLORS.na },
      { key: "outros", name: "Outros", value: totals.outros, color: SLICE_COLORS.outros },
    ];
    return raw
      .filter(r => r.value > 0)
      .map(r => ({ ...r, pct: (r.value / total) * 100 }));
  }, [totals]);

  const totalEvaluations = totals?.evaluations || 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-primary" />
          Distribuição de status
        </CardTitle>
        <CardDescription>
          Todas as avaliações por unidade, agrupadas por classificação
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
            <PieChartIcon className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Sem avaliações para exibir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {data.map(entry => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, _name, item) => [
                      `${numberFmt.format(val)} (${pctFmt.format(item.payload.pct)}%)`,
                      item.payload.name,
                    ]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold tabular-nums">{numberFmt.format(totalEvaluations)}</span>
                <span className="text-xs text-muted-foreground">avaliações</span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {data.map(entry => (
                <li key={entry.key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {numberFmt.format(entry.value)}{" "}
                    <span className="opacity-70">({pctFmt.format(entry.pct)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
