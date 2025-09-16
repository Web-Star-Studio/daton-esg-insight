import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ECONOMIC_SECTORS, 
  EconomicSector, 
  getFuelsByEconomicSector, 
  getRecommendedUnitsForFuel,
  validateFuelForSector 
} from "@/services/stationaryCombustion";
import { addActivityData } from "@/services/emissions";

interface StationaryCombustionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emissionSourceId: string;
  onSuccess: () => void;
}

export const StationaryCombustionModal = ({ 
  open, 
  onOpenChange, 
  emissionSourceId, 
  onSuccess 
}: StationaryCombustionModalProps) => {
  const [formData, setFormData] = useState({
    economicSector: '' as EconomicSector,
    fuelName: '',
    quantity: '',
    unit: '',
    periodStart: '',
    periodEnd: '',
    sourceDocument: '',
    sourceRegistry: '',
    sourceDescription: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableFuels, setAvailableFuels] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);

  const handleEconomicSectorChange = (sector: EconomicSector) => {
    setFormData(prev => ({
      ...prev,
      economicSector: sector,
      fuelName: '',
      unit: ''
    }));
    
    const fuels = getFuelsByEconomicSector(sector);
    setAvailableFuels(fuels);
  };

  const handleFuelChange = (fuelName: string) => {
    setFormData(prev => ({
      ...prev,
      fuelName,
      unit: ''
    }));
    
    const units = getRecommendedUnitsForFuel(fuelName);
    setAvailableUnits(units);
    
    // Set default unit
    if (units.length > 0) {
      setFormData(prev => ({ ...prev, unit: units[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.economicSector) {
        toast.error("Selecione o setor da economia");
        return;
      }

      if (!formData.fuelName) {
        toast.error("Selecione o combustível");
        return;
      }

      if (!validateFuelForSector(formData.fuelName, formData.economicSector)) {
        toast.error("Combustível não compatível com o setor selecionado");
        return;
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        toast.error("Quantidade deve ser maior que zero");
        return;
      }

      if (!formData.unit) {
        toast.error("Selecione a unidade");
        return;
      }

      if (!formData.periodStart || !formData.periodEnd) {
        toast.error("Período de consumo é obrigatório");
        return;
      }

      // Validate dates
      const startDate = new Date(formData.periodStart);
      const endDate = new Date(formData.periodEnd);
      
      if (endDate <= startDate) {
        toast.error("Data final deve ser posterior à data inicial");
        return;
      }

      // Submit activity data
      await addActivityData({
        emission_source_id: emissionSourceId,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        period_start_date: formData.periodStart,
        period_end_date: formData.periodEnd,
        source_document: formData.sourceDocument || undefined
      });

      toast.success("Dados de combustão estacionária adicionados com sucesso!");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        economicSector: '' as EconomicSector,
        fuelName: '',
        quantity: '',
        unit: '',
        periodStart: '',
        periodEnd: '',
        sourceDocument: '',
        sourceRegistry: '',
        sourceDescription: ''
      });

    } catch (error) {
      console.error('Erro ao adicionar dados:', error);
      toast.error("Erro ao adicionar dados de atividade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Combustão Estacionária</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Economic Sector Selection */}
          <div className="space-y-2">
            <Label htmlFor="economicSector">
              Setor da Economia <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.economicSector} onValueChange={handleEconomicSectorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor da economia" />
              </SelectTrigger>
              <SelectContent>
                {ECONOMIC_SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fuel Selection */}
          {formData.economicSector && (
            <div className="space-y-2">
              <Label htmlFor="fuelName">
                Tipo de Combustível <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.fuelName} onValueChange={handleFuelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  {availableFuels.map((fuel) => (
                    <SelectItem key={fuel.name} value={fuel.name}>
                      <div className="flex flex-col">
                        <span>{fuel.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {fuel.fuel_type} • {fuel.activity_unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity and Unit */}
          {formData.fuelName && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantidade Consumida <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 1000"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unidade <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Consumption Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">
                Data Início Consumo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="periodEnd">
                Data Fim Consumo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
              />
            </div>
          </div>

          {/* Source Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações da Fonte (GHG Protocol)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sourceRegistry">Registro da Fonte</Label>
              <Input
                id="sourceRegistry"
                placeholder="Ex: Caldeira 001, Gerador Emergência A"
                value={formData.sourceRegistry}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceRegistry: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sourceDescription">Descrição da Fonte</Label>
              <Textarea
                id="sourceDescription"
                placeholder="Descreva a fonte de combustão (equipamento, localização, características)"
                value={formData.sourceDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceDescription: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sourceDocument">Documento Comprobatório</Label>
              <Input
                id="sourceDocument"
                placeholder="Ex: Nota Fiscal 12345, Relatório Operacional"
                value={formData.sourceDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceDocument: e.target.value }))}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};