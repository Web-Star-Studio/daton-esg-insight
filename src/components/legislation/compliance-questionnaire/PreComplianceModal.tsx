import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ScanLine } from "lucide-react";
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
import { type ComplianceResponses } from "@/services/complianceProfiles";
import { COMPLIANCE_THEMES } from "./questions.config";
import { PRE_COMPLIANCE_QUESTIONS } from "./preQuestions.config";
import { QuestionField } from "./QuestionField";
import {
  countStaleAnswers,
  generateTagsFromResponses,
} from "./helpers";
import {
  computeSuppression,
  keysToSuppression,
  suppressionToKeys,
} from "./suppressionRules";
import { useDebouncedAutosave } from "./useDebouncedAutosave";

interface PreComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  onSubmitComplete?: (branchId: string) => void;
}

const formatTime = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

export const PreComplianceModal: React.FC<PreComplianceModalProps> = ({
  open,
  onOpenChange,
  onSubmitComplete,
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

  const suppression = useMemo(() => computeSuppression(preResponses), [preResponses]);
  const suppressedKeys = useMemo(() => suppressionToKeys(suppression), [suppression]);

  const autosave = useDebouncedAutosave({
    mode: "pre",
    branchId,
    companyId: selectedCompany?.id ?? "",
    preResponses,
    suppressedKeys,
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

  const existingResponses = useMemo(
    () => existingProfile?.responses ?? {},
    [existingProfile],
  );
  const previousSuppression = useMemo(
    () => keysToSuppression(existingProfile?.suppressed_keys ?? []),
    [existingProfile],
  );

  // Quantas respostas do questionário principal que estavam contadas antes
  // (sob a suppression anterior) vão sair de escopo com a nova suppression.
  // Só conta se a unidade tinha algum responses; em primeira execução é 0.
  const newlyStaleCount = useMemo(() => {
    if (Object.keys(existingResponses).length === 0) return 0;
    const before = countStaleAnswers(COMPLIANCE_THEMES, existingResponses, previousSuppression);
    const after = countStaleAnswers(COMPLIANCE_THEMES, existingResponses, suppression);
    return Math.max(0, after - before);
  }, [existingResponses, previousSuppression, suppression]);

  const setAnswer = (questionId: string, next: string | string[]) =>
    setPreResponses((prev) => ({ ...prev, [questionId]: next }));

  const handleSubmit = async () => {
    if (!selectedCompany) return;
    // Re-gera tags do questionário principal sob a nova suppression.
    // Mesmo que o usuário ainda não tenha respondido nada lá, isso é
    // seguro (resulta em []) e mantém o contrato com o agente de IA.
    const regeneratedTags = generateTagsFromResponses(
      COMPLIANCE_THEMES,
      existingResponses,
      suppression,
    );
    await upsertMutation.mutateAsync({
      branch_id: branchId,
      company_id: selectedCompany.id,
      pre_responses: preResponses,
      suppressed_keys: suppressedKeys,
      final: true,
      regenerated_tags: regeneratedTags,
    });
    setConfirmOpen(false);
    onOpenChange(false);
    onSubmitComplete?.(branchId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-3xl flex-col gap-0 overflow-hidden p-0">
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
                <Badge variant="outline" className="text-xs">
                  Etapa 1 de 2
                </Badge>
                <AutosaveIndicator
                  status={autosave.status}
                  lastSavedAt={autosave.lastSavedAt}
                  error={autosave.error}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Responda este pré-questionário rápido para indicar o que está sob
              responsabilidade da unidade. As respostas ocultam temas
              irrelevantes do questionário principal, evitando perguntas que
              não se aplicam.
            </p>
          </DialogHeader>

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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-background px-6 py-3">
            <div className="text-xs text-muted-foreground">
              {suppression.themeIds.size === 0 ? (
                "Nenhum tema fora do escopo até agora."
              ) : (
                <span>
                  {suppression.themeIds.size} tema
                  {suppression.themeIds.size === 1 ? "" : "s"} será ocultado no
                  questionário principal.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={!allAnswered || upsertMutation.isPending}
              >
                Salvar escopo e abrir questionário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar escopo?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Ao salvar,{" "}
                  <strong className="text-foreground">
                    {suppression.themeIds.size} tema
                    {suppression.themeIds.size === 1 ? "" : "s"}
                  </strong>{" "}
                  do questionário principal será marcado como fora do escopo
                  desta unidade.
                </p>
                {newlyStaleCount > 0 && (
                  <p className="text-amber-600 dark:text-amber-500">
                    {newlyStaleCount} resposta{newlyStaleCount === 1 ? "" : "s"} já preenchida
                    {newlyStaleCount === 1 ? "" : "s"} no questionário principal{" "}
                    {newlyStaleCount === 1 ? "ficará" : "ficarão"} fora do escopo. Elas
                    serão preservadas no banco, mas não contam para tags ou
                    progresso — você poderá limpá-las no questionário principal.
                  </p>
                )}
                {existingProfile?.completed_at && (
                  <p className="text-amber-600 dark:text-amber-500">
                    A marca de "Configurado" será removida; revise o
                    questionário principal e reenvie para regerar as tags
                    definitivas.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Salvando…" : "Salvar escopo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
