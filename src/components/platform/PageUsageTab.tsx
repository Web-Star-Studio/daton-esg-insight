import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTE_PATHS } from "@/constants/routePaths";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
type Period = "24h" | "7d" | "30d" | "90d";

const collectStaticPaths = (): string[] => {
  const paths = new Set<string>();
  const walk = (obj: unknown) => {
    if (typeof obj === "string") paths.add(obj.split("?")[0]);
    else if (obj && typeof obj === "object")
      Object.values(obj as Record<string, unknown>).forEach(walk);
  };
  walk(ROUTE_PATHS);
  return Array.from(paths).sort();
};

export const PageUsageTab = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [companyFilter, setCompanyFilter] = useState<string>(ALL_COMPANIES);
  const [period, setPeriod] = useState<Period>("30d");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const hours =
        period === "24h" ? 24
        : period === "7d" ? 24 * 7
        : period === "30d" ? 24 * 30
        : 24 * 90;
      const fromDate = new Date(
        Date.now() - hours * 60 * 60 * 1000
      ).toISOString();

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
        (profRes.data ?? []).forEach((p) =>
          map.set((p as Profile).id, p as Profile)
        );
        setProfiles(map);
      } else {
        setProfiles(new Map());
      }

      setLoading(false);
    })();
  }, [period]);

  const filteredLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (companyFilter === ALL_COMPANIES) return true;
        if (companyFilter === NO_COMPANY) return l.company_id === null;
        return l.company_id === companyFilter;
      }),
    [logs, companyFilter]
  );

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

  const totalViews = filteredLogs.length;
  const uniqueUsers = useMemo(
    () => new Set(filteredLogs.map((l) => l.user_id).filter(Boolean)).size,
    [filteredLogs]
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid gap-3 md:grid-cols-3">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Organização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_COMPANIES}>Todas as organizações</SelectItem>
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
            <SelectItem value="24h">Últimas 24 horas</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
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
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Rotas acessadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routeStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Rotas sem uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unused.length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {declaredPaths.length} declaradas
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
              Rotas usadas ({filteredRouteStats.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">
              Logs ({filteredLogs.length})
            </TabsTrigger>
            <TabsTrigger value="unused">
              Sem acesso ({unused.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="mt-4">
            <Card>
              <CardContent className="p-0 max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Rota</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
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
                          Sem dados.
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

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-0 max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum acesso no período.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredLogs
                      .filter((l) =>
                        l.pathname.toLowerCase().includes(search.toLowerCase())
                      )
                      .slice(0, 1000)
                      .map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(l.viewed_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {l.user_id ? (
                              profiles.get(l.user_id)?.email ?? (
                                <span className="text-muted-foreground">
                                  {l.user_id.slice(0, 8)}…
                                </span>
                              )
                            ) : (
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
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {filteredLogs.length > 1000 && (
                  <div className="p-3 text-xs text-muted-foreground text-center border-t">
                    Mostrando 1000 de{" "}
                    {filteredLogs.length.toLocaleString("pt-BR")} acessos.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unused" className="mt-4">
            <Card>
              <CardContent className="p-0 max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Rota declarada sem acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unused.length === 0 && (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground py-8">
                          Todas as rotas declaradas tiveram acesso.
                        </TableCell>
                      </TableRow>
                    )}
                    {unused.map((p) => (
                      <TableRow key={p}>
                        <TableCell className="font-mono text-sm">{p}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
