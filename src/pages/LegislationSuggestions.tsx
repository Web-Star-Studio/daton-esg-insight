// Página "Sugestões de Legislação" — gera, a partir do perfil de compliance
// da unidade, a lista de normas a popular a LIRA. Camada determinística
// (overlap de tags + filtro geográfico) + camada IA opcional (Perplexity).

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Plus, RefreshCw, Sparkles, AlertCircle, CheckCircle2, ListChecks, Radar } from "lucide-react";
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
import { useLegislationSuggestions, useAcceptSuggestions } from "@/hooks/data/useLegislationSuggestions";
import { useMonthlyRadar, useAcceptRadarNovelties } from "@/hooks/data/useLegislationRadar";
import type { RadarNovelty } from "@/services/legislationRadar";
import { APPLICABILITY_LABELS, JURISDICTION_LABELS, formatReferenceMonthLabel, siglaForTheme, titleForTheme } from "@/lib/complianceSystems";
import type { MatchedSuggestion } from "@/services/legislationSuggestions";

const APPLICABILITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  real: "default",
  potential: "secondary",
  revoked: "destructive",
  na: "outline",
  pending: "outline",
};

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
  const [expandAi, setExpandAi] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [applicabilityFilter, setApplicabilityFilter] = useState<"all" | "real" | "potential">("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "estadual" | "municipal" | "nbr" | "internacional">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  }, [selectedBranch, searchParams, setSearchParams]);

  const { data: response, isLoading, refetch, isFetching } = useLegislationSuggestions(
    selectedBranch || undefined,
    expandAi,
  );
  const accept = useAcceptSuggestions(selectedBranch || undefined);

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

  const matched = useMemo(() => response?.matched ?? [], [response]);
  const discovered = response?.discovered ?? [];
  const branchInfo = response?.branch;

  const filteredMatched = useMemo(() => {
    return matched.filter((m) => {
      if (applicabilityFilter !== "all" && m.default_applicability !== applicabilityFilter) return false;
      if (jurisdictionFilter !== "all" && m.jurisdiction.toLowerCase() !== jurisdictionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${m.title} ${m.summary ?? ""} ${m.norm_type ?? ""} ${m.norm_number ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matched, applicabilityFilter, jurisdictionFilter, search]);

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
    const items = matched.filter((m) => selectedIds.has(m.legislation_id)).map((m) => ({
      legislation_id: m.legislation_id,
      applicability: (m.default_applicability === "real"
        ? "real"
        : m.default_applicability === "potential"
        ? "potential"
        : "potential") as "real" | "potential",
    }));
    if (items.length === 0) return;
    await accept.mutateAsync(items);
    setSelectedIds(new Set());
  };

  const noProfile = response?.error === "questionnaire-not-completed";

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
                  const readiness = readinessMap?.get(b.id);
                  const hasProfile = !!readiness?.profileCompletedAt;
                  const legCount = readiness?.legislationCount ?? 0;
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
            {selectedBranch && readinessMap && !response && (() => {
              const r = readinessMap.get(selectedBranch);
              const hasProfile = !!r?.profileCompletedAt;
              const legCount = r?.legislationCount ?? 0;
              if (!hasProfile) {
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
            {response && branchInfo && !noProfile && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Perfil com {response.profile.tag_count} tags. {matched.length} legislações casadas no catálogo
                {response.ai_used ? ` · ${discovered.length} sugeridas pela IA` : ""}.
              </p>
            )}
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
            {response?.ai_failed && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  IA indisponível neste momento{response.ai_error ? ` (${response.ai_error})` : ""}. As sugestões do
                  catálogo continuam aparecendo normalmente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {!noProfile && response && (
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Atualizar
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={selectedIds.size === 0 || accept.isPending}
                    className="gap-2"
                  >
                    {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Aceitar selecionadas ({selectedIds.size})
                  </Button>
                </div>
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

                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculando sugestões…
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
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Novas referências (IA)
                    <span className="text-muted-foreground font-normal text-sm">({discovered.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Normas que a IA acha relevantes mas que talvez ainda não estejam no catálogo. Confira a fonte antes de incluir.
                  </CardDescription>
                </div>
                {!response.ai_used && (
                  <Button
                    variant="outline"
                    onClick={() => setExpandAi(true)}
                    disabled={isFetching}
                    className="gap-2"
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Buscar com IA
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!response.ai_used ? (
                  <p className="text-sm text-muted-foreground italic">
                    A IA roda automaticamente quando há poucas sugestões do catálogo. Use o botão acima para forçar agora.
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
      </div>
    </TooltipProvider>
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
