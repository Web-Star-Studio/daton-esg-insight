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
import { AlertTriangle, Factory, Hammer, Zap } from "lucide-react";
import { addActivityData } from "@/services/emissions";

interface IndustrialProcessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: any;
}

// GHG Protocol Industrial Process Categories
const INDUSTRIAL_CATEGORIES = [
  {
    value: "siderurgia",
    label: "Indústria Siderúrgica",
    icon: Hammer,
    description: "Produção de ferro, aço e ligas ferrosas"
  },
  {
    value: "cimento",
    label: "Produção de Cimento",
    icon: Factory,
    description: "Calcinação de calcário e processos cimenteiros"
  },
  {
    value: "aluminio",
    label: "Produção de Alumínio",
    icon: Zap,
    description: "Eletrólise e fundição de alumínio"
  },
  {
    value: "quimicos",
    label: "Processos Químicos",
    icon: Factory,
    description: "Produção de produtos químicos diversos"
  },
  {
    value: "vidro",
    label: "Produção de Vidro",
    icon: Factory,
    description: "Fusão de matérias-primas vítreas"
  },
  {
    value: "ceramica",
    label: "Produção de Cerâmica",
    icon: Factory,
    description: "Calcinação e queima de materiais cerâmicos"
  },
  {
    value: "cal",
    label: "Produção de Cal",
    icon: Factory,
    description: "Calcinação de calcário para produção de cal"
  },
  {
    value: "outros",
    label: "Outros Processos Industriais",
    icon: Factory,
    description: "Outros processos não combustivos"
  }
];

// Calculation Methods for Industrial Processes
const CALCULATION_METHODS = [
  {
    value: "emission_factor",
    label: "Fator de Emissão",
    description: "Produção × Fator de Emissão",
    formula: "Quantidade Produzida × Fator de Emissão por tonelada"
  },
  {
    value: "mass_balance",
    label: "Balanço de Massa",
    description: "Análise de entradas e saídas",
    formula: "Entrada - Saída - Acúmulo = Emissões"
  },
  {
    value: "consumption_input",
    label: "Consumo de Insumos",
    description: "Baseado no consumo de matérias-primas",
    formula: "Insumo Consumido × Fator de Conversão"
  }
];

// Steel Production Processes
const STEEL_PROCESSES = [
  { value: "alto_forno", label: "Alto-forno (Produção de Ferro Gusa)" },
  { value: "aciaria_ld", label: "Aciaria LD (Conversor a Oxigênio)" },
  { value: "aciaria_eaf", label: "Aciaria EAF (Forno Elétrico a Arco)" },
  { value: "reducao_direta", label: "Redução Direta de Minério" },
  { value: "ferro_esponja", label: "Produção de Ferro Esponja" },
];

// Cement Production Processes
const CEMENT_PROCESSES = [
  { value: "calcinacao_calcario", label: "Calcinação de Calcário" },
  { value: "combustivel_forno", label: "Combustível no Forno de Cimento" },
  { value: "materias_primas", label: "Outras Matérias-primas Carbonáticas" },
];

// Chemical Processes
const CHEMICAL_PROCESSES = [
  { value: "amonia", label: "Produção de Amônia" },
  { value: "acido_nitrico", label: "Produção de Ácido Nítrico" },
  { value: "acido_sulfurico", label: "Produção de Ácido Sulfúrico" },
  { value: "soda_ash", label: "Produção de Carbonato de Sódio" },
  { value: "petroquimicos", label: "Processos Petroquímicos" },
];

