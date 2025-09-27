import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save, X } from "lucide-react";
import { useCreateLeaveRequest, useEmployees, useLeaveTypes } from "@/services/attendanceService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
  const { user } = useAuth();
  const companyId = user?.company?.id;
  
  const [formData, setFormData] = useState({
    employee_id: "",
    type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const { data: employees = [], isLoading: employeesLoading } = useEmployees(companyId);
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useLeaveTypes();
  const createLeaveRequest = useCreateLeaveRequest();

  // Calculate days between dates
  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    
    return Math.max(0, dayDiff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.type || !formData.start_date || !formData.end_date) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("A data de início deve ser anterior à data de fim");
      return;
    }

    try {
      const days_count = calculateDays(formData.start_date, formData.end_date);
      
      await createLeaveRequest.mutateAsync({
        companyId,
        request: {
          ...formData,
          days_count,
          requested_by_user_id: user?.id,
          status: 'pending'
        }
      });

      toast.success("Solicitação de ausência criada com sucesso!");
      onClose();
      
      // Reset form
      setFormData({
        employee_id: "",
        type: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast.error("Erro ao criar solicitação de ausência");
    }
  };

  const days = calculateDays(formData.start_date, formData.end_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nova Solicitação de Ausência
          </DialogTitle>
          <DialogDescription>
            Criar uma nova solicitação de férias ou licença
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
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
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
            <Label htmlFor="type">Tipo de Ausência *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypesLoading ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                      {type.max_days_per_year && (
                        <span className="text-muted-foreground ml-2">
                          (máx. {type.max_days_per_year} dias/ano)
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                min={formData.start_date || undefined}
              />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Total de dias: <span className="font-medium text-foreground">{days} dia{days !== 1 ? 's' : ''}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo/Justificativa</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Descreva o motivo da solicitação..."
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
              disabled={createLeaveRequest.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {createLeaveRequest.isPending ? "Salvando..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}