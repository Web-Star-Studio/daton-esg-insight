import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
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

const ALL_COMPANIES = "__all__";

const periodToFromIso = (p: Period): string => {
  const hours = p === "24h" ? 24 : p === "7d" ? 24 * 7 : p === "30d" ? 24 * 30 : 24 * 90;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
};

const fmtUsd = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const fmtTokens = (v: number) => v.toLocaleString("pt-BR");

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Aba "Custos & Infra IA" — visão técnica/finops da plataforma.
 *
 * Escopo intencionalmente restrito a:
 *   • Custo IA (modelos, edge functions, empresas)
 *   • Performance (latência por function, erros)
 *   • Auditoria (heatmap de uso, rotas declaradas sem acesso)
 *
 * Métricas de "quem usou o quê / por quanto tempo / qual feature" vivem
 * na aba "Gabardo View" (foco de negócio). Não duplicar aqui.
 */
export const UsageAnalyticsTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>(ALL_COMPANIES);
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: rows } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      setCompanies((rows as Company[]) ?? []);
    })();
  }, []);

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
      setLoading(false);
    })();
  }, [period, companyFilter]);

  const companyName = useMemo(() => {
    if (companyFilter === ALL_COMPANIES) return "Todas as organizações";
    return companies.find((c) => c.id === companyFilter)?.name ?? "—";
  }, [companies, companyFilter]);

  // Rotas declaradas em App.tsx que NÃO aparecem em page_view_logs no período.
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
        Visão técnica de custo IA, performance de edge functions e auditoria de rotas.
        Para uso por usuário/feature da Gabardo, ver aba <span className="font-medium">Gabardo View</span>.
        Escopo atual: <span className="font-medium">{companyName}</span>.
      </p>

      {/* Filtros globais */}
      <div className="grid gap-3 md:grid-cols-2">
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
      </div>

      {/* KPIs focados em custo/perf */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Custo IA (estim.)"
          value={data ? fmtUsd(data.totals.ai_cost_usd) : "—"}
          accent="text-primary"
          hint={data ? `${data.totals.ai_calls.toLocaleString("pt-BR")} chamadas` : undefined}
        />
        <KpiCard
          label="Tokens IA"
          value={data ? fmtTokens(data.totals.ai_tokens) : "—"}
        />
        <KpiCard
          label="Erros de IA"
          value={data ? data.totals.ai_errors.toLocaleString("pt-BR") : "—"}
          accent={data && data.totals.ai_errors > 0 ? "text-destructive" : undefined}
          hint="Timeouts, 429, 402 e erros internos do gateway"
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
        <Tabs defaultValue="ai">
          <TabsList className="flex-wrap">
            <TabsTrigger value="ai">IA & Custos</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap de uso</TabsTrigger>
            <TabsTrigger value="dead">Rotas mortas ({deadRoutes.length})</TabsTrigger>
          </TabsList>

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

          {/* HEATMAP */}
          <TabsContent value="heatmap" className="mt-4">
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Distribuição de views por dia da semana × hora — sazonalidade real de uso.
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
        </Tabs>
      )}
    </div>
  );
};

function KpiCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}