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
  ReferenceLine,
  Legend,
  CartesianGrid,
} from "recharts";
import { Building2 } from "lucide-react";
import type { BranchComplianceStats } from "@/hooks/useBranchComplianceStats";

interface Props {
  branches: BranchComplianceStats[] | undefined;
  isLoading: boolean;
  onBranchClick?: (branchId: string) => void;
  targetPct?: number;
}

const COLORS = {
  conforme: "hsl(151, 75%, 40%)",
  planoAcao: "hsl(0, 75%, 55%)",
  pending: "hsl(38, 92%, 55%)",
  na: "hsl(220, 10%, 70%)",
  outros: "hsl(220, 15%, 50%)",
} as const;

const numberFmt = new Intl.NumberFormat("pt-BR");
const pctFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtPct = (v: number) => pctFmt.format(v);

interface ChartDatum {
  branchId: string;
  label: string;
  city: string | null;
  state: string | null;
  total: number;
  conforme: number;
  planoAcao: number;
  pending: number;
  na: number;
  outros: number;
  conformePct: number;
  planoAcaoPct: number;
  pendingPct: number;
  naPct: number;
  outrosPct: number;
  complianceRate: number;
}

interface TooltipPayloadEntry {
  payload: ChartDatum;
}

// Tick do YAxis que quebra labels com hífen em 2 linhas (ex.: "GO-CARREGAMENTO"
// vira "GO" + "CARREGAMENTO") pra evitar que o tracinho "coma" o descendente do 'g'.
const BranchYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const value = String(payload?.value ?? '');
  const dashIdx = value.indexOf('-');
  const color = "hsl(var(--muted-foreground))";
  if (dashIdx === -1) {
    return (
      <text x={x} y={y} dy=".355em" textAnchor="end" fontSize={12} fill={color}>
        {value}
      </text>
    );
  }
  const head = value.slice(0, dashIdx);
  const tail = value.slice(dashIdx + 1);
  return (
    <g>
      <text x={x} y={y} dy="-0.25em" textAnchor="end" fontSize={12} fontWeight={500} fill={color}>
        {head}
      </text>
      <text x={x} y={y} dy="0.95em" textAnchor="end" fontSize={10.5} fill={color}>
        {tail}
      </text>
    </g>
  );
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: TooltipPayloadEntry[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rows: Array<{ label: string; n: number; pct: number; color: string }> = [
    { label: "Conforme", n: d.conforme, pct: d.conformePct, color: COLORS.conforme },
    { label: "Plano de ação", n: d.planoAcao, pct: d.planoAcaoPct, color: COLORS.planoAcao },
    { label: "Pendente", n: d.pending, pct: d.pendingPct, color: COLORS.pending },
    { label: "Não aplicável", n: d.na, pct: d.naPct, color: COLORS.na },
  ];
  if (d.outros > 0) rows.push({ label: "Outros", n: d.outros, pct: d.outrosPct, color: COLORS.outros });
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-semibold">{d.label}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {d.city ? `${d.city} · ` : ""}{d.state ?? ""}{" · "}{numberFmt.format(d.total)} avaliações
      </div>
      <div className="space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {numberFmt.format(r.n)} <span className="opacity-70">({fmtPct(r.pct)}%)</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t text-xs">
        Conformidade: <strong className="tabular-nums">{fmtPct(d.complianceRate * 100)}%</strong>{" "}
        <span className="text-muted-foreground">(conforme ÷ aplicáveis)</span>
      </div>
    </div>
  );
};

export const BranchComplianceRanking: React.FC<Props> = ({
  branches,
  isLoading,
  onBranchClick,
  targetPct = 95,
}) => {
  const data = useMemo<ChartDatum[]>(() => {
    if (!branches) return [];
    return branches
      .filter(b => b.total > 0)
      .map(b => {
        const tot = b.total || 1;
        return {
          branchId: b.branchId,
          label: b.code ? `${b.code}` : b.name,
          city: b.city,
          state: b.state,
          total: b.total,
          conforme: b.conforme,
          planoAcao: b.planoAcao,
          pending: b.pending,
          na: b.na,
          outros: b.outros,
          conformePct: (b.conforme / tot) * 100,
          planoAcaoPct: (b.planoAcao / tot) * 100,
          pendingPct: (b.pending / tot) * 100,
          naPct: (b.na / tot) * 100,
          outrosPct: (b.outros / tot) * 100,
          complianceRate: b.complianceRate,
        };
      });
  }, [branches]);

  const chartHeight = Math.max(220, data.length * 44 + 80);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Conformidade por filial
        </CardTitle>
        <CardDescription>
          Distribuição percentual das avaliações por filial. Linha pontilhada marca a meta de {targetPct}% conforme.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
            <Building2 className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma filial com avaliações registradas ainda.</p>
            <p className="text-xs mt-1">Importe a planilha de legislações para popular esta visão.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
              barCategoryGap={8}
              onClick={(state) => {
                const payload = state?.activePayload?.[0]?.payload as ChartDatum | undefined;
                if (payload && onBranchClick) onBranchClick(payload.branchId);
              }}
            >
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={<BranchYAxisTick />}
                width={110}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="square"
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
              <Bar name="Conforme" dataKey="conformePct" stackId="x" fill={COLORS.conforme} radius={[4, 0, 0, 4]} />
              <Bar name="Plano de ação" dataKey="planoAcaoPct" stackId="x" fill={COLORS.planoAcao} />
              <Bar name="Pendente" dataKey="pendingPct" stackId="x" fill={COLORS.pending} />
              <Bar name="Não aplicável" dataKey="naPct" stackId="x" fill={COLORS.na} radius={[0, 4, 4, 0]} />
              <Bar name="Outros" dataKey="outrosPct" stackId="x" fill={COLORS.outros} legendType="none" />
              <ReferenceLine
                x={targetPct}
                stroke={COLORS.conforme}
                strokeDasharray="6 4"
                label={{
                  value: `Meta ${targetPct}%`,
                  position: "top",
                  fill: COLORS.conforme,
                  fontSize: 11,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
