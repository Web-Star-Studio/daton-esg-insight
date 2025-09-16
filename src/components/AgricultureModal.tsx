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
import { AlertTriangle, Wheat, Beef, Sprout, Flame } from "lucide-react";
import { addActivityData } from "@/services/emissions";

interface AgricultureModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: any;
}

// GHG Protocol Agriculture Categories
const AGRICULTURE_CATEGORIES = [
  {
    value: "fermentacao_enterica",
    label: "Fermentação Entérica",
    icon: Beef,
    description: "CH₄ da digestão de ruminantes",
    biogenic: false
  },
  {
    value: "manejo_dejetos",
    label: "Manejo de Dejetos Animais",
    icon: Beef,
    description: "CH₄ e N₂O de dejetos pecuários",
    biogenic: false
  },
  {
    value: "cultivo_arroz",
    label: "Cultivo de Arroz Irrigado",
    icon: Wheat,
    description: "CH₄ de solos alagados",
    biogenic: false
  },
  {
    value: "solos_agricolas",
    label: "Solos Agrícolas",
    icon: Sprout,
    description: "N₂O de fertilização e manejo",
    biogenic: false
  },
  {
    value: "queima_residuos",
    label: "Queima de Resíduos Agrícolas",
    icon: Flame,
    description: "CO₂, CH₄, N₂O da queima controlada",
    biogenic: true
  },
  {
    value: "calcagem",
    label: "Aplicação de Calcário",
    icon: Sprout,
    description: "CO₂ da decomposição de carbonatos",
    biogenic: false
  },
  {
    value: "ureia",
    label: "Aplicação de Ureia",
    icon: Sprout,
    description: "CO₂ da hidrólise da ureia",
    biogenic: false
  }
];

// Livestock Categories
const LIVESTOCK_CATEGORIES = [
  { value: "bovinos_leite", label: "Bovinos de Leite" },
  { value: "bovinos_corte", label: "Bovinos de Corte" },
  { value: "bovinos_outros", label: "Outros Bovinos" },
  { value: "bufalos", label: "Búfalos" },
  { value: "suinos", label: "Suínos" },
  { value: "ovinos", label: "Ovinos" },
  { value: "caprinos", label: "Caprinos" },
  { value: "aves_postura", label: "Aves de Postura" },
  { value: "aves_corte", label: "Aves de Corte" },
  { value: "equinos", label: "Equinos" },
];

// Manure Management Systems
const MANURE_SYSTEMS = [
  { value: "pasto", label: "Pastejo/Pasto" },
  { value: "solido_seco", label: "Sólido/Seco" },
  { value: "liquido_lagoa", label: "Líquido/Lagoa" },
  { value: "liquido_tanque", label: "Líquido/Tanque" },
  { value: "compostagem", label: "Compostagem" },
  { value: "biodigestor", label: "Biodigestor" },
  { value: "queima", label: "Queima" },
];

// Crop Types for Rice
const RICE_TYPES = [
  { value: "irrigado_continuo", label: "Irrigado Contínuo" },
  { value: "irrigado_intermitente", label: "Irrigado Intermitente" },
  { value: "sequeiro", label: "Arroz de Sequeiro" },
  { value: "varzea", label: "Várzea" },
];

// Fertilizer Types
const FERTILIZER_TYPES = [
  { value: "nitrogenados_sinteticos", label: "Fertilizantes Nitrogenados Sintéticos" },
  { value: "organicos", label: "Fertilizantes Orgânicos" },
  { value: "dejetos_animais", label: "Dejetos Animais Aplicados" },
  { value: "residuos_culturas", label: "Resíduos de Culturas" },
  { value: "mineralizacao", label: "Mineralização N-Orgânico" },
  { value: "fixacao_biologica", label: "Fixação Biológica N₂" },
];

// Crop Residue Types
const CROP_RESIDUE_TYPES = [
  { value: "cana_acucar", label: "Cana-de-açúcar" },
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "trigo", label: "Trigo" },
  { value: "arroz", label: "Arroz" },
  { value: "algodao", label: "Algodão" },
  { value: "outros_cereais", label: "Outros Cereais" },
];

