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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmployeeTraining, createEmployeeTraining, updateEmployeeTraining } from "@/services/trainingPrograms";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const employeeTrainingSchema = z.object({
  employee_id: z.string().min(1, "Funcionário é obrigatório"),
  training_program_id: z.string().min(1, "Programa de treinamento é obrigatório"),
  completion_date: z.date().optional(),
  score: z.coerce.number().min(0).max(10).optional(),
  status: z.string().min(1, "Status é obrigatório"),
  trainer: z.string().optional(),
  notes: z.string().optional(),
});

interface EmployeeTrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: EmployeeTraining | null;
}

export function EmployeeTrainingModal({ open, onOpenChange, training }: EmployeeTrainingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!training;

  const form = useForm<z.infer<typeof employeeTrainingSchema>>({
    resolver: zodResolver(employeeTrainingSchema),
    defaultValues: {
      employee_id: "",
      training_program_id: "",
      completion_date: undefined,
      score: undefined,
      status: "Inscrito",
      trainer: "",
      notes: "",
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, department")
        .eq("status", "Ativo")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch training programs
  const { data: programs = [] } = useQuery({
    queryKey: ["training-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_programs")
        .select("id, name, category, duration_hours")
        .eq("status", "Ativo")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (training) {
      form.reset({
        employee_id: training.employee_id,
        training_program_id: training.training_program_id,
        completion_date: training.completion_date ? new Date(training.completion_date) : undefined,
        score: training.score || undefined,
        status: training.status,
        trainer: training.trainer || "",
        notes: training.notes || "",
      });
    } else {
      form.reset({
        employee_id: "",
        training_program_id: "",
        completion_date: undefined,
        score: undefined,
        status: "Inscrito",
        trainer: "",
        notes: "",
      });
    }
  }, [training, form]);

  const onSubmit = async (values: z.infer<typeof employeeTrainingSchema>) => {
    try {
      console.log('EmployeeTrainingModal: Submitting form with values:', values);
      
      const submissionData = {
        employee_id: values.employee_id!,
        training_program_id: values.training_program_id!,
        completion_date: values.completion_date?.toISOString(),
        score: values.score,
        status: values.status!,
        trainer: values.trainer,
        notes: values.notes,
        company_id: "", // Will be set by database triggers
      };

      if (isEditing && training?.id) {
        console.log('EmployeeTrainingModal: Updating training:', training.id, submissionData);
        await updateEmployeeTraining(training.id, submissionData);
        toast({
          title: "Sucesso",
          description: "Treinamento do funcionário atualizado com sucesso!",
        });
      } else {
        console.log('EmployeeTrainingModal: Creating new training:', submissionData);
        await createEmployeeTraining(submissionData);
        toast({
          title: "Sucesso",
          description: "Treinamento do funcionário registrado com sucesso!",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('EmployeeTrainingModal: Error saving training:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao salvar treinamento: ${error.message || 'Tente novamente.'}`,
        variant: "destructive",
      });
    }
  };

  const statusOptions = [
    "Inscrito",
    "Em Andamento",
    "Concluído",
    "Cancelado",
    "Reprovado"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Treinamento do Funcionário" : "Registrar Treinamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do treinamento do funcionário."
              : "Registre a participação de um funcionário em um programa de treinamento."
            }
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
                      <SelectContent className="bg-background border z-50">
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} ({employee.employee_code})
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
                name="training_program_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programa de Treinamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o programa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50">
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} ({program.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50">
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="completion_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Conclusão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                    <FormLabel>Nota (0-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        placeholder="8.5" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="trainer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrutor/Facilitador</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do instrutor responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o treinamento (desempenho, dificuldades, etc.)"
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
                {isEditing ? "Atualizar" : "Registrar"} Treinamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}