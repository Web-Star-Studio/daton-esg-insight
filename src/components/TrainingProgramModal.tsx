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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TrainingProgram, createTrainingProgram, updateTrainingProgram } from "@/services/trainingPrograms";
import { getTrainingCategories, createTrainingCategory, deleteTrainingCategory } from "@/services/trainingCategories";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BranchSelect } from "@/components/BranchSelect";

const trainingProgramSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome do programa é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  description: z.string()
    .trim()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  duration_hours: z.coerce
    .number()
    .min(0, "Horas deve ser 0 ou maior")
    .max(999, "Horas deve ser menor que 1000"),
  duration_minutes: z.coerce
    .number()
    .min(0, "Minutos deve ser 0 ou maior")
    .max(59, "Minutos deve ser entre 0 e 59"),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  is_mandatory: z.boolean(),
  status: z.string().min(1, "Status é obrigatório"),
  branch_id: z.string().optional().nullable(),
  responsible_name: z.string().optional(),
  // Novos campos para avaliação de eficácia
  efficacy_evaluation_deadline: z.date().optional().nullable(),
  notify_responsible_email: z.boolean().default(false),
  responsible_email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
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
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Fetch categories from database
  const { data: dbCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['training-categories'],
    queryFn: getTrainingCategories,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createTrainingCategory(name),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['training-categories'] });
      form.setValue('category', newCategory.name);
      setCategoryInput("");
      setCategoryOpen(false);
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar categoria",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteTrainingCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-categories'] });
      toast({
        title: "Sucesso",
        description: "Categoria deletada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar categoria",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof trainingProgramSchema>>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      duration_hours: 0,
      duration_minutes: 0,
      start_date: null,
      end_date: null,
      is_mandatory: false,
      status: "Ativo",
      branch_id: "",
      responsible_name: "",
      efficacy_evaluation_deadline: null,
      notify_responsible_email: false,
      responsible_email: "",
    },
  });

  useEffect(() => {
    if (program) {
      const hours = Math.floor(program.duration_hours || 0);
      const minutes = Math.round(((program.duration_hours || 0) - hours) * 60);
      
      form.reset({
        name: program.name,
        description: program.description || "",
        category: program.category || "",
        duration_hours: hours,
        duration_minutes: minutes,
        start_date: program.start_date ? new Date(program.start_date) : null,
        end_date: program.end_date ? new Date(program.end_date) : null,
        is_mandatory: program.is_mandatory,
        status: program.status,
        branch_id: program.branch_id || "",
        responsible_name: program.responsible_name || "",
        efficacy_evaluation_deadline: program.efficacy_evaluation_deadline ? new Date(program.efficacy_evaluation_deadline) : null,
        notify_responsible_email: program.notify_responsible_email || false,
        responsible_email: program.responsible_email || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "",
        duration_hours: 0,
        duration_minutes: 0,
        start_date: null,
        end_date: null,
        is_mandatory: false,
        status: "Ativo",
        branch_id: "",
        responsible_name: "",
        efficacy_evaluation_deadline: null,
        notify_responsible_email: false,
        responsible_email: "",
      });
    }
  }, [program, form]);

  const onSubmit = async (values: z.infer<typeof trainingProgramSchema>) => {
    try {
      // Converter horas e minutos para decimal
      const totalDurationHours = values.duration_hours + (values.duration_minutes / 60);
      
      // Sanitizar dados
      const sanitizedValues = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        category: values.category,
        duration_hours: totalDurationHours,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
        is_mandatory: values.is_mandatory,
        status: values.status,
        branch_id: values.branch_id || null,
        responsible_name: values.responsible_name?.trim() || null,
        efficacy_evaluation_deadline: values.efficacy_evaluation_deadline ? format(values.efficacy_evaluation_deadline, 'yyyy-MM-dd') : null,
        notify_responsible_email: values.notify_responsible_email,
        responsible_email: values.responsible_email?.trim() || null,
      };
      
      if (isEditing && program?.id) {
        await updateTrainingProgram(program.id, sanitizedValues);
        toast({
          title: "Sucesso",
          description: "Programa de treinamento atualizado com sucesso!",
        });
      } else {
        const programData = {
          ...sanitizedValues,
          // These will be set by database triggers
          company_id: "",
          created_by_user_id: "",
        };
        
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
      
      const errorMessage = error.message?.includes('duplicate') 
        ? 'Já existe um programa com este nome'
        : error.message || 'Tente novamente.';
      
      toast({
        title: "Erro",
        description: `Erro ao salvar programa: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };


  const statusOptions = [
    { value: "Ativo", label: "Ativo", color: "bg-green-500" },
    { value: "Inativo", label: "Inativo", color: "bg-gray-500" },
    { value: "Planejado", label: "Planejado", color: "bg-blue-500" },
    { value: "Suspenso", label: "Suspenso", color: "bg-yellow-500" },
    { value: "Arquivado", label: "Arquivado", color: "bg-red-500" },
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Categoria</FormLabel>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={categoriesLoading}
                          >
                            {categoriesLoading ? "Carregando..." : field.value || "Selecione ou crie uma categoria"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar ou criar categoria..." 
                            value={categoryInput}
                            onValueChange={setCategoryInput}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {categoryInput && (
                                <div className="p-2">
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    className="w-full justify-start"
                                    onClick={() => createCategoryMutation.mutate(categoryInput)}
                                    disabled={createCategoryMutation.isPending}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar "{categoryInput}"
                                  </Button>
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {dbCategories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    field.onChange(category.name);
                                    setCategoryOpen(false);
                                  }}
                                  className="flex items-center justify-between group"
                                >
                                  <div className="flex items-center">
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === category.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {category.name}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCategoryMutation.mutate(category.id);
                                    }}
                                    disabled={deleteCategoryMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <FormControl>
                      <BranchSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>Filial onde o treinamento será realizado</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pelo Treinamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa responsável" {...field} />
                    </FormControl>
                    <FormDescription>Digite o nome do colaborador responsável</FormDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="duration_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="999" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutos</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="59" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Inicial</FormLabel>
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
                              {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
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
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Final</FormLabel>
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
                              {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
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
              </div>
            </div>

            {/* Seção de Avaliação de Eficácia */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground">Avaliação de Eficácia</h4>
              
              <FormField
                control={form.control}
                name="efficacy_evaluation_deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo para Avaliação de Eficácia</FormLabel>
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
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data limite"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          locale={ptBR}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data limite para o responsável realizar a avaliação de eficácia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notify_responsible_email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Notificar Responsável por Email
                      </FormLabel>
                      <FormDescription>
                        O responsável receberá um email quando a avaliação de eficácia estiver próxima do prazo
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

              {form.watch("notify_responsible_email") && (
                <FormField
                  control={form.control}
                  name="responsible_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Responsável</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@empresa.com" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Email para onde serão enviadas as notificações de avaliação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", status.color)} />
                            {status.label}
                          </div>
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