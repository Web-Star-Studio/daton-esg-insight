import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Search, Sparkles } from "lucide-react";
import { DECLARED_ROUTES } from "@/constants/declaredRoutes";

type Period = "24h" | "7d" | "30d" | "90d";

type Summary = {
  totals: {
    page_views: number;
    unique_users: number;
    events: number;
    ai_calls: number;
    ai_tokens: number;
    ai_cost_usd: number;
    ai_errors: number;
  };
  routes: Array<{ route_pattern: string; views: number; unique_users: number; last: string }>;
  eventCounts: Array<{ event_type: string; count: number }>;
  models: Array<{ model: string; tokens: number; cost: number; calls: number }>;
  functions: Array<{
    function_name: string;
    tokens: number;
    cost: number;
    calls: number;
    avg_latency_ms: number;
  }>;
  companies: Array<{ company_id: string | null; tokens: number; cost: number; calls: number }>;
  users: Array<{ user_id: string; views: number; routes: number; events: number }>;
  daily: Array<{ day: string; views: number; cost_usd: number; events: number }>;
  heatmap: Array<{ dow: number; hour: number; count: number }>;
};

type Company = { id: string; name: string };
type Profile = { id: string; email: string | null; full_name: string | null };

const ALL_COMPANIES = "__all__";
const GABARDO_DEFAULT_KEY = "admin_usage_default_company";

const periodToFromIso = (p: Period): string => {
  const hours = p === "24h" ? 24 : p === "7d" ? 24 * 7 : p === "30d" ? 24 * 30 : 24 * 90;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
};

