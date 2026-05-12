import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ScanLine,
  Trash2,
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompany } from "@/contexts/CompanyContext";
import {
  useComplianceProfile,
  useUpdateComplianceResponses,
  useUpsertComplianceProfile,
} from "@/hooks/useComplianceProfiles";
import { cn } from "@/lib/utils";
import { type ComplianceResponses } from "@/services/complianceProfiles";
import { COMPLIANCE_THEMES } from "./questions.config";
import { QuestionField } from "./QuestionField";
import {
  countStaleAnswers,
  generateTagsFromResponses,
  isQuestionVisible,
  isThemeSuppressed,
  overallCompletionPercent,
  stripSuppressedAnswers,
  themeCompletionPercent,
} from "./helpers";
import { keysToSuppression, type Suppression } from "./suppressionRules";
import type { Theme } from "./types";
import { useDebouncedAutosave } from "./useDebouncedAutosave";

interface ComplianceQuestionnaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  // Disparado após o submit final do questionário, antes do modal fechar.
  // Caller usa isso para deeplinkar para a página de Sugestões e mostrar
  // um CTA tipo "X legislações sugeridas — revisar agora?".
  onSubmitComplete?: (branchId: string, generatedTags: string[]) => void;
  onEditScope?: (branchId: string) => void;
}

