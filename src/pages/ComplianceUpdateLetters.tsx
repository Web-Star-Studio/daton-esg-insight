// Página da feature "Carta de Atualização Mensal de Compliance".
// Lista cartas geradas por unidade + permite gerar uma nova.
// Layout segue o padrão das outras páginas dentro de /licenciamento/legislacoes
// (ver LegislationReports.tsx, LegislationsHub.tsx).

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranches } from "@/services/branches";
import { useCompany } from "@/contexts/CompanyContext";
import { fetchBranchReadiness } from "@/services/complianceUpdateLetters";
import {
  useComplianceUpdateLetter,
  useComplianceUpdateLetters,
} from "@/hooks/data/useComplianceUpdateLetters";
import { ComplianceUpdateLetterViewer } from "@/components/compliance/ComplianceUpdateLetterViewer";
import { formatReferenceMonthLabel } from "@/lib/complianceSystems";

// Lista o mês corrente (em curso) + os 12 últimos meses como opções para o
// seletor de geração. O mês corrente é útil para teste e para gerar prévias
// parciais; o dropdown sinaliza o estado.
interface MonthOption { value: string; label: string; inProgress: boolean }
function generateMonthOptions(n: number): MonthOption[] {
  const now = new Date();
  const out: MonthOption[] = [];
  for (let i = 0; i <= n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = d.toISOString().slice(0, 10);
    // formatReferenceMonthLabel é UTC-safe (parsing manual do ISO).
    // `format()` do date-fns aplica timezone local — em BRT (UTC-3) o
    // dia 1 UTC vira dia 30 do mês anterior local, e o label rola pra trás.
    const label = formatReferenceMonthLabel(value, "de");
    out.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      inProgress: i === 0,
    });
  }
  return out;
}

const MONTH_OPTIONS = generateMonthOptions(12);

export default function ComplianceUpdateLetters() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { selectedCompany } = useCompany();
  const { data: branches = [] } = useBranches();
  const { data: readinessMap } = useQuery({
    queryKey: ["compliance-update-letters", "branch-readiness", selectedCompany?.id],
    queryFn: () => fetchBranchReadiness(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
    staleTime: 1000 * 60,
  });
  // Aceita variantes do schema atual ("Ativa"/"active"). Inativas saem do
  // seletor — geração mensal não faz sentido pra elas.
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
  // diferenciação vem por cidade/estado/CNPJ. Monta um label único.
  const branchLabel = (b: { name: string; city?: string | null; state?: string | null; cnpj?: string | null; id: string }) => {
    const loc = [b.city, b.state].filter(Boolean).join(" / ");
    const parts = [b.name];
    if (loc) parts.push(loc);
    if (b.cnpj) parts.push(b.cnpj);
    if (parts.length === 1) parts.push(`#${b.id.slice(0, 8)}`);
    return parts.join(" — ");
  };

  const branchFromUrl = searchParams.get("branch") ?? "";
  const letterFromUrl = searchParams.get("letter") ?? "";
  const [selectedBranch, setSelectedBranch] = useState<string>(branchFromUrl);

  // Sincroniza seleção com a URL, mantendo deep-link. Default: primeira branch.
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
  }, [selectedBranch, searchParams, setSearchParams]);

  const {
    letters,
    isLoading,
    generateAsync,
    isGenerating,
  } = useComplianceUpdateLetters(selectedBranch || undefined);

  const { data: detailLetter } = useComplianceUpdateLetter(letterFromUrl || undefined);

  const [generateOpen, setGenerateOpen] = useState(false);
  // Default: mês anterior fechado, não o em curso — evita gerar carta parcial
  // sem intenção. Para mês corrente, o usuário escolhe explicitamente.
  const [genMonth, setGenMonth] = useState<string>(MONTH_OPTIONS[1]?.value ?? MONTH_OPTIONS[0]?.value ?? "");

  const handleGenerate = async () => {
    if (!selectedBranch || !genMonth) return;
    const result = await generateAsync({
      branchId: selectedBranch,
      referenceMonth: new Date(`${genMonth}T00:00:00Z`),
    });
    setGenerateOpen(false);
    const next = new URLSearchParams(searchParams);
    next.set("branch", selectedBranch);
    next.set("letter", result.id);
    setSearchParams(next, { replace: false });
  };

  // Exibe viewer quando uma carta está selecionada.
  if (letterFromUrl) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Helmet>
          <title>Carta de Atualização — Daton ESG</title>
        </Helmet>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.delete("letter");
            setSearchParams(next, { replace: false });
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista
        </Button>
        {detailLetter ? (
          <ComplianceUpdateLetterViewer
            content={detailLetter.content}
            generatorName={detailLetter.generator_name ?? null}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Carregando carta…
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Helmet>
        <title>Cartas de Atualização Mensal — Daton ESG</title>
      </Helmet>

      <div className="flex items-center justify-between flex-wrap gap-4">
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
            <FileText className="h-7 w-7 text-primary" />
            Cartas de Atualização Mensal
          </h1>
          <p className="text-muted-foreground">
            Relatório mensal por unidade com as legislações publicadas, alteradas, revogadas, excluídas
            e incluídas por revisão no mês.
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="gap-2" disabled={!selectedBranch}>
          <Plus className="h-4 w-4" />
          Gerar nova carta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidade</CardTitle>
          <CardDescription>Selecione a unidade para visualizar as cartas geradas.</CardDescription>
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
          {selectedBranch && readinessMap && (() => {
            const r = readinessMap.get(selectedBranch);
            const hasProfile = !!r?.profileCompletedAt;
            const legCount = r?.legislationCount ?? 0;
            if (hasProfile && legCount > 0) {
              return (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Unidade pronta para teste — questionário concluído e {legCount} legislações vinculadas.
                </p>
              );
            }
            if (hasProfile && legCount === 0) {
              return (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Questionário concluído mas nenhuma legislação foi vinculada ainda — a carta sairá vazia.
                </p>
              );
            }
            if (!hasProfile && legCount > 0) {
              return (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Sem questionário, mas há {legCount} legislações vinculadas — a carta vai listar mudanças do mês mesmo assim, sem o filtro do perfil.
                </p>
              );
            }
            return (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unidade sem questionário e sem legislações vinculadas — não há o que reportar.
              </p>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cartas geradas</CardTitle>
          <CardDescription>
            {selectedBranch
              ? "Lista de cartas já geradas para esta unidade, mais recentes primeiro."
              : "Selecione uma unidade acima para listar as cartas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedBranch ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground italic">
              Nenhuma unidade selecionada.
            </div>
          ) : isLoading ? (
            <div className="px-6 pb-6 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : letters.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground italic">
              Nenhuma carta gerada para esta unidade ainda. Use "Gerar nova carta" para criar a primeira.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês de referência</TableHead>
                    <TableHead>Gerada em</TableHead>
                    <TableHead>Gerada por</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.map((letter) => {
                    // UTC-safe via formatReferenceMonthLabel (parsing manual
                    // do ISO). `format()` do date-fns aplicaria timezone
                    // local — bug recorrente, ver fix em generateMonthOptions.
                    const monthLabel = formatReferenceMonthLabel(letter.reference_month, "de");
                    const total =
                      (letter.content?.sections?.published?.length ?? 0) +
                      (letter.content?.sections?.modified?.length ?? 0) +
                      (letter.content?.sections?.revoked?.length ?? 0) +
                      (letter.content?.sections?.excluded?.length ?? 0) +
                      (letter.content?.sections?.included_by_review?.length ?? 0) +
                      (letter.content?.sections?.external_changes?.length ?? 0);
                    return (
                      <TableRow key={letter.id}>
                        <TableCell className="capitalize font-medium">{monthLabel}</TableCell>
                        <TableCell>
                          {format(new Date(letter.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{letter.generator_name ?? "—"}</TableCell>
                        <TableCell>{total} alterações no mês</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const next = new URLSearchParams(searchParams);
                              next.set("branch", selectedBranch);
                              next.set("letter", letter.id);
                              setSearchParams(next, { replace: false });
                            }}
                          >
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar nova carta</DialogTitle>
            <DialogDescription>
              Escolha o mês de referência. Se já existir uma carta para o mesmo mês, ela será sobrescrita
              com o conteúdo atual do banco.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de referência</label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
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
              {MONTH_OPTIONS.find((m) => m.value === genMonth)?.inProgress && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Mês ainda em curso — a carta sairá parcial e poderá ser regenerada ao final do mês.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={isGenerating}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || !genMonth} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