const fmtUsd = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const fmtTokens = (v: number) => v.toLocaleString("pt-BR");

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const UsageAnalyticsTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>(() => {
    return localStorage.getItem(GABARDO_DEFAULT_KEY) || ALL_COMPANIES;
  });
  const [period, setPeriod] = useState<Period>("30d");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: rows } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      const list = (rows as Company[]) ?? [];
      setCompanies(list);

      // Default Gabardo na primeira visita.
      if (!localStorage.getItem(GABARDO_DEFAULT_KEY)) {
        const gabardo = list.find((c) => /gabardo/i.test(c.name));
        if (gabardo) {
          setCompanyFilter(gabardo.id);
          localStorage.setItem(GABARDO_DEFAULT_KEY, gabardo.id);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (companyFilter !== ALL_COMPANIES) {
      localStorage.setItem(GABARDO_DEFAULT_KEY, companyFilter);
    } else {
      localStorage.removeItem(GABARDO_DEFAULT_KEY);
    }
  }, [companyFilter]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data: result, error } = await supabase.functions.invoke("get-usage-summary", {
        body: {
          from: periodToFromIso(period),
          companyId: companyFilter === ALL_COMPANIES ? null : companyFilter,
        },
      });
      if (error || !result) {
        setData(null);
        setLoading(false);
        return;
      }
      setData(result as Summary);

      const userIds = (result as Summary).users.slice(0, 50).map((u) => u.user_id);
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        const map = new Map<string, Profile>();
        (profs ?? []).forEach((p) => map.set((p as Profile).id, p as Profile));
        setProfiles(map);
      }

      setLoading(false);
    })();
  }, [period, companyFilter]);

  const companyName = useMemo(() => {
    if (companyFilter === ALL_COMPANIES) return "Todas as organizações";
    return companies.find((c) => c.id === companyFilter)?.name ?? "—";
  }, [companies, companyFilter]);

  const filteredRoutes = useMemo(() => {
    if (!data) return [];
    return data.routes.filter((r) =>
      r.route_pattern.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  // Rotas declaradas em App.tsx que NÃO aparecem em page_view_logs no período.
  // Compara contra route_pattern (forma canônica). Não filtra pelo `search`
  // textual da UI — o filtro tem outra finalidade (busca dentro de páginas
  // acessadas). Aqui mostra a lista cheia pra ser uma visão de auditoria.
  const deadRoutes = useMemo(() => {
    if (!data) return [];
    const accessed = new Set(data.routes.map((r) => r.route_pattern));
    return DECLARED_ROUTES.filter((r) => !accessed.has(r));
  }, [data]);

  const heatmapGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    if (data) {
      for (const c of data.heatmap) {
        grid[c.dow][c.hour] = c.count;
        if (c.count > max) max = c.count;
      }
    }
    return { grid, max };
  }, [data]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Visão consolidada de páginas, eventos e custo de IA. Filtro padrão:{" "}
        <span className="font-medium">{companyName}</span>.
      </p>

      {/* Filtros globais */}
      <div className="grid gap-3 md:grid-cols-3">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Organização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_COMPANIES}>Todas as organizações</SelectItem>
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
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <KpiCard label="Visualizações" value={data?.totals.page_views.toLocaleString("pt-BR") ?? "—"} />
        <KpiCard label="Usuários únicos" value={data?.totals.unique_users.toString() ?? "—"} />
        <KpiCard label="Eventos" value={data?.totals.events.toLocaleString("pt-BR") ?? "—"} />
        <KpiCard label="Chamadas IA" value={data?.totals.ai_calls.toLocaleString("pt-BR") ?? "—"} />
        <KpiCard label="Tokens IA" value={data ? fmtTokens(data.totals.ai_tokens) : "—"} />
        <KpiCard
          label="Custo IA (estim.)"
          value={data ? fmtUsd(data.totals.ai_cost_usd) : "—"}
          accent="text-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Sem dados ou erro ao carregar agregação.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="pages">Páginas ({data.routes.length})</TabsTrigger>
            <TabsTrigger value="events">Eventos ({data.eventCounts.length})</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-3 w-3 mr-1" />IA & Custos
            </TabsTrigger>
            <TabsTrigger value="usuarios-uso">Usuários ({data.users.length})</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="dead">
              Rotas mortas ({deadRoutes.length})
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Atividade ao longo do período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="views" name="Views" stroke="hsl(var(--primary))" />
                    <Line yAxisId="left" type="monotone" dataKey="events" name="Eventos" stroke="#10b981" />
                    <Line yAxisId="right" type="monotone" dataKey="cost_usd" name="Custo IA (USD)" stroke="#f59e0b" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAGES */}
          <TabsContent value="pages" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-0 max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Rota (padrão)</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                      <TableHead>Último acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Sem dados.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredRoutes.map((r) => (
                      <TableRow key={r.route_pattern}>
                        <TableCell className="font-mono text-sm">{r.route_pattern}</TableCell>
                        <TableCell className="text-right font-semibold">{r.views}</TableCell>
                        <TableCell className="text-right">{r.unique_users}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.last ? new Date(r.last).toLocaleString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.eventCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.eventCounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          Nenhum evento no período.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.eventCounts.map((e) => (
                      <TableRow key={e.event_type}>
                        <TableCell className="font-mono text-sm">{e.event_type}</TableCell>
                        <TableCell className="text-right font-semibold">{e.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI & COSTS */}
          <TabsContent value="ai" className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Custos estimados a partir da tabela de preços públicos por modelo. Lovable AI Gateway
              não publica preço unitário próprio; valores aqui são proxy para custo relativo, não
              fatura final.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Custo por modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.models}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cost" name="USD" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custo por edge function</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.functions.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="function_name" tick={{ fontSize: 9 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cost" name="USD" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalhe por edge function</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Function</TableHead>
                      <TableHead className="text-right">Chamadas</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo (USD)</TableHead>
                      <TableHead className="text-right">Latência média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.functions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma chamada de IA registrada no período.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.functions.map((f) => (
                      <TableRow key={f.function_name}>
                        <TableCell className="font-mono text-sm">{f.function_name}</TableCell>
                        <TableCell className="text-right">{f.calls}</TableCell>
                        <TableCell className="text-right">{fmtTokens(f.tokens)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtUsd(f.cost)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {f.avg_latency_ms} ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {companyFilter === ALL_COMPANIES && (
              <Card>
                <CardHeader>
                  <CardTitle>Custo por empresa</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">Custo (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.companies.map((c) => {
                        const name = c.company_id
                          ? companies.find((co) => co.id === c.company_id)?.name ?? c.company_id
                          : "(sem empresa)";
                        return (
                          <TableRow key={c.company_id ?? "null"}>
                            <TableCell>{name}</TableCell>
                            <TableCell className="text-right">{c.calls}</TableCell>
                            <TableCell className="text-right">{fmtTokens(c.tokens)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {fmtUsd(c.cost)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {data.totals.ai_errors > 0 && (
              <Card>
                <CardContent className="p-4">
                  <Badge variant="destructive">
                    {data.totals.ai_errors} chamadas com erro
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Inclui timeouts, 429 (rate limit), 402 (créditos) e erros internos do gateway.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* USERS (sub-tab dentro de Uso & Custos, distinto do tab "Usuários" do PlatformAdmin) */}
          <TabsContent value="usuarios-uso" className="mt-4">
            <Card>
              <CardContent className="p-0 max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Rotas distintas</TableHead>
                      <TableHead className="text-right">Eventos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.slice(0, 100).map((u) => {
                      const prof = profiles.get(u.user_id);
                      const label = prof?.email ?? prof?.full_name ?? null;
                      return (
                      <TableRow key={u.user_id}>
                        <TableCell className="text-sm">
                          {label ?? (
                            <span className="text-muted-foreground font-mono">
                              {u.user_id.slice(0, 8)}…
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{u.views}</TableCell>
                        <TableCell className="text-right">{u.routes}</TableCell>
                        <TableCell className="text-right">{u.events}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEAD ROUTES */}
          <TabsContent value="dead" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rotas declaradas sem acesso no período</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Lista de {DECLARED_ROUTES.length} rotas declaradas em{" "}
                  <code>App.tsx</code> comparada contra <code>route_pattern</code>{" "}
                  visto em <code>page_view_logs</code>
                  {companyFilter !== ALL_COMPANIES &&
                    " (apenas para a organização selecionada)"}
                  . Rotas listadas abaixo são candidatas a remoção — nunca foram
                  acessadas no período. Aumente o filtro de período antes de remover
                  (uma rota pode ser usada raramente, ex. trimestralmente).
                </p>
                {deadRoutes.length === 0 ? (
                  <p className="text-sm">
                    🎉 Todas as rotas declaradas tiveram pelo menos um acesso no
                    período.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[600px] overflow-auto">
                    {deadRoutes.map((r) => (
                      <Badge key={r} variant="outline" className="font-mono">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HEATMAP */}
          <TabsContent value="heatmap" className="mt-4">
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Distribuição de views por dia da semana × hora.
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
                  {heatmapGrid.grid.map((row, day) => (
                    <div key={day} className="flex items-center">
                      <div className="w-12 text-xs text-muted-foreground">
                        {dayLabels[day]}
                      </div>
                      {row.map((count, h) => {
                        const intensity = heatmapGrid.max > 0 ? count / heatmapGrid.max : 0;
                        return (
                          <div
                            key={h}
                            title={`${dayLabels[day]} ${h}h: ${count} views`}
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
        </Tabs>
      )}
    </div>
  );
};

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
