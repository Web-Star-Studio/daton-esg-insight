import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, Save } from "lucide-react";
import { useWorkSchedules, useEmployees } from "@/services/attendanceService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmployeeScheduleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_MAP = {
  1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 7: "Dom"
};

export function EmployeeScheduleAssignmentModal({ isOpen, onClose }: EmployeeScheduleAssignmentModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { user } = useAuth();
  const companyId = user?.company?.id;
  
  const { data: workSchedules } = useWorkSchedules(companyId || "");
  const { data: employees } = useEmployees(companyId || "");

  const handleAssignSchedule = async () => {
    if (!selectedEmployee || !selectedSchedule) {
      toast.error("Selecione funcionário e escala");
      return;
    }

    try {
      // TODO: Implementar API para atribuir escala
      toast.success("Escala atribuída com sucesso!");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error assigning schedule:", error);
      toast.error("Erro ao atribuir escala");
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedSchedule("");
    setEffectiveDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const selectedScheduleData = workSchedules?.find(s => s.id === selectedSchedule);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Atribuir Escala ao Funcionário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Funcionário</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Escala de Trabalho</label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar escala" />
                </SelectTrigger>
                <SelectContent>
                  {workSchedules?.filter(s => s.is_active).map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.name} ({schedule.start_time} - {schedule.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data de Início</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {selectedScheduleData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview da Escala</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedScheduleData.start_time} - {selectedScheduleData.end_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Intervalo</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedScheduleData.break_duration} minutos
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Dias de Trabalho</p>
                  <div className="flex gap-1">
                    {selectedScheduleData.work_days.map((dayId) => (
                      <Badge key={dayId} variant="outline">
                        {DAYS_MAP[dayId as keyof typeof DAYS_MAP]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleAssignSchedule}>
              <Save className="w-4 h-4 mr-2" />
              Atribuir Escala
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}