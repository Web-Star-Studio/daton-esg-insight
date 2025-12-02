import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Star, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createEfficacyEvaluation } from "@/services/trainingEfficacyEvaluations";

const evaluationSchema = z.object({
  evaluation_date: z.date({ message: "Data da avaliação é obrigatória" }),
  score: z.number().min(0).max(10),
  is_effective: z.boolean(),
  evaluator_name: z.string().optional(),
  comments: z.string().max(1000, "Observações devem ter no máximo 1000 caracteres").optional(),
});

interface TrainingEfficacyEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeTrainingId: string;
  trainingProgramId: string;
  trainingName: string;
  employeeName?: string;
}

export function TrainingEfficacyEvaluationDialog({
  open,
  onOpenChange,
  employeeTrainingId,
  trainingProgramId,
  trainingName,
  employeeName,
}: TrainingEfficacyEvaluationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof evaluationSchema>>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      evaluation_date: new Date(),
      score: 7,
      is_effective: true,
      evaluator_name: "",
      comments: "",
    },
  });

  const score = form.watch("score");
  const isEffective = form.watch("is_effective");

  const onSubmit = async (values: z.infer<typeof evaluationSchema>) => {
    setIsSubmitting(true);
    try {
      await createEfficacyEvaluation({
        company_id: "", // Will be set by service
        employee_training_id: employeeTrainingId,
        training_program_id: trainingProgramId,
        evaluation_date: format(values.evaluation_date, 'yyyy-MM-dd'),
        score: values.score,
        is_effective: values.is_effective,
        evaluator_name: values.evaluator_name || undefined,
        comments: values.comments || undefined,
        status: "Concluída",
      });

      toast({
        title: "Sucesso",
        description: "Avaliação de eficácia registrada com sucesso!",
      });

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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excelente";
    if (score >= 8) return "Muito Bom";
    if (score >= 7) return "Bom";
    if (score >= 6) return "Satisfatório";
    if (score >= 5) return "Regular";
    return "Insatisfatório";
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
            Registre a avaliação de eficácia do treinamento{" "}
            <span className="font-medium text-foreground">{trainingName}</span>
            {employeeName && (
              <>
                {" "}para o colaborador{" "}
                <span className="font-medium text-foreground">{employeeName}</span>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            : "Selecione a data"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota da Avaliação</FormLabel>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">0</span>
                      <div className="text-center">
                        <span className={cn("text-3xl font-bold", getScoreColor(score))}>
                          {score.toFixed(1)}
                        </span>
                        <p className={cn("text-sm font-medium", getScoreColor(score))}>
                          {getScoreLabel(score)}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">10</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10}
                        step={0.5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Avalie de 0 a 10 o desempenho do colaborador no treinamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_effective"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      {isEffective ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      O treinamento foi eficaz?
                    </FormLabel>
                    <FormDescription>
                      {isEffective
                        ? "O colaborador demonstrou domínio das competências treinadas"
                        : "O colaborador precisa de reforço ou novo treinamento"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluator_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Avaliador</FormLabel>
                  <FormControl>
                    <Input placeholder="Quem realizou a avaliação" {...field} />
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
                      placeholder="Observações sobre a avaliação, pontos fortes, áreas de melhoria..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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
