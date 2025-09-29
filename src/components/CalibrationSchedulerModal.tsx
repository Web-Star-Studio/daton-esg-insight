import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateCalibrationSchedule } from "@/services/calibrationManagement";
import { useAssetsAsOptions } from "@/services/assets";
import { useEmployeesAsOptions } from "@/services/employees";
import { useToast } from "@/hooks/use-toast";
import { Settings, Calendar, DollarSign, FileCheck } from "lucide-react";

interface CalibrationSchedulerModalProps {
  open: boolean;
  onClose: () => void;
}

export function CalibrationSchedulerModal({ open, onClose }: CalibrationSchedulerModalProps) {
  const [formData, setFormData] = useState({
    asset_id: "",
    calibration_standard: "",
    frequency_months: 12,
    next_calibration_date: "",
    calibration_provider: "",
    certificate_required: true,
    tolerance_range: {
      min: "",
      max: "",
      unit: ""
    },
    responsible_user_id: "",
    estimated_cost: ""
  });

  const { data: assets } = useAssetsAsOptions();
  const { data: employees } = useEmployeesAsOptions();
  const { mutate: createSchedule, isPending } = useCreateCalibrationSchedule();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações de campos obrigatórios
    if (!formData.asset_id || !formData.next_calibration_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    // Validação de data
    const nextDate = new Date(formData.next_calibration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (nextDate < today) {
      toast({
        title: "Data inválida",
        description: "A data da próxima calibração deve ser futura",
        variant: "destructive"
      });
      return;
    }
    
    // Validação de frequência
    if (formData.frequency_months < 1 || formData.frequency_months > 120) {
      toast({
        title: "Frequência inválida",
        description: "A frequência deve ser entre 1 e 120 meses",
        variant: "destructive"
      });
      return;
    }
    
    // Validação de campos de texto
    if (formData.calibration_standard && formData.calibration_standard.length > 255) {
      toast({
        title: "Padrão muito longo",
        description: "O padrão de calibração deve ter no máximo 255 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.calibration_provider && formData.calibration_provider.length > 255) {
      toast({
        title: "Fornecedor muito longo",
        description: "O nome do fornecedor deve ter no máximo 255 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    // Validação de custo
    if (formData.estimated_cost && (Number(formData.estimated_cost) < 0 || Number(formData.estimated_cost) > 9999999)) {
      toast({
        title: "Custo inválido",
        description: "O custo deve ser um valor entre 0 e 9.999.999",
        variant: "destructive"
      });
      return;
    }

    const toleranceRange = formData.tolerance_range.min && formData.tolerance_range.max 
      ? {
          min: formData.tolerance_range.min.trim(),
          max: formData.tolerance_range.max.trim(),
          unit: formData.tolerance_range.unit.trim()
        }
      : {};

    createSchedule({
      asset_id: formData.asset_id,
      calibration_standard: formData.calibration_standard.trim() || undefined,
      frequency_months: formData.frequency_months,
      next_calibration_date: formData.next_calibration_date,
      calibration_provider: formData.calibration_provider.trim() || undefined,
      certificate_required: formData.certificate_required,
      tolerance_range: toleranceRange,
      responsible_user_id: formData.responsible_user_id || undefined,
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : undefined
    }, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Cronograma de calibração criado com sucesso"
        });
        onClose();
        setFormData({
          asset_id: "",
          calibration_standard: "",
          frequency_months: 12,
          next_calibration_date: "",
          calibration_provider: "",
          certificate_required: true,
          tolerance_range: { min: "", max: "", unit: "" },
          responsible_user_id: "",
          estimated_cost: ""
        });
      },
      onError: (error: any) => {
        const errorMessage = error?.message || 'Erro ao criar cronograma de calibração';
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agendar Calibração
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
              <Label htmlFor="calibration_standard">Padrão de Calibração</Label>
              <Input
                id="calibration_standard"
                value={formData.calibration_standard}
                onChange={(e) => setFormData(prev => ({ ...prev, calibration_standard: e.target.value }))}
                placeholder="Ex: ISO/IEC 17025, INMETRO"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency_months" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Frequência (meses)
              </Label>
              <Input
                id="frequency_months"
                type="number"
                value={formData.frequency_months}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency_months: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_calibration_date">Próxima Calibração *</Label>
              <Input
                id="next_calibration_date"
                type="date"
                value={formData.next_calibration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_calibration_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calibration_provider">Fornecedor de Calibração</Label>
            <Input
              id="calibration_provider"
              value={formData.calibration_provider}
              onChange={(e) => setFormData(prev => ({ ...prev, calibration_provider: e.target.value }))}
              placeholder="Nome da empresa responsável pela calibração"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="certificate_required" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Certificado Obrigatório
              </Label>
              <Switch
                id="certificate_required"
                checked={formData.certificate_required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, certificate_required: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Faixa de Tolerância</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Mín."
                value={formData.tolerance_range.min}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tolerance_range: { ...prev.tolerance_range, min: e.target.value }
                }))}
              />
              <Input
                placeholder="Máx."
                value={formData.tolerance_range.max}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tolerance_range: { ...prev.tolerance_range, max: e.target.value }
                }))}
              />
              <Input
                placeholder="Unidade"
                value={formData.tolerance_range.unit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tolerance_range: { ...prev.tolerance_range, unit: e.target.value }
                }))}
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