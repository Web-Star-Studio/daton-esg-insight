import { useState, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Search, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createEmployeeTraining } from "@/services/trainingPrograms";
import { unifiedToast } from "@/utils/unifiedToast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const bulkTrainingSchema = z.object({
  training_program_id: z.string().min(1, "Programa de treinamento é obrigatório"),
  completion_date: z.date().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  trainer: z.string().optional(),
});

interface BulkTrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkTrainingModal({ open, onOpenChange }: BulkTrainingModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const form = useForm<z.infer<typeof bulkTrainingSchema>>({
    resolver: zodResolver(bulkTrainingSchema),
    defaultValues: {
      training_program_id: "",
      completion_date: undefined,
      status: "Inscrito",
      trainer: "",
    },
  });

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

  const departments = useMemo(() => {
    const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(uniqueDepts);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [employees, departmentFilter, searchTerm]);

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

  const onSubmit = async (values: z.infer<typeof bulkTrainingSchema>) => {
    if (selectedEmployees.size === 0) {
      unifiedToast.warning("Nenhum funcionário selecionado");
      return;
    }

    setIsSubmitting(true);
    setStep(4);
    setResults({ success: 0, failed: 0 });
    
    const employeeArray = Array.from(selectedEmployees);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < employeeArray.length; i++) {
      try {
        await createEmployeeTraining({
          employee_id: employeeArray[i],
          training_program_id: values.training_program_id,
          completion_date: values.completion_date?.toISOString(),
          status: values.status,
          trainer: values.trainer,
          notes: null,
          company_id: "",
        });
        successCount++;
      } catch (error) {
        failedCount++;
      }
      
      setProgress(((i + 1) / employeeArray.length) * 100);
      setResults({ success: successCount, failed: failedCount });
    }

    setIsSubmitting(false);
    
    if (failedCount === 0) {
      unifiedToast.success(`${successCount} treinamentos registrados com sucesso!`);
    } else {
      unifiedToast.warning(`${successCount} registrados, ${failedCount} falharam`);
    }

    queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
    
    setTimeout(() => {
      onOpenChange(false);
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setStep(1);
    setSelectedEmployees(new Set());
    setDepartmentFilter("all");
    setSearchTerm("");
    setProgress(0);
    setResults({ success: 0, failed: 0 });
    form.reset();
  };

  const statusOptions = ["Inscrito", "Em Andamento", "Concluído", "Cancelado", "Reprovado"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Registrar Treinamento em Lote</DialogTitle>
          <DialogDescription>
            Registre múltiplos funcionários em um programa de treinamento de uma só vez
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {s}
                  </div>
                  {s < 3 && <div className={cn("flex-1 h-1 mx-2", step > s ? "bg-primary" : "bg-muted")} />}
                </div>
              ))}
            </div>

            {/* Step 1: Select Program */}
            {step === 1 && (
              <div className="space-y-4">
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
                              <div className="flex items-center gap-2">
                                <span>{program.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {program.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    disabled={!form.watch("training_program_id")}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Select Employees */}
            {step === 2 && (
              <div className="space-y-4">
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
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <ScrollArea className="h-[300px] border rounded-lg p-4">
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
                        <Checkbox
                          checked={selectedEmployees.has(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
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

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setStep(3)}
                    disabled={selectedEmployees.size === 0}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Training Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Resumo do Registro:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {selectedEmployees.size} funcionários serão registrados</li>
                    <li>• Status: {form.watch("status")}</li>
                    <li>• Programa: {programs.find(p => p.id === form.watch("training_program_id"))?.name}</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    Registrar {selectedEmployees.size} Funcionários
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Progress */}
            {step === 4 && (
              <div className="space-y-6 py-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    {isSubmitting ? (
                      <Users className="w-8 h-8 text-primary animate-pulse" />
                    ) : results.failed === 0 ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">
                      {isSubmitting ? "Registrando treinamentos..." : "Concluído!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {results.success} de {selectedEmployees.size} registrados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(progress)}% completo
                    </p>
                  </div>

                  {!isSubmitting && (
                    <div className="flex gap-4 justify-center pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{results.success}</p>
                        <p className="text-xs text-muted-foreground">Sucesso</p>
                      </div>
                      {results.failed > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-destructive">{results.failed}</p>
                          <p className="text-xs text-muted-foreground">Falhas</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