const formatTime = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const ThemeNav: React.FC<{
  themes: Theme[];
  responses: ComplianceResponses;
  suppression: Suppression;
  activeIndex: number;
  onSelect: (index: number) => void;
}> = ({ themes, responses, suppression, activeIndex, onSelect }) => (
  <ScrollArea className="h-full w-full">
    <ul className="space-y-1 p-2">
      {themes.map((theme, index) => {
        const suppressed = isThemeSuppressed(theme, suppression);
        const percent = themeCompletionPercent(theme, responses, suppression);
        const isActive = index === activeIndex;
        return (
          <li key={theme.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "border-primary/30 bg-primary/10 font-medium text-foreground"
                  : "hover:bg-muted/60 text-muted-foreground",
                suppressed && !isActive && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2">{theme.title}</span>
                {suppressed ? (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Fora do escopo
                  </span>
                ) : (
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      percent === 100 ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    {percent}%
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  </ScrollArea>
);

const AutosaveIndicator: React.FC<{
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  error: string | null;
}> = ({ status, lastSavedAt, error }) => {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Salvando…
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        Salvo às {formatTime(lastSavedAt)}
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
        Erro ao salvar
      </span>
    );
  }
  return null;
};

export const ComplianceQuestionnaireModal: React.FC<ComplianceQuestionnaireModalProps> = ({
  open,
  onOpenChange,
  onSubmitComplete,
  onEditScope,
  branchId,
  branchName,
}) => {
  const { selectedCompany } = useCompany();
  const { data: existingProfile, isLoading } = useComplianceProfile(branchId);
  const upsertMutation = useUpsertComplianceProfile();
  const updateResponsesMutation = useUpdateComplianceResponses();

  const [responses, setResponses] = useState<ComplianceResponses>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [revealedThemes, setRevealedThemes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setHydrated(false);
      setActiveIndex(0);
      setRevealedThemes(new Set());
      return;
    }
    if (existingProfile && !hydrated) {
      setResponses(existingProfile.responses ?? {});
      setHydrated(true);
    } else if (!existingProfile && !isLoading && !hydrated) {
      setResponses({});
      setHydrated(true);
    }
  }, [open, existingProfile, isLoading, hydrated]);

  const suppression = useMemo(
    () => keysToSuppression(existingProfile?.suppressed_keys ?? []),
    [existingProfile],
  );

  const autosave = useDebouncedAutosave({
    branchId,
    companyId: selectedCompany?.id ?? "",
    responses,
    enabled: open && hydrated && !!selectedCompany?.id,
  });

  const overallPercent = useMemo(
    () => overallCompletionPercent(COMPLIANCE_THEMES, responses, suppression),
    [responses, suppression],
  );

  const activeTheme = COMPLIANCE_THEMES[activeIndex];
  const activeThemeSuppressed = isThemeSuppressed(activeTheme, suppression);
  const activeThemeRevealed = revealedThemes.has(activeTheme.id);

  const visibleQuestions = useMemo(
    () => activeTheme.questions.filter((q) => isQuestionVisible(q, responses, suppression)),
    [activeTheme, responses, suppression],
  );

  // Quando o tema é suprimido mas o user clicou "Mostrar mesmo assim",
  // mostramos todas as perguntas (incluindo as que normalmente estariam
  // ocultas por showIf? Não — mantemos showIf, só ignoramos a supressão
  // de tema para esta visualização de auditoria).
  const revealedQuestions = useMemo(() => {
    if (!activeThemeSuppressed || !activeThemeRevealed) return [];
    const lightSuppression: Suppression = {
      themeIds: new Set(),
      questionIds: suppression.questionIds,
    };
    return activeTheme.questions.filter((q) => isQuestionVisible(q, responses, lightSuppression));
  }, [activeTheme, activeThemeSuppressed, activeThemeRevealed, responses, suppression]);

  const staleCount = useMemo(
    () => countStaleAnswers(COMPLIANCE_THEMES, responses, suppression),
    [responses, suppression],
  );

  const setAnswer = (questionId: string, next: string | string[]) =>
    setResponses((prev) => ({ ...prev, [questionId]: next }));

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setActiveIndex((i) => Math.min(COMPLIANCE_THEMES.length - 1, i + 1));

  const handleSubmit = async () => {
    if (!selectedCompany) return;
    const generatedTags = generateTagsFromResponses(
      COMPLIANCE_THEMES,
      responses,
      suppression,
    );
    await upsertMutation.mutateAsync({
      branch_id: branchId,
      company_id: selectedCompany.id,
      responses,
      generated_tags: generatedTags,
      final: true,
    });
    setConfirmOpen(false);
    onOpenChange(false);
    onSubmitComplete?.(branchId, generatedTags);
  };

  const handleStripStale = async () => {
    if (!selectedCompany) return;
    const cleaned = stripSuppressedAnswers(COMPLIANCE_THEMES, responses, suppression);
    setResponses(cleaned);
    const regeneratedTags = generateTagsFromResponses(
      COMPLIANCE_THEMES,
      cleaned,
      suppression,
    );
    await updateResponsesMutation.mutateAsync({
      branch_id: branchId,
      company_id: selectedCompany.id,
      responses: cleaned,
      regenerated_tags: regeneratedTags,
    });
  };

  const previewTags = useMemo(
    () => generateTagsFromResponses(COMPLIANCE_THEMES, responses, suppression),
    [responses, suppression],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle>Questionário de Compliance</DialogTitle>
                <DialogDescription>
                  Unidade: <strong className="text-foreground">{branchName}</strong>
                  {suppression.themeIds.size > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      · {suppression.themeIds.size} tema
                      {suppression.themeIds.size === 1 ? "" : "s"} fora do escopo
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  {onEditScope && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onEditScope(branchId)}
                    >
                      <ScanLine className="mr-1 h-3 w-3" />
                      Editar escopo
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">Progresso geral</span>
                  <Badge
                    variant={overallPercent === 100 ? "default" : "outline"}
                    className="tabular-nums"
                  >
                    {overallPercent}%
                  </Badge>
                </div>
                <AutosaveIndicator
                  status={autosave.status}
                  lastSavedAt={autosave.lastSavedAt}
                  error={autosave.error}
                />
              </div>
            </div>
            <Progress value={overallPercent} className="mt-3 h-1.5" />
            {staleCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <span>
                  {staleCount} resposta{staleCount === 1 ? "" : "s"} existente
                  {staleCount === 1 ? "" : "s"} {staleCount === 1 ? "está" : "estão"} fora do
                  escopo atual da unidade. {staleCount === 1 ? "Ela" : "Elas"} não
                  contam para tags ou progresso.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
                  onClick={handleStripStale}
                  disabled={updateResponsesMutation.isPending}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Limpar respostas fora do escopo
                </Button>
              </div>
            )}
          </DialogHeader>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="hidden w-72 shrink-0 border-r bg-muted/20 md:block">
              <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Temas
              </div>
              <ThemeNav
                themes={COMPLIANCE_THEMES}
                responses={responses}
                suppression={suppression}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </aside>

            <main className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b px-6 py-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    {activeTheme.number}. {activeTheme.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeThemeSuppressed
                      ? "Tema fora do escopo desta unidade"
                      : `${visibleQuestions.length} pergunta${
                          visibleQuestions.length === 1 ? "" : "s"
                        } nesta seção`}
                  </p>
                </div>
                {activeThemeSuppressed ? (
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    Fora do escopo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="tabular-nums">
                    {themeCompletionPercent(activeTheme, responses, suppression)}%
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-5">
                  {activeThemeSuppressed && !activeThemeRevealed ? (
                    <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-sm">
                      <p className="text-muted-foreground">
                        Este tema foi marcado como fora do escopo desta unidade
                        com base no Pré-Compliance. As perguntas estão ocultas
                        e não contam para o progresso nem para a geração de
                        tags.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {onEditScope && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditScope(branchId)}
                          >
                            <ScanLine className="mr-1 h-3 w-3" />
                            Editar escopo da unidade
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRevealedThemes((prev) => new Set(prev).add(activeTheme.id))
                          }
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Mostrar mesmo assim
                        </Button>
                      </div>
                    </div>
                  ) : activeThemeSuppressed && activeThemeRevealed ? (
                    <>
                      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                        Tema fora do escopo — exibido apenas para inspeção.
                        Respostas aqui não contam para tags nem progresso.
                      </div>
                      {revealedQuestions.map((question) => (
                        <div key={question.id} className="space-y-2 opacity-80">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                              {question.number}
                            </span>
                            <Label className="text-sm font-medium leading-snug">
                              {question.label}
                            </Label>
                          </div>
                          <QuestionField
                            question={question}
                            value={responses[question.id]}
                            onChange={(next) => setAnswer(question.id, next)}
                          />
                        </div>
                      ))}
                    </>
                  ) : visibleQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma pergunta aplicável a partir das respostas anteriores.
                    </p>
                  ) : (
                    visibleQuestions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                            {question.number}
                          </span>
                          <Label className="text-sm font-medium leading-snug">
                            {question.label}
                          </Label>
                        </div>
                        <QuestionField
                          question={question}
                          value={responses[question.id]}
                          onChange={(next) => setAnswer(question.id, next)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-background px-6 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goPrev} disabled={activeIndex === 0}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Tema anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goNext}
                    disabled={activeIndex === COMPLIANCE_THEMES.length - 1}
                  >
                    Próximo tema
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    disabled={overallPercent < 100 || upsertMutation.isPending}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Enviar questionário
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar questionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao enviar, as respostas serão consolidadas e {previewTags.length} tag
              {previewTags.length === 1 ? "" : "s"} de compliance serão geradas para a unidade. Você poderá
              reabrir o questionário e atualizar as respostas a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {previewTags.length > 0 && (
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-2">
              {previewTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Enviando…" : "Enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
