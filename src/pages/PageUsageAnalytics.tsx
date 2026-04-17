import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ROUTE_PATHS } from "@/constants/routePaths";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";

type LogRow = {
  id: string;
  user_id: string | null;
  company_id: string | null;
  pathname: string;
  search: string | null;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: string;
};

type Company = { id: string; name: string };
type Profile = { id: string; email: string | null; full_name: string | null };

const ALL_COMPANIES = "__all__";
const NO_COMPANY = "__none__";

type Period = "7d" | "30d" | "90d" | "custom";

const collectStaticPaths = (): string[] => {
  const paths = new Set<string>();
  const walk = (obj: unknown) => {
    if (typeof obj === "string") {
      paths.add(obj.split("?")[0]);
    } else if (obj && typeof obj === "object") {
      Object.values(obj as Record<string, unknown>).forEach(walk);
    }
  };
  walk(ROUTE_PATHS);
  return Array.from(paths).sort();
};

const periodToDate = (period: Period, customFrom: string): Date => {
  const now = new Date();
  if (period === "custom" && customFrom) return new Date(customFrom);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

const PageUsageAnalytics = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [companyFilter, setCompanyFilter] = useState<string>(ALL_COMPANIES);
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const fromDate = periodToDate(period, customFrom).toISOString();

      const [logsRes, companiesRes] = await Promise.all([
        supabase
          .from("page_view_logs")
          .select("*")
          .gte("viewed_at", fromDate)
          .order("viewed_at", { ascending: false })
          .limit(50000),
        supabase.from("companies").select("id, name").order("name"),
      ]);

      const logRows = (logsRes.data as LogRow[]) ?? [];
      setLogs(logRows);
      setCompanies((companiesRes.data as Company[]) ?? []);

      const userIds = Array.from(
        new Set(logRows.map((l) => l.user_id).filter((id): id is string => !!id))
      );
      if (userIds.length > 0) {
        const profRes = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        const map = new Map<string, Profile>();
        (profRes.data ?? []).forEach((p) => map.set((p as Profile).id, p as Profile));
        setProfiles(map);
      } else {
        setProfiles(new Map());
      }

      setLoading(false);
    })();
  }, [period, customFrom]);

  // Filtra logs pela empresa
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (companyFilter === ALL_COMPANIES) return true;
      if (companyFilter === NO_COMPANY) return l.company_id === null;
      return l.company_id === companyFilter;
    });
  }, [logs, companyFilter]);

  // Agregação por rota
  const routeStats = useMemo(() => {
    const map = new Map<
      string,
      { views: number; users: Set<string>; last: string | null }
    >();
    for (const l of filteredLogs) {
      const cur = map.get(l.pathname) ?? {
        views: 0,
        users: new Set<string>(),
        last: null,
      };
      cur.views += 1;
      if (l.user_id) cur.users.add(l.user_id);
      if (!cur.last || l.viewed_at > cur.last) cur.last = l.viewed_at;
      map.set(l.pathname, cur);
    }
    return Array.from(map.entries())
      .map(([pathname, v]) => ({
        pathname,
        views: v.views,
        unique_users: v.users.size,
        last: v.last,
      }))
      .sort((a, b) => b.views - a.views);
  }, [filteredLogs]);

  const declaredPaths = useMemo(() => collectStaticPaths(), []);
  const accessedPathsSet = useMemo(
    () => new Set(routeStats.map((r) => r.pathname)),
    [routeStats]
  );

  const filteredRouteStats = useMemo(
    () =>
      routeStats.filter((r) =>
        r.pathname.toLowerCase().includes(search.toLowerCase())
      ),
    [routeStats, search]
  );

  const unused = useMemo(
    () =>
      declaredPaths
        .filter((p) => !accessedPathsSet.has(p))
        .filter((p) => p.toLowerCase().includes(search.toLowerCase())),
    [declaredPaths, accessedPathsSet, search]
  );

  // Ranking de usuários
  const userRanking = useMemo(() => {
    const map = new Map<
      string,
      { views: number; routes: Set<string>; last: string }
    >();
    for (const l of filteredLogs) {
      if (!l.user_id) continue;
      const cur = map.get(l.user_id) ?? {
        views: 0,
        routes: new Set<string>(),
        last: l.viewed_at,
      };
      cur.views += 1;
      cur.routes.add(l.pathname);
      if (l.viewed_at > cur.last) cur.last = l.viewed_at;
      map.set(l.user_id, cur);
    }
    return Array.from(map.entries())
      .map(([userId, v]) => ({
        userId,
        email: profiles.get(userId)?.email ?? "—",
        views: v.views,
        routes: v.routes.size,
        last: v.last,
      }))
      .sort((a, b) => b.views - a.views);
  }, [filteredLogs, profiles]);

  // Heatmap (hora x dia da semana)
  const heatmap = useMemo(() => {
    // 7 dias x 24 horas
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const l of filteredLogs) {
      const d = new Date(l.viewed_at);
      const day = d.getDay();
      const hour = d.getHours();
      grid[day][hour] += 1;
      if (grid[day][hour] > max) max = grid[day][hour];
    }
    return { grid, max };
  }, [filteredLogs]);

  const totalViews = filteredLogs.length;
  const uniqueUsers = useMemo(
    () => new Set(filteredLogs.map((l) => l.user_id).filter(Boolean)).size,
    [filteredLogs]
  );

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <>
      <Helmet>
        <title>Análise de Uso de Páginas | Admin</title>
        <meta
          name="description"
          content="Tracking detalhado de acessos às páginas por organização: timeline, ranking de usuários, heatmap e rotas sem uso."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Análise de Uso de Páginas
          </h1>
          <p className="text-muted-foreground">
            Tracking de acessos por organização. Identifique funcionalidades
            mais e menos usadas, padrões de uso e usuários mais ativos.
          </p>
        </header>

        {/* Filtros */}
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Organização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COMPANIES}>
                Todas as organizações
              </SelectItem>
              <SelectItem value={NO_COMPANY}>Visitantes anônimos</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">A partir de…</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          )}

          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar rota…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total de visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalViews.toLocaleString("pt-BR")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Usuários únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Rotas com tráfego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{routeStats.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Rotas sem acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {unused.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {declaredPaths.length} rotas declaradas
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="routes">
            <TabsList>
              <TabsTrigger value="routes">
                Rotas ({filteredRouteStats.length})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({filteredLogs.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Usuários ({userRanking.length})
              </TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="unused">
                Sem acesso ({unused.length})
              </TabsTrigger>
            </TabsList>

            {/* Rotas */}
            <TabsContent value="routes" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rota</TableHead>
                        <TableHead className="text-right">
                          Visualizações
                        </TableHead>
                        <TableHead className="text-right">
                          Usuários únicos
                        </TableHead>
                        <TableHead>Último acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRouteStats.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            Nenhum dado para os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredRouteStats.map((r) => (
                        <TableRow key={r.pathname}>
                          <TableCell className="font-mono text-sm">
                            {r.pathname}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {r.views}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.unique_users}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.last
                              ? new Date(r.last).toLocaleString("pt-BR")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-0 max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Quando</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rota</TableHead>
                        <TableHead>Referrer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            Nenhum acesso no período.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredLogs
                        .filter((l) =>
                          l.pathname
                            .toLowerCase()
                            .includes(search.toLowerCase())
                        )
                        .slice(0, 1000)
                        .map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(l.viewed_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {l.user_id
                                ? profiles.get(l.user_id)?.email ?? (
                                    <span className="text-muted-foreground">
                                      {l.user_id.slice(0, 8)}…
                                    </span>
                                  )
                                : (
                                  <Badge variant="outline">anônimo</Badge>
                                )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {l.pathname}
                              {l.search && (
                                <span className="text-muted-foreground">
                                  {l.search}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {l.referrer || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {filteredLogs.length > 1000 && (
                    <div className="p-3 text-xs text-muted-foreground text-center border-t">
                      Mostrando os 1000 acessos mais recentes de{" "}
                      {filteredLogs.length.toLocaleString("pt-BR")}.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usuários */}
            <TabsContent value="users" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Acessos</TableHead>
                        <TableHead className="text-right">
                          Rotas distintas
                        </TableHead>
                        <TableHead>Último acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRanking.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            Sem usuários autenticados no período.
                          </TableCell>
                        </TableRow>
                      )}
                      {userRanking.map((u) => (
                        <TableRow key={u.userId}>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {u.views}
                          </TableCell>
                          <TableCell className="text-right">
                            {u.routes}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(u.last).toLocaleString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Heatmap */}
            <TabsContent value="heatmap" className="mt-4">
              <Card>
                <CardContent className="p-4 overflow-x-auto">
                  <p className="text-sm text-muted-foreground mb-4">
                    Distribuição de acessos por dia da semana e hora do dia.
                  </p>
                  <div className="inline-block">
                    <div className="flex">
                      <div className="w-12" />
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div
                          key={h}
                          className="w-7 text-[10px] text-center text-muted-foreground"
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                    {heatmap.grid.map((row, day) => (
                      <div key={day} className="flex items-center">
                        <div className="w-12 text-xs text-muted-foreground">
                          {dayLabels[day]}
                        </div>
                        {row.map((count, h) => {
                          const intensity =
                            heatmap.max > 0 ? count / heatmap.max : 0;
                          return (
                            <div
                              key={h}
                              title={`${dayLabels[day]} ${h}h: ${count} acessos`}
                              className="w-7 h-7 m-[1px] rounded-sm border border-border/50"
                              style={{
                                backgroundColor: `hsl(var(--primary) / ${
                                  intensity === 0 ? 0.04 : 0.15 + intensity * 0.85
                                })`,
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sem acesso */}
            <TabsContent value="unused" className="mt-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Rotas declaradas em <code>ROUTE_PATHS</code> sem nenhum
                    acesso registrado no período
                    {companyFilter !== ALL_COMPANIES &&
                      " (para a organização selecionada)"}
                    .
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unused.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        🎉 Todas as rotas tiveram pelo menos um acesso.
                      </span>
                    )}
                    {unused.map((p) => (
                      <Badge key={p} variant="outline" className="font-mono">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default PageUsageAnalytics;
