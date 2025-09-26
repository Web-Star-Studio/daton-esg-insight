import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Clock, Save, X } from "lucide-react";
import { useCreateAttendanceRecord, useEmployees } from "@/services/attendanceService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

export default function AttendanceRecordModal({ isOpen, onClose, selectedDate }: AttendanceRecordModalProps) {
  const { user } = useAuth();
  const companyId = user?.company?.id;
  
  const [formData, setFormData] = useState({
    employee_id: "",
    date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    check_in: "",
    check_out: "",
    break_start: "",
    break_end: "",
    status: "present" as const,
    notes: ""
  });

  const { data: employees = [], isLoading: employeesLoading } = useEmployees(companyId);
  const createAttendanceRecord = useCreateAttendanceRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.date) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      // Calculate total hours if check_in and check_out are provided
      let total_hours = 0;
      let overtime_hours = 0;

      if (formData.check_in && formData.check_out) {
        const checkIn = new Date(`${formData.date}T${formData.check_in}`);
        const checkOut = new Date(`${formData.date}T${formData.check_out}`);
        
        let workTime = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60); // hours
        
        // Subtract break time if provided
        if (formData.break_start && formData.break_end) {
          const breakStart = new Date(`${formData.date}T${formData.break_start}`);
          const breakEnd = new Date(`${formData.date}T${formData.break_end}`);
          const breakTime = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
          workTime -= breakTime;
        }

        total_hours = Math.max(0, workTime);
        
        // Calculate overtime (anything over 8 hours)
        if (total_hours > 8) {
          overtime_hours = total_hours - 8;
        }
      }

      const recordData = {
        ...formData,
        check_in: formData.check_in ? `${formData.date}T${formData.check_in}` : null,
        check_out: formData.check_out ? `${formData.date}T${formData.check_out}` : null,
        break_start: formData.break_start ? `${formData.date}T${formData.break_start}` : null,
        break_end: formData.break_end ? `${formData.date}T${formData.break_end}` : null,
        total_hours: Math.round(total_hours * 100) / 100,
        overtime_hours: Math.round(overtime_hours * 100) / 100,
      };

      await createAttendanceRecord.mutateAsync({
        companyId,
        record: recordData
      });

      toast.success("Registro de ponto criado com sucesso!");
      onClose();
      
      // Reset form
      setFormData({
        employee_id: "",
        date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        check_in: "",
        check_out: "",
        break_start: "",
        break_end: "",
        status: "present",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating attendance record:', error);
      toast.error("Erro ao criar registro de ponto");
    }
  };

  const statusOptions = [
    { value: "present", label: "Presente" },
    { value: "absent", label: "Ausente" },
    { value: "late", label: "Atraso" },
    { value: "partial", label: "Meio Período" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Novo Registro de Ponto
          </DialogTitle>
          <DialogDescription>
            Registrar entrada e saída de funcionário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Funcionário *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employeesLoading ? (
                  <SelectItem value="" disabled>Carregando...</SelectItem>
                ) : (
                  employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.employee_code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in">Entrada</Label>
              <Input
                id="check_in"
                type="time"
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_out">Saída</Label>
              <Input
                id="check_out"
                type="time"
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="break_start">Início Intervalo</Label>
              <Input
                id="break_start"
                type="time"
                value={formData.break_start}
                onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="break_end">Fim Intervalo</Label>
              <Input
                id="break_end"
                type="time"
                value={formData.break_end}
                onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o registro..."
              rows={3}
            />
          </div>

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
              disabled={createAttendanceRecord.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createAttendanceRecord.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}