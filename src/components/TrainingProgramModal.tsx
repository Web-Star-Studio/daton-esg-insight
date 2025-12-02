import { useState, useEffect, useMemo } from "react";
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
import { TrainingProgram, createTrainingProgram, updateTrainingProgram, createEmployeeTraining, getTrainingPrograms } from "@/services/trainingPrograms";
import { getTrainingCategories, createTrainingCategory, deleteTrainingCategory } from "@/services/trainingCategories";
import { getTrainingStatuses, createTrainingStatus } from "@/services/trainingStatuses";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Trash2, CalendarIcon, Users, Search, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BranchSelect } from "@/components/BranchSelect";
import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  // Campos para avaliação de eficácia
  requires_efficacy_evaluation: z.boolean().default(false),
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
  const [statusInput, setStatusInput] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  
  // Estados para seleção de participantes (apenas na criação)
  const [pendingParticipants, setPendingParticipants] = useState<Set<string>>(new Set());
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Query para buscar programas existentes (para funcionalidade de cópia)
  const { data: existingPrograms = [] } = useQuery({
    queryKey: ["training-programs-for-copy"],
    queryFn: getTrainingPrograms,
    enabled: open && !isEditing,
  });

  // Query para buscar funcionários ativos
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-training-modal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, department")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: open && !isEditing,
  });

  // Departamentos únicos para filtro
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  // Funcionários filtrados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = !participantSearchTerm || 
        emp.full_name?.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(participantSearchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, participantSearchTerm, departmentFilter]);

  // Toggle participante
  const toggleParticipant = (employeeId: string) => {
    setPendingParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  // Selecionar/Deselecionar todos (filtrados)
  const toggleAllFiltered = () => {
    const filteredIds = filteredEmployees.map(e => e.id);
    const allSelected = filteredIds.every(id => pendingParticipants.has(id));
    
    setPendingParticipants(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        filteredIds.forEach(id => newSet.delete(id));
      } else {
        filteredIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Função para copiar de um programa existente
  const handleCopyFromProgram = (programId: string) => {
    const sourceProg = existingPrograms.find(p => p.id === programId);
    if (!sourceProg) return;

    const hours = Math.floor(sourceProg.duration_hours || 0);
    const minutes = Math.round(((sourceProg.duration_hours || 0) - hours) * 60);

    form.setValue('name', sourceProg.name);
    form.setValue('description', sourceProg.description || '');
    form.setValue('category', sourceProg.category || '');
    form.setValue('duration_hours', hours);
    form.setValue('duration_minutes', minutes);
    form.setValue('is_mandatory', sourceProg.is_mandatory);
    form.setValue('branch_id', sourceProg.branch_id || '');
    form.setValue('requires_efficacy_evaluation', !!sourceProg.efficacy_evaluation_deadline);
    // Não copiar: datas, instrutor, participantes, email

    toast({
      title: "Programa copiado",
      description: "Informações do programa foram copiadas. Ajuste as datas, instrutor e participantes.",
    });
  };

  // Fetch categories from database
  const { data: dbCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['training-categories'],
    queryFn: getTrainingCategories,
  });

  // Fetch statuses from database
  const { data: dbStatuses = [] } = useQuery({
    queryKey: ['training-statuses'],
    queryFn: () => getTrainingStatuses(),
  });

  // Fallback status options when database is empty
  const defaultStatusOptions = [
    { name: "Ativo", color: "bg-green-500" },
    { name: "Inativo", color: "bg-gray-500" },
    { name: "Planejado", color: "bg-blue-500" },
    { name: "Suspenso", color: "bg-yellow-500" },
    { name: "Arquivado", color: "bg-red-500" },
  ];

  const statusOptions = dbStatuses.length > 0 
    ? dbStatuses.map(s => ({ name: s.name, color: s.color }))
    : defaultStatusOptions;

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
        description: "Categoria criada com sucesso.",
      });
    },
  });

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user?.id)
        .single();
      return createTrainingStatus(name, profile?.company_id || '');
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['training-statuses'] });
      form.setValue('status', newStatus.name);
      setStatusInput("");
      setStatusOpen(false);
      toast({
        title: "Sucesso",
        description: "Status criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar status",
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
      requires_efficacy_evaluation: false,
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
        requires_efficacy_evaluation: !!program.efficacy_evaluation_deadline,
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
        requires_efficacy_evaluation: false,
        efficacy_evaluation_deadline: null,
        notify_responsible_email: false,
        responsible_email: "",
      });
    }
  }, [program, form]);

  // Limpar participantes pendentes quando o modal abrir para criação
  useEffect(() => {
    if (open && !program) {
      setPendingParticipants(new Set());
      setParticipantSearchTerm("");
      setDepartmentFilter("all");
    }
  }, [open, program]);

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
        efficacy_evaluation_deadline: values.requires_efficacy_evaluation && values.efficacy_evaluation_deadline 
          ? format(values.efficacy_evaluation_deadline, 'yyyy-MM-dd') 
          : null,
        notify_responsible_email: values.requires_efficacy_evaluation && values.notify_responsible_email,
        responsible_email: values.requires_efficacy_evaluation && values.responsible_email?.trim() 
          ? values.responsible_email.trim() 
          : null,
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
          company_id: "",
          created_by_user_id: "",
        };
        
        const newProgram = await createTrainingProgram(programData);
        
        // Criar participantes pendentes após criar o programa
        if (pendingParticipants.size > 0 && newProgram?.id) {
          const participantArray = Array.from(pendingParticipants);
          let successCount = 0;
          
          for (const employeeId of participantArray) {
            try {
              await createEmployeeTraining({
                employee_id: employeeId,
                training_program_id: newProgram.id,
                status: "Inscrito",
                company_id: "",
              });
              successCount++;
            } catch (err) {
              console.error(`Erro ao inscrever funcionário ${employeeId}:`, err);
            }
          }
          
          toast({
            title: "Sucesso",
            description: `Programa criado com ${successCount} participante(s) inscrito(s)!`,
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Programa de treinamento criado com sucesso!",
          });
        }
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

  const watchRequiresEfficacy = form.watch("requires_efficacy_evaluation");
  const watchNotifyEmail = form.watch("notify_responsible_email");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Programa de Treinamento" : "Novo Programa de Treinamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do programa de treinamento."
              : "Crie um novo programa de treinamento com todas as informações necessárias."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Copiar de treinamento existente - apenas na criação */}
            {!isEditing && existingPrograms.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/30">
                <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select onValueChange={handleCopyFromProgram}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Copiar de treinamento existente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingPrograms.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ============ SEÇÃO: INFORMAÇÕES BÁSICAS ============ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Informações Básicas
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Programa *</FormLabel>
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
                      <FormLabel>Categoria *</FormLabel>
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
                                Nenhuma categoria encontrada.
                              </CommandEmpty>
                              <CommandGroup>
                                {/* Opção de criar nova categoria - sempre visível quando há texto */}
                                {categoryInput && !dbCategories.some(c => c.name.toLowerCase() === categoryInput.toLowerCase()) && (
                                  <CommandItem
                                    onSelect={() => createCategoryMutation.mutate(categoryInput)}
                                    className="text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar "{categoryInput}"
                                  </CommandItem>
                                )}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsible_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrutor Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do instrutor/responsável" {...field} />
                      </FormControl>
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
                    <FormLabel>Objetivo / Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o conteúdo e objetivos do treinamento"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ============ SEÇÃO: CRONOGRAMA ============ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Cronograma
                </h3>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
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
                              {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
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
                              {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
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
            </div>

            <Separator />

            {/* ============ SEÇÃO: CONFIGURAÇÕES ============ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Configurações
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Status</FormLabel>
                      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    statusOptions.find(s => s.name === field.value)?.color || "bg-gray-500"
                                  )} />
                                  {field.value}
                                </div>
                              ) : (
                                "Selecione o status..."
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar ou criar status..." 
                              value={statusInput}
                              onValueChange={setStatusInput}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum status encontrado.
                              </CommandEmpty>
                              <CommandGroup>
                                {/* Opção de criar novo status - sempre visível quando há texto */}
                                {statusInput && !statusOptions.some(s => 
                                  s.name.toLowerCase() === statusInput.toLowerCase()
                                ) && (
                                  <CommandItem
                                    onSelect={() => createStatusMutation.mutate(statusInput)}
                                    className="text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar "{statusInput}"
                                  </CommandItem>
                                )}
                                {statusOptions.map((status) => (
                                  <CommandItem
                                    key={status.name}
                                    value={status.name}
                                    onSelect={() => {
                                      field.onChange(status.name);
                                      setStatusOpen(false);
                                      setStatusInput("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === status.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className={cn("w-2 h-2 rounded-full mr-2", status.color)} />
                                    {status.name}
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

                <FormField
                  control={form.control}
                  name="is_mandatory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Treinamento Obrigatório</FormLabel>
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
              </div>

              {/* Avaliação de Eficácia */}
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <FormField
                  control={form.control}
                  name="requires_efficacy_evaluation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Necessita Avaliação de Eficácia
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Marque se este treinamento requer avaliação de eficácia após conclusão
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {watchRequiresEfficacy && (
                  <div className="space-y-4 pt-3 border-t">
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notify_responsible_email"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Notificar por Email</FormLabel>
                            <FormDescription className="text-xs">
                              Enviar lembrete quando a avaliação estiver próxima do prazo
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

                    {watchNotifyEmail && (
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ============ SEÇÃO: PARTICIPANTES (apenas na criação) ============ */}
            {!isEditing && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        Participantes
                      </h3>
                      {pendingParticipants.size > 0 && (
                        <Badge variant="secondary">
                          {pendingParticipants.size} selecionado(s)
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllFiltered}
                    >
                      {filteredEmployees.every(e => pendingParticipants.has(e.id)) && filteredEmployees.length > 0
                        ? "Desmarcar todos"
                        : "Selecionar todos"}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar funcionários..."
                        value={participantSearchTerm}
                        onChange={(e) => setParticipantSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os departamentos</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept || "sem-dept"}>
                            {dept || "Sem departamento"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="h-[200px] rounded-lg border bg-background overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Nenhum funcionário encontrado
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                              pendingParticipants.has(employee.id) && "bg-primary/10"
                            )}
                            onClick={() => toggleParticipant(employee.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleParticipant(employee.id);
                              }
                            }}
                          >
                            <div 
                              className={cn(
                                "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
                                pendingParticipants.has(employee.id) && "bg-primary text-primary-foreground"
                              )}
                            >
                              {pendingParticipants.has(employee.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{employee.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {employee.employee_code} • {employee.department || "Sem departamento"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {pendingParticipants.size > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(pendingParticipants).slice(0, 5).map((id) => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {emp.full_name}
                          </Badge>
                        ) : null;
                      })}
                      {pendingParticipants.size > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{pendingParticipants.size - 5} mais
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar Treinamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
