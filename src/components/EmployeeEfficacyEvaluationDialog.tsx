import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Loader2,
  Pencil,
  ClipboardCheck,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DateInputWithCalendarForm } from "@/components/DateInputWithCalendarForm";

import {
  createEfficacyEvaluation,
  updateEfficacyEvaluation,
  type TrainingEfficacyEvaluation,
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

const DEFAULT_COMMENTS: Record<EffectivenessValue, string> = {
  effective:
    "O treinamento atingiu os objetivos esperados. O colaborador demonstrou domínio do conteúdo e aplicação prática nas atividades.",
  partial:
    "O treinamento atingiu parcialmente os objetivos. Há pontos de melhoria identificados que devem ser trabalhados em próximas edições.",
  not_effective:
    "O treinamento não atingiu os objetivos esperados. Recomenda-se revisão do conteúdo e/ou metodologia antes de nova aplicação.",
};

const LEGACY_DEFAULT_COMMENTS: string[] = [
  "O treinamento atingiu os objetivos esperados. Os participantes demonstraram domínio do conteúdo e aplicação prática nas atividades.",
];

const isDefaultComment = (text: string | undefined | null) => {
  const t = (text || "").trim();
  if (!t) return true;
  if (Object.values(DEFAULT_COMMENTS).some((d) => d.trim() === t)) return true;
  return LEGACY_DEFAULT_COMMENTS.some((d) => d.trim() === t);
};

function inferEffectiveness(ev: TrainingEfficacyEvaluation): EffectivenessValue {
  if (ev.is_effective === false) return "not_effective";
  if ((ev.score ?? 10) <= 6) return "partial";
  return "effective";
}

const formSchema = z.object({
  evaluation_date: z.date({ message: "Data da avaliação é obrigatória" }),
  effectiveness: z.enum(["effective", "partial", "not_effective"]),
  comments: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface EmployeeEfficacyEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId?: string;
  employeeTrainingId: string;
  trainingProgramId: string;
  trainingProgramName?: string;
  existingEvaluation: TrainingEfficacyEvaluation | null;
}

export function EmployeeEfficacyEvaluationDialog({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  employeeTrainingId,
  trainingProgramId,
  trainingProgramName,
  existingEvaluation,
}: EmployeeEfficacyEvaluationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);
  const isEdit = !!existingEvaluation;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      evaluation_date: new Date(),
      effectiveness: "effective",
      comments: DEFAULT_COMMENTS.effective,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (existingEvaluation) {
      const eff = inferEffectiveness(existingEvaluation);
      form.reset({
        evaluation_date: existingEvaluation.evaluation_date
          ? new Date(`${existingEvaluation.evaluation_date}T00:00:00`)
          : new Date(),
        effectiveness: eff,
        comments: existingEvaluation.comments?.trim() || DEFAULT_COMMENTS[eff],
      });
    } else {
      form.reset({
        evaluation_date: new Date(),
        effectiveness: "effective",
        comments: DEFAULT_COMMENTS.effective,
      });
    }
  }, [open, existingEvaluation?.id]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const opt = EFFECTIVENESS_OPTIONS.find((o) => o.value === values.effectiveness)!;
      if (isEdit && existingEvaluation) {
        await updateEfficacyEvaluation(existingEvaluation.id, {
          evaluation_date: format(values.evaluation_date, "yyyy-MM-dd"),
          score: opt.score,
          is_effective: opt.is_effective,
          comments: values.comments?.trim() || undefined,
        });
        toast({ title: "Avaliação atualizada", description: "As alterações foram salvas." });
      } else {
        await createEfficacyEvaluation({
          company_id: "",
          employee_training_id: employeeTrainingId,
          training_program_id: trainingProgramId,
          evaluation_date: format(values.evaluation_date, "yyyy-MM-dd"),
          score: opt.score,
          is_effective: opt.is_effective,
          evaluator_name: user?.full_name || undefined,
          comments: values.comments?.trim() || undefined,
          status: "Concluída",
        });
        toast({ title: "Avaliação registrada", description: "A avaliação foi salva com sucesso." });
      }

      queryClient.invalidateQueries({ queryKey: ["efficacy-evaluations", trainingProgramId] });
      queryClient.invalidateQueries({ queryKey: ["program-efficacy-evaluations", trainingProgramId] });
      queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: ["employee-trainings", employeeId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
      }
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || "Erro ao salvar avaliação";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
            {isEdit ? "Editar Avaliação" : "Avaliar Eficácia"}
          </DialogTitle>
          <DialogDescription>
            <div>
              Colaborador:{" "}
              <span className="font-medium text-foreground">{employeeName}</span>
            </div>
            {trainingProgramName && (
              <div className="text-xs mt-1">
                Treinamento:{" "}
                <span className="font-medium text-foreground">{trainingProgramName}</span>
              </div>
            )}
            {!isEdit && user?.full_name && (
              <div className="text-xs mt-1">
                Avaliador:{" "}
                <span className="font-medium text-foreground">{user.full_name}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      onValueChange={(val) => {
                        field.onChange(val);
                        const currentComment = form.getValues("comments");
                        if (isDefaultComment(currentComment)) {
                          form.setValue(
                            "comments",
                            DEFAULT_COMMENTS[val as EffectivenessValue],
                            { shouldDirty: true },
                          );
                        }
                      }}
                      className="gap-2"
                    >
                      {EFFECTIVENESS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Label
                            key={opt.value}
                            htmlFor={`emp-eff-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/40",
                            )}
                          >
                            <RadioGroupItem
                              id={`emp-eff-${opt.value}`}
                              value={opt.value}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className={cn("flex items-center gap-2 font-medium", opt.color)}>
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
                      placeholder={
                        DEFAULT_COMMENTS[
                          form.watch("effectiveness") as EffectivenessValue
                        ] || "Observações sobre a avaliação..."
                      }
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Texto padrão sugerido. Edite conforme necessário para refletir o caso real.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Salvar alterações" : "Registrar avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
