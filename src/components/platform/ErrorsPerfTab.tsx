import { useState } from "react";
import {
  AlertTriangle,
  Bug,
  Gauge,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useErrorsPerfMetrics,
  type TopErrorRow,
  type WebVitalRow,
} from "@/hooks/useErrorsPerfMetrics";

/**
 * Aba do admin pra Erros & Performance.
 *
 * Erros: top fingerprints com count, users afetados, rotas, last seen.
 * Performance: Web Vitals p50/p95 por rota — destaca páginas lentas.
 */

type Period = "24h" | "7d" | "30d";

const periodLabel: Record<Period, string> = {
  "24h": "Últimas 24h",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
};

const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
};

// Thresholds Web Vitals (Google) — usa pra colorir p95.
const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  FID: { good: 100, poor: 300, unit: "ms" },
};

const ratingFor = (
  metric: string,
  value: number,
): "good" | "needs-improvement" | "poor" => {
  const t = VITAL_THRESHOLDS[metric];
  if (!t) return "needs-improvement";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
};

const formatVitalValue = (metric: string, value: number): string => {
  const t = VITAL_THRESHOLDS[metric];
  if (!t) return value.toFixed(2);
  if (metric === "CLS") return value.toFixed(3);
  return `${formatNumber(value)}${t.unit}`;
};

const ratingBadge = (rating: "good" | "needs-improvement" | "poor") => {
  if (rating === "good") return <Badge variant="default">bom</Badge>;
  if (rating === "poor") return <Badge variant="destructive">ruim</Badge>;
  return <Badge variant="secondary">médio</Badge>;
};

const Kpi = ({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof Bug;
  tone?: "default" | "warning" | "danger";
}) => {
  const valueClass =
    tone === "danger"
      ? "text-2xl font-bold text-red-700"
      : tone === "warning"
        ? "text-2xl font-bold text-amber-700"
        : "text-2xl font-bold";
  const iconClass =
    tone === "danger"
      ? "h-4 w-4 text-red-600"
      : tone === "warning"
        ? "h-4 w-4 text-amber-600"
        : "h-4 w-4 text-muted-foreground";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={iconClass} />
      </CardHeader>
      <CardContent>
        <div className={valueClass}>{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
};

const TopErrorsTable = ({ rows }: { rows: TopErrorRow[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">
        Top erros (agrupados por fingerprint)
      </CardTitle>
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum erro registrado no período. ✨
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mensagem</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ocorrências</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead className="text-right">Rotas</TableHead>
              <TableHead className="text-right">Último</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.fingerprint}>
                <TableCell className="max-w-md truncate font-mono text-xs" title={e.message}>
                  {e.message}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {e.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(e.count)}
                </TableCell>
                <TableCell className="text-right">{e.unique_users}</TableCell>
                <TableCell className="text-right">{e.unique_routes}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatRelative(e.last_seen)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

const WebVitalsTable = ({ rows }: { rows: WebVitalRow[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">
        Web Vitals por rota (p50 / p95)
      </CardTitle>
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem dados de Web Vitals no período. Aguarde tráfego com{" "}
          <code>{"<WebVitalsTracker />"}</code> ativo.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Métrica</TableHead>
              <TableHead className="text-right">Amostras</TableHead>
              <TableHead className="text-right">p50</TableHead>
              <TableHead className="text-right">p95</TableHead>
              <TableHead className="text-right">Rating p95</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const r95 = ratingFor(r.metric, r.p95);
              return (
                <TableRow key={`${r.route_pattern}-${r.metric}`}>
                  <TableCell className="font-mono text-xs">
                    {r.route_pattern}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {r.metric}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{r.samples}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatVitalValue(r.metric, r.p50)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVitalValue(r.metric, r.p95)}
                  </TableCell>
                  <TableCell className="text-right">
                    {ratingBadge(r95)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const ErrorsPerfTab = () => {
  const [period, setPeriod] = useState<Period>("24h");
  const { data, isLoading } = useErrorsPerfMetrics(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Erros & Performance</h2>
          <p className="text-sm text-muted-foreground">
            Erros JS de cliente + Web Vitals — {periodLabel[period]}.
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi
              title="Erros totais"
              value={formatNumber(data.totals.total_errors)}
              icon={Bug}
              tone={data.totals.total_errors > 0 ? "danger" : "default"}
            />
            <Kpi
              title="Tipos de erro únicos"
              value={formatNumber(data.totals.unique_fingerprints)}
              hint="agrupados por fingerprint"
              icon={AlertTriangle}
              tone={data.totals.unique_fingerprints > 5 ? "warning" : "default"}
            />
            <Kpi
              title="Usuários afetados"
              value={formatNumber(data.totals.affected_users)}
              icon={Users}
              tone={data.totals.affected_users > 0 ? "warning" : "default"}
            />
            <Kpi
              title="Web Vitals — amostras"
              value={formatNumber(data.totals.perf_samples)}
              hint="LCP, FCP, CLS, INP, TTFB"
              icon={Gauge}
            />
          </div>

          <TopErrorsTable rows={data.top_errors} />
          <WebVitalsTable rows={data.web_vitals} />
        </>
      )}
    </div>
  );
};
