import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  ClipboardCheck,
  Loader2,
  Users,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DateInputWithCalendarForm } from "@/components/DateInputWithCalendarForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getTrainingProgramParticipants } from "@/services/trainingProgramParticipants";
import {
  getEfficacyEvaluations,
  updateEfficacyEvaluation,
  type TrainingEfficacyEvaluation,
} from "@/services/trainingEfficacyEvaluations";
import {
  getEfficacyCategory,
  EFFICACY_CATEGORY_LABEL,
  EFFICACY_CATEGORY_BADGE,
} from "@/utils/trainingEfficacyCategory";

const EFFECTIVENESS_OPTIONS = [
  {
    value: "effective",
    label: "Eficaz",
    description: "Treinamento atingiu os objetivos esperados.",
    icon: CheckCircle2,
    color: "text-green-600",
    score: 10,
    is_effective: true,
  },
  {
    value: "partial",
    label: "Parcialmente Eficaz",
    description: "Atingiu parte dos objetivos; há pontos de melhoria.",
    icon: AlertTriangle,
    color: "text-yellow-600",
    score: 6,
    is_effective: true,
  },
  {
    value: "not_effective",
    label: "Não Eficaz",
    description: "Não atingiu os objetivos esperados.",
    icon: XCircle,
    color: "text-red-600",
    score: 3,
    is_effective: false,
  },
] as const;

type EffectivenessValue = (typeof EFFECTIVENESS_OPTIONS)[number]["value"];

function inferEffectiveness(ev: TrainingEfficacyEvaluation): EffectivenessValue {
  if (ev.is_effective === false) return "not_effective";
  if ((ev.score ?? 10) <= 6) return "partial";
  return "effective";
}

const editSchema = z.object({
  evaluation_date: z.date({ message: "Data da avaliação é obrigatória" }),
  effectiveness: z.enum(["effective", "partial", "not_effective"]),
  comments: z.string().max(1000).optional(),
});
type EditFormValues = z.infer<typeof editSchema>;

interface TrainingProgramEfficacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Modal read-only disparado pela tela /avaliacao-eficacia (botão "Ver" do
// programa Avaliado). Lista todos os participantes com a classificação e o
// comentário registrados. O fluxo de avaliar pendentes vive no
// TrainingProgramEvaluationFlow (botão "Avaliar" na lista de programas).
export function TrainingProgramEfficacyDialog({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEfficacyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TrainingEfficacyEvaluation | null>(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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

  const evalByEmployeeTraining = new Map<string, TrainingEfficacyEvaluation>();
  for (const ev of evaluations) {
    if (ev.employee_training_id && ev.status === "Concluída") {
      evalByEmployeeTraining.set(ev.employee_training_id, ev);
    }
  }

  const isLoading = loadingParticipants || loadingEvaluations;
  const evaluatedCount = participants.filter(p => evalByEmployeeTraining.has(p.id)).length;
  const totalCount = participants.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Avaliação de Eficácia
            </DialogTitle>
            <DialogDescription>
              {trainingProgramName}
              {totalCount > 0 && (
                <>
                  <br />
                  <span className="text-xs">
                    Progresso:{" "}
                    <span className="font-medium text-foreground">
                      {evaluatedCount} de {totalCount} colaboradores avaliados
                    </span>
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum participante encontrado neste treinamento.</p>
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Comentário</TableHead>
                      <TableHead className="w-[60px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => {
                    const evaluation = evalByEmployeeTraining.get(p.id);
                    const category = getEfficacyCategory(evaluation);
                    const comment = evaluation?.comments?.trim();
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.employee_name}</TableCell>
                        <TableCell>{p.department || "—"}</TableCell>
                        <TableCell>
                          {category ? (
                            <Badge className={EFFICACY_CATEGORY_BADGE[category]}>
                              {EFFICACY_CATEGORY_LABEL[category]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {comment ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                                  {comment}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md whitespace-pre-wrap">
                                {comment}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                          <TableCell className="text-right">
                            {evaluation ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditing(evaluation);
                                      setEditingEmployeeName(p.employee_name);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar avaliação</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar avaliação</TooltipContent>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
        )}
      </DialogContent>
    </Dialog>
      <EditEvaluationDialog
        evaluation={editing}
        employeeName={editingEmployeeName}
        isSaving={isSaving}
        onClose={() => setEditing(null)}
        onSave={async (values) => {
          if (!editing) return;
          setIsSaving(true);
          try {
            const opt = EFFECTIVENESS_OPTIONS.find((o) => o.value === values.effectiveness)!;
            await updateEfficacyEvaluation(editing.id, {
              evaluation_date: format(values.evaluation_date, "yyyy-MM-dd"),
              score: opt.score,
              is_effective: opt.is_effective,
              comments: values.comments?.trim() || undefined,
            });
            toast({ title: "Avaliação atualizada", description: "As alterações foram salvas." });
            queryClient.invalidateQueries({
              queryKey: ["program-efficacy-evaluations", trainingProgramId],
            });
            queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
            setEditing(null);
          } catch (e: any) {
            toast({
              title: "Erro",
              description: e?.message || "Erro ao atualizar avaliação",
              variant: "destructive",
            });
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </>
  );
}

// Inserted closing of fragment requires a fragment opening. Re-open the JSX:
function EditEvaluationDialog({
  evaluation,
  employeeName,
  isSaving,
  onClose,
  onSave,
}: {
  evaluation: TrainingEfficacyEvaluation | null;
  employeeName: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: EditFormValues) => Promise<void>;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      evaluation_date: new Date(),
      effectiveness: "effective",
      comments: "",
    },
  });

  useEffect(() => {
    if (evaluation) {
      form.reset({
        evaluation_date: evaluation.evaluation_date
          ? new Date(`${evaluation.evaluation_date}T00:00:00`)
          : new Date(),
        effectiveness: inferEffectiveness(evaluation),
        comments: evaluation.comments || "",
      });
    }
  }, [evaluation?.id, form]);

  return (
    <Dialog open={!!evaluation} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Avaliação
          </DialogTitle>
          <DialogDescription>
            Colaborador:{" "}
            <span className="font-medium text-foreground">{employeeName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSave)}
            className="space-y-5"
            key={evaluation?.id}
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
                            htmlFor={`edit-eff-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/40",
                            )}
                          >
                            <RadioGroupItem
                              id={`edit-eff-${opt.value}`}
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
                    Edite as observações conforme necessário.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
  );
}
