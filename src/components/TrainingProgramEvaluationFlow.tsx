import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Loader2,
  Users,
  MessageSquare,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { DateInputWithCalendarForm } from "@/components/DateInputWithCalendarForm";
import {
  getTrainingProgramParticipants,
  type TrainingParticipant,
} from "@/services/trainingProgramParticipants";
import {
  getEfficacyEvaluations,
  createEfficacyEvaluation,
} from "@/services/trainingEfficacyEvaluations";

const EFFECTIVENESS_OPTIONS = [
  {
    value: "effective",
    label: "Eficaz",
    shortLabel: "Eficaz",
    description: "Treinamento atingiu os objetivos esperados.",
    icon: CheckCircle2,
    color: "text-green-600",
    activeClasses:
      "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40",
    score: 10,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu os objetivos esperados. O colaborador demonstrou domínio do conteúdo e aplicação prática nas atividades.",
  },
  {
    value: "partial",
    label: "Parcialmente Eficaz",
    shortLabel: "Parcial",
    description: "Atingiu parte dos objetivos; há pontos de melhoria.",
    icon: AlertTriangle,
    color: "text-yellow-600",
    activeClasses:
      "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40",
    score: 6,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu parcialmente os objetivos. Há pontos de melhoria identificados que devem ser trabalhados em próximas edições.",
  },
  {
    value: "not_effective",
    label: "Não Eficaz",
    shortLabel: "Não Eficaz",
    description: "Não atingiu os objetivos esperados.",
    icon: XCircle,
    color: "text-red-600",
    activeClasses:
      "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40",
    score: 3,
    is_effective: false,
    defaultComment:
      "O treinamento não atingiu os objetivos esperados. Recomenda-se revisão do conteúdo e/ou metodologia antes de nova aplicação.",
  },
] as const;

type EffectivenessValue = (typeof EFFECTIVENESS_OPTIONS)[number]["value"];

interface RowState {
  effectiveness: EffectivenessValue | null;
  comments: string;
  commentsTouched: boolean;
}

interface TrainingProgramEvaluationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Tela em massa: lista todos os colaboradores pendentes em uma única view com
// os botões de avaliação (Eficaz / Parcial / Não Eficaz) ao lado de cada nome,
// permitindo registrar tudo de uma vez sem navegar individualmente.
export function TrainingProgramEvaluationFlow({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEvaluationFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [evaluationDate, setEvaluationDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ["program-efficacy-participants", trainingProgramId],
    queryFn: () => getTrainingProgramParticipants(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ["program-efficacy-evaluations", trainingProgramId],
    queryFn: () => getEfficacyEvaluations(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  const evaluatedSet = useMemo(() => {
    const s = new Set<string>();
    for (const ev of evaluations) {
      if (ev.employee_training_id && ev.status === "Concluída") {
        s.add(ev.employee_training_id);
      }
    }
    return s;
  }, [evaluations]);

  const pending: TrainingParticipant[] = useMemo(
    () => participants.filter((p) => !evaluatedSet.has(p.id)),
    [participants, evaluatedSet],
  );

  // Resetar estado ao abrir/fechar.
  useEffect(() => {
    if (!open) {
      setRows({});
      setEvaluationDate(new Date());
    }
  }, [open]);

  const setRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => {
      const current: RowState =
        prev[id] || { effectiveness: null, comments: "", commentsTouched: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const handleSelect = (id: string, value: EffectivenessValue) => {
    setRows((prev) => {
      const current: RowState =
        prev[id] || { effectiveness: null, comments: "", commentsTouched: false };
      const opt = EFFECTIVENESS_OPTIONS.find((o) => o.value === value)!;
      // Se o usuário não editou manualmente, preenche o comentário padrão.
      const comments = current.commentsTouched
        ? current.comments
        : opt.defaultComment;
      return {
        ...prev,
        [id]: { ...current, effectiveness: value, comments },
      };
    });
  };

  const totalParticipants = participants.length;
  const alreadyEvaluated = totalParticipants - pending.length;
  const selectedCount = Object.values(rows).filter((r) => r.effectiveness).length;
  const completedAfterSave = alreadyEvaluated + selectedCount;
  const progressPct =
    totalParticipants > 0 ? (completedAfterSave / totalParticipants) * 100 : 0;

  const isLoading = loadingParticipants || loadingEvaluations;
  const noPending = !isLoading && pending.length === 0;

  const finishFlow = () => {
    queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
    queryClient.invalidateQueries({
      queryKey: ["program-efficacy-evaluations", trainingProgramId],
    });
    queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
    onOpenChange(false);
  };

  const handleSaveAll = async () => {
    if (!trainingProgramId) return;
    const toSave = pending.filter((p) => rows[p.id]?.effectiveness);
    if (toSave.length === 0) {
      toast({
        title: "Nenhuma avaliação selecionada",
        description: "Selecione o resultado para pelo menos um colaborador.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let savedCount = 0;
    const failures: string[] = [];

    for (const p of toSave) {
      const row = rows[p.id];
      const opt = EFFECTIVENESS_OPTIONS.find(
        (o) => o.value === row.effectiveness,
      );
      if (!opt) continue;
      try {
        await createEfficacyEvaluation({
          company_id: "",
          employee_training_id: p.id,
          training_program_id: trainingProgramId,
          evaluation_date: format(evaluationDate, "yyyy-MM-dd"),
          score: opt.score,
          is_effective: opt.is_effective,
          evaluator_name: user?.full_name || undefined,
          comments: row.comments?.trim() || undefined,
          status: "Concluída",
        });
        savedCount++;
      } catch (error: unknown) {
        const msg = (error as Error)?.message || "Erro desconhecido";
        failures.push(`${p.employee_name}: ${msg}`);
      }
    }

    setIsSubmitting(false);

    if (savedCount > 0) {
      toast({
        title: "Avaliações registradas",
        description: `${savedCount} colaborador(es) avaliado(s) com sucesso.${
          failures.length ? ` ${failures.length} falha(s).` : ""
        }`,
      });
    }
    if (failures.length > 0 && savedCount === 0) {
      toast({
        title: "Erro ao salvar",
        description: failures[0],
        variant: "destructive",
      });
      return;
    }
    finishFlow();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Avaliação de Eficácia
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {trainingProgramName}
            </span>
            {user?.full_name && (
              <>
                <br />
                <span className="text-xs">
                  Avaliador:{" "}
                  <span className="font-medium text-foreground">
                    {user.full_name}
                  </span>
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : noPending ? (
          <div className="text-center py-10 text-muted-foreground space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <p className="font-medium text-foreground">Tudo avaliado!</p>
            <p className="text-sm">
              Todos os {totalParticipants} colaborador(es) deste treinamento já
              foram avaliados.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {pending.length} pendente{pending.length > 1 ? "s" : ""} ·{" "}
                  {selectedCount} selecionado{selectedCount === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {completedAfterSave} de {totalParticipants}
                </span>
              </div>
              <Progress value={progressPct} />
            </div>

            <div className="rounded-lg border p-3 bg-muted/20">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Data da Avaliação (aplicada a todos)
              </Label>
              <div className="mt-1 max-w-xs">
                <DateInputWithCalendarForm
                  value={evaluationDate}
                  onChange={(d) => setEvaluationDate(d || new Date())}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            <div className="rounded-lg border divide-y">
              {pending.map((p) => {
                const row = rows[p.id];
                const selected = row?.effectiveness ?? null;
                return (
                  <div
                    key={p.id}
                    className="p-3 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {p.employee_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.department || "—"}
                        {p.completion_date && (
                          <>
                            {" · Concluiu em "}
                            {format(new Date(p.completion_date), "dd/MM/yyyy")}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {EFFECTIVENESS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = selected === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(p.id, opt.value)}
                            className={cn(
                              "gap-1.5",
                              isActive && opt.activeClasses,
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {opt.shortLabel}
                          </Button>
                        );
                      })}

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={!selected}
                            title="Editar observações"
                          >
                            <MessageSquare
                              className={cn(
                                "h-4 w-4",
                                row?.commentsTouched && "text-primary",
                              )}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <Label className="text-xs">Observações</Label>
                            <Textarea
                              rows={4}
                              value={row?.comments || ""}
                              onChange={(e) =>
                                setRow(p.id, {
                                  comments: e.target.value,
                                  commentsTouched: true,
                                })
                              }
                              placeholder="Observações sobre a avaliação..."
                              className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                              A mensagem padrão é preenchida automaticamente ao
                              selecionar o resultado.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={isSubmitting || selectedCount === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Salvar {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
