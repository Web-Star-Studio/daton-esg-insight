import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ActivityDataList } from "@/components/ActivityDataList";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Snowflake, Thermometer, Wind } from "lucide-react";
import { addActivityData } from "@/services/emissions";
import { supabase } from "@/integrations/supabase/client";

interface FugitiveEmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: any;
}

interface RefrigerantFactor {
  id: string;
  chemical_name: string;
  chemical_formula: string | null;
  refrigerant_code: string;
  gwp_ar4: number | null;
  gwp_ar5: number | null;
  gwp_ar6: number;
  is_kyoto_gas: boolean;
  category: string;
  source: string;
}

// GHG Protocol Fugitive Emission Categories
const FUGITIVE_CATEGORIES = [
  { value: "rac", label: "Refrigeração e Ar Condicionado (RAC)", icon: Snowflake },
  { value: "industrial_gases", label: "Gases Industriais", icon: Wind },
  { value: "foam_blowing", label: "Agentes Expansores de Espuma", icon: Thermometer },
];

// RAC Calculation Methods according to GHG Protocol
const RAC_CALCULATION_METHODS = [
  { 
    value: "balance_mass", 
    label: "Balanço de Massa", 
    description: "E = (EUN + EUE + EUD) × GWP",
    formula: "Equipamentos Novos + Equipamentos Existentes + Equipamentos Dispensados"
  },
  { 
    value: "screening", 
    label: "Método de Triagem (Screening)", 
    description: "Estimativa com base na capacidade de refrigeração",
    formula: "Capacidade × Fator de Emissão × GWP"
  },
  { 
    value: "emission_factor", 
    label: "Fator de Emissão", 
    description: "Aplicação direta de fator por equipamento",
    formula: "Número de Equipamentos × Fator × GWP"
  },
];

const EQUIPMENT_TYPES = [
  { value: "ar_condicionado_janela", label: "Ar Condicionado de Janela" },
  { value: "ar_condicionado_split", label: "Ar Condicionado Split" },
  { value: "ar_condicionado_central", label: "Ar Condicionado Central" },
  { value: "refrigerador_domestico", label: "Refrigerador Doméstico" },
  { value: "freezer", label: "Freezer" },
  { value: "camara_fria", label: "Câmara Fria" },
  { value: "chiller", label: "Chiller" },
  { value: "equipamento_transporte", label: "Equipamento de Transporte Refrigerado" },
];

const EQUIPMENT_STATUS = [
  { value: "novo", label: "Equipamento Novo (EUN)" },
  { value: "existente", label: "Equipamento Existente (EUE)" },
  { value: "dispensado", label: "Equipamento Dispensado (EUD)" },
];