export function IndustrialProcessesModal({ isOpen, onClose, source }: IndustrialProcessesModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("existing");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [industrialCategory, setIndustrialCategory] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("");
  const [specificProcess, setSpecificProcess] = useState("");
  const [productionQuantity, setProductionQuantity] = useState("");
  const [productionUnit, setProductionUnit] = useState("t");
  const [emissionFactor, setEmissionFactor] = useState("");
  const [emissionFactorUnit, setEmissionFactorUnit] = useState("tCO2/t");
  
  // Mass Balance Method
  const [inputMaterial, setInputMaterial] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [outputMaterial, setOutputMaterial] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");
  
  // Input Consumption Method
  const [rawMaterialType, setRawMaterialType] = useState("");
  const [rawMaterialQuantity, setRawMaterialQuantity] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source?.id) return;

    // Validations based on GHG Protocol requirements
    if (!industrialCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a categoria de processo industrial",
        variant: "destructive",
      });
      return;
    }

    if (!calculationMethod) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o método de cálculo",
        variant: "destructive",
      });
      return;
    }

    // Method-specific validations
    if (calculationMethod === "emission_factor" && (!productionQuantity || !emissionFactor)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a quantidade produzida e fator de emissão",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "mass_balance" && (!inputQuantity || !outputQuantity)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha as quantidades de entrada e saída",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "consumption_input" && (!rawMaterialQuantity || !conversionFactor)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a quantidade de insumo e fator de conversão",
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
      let sourceDocument = `Processos Industriais - ${industrialCategory.toUpperCase()}`;

      switch (calculationMethod) {
        case "emission_factor":
          finalQuantity = productionQuantity;
          finalUnit = productionUnit;
          sourceDocument += ` - Fator de Emissão - ${productionQuantity}${productionUnit}`;
          break;
        case "mass_balance":
          // For mass balance, we use input quantity as base
          finalQuantity = inputQuantity;
          finalUnit = "t";
          sourceDocument += ` - Balanço de Massa - ${inputMaterial}`;
          break;
        case "consumption_input":
          finalQuantity = rawMaterialQuantity;
          finalUnit = "t";
          sourceDocument += ` - Consumo Insumos - ${rawMaterialType}`;
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
        description: "Dados de processos industriais adicionados com sucesso",
      });

      // Reset form
      setIndustrialCategory("");
      setCalculationMethod("");
      setSpecificProcess("");
      setProductionQuantity("");
      setProductionUnit("t");
      setEmissionFactor("");
      setEmissionFactorUnit("tCO2/t");
      setInputMaterial("");
      setInputQuantity("");
      setOutputMaterial("");
      setOutputQuantity("");
      setRawMaterialType("");
      setRawMaterialQuantity("");
      setConversionFactor("");
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

  const getProcessOptions = () => {
    switch (industrialCategory) {
      case "siderurgia":
        return STEEL_PROCESSES;
      case "cimento":
        return CEMENT_PROCESSES;
      case "quimicos":
        return CHEMICAL_PROCESSES;
      default:
        return [];
    }
  };

  const renderCalculationForm = () => {
    switch (calculationMethod) {
      case "emission_factor":
        return (
          <div className="space-y-4">
            <Alert>
              <Factory className="h-4 w-4" />
              <AlertDescription>
                <strong>Fórmula:</strong> Emissões = Quantidade Produzida × Fator de Emissão
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productionQuantity" className="text-sm font-medium">
                  Quantidade Produzida <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="productionQuantity"
                  type="number"
                  step="0.01"
                  value={productionQuantity}
                  onChange={(e) => setProductionQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 10000"
                />
              </div>
              <div>
                <Label htmlFor="productionUnit" className="text-sm font-medium">Unidade</Label>
                <Select value={productionUnit} onValueChange={setProductionUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t">Toneladas (t)</SelectItem>
                    <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                    <SelectItem value="unidade">Unidades</SelectItem>
                    <SelectItem value="m3">Metros cúbicos (m³)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emissionFactor" className="text-sm font-medium">
                  Fator de Emissão <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="emissionFactor"
                  type="number"
                  step="0.001"
                  value={emissionFactor}
                  onChange={(e) => setEmissionFactor(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 0.85"
                />
              </div>
              <div>
                <Label htmlFor="emissionFactorUnit" className="text-sm font-medium">Unidade do Fator</Label>
                <Select value={emissionFactorUnit} onValueChange={setEmissionFactorUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tCO2/t">tCO₂/t produto</SelectItem>
                    <SelectItem value="kgCO2/t">kgCO₂/t produto</SelectItem>
                    <SelectItem value="tCO2/unidade">tCO₂/unidade</SelectItem>
                    <SelectItem value="tCO2/m3">tCO₂/m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {productionQuantity && emissionFactor && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Emissões estimadas:</strong> {(parseFloat(productionQuantity) * parseFloat(emissionFactor)).toFixed(3)} tCO₂e
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case "mass_balance":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Balanço de Massa:</strong> Entrada - Saída - Acúmulo = Emissões
                <br />Usado quando há controle preciso de entradas e saídas do processo.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inputMaterial" className="text-sm font-medium">Material de Entrada</Label>
                <Input
                  id="inputMaterial"
                  value={inputMaterial}
                  onChange={(e) => setInputMaterial(e.target.value)}
                  placeholder="Ex: Calcário"
                />
              </div>
              <div>
                <Label htmlFor="inputQuantity" className="text-sm font-medium">
                  Quantidade Entrada (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="inputQuantity"
                  type="number"
                  step="0.01"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 1000"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outputMaterial" className="text-sm font-medium">Material de Saída</Label>
                <Input
                  id="outputMaterial"
                  value={outputMaterial}
                  onChange={(e) => setOutputMaterial(e.target.value)}
                  placeholder="Ex: Clínquer"
                />
              </div>
              <div>
                <Label htmlFor="outputQuantity" className="text-sm font-medium">
                  Quantidade Saída (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="outputQuantity"
                  type="number"
                  step="0.01"
                  value={outputQuantity}
                  onChange={(e) => setOutputQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 560"
                />
              </div>
            </div>
          </div>
        );

      case "consumption_input":
        return (
          <div className="space-y-4">
            <Alert>
              <Hammer className="h-4 w-4" />
              <AlertDescription>
                <strong>Consumo de Insumos:</strong> Insumo Consumido × Fator de Conversão
                <br />Baseado na quantidade de matérias-primas consumidas no processo.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="rawMaterialType" className="text-sm font-medium">Tipo de Matéria-Prima</Label>
              <Input
                id="rawMaterialType"
                value={rawMaterialType}
                onChange={(e) => setRawMaterialType(e.target.value)}
                placeholder="Ex: Minério de ferro, Calcário, Coque"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rawMaterialQuantity" className="text-sm font-medium">
                  Quantidade Consumida (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="rawMaterialQuantity"
                  type="number"
                  step="0.01"
                  value={rawMaterialQuantity}
                  onChange={(e) => setRawMaterialQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label htmlFor="conversionFactor" className="text-sm font-medium">
                  Fator de Conversão (tCO₂/t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="conversionFactor"
                  type="number"
                  step="0.001"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 0.44"
                />
              </div>
            </div>
            
            {rawMaterialQuantity && conversionFactor && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Emissões estimadas:</strong> {(parseFloat(rawMaterialQuantity) * parseFloat(conversionFactor)).toFixed(3)} tCO₂e
                </AlertDescription>
              </Alert>
            )}
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
            <Factory className="h-5 w-5" />
            Processos Industriais - {source.name}
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
                <strong>GHG Protocol Brasil 2025.0.1:</strong> Processos industriais incluem emissões de reações químicas e processos físicos, excluindo combustão. Diferem das emissões de combustão por serem resultado direto do processo produtivo.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Industrial Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Categoria de Processo Industrial</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={industrialCategory} onValueChange={setIndustrialCategory}>
                    {INDUSTRIAL_CATEGORIES.map((category) => (
                      <div key={category.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={category.value} id={category.value} />
                          <Label htmlFor={category.value} className="flex items-center gap-2 cursor-pointer font-medium">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{category.description}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Specific Process */}
              {industrialCategory && getProcessOptions().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Processo Específico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={specificProcess} onValueChange={setSpecificProcess}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o processo específico" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProcessOptions().map((process) => (
                          <SelectItem key={process.value} value={process.value}>
                            {process.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Calculation Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Método de Cálculo</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={calculationMethod} onValueChange={setCalculationMethod}>
                    {CALCULATION_METHODS.map((method) => (
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

              {/* Method-specific form */}
              {calculationMethod && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">4. Dados do Processo</CardTitle>
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