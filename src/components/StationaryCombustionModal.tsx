import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { addActivityData, getEmissionFactors } from "@/services/emissions";
import { supabase } from "@/integrations/supabase/client";

interface StationaryCombustionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emissionSourceId: string;
  economicSector?: string; // Pre-fill from emission source
  onSuccess: () => void;
}

export const StationaryCombustionModal = ({ 
  open, 
  onOpenChange, 
  emissionSourceId, 
  economicSector: initialEconomicSector,
  onSuccess 
}: StationaryCombustionModalProps) => {
  const [formData, setFormData] = useState({
    economicSector: (initialEconomicSector as EconomicSector) || ('' as EconomicSector),
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
  const [selectedFuel, setSelectedFuel] = useState<any>(null);
  const [emissionFactorId, setEmissionFactorId] = useState<string | null>(null);

  // Pre-fill economic sector and load fuels if provided
  useEffect(() => {
    if (initialEconomicSector && open) {
      handleEconomicSectorChange(initialEconomicSector as EconomicSector);
    }
  }, [initialEconomicSector, open]);

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

  const handleFuelChange = async (fuelName: string) => {
    const fuel = availableFuels.find(f => f.name === fuelName);
    setSelectedFuel(fuel);
    
    // Reset emission factor ID
    setEmissionFactorId(null);
    
    // Lock unit to fuel's base unit
    const baseUnit = fuel?.activity_unit || '';
    
    setFormData(prev => ({
      ...prev,
      fuelName,
      unit: baseUnit // Lock to base unit
    }));

    // Resolve emission_factor_id from database (case-insensitive)
    try {
      const { data: factors } = await supabase
        .from('emission_factors')
        .select('id')
        .ilike('name', fuelName)
        .eq('category', 'Combustão Estacionária')
        .limit(1);
      
      if (factors && factors.length > 0) {
        setEmissionFactorId(factors[0].id);
        console.info('Fator de emissão resolvido:', factors[0].id);
      } else {
        toast.info('Fator específico não encontrado, cálculo automático será aplicado por unidade');
      }
    } catch (error) {
      console.error('Error resolving emission factor:', error);
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

      // Submit activity data with emission factor ID for precise calculation
      const payload: any = {
        emission_source_id: emissionSourceId,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit, // Base unit from fuel
        period_start_date: formData.periodStart,
        period_end_date: formData.periodEnd,
        source_document: formData.sourceDocument || undefined,
      };
      
      // Only include emission_factor_id if it's valid
      if (emissionFactorId) {
        payload.emission_factor_id = emissionFactorId;
        console.info('Enviando com fator específico:', emissionFactorId);
      } else {
        console.info('Enviando para cálculo automático por unidade');
      }
      
      await addActivityData(payload);

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
          <DialogDescription>
            Adicione dados de consumo de combustível conforme GHG Protocol Brasil
          </DialogDescription>
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
                <div className="text-xs text-muted-foreground">
                  Informe a quantidade já convertida para {formData.unit || 'unidade base'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unidade <span className="text-destructive">*</span>
                </Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {formData.unit || 'Selecione o combustível primeiro'} (unidade base)
                </div>
                <div className="text-xs text-muted-foreground">
                  Unidade fixa baseada no tipo de combustível selecionado
                </div>
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

          {/* GHG Protocol Brasil Compliance Note */}
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">📋 GHG Protocol Brasil 2025.0.1 - Combustão Estacionária</p>
            <ul className="space-y-1 text-xs">
              <li>• Informe a quantidade já convertida na unidade base do combustível</li>
              <li>• O sistema separa automaticamente as parcelas fóssil e biogênica</li>
              <li>• Cálculo conforme metodologia brasileira de inventários GEE</li>
            </ul>
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