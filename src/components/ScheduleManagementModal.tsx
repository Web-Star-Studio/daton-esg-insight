import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Clock, Users, Calendar, Edit, Trash2 } from "lucide-react";
import { useCreateWorkSchedule, useWorkSchedules, useEmployees } from "@/services/attendanceService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScheduleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
  { id: 7, name: "Domingo" }
];

export function ScheduleManagementModal({ isOpen, onClose }: ScheduleManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "08:00",
    end_time: "17:00",
    break_duration: 60,
    work_days: [1, 2, 3, 4, 5]
  });

  const { user } = useAuth();
  const companyId = user?.company?.id;
  
  const { data: workSchedules } = useWorkSchedules(companyId || "");
  const { data: employees } = useEmployees(companyId || "");
  const createSchedule = useCreateWorkSchedule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      toast.error("Erro de autenticação");
      return;
    }

    if (formData.work_days.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    try {
      await createSchedule.mutateAsync({
        companyId,
        schedule: formData
      });
      
      toast.success("Escala criada com sucesso!");
      resetForm();
      setActiveTab('manage');
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Erro ao criar escala");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_time: "08:00",
      end_time: "17:00",
      break_duration: 60,
      work_days: [1, 2, 3, 4, 5]
    });
  };

  const toggleWorkDay = (dayId: number) => {
    const newWorkDays = formData.work_days.includes(dayId)
      ? formData.work_days.filter(d => d !== dayId)
      : [...formData.work_days, dayId];
    
    setFormData({ ...formData, work_days: newWorkDays });
  };

  const calculateWorkHours = () => {
    const startTime = new Date(`1970-01-01T${formData.start_time}:00`);
    const endTime = new Date(`1970-01-01T${formData.end_time}:00`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const workHours = diffHours - (formData.break_duration / 60);
    return workHours > 0 ? workHours : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gerenciar Escalas de Trabalho
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'manage')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Criar Nova Escala</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar Escalas</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Escala</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Horário Comercial"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descrição opcional da escala"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Horário de Entrada</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Horário de Saída</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="break_duration">Intervalo (minutos)</Label>
                    <Input
                      id="break_duration"
                      type="number"
                      min="0"
                      max="240"
                      placeholder="60"
                      value={formData.break_duration}
                      onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Dias da Semana</Label>
                    <div className="space-y-2 mt-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.id}`}
                            checked={formData.work_days.includes(day.id)}
                            onCheckedChange={() => toggleWorkDay(day.id)}
                          />
                          <Label htmlFor={`day-${day.id}`}>{day.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horas trabalhadas/dia:</span>
                        <span className="font-medium">{calculateWorkHours().toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horas semanais:</span>
                        <span className="font-medium">{(calculateWorkHours() * formData.work_days.length).toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dias de trabalho:</span>
                        <span className="font-medium">{formData.work_days.length} dias</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Criando..." : "Criar Escala"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <div className="space-y-6">
              {workSchedules && workSchedules.length > 0 ? (
                <div className="grid gap-4">
                  {workSchedules.map((schedule) => {
                    const workDayNames = schedule.work_days
                      .map(dayId => DAYS_OF_WEEK.find(d => d.id === dayId)?.name)
                      .filter(Boolean);
                    
                    return (
                      <Card key={schedule.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                {schedule.name}
                                {schedule.is_active && <Badge variant="default">Ativa</Badge>}
                              </CardTitle>
                              {schedule.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {schedule.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Horários</h4>
                              <div className="text-sm text-muted-foreground">
                                <p>Entrada: {schedule.start_time}</p>
                                <p>Saída: {schedule.end_time}</p>
                                <p>Intervalo: {schedule.break_duration} min</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Dias de Trabalho</h4>
                              <div className="flex flex-wrap gap-1">
                                {workDayNames.map((dayName, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {dayName?.slice(0, 3)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Funcionários</h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>12 funcionários</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma escala encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira escala de trabalho na aba "Criar Nova Escala"
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Escala
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}