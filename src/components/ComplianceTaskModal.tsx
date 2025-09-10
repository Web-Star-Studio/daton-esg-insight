import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { complianceService, type CreateComplianceTaskData } from "@/services/compliance";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  frequency: z.enum(["Única", "Anual", "Semestral", "Trimestral", "Mensal", "Sob Demanda"]),
  due_date: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  requirement_id: z.string().optional(),
  responsible_user_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ComplianceTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

export function ComplianceTaskModal({ open, onOpenChange, task }: ComplianceTaskModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      frequency: task?.frequency || "Anual",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      requirement_id: task?.requirement_id || "none",
      responsible_user_id: task?.responsible_user_id || "none",
      notes: task?.notes || "",
    },
  });

  const { data: requirements } = useQuery({
    queryKey: ['regulatory-requirements'],
    queryFn: complianceService.getRequirements,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: complianceService.getUsers,
  });

  const createTask = useMutation({
    mutationFn: (data: CreateComplianceTaskData) => complianceService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa de compliance foi criada com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: (data: { id: string; updateData: any }) => 
      complianceService.updateTask(data.id, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa de compliance foi atualizada com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        title: values.title,
        description: values.description,
        frequency: values.frequency,
        due_date: format(values.due_date, 'yyyy-MM-dd'),
        requirement_id: values.requirement_id === "none" ? undefined : values.requirement_id,
        responsible_user_id: values.responsible_user_id === "none" ? undefined : values.responsible_user_id,
        notes: values.notes,
      };

      if (task) {
        await updateTask.mutateAsync({ id: task.id, updateData: submitData });
      } else {
        await createTask.mutateAsync(submitData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? "Editar Tarefa de Compliance" : "Nova Tarefa de Compliance"}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? "Atualize as informações da tarefa de compliance."
              : "Crie uma nova tarefa para gerenciar o cumprimento de obrigações regulatórias."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Tarefa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Entregar Inventário Nacional de Resíduos Sólidos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes da tarefa e os passos necessários..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Única">Única</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                            date < new Date()
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
            </div>

            <FormField
              control={form.control}
              name="requirement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisito Regulatório Associado (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um requisito (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum requisito associado</SelectItem>
                      {requirements?.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.reference_code ? `${req.reference_code} - ` : ""}{req.title}
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
              name="responsible_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Atribuir a um usuário (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionais</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações complementares, observações ou instruções especiais..."
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : task ? "Atualizar" : "Criar Tarefa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}