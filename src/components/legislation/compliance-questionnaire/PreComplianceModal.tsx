import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Loader2,
  ScanLine,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompany } from "@/contexts/CompanyContext";
import {
  useComplianceProfile,
  useUpsertCompliancePreResponses,
} from "@/hooks/useComplianceProfiles";
import { cn } from "@/lib/utils";
import { type ComplianceResponses } from "@/services/complianceProfiles";
import { COMPLIANCE_THEMES } from "./questions.config";
import { PRE_COMPLIANCE_QUESTIONS } from "./preQuestions.config";
import { QuestionField } from "./QuestionField";
import {
  countAnsweredInTheme,
  generateTagsFromResponses,
} from "./helpers";
import {
  computeSuppression,
  keysToSuppression,
  suppressionToKeys,
  type Suppression,
} from "./suppressionRules";
import { useDebouncedAutosave } from "./useDebouncedAutosave";

interface PreComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  // Disparado depois do "Aplicar escopo". Não dispara se o usuário fechar
  // sem aplicar (rascunho pode ficar persistido, mas a supressão não).
  onApplyComplete?: (branchId: string) => void;
}

const formatTime = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const themeTitleById = (id: string): string =>
  COMPLIANCE_THEMES.find((t) => t.id === id)?.title ?? id;

const AutosaveIndicator: React.FC<{
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  error: string | null;
}> = ({ status, lastSavedAt, error }) => {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Salvando rascunho…
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        Rascunho salvo às {formatTime(lastSavedAt)}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-destructive"
        title={error ?? undefined}
      >
        <AlertCircle className="h-3 w-3" />
        Erro ao salvar rascunho
      </span>
    );
  }
  return null;
};

// Diff entre dois Suppression sets — themes que ENTRAM (vão ser ocultos a
// mais) vs SAEM (vão ser revelados a mais).
const diffThemes = (committed: Suppression, preview: Suppression) => {
  const willHide: string[] = [];
  const willReveal: string[] = [];
  for (const id of preview.themeIds) {
    if (!committed.themeIds.has(id)) willHide.push(id);
  }
  for (const id of committed.themeIds) {
    if (!preview.themeIds.has(id)) willReveal.push(id);
  }
  return { willHide, willReveal };
};

const setsEqual = <T,>(a: Set<T>, b: Set<T>): boolean => {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
};

export const PreComplianceModal: React.FC<PreComplianceModalProps> = ({
  open,
  onOpenChange,
  onApplyComplete,
  branchId,
  branchName,
}) => {
  const { selectedCompany } = useCompany();
  const { data: existingProfile, isLoading } = useComplianceProfile(branchId);
  const upsertMutation = useUpsertCompliancePreResponses();

  const [preResponses, setPreResponses] = useState<ComplianceResponses>({});
  const [hydrated, setHydrated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    if (existingProfile && !hydrated) {
      setPreResponses(existingProfile.pre_responses ?? {});
      setHydrated(true);
    } else if (!existingProfile && !isLoading && !hydrated) {
      setPreResponses({});
      setHydrated(true);
    }
  }, [open, existingProfile, isLoading, hydrated]);

  const previewSuppression = useMemo(() => computeSuppression(preResponses), [preResponses]);
  const previewSuppressedKeys = useMemo(
    () => suppressionToKeys(previewSuppression),
    [previewSuppression],
  );
  const committedSuppression = useMemo(
    () => keysToSuppression(existingProfile?.suppressed_keys ?? []),
    [existingProfile],
  );
  const existingResponses = useMemo(
    () => existingProfile?.responses ?? {},
    [existingProfile],
  );

  const { willHide, willReveal } = useMemo(
    () => diffThemes(committedSuppression, previewSuppression),
    [committedSuppression, previewSuppression],
  );

  const scopeChanged = useMemo(
    () => !setsEqual(committedSuppression.themeIds, previewSuppression.themeIds),
    [committedSuppression, previewSuppression],
  );

  const autosave = useDebouncedAutosave({
    mode: "pre",
    branchId,
    companyId: selectedCompany?.id ?? "",
    preResponses,
    enabled: open && hydrated && !!selectedCompany?.id,
  });

  const allAnswered = useMemo(
    () =>
      PRE_COMPLIANCE_QUESTIONS.every((q) => {
        const v = preResponses[q.id];
        if (Array.isArray(v)) return v.length > 0;
        return typeof v === "string" && v.trim().length > 0;
      }),
    [preResponses],
  );

  // Para a contagem de tags antes/depois: simulamos a regeneração de tags
  // com a suppression atual vs preview, usando os responses existentes.
  const currentTags = useMemo(
    () => generateTagsFromResponses(COMPLIANCE_THEMES, existingResponses, committedSuppression),
    [existingResponses, committedSuppression],
  );
  const previewTags = useMemo(
    () => generateTagsFromResponses(COMPLIANCE_THEMES, existingResponses, previewSuppression),
    [existingResponses, previewSuppression],
  );

  // Quantas respostas existentes ficariam fora do escopo se aplicarmos o preview.
  const responsesAtRisk = useMemo(() => {
    let count = 0;
    for (const themeId of willHide) {
      const theme = COMPLIANCE_THEMES.find((t) => t.id === themeId);
      if (!theme) continue;
      count += countAnsweredInTheme(theme, existingResponses);
    }
    return count;
  }, [willHide, existingResponses]);

  const setAnswer = (questionId: string, next: string | string[]) =>
    setPreResponses((prev) => ({ ...prev, [questionId]: next }));

  const handleApply = async () => {
    if (!selectedCompany) return;
    // Re-gera tags do questionário principal sob a nova suppression.
    // Mesmo que o usuário ainda não tenha respondido nada lá, isso é seguro
    // (resulta em []) e mantém o contrato com o agente de IA.
    const regeneratedTags = generateTagsFromResponses(
      COMPLIANCE_THEMES,
      existingResponses,
      previewSuppression,
    );
    // Só reseta completed_at se o escopo realmente mudou — clicar Aplicar
    // sem alterar nada (e.g., só visualizando) não deve invalidar a marca
    // de "Configurado".
    const resetCompletedAt =
      scopeChanged && existingProfile?.completed_at !== null && existingProfile !== null;
    await upsertMutation.mutateAsync({
      branch_id: branchId,
      company_id: selectedCompany.id,
      pre_responses: preResponses,
      suppressed_keys: previewSuppressedKeys,
      regenerated_tags: regeneratedTags,
      reset_completed_at: resetCompletedAt,
      final: true,
    });
    setConfirmOpen(false);
    onOpenChange(false);
    onApplyComplete?.(branchId);
  };

  const hasAnyAnswers = Object.keys(preResponses).length > 0;
  const isApplied = !setsEqual(
    committedSuppression.themeIds,
    previewSuppression.themeIds,
  )
    ? false
    : true;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  Pré-Compliance — Escopo da unidade
                </DialogTitle>
                <DialogDescription>
                  Unidade: <strong className="text-foreground">{branchName}</strong>
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                {hasAnyAnswers && !isApplied ? (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                    Rascunho não aplicado
                  </Badge>
                ) : isApplied && committedSuppression.themeIds.size > 0 ? (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                    Escopo aplicado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Sem escopo definido
                  </Badge>
                )}
                <AutosaveIndicator
                  status={autosave.status}
                  lastSavedAt={autosave.lastSavedAt}
                  error={autosave.error}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Responda este pré-questionário rápido para indicar o que está sob
              responsabilidade da unidade. Suas respostas são salvas como
              rascunho — a supressão só entra em efeito quando você clica em{" "}
              <strong>"Aplicar escopo"</strong>.
            </p>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Questions panel */}
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-5">
                {PRE_COMPLIANCE_QUESTIONS.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {question.number}
                      </span>
                      <Label className="text-sm font-medium leading-snug">{question.label}</Label>
                    </div>
                    <QuestionField
                      question={question}
                      value={preResponses[question.id]}
                      onChange={(next) => setAnswer(question.id, next)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Preview panel */}
            <aside className="hidden w-[360px] shrink-0 border-l bg-muted/20 lg:flex lg:flex-col">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Preview do impacto</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Como o questionário principal vai ficar se você aplicar este
                  escopo agora.
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4 text-sm">
                  {/* Resumo numérico */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border bg-background p-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Temas no escopo
                      </div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">
                        {COMPLIANCE_THEMES.length - previewSuppression.themeIds.size}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / {COMPLIANCE_THEMES.length}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Tags ativas
                      </div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">
                        {previewTags.length}
                        {previewTags.length !== currentTags.length && existingProfile && (
                          <span
                            className={cn(
                              "ml-1 text-xs font-normal",
                              previewTags.length < currentTags.length
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400",
                            )}
                          >
                            {previewTags.length > currentTags.length ? "+" : ""}
                            {previewTags.length - currentTags.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sem mudanças vs aplicado */}
                  {!scopeChanged && hasAnyAnswers && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200">
                      Este escopo já está aplicado. Nada vai mudar se você
                      clicar em "Aplicar escopo".
                    </div>
                  )}

                  {/* Temas que serão ocultados */}
                  {willHide.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <EyeOff className="h-3 w-3" />
                        Vão ser ocultados ({willHide.length})
                      </div>
                      <ul className="space-y-1">
                        {willHide.map((id) => {
                          const theme = COMPLIANCE_THEMES.find((t) => t.id === id);
                          const answers = theme ? countAnsweredInTheme(theme, existingResponses) : 0;
                          return (
                            <li
                              key={id}
                              className="flex items-start justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5"
                            >
                              <span className="text-sm">{themeTitleById(id)}</span>
                              {answers > 0 && (
                                <span className="shrink-0 text-[11px] text-amber-700 dark:text-amber-400">
                                  {answers} resposta{answers === 1 ? "" : "s"}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {responsesAtRisk > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Essas respostas <strong>não serão apagadas</strong> — só
                          deixam de contar para tags e progresso enquanto o tema
                          estiver fora do escopo.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Temas que serão revelados */}
                  {willReveal.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                        <Sparkles className="h-3 w-3" />
                        Vão voltar para o escopo ({willReveal.length})
                      </div>
                      <ul className="space-y-1">
                        {willReveal.map((id) => (
                          <li
                            key={id}
                            className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
                          >
                            {themeTitleById(id)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags que ganham/perdem */}
                  {existingProfile && previewTags.length !== currentTags.length && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        Mudança em tags ativas
                      </div>
                      <div className="rounded-md border bg-background p-2 text-xs">
                        {previewTags.length < currentTags.length ? (
                          <>
                            {currentTags.length - previewTags.length} tag
                            {currentTags.length - previewTags.length === 1 ? "" : "s"}{" "}
                            {currentTags.length - previewTags.length === 1 ? "vai" : "vão"} sair do
                            conjunto que alimenta o agente de IA e as sugestões
                            de legislações.
                          </>
                        ) : (
                          <>
                            {previewTags.length - currentTags.length} tag
                            {previewTags.length - currentTags.length === 1 ? "" : "s"}{" "}
                            {previewTags.length - currentTags.length === 1 ? "vai" : "vão"} entrar no
                            conjunto que alimenta o agente de IA.
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado vazio */}
                  {!hasAnyAnswers && (
                    <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                      Responda as perguntas ao lado para ver aqui o que vai ser
                      ocultado/revelado.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-background px-6 py-3">
            <div className="text-xs text-muted-foreground lg:hidden">
              {willHide.length > 0 && (
                <span>
                  {willHide.length} tema{willHide.length === 1 ? "" : "s"} serão
                  ocultados.{" "}
                </span>
              )}
              {willReveal.length > 0 && (
                <span>
                  {willReveal.length} voltarão ao escopo.{" "}
                </span>
              )}
              {!scopeChanged && hasAnyAnswers && <span>Escopo idêntico ao aplicado.</span>}
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Fechar (manter rascunho)
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={!allAnswered || upsertMutation.isPending}
                title={!allAnswered ? "Responda todas as perguntas para aplicar" : undefined}
              >
                Aplicar escopo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar este escopo agora?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {willHide.length === 0 && willReveal.length === 0 ? (
                  <p>
                    O escopo selecionado é idêntico ao já aplicado. Nada vai
                    mudar no questionário principal.
                  </p>
                ) : (
                  <>
                    {willHide.length > 0 && (
                      <p>
                        <strong>{willHide.length} tema{willHide.length === 1 ? "" : "s"}</strong>{" "}
                        {willHide.length === 1 ? "será ocultado" : "serão ocultados"} no
                        questionário principal.
                      </p>
                    )}
                    {willReveal.length > 0 && (
                      <p>
                        <strong>{willReveal.length} tema{willReveal.length === 1 ? "" : "s"}</strong>{" "}
                        {willReveal.length === 1 ? "vai voltar" : "vão voltar"} para o escopo.
                      </p>
                    )}
                    {responsesAtRisk > 0 && (
                      <p className="text-amber-600 dark:text-amber-400">
                        {responsesAtRisk} resposta{responsesAtRisk === 1 ? "" : "s"} já preenchida
                        {responsesAtRisk === 1 ? "" : "s"} no questionário principal{" "}
                        {responsesAtRisk === 1 ? "ficará" : "ficarão"} fora do escopo.{" "}
                        <strong>Elas serão preservadas no banco</strong>, mas não
                        contam para tags ou progresso até voltarem ao escopo.
                      </p>
                    )}
                    {scopeChanged && existingProfile?.completed_at && (
                      <p className="text-amber-600 dark:text-amber-400">
                        A marca de "Configurado" será removida; revise o
                        questionário principal e reenvie para regerar as tags
                        definitivas.
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Aplicando…" : "Aplicar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
