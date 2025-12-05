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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Search, Users, CheckCircle2, AlertCircle, Check, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmployeeTraining, createEmployeeTraining, updateEmployeeTraining, checkExistingEnrollments } from "@/services/trainingPrograms";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const employeeTrainingSchema = z.object({
  employee_id: z.string().optional(),
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

  // Bulk mode states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number } | null>(null);
  
  // Duplicate check states
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [enrollmentConflicts, setEnrollmentConflicts] = useState<{
    alreadyEnrolled: Array<{ id: string; name: string }>;
    notEnrolled: Array<{ id: string; name: string }>;
  } | null>(null);
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof employeeTrainingSchema> | null>(null);

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

  // Get unique departments
  const departments = useMemo(() => {
    const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(uniqueDepts);
  }, [employees]);

  // Filter employees for bulk mode
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [employees, departmentFilter, searchTerm]);

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
      setIsBulkMode(false);
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

  // Reset bulk state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployees(new Set());
      setDepartmentFilter("all");
      setSearchTerm("");
      setProgress(0);
      setBulkResults(null);
      setIsSubmitting(false);
      setShowConflictDialog(false);
      setEnrollmentConflicts(null);
      setPendingFormValues(null);
      if (!isEditing) {
        setIsBulkMode(false);
      }
    }
  }, [open, isEditing]);

  const toggleEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  // Execute bulk enrollment (called after duplicate check)
  const executeBulkEnrollment = async (
    employeeIds: string[],
    values: z.infer<typeof employeeTrainingSchema>
  ) => {
    setIsSubmitting(true);
    setBulkResults(null);
    
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < employeeIds.length; i++) {
      try {
        await createEmployeeTraining({
          employee_id: employeeIds[i],
          training_program_id: values.training_program_id,
          completion_date: values.completion_date?.toISOString(),
          status: values.status,
          trainer: values.trainer,
          notes: values.notes,
          company_id: "",
        });
        successCount++;
      } catch (error) {
        failedCount++;
      }
      
      setProgress(((i + 1) / employeeIds.length) * 100);
    }

    setIsSubmitting(false);
    setBulkResults({ success: successCount, failed: failedCount });
    
    if (failedCount === 0) {
      toast({
        title: "Sucesso",
        description: `${successCount} treinamentos registrados com sucesso!`,
      });
    } else {
      toast({
        title: "Concluído com avisos",
        description: `${successCount} registrados, ${failedCount} falharam`,
        variant: "destructive",
      });
    }

    queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
    
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  // Proceed with only non-enrolled employees
  const proceedWithValidEnrollments = async () => {
    setShowConflictDialog(false);
    if (pendingFormValues && enrollmentConflicts && enrollmentConflicts.notEnrolled.length > 0) {
      await executeBulkEnrollment(
        enrollmentConflicts.notEnrolled.map(e => e.id),
        pendingFormValues
      );
    }
    setPendingFormValues(null);
    setEnrollmentConflicts(null);
  };

  const onSubmit = async (values: z.infer<typeof employeeTrainingSchema>) => {
    try {
      if (isBulkMode && selectedEmployees.size > 0) {
        // Bulk mode - check for duplicates first
        const employeeArray = Array.from(selectedEmployees);
        
        // Check for existing enrollments
        const { alreadyEnrolled, notEnrolled } = await checkExistingEnrollments(
          values.training_program_id,
          employeeArray
        );

        if (alreadyEnrolled.length > 0) {
          // Map IDs to names for better UX
          const alreadyEnrolledWithNames = alreadyEnrolled.map(id => {
            const emp = employees.find(e => e.id === id);
            return { id, name: emp?.full_name || 'Funcionário desconhecido' };
          });
          
          const notEnrolledWithNames = notEnrolled.map(id => {
            const emp = employees.find(e => e.id === id);
            return { id, name: emp?.full_name || 'Funcionário desconhecido' };
          });

          setEnrollmentConflicts({
            alreadyEnrolled: alreadyEnrolledWithNames,
            notEnrolled: notEnrolledWithNames
          });
          setPendingFormValues(values);
          setShowConflictDialog(true);
          return;
        }

        // No duplicates, proceed with enrollment
        await executeBulkEnrollment(employeeArray, values);
      } else {
        // Single mode - original behavior
        if (!values.employee_id) {
          toast({
            title: "Erro",
            description: "Selecione um funcionário",
            variant: "destructive",
          });
          return;
        }

        const submissionData = {
          employee_id: values.employee_id!,
          training_program_id: values.training_program_id!,
          completion_date: values.completion_date?.toISOString(),
          score: values.score,
          status: values.status!,
          trainer: values.trainer,
          notes: values.notes,
          company_id: "",
        };

        if (isEditing && training?.id) {
          await updateEmployeeTraining(training.id, submissionData);
          toast({
            title: "Sucesso",
            description: "Treinamento do funcionário atualizado com sucesso!",
          });
        } else {
          await createEmployeeTraining(submissionData);
          toast({
            title: "Sucesso",
            description: "Treinamento do funcionário registrado com sucesso!",
          });
        }

        queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
        queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('EmployeeTrainingModal: Error saving training:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao salvar treinamento: ${error.message || 'Tente novamente.'}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
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
      <DialogContent className={cn("max-h-[90vh]", isBulkMode ? "max-w-3xl" : "max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Treinamento do Funcionário" : "Registrar Treinamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do treinamento do funcionário."
              : isBulkMode
                ? "Registre múltiplos funcionários em um programa de treinamento."
                : "Registre a participação de um funcionário em um programa de treinamento."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Bulk Mode Toggle - only show when not editing */}
        {!isEditing && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Switch 
              id="bulk-mode" 
              checked={isBulkMode} 
              onCheckedChange={setIsBulkMode}
              disabled={isSubmitting}
            />
            <Label htmlFor="bulk-mode" className="flex items-center gap-2 cursor-pointer">
              <Users className="w-4 h-4" />
              Registro em lote (múltiplos funcionários)
            </Label>
          </div>
        )}

        {/* Show progress/results during bulk submission */}
        {isSubmitting || bulkResults ? (
          <div className="space-y-4 py-8">
            <div className="text-center space-y-2">
              {isSubmitting ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <p className="font-medium">Registrando treinamentos...</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress)}% concluído
                  </p>
                </>
              ) : bulkResults && (
                <>
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                    bulkResults.failed === 0 ? "bg-green-100" : "bg-yellow-100"
                  )}>
                    {bulkResults.failed === 0 ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  <p className="font-medium">Registro concluído!</p>
                  <p className="text-sm text-muted-foreground">
                    {bulkResults.success} registrados com sucesso
                    {bulkResults.failed > 0 && `, ${bulkResults.failed} falharam`}
                  </p>
                </>
              )}
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Selection - Single or Bulk */}
              {isBulkMode ? (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar funcionários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select All */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                        onCheckedChange={toggleAll}
                      />
                      <span className="text-sm font-medium">Selecionar todos ({filteredEmployees.length})</span>
                    </div>
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {selectedEmployees.size} selecionados
                    </Badge>
                  </div>

                  {/* Employee List */}
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    <div className="space-y-2">
                      {filteredEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedEmployees.has(employee.id) ? "bg-primary/5 border-primary" : "hover:bg-muted"
                          )}
                          onClick={() => toggleEmployee(employee.id)}
                        >
                          <div 
                            className={cn(
                              "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
                              selectedEmployees.has(employee.id) && "bg-primary text-primary-foreground"
                            )}
                          >
                            {selectedEmployees.has(employee.id) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{employee.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.employee_code} • {employee.department || "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              )}

              {/* Training Program Selection */}
              <FormField
                control={form.control}
                name="training_program_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programa de Treinamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o programa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              <div className="grid grid-cols-3 gap-4">
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
                              type="button"
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
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Score field - only show in single mode */}
                {!isBulkMode && (
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
                )}
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

              {/* Notes - only in single mode */}
              {!isBulkMode && (
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
              )}

              {/* Bulk mode summary */}
              {isBulkMode && selectedEmployees.size > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Resumo do Registro:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {selectedEmployees.size} funcionários serão registrados</li>
                    <li>• Status: {form.watch("status")}</li>
                    <li>• Programa: {programs.find(p => p.id === form.watch("training_program_id"))?.name || "Não selecionado"}</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isBulkMode && selectedEmployees.size === 0}
                >
                  {isEditing 
                    ? "Atualizar" 
                    : isBulkMode 
                      ? `Registrar ${selectedEmployees.size} Funcionários`
                      : "Registrar"
                  } Treinamento
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>

      {/* Conflict Dialog for duplicate enrollments */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Funcionários já inscritos
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Os seguintes funcionários já estão inscritos neste programa:</p>
                <ul className="list-disc pl-5 space-y-1 max-h-[150px] overflow-y-auto">
                  {enrollmentConflicts?.alreadyEnrolled.map(emp => (
                    <li key={emp.id} className="text-foreground">{emp.name}</li>
                  ))}
                </ul>
                {enrollmentConflicts && enrollmentConflicts.notEnrolled.length > 0 ? (
                  <p className="pt-2 text-foreground font-medium">
                    Deseja prosseguir inscrevendo apenas os {enrollmentConflicts.notEnrolled.length} funcionário(s) não inscrito(s)?
                  </p>
                ) : (
                  <p className="pt-2 text-amber-600 font-medium">
                    Todos os funcionários selecionados já estão inscritos neste programa.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConflictDialog(false);
              setPendingFormValues(null);
              setEnrollmentConflicts(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            {enrollmentConflicts && enrollmentConflicts.notEnrolled.length > 0 && (
              <AlertDialogAction onClick={proceedWithValidEnrollments}>
                Prosseguir ({enrollmentConflicts.notEnrolled.length})
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
