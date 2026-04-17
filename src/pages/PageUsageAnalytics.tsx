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

type Stat = {
  pathname: string;
  company_id: string | null;
  views: number;
  unique_users: number;
  last_viewed_at: string | null;
};

type Company = { id: string; name: string };

const ALL_COMPANIES = "__all__";
const NO_COMPANY = "__none__";

/**
 * Coleta todos os paths estáticos definidos em ROUTE_PATHS
 * (ignora factories de rota como LICENSE_DETAIL(id))
 */
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

const PageUsageAnalytics = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>(ALL_COMPANIES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [statsRes, companiesRes] = await Promise.all([
        supabase.from("page_view_stats_90d").select("*"),
        supabase.from("companies").select("id, name").order("name"),
      ]);
      setStats((statsRes.data as Stat[]) ?? []);
      setCompanies((companiesRes.data as Company[]) ?? []);
      setLoading(false);
    })();
  }, []);

  // Agregação: views/users por path, respeitando o filtro de organização
  const aggregated = useMemo(() => {
    const filtered = stats.filter((s) => {
      if (companyFilter === ALL_COMPANIES) return true;
      if (companyFilter === NO_COMPANY) return s.company_id === null;
      return s.company_id === companyFilter;
    });
    const map = new Map<string, { views: number; unique_users: number; last: string | null }>();
    for (const row of filtered) {
      const cur = map.get(row.pathname) ?? { views: 0, unique_users: 0, last: null };
      cur.views += row.views;
      cur.unique_users += row.unique_users;
      if (!cur.last || (row.last_viewed_at && row.last_viewed_at > cur.last)) {
        cur.last = row.last_viewed_at;
      }
      map.set(row.pathname, cur);
    }
    return map;
  }, [stats, companyFilter]);

  const declaredPaths = useMemo(() => collectStaticPaths(), []);

  const used = useMemo(
    () =>
      Array.from(aggregated.entries())
        .map(([pathname, v]) => ({ pathname, ...v }))
        .sort((a, b) => b.views - a.views)
        .filter((r) => r.pathname.toLowerCase().includes(search.toLowerCase())),
    [aggregated, search]
  );

  const unused = useMemo(
    () =>
      declaredPaths
        .filter((p) => !aggregated.has(p))
        .filter((p) => p.toLowerCase().includes(search.toLowerCase())),
    [declaredPaths, aggregated, search]
  );

  const totalViews = used.reduce((acc, r) => acc + r.views, 0);

  return (
    <>
      <Helmet>
        <title>Análise de Uso de Páginas | Admin</title>
        <meta
          name="description"
          content="Ranking de páginas mais e menos acessadas dos últimos 90 dias por organização."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Análise de Uso de Páginas</h1>
          <p className="text-muted-foreground">
            Ranking de acessos dos últimos 90 dias. Identifique rotas pouco usadas ou totalmente
            inativas para orientar a depreciação de funcionalidades.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total de visualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalViews.toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rotas com tráfego</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{aggregated.size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rotas sem acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{unused.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {declaredPaths.length} rotas declaradas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por caminho..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="sm:w-80">
              <SelectValue placeholder="Filtrar por organização" />
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="used">
            <TabsList>
              <TabsTrigger value="used">Mais acessadas ({used.length})</TabsTrigger>
              <TabsTrigger value="unused">Sem acesso ({unused.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="used" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rota</TableHead>
                        <TableHead className="text-right">Visualizações</TableHead>
                        <TableHead className="text-right">Usuários únicos</TableHead>
                        <TableHead>Último acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {used.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum dado para o filtro selecionado.
                          </TableCell>
                        </TableRow>
                      )}
                      {used.map((r) => (
                        <TableRow key={r.pathname}>
                          <TableCell className="font-mono text-sm">{r.pathname}</TableCell>
                          <TableCell className="text-right font-semibold">{r.views}</TableCell>
                          <TableCell className="text-right">{r.unique_users}</TableCell>
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

            <TabsContent value="unused" className="mt-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Rotas declaradas em <code>ROUTE_PATHS</code> sem nenhum acesso registrado nos
                    últimos 90 dias
                    {companyFilter !== ALL_COMPANIES && " (para a organização selecionada)"}.
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
