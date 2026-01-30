import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ActivityDataList } from "./ActivityDataList";
import { 
  ECONOMIC_SECTORS, 
  EconomicSector, 
  getFuelsByEconomicSector, 
  getRecommendedUnitsForFuel,
  validateFuelForSector 
} from "@/services/stationaryCombustion";
import { addActivityData, updateActivityData, getEmissionFactors, EmissionSource } from "@/services/emissions";
import { supabase } from "@/integrations/supabase/client";

interface ActivityDataRecord {
  id: string;
  period_start_date: string;
  period_end_date: string;
  quantity: number;
  unit: string;
  source_document?: string;
  created_at: string;
}

interface StationaryCombustionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emissionSourceId: string;
  economicSector?: string; // Pre-fill from emission source
  onSuccess: () => void;
  editingData?: ActivityDataRecord;
  source?: EmissionSource; // Use proper EmissionSource type
}

export const StationaryCombustionModal = ({ 
  open, 
  onOpenChange, 
  emissionSourceId, 
  economicSector: initialEconomicSector,
  onSuccess,
  editingData,
  source
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
  const [refreshData, setRefreshData] = useState(0);
  const [activeTab, setActiveTab] = useState("list");

  // Pre-fill economic sector and load fuels if provided, or pre-fill editing data
  useEffect(() => {
    if (open) {
      if (editingData) {
        setFormData({
          economicSector: (initialEconomicSector as EconomicSector) || ('' as EconomicSector),
          fuelName: '',
          quantity: editingData.quantity.toString(),
          unit: editingData.unit,
          periodStart: editingData.period_start_date,
          periodEnd: editingData.period_end_date,
          sourceDocument: editingData.source_document || '',
          sourceRegistry: '',
          sourceDescription: ''
        });
      }
      if (initialEconomicSector) {
        handleEconomicSectorChange(initialEconomicSector as EconomicSector);
      }
    }
  }, [initialEconomicSector, open, editingData]);

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
      // VALIDAÇÃO CRÍTICA: Óleo lubrificante é proibido pela resolução CONAMA nº 362/2005
      if (formData.fuelName.toLowerCase().includes('óleo lubrificante') ||
          formData.fuelName.toLowerCase().includes('oleo lubrificante') ||
          formData.fuelName.toLowerCase().includes('lubricant')) {
        toast.error("❌ PROIBIDO: Queima de óleo lubrificante é vedada pela Resolução CONAMA nº 362/2005");
        return;
      }

      // Validation - Setor econômico OBRIGATÓRIO
      if (!formData.economicSector) {
        toast.error("❌ GHG Protocol Brasil: Setor da economia é OBRIGATÓRIO");
        return;
      }

      if (!formData.fuelName) {
        toast.error("❌ GHG Protocol Brasil: Combustível é OBRIGATÓRIO");
        return;
      }

      // Validation - CAMPOS OBRIGATÓRIOS ADICIONAIS
      if (!formData.sourceRegistry.trim()) {
        toast.error("❌ GHG Protocol Brasil: Registro da fonte é OBRIGATÓRIO");
        return;
      }

      if (!formData.sourceDescription.trim()) {
        toast.error("❌ GHG Protocol Brasil: Descrição da fonte é OBRIGATÓRIA");
        return;
      }

      if (!validateFuelForSector(formData.fuelName, formData.economicSector)) {
        toast.error("Combustível não compatível com o setor selecionado");
        return;
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        toast.error("❌ GHG Protocol Brasil: Quantidade deve ser maior que zero");
        return;
      }

      if (!formData.unit) {
        toast.error("❌ GHG Protocol Brasil: Unidade é OBRIGATÓRIA");
        return;
      }

      if (!formData.periodStart || !formData.periodEnd) {
        toast.error("❌ GHG Protocol Brasil: Período de consumo é OBRIGATÓRIO");
        return;
      }

      // Validate dates
      const startDate = new Date(formData.periodStart);
      const endDate = new Date(formData.periodEnd);
      
      if (endDate <= startDate) {
        toast.error("Data final deve ser posterior à data inicial");
        return;
      }

      // Detect biofuel and show separation info
      const isBiofuel = selectedFuel?.is_biofuel || formData.fuelName.toLowerCase().includes('biodiesel') ||
                       formData.fuelName.toLowerCase().includes('etanol') || formData.fuelName.toLowerCase().includes('b12');
      
      if (isBiofuel) {
        toast.success("✅ Biocombustível detectado - Separação automática de CO₂ fóssil e biogênico");
      }

      // Submit activity data with emission factor ID for precise calculation
      const payload: any = {
        emission_source_id: emissionSourceId,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit, // Base unit from fuel
        period_start_date: formData.periodStart,
        period_end_date: formData.periodEnd,
        source_document: formData.sourceDocument || undefined,
        // Add the new required fields as part of metadata
        metadata: {
          source_registry: formData.sourceRegistry,
          source_description: formData.sourceDescription,
          economic_sector: formData.economicSector,
          fuel_name: formData.fuelName
        }
      };
      
      // Log detailed validation before submission
      console.log('Dados sendo enviados:', {
        payload,
        emissionFactorId,
        formDataComplete: {
          economicSector: formData.economicSector,
          fuelName: formData.fuelName,
          quantity: formData.quantity,
          unit: formData.unit,
          periodStart: formData.periodStart,
          periodEnd: formData.periodEnd,
          sourceRegistry: formData.sourceRegistry,
          sourceDescription: formData.sourceDescription
        }
      });
      
      if (editingData) {
        await updateActivityData(editingData.id, payload);
        toast.success("✅ Dados de combustão estacionária atualizados - GHG Protocol Brasil");
      } else {
        await addActivityData(payload);
        toast.success("✅ Dados de combustão estacionária adicionados - GHG Protocol Brasil");
      }
      onSuccess();
      onOpenChange(false);
      setRefreshData(prev => prev + 1);
      
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
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('violates row-level security')) {
        toast.error("❌ Erro de permissão: Verifique se você tem acesso à fonte de emissão selecionada");
      } else if (errorMessage.includes('duplicate key')) {
        toast.error("❌ Dados duplicados: Já existem dados para este período");
      } else if (errorMessage.includes('invalid input syntax')) {
        toast.error("❌ Erro de formato: Verifique os dados inseridos");
      } else if (errorMessage.includes('not-null violation')) {
        toast.error("❌ Campo obrigatório não preenchido");
      } else {
        toast.error(`❌ Erro ao adicionar dados: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditData = (data: ActivityDataRecord) => {
    // Pre-fill form with selected data
    setFormData(prev => ({
      ...prev,
      quantity: data.quantity.toString(),
      unit: data.unit,
      periodStart: data.period_start_date,
      periodEnd: data.period_end_date,
      sourceDocument: data.source_document || '',
    }));
    // Switch to add tab for editing
    setActiveTab("add");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingData ? 'Editar' : 'Gerenciar'} Combustão Estacionária</DialogTitle>
          <DialogDescription>
            {source && (
              <>
                Fonte: <span className="font-medium">{source.name}</span> | 
                Categoria: <span className="font-medium">{source.category}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Dados Existentes</TabsTrigger>
            <TabsTrigger value="add">Adicionar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {source && (
              <ActivityDataList 
                source={source}
                key={refreshData}
                onDataChange={() => {
                  setRefreshData(prev => prev + 1);
                  onSuccess?.();
                }}
                onEditData={handleEditData}
              />
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            {editingData && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 mb-4">
                <p className="font-medium">Editando dados de combustão estacionária</p>
                <p>Período: {editingData.period_start_date} - {editingData.period_end_date}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Economic Sector Selection - CAMPO OBRIGATÓRIO GHG PROTOCOL */}
          <div className="space-y-2">
            <Label htmlFor="economicSector" className="text-ghgRequired-foreground font-medium">
              Setor da Economia <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.economicSector} onValueChange={handleEconomicSectorChange}>
              <SelectTrigger className="bg-ghgRequired border-ghgRequired-foreground/30">
                <SelectValue placeholder="⚠️ OBRIGATÓRIO - Selecione o setor da economia" />
              </SelectTrigger>
              <SelectContent>
                {ECONOMIC_SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-ghgRequired-foreground">
              Campo obrigatório conforme GHG Protocol Brasil 2025.0.1
            </div>
          </div>

          {/* Fuel Selection - CAMPO OBRIGATÓRIO */}
          {formData.economicSector && (
            <div className="space-y-2">
              <Label htmlFor="fuelName" className="text-ghgRequired-foreground font-medium">
                Tipo de Combustível <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.fuelName} onValueChange={handleFuelChange}>
                <SelectTrigger className="bg-ghgRequired border-ghgRequired-foreground/30">
                  <SelectValue placeholder="⚠️ OBRIGATÓRIO - Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  {availableFuels.map((fuel) => (
                    <SelectItem key={fuel.name} value={fuel.name} disabled={fuel.name.toLowerCase().includes('óleo lubrificante')}>
                      <div className="flex flex-col">
                        <span className={fuel.name.toLowerCase().includes('óleo lubrificante') ? 'line-through text-destructive' : ''}>
                          {fuel.name}
                          {fuel.name.toLowerCase().includes('óleo lubrificante') && ' (PROIBIDO CONAMA)'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fuel.fuel_type} • {fuel.activity_unit}
                          {fuel.is_biofuel && ' • 🌱 Biocombustível'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-ghgRequired-foreground">
                ⚠️ Óleo lubrificante proibido (CONAMA nº 362/2005)
              </div>
            </div>
          )}

          {/* Quantity and Unit - CAMPOS OBRIGATÓRIOS */}
          {formData.fuelName && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-ghgRequired-foreground font-medium">
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
                  className="bg-ghgRequired border-ghgRequired-foreground/30"
                />
                <div className="text-xs text-ghgRequired-foreground">
                  Informe a quantidade já convertida para {formData.unit || 'unidade base'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-ghgRequired-foreground font-medium">
                  Unidade <span className="text-destructive">*</span>
                </Label>
                <div className="flex h-10 w-full rounded-md border border-ghgRequired-foreground/30 bg-ghgRequired px-3 py-2 text-sm text-ghgRequired-foreground">
                  {formData.unit || 'Selecione o combustível primeiro'} (unidade base)
                </div>
                <div className="text-xs text-ghgRequired-foreground">
                  Unidade fixa baseada no tipo de combustível selecionado
                </div>
              </div>
            </div>
          )}

          {/* Consumption Period - CAMPOS OBRIGATÓRIOS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart" className="text-ghgRequired-foreground font-medium">
                Data Início Consumo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                className="bg-ghgRequired border-ghgRequired-foreground/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="periodEnd" className="text-ghgRequired-foreground font-medium">
                Data Fim Consumo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                className="bg-ghgRequired border-ghgRequired-foreground/30"
              />
            </div>
          </div>

          {/* Source Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações da Fonte (GHG Protocol)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sourceRegistry" className="text-ghgRequired-foreground font-medium">
                Registro da Fonte <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sourceRegistry"
                placeholder="Ex: Caldeira 001, Gerador Emergência A"
                value={formData.sourceRegistry}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceRegistry: e.target.value }))}
                className="bg-ghgRequired border-ghgRequired-foreground/30"
              />
              <div className="text-xs text-ghgRequired-foreground">
                Campo obrigatório conforme GHG Protocol Brasil 2025.0.1
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sourceDescription" className="text-ghgRequired-foreground font-medium">
                Descrição da Fonte <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sourceDescription"
                placeholder="Descreva a fonte de combustão (equipamento, localização, características)"
                value={formData.sourceDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceDescription: e.target.value }))}
                className="bg-ghgRequired border-ghgRequired-foreground/30"
              />
              <div className="text-xs text-ghgRequired-foreground">
                Campo obrigatório conforme GHG Protocol Brasil 2025.0.1
              </div>
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
          <div className="rounded-md bg-primary/10 border border-primary/20 p-4 text-sm">
            <p className="font-medium mb-2 text-primary">✅ GHG Protocol Brasil 2025.0.1 - Combustão Estacionária</p>
            <ul className="space-y-1 text-xs text-primary/80">
              <li>• ⚠️ Campos em laranja claro são OBRIGATÓRIOS conforme metodologia</li>
              <li>• 🔥 Sistema detecta e separa automaticamente CO₂ fóssil e biogênico</li>
              <li>• 🚫 Queima de óleo lubrificante proibida (CONAMA nº 362/2005)</li>
              <li>• 📊 Cálculo automatizado conforme fatores brasileiros oficiais</li>
              <li>• 🌱 Biocombustíveis identificados automaticamente</li>
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
              {isSubmitting ? "Salvando..." : (editingData ? "Salvar Alterações" : "Salvar Dados")}
            </Button>
          </div>
        </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};