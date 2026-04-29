import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Loader2,
  ArrowRight,
  SkipForward,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
    description: "Treinamento atingiu os objetivos esperados.",
    icon: CheckCircle2,
    color: "text-green-600",
    score: 10,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu os objetivos esperados. O colaborador demonstrou domínio do conteúdo e aplicação prática nas atividades.",
  },
  {
    value: "partial",
    label: "Parcialmente Eficaz",
    description: "Atingiu parte dos objetivos; há pontos de melhoria.",
    icon: AlertTriangle,
    color: "text-yellow-600",
    score: 6,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu parcialmente os objetivos. Há pontos de melhoria identificados que devem ser trabalhados em próximas edições.",
  },
  {
    value: "not_effective",
    label: "Não Eficaz",
    description: "Não atingiu os objetivos esperados.",
    icon: XCircle,
    color: "text-red-600",
    score: 3,
    is_effective: false,
    defaultComment:
      "O treinamento não atingiu os objetivos esperados. Recomenda-se revisão do conteúdo e/ou metodologia antes de nova aplicação.",
  },
] as const;

type EffectivenessValue = (typeof EFFECTIVENESS_OPTIONS)[number]["value"];

const evaluationSchema = z.object({
  evaluation_date: z.date({ message: "Data da avaliação é obrigatória" }),
  effectiveness: z.enum(["effective", "partial", "not_effective"], {
    message: "Selecione uma categoria de eficácia",
  }),
  comments: z
    .string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

interface TrainingProgramEvaluationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Wizard de avaliação contínua: ao abrir, fixa um snapshot dos participantes
// PENDENTES e o avaliador caminha um a um (Salvar e Próximo / Pular). Não
// re-computa a fila com base em invalidações de cache pra não pular nem
// repetir colaboradores no meio do fluxo.
export function TrainingProgramEvaluationFlow({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEvaluationFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<TrainingParticipant[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueReady, setQueueReady] = useState(false);

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

  // Snapshot inicial: monta a queue uma única vez quando os dados chegam.
  useEffect(() => {
    if (
      open &&
      !loadingParticipants &&
      !loadingEvaluations &&
      !queueReady &&
      trainingProgramId
    ) {
      const evaluatedSet = new Set<string>();
      for (const ev of evaluations) {
        if (ev.employee_training_id && ev.status === "Concluída") {
          evaluatedSet.add(ev.employee_training_id);
        }
      }
      const pending = participants.filter((p) => !evaluatedSet.has(p.id));
      setQueue(pending);
      setAlreadyEvaluated(participants.length - pending.length);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setQueueReady(true);
    }
  }, [
    open,
    loadingParticipants,
    loadingEvaluations,
    queueReady,
    participants,
    evaluations,
    trainingProgramId,
  ]);

  // Reset ao fechar.
  useEffect(() => {
    if (!open) {
      setQueue([]);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setAlreadyEvaluated(0);
      setQueueReady(false);
    }
  }, [open]);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      evaluation_date: new Date(),
      effectiveness: "effective",
      comments: EFFECTIVENESS_OPTIONS[0].defaultComment,
    },
  });

  const effectiveness = form.watch("effectiveness") as EffectivenessValue;
  const currentParticipant = queue[currentIndex];

  // Reset form sempre que muda de participante.
  useEffect(() => {
    if (currentParticipant) {
      form.reset({
        evaluation_date: new Date(),
        effectiveness: "effective",
        comments: EFFECTIVENESS_OPTIONS[0].defaultComment,
      });
    }
  }, [currentParticipant?.id, form]);

  // Auto-fill do comments quando troca de categoria, preservando edição manual.
  useEffect(() => {
    if (!open || !currentParticipant) return;
    const current = form.getValues("comments") || "";
    const isUntouched =
      EFFECTIVENESS_OPTIONS.some((o) => o.defaultComment === current) || current === "";
    if (isUntouched) {
      const opt = EFFECTIVENESS_OPTIONS.find((o) => o.value === effectiveness);
      if (opt) form.setValue("comments", opt.defaultComment);
    }
  }, [effectiveness, open, form, currentParticipant?.id]);

  const isLoading = loadingParticipants || loadingEvaluations || !queueReady;
  const totalParticipants = participants.length;
  const isLast = currentIndex >= queue.length - 1;
  const isDone = queueReady && queue.length > 0 && currentIndex >= queue.length;
  const noPending = queueReady && queue.length === 0;

  const completedSoFar = alreadyEvaluated + savedCount;
  const progressPct =
    totalParticipants > 0 ? (completedSoFar / totalParticipants) * 100 : 0;

  const finishFlow = () => {
    queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
    queryClient.invalidateQueries({
      queryKey: ["program-efficacy-evaluations", trainingProgramId],
    });
    queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
    onOpenChange(false);
  };

  const handleSkip = () => {
    if (!currentParticipant) return;
    setSkippedCount((s) => s + 1);
    setCurrentIndex((i) => i + 1);
  };

  const onSubmit = async (values: EvaluationFormValues) => {
    if (!currentParticipant || !trainingProgramId) return;
    setIsSubmitting(true);
    try {
      const opt = EFFECTIVENESS_OPTIONS.find(
        (o) => o.value === values.effectiveness,
      )!;
      await createEfficacyEvaluation({
        company_id: "",
        employee_training_id: currentParticipant.id,
        training_program_id: trainingProgramId,
        evaluation_date: format(values.evaluation_date, "yyyy-MM-dd"),
        score: opt.score,
        is_effective: opt.is_effective,
        evaluator_name: user?.full_name || undefined,
        comments: values.comments?.trim() || undefined,
        status: "Concluída",
      });

      setSavedCount((c) => c + 1);
      const willBeLast = currentIndex >= queue.length - 1;
      if (willBeLast) {
        toast({
          title: "Avaliações concluídas",
          description: `${savedCount + 1} colaborador(es) avaliado(s) com sucesso.`,
        });
        finishFlow();
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (error: any) {
      console.error("Error creating evaluation:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar avaliação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          // Se já salvou alguma, invalidar antes de fechar pra refletir.
          if (savedCount > 0) finishFlow();
          else onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Avaliação de Eficácia
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{trainingProgramName}</span>
            {user?.full_name && (
              <>
                <br />
                <span className="text-xs">
                  Avaliador:{" "}
                  <span className="font-medium text-foreground">{user.full_name}</span>
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
              Todos os {totalParticipants} colaborador(es) deste treinamento já foram
              avaliados.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Fechar
            </Button>
          </div>
        ) : !currentParticipant ? null : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Avaliando {currentIndex + 1} de {queue.length} pendente
                  {queue.length > 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {completedSoFar} de {totalParticipants} concluído
                  {totalParticipants > 1 ? "s" : ""}
                </span>
              </div>
              <Progress value={progressPct} />
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Colaborador
              </div>
              <div className="font-medium">{currentParticipant.employee_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {currentParticipant.department || "—"}
                {currentParticipant.completion_date && (
                  <>
                    {" · Concluiu em "}
                    {format(new Date(currentParticipant.completion_date), "dd/MM/yyyy")}
                  </>
                )}
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                key={currentParticipant.id}
              >
                <FormField
                  control={form.control}
                  name="evaluation_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Avaliação</FormLabel>
                      <FormControl>
                        <DateInputWithCalendarForm
                          value={field.value || null}
                          onChange={(d) => field.onChange(d || new Date())}
                          placeholder="DD/MM/AAAA"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effectiveness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resultado da Avaliação</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="gap-2"
                        >
                          {EFFECTIVENESS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <Label
                                key={opt.value}
                                htmlFor={`flow-eff-${opt.value}`}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                  field.value === opt.value
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-muted/40",
                                )}
                              >
                                <RadioGroupItem
                                  id={`flow-eff-${opt.value}`}
                                  value={opt.value}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div
                                    className={cn(
                                      "flex items-center gap-2 font-medium",
                                      opt.color,
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                    {opt.label}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {opt.description}
                                  </p>
                                </div>
                              </Label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a avaliação..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A mensagem padrão é preenchida automaticamente. Você pode editá-la
                        ou mantê-la como está.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="sm:mr-auto"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Pular
                  </Button>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (savedCount > 0) finishFlow();
                        else onOpenChange(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Fechar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Salvando...
                        </>
                      ) : isLast ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Salvar e Concluir
                        </>
                      ) : (
                        <>
                          Salvar e Próximo
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>

                {skippedCount > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {skippedCount} colaborador(es) pulado(s) — você pode voltar e avaliar
                    depois.
                  </p>
                )}
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
