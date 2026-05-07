import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/contexts/CompanyContext";
import {
  useComplianceProfile,
  useUpsertComplianceProfile,
} from "@/hooks/useComplianceProfiles";
import { cn } from "@/lib/utils";
import { type ComplianceResponses } from "@/services/complianceProfiles";
import { COMPLIANCE_THEMES } from "./questions.config";
import {
  generateTagsFromResponses,
  isQuestionVisible,
  overallCompletionPercent,
  themeCompletionPercent,
} from "./helpers";
import type { Question, QuestionOption, Theme } from "./types";
import { useDebouncedAutosave } from "./useDebouncedAutosave";

interface ComplianceQuestionnaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
}

const formatTime = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const ThemeNav: React.FC<{
  themes: Theme[];
  responses: ComplianceResponses;
  activeIndex: number;
  onSelect: (index: number) => void;
}> = ({ themes, responses, activeIndex, onSelect }) => (
  <ScrollArea className="h-full w-full">
    <ul className="space-y-1 p-2">
      {themes.map((theme, index) => {
        const percent = themeCompletionPercent(theme, responses);
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
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2">{theme.title}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    percent === 100 ? "text-green-600" : "text-muted-foreground",
                  )}
                >
                  {percent}%
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  </ScrollArea>
);

const QuestionField: React.FC<{
  question: Question;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}> = ({ question, value, onChange }) => {
  const renderOptionRow = (option: QuestionOption, control: React.ReactNode) => (
    <div
      key={option.id}
      className="flex items-start gap-3 rounded-md border border-transparent px-3 py-2 hover:bg-muted/40"
    >
      {control}
      <Label htmlFor={`${question.id}-${option.id}`} className="cursor-pointer text-sm font-normal leading-snug">
        {option.label}
      </Label>
    </div>
  );

  if (question.type === "single") {
    const current = typeof value === "string" ? value : "";
    return (
      <RadioGroup value={current} onValueChange={onChange}>
        {question.options?.map((option) =>
          renderOptionRow(
            option,
            <RadioGroupItem id={`${question.id}-${option.id}`} value={option.id} className="mt-0.5" />,
          ),
        )}
      </RadioGroup>
    );
  }

  if (question.type === "multi") {
    const current = Array.isArray(value) ? value : [];
    const toggle = (optionId: string) => {
      const next = current.includes(optionId)
        ? current.filter((v) => v !== optionId)
        : [...current, optionId];
      onChange(next);
    };
    return (
      <div className="space-y-1">
        {question.options?.map((option) =>
          renderOptionRow(
            option,
            <Checkbox
              id={`${question.id}-${option.id}`}
              checked={current.includes(option.id)}
              onCheckedChange={() => toggle(option.id)}
              className="mt-0.5"
            />,
          ),
        )}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Digite sua resposta…"
      />
    );
  }

  return (
    <Input
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Digite sua resposta…"
    />
  );
};

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
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive" title={error ?? undefined}>
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
  branchId,
  branchName,
}) => {
  const { selectedCompany } = useCompany();
  const { data: existingProfile, isLoading } = useComplianceProfile(branchId);
  const upsertMutation = useUpsertComplianceProfile();

  const [responses, setResponses] = useState<ComplianceResponses>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!open) {
      setHydrated(false);
      setActiveIndex(0);
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

  const autosave = useDebouncedAutosave({
    branchId,
    companyId: selectedCompany?.id ?? "",
    responses,
    enabled: open && hydrated && !!selectedCompany?.id,
  });

  const overallPercent = useMemo(
    () => overallCompletionPercent(COMPLIANCE_THEMES, responses),
    [responses],
  );

  const activeTheme = COMPLIANCE_THEMES[activeIndex];
  const visibleQuestions = useMemo(
    () => activeTheme.questions.filter((q) => isQuestionVisible(q, responses)),
    [activeTheme, responses],
  );

  const setAnswer = (questionId: string, next: string | string[]) =>
    setResponses((prev) => ({ ...prev, [questionId]: next }));

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(COMPLIANCE_THEMES.length - 1, i + 1));

  const handleSubmit = async () => {
    if (!selectedCompany) return;
    const generatedTags = generateTagsFromResponses(COMPLIANCE_THEMES, responses);
    await upsertMutation.mutateAsync({
      branch_id: branchId,
      company_id: selectedCompany.id,
      responses,
      generated_tags: generatedTags,
      final: true,
    });
    setConfirmOpen(false);
    onOpenChange(false);
  };

  const previewTags = useMemo(
    () => generateTagsFromResponses(COMPLIANCE_THEMES, responses),
    [responses],
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
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Progresso geral</span>
                  <Badge variant={overallPercent === 100 ? "default" : "outline"} className="tabular-nums">
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
          </DialogHeader>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="hidden w-72 shrink-0 border-r bg-muted/20 md:block">
              <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Temas
              </div>
              <ThemeNav
                themes={COMPLIANCE_THEMES}
                responses={responses}
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
                    {visibleQuestions.length} pergunta{visibleQuestions.length === 1 ? "" : "s"} nesta seção
                  </p>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {themeCompletionPercent(activeTheme, responses)}%
                </Badge>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-5">
                  {visibleQuestions.length === 0 ? (
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
                          <Label className="text-sm font-medium leading-snug">{question.label}</Label>
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
