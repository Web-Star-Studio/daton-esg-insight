import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMaintenanceSchedule } from "@/services/equipmentMaintenance";
import { getAssetsAsOptions } from "@/services/assets";
import { useEmployees } from "@/services/employees";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, Wrench, AlertTriangle } from "lucide-react";

interface MaintenanceSchedulerModalProps {
  open: boolean;
  onClose: () => void;
}

export function MaintenanceSchedulerModal({ open, onClose }: MaintenanceSchedulerModalProps) {
  const [formData, setFormData] = useState({
    asset_id: "",
    maintenance_type: "preventiva",
    frequency_days: 30,
    next_maintenance_date: "",
    responsible_user_id: "",
    priority: "media",
    estimated_cost: "",
    estimated_duration_hours: "",
    maintenance_checklist: [] as string[]
  });

  const [newChecklistItem, setNewChecklistItem] = useState("");

  const { data: assets } = getAssetsAsOptions();
  const { data: employees } = useEmployees();
  const { mutate: createSchedule, isPending } = useCreateMaintenanceSchedule();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asset_id || !formData.next_maintenance_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    createSchedule({
      asset_id: formData.asset_id,
      maintenance_type: formData.maintenance_type,
      frequency_days: formData.frequency_days,
      next_maintenance_date: formData.next_maintenance_date,
      responsible_user_id: formData.responsible_user_id || undefined,
      priority: formData.priority,
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : undefined,
      estimated_duration_hours: formData.estimated_duration_hours ? Number(formData.estimated_duration_hours) : undefined,
      maintenance_checklist: formData.maintenance_checklist.map(item => ({ item, completed: false }))
    }, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Cronograma de manutenção criado com sucesso"
        });
        onClose();
        setFormData({
          asset_id: "",
          maintenance_type: "preventiva",
          frequency_days: 30,
          next_maintenance_date: "",
          responsible_user_id: "",
          priority: "media",
          estimated_cost: "",
          estimated_duration_hours: "",
          maintenance_checklist: []
        });
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        maintenance_checklist: [...prev.maintenance_checklist, newChecklistItem.trim()]
      }));
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      maintenance_checklist: prev.maintenance_checklist.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Agendar Manutenção
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_id">Equipamento *</Label>
              <Select value={formData.asset_id} onValueChange={(value) => setFormData(prev => ({ ...prev, asset_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.map((asset) => (
                    <SelectItem key={asset.value} value={asset.value}>
                      {asset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
              <Select value={formData.maintenance_type} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="preditiva">Preditiva</SelectItem>
                  <SelectItem value="detectiva">Detectiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency_days" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Frequência (dias)
              </Label>
              <Input
                id="frequency_days"
                type="number"
                value={formData.frequency_days}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency_days: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_maintenance_date">Próxima Manutenção *</Label>
              <Input
                id="next_maintenance_date"
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_maintenance_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_user_id">Responsável</Label>
              <Select value={formData.responsible_user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_user_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Prioridade
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Custo Estimado (R$)
              </Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duração Estimada (horas)
              </Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                value={formData.estimated_duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_hours: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Checklist de Manutenção</Label>
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Adicionar item ao checklist"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
              />
              <Button type="button" onClick={addChecklistItem} variant="outline">
                Adicionar
              </Button>
            </div>
            {formData.maintenance_checklist.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                {formData.maintenance_checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}