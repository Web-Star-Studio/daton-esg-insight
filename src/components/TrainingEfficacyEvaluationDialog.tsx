import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { DateInputWithCalendarForm } from "@/components/DateInputWithCalendarForm";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { createEfficacyEvaluation } from "@/services/trainingEfficacyEvaluations";

// 3 categorias intuitivas em vez do slider 0-10. Cada uma pré-preenche a
// observação com texto padrão que o avaliador pode editar antes de salvar.
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
      "O treinamento atingiu os objetivos esperados. Os participantes demonstraram domínio do conteúdo e aplicação prática nas atividades.",
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
  comments: z.string().max(1000, "Observações devem ter no máximo 1000 caracteres").optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

interface TrainingEfficacyEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string;
  // Avaliação é granular por participante: 1 evaluation por employee_training.
  employeeTrainingId: string;
  trainingName: string;
  // Nome do colaborador sendo avaliado, exibido no header pra contexto.
  employeeName?: string;
}

export function TrainingEfficacyEvaluationDialog({
  open,
  onOpenChange,
  trainingProgramId,
  employeeTrainingId,
  trainingName,
  employeeName,
}: TrainingEfficacyEvaluationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      evaluation_date: new Date(),
      effectiveness: "effective",
      comments: EFFECTIVENESS_OPTIONS[0].defaultComment,
    },
  });

  const effectiveness = form.watch("effectiveness") as EffectivenessValue;

  // Quando o usuário troca de categoria e ainda não escreveu nada próprio,
  // atualiza o textarea com o template da nova categoria. Se já editou (texto
  // diferente de qualquer template conhecido), preserva o que ele escreveu.
  useEffect(() => {
    if (!open) return;
    const currentComment = form.getValues("comments") || "";
    const isUntouched = EFFECTIVENESS_OPTIONS.some(o => o.defaultComment === currentComment) || currentComment === "";
    if (isUntouched) {
      const opt = EFFECTIVENESS_OPTIONS.find(o => o.value === effectiveness);
      if (opt) form.setValue("comments", opt.defaultComment);
    }
  }, [effectiveness, open, form]);

  const onSubmit = async (values: EvaluationFormValues) => {
    setIsSubmitting(true);
    try {
      const opt = EFFECTIVENESS_OPTIONS.find(o => o.value === values.effectiveness)!;
      await createEfficacyEvaluation({
        company_id: "", // Will be set by service
        // Avaliação granular: 1 evaluation por employee_training.
        employee_training_id: employeeTrainingId,
        training_program_id: trainingProgramId,
        evaluation_date: format(values.evaluation_date, "yyyy-MM-dd"),
        score: opt.score,
        is_effective: opt.is_effective,
        evaluator_name: user?.full_name || undefined,
        comments: values.comments?.trim() || undefined,
        status: "Concluída",
      });

      toast({
        title: "Sucesso",
        description: "Avaliação de eficácia registrada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["efficacy-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });

      form.reset();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliação de Eficácia
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{trainingName}</span>
            {employeeName && (
              <>
                {" — colaborador: "}
                <span className="font-medium text-foreground">{employeeName}</span>
              </>
            )}
            {user?.full_name && (
              <>
                <br />
                <span className="text-xs">Avaliador: <span className="font-medium text-foreground">{user.full_name}</span></span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            htmlFor={`eff-${opt.value}`}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/40",
                            )}
                          >
                            <RadioGroupItem id={`eff-${opt.value}`} value={opt.value} className="mt-1" />
                            <div className="flex-1">
                              <div className={cn("flex items-center gap-2 font-medium", opt.color)}>
                                <Icon className="h-4 w-4" />
                                {opt.label}
                              </div>
                              <p className="text-sm text-muted-foreground">{opt.description}</p>
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
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A mensagem padrão é preenchida automaticamente. Você pode editá-la ou mantê-la como está.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Registrar Avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