export function FugitiveEmissionsModal({ isOpen, onClose, source }: FugitiveEmissionsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("existing");
  const [isLoading, setIsLoading] = useState(false);
  const [refrigerantFactors, setRefrigerantFactors] = useState<RefrigerantFactor[]>([]);
  
  // Form states
  const [fugitiveCategory, setFugitiveCategory] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [refrigerantType, setRefrigerantType] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState("");
  
  // Balance Mass Method (EUN + EUE + EUD)
  const [eun, setEun] = useState(""); // Equipamentos Novos
  const [eue, setEue] = useState(""); // Equipamentos Existentes  
  const [eud, setEud] = useState(""); // Equipamentos Dispensados
  
  // Screening Method
  const [refrigerationCapacity, setRefrigerationCapacity] = useState("");
  const [capacityUnit, setCapacityUnit] = useState("TR"); // Toneladas de Refrigeração
  
  // Emission Factor Method
  const [equipmentQuantity, setEquipmentQuantity] = useState("");
  const [customEmissionFactor, setCustomEmissionFactor] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load refrigerant factors when modal opens
  useState(() => {
    if (isOpen) {
      loadRefrigerantFactors();
    }
  });

  const loadRefrigerantFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('refrigerant_factors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setRefrigerantFactors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar refrigerantes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source?.id) return;

    // Validations based on GHG Protocol requirements
    if (!fugitiveCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a categoria de emissão fugitiva",
        variant: "destructive",
      });
      return;
    }

    if (fugitiveCategory === "rac" && !calculationMethod) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o método de cálculo para RAC",
        variant: "destructive",
      });
      return;
    }

    if (!refrigerantType) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o tipo de refrigerante",
        variant: "destructive",
      });
      return;
    }

    // Method-specific validations
    if (calculationMethod === "balance_mass" && (!eun || !eue || !eud)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha EUN, EUE e EUD para balanço de massa",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "screening" && (!refrigerationCapacity || !capacityUnit)) {
      toast({
        title: "Campos obrigatórios", 
        description: "Preencha a capacidade de refrigeração",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "emission_factor" && (!equipmentQuantity || !customEmissionFactor)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a quantidade de equipamentos e fator de emissão",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o período dos dados",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate final quantity based on method
      let finalQuantity = "";
      let finalUnit = "";
      let sourceDocument = `Emissões Fugitivas - ${fugitiveCategory.toUpperCase()}`;

      switch (calculationMethod) {
        case "balance_mass":
          // E = (EUN + EUE + EUD) × GWP
          const totalMass = parseFloat(eun) + parseFloat(eue) + parseFloat(eud);
          finalQuantity = totalMass.toString();
          finalUnit = "kg";
          sourceDocument += ` - Balanço de Massa - ${refrigerantType}`;
          break;
        case "screening":
          finalQuantity = refrigerationCapacity;
          finalUnit = capacityUnit;
          sourceDocument += ` - Screening - ${refrigerationCapacity}${capacityUnit}`;
          break;
        case "emission_factor":
          finalQuantity = equipmentQuantity;
          finalUnit = "equipamentos";
          sourceDocument += ` - Fator de Emissão - ${equipmentQuantity} equipamentos`;
          break;
        default:
          finalQuantity = "1";
          finalUnit = "unidade";
      }

      await addActivityData({
        emission_source_id: source.id,
        quantity: parseFloat(finalQuantity),
        unit: finalUnit,
        period_start_date: startDate,
        period_end_date: endDate,
        source_document: sourceDocument,
      });

      toast({
        title: "Sucesso!",
        description: "Dados de emissões fugitivas adicionados com sucesso",
      });

      // Reset form
      setFugitiveCategory("");
      setCalculationMethod("");
      setEquipmentType("");
      setRefrigerantType("");
      setEquipmentStatus("");
      setEun("");
      setEue("");
      setEud("");
      setRefrigerationCapacity("");
      setCapacityUnit("TR");
      setEquipmentQuantity("");
      setCustomEmissionFactor("");
      setStartDate("");
      setEndDate("");
      
      setActiveTab("existing");
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCalculationForm = () => {
    if (fugitiveCategory !== "rac") return null;

    switch (calculationMethod) {
      case "balance_mass":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Fórmula GHG Protocol:</strong> E = (EUN + EUE + EUD) × GWP
                <br />
                EUN = Equipamentos Novos, EUE = Equipamentos Existentes, EUD = Equipamentos Dispensados
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="eun" className="text-sm font-medium">
                  EUN (kg) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="eun"
                  type="number"
                  step="0.01"
                  value={eun}
                  onChange={(e) => setEun(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Equipamentos Novos"
                />
              </div>
              <div>
                <Label htmlFor="eue" className="text-sm font-medium">
                  EUE (kg) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="eue"
                  type="number"
                  step="0.01"
                  value={eue}
                  onChange={(e) => setEue(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Equipamentos Existentes"
                />
              </div>
              <div>
                <Label htmlFor="eud" className="text-sm font-medium">
                  EUD (kg) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="eud"
                  type="number"
                  step="0.01"
                  value={eud}
                  onChange={(e) => setEud(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Equipamentos Dispensados"
                />
              </div>
            </div>
            
            {eun && eue && eud && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Total calculado:</strong> {(parseFloat(eun) + parseFloat(eue) + parseFloat(eud)).toFixed(2)} kg de refrigerante
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case "screening":
        return (
          <div className="space-y-4">
            <Alert>
              <Thermometer className="h-4 w-4" />
              <AlertDescription>
                Método de triagem baseado na capacidade de refrigeração dos equipamentos.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="refrigerationCapacity" className="text-sm font-medium">
                  Capacidade de Refrigeração <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="refrigerationCapacity"
                  type="number"
                  step="0.01"
                  value={refrigerationCapacity}
                  onChange={(e) => setRefrigerationCapacity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 5.5"
                />
              </div>
              <div>
                <Label htmlFor="capacityUnit" className="text-sm font-medium">Unidade</Label>
                <Select value={capacityUnit} onValueChange={setCapacityUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TR">TR (Toneladas de Refrigeração)</SelectItem>
                    <SelectItem value="kW">kW (Quilowatts)</SelectItem>
                    <SelectItem value="BTU/h">BTU/h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "emission_factor":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentQuantity" className="text-sm font-medium">
                  Número de Equipamentos <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="equipmentQuantity"
                  type="number"
                  value={equipmentQuantity}
                  onChange={(e) => setEquipmentQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <Label htmlFor="customEmissionFactor" className="text-sm font-medium">
                  Fator de Emissão (kg/equipamento/ano) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="customEmissionFactor"
                  type="number"
                  step="0.001"
                  value={customEmissionFactor}
                  onChange={(e) => setCustomEmissionFactor(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 0.15"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!source) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5" />
            Emissões Fugitivas - {source.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Dados Existentes</TabsTrigger>
            <TabsTrigger value="add">Adicionar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <ActivityDataList source={source} />
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>GHG Protocol Brasil 2025.0.1:</strong> Emissões fugitivas incluem liberações intencionais e não intencionais de gases de efeito estufa. Para RAC, use sempre a fórmula E = (EUN + EUE + EUD) × GWP.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fugitive Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Categoria de Emissão Fugitiva</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={fugitiveCategory} onValueChange={setFugitiveCategory}>
                    {FUGITIVE_CATEGORIES.map((category) => (
                      <div key={category.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={category.value} id={category.value} />
                        <Label htmlFor={category.value} className="flex items-center gap-2 cursor-pointer">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* RAC Calculation Method */}
              {fugitiveCategory === "rac" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Método de Cálculo RAC</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={calculationMethod} onValueChange={setCalculationMethod}>
                      {RAC_CALCULATION_METHODS.map((method) => (
                        <div key={method.value} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={method.value} id={method.value} />
                            <Label htmlFor={method.value} className="cursor-pointer font-medium">
                              {method.label}
                            </Label>
                          </div>
                          <div className="ml-6 space-y-1">
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="text-xs font-mono bg-muted p-1 rounded">{method.formula}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Equipment and Refrigerant Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Tipo de Equipamento e Refrigerante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="equipmentType" className="text-sm font-medium">Tipo de Equipamento</Label>
                    <Select value={equipmentType} onValueChange={setEquipmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="refrigerantType" className="text-sm font-medium">
                      Tipo de Refrigerante <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                    </Label>
                    <Select value={refrigerantType} onValueChange={setRefrigerantType}>
                      <SelectTrigger className="bg-ghg-required/10">
                        <SelectValue placeholder="Selecione o refrigerante" />
                      </SelectTrigger>
                      <SelectContent>
                        {refrigerantFactors.map((refrigerant) => (
                          <SelectItem key={refrigerant.id} value={refrigerant.id}>
                            {refrigerant.chemical_name} ({refrigerant.refrigerant_code}) - GWP: {refrigerant.gwp_ar4 || refrigerant.gwp_ar6}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Method-specific form */}
              {calculationMethod && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">4. Dados Específicos do Método</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCalculationForm()}
                  </CardContent>
                </Card>
              )}

              {/* Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">5. Período dos Dados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-sm font-medium">
                        Data Início <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-ghg-required/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm font-medium">
                        Data Fim <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-ghg-required/10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Adicionando..." : "Adicionar Dados"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}