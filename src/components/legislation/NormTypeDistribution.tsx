import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { FileText } from "lucide-react";
import type { NormTypeStats } from "@/hooks/useBranchComplianceStats";

interface Props {
  stats: NormTypeStats[] | undefined;
  isLoading: boolean;
}

const COLORS = {
  conforme: "hsl(151, 75%, 40%)",
  planoAcao: "hsl(0, 75%, 55%)",
  pending: "hsl(38, 92%, 55%)",
  na: "hsl(220, 10%, 70%)",
  outros: "hsl(220, 15%, 50%)",
} as const;

const numberFmt = new Intl.NumberFormat("pt-BR");

interface ChartDatum {
  type: string;
  typeLabel: string;
  legislations: number;
  evaluations: number;
  conforme: number;
  planoAcao: number;
  pending: number;
  na: number;
  outros: number;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: ChartDatum }> }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rows: Array<{ label: string; n: number; color: string }> = [
    { label: "Conforme", n: d.conforme, color: COLORS.conforme },
    { label: "Plano de ação", n: d.planoAcao, color: COLORS.planoAcao },
    { label: "Pendente", n: d.pending, color: COLORS.pending },
    { label: "Não aplicável", n: d.na, color: COLORS.na },
  ];
  if (d.outros > 0) rows.push({ label: "Outros", n: d.outros, color: COLORS.outros });
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-semibold">{d.type}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {numberFmt.format(d.legislations)} legislações · {numberFmt.format(d.evaluations)} avaliações
      </div>
      <div className="space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{numberFmt.format(r.n)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Encurta rótulos longos pra caber no eixo (ex.: "INSTRUÇÃO NORMATIVA CONJUNTA MMA - IBAMA - ICMBIO").
const abbreviate = (type: string): string => {
  if (type.length <= 28) return type;
  return type.slice(0, 25) + "...";
};

export const NormTypeDistribution: React.FC<Props> = ({ stats, isLoading }) => {
  const data = useMemo<ChartDatum[]>(() => {
    if (!stats) return [];
    return stats.map(s => ({
      type: s.type,
      typeLabel: abbreviate(s.type),
      legislations: s.legislations,
      evaluations: s.evaluations,
      conforme: s.conforme,
      planoAcao: s.planoAcao,
      pending: s.pending,
      na: s.na,
      outros: s.outros,
    }));
  }, [stats]);

  const chartHeight = Math.max(240, data.length * 38 + 60);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Onde está concentrado o trabalho
        </CardTitle>
        <CardDescription>
          Os 10 tipos de norma (LEI, PORTARIA, RESOLUÇÃO...) com mais avaliações
          ativas — cada barra mostra o total segmentado pelo status das
          avaliações. Útil pra ver onde focar revisão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Sem dados de tipos para exibir.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                type="category"
                dataKey="typeLabel"
                tick={{ fontSize: 11 }}
                width={180}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="square"
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
              <Bar name="Conforme" dataKey="conforme" stackId="t" fill={COLORS.conforme} radius={[4, 0, 0, 4]} />
              <Bar name="Plano de ação" dataKey="planoAcao" stackId="t" fill={COLORS.planoAcao} />
              <Bar name="Pendente" dataKey="pending" stackId="t" fill={COLORS.pending} />
              <Bar name="Não aplicável" dataKey="na" stackId="t" fill={COLORS.na} radius={[0, 4, 4, 0]} />
              <Bar name="Outros" dataKey="outros" stackId="t" fill={COLORS.outros} legendType="none" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
