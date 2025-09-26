import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getCompetencyMatrix, createCompetencyAssessment } from "@/services/competencyService";
import { getEmployees } from "@/services/employeeService";

const assessmentSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  competency_id: z.string().min(1, "Competency is required"),
  current_level: z.number().min(1).max(5),
  target_level: z.number().min(1).max(5),
  development_plan: z.string().optional(),
});

interface CompetencyAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompetencyAssessmentModal({ open, onOpenChange }: CompetencyAssessmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: competencies = [] } = useQuery({
    queryKey: ["competency-matrix"],
    queryFn: getCompetencyMatrix
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees
  });

  const form = useForm<z.infer<typeof assessmentSchema>>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      employee_id: "",
      competency_id: "",
      current_level: 1,
      target_level: 1,
      development_plan: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof assessmentSchema>) => {
    try {
      await createCompetencyAssessment({
        ...values,
        assessor_user_id: "current_user", // This would come from auth context
        assessment_date: new Date().toISOString().split('T')[0],
      });

      toast({
        title: "Sucesso",
        description: "Avaliação de competência criada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["competency-assessments"] });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar avaliação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Competência</DialogTitle>
          <DialogDescription>
            Avalie o nível atual e defina metas para desenvolvimento de competências.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a competência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {competencies.map((competency) => (
                          <SelectItem key={competency.id} value={competency.id}>
                            {competency.competency_name} ({competency.competency_category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível Atual</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nível atual" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Nível {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível Meta</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nível meta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Nível {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="development_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Desenvolvimento</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva as ações para desenvolver esta competência..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Avaliação
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}