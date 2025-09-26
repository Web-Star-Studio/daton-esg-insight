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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainingProgram, createTrainingProgram, updateTrainingProgram } from "@/services/trainingPrograms";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const trainingProgramSchema = z.object({
  name: z.string().min(1, "Nome do programa é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  duration_hours: z.coerce.number().min(1, "Duração deve ser maior que 0"),
  is_mandatory: z.boolean(),
  valid_for_months: z.coerce.number().optional(),
  status: z.string().min(1, "Status é obrigatório"),
});

interface TrainingProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: TrainingProgram | null;
}

export function TrainingProgramModal({ open, onOpenChange, program }: TrainingProgramModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!program;

  const form = useForm<z.infer<typeof trainingProgramSchema>>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      duration_hours: 1,
      is_mandatory: false,
      valid_for_months: 12,
      status: "Ativo",
    },
  });

  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        description: program.description || "",
        category: program.category || "",
        duration_hours: program.duration_hours || 1,
        is_mandatory: program.is_mandatory,
        valid_for_months: program.valid_for_months || 12,
        status: program.status,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "",
        duration_hours: 1,
        is_mandatory: false,
        valid_for_months: 12,
        status: "Ativo",
      });
    }
  }, [program, form]);

  const onSubmit = async (values: z.infer<typeof trainingProgramSchema>) => {
    try {
      console.log('TrainingProgramModal: Submitting form with values:', values);
      
      if (isEditing && program?.id) {
        await updateTrainingProgram(program.id, values);
        toast({
          title: "Sucesso",
          description: "Programa de treinamento atualizado com sucesso!",
        });
      } else {
        const programData = {
          name: values.name,
          description: values.description || null,
          category: values.category,
          duration_hours: values.duration_hours,
          is_mandatory: values.is_mandatory,
          valid_for_months: values.valid_for_months || null,
          status: values.status,
          // These will be set by database triggers
          company_id: "",
          created_by_user_id: "",
        };
        
        console.log('TrainingProgramModal: Creating training program:', programData);
        await createTrainingProgram(programData);
        
        toast({
          title: "Sucesso",
          description: "Programa de treinamento criado com sucesso!",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('TrainingProgramModal: Error saving training program:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao salvar programa de treinamento: ${error.message || 'Tente novamente.'}`,
        variant: "destructive",
      });
    }
  };

  const categories = [
    "Segurança",
    "Desenvolvimento",
    "Técnico",
    "Compliance",
    "Liderança",
    "Qualidade",
    "Operacional",
    "Administrativo"
  ];

  const statusOptions = [
    "Ativo",
    "Inativo", 
    "Planejado",
    "Suspenso"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Programa de Treinamento" : "Novo Programa de Treinamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do programa de treinamento."
              : "Crie um novo programa de treinamento para sua organização."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Programa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Segurança do Trabalho - NR35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o conteúdo e objetivos do treinamento"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (horas)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_for_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade (meses)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Tempo de validade da certificação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Treinamento Obrigatório
                    </FormLabel>
                    <FormDescription>
                      Este treinamento é obrigatório para todos os funcionários
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"} Programa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}