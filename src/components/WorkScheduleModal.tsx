import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateWorkSchedule } from "@/services/attendanceService";

interface WorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: any;
}

const weekDays = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export default function WorkScheduleModal({ isOpen, onClose, schedule }: WorkScheduleModalProps) {
  const { user } = useAuth();
  const companyId = user?.company?.id;
  const createWorkSchedule = useCreateWorkSchedule();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "08:00",
    end_time: "17:00",
    break_duration: 60,
    work_days: [1, 2, 3, 4, 5], // Monday to Friday by default
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name || "",
        description: schedule.description || "",
        start_time: schedule.start_time || "08:00",
        end_time: schedule.end_time || "17:00",
        break_duration: schedule.break_duration || 60,
        work_days: schedule.work_days || [1, 2, 3, 4, 5],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        start_time: "08:00",
        end_time: "17:00",
        break_duration: 60,
        work_days: [1, 2, 3, 4, 5],
      });
    }
  }, [schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.work_days.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    if (!companyId) {
      toast.error("Erro: empresa não identificada");
      return;
    }
    
    try {
      await createWorkSchedule.mutateAsync({
        companyId,
        schedule: formData
      });
      
      toast.success(schedule ? "Escala atualizada com sucesso!" : "Escala criada com sucesso!");
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error("Erro ao salvar escala");
    }
  };

  const toggleWorkDay = (day: number) => {
    const newWorkDays = formData.work_days.includes(day)
      ? formData.work_days.filter(d => d !== day)
      : [...formData.work_days, day].sort();
    
    setFormData({ ...formData, work_days: newWorkDays });
  };

  const calculateWorkHours = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    
    const start = new Date(`2023-01-01T${formData.start_time}`);
    const end = new Date(`2023-01-01T${formData.end_time}`);
    
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    hours -= formData.break_duration / 60; // Subtract break time
    
    return Math.max(0, hours);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {schedule ? "Editar Escala" : "Nova Escala"}
          </DialogTitle>
          <DialogDescription>
            {schedule ? "Editar informações da escala de trabalho" : "Criar uma nova escala de trabalho"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Escala *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Horário Comercial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da escala..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário Início *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Horário Fim *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="break_duration">Intervalo (minutos)</Label>
            <Input
              id="break_duration"
              type="number"
              min="0"
              max="240"
              value={formData.break_duration}
              onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-3">
            <Label>Dias de Trabalho *</Label>
            <div className="space-y-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.work_days.includes(day.value)}
                    onCheckedChange={() => toggleWorkDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {formData.start_time && formData.end_time && (
            <div className="bg-muted p-3 rounded-md space-y-2">
              <p className="text-sm text-muted-foreground">
                Carga horária: <span className="font-medium text-foreground">{calculateWorkHours().toFixed(1)}h por dia</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Dias selecionados: <span className="font-medium text-foreground">{formData.work_days.length} dia{formData.work_days.length !== 1 ? 's' : ''}</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.work_days.map(dayValue => {
                  const day = weekDays.find(d => d.value === dayValue);
                  return (
                    <Badge key={dayValue} variant="secondary" className="text-xs">
                      {day?.label.slice(0, 3)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkSchedule.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createWorkSchedule.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}