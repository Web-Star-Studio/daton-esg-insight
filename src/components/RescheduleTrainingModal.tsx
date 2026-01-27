import { useState, useMemo, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarIcon, 
  Search, 
  Users, 
  CalendarClock, 
  Trash2, 
  Plus, 
  Check,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  UserMinus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  TrainingProgram, 
  updateTrainingProgram, 
  createEmployeeTraining 
} from "@/services/trainingPrograms";
import { unifiedToast } from "@/utils/unifiedToast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const rescheduleSchema = z.object({
  start_date: z.date({ message: "Data de início é obrigatória" }),
  end_date: z.date().optional(),
  instructor: z.string().optional(),
  reason: z.string().optional(),
});

interface RescheduleTrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: TrainingProgram | null;
}

interface Participant {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department: string;
  status: string;
}

export function RescheduleTrainingModal({ 
  open, 
  onOpenChange, 
  program 
}: RescheduleTrainingModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Participant management
  const [currentParticipants, setCurrentParticipants] = useState<Participant[]>([]);
  const [participantsToRemove, setParticipantsToRemove] = useState<Set<string>>(new Set());
  const [participantsToAdd, setParticipantsToAdd] = useState<Set<string>>(new Set());
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const form = useForm<z.infer<typeof rescheduleSchema>>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      start_date: undefined,
      end_date: undefined,
      instructor: "",
      reason: "",
    },
  });

  // Fetch current participants
  const { data: participants = [], refetch: refetchParticipants } = useQuery({
    queryKey: ["training-participants", program?.id],
    queryFn: async () => {
      if (!program?.id) return [];
      
      const { data: trainings, error } = await supabase
        .from("employee_trainings")
        .select("id, employee_id, status")
        .eq("training_program_id", program.id);
      
      if (error) throw error;
      if (!trainings?.length) return [];

      const employeeIds = trainings.map(t => t.employee_id);
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, department")
        .in("id", employeeIds);

      if (empError) throw empError;

      return trainings.map(training => {
        const employee = employees?.find(e => e.id === training.employee_id);
        return {
          id: training.id,
          employee_id: training.employee_id,
          employee_name: employee?.full_name || "N/A",
          employee_code: employee?.employee_code || "N/A",
          department: employee?.department || "N/A",
          status: training.status,
        };
      });
    },
    enabled: !!program?.id && open,
  });

  // Fetch all employees for adding
  const { data: allEmployees = [] } = useQuery({
    queryKey: ["employees-for-reschedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, department")
        .eq("status", "Ativo")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 0, // Sempre buscar dados frescos
  });

  // Reset modal when program changes or closes
  useEffect(() => {
    if (open && program) {
      setStep(1);
      setParticipantsToRemove(new Set());
      setParticipantsToAdd(new Set());
      setShowAddParticipants(false);
      setSearchTerm("");
      setDepartmentFilter("all");
      
      form.reset({
        start_date: program.start_date ? new Date(program.start_date) : undefined,
        end_date: program.end_date ? new Date(program.end_date) : undefined,
        instructor: program.responsible_name || "",
        reason: "",
      });
    }
  }, [open, program, form]);

  // Update current participants when data loads
  useEffect(() => {
    if (participants.length > 0) {
      setCurrentParticipants(participants);
    }
  }, [participants]);

  const departments = useMemo(() => {
    const uniqueDepts = new Set(allEmployees.map(e => e.department).filter(Boolean));
    return Array.from(uniqueDepts);
  }, [allEmployees]);

  // Filter employees not already in the training
  const availableEmployees = useMemo(() => {
    const currentIds = new Set(currentParticipants.map(p => p.employee_id));
    return allEmployees.filter(emp => {
      const notInTraining = !currentIds.has(emp.id) || participantsToRemove.has(
        currentParticipants.find(p => p.employee_id === emp.id)?.id || ""
      );
      const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return notInTraining && matchesDept && matchesSearch;
    });
  }, [allEmployees, currentParticipants, participantsToRemove, departmentFilter, searchTerm]);

  const toggleRemoveParticipant = (participantId: string) => {
    const newSet = new Set(participantsToRemove);
    if (newSet.has(participantId)) {
      newSet.delete(participantId);
    } else {
      newSet.add(participantId);
    }
    setParticipantsToRemove(newSet);
  };

  const toggleAddParticipant = (employeeId: string) => {
    const newSet = new Set(participantsToAdd);
    if (newSet.has(employeeId)) {
      newSet.delete(employeeId);
    } else {
      newSet.add(employeeId);
    }
    setParticipantsToAdd(newSet);
  };

  const onSubmit = async (values: z.infer<typeof rescheduleSchema>) => {
    if (!program) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Update training program dates
      await updateTrainingProgram(program.id, {
        start_date: values.start_date?.toISOString().split('T')[0],
        end_date: values.end_date?.toISOString().split('T')[0],
        scheduled_date: values.start_date?.toISOString().split('T')[0],
        responsible_name: values.instructor || program.responsible_name,
      });

      // 2. Remove participants
      if (participantsToRemove.size > 0) {
        const removeIds = Array.from(participantsToRemove);
        const { error: deleteError } = await supabase
          .from("employee_trainings")
          .delete()
          .in("id", removeIds);
        
        if (deleteError) throw deleteError;
      }

      // 3. Add new participants (presença já é marcada automaticamente no createEmployeeTraining)
      if (participantsToAdd.size > 0) {
        const addIds = Array.from(participantsToAdd);
        for (const empId of addIds) {
          await createEmployeeTraining({
            employee_id: empId,
            training_program_id: program.id,
            status: "Inscrito",
            company_id: program.company_id,
          });
        }
      }

      unifiedToast.success("Treinamento reagendado com sucesso!");
      
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training-participants"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error rescheduling training:", error);
      unifiedToast.error("Erro ao reagendar treinamento", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeParticipants = currentParticipants.filter(
    p => !participantsToRemove.has(p.id)
  );

  if (!open || !program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Reagendar Treinamento
          </DialogTitle>
          <DialogDescription>
            {program.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[
                { num: 1, label: "Datas" },
                { num: 2, label: "Participantes" },
                { num: 3, label: "Confirmar" },
              ].map((s, index) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                      step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                    </div>
                    <span className="text-xs mt-1 text-muted-foreground">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div className={cn("flex-1 h-1 mx-2", step > s.num ? "bg-primary" : "bg-muted")} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Dates */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium">Datas Atuais:</p>
                  <p className="text-sm text-muted-foreground">
                    {program.start_date 
                      ? format(new Date(program.start_date), "dd/MM/yyyy", { locale: ptBR })
                      : "Não definida"
                    }
                    {program.end_date && ` - ${format(new Date(program.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Nova Data de Início *</FormLabel>
                        <Popover modal={false}>
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
                              initialFocus
                              locale={ptBR}
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
                        <FormLabel>Nova Data de Término</FormLabel>
                        <Popover modal={false}>
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
                              initialFocus
                              locale={ptBR}
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
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrutor/Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do instrutor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo do Reagendamento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Conflito de agenda, indisponibilidade de sala..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    disabled={!form.watch("start_date")}
                  >
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Participants */}
            {step === 2 && (
              <div className="space-y-4">
                {!showAddParticipants ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Participantes Atuais ({activeParticipants.length})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddParticipants(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Participantes
                      </Button>
                    </div>

                    {participantsToRemove.size > 0 && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
                        <UserMinus className="h-4 w-4" />
                        {participantsToRemove.size} participante(s) serão removidos
                      </div>
                    )}

                    {participantsToAdd.size > 0 && (
                      <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        {participantsToAdd.size} novo(s) participante(s) serão adicionados
                      </div>
                    )}

                    <ScrollArea className="h-[300px] border rounded-lg">
                      <div className="p-4 space-y-2">
                        {currentParticipants.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum participante inscrito</p>
                          </div>
                        ) : (
                          currentParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                participantsToRemove.has(participant.id) 
                                  ? "bg-destructive/5 border-destructive/30 opacity-60" 
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className={cn(
                                    "font-medium",
                                    participantsToRemove.has(participant.id) && "line-through"
                                  )}>
                                    {participant.employee_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {participant.employee_code} • {participant.department}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {participant.status}
                                </Badge>
                                <Button
                                  type="button"
                                  variant={participantsToRemove.has(participant.id) ? "secondary" : "ghost"}
                                  size="sm"
                                  onClick={() => toggleRemoveParticipant(participant.id)}
                                >
                                  {participantsToRemove.has(participant.id) ? (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Restaurar
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                      Remover
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddParticipants(false)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para lista
                      </Button>
                      <Badge variant="secondary">
                        {participantsToAdd.size} selecionados
                      </Badge>
                    </div>

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

                    <ScrollArea className="h-[280px] border rounded-lg">
                      <div className="p-4 space-y-2">
                        {availableEmployees.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhum funcionário disponível</p>
                          </div>
                        ) : (
                          availableEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                participantsToAdd.has(employee.id) 
                                  ? "bg-primary/5 border-primary" 
                                  : "hover:bg-muted"
                              )}
                              onClick={() => toggleAddParticipant(employee.id)}
                            >
                              <Checkbox
                                checked={participantsToAdd.has(employee.id)}
                                className="pointer-events-none"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{employee.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {employee.employee_code} • {employee.department || "N/A"}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium">Resumo das Alterações</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nova Data de Início</p>
                      <p className="font-medium">
                        {form.watch("start_date") 
                          ? format(form.watch("start_date")!, "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nova Data de Término</p>
                      <p className="font-medium">
                        {form.watch("end_date") 
                          ? format(form.watch("end_date")!, "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Instrutor</p>
                      <p className="font-medium">{form.watch("instructor") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Motivo</p>
                      <p className="font-medium">{form.watch("reason") || "-"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <p className="text-muted-foreground mb-2">Participantes</p>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{activeParticipants.length} mantidos</span>
                      </div>
                      {participantsToRemove.size > 0 && (
                        <div className="flex items-center gap-2 text-destructive">
                          <UserMinus className="h-4 w-4" />
                          <span>{participantsToRemove.size} removidos</span>
                        </div>
                      )}
                      {participantsToAdd.size > 0 && (
                        <div className="flex items-center gap-2 text-primary">
                          <UserPlus className="h-4 w-4" />
                          <span>{participantsToAdd.size} adicionados</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Confirmar Reagendamento"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
