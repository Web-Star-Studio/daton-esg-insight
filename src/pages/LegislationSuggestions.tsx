// Página "Sugestões de Legislação" — gera, a partir do perfil de compliance
// da unidade, a lista de normas a popular a LIRA. Camada determinística
// (overlap de tags + filtro geográfico) + camada IA opcional (Perplexity).
//
// A busca roda como job em background: cada disparo cria uma run em
// `legislation_suggestion_runs`. A página mostra status (início/fim),
// resultado registrado e histórico por unidade. Runs nascem em rascunho —
// um admin publica para liberar o resultado à empresa toda.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  History,
  ListChecks,
  Loader2,
  Lock,
  Plus,
  Radar,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBranches } from "@/services/branches";
import { useCompany } from "@/contexts/CompanyContext";
import { fetchBranchReadiness } from "@/services/complianceUpdateLetters";
import {
  useAcceptSuggestions,
  usePublishSuggestionRun,
  useStartSuggestionRun,
  useSuggestionRun,
  useSuggestionRunDetail,
  useSuggestionRunHistory,
} from "@/hooks/data/useLegislationSuggestions";
import { useMonthlyRadar, useAcceptRadarNovelties } from "@/hooks/data/useLegislationRadar";
import type { RadarNovelty } from "@/services/legislationRadar";
import { APPLICABILITY_LABELS, JURISDICTION_LABELS, formatReferenceMonthLabel, siglaForTheme, titleForTheme } from "@/lib/complianceSystems";
import type { MatchedSuggestion, SuggestionRun, SuggestionRunSummary } from "@/services/legislationSuggestions";

const APPLICABILITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  real: "default",
  potential: "secondary",
  revoked: "destructive",
  na: "outline",
  pending: "outline",
};

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}min ${secs % 60}s`;
}

export default function LegislationSuggestions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchFromUrl = searchParams.get("branch") ?? "";

  const { selectedCompany } = useCompany();
  const { data: branches = [] } = useBranches();
  const { data: readinessMap } = useQuery({
    queryKey: ["compliance-update-letters", "branch-readiness", selectedCompany?.id],
    queryFn: () => fetchBranchReadiness(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
    staleTime: 1000 * 60,
  });
  const branchOptions = useMemo(
    () =>
      branches.filter((b) => {
        if (!b.status) return true;
        const s = b.status.toLowerCase();
        return s === "ativa" || s === "active" || s === "ativo";
      }),
    [branches],
  );

  // Várias filiais costumam compartilhar `name` (mesma razão social) — a
  // diferenciação vem por cidade/estado/CNPJ. Espelha o helper usado na
  // página de Cartas Mensais.
  const branchLabel = (b: { name: string; city?: string | null; state?: string | null; cnpj?: string | null; id: string }) => {
    const loc = [b.city, b.state].filter(Boolean).join(" / ");
    const parts = [b.name];
    if (loc) parts.push(loc);
    if (b.cnpj) parts.push(b.cnpj);
    if (parts.length === 1) parts.push(`#${b.id.slice(0, 8)}`);
    return parts.join(" — ");
  };

  const [selectedBranch, setSelectedBranch] = useState<string>(branchFromUrl);
  const [search, setSearch] = useState<string>("");
  const [applicabilityFilter, setApplicabilityFilter] = useState<"all" | "real" | "potential">("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "estadual" | "municipal" | "nbr" | "internacional">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // IDs aceitos nesta sessão — somem da lista (a run guardada é um snapshot
  // e não muda; o aceite só some na próxima busca).
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  // Run aberta do histórico; null = exibindo a última run da unidade.
  const [viewingRunId, setViewingRunId] = useState<string | null>(null);

  // Estado do Radar do mês: começa "off" para não disparar Perplexity
  // automaticamente. Mês default = corrente; usuário escolhe via dropdown
  // e clica "Buscar novidades" para acionar.
  const radarMonthOptions = useMemo(() => buildMonthOptions(12), []);
  const [radarMonth, setRadarMonth] = useState<string>(radarMonthOptions[0]?.value ?? "");
  const [radarEnabled, setRadarEnabled] = useState<boolean>(false);
  const [radarSelected, setRadarSelected] = useState<Set<string>>(new Set());
  const [radarOverrides, setRadarOverrides] = useState<Record<string, "real" | "potential">>({});

  useEffect(() => {
    if (selectedBranch) return;
    if (branchFromUrl && branchOptions.some((b) => b.id === branchFromUrl)) {
      setSelectedBranch(branchFromUrl);
      return;
    }
    if (branchOptions[0]?.id) setSelectedBranch(branchOptions[0].id);
  }, [branchOptions, branchFromUrl, selectedBranch]);

  useEffect(() => {
    if (!selectedBranch) return;
    if (searchParams.get("branch") !== selectedBranch) {
      const next = new URLSearchParams(searchParams);
      next.set("branch", selectedBranch);
      setSearchParams(next, { replace: true });
    }
    setSelectedIds(new Set()); // limpa seleção ao trocar de unidade
    setDismissedIds(new Set());
    setViewingRunId(null);
    // Reset do radar: ao trocar branch, querKey antiga fica enabled=true
    // e dispara novamente o agente Radar pra outra branch sem ação do
    // usuário (gasta ~$0.10 sem necessidade). Volta pra lazy-mode.
    setRadarEnabled(false);
    setRadarSelected(new Set());
    setRadarOverrides({});
  }, [selectedBranch, searchParams, setSearchParams]);

  // Mesmo motivo do reset acima: trocar mês com radarEnabled=true dispara
  // chamada nova do agente automaticamente. Reseta o flag — o usuário
  // precisa clicar "Buscar novidades" explicitamente pro novo mês.
  useEffect(() => {
    setRadarEnabled(false);
    setRadarSelected(new Set());
    setRadarOverrides({});
  }, [radarMonth]);

  const latestRunQuery = useSuggestionRun(selectedBranch || undefined);
  const historyQuery = useSuggestionRunHistory(selectedBranch || undefined);
  const runDetailQuery = useSuggestionRunDetail(viewingRunId);
  const startRun = useStartSuggestionRun(selectedBranch || undefined);
  const publishRun = usePublishSuggestionRun();
  const accept = useAcceptSuggestions(selectedBranch || undefined);

  const latestRun = latestRunQuery.data ?? null;
  // Selecionar a PRÓPRIA última run no histórico não troca para a query
  // estática (runDetailQuery, sem polling/realtime) — segue na query "ao
  // vivo", senão a página fica presa em dados 'running' velhos.
  const isViewingHistorical = !!viewingRunId && viewingRunId !== latestRun?.id;
  const activeRun: SuggestionRun | null = isViewingHistorical ? runDetailQuery.data ?? null : latestRun;
  const isRunning = activeRun?.status === "running";

  // Ao trocar a run exibida, limpa seleção/dismiss (snapshot diferente).
  useEffect(() => {
    setSelectedIds(new Set());
    setDismissedIds(new Set());
  }, [activeRun?.id]);

  // Radar — query "lazy": só dispara quando radarEnabled = true (ao clicar
  // "Buscar novidades"). Cache de 5min evita refetch acidental.
  const radar = useMonthlyRadar(
    selectedBranch || undefined,
    radarMonth || undefined,
    { enabled: radarEnabled },
  );
  const acceptRadar = useAcceptRadarNovelties(selectedBranch || undefined);

  const radarNovelties = radar.data?.novelties ?? [];
  const radarKey = (n: RadarNovelty) => `${n.norm_type}|${n.norm_number}|${n.publication_date}|${n.title.slice(0, 40)}`;
  const handleRadarSearch = () => {
    setRadarEnabled(true);
    setRadarSelected(new Set());
    radar.refetch();
  };
  const toggleRadarOne = (key: string, checked: boolean) => {
    setRadarSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };
  const toggleRadarAll = (checked: boolean) => {
    setRadarSelected(() => {
      if (!checked) return new Set();
      return new Set(radarNovelties.map(radarKey));
    });
  };
  const handleRadarAccept = async () => {
    const items = radarNovelties
      .filter((n) => radarSelected.has(radarKey(n)))
      .map((n) => ({
        ...n,
        override_applicability: radarOverrides[radarKey(n)],
      }));
    if (items.length === 0) return;
    await acceptRadar.mutateAsync(items);
    setRadarSelected(new Set());
    setRadarOverrides({});
  };

  const matched = useMemo(() => activeRun?.matched ?? [], [activeRun]);
  const discovered = activeRun?.discovered ?? [];

  const filteredMatched = useMemo(() => {
    return matched.filter((m) => {
      if (dismissedIds.has(m.legislation_id)) return false;
      if (applicabilityFilter !== "all" && m.default_applicability !== applicabilityFilter) return false;
      if (jurisdictionFilter !== "all" && m.jurisdiction.toLowerCase() !== jurisdictionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${m.title} ${m.summary ?? ""} ${m.norm_type ?? ""} ${m.norm_number ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matched, dismissedIds, applicabilityFilter, jurisdictionFilter, search]);

  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const m of filteredMatched) {
        if (checked) next.add(m.legislation_id);
        else next.delete(m.legislation_id);
      }
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allVisibleSelected = filteredMatched.length > 0 && filteredMatched.every((m) => selectedIds.has(m.legislation_id));

  const handleAccept = async () => {
    // Preserva o `default_applicability` da legislação no catálogo. Antes
    // colapsava qualquer valor !== 'real' em 'potential', perdendo 'na',
    // 'revoked' e 'pending' que `acceptSuggestions` aceita nativamente.
    const VALID_APPLICABILITIES = new Set(["real", "potential", "na", "revoked", "pending"]);
    const items = matched.filter((m) => selectedIds.has(m.legislation_id)).map((m) => {
      const raw = (m.default_applicability ?? "").toLowerCase();
      const applicability = (
        VALID_APPLICABILITIES.has(raw) ? raw : "potential"
      ) as "real" | "potential" | "na" | "revoked" | "pending";
      return { legislation_id: m.legislation_id, applicability };
    });
    if (items.length === 0) return;
    await accept.mutateAsync(items);
    setDismissedIds((prev) => {
      const next = new Set(prev);
      for (const it of items) next.add(it.legislation_id);
      return next;
    });
    setSelectedIds(new Set());
  };

  const handleStartRun = (expandAi: boolean) => {
    setViewingRunId(null);
    setSelectedIds(new Set());
    startRun.mutate(expandAi ? { expandAi: true } : {});
  };

  const readiness = selectedBranch ? readinessMap?.get(selectedBranch) : undefined;
  const noProfile = !!readiness && !readiness.profileCompletedAt;
  const runLoading = isViewingHistorical ? runDetailQuery.isLoading : latestRunQuery.isLoading;
  // Bloqueia disparar nova run se a ÚLTIMA run (não a exibida — que pode
  // ser uma run antiga do histórico) ainda estiver rodando, senão dá pra
  // disparar jobs caros em paralelo abrindo uma run completed do histórico.
  const startDisabled = startRun.isPending || latestRun?.status === "running";

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        <Helmet>
          <title>Sugestões de Legislação — Daton ESG</title>
        </Helmet>

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/licenciamento/legislacoes")}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Legislações
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Sugestões de Legislação
          </h1>
          <p className="text-muted-foreground">
            A partir do questionário de compliance da unidade, listamos legislações do catálogo que provavelmente se aplicam
            (overlap de tags + filtro geográfico). Opcionalmente, a IA propõe normas que podem não estar cadastradas ainda.
            Cada busca fica registrada — você pode revisar o que foi sugerido a qualquer momento.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unidade</CardTitle>
            <CardDescription>Escolha a unidade para gerar as sugestões.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((b) => {
                  const r = readinessMap?.get(b.id);
                  const hasProfile = !!r?.profileCompletedAt;
                  const legCount = r?.legislationCount ?? 0;
                  return (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-2">
                        <span>{branchLabel(b)}</span>
                        {hasProfile && (
                          <Badge variant="default" className="gap-1 text-[10px] py-0">
                            <CheckCircle2 className="h-3 w-3" /> Questionário
                          </Badge>
                        )}
                        {legCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {legCount} leg.
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedBranch && readinessMap && !activeRun && !runLoading && (() => {
              const legCount = readiness?.legislationCount ?? 0;
              if (noProfile) {
                return (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Unidade sem questionário concluído — sem ele, não há tags para gerar sugestões.
                  </p>
                );
              }
              return (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Questionário concluído · {legCount} legislações já vinculadas (serão excluídas das sugestões).
                </p>
              );
            })()}
            {noProfile && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  Esta unidade ainda não tem o questionário de compliance preenchido.
                  <Link
                    to="/licenciamento/legislacoes/compliance"
                    className="underline font-medium"
                  >
                    Preencher questionário →
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status da busca — quando começou, quando terminou, o que indicou. */}
        {selectedBranch && !noProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Busca de sugestões
              </CardTitle>
              <CardDescription>
                A busca roda em background — você pode fechar a aba e voltar depois; o resultado fica registrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isViewingHistorical && (
                <Alert>
                  <History className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-2 flex-wrap">
                    <span>Você está vendo uma busca do histórico ({fmtDateTime(activeRun?.started_at)}).</span>
                    <Button variant="outline" size="sm" onClick={() => setViewingRunId(null)}>
                      Voltar para a última busca
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {runLoading && !activeRun && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando última busca…
                </div>
              )}

              {!runLoading && !activeRun && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma busca de sugestões registrada para esta unidade ainda.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleStartRun(false)} disabled={startDisabled} className="gap-2">
                      {startRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Gerar sugestões
                    </Button>
                  </div>
                </div>
              )}

              {activeRun?.status === "running" && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Buscando sugestões…</p>
                    <p className="text-xs">
                      Iniciada em {fmtDateTime(activeRun.started_at)} · {Math.max(0, Math.round((Date.now() - new Date(activeRun.started_at).getTime()) / 1000))}s em andamento.
                      Camada determinística + IA via Perplexity — costuma levar 1-2 min.
                    </p>
                  </div>
                </div>
              )}

              {activeRun?.status === "failed" && (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      A busca iniciada em {fmtDateTime(activeRun.started_at)} falhou
                      {activeRun.error_text ? `: ${activeRun.error_text}` : "."}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => handleStartRun(false)} disabled={startDisabled} className="gap-2">
                    {startRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Tentar novamente
                  </Button>
                </div>
              )}

              {activeRun?.status === "completed" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>
                      Concluída em <strong>{fmtDateTime(activeRun.completed_at)}</strong>
                      {activeRun.duration_ms != null ? ` · durou ${fmtDuration(activeRun.duration_ms)}` : ""}
                      {" · "}
                      {activeRun.matched_count} no catálogo
                      {activeRun.ai_used ? ` · ${activeRun.discovered_count} pela IA` : ""}
                    </span>
                    <PublishBadge status={activeRun.publish_status} />
                  </div>
                  {activeRun.ai_failed && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        IA indisponível nesta busca{activeRun.ai_error ? ` (${activeRun.ai_error})` : ""}. As sugestões do
                        catálogo continuam válidas.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => handleStartRun(false)} disabled={startDisabled} variant="outline" className="gap-2">
                      {startRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Refazer busca
                    </Button>
                    <Button onClick={() => handleStartRun(true)} disabled={startDisabled} variant="outline" className="gap-2">
                      {startRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Refazer com IA
                    </Button>
                    {activeRun.publish_status === "draft" && (
                      <Button
                        onClick={() => publishRun.mutate(activeRun.id)}
                        disabled={publishRun.isPending}
                        className="gap-2"
                      >
                        {publishRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                        Publicar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedBranch && !noProfile && activeRun && (
          <Tabs defaultValue="catalogo" className="space-y-4">
            <TabsList>
              <TabsTrigger value="catalogo" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Catálogo
              </TabsTrigger>
              <TabsTrigger value="radar" className="gap-2">
                <Radar className="h-4 w-4" />
                Radar do mês
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalogo" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Já no catálogo
                    <span className="text-muted-foreground font-normal text-sm">({filteredMatched.length} de {matched.length})</span>
                  </CardTitle>
                  <CardDescription>Legislações cadastradas que casaram com o perfil da unidade.</CardDescription>
                </div>
                <Button
                  onClick={handleAccept}
                  disabled={selectedIds.size === 0 || accept.isPending}
                  className="gap-2"
                >
                  {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Aceitar selecionadas ({selectedIds.size})
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Input
                    placeholder="Buscar por título, número, sumário…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={applicabilityFilter} onValueChange={(v) => setApplicabilityFilter(v as typeof applicabilityFilter)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="real">Apenas Real</SelectItem>
                      <SelectItem value="potential">Apenas Potencial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={jurisdictionFilter} onValueChange={(v) => setJurisdictionFilter(v as typeof jurisdictionFilter)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas jurisdições</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="estadual">Estadual</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                      <SelectItem value="nbr">NBR</SelectItem>
                      <SelectItem value="internacional">Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando sugestões… o resultado aparece aqui ao concluir.
                  </div>
                ) : filteredMatched.length === 0 ? (
                  <div className="py-6 text-sm text-muted-foreground italic">
                    Nenhuma legislação no catálogo casa com o perfil da unidade no recorte atual.
                    {matched.length > 0 ? " (Existe match em outras combinações de filtro — ajuste acima.)" : ""}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={allVisibleSelected}
                              onCheckedChange={(c) => toggleAllVisible(!!c)}
                              aria-label="Selecionar todas visíveis"
                            />
                          </TableHead>
                          <TableHead>Legislação</TableHead>
                          <TableHead className="w-[120px]">Pré-classificação</TableHead>
                          <TableHead className="w-[110px]">Tema</TableHead>
                          <TableHead className="w-[110px]">Origem</TableHead>
                          <TableHead>Tags casadas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMatched.map((m) => (
                          <SuggestionRow
                            key={m.legislation_id}
                            m={m}
                            checked={selectedIds.has(m.legislation_id)}
                            onToggle={(c) => toggleOne(m.legislation_id, c)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Novas referências (IA)
                  <span className="text-muted-foreground font-normal text-sm">({discovered.length})</span>
                </CardTitle>
                <CardDescription>
                  Normas que a IA acha relevantes mas que talvez ainda não estejam no catálogo. Confira a fonte antes de incluir.
                  Use <strong>Refazer com IA</strong> acima para forçar uma nova busca da IA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!activeRun.ai_used ? (
                  <p className="text-sm text-muted-foreground italic">
                    A IA roda automaticamente quando há poucas sugestões do catálogo. Use “Refazer com IA” para forçar agora.
                  </p>
                ) : discovered.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    A IA não retornou novas referências para esse perfil.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {discovered.map((d, idx) => (
                      <Card key={`${d.reference}-${idx}`} className="border-dashed">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium">{d.reference}</div>
                            <Badge variant={d.applicability_hint === "real" ? "default" : "secondary"}>
                              {APPLICABILITY_LABELS[d.applicability_hint] ?? d.applicability_hint}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{d.summary}</p>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline">
                              {JURISDICTION_LABELS[d.jurisdiction_hint] ?? d.jurisdiction_hint}
                            </Badge>
                            <div className="flex gap-2 items-center">
                              {d.url && (
                                <a
                                  href={d.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline flex items-center gap-1"
                                >
                                  Fonte <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/licenciamento/legislacoes/nova?title=${encodeURIComponent(d.reference)}&summary=${encodeURIComponent(d.summary)}&jurisdiction=${encodeURIComponent(d.jurisdiction_hint)}&applicability=${encodeURIComponent(d.applicability_hint)}${d.url ? `&full_text_url=${encodeURIComponent(d.url)}` : ""}`)}
                              >
                                Adicionar ao catálogo
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="radar" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Radar className="h-5 w-5" />
                      Novidades do mês
                      {radar.data && (
                        <span className="text-muted-foreground font-normal text-sm">
                          ({radarNovelties.length})
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      A Perplexity procura normas <strong>publicadas no mês selecionado</strong> aplicáveis
                      ao perfil desta unidade (federal + estadual da UF + municipal da cidade + NBR + tratados internacionais).
                      Cada novidade tem URL canônica obrigatória — confira a fonte antes de aceitar.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={radarMonth} onValueChange={(v) => { setRadarMonth(v); setRadarSelected(new Set()); }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {radarMonthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <span className="flex items-center gap-2">
                              <span>{m.label}</span>
                              {m.inProgress && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  em curso
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleRadarSearch} disabled={radar.isFetching} className="gap-2">
                      {radar.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Buscar novidades
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRadarAccept}
                      disabled={radarSelected.size === 0 || acceptRadar.isPending}
                      className="gap-2"
                    >
                      {acceptRadar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Aceitar selecionadas ({radarSelected.size})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {radar.isFetching && (
                    <div className="flex items-center gap-2 text-muted-foreground py-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procurando novidades para {formatReferenceMonthLabel(radarMonth, "/")}…
                    </div>
                  )}
                  {radar.data?.ai_failed && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Perplexity indisponível{radar.data.ai_error ? ` (${radar.data.ai_error})` : ""}.
                      </AlertDescription>
                    </Alert>
                  )}
                  {!radar.isFetching && !radar.data && (
                    <p className="text-sm text-muted-foreground italic">
                      Selecione um mês e clique em <strong>Buscar novidades</strong> para acionar a Perplexity.
                      Cada chamada custa cerca de 1 cent (Sonar com web search). O resultado fica em cache por 5min.
                    </p>
                  )}
                  {!radar.isFetching && radar.data && radarNovelties.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      Nenhuma novidade legal encontrada para {formatReferenceMonthLabel(radarMonth, "/")} no perfil desta unidade.
                      {radar.data.duplicate_count > 0
                        ? ` (${radar.data.duplicate_count} já existiam no catálogo, ignoradas.)`
                        : ""}
                    </p>
                  )}
                  {radarNovelties.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={radarSelected.size === radarNovelties.length && radarNovelties.length > 0}
                          onCheckedChange={(c) => toggleRadarAll(!!c)}
                          aria-label="Selecionar todas"
                        />
                        <span className="text-muted-foreground">Selecionar todas ({radarNovelties.length})</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {radarNovelties.map((n) => {
                          const k = radarKey(n);
                          const checked = radarSelected.has(k);
                          const override = radarOverrides[k];
                          return (
                            <Card key={k} className={checked ? "border-primary" : "border-dashed"}>
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => toggleRadarOne(k, !!c)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium">{n.reference}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {[n.norm_type, n.norm_number ? `nº ${n.norm_number}` : null, n.publication_date]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  </div>
                                  <Badge variant={(override ?? n.applicability_hint) === "real" ? "default" : "secondary"}>
                                    {APPLICABILITY_LABELS[override ?? n.applicability_hint] ?? n.applicability_hint}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{n.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-3">{n.summary}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <Badge variant="outline">
                                    {JURISDICTION_LABELS[n.jurisdiction] ?? n.jurisdiction}
                                  </Badge>
                                  {n.issuing_body && (
                                    <Badge variant="outline">{n.issuing_body}</Badge>
                                  )}
                                  {n.matched_themes.slice(0, 3).map((tid) => {
                                    const sigla = siglaForTheme(tid);
                                    if (!sigla || sigla === "—") return null;
                                    return (
                                      <Tooltip key={tid}>
                                        <TooltipTrigger asChild>
                                          <Badge variant="secondary" className="cursor-help">{sigla}</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>{titleForTheme(tid)}</TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <a
                                    href={n.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-xs flex items-center gap-1"
                                  >
                                    Fonte oficial <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <Select
                                    value={override ?? n.applicability_hint}
                                    onValueChange={(v) =>
                                      setRadarOverrides((prev) => ({ ...prev, [k]: v as "real" | "potential" }))
                                    }
                                  >
                                    <SelectTrigger className="w-[130px] h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="real">Real</SelectItem>
                                      <SelectItem value="potential">Potencial</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Histórico de buscas — clique para revisar o que foi sugerido. */}
        {selectedBranch && !noProfile && (historyQuery.data?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de buscas
              </CardTitle>
              <CardDescription>Cada busca registrada para esta unidade. Clique para revisar o resultado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {historyQuery.data?.map((run) => (
                <RunHistoryRow
                  key={run.id}
                  run={run}
                  isActive={run.id === activeRun?.id}
                  onClick={() => setViewingRunId(run.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

function PublishBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <Badge variant="default" className="gap-1">
        <Globe className="h-3 w-3" /> Publicada
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Lock className="h-3 w-3" /> Rascunho
    </Badge>
  );
}

interface RunHistoryRowProps {
  run: SuggestionRunSummary;
  isActive: boolean;
  onClick: () => void;
}

function RunHistoryRow({ run, isActive, onClick }: RunHistoryRowProps) {
  const statusIcon =
    run.status === "running" ? (
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
    ) : run.status === "failed" ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    );
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
        isActive ? "border-primary bg-muted/50" : "border-transparent hover:bg-muted/50"
      }`}
    >
      {statusIcon}
      <span className="font-medium">{fmtDateTime(run.started_at)}</span>
      <span className="text-muted-foreground">
        {run.status === "completed"
          ? `${run.matched_count} catálogo${run.ai_used ? ` · ${run.discovered_count} IA` : ""}`
          : run.status === "running"
            ? "em andamento"
            : "falhou"}
      </span>
      {run.status === "completed" && run.duration_ms != null && (
        <span className="text-xs text-muted-foreground">{fmtDuration(run.duration_ms)}</span>
      )}
      <span className="ml-auto">
        <PublishBadge status={run.publish_status} />
      </span>
    </button>
  );
}

// Lista o mês corrente (em curso) + os 12 últimos meses como opções para
// o seletor do radar. Mês corrente fica no topo com badge "em curso".
interface MonthOption { value: string; label: string; inProgress: boolean }
function buildMonthOptions(n: number): MonthOption[] {
  const now = new Date();
  const out: MonthOption[] = [];
  for (let i = 0; i <= n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = d.toISOString().slice(0, 10);
    out.push({
      value,
      label: formatReferenceMonthLabel(value, "/"),
      inProgress: i === 0,
    });
  }
  return out;
}

interface SuggestionRowProps {
  m: MatchedSuggestion;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

function SuggestionRow({ m, checked, onToggle }: SuggestionRowProps) {
  const sigla = m.theme_id ? siglaForTheme(m.theme_id) : null;
  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={checked} onCheckedChange={(c) => onToggle(!!c)} />
      </TableCell>
      <TableCell>
        <div className="font-mono text-xs text-muted-foreground">
          {m.norm_type ? `${m.norm_type}${m.norm_number ? ` nº ${m.norm_number}` : ""}` : `#${m.legislation_id.slice(0, 8)}`}
        </div>
        <div className="font-medium">{m.title}</div>
        {m.summary && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.summary}</div>}
      </TableCell>
      <TableCell>
        <Badge variant={APPLICABILITY_VARIANT[m.default_applicability] ?? "outline"}>
          {APPLICABILITY_LABELS[m.default_applicability] ?? m.default_applicability}
        </Badge>
      </TableCell>
      <TableCell>
        {sigla ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-help">{sigla}</Badge>
            </TooltipTrigger>
            <TooltipContent>{titleForTheme(m.theme_id)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{m.origin}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {m.matched_tags.slice(0, 5).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] py-0">
              {t}
            </Badge>
          ))}
          {m.matched_tags.length > 5 && (
            <span className="text-xs text-muted-foreground">+{m.matched_tags.length - 5}</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
