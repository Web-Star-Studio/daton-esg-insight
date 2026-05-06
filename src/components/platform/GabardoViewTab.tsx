import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Eye,
  Ghost,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useGabardoMetrics,
  type GabardoUserRow,
  type GabardoRouteRow,
  type GabardoAiCostRow,
} from "@/hooks/useGabardoMetrics";
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
import { GabardoChartsRow } from "@/components/platform/GabardoChartsRow";
import { UserActivityDrawer } from "@/components/platform/UserActivityDrawer";
import { RouteActivityDrawer } from "@/components/platform/RouteActivityDrawer";
import { GabardoUsageInsightsPanel } from "@/components/platform/GabardoUsageInsightsPanel";

/**
 * Aba dedicada à Gabardo no admin — fonte única de evidência pra
 * reuniões de cobrança. Substituir por seletor de empresa quando
 * houver multi-tenant real.
 *
 * Cards e tabelas pensados pra screenshot direto:
 *   • KPIs principais (uso, sessões, custo IA)
 *   • Top users por engajamento
 *   • Users fantasma (cadastrados, nunca logaram no período)
 *   • Top features (rotas) com tempo médio
 *   • Custo IA por feature × modelo
 */

type Period = "7d" | "30d" | "90d";

const periodLabel: Record<Period, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

const formatNumber = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(n);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(n);

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  return `${hours}h${restMin > 0 ? ` ${restMin}min` : ""}`;
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
  icon: typeof Users;
  tone?: "default" | "warning";
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon
        className={
          tone === "warning"
            ? "h-4 w-4 text-amber-600"
            : "h-4 w-4 text-muted-foreground"
        }
      />
    </CardHeader>
    <CardContent>
      <div
        className={
          tone === "warning"
            ? "text-2xl font-bold text-amber-700"
            : "text-2xl font-bold"
        }
      >
        {value}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </CardContent>
  </Card>
);

const TopUsersTable = ({
  rows,
  onSelectUser,
}: {
  rows: GabardoUserRow[];
  onSelectUser: (userId: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">
        Top usuários por engajamento
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-1">
        Clique em qualquer linha pra ver a timeline detalhada do usuário.
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right">Pageviews</TableHead>
            <TableHead className="text-right">Dias ativos</TableHead>
            <TableHead className="text-right">Tempo ativo</TableHead>
            <TableHead className="text-right">Última visita</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => (
            <TableRow
              key={u.user_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectUser(u.user_id)}
            >
              <TableCell className="font-medium">
                {u.full_name ?? u.user_id.slice(0, 8)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(u.pageviews)}
              </TableCell>
              <TableCell className="text-right">{u.active_days}</TableCell>
              <TableCell className="text-right">
                {formatDuration(u.total_active_seconds)}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatRelative(u.last_seen)}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Sem atividade no período.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const GhostUsersCard = ({
  rows,
}: {
  rows: Array<{ user_id: string; full_name: string | null }>;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base">
        Usuários sem login no período
      </CardTitle>
      <Badge variant={rows.length > 0 ? "destructive" : "secondary"}>
        {rows.length}
      </Badge>
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todos os usuários cadastrados acessaram a plataforma. 🎉
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((u) => (
            <li
              key={u.user_id}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Ghost className="h-3 w-3" />
              {u.full_name ?? u.user_id.slice(0, 8)}
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

const TopRoutesTable = ({
  rows,
  onSelectRoute,
}: {
  rows: GabardoRouteRow[];
  onSelectRoute: (route: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Páginas mais usadas</CardTitle>
      <p className="text-xs text-muted-foreground mt-1">
        Clique numa rota pra ver quem acessou e quando.
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rota</TableHead>
            <TableHead className="text-right">Pageviews</TableHead>
            <TableHead className="text-right">Usuários únicos</TableHead>
            <TableHead className="text-right">Tempo médio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.route_pattern}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectRoute(r.route_pattern)}
            >
              <TableCell className="font-mono text-xs">
                {r.route_pattern}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(r.pageviews)}
              </TableCell>
              <TableCell className="text-right">{r.unique_users}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {r.avg_time_on_page_ms
                  ? `${(r.avg_time_on_page_ms / 1000).toFixed(1)}s`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const AiCostTable = ({ rows }: { rows: GabardoAiCostRow[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Custo IA por feature</CardTitle>
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma chamada de IA registrada no período. Confirme que as edge
          functions estão usando o wrapper <code>aiCall</code>.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Função</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Custo (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={`${r.function_name}-${r.feature_tag ?? ""}-${r.model}`}
              >
                <TableCell className="font-mono text-xs">
                  {r.function_name}
                </TableCell>
                <TableCell className="text-xs">
                  {r.feature_tag ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.model}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.calls)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.total_tokens)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(r.cost_usd)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const GabardoViewTab = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routeDrawerOpen, setRouteDrawerOpen] = useState(false);
  const { data, isLoading } = useGabardoMetrics(period);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const handleSelectRoute = (route: string) => {
    setSelectedRoute(route);
    setRouteDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transportes Gabardo</h2>
          <p className="text-sm text-muted-foreground">
            Visão consolidada do uso da plataforma — {periodLabel[period]}.
          </p>
        </div>
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

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi
              title="Usuários ativos"
              value={`${data.totals.active_users} / ${data.totals.total_users}`}
              hint={`${data.totals.inactive_users} sem login no período`}
              icon={Users}
              tone={data.totals.inactive_users > 0 ? "warning" : "default"}
            />
            <Kpi
              title="Pageviews"
              value={formatNumber(data.totals.pageviews)}
              hint={`${data.totals.events} eventos de negócio`}
              icon={Eye}
            />
            <Kpi
              title="Tempo total ativo"
              value={`${formatNumber(data.totals.total_active_minutes)} min`}
              hint={
                data.totals.avg_session_minutes !== null
                  ? `Média ${data.totals.avg_session_minutes} min/sessão`
                  : `${data.totals.sessions} sessões registradas`
              }
              icon={Activity}
            />
            <Kpi
              title="Custo IA estimado"
              value={formatCurrency(data.totals.ai_cost_usd)}
              hint={`${formatNumber(data.totals.ai_calls)} chamadas`}
              icon={DollarSign}
            />
          </div>

          <GabardoChartsRow period={period} />

          <GabardoUsageInsightsPanel />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TopUsersTable
                rows={data.top_users}
                onSelectUser={handleSelectUser}
              />
            </div>
            <GhostUsersCard rows={data.ghost_users} />
          </div>

          <UserActivityDrawer
            userId={selectedUserId}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
          <RouteActivityDrawer
            routePattern={selectedRoute}
            open={routeDrawerOpen}
            onOpenChange={setRouteDrawerOpen}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <TopRoutesTable
              rows={data.top_routes}
              onSelectRoute={handleSelectRoute}
            />
            <AiCostTable rows={data.ai_cost_breakdown} />
          </div>

          {data.totals.ai_calls === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div className="text-sm text-amber-900">
                  <strong>Tracking de IA com cobertura parcial.</strong>{" "}
                  Algumas edge functions ainda chamam o gateway sem
                  registrar uso. Concluir migração em{" "}
                  <code>supabase/functions/_shared/ai-logger.ts</code> pra
                  fechar a cobertura de custo.
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3" />
            Atualiza automaticamente a cada 60s. Testers internos
            (jpbs@cesar.school etc.) excluídos das contagens.
          </div>
        </>
      )}
    </div>
  );
};
