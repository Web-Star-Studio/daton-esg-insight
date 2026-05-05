import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGabardoTimeseries } from "@/hooks/useGabardoTimeseries";

/**
 * Linha de gráficos diários para o Gabardo View:
 *   - Pageviews + usuários únicos por dia (área dupla)
 *   - Custo IA por dia (barra)
 *
 * Visual >> tabela em reuniões de cobrança. As tabelas continuam
 * embaixo; gráficos contam o "como evoluiu" rápido.
 */

type Period = "7d" | "30d" | "90d";

const formatDayShort = (day: string): string => {
  // YYYY-MM-DD → DD/MM
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
};

const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(n);

const tooltipContentStyle: React.CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: 12,
};

export const GabardoChartsRow = ({ period }: { period: Period }) => {
  const { data, isLoading } = useGabardoTimeseries(period);

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pageviews e usuários únicos por dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-uu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
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
                fill="url(#grad-pv)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="unique_users"
                stroke="hsl(142 71% 45%)"
                fill="url(#grad-uu)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custo IA por dia (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
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
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelFormatter={(label: string) => formatDayShort(label)}
                formatter={(value: number, name: string) => {
                  if (name === "ai_cost_usd") return [formatCurrency(value), "Custo"];
                  return [value, "Calls"];
                }}
              />
              <Bar dataKey="ai_cost_usd" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