export function AgricultureModal({ isOpen, onClose, source }: AgricultureModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("existing");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [agricultureCategory, setAgricultureCategory] = useState("");
  const [livestockCategory, setLivestockCategory] = useState("");
  const [animalCount, setAnimalCount] = useState("");
  const [averageWeight, setAverageWeight] = useState("");
  const [manureSystem, setManureSystem] = useState("");
  const [riceType, setRiceType] = useState("");
  const [cultivatedArea, setCultivatedArea] = useState("");
  const [fertilizerType, setFertilizerType] = useState("");
  const [nitrogenAmount, setNitrogenAmount] = useState("");
  const [cropResidueType, setCropResidueType] = useState("");
  const [residueAmount, setResidueAmount] = useState("");
  const [burningEfficiency, setBurningEfficiency] = useState("90");
  const [limestoneAmount, setLimestoneAmount] = useState("");
  const [ureaAmount, setUreaAmount] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source?.id) return;

    // Validations based on GHG Protocol requirements
    if (!agricultureCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a categoria agrícola",
        variant: "destructive",
      });
      return;
    }

    // Category-specific validations
    if ((agricultureCategory === "fermentacao_enterica" || agricultureCategory === "manejo_dejetos") && !livestockCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a categoria de animais",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "fermentacao_enterica" && !animalCount) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o número de animais",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "manejo_dejetos" && (!animalCount || !manureSystem)) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o número de animais e sistema de manejo",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "cultivo_arroz" && (!riceType || !cultivatedArea)) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo de arroz e área cultivada",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "solos_agricolas" && (!fertilizerType || !nitrogenAmount)) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo de fertilizante e quantidade de nitrogênio",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "queima_residuos" && (!cropResidueType || !residueAmount)) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo de resíduo e quantidade",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "calcagem" && !limestoneAmount) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a quantidade de calcário aplicada",
        variant: "destructive",
      });
      return;
    }

    if (agricultureCategory === "ureia" && !ureaAmount) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a quantidade de ureia aplicada",
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
      // Calculate final quantity based on category
      let finalQuantity = "";
      let finalUnit = "";
      let sourceDocument = `Agricultura - ${agricultureCategory.toUpperCase()}`;

      switch (agricultureCategory) {
        case "fermentacao_enterica":
          finalQuantity = animalCount;
          finalUnit = "cabeças";
          sourceDocument += ` - ${livestockCategory} - ${animalCount} cabeças`;
          break;
        case "manejo_dejetos":
          finalQuantity = animalCount;
          finalUnit = "cabeças";
          sourceDocument += ` - ${livestockCategory} - ${manureSystem}`;
          break;
        case "cultivo_arroz":
          finalQuantity = cultivatedArea;
          finalUnit = "ha";
          sourceDocument += ` - ${riceType} - ${cultivatedArea}ha`;
          break;
        case "solos_agricolas":
          finalQuantity = nitrogenAmount;
          finalUnit = "kg N";
          sourceDocument += ` - ${fertilizerType} - ${nitrogenAmount}kg N`;
          break;
        case "queima_residuos":
          finalQuantity = residueAmount;
          finalUnit = "t";
          sourceDocument += ` - ${cropResidueType} - ${residueAmount}t`;
          break;
        case "calcagem":
          finalQuantity = limestoneAmount;
          finalUnit = "t";
          sourceDocument += ` - Calcário - ${limestoneAmount}t`;
          break;
        case "ureia":
          finalQuantity = ureaAmount;
          finalUnit = "t";
          sourceDocument += ` - Ureia - ${ureaAmount}t`;
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
        description: "Dados agrícolas adicionados com sucesso",
      });

      // Reset form
      setAgricultureCategory("");
      setLivestockCategory("");
      setAnimalCount("");
      setAverageWeight("");
      setManureSystem("");
      setRiceType("");
      setCultivatedArea("");
      setFertilizerType("");
      setNitrogenAmount("");
      setCropResidueType("");
      setResidueAmount("");
      setBurningEfficiency("90");
      setLimestoneAmount("");
      setUreaAmount("");
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

  const renderCategoryForm = () => {
    switch (agricultureCategory) {
      case "fermentacao_enterica":
        return (
          <div className="space-y-4">
            <Alert>
              <Beef className="h-4 w-4" />
              <AlertDescription>
                <strong>Fermentação Entérica:</strong> CH₄ produzido na digestão de ruminantes. Emissões não-biogênicas conforme GHG Protocol.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="livestockCategory" className="text-sm font-medium">
                Categoria Animal <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={livestockCategory} onValueChange={setLivestockCategory}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {LIVESTOCK_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animalCount" className="text-sm font-medium">
                  Número de Animais <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="animalCount"
                  type="number"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 1000"
                />
              </div>
              <div>
                <Label htmlFor="averageWeight" className="text-sm font-medium">Peso Médio (kg)</Label>
                <Input
                  id="averageWeight"
                  type="number"
                  step="0.1"
                  value={averageWeight}
                  onChange={(e) => setAverageWeight(e.target.value)}
                  placeholder="Ex: 450"
                />
              </div>
            </div>
          </div>
        );

      case "manejo_dejetos":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Manejo de Dejetos:</strong> CH₄ e N₂O de decomposição anaeróbica e nitrificação/desnitrificação.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="livestockCategory" className="text-sm font-medium">
                Categoria Animal <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={livestockCategory} onValueChange={setLivestockCategory}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {LIVESTOCK_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animalCount" className="text-sm font-medium">
                  Número de Animais <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="animalCount"
                  type="number"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 1000"
                />
              </div>
              <div>
                <Label htmlFor="manureSystem" className="text-sm font-medium">
                  Sistema de Manejo <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Select value={manureSystem} onValueChange={setManureSystem}>
                  <SelectTrigger className="bg-ghg-required/10">
                    <SelectValue placeholder="Selecione o sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANURE_SYSTEMS.map((system) => (
                      <SelectItem key={system.value} value={system.value}>
                        {system.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "cultivo_arroz":
        return (
          <div className="space-y-4">
            <Alert>
              <Wheat className="h-4 w-4" />
              <AlertDescription>
                <strong>Cultivo de Arroz:</strong> CH₄ de solos alagados em condições anaeróbicas. Factor varia conforme sistema de irrigação.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="riceType" className="text-sm font-medium">
                  Tipo de Sistema <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Select value={riceType} onValueChange={setRiceType}>
                  <SelectTrigger className="bg-ghg-required/10">
                    <SelectValue placeholder="Selecione o sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {RICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cultivatedArea" className="text-sm font-medium">
                  Área Cultivada (ha) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="cultivatedArea"
                  type="number"
                  step="0.01"
                  value={cultivatedArea}
                  onChange={(e) => setCultivatedArea(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 100"
                />
              </div>
            </div>
          </div>
        );

      case "solos_agricolas":
        return (
          <div className="space-y-4">
            <Alert>
              <Sprout className="h-4 w-4" />
              <AlertDescription>
                <strong>Solos Agrícolas:</strong> N₂O de nitrificação e desnitrificação. Inclui fertilizantes sintéticos, orgânicos e fixação biológica.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="fertilizerType" className="text-sm font-medium">
                Tipo de Fertilizante <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={fertilizerType} onValueChange={setFertilizerType}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {FERTILIZER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nitrogenAmount" className="text-sm font-medium">
                Quantidade de Nitrogênio (kg N) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Input
                id="nitrogenAmount"
                type="number"
                step="0.01"
                value={nitrogenAmount}
                onChange={(e) => setNitrogenAmount(e.target.value)}
                className="bg-ghg-required/10"
                placeholder="Ex: 5000"
              />
            </div>
          </div>
        );

      case "queima_residuos":
        return (
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
              <Flame className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Queima de Resíduos (BIOGÊNICO):</strong> CO₂ é biogênico e reportado separadamente. CH₄ e N₂O são não-biogênicos.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cropResidueType" className="text-sm font-medium">
                  Tipo de Cultura <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Select value={cropResidueType} onValueChange={setCropResidueType}>
                  <SelectTrigger className="bg-ghg-required/10">
                    <SelectValue placeholder="Selecione a cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_RESIDUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="residueAmount" className="text-sm font-medium">
                  Quantidade Queimada (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="residueAmount"
                  type="number"
                  step="0.01"
                  value={residueAmount}
                  onChange={(e) => setResidueAmount(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 50"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="burningEfficiency" className="text-sm font-medium">Eficiência de Queima (%)</Label>
              <Input
                id="burningEfficiency"
                type="number"
                min="0"
                max="100"
                value={burningEfficiency}
                onChange={(e) => setBurningEfficiency(e.target.value)}
                placeholder="90"
              />
            </div>
          </div>
        );

      case "calcagem":
        return (
          <div className="space-y-4">
            <Alert>
              <Sprout className="h-4 w-4" />
              <AlertDescription>
                <strong>Aplicação de Calcário:</strong> CO₂ da decomposição de carbonatos (CaCO₃ e MgCO₃). Emissões não-biogênicas.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="limestoneAmount" className="text-sm font-medium">
                Quantidade de Calcário (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Input
                id="limestoneAmount"
                type="number"
                step="0.01"
                value={limestoneAmount}
                onChange={(e) => setLimestoneAmount(e.target.value)}
                className="bg-ghg-required/10"
                placeholder="Ex: 20"
              />
            </div>
          </div>
        );

      case "ureia":
        return (
          <div className="space-y-4">
            <Alert>
              <Sprout className="h-4 w-4" />
              <AlertDescription>
                <strong>Aplicação de Ureia:</strong> CO₂ da hidrólise da ureia [CO(NH₂)₂ + H₂O → CO₂ + 2NH₃]. Emissões não-biogênicas.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="ureaAmount" className="text-sm font-medium">
                Quantidade de Ureia (t) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Input
                id="ureaAmount"
                type="number"
                step="0.01"
                value={ureaAmount}
                onChange={(e) => setUreaAmount(e.target.value)}
                className="bg-ghg-required/10"
                placeholder="Ex: 10"
              />
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
            <Wheat className="h-5 w-5" />
            Agricultura - {source.name}
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
                <strong>GHG Protocol Brasil 2025.0.1:</strong> Agricultura inclui emissões de atividades agrícolas e pecuárias. 
                <strong className="text-orange-600"> IMPORTANTE:</strong> CO₂ de queima de resíduos é <strong>biogênico</strong> e deve ser reportado separadamente.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agriculture Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Categoria Agrícola</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={agricultureCategory} onValueChange={setAgricultureCategory}>
                    {AGRICULTURE_CATEGORIES.map((category) => (
                      <div key={category.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={category.value} id={category.value} />
                          <Label htmlFor={category.value} className="flex items-center gap-2 cursor-pointer font-medium">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                            {category.biogenic && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                BIOGÊNICO
                              </span>
                            )}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{category.description}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Category-specific form */}
              {agricultureCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Dados Específicos da Atividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCategoryForm()}
                  </CardContent>
                </Card>
              )}

              {/* Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Período dos Dados</CardTitle>
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