import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  User,
  Plus,
  X 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrainingPrograms } from "@/services/trainingPrograms";
import { getEmployees } from "@/services/employees";
import { createTrainingSchedule, updateTrainingSchedule } from "@/services/trainingSchedules";

const scheduleSchema = z.object({
  training_program_id: z.string().min(1, "Programa é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().min(1, "Horário de término é obrigatório"),
  location: z.string().min(1, "Local é obrigatório"),
  instructor: z.string().min(1, "Instrutor é obrigatório"),
  max_participants: z.number().min(1, "Número mínimo de participantes é 1"),
  status: z.string().default("Planejado"),
});

interface TrainingScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: any | null;
}

export function TrainingScheduleModal({ 
  open, 
  onOpenChange, 
  schedule 
}: TrainingScheduleModalProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!schedule;

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      training_program_id: "",
      title: "",
      description: "",
      start_date: new Date(),
      end_date: new Date(),
      start_time: "09:00",
      end_time: "17:00",
      location: "",
      instructor: "",
      max_participants: 20,
      status: "Planejado",
    },
  });

  // Fetch training programs
  const { data: programs = [], isLoading: isLoadingPrograms, error: programsError } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms,
  });

  // Log para debug
  useEffect(() => {
    if (open) {
      console.log('TrainingScheduleModal - Programs loaded:', programs.length, 'Error:', programsError);
    }
  }, [open, programs, programsError]);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-schedule'],
    queryFn: getEmployees,
    staleTime: 0, // Sempre buscar dados frescos
  });

  React.useEffect(() => {
    if (schedule) {
      form.reset({
        training_program_id: schedule.training_program_id || "",
        title: schedule.title || "",
        description: schedule.description || "",
        start_date: schedule.start_date ? new Date(schedule.start_date) : new Date(),
        end_date: schedule.end_date ? new Date(schedule.end_date) : new Date(),
        start_time: schedule.start_time || "09:00",
        end_time: schedule.end_time || "17:00",
        location: schedule.location || "",
        instructor: schedule.instructor || "",
        max_participants: schedule.max_participants || 20,
        status: schedule.status || "Planejado",
      });
      
      setSelectedParticipants(schedule.participants || []);
    } else {
      form.reset({
        training_program_id: "",
        title: "",
        description: "",
        start_date: new Date(),
        end_date: new Date(),
        start_time: "09:00",
        end_time: "17:00",
        location: "",
        instructor: "",
        max_participants: 20,
        status: "Planejado",
      });
      
      setSelectedParticipants([]);
    }
  }, [schedule, form]);

  // Observar mudança de programa e auto-preencher datas
  const selectedProgramId = form.watch('training_program_id');

  useEffect(() => {
    if (selectedProgramId && !isEditing) {
      const selectedProgram = programs.find(p => p.id === selectedProgramId);
      
      if (selectedProgram) {
        // Atualizar datas com as datas do programa (usando T12:00:00 para evitar shift de timezone)
        if (selectedProgram.start_date) {
          form.setValue('start_date', new Date(selectedProgram.start_date + 'T12:00:00'));
        }
        if (selectedProgram.end_date) {
          form.setValue('end_date', new Date(selectedProgram.end_date + 'T12:00:00'));
        } else if (selectedProgram.start_date) {
          form.setValue('end_date', new Date(selectedProgram.start_date + 'T12:00:00'));
        }
        
        // Preencher título sugerido se estiver vazio
        const currentTitle = form.getValues('title');
        if (!currentTitle) {
          form.setValue('title', `${selectedProgram.name} - Turma A`);
        }
      }
    }
  }, [selectedProgramId, programs, isEditing, form]);

  const onInvalid = (errors: any) => {
    console.log('TrainingScheduleModal - Validation errors:', errors);
    const firstError = Object.values(errors)[0] as any;
    toast({
      title: "Campos obrigatórios",
      description: firstError?.message || "Por favor, preencha todos os campos obrigatórios antes de salvar.",
      variant: "destructive",
    });
  };

  const onSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    if (isSubmitting) return; // Previne múltiplas submissões
    
    setIsSubmitting(true);
    console.log('TrainingScheduleModal - Submitting values:', values);
    
    try {
      const submissionData = {
        training_program_id: values.training_program_id,
        title: values.title,
        description: values.description,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: values.end_date.toISOString().split('T')[0],
        start_time: values.start_time,
        end_time: values.end_time,
        location: values.location,
        instructor: values.instructor,
        max_participants: values.max_participants,
        status: values.status,
        participants: selectedParticipants,
      };

      console.log('TrainingScheduleModal - Submission data:', submissionData);

      if (isEditing && schedule?.id) {
        await updateTrainingSchedule(schedule.id, submissionData);
      } else {
        await createTrainingSchedule(submissionData);
      }

      toast({
        title: "Sucesso",
        description: isEditing 
          ? "Agendamento atualizado com sucesso!" 
          : "Agendamento criado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["training-schedules"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('TrainingScheduleModal - Error saving schedule:', error);
      console.error('TrainingScheduleModal - Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      toast({
        title: "Erro ao salvar agendamento",
        description: error?.message || "Ocorreu um erro. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addParticipant = (employeeId: string) => {
    if (!selectedParticipants.includes(employeeId) && 
        selectedParticipants.length < form.getValues('max_participants')) {
      setSelectedParticipants([...selectedParticipants, employeeId]);
    }
  };

  const removeParticipant = (employeeId: string) => {
    setSelectedParticipants(selectedParticipants.filter(id => id !== employeeId));
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.full_name || 'Funcionário não encontrado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {isEditing ? "Editar Agendamento" : "Novo Agendamento de Treinamento"}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes do agendamento de treinamento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
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
                        <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                          {isLoadingPrograms ? (
                            <SelectItem value="_loading" disabled>
                              Carregando programas...
                            </SelectItem>
                          ) : programs.length === 0 ? (
                            <SelectItem value="_empty" disabled>
                              Nenhum programa encontrado
                            </SelectItem>
                          ) : (
                            programs.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name} - {program.category}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Sessão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Treinamento de Segurança - Turma A" {...field} />
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
                          placeholder="Detalhes sobre o treinamento..." 
                          className="min-h-[100px]" 
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
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
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
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                              locale={ptBR}
                              initialFocus
                              className="pointer-events-auto"
                              disabled={(date) => {
                                const selectedProgram = programs.find(p => p.id === selectedProgramId);
                                if (!selectedProgram?.start_date) return false;
                                
                                const programStart = new Date(selectedProgram.start_date + 'T00:00:00');
                                const programEnd = selectedProgram.end_date 
                                  ? new Date(selectedProgram.end_date + 'T23:59:59')
                                  : new Date(selectedProgram.start_date + 'T23:59:59');
                                
                                return date < programStart || date > programEnd;
                              }}
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
                        <FormLabel>Data de Término</FormLabel>
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
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                              locale={ptBR}
                              initialFocus
                              className="pointer-events-auto"
                              disabled={(date) => {
                                const selectedProgram = programs.find(p => p.id === selectedProgramId);
                                if (!selectedProgram?.start_date) return false;
                                
                                const programStart = new Date(selectedProgram.start_date + 'T00:00:00');
                                const programEnd = selectedProgram.end_date 
                                  ? new Date(selectedProgram.end_date + 'T23:59:59')
                                  : new Date(selectedProgram.start_date + 'T23:59:59');
                                
                                return date < programStart || date > programEnd;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Término</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala de Treinamento 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrutor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do instrutor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Participantes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planejado">Planejado</SelectItem>
                          <SelectItem value="Confirmado">Confirmado</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Participantes ({selectedParticipants.length}/{form.watch('max_participants')})
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Adicionar Funcionários</Label>
                  <Select onValueChange={addParticipant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => !selectedParticipants.includes(emp.id))
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} - {employee.department}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Participantes Selecionados</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                    {selectedParticipants.map((participantId) => (
                      <div key={participantId} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{getEmployeeName(participantId)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(participantId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"} Agendamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}