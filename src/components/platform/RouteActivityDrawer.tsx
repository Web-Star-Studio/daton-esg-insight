import { useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouteActivity } from "@/hooks/useRouteActivity";

/**
 * Drilldown lateral pra uma rota específica — abre quando você clica
 * numa linha da tabela "Páginas mais usadas".
 *
 * Mostra:
 *   • Header: rota + KPIs (pageviews, users únicos, tempo real, scroll)
 *   • AreaChart: pageviews diários (com bandas de users únicos)
 *   • Tabela: ranking de users que mais acessaram essa rota
 *   • Eventos disparados nessa rota
 */

type Period = "7d" | "30d" | "90d";

type Props = {
  routePattern: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  return `${hours}h${restMin > 0 ? ` ${restMin}min` : ""}`;
};

const formatDayShort = (day: string): string => {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
};

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

const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-md border p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-xl font-semibold mt-0.5">{value}</div>
    {hint && (
      <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>
    )}
  </div>
);

const tooltipContentStyle: React.CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: 12,
};

export const RouteActivityDrawer = ({
  routePattern,
  open,
  onOpenChange,
}: Props) => {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useRouteActivity(routePattern, period);

  const hasRealTime = useMemo(
    () => (data ? data.totals.real_pageviews_with_time > 0 : false),
    [data],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {!routePattern || isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono text-base">
                {data.totals.route_pattern}
              </SheetTitle>
              <SheetDescription>
                {data.totals.pageviews === 0
                  ? "Sem atividade no período."
                  : `${formatNumber(data.totals.pageviews)} pageviews · ${data.totals.unique_users} usuários únicos`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex justify-end mt-4">
              <Tabs
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
                className="w-fit"
              >
                <TabsList>
                  <TabsTrigger value="7d">7d</TabsTrigger>
                  <TabsTrigger value="30d">30d</TabsTrigger>
                  <TabsTrigger value="90d">90d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Kpi
                label="Pageviews"
                value={formatNumber(data.totals.pageviews)}
                hint={`em ${formatDuration(data.totals.span_seconds)}`}
              />
              <Kpi
                label="Usuários únicos"
                value={String(data.totals.unique_users)}
                hint="excluindo testers"
              />
              <Kpi
                label={hasRealTime ? "Tempo total" : "Tempo total (sem dado)"}
                value={
                  hasRealTime
                    ? formatDuration(
                        Math.round(data.totals.real_total_time_ms / 1000),
                      )
                    : "—"
                }
                hint={
                  hasRealTime
                    ? `${data.totals.real_pageviews_with_time}/${data.totals.pageviews} pageviews medidos`
                    : "tracking de tempo não deployado"
                }
              />
              <Kpi
                label="Scroll médio"
                value={
                  data.totals.avg_scroll_pct !== null
                    ? `${data.totals.avg_scroll_pct}%`
                    : "—"
                }
                hint={
                  data.totals.avg_scroll_pct !== null
                    ? "média do scroll máximo"
                    : "não medido pré-deploy"
                }
              />
            </div>

            {!hasRealTime && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Aviso:</strong> tempo na página e scroll só
                começam a popular após deploy do tracking enriquecido. As
                métricas de pageview total e usuários únicos já são reais.
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendência diária
              </h3>
              <div className="rounded-md border p-3">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={data.daily}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="grad-route-pv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={formatDayShort}
                      fontSize={11}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      fontSize={11}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelFormatter={(label: string) => formatDayShort(label)}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "pageviews" ? "Pageviews" : "Usuários únicos",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      stroke="hsl(217 91% 60%)"
                      fill="url(#grad-route-pv)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="unique_users"
                      stroke="hsl(142 71% 45%)"
                      fill="transparent"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Quem acessou ({data.top_users.length})
              </h3>
              {data.top_users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum usuário acessou essa rota no período.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Pageviews</TableHead>
                      <TableHead className="text-right">Tempo total</TableHead>
                      <TableHead className="text-right">Última visita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.full_name ?? u.user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(u.pageviews)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {u.total_time_on_page_ms > 0
                            ? formatDuration(
                                Math.round(u.total_time_on_page_ms / 1000),
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatRelative(u.last_seen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {data.events.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Eventos disparados nessa rota
                </h3>
                <div className="space-y-1">
                  {data.events.map((e) => (
                    <div
                      key={e.event_type}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {e.event_type}
                        </Badge>
                        <span className="text-muted-foreground">
                          última: {formatRelative(e.last_seen)}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatNumber(e.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <Calendar className="h-3 w-3" />
              {periodLabel(period)}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const periodLabel = (p: Period): string => {
  if (p === "7d") return "Últimos 7 dias";
  if (p === "30d") return "Últimos 30 dias";
  return "Últimos 90 dias";
};
