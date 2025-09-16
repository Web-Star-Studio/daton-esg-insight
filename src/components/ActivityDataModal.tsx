import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmissionSource, ActivityData, addActivityData, updateActivityData, getEmissionFactors } from "@/services/emissions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityDataList } from "./ActivityDataList";

interface ActivityDataRecord {
  id: string;
  period_start_date: string;
  period_end_date: string;
  quantity: number;
  unit: string;
  source_document?: string;
  created_at: string;
}

interface ActivityDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: EmissionSource;
  onSuccess?: () => void;
  editingData?: ActivityDataRecord;
}

interface EmissionFactor {
  id: string;
  name: string;
  activity_unit: string;
  category: string;
}

const ACTIVITY_UNITS = [
  { value: "L", label: "Litros (L)" },
  { value: "m³", label: "Metros cúbicos (m³)" },
  { value: "kWh", label: "Quilowatt-hora (kWh)" },
  { value: "kg", label: "Quilogramas (kg)" },
  { value: "t", label: "Toneladas (t)" },
  { value: "km", label: "Quilômetros (km)" },
  { value: "unidade", label: "Unidades" },
];

export function ActivityDataModal({ open, onOpenChange, source, onSuccess, editingData }: ActivityDataModalProps) {
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [sourceDocument, setSourceDocument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [selectedEmissionFactorId, setSelectedEmissionFactorId] = useState<string>("");
  const [refreshData, setRefreshData] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (open && source) {
      loadEmissionFactors();
      // Pre-fill form when editing
      if (editingData) {
        setPeriodStartDate(new Date(editingData.period_start_date));
        setPeriodEndDate(new Date(editingData.period_end_date));
        setQuantity(editingData.quantity.toString());
        setUnit(editingData.unit);
        setSourceDocument(editingData.source_document || "");
      } else {
        resetForm();
      }
    }
  }, [open, source, editingData]);

  const loadEmissionFactors = async () => {
    try {
      const factors = await getEmissionFactors(source.category);
      setEmissionFactors(factors);
      
      // Auto-select factor and lock unit if only one factor exists
      if (factors.length === 1) {
        setSelectedEmissionFactorId(factors[0].id);
        setUnit(factors[0].activity_unit);
      }
    } catch (error) {
      console.error("Erro ao carregar fatores de emissão:", error);
    }
  };

  // Handle factor selection and unit locking
  const handleFactorSelection = (factorId: string) => {
    setSelectedEmissionFactorId(factorId);
    const selectedFactor = emissionFactors.find(f => f.id === factorId);
    if (selectedFactor) {
      setUnit(selectedFactor.activity_unit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!periodStartDate || !periodEndDate || !quantity) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Verificação crítica: se há múltiplos fatores, o usuário deve selecionar um específico
    if (emissionFactors.length > 1 && !selectedEmissionFactorId) {
      toast({
        title: "Tipo de combustível obrigatório",
        description: "Selecione o tipo específico de combustível consumido.",
        variant: "destructive",
      });
      return;
    }

    // Verificação crítica: deve sempre ter um fator selecionado
    if (!selectedEmissionFactorId) {
      toast({
        title: "Fator de emissão obrigatório",
        description: "Um fator de emissão deve estar selecionado para o cálculo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedFactor = emissionFactors.find(f => f.id === selectedEmissionFactorId);
      
    const payload: any = {
      emission_source_id: source.id,
      period_start_date: format(periodStartDate, "yyyy-MM-dd"),
      period_end_date: format(periodEndDate, "yyyy-MM-dd"),
      quantity: parseFloat(quantity),
      unit: selectedFactor?.activity_unit || unit,
      source_document: sourceDocument || undefined,
    };
    
    // Only include emission_factor_id if it's valid
    if (selectedEmissionFactorId && selectedEmissionFactorId.trim() !== '') {
      payload.emission_factor_id = selectedEmissionFactorId;
    }

    if (editingData) {
      await updateActivityData(editingData.id, payload);
      toast({
        title: "Sucesso",
        description: "Dados de atividade atualizados com sucesso!",
      });
    } else {
      await addActivityData(payload);
      toast({
        title: "Sucesso",
        description: "Dados de atividade adicionados com sucesso!",
      });
    }

      resetForm();
      onOpenChange(false);
      setRefreshData(prev => prev + 1);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao adicionar dados de atividade:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar dados de atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPeriodStartDate(undefined);
    setPeriodEndDate(undefined);
    setQuantity("");
    setUnit("");
    setSourceDocument("");
    setSelectedEmissionFactorId("");
  };

  const getUnitSuggestions = () => {
    const categoryUnits = {
      "Combustíveis Móveis": ["L", "m³"],
      "Combustíveis Estacionários": ["L", "m³", "kg", "t"],
      "Energia Elétrica": ["kWh"],
      "Transporte": ["km", "L"],
      "Resíduos": ["kg", "t"],
      "Refrigeração": ["kg"],
      "Processos Industriais": ["kg", "t", "unidade"],
    };

    return categoryUnits[source.category as keyof typeof categoryUnits] || ["kg", "L", "kWh"];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingData ? 'Editar' : 'Gerenciar'} Dados de Atividade</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fonte: <span className="font-medium">{source.name}</span> | 
            Categoria: <span className="font-medium">{source.category}</span>
          </p>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Dados Existentes</TabsTrigger>
            <TabsTrigger value="add">Adicionar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <ActivityDataList 
              source={source} 
              key={refreshData}
              onDataChange={() => {
                setRefreshData(prev => prev + 1);
                onSuccess?.();
              }}
              onEditData={(data) => {
                // Switch to edit tab and pre-fill form
                setPeriodStartDate(new Date(data.period_start_date));
                setPeriodEndDate(new Date(data.period_end_date));
                setQuantity(data.quantity.toString());
                setUnit(data.unit);
                setSourceDocument(data.source_document || "");
                // Switch to add tab for editing
                (document.querySelector('[value="add"]') as HTMLElement)?.click();
              }}
            />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            {editingData && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 mb-4">
                <p className="font-medium">Editando dados de atividade</p>
                <p>Período: {format(new Date(editingData.period_start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(editingData.period_end_date), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period-start">Data Início do Período *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !periodStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodStartDate ? format(periodStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={periodStartDate}
                        onSelect={setPeriodStartDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period-end">Data Fim do Período *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !periodEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodEndDate ? format(periodEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={periodEndDate}
                        onSelect={setPeriodEndDate}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => periodStartDate ? date < periodStartDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 1000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade *</Label>
                  {selectedEmissionFactorId ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {unit} (fixada pelo tipo de combustível)
                    </div>
                  ) : (
                    <Select value={unit} onValueChange={setUnit} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUnitSuggestions().map((suggestedUnit) => {
                          if (!suggestedUnit || suggestedUnit.trim() === '') return null;
                          const unitInfo = ACTIVITY_UNITS.find(u => u.value === suggestedUnit);
                          return (
                            <SelectItem key={suggestedUnit} value={suggestedUnit}>
                              {unitInfo?.label || suggestedUnit}
                            </SelectItem>
                          );
                        })}
                        {ACTIVITY_UNITS.filter(unit => 
                          unit.value && 
                          unit.value.trim() !== '' && 
                          !getUnitSuggestions().includes(unit.value)
                        ).map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* CORREÇÃO CRÍTICA: Seleção de Tipo de Combustível */}
              {emissionFactors.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="emission-factor">Tipo de Combustível *</Label>
                  <Select value={selectedEmissionFactorId} onValueChange={handleFactorSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de combustível consumido" />
                    </SelectTrigger>
                    <SelectContent>
                      {emissionFactors.map((factor) => (
                        <SelectItem key={factor.id} value={factor.id}>
                          {factor.name} ({factor.activity_unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Esta categoria possui múltiplos tipos de combustível. Selecione o tipo específico consumido para cálculo preciso.
                  </div>
                </div>
              )}

              {/* GHG Protocol Brasil Compliance Note */}
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium">📋 GHG Protocol Brasil 2025.0.1</p>
                <p>Informe a quantidade já convertida na unidade base do combustível selecionado. O sistema calculará automaticamente as parcelas fóssil e biogênica conforme orientações do protocolo brasileiro.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-document">Documento Fonte (opcional)</Label>
                <Input
                  id="source-document"
                  value={sourceDocument}
                  onChange={(e) => setSourceDocument(e.target.value)}
                  placeholder="Ex: Fatura de energia 123/2024, Nota fiscal 456"
                />
              </div>

              {emissionFactors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fatores de Emissão Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      {emissionFactors.length} fator(es) disponível(is) para cálculo automático nesta categoria.
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? (editingData ? "Salvando..." : "Adicionando...") : (editingData ? "Salvar Alterações" : "Adicionar Dados")}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}