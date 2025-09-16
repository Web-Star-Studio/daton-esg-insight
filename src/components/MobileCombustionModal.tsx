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
import { AlertTriangle, Car, Plane, Fuel } from "lucide-react";
import { addActivityData } from "@/services/emissions";
import { supabase } from "@/integrations/supabase/client";

interface MobileCombustionModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: any;
}

interface AirportFactor {
  id: string;
  airport_code: string;
  airport_name: string;
  aircraft_category: string;
  factor_type: string;
  co2_factor: number;
  ch4_factor?: number;
  n2o_factor?: number;
  fuel_consumption_factor?: number;
  unit: string;
}

// GHG Protocol Mobile Combustion Types
const MOBILE_CATEGORIES = [
  { value: "rodoviario", label: "Rodoviário", icon: Car },
  { value: "aereo", label: "Aéreo", icon: Plane },
  { value: "ferroviario", label: "Ferroviário", icon: Car },
  { value: "hidroviario", label: "Hidroviário", icon: Car },
  { value: "dutoviario", label: "Dutoviário", icon: Fuel },
];

const CALCULATION_METHODS = [
  { value: "fuel", label: "Por Combustível Consumido", description: "Quantidade de combustível × Fator de emissão" },
  { value: "distance", label: "Por Distância Percorrida", description: "Distância × Fator por km" },
  { value: "airport", label: "Por Aeroportos (Aéreo)", description: "Uso de fatores específicos de aeroportos" },
];

const FUEL_TYPES = [
  { value: "gasolina_c", label: "Gasolina C" },
  { value: "etanol_hidratado", label: "Etanol Hidratado (Biocombustível)" },
  { value: "diesel_s10", label: "Diesel S10" },
  { value: "diesel_s500", label: "Diesel S500" },
  { value: "biodiesel_b100", label: "Biodiesel B100 (Biocombustível)" },
  { value: "gnv", label: "GNV (Gás Natural Veicular)" },
  { value: "querosene_aviacao", label: "Querosene de Aviação" },
  { value: "oleo_combustivel", label: "Óleo Combustível" },
];

const VEHICLE_CATEGORIES = [
  { value: "automovel", label: "Automóvel" },
  { value: "comercial_leve", label: "Comercial Leve" },
  { value: "caminhao", label: "Caminhão" },
  { value: "onibus", label: "Ônibus" },
  { value: "motocicleta", label: "Motocicleta" },
  { value: "aeronave_comercial", label: "Aeronave Comercial" },
  { value: "aeronave_geral", label: "Aviação Geral" },
];

export function MobileCombustionModal({ isOpen, onClose, source }: MobileCombustionModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("existing");
  const [isLoading, setIsLoading] = useState(false);
  const [airportFactors, setAirportFactors] = useState<AirportFactor[]>([]);
  
  // Form states
  const [mobileCategory, setMobileCategory] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [distance, setDistance] = useState("");
  const [selectedAirport, setSelectedAirport] = useState("");
  const [flights, setFlights] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load airport factors when modal opens
  useState(() => {
    if (isOpen && calculationMethod === "airport") {
      loadAirportFactors();
    }
  });

  const loadAirportFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('airport_factors')
        .select('*')
        .order('airport_name');
      
      if (error) throw error;
      setAirportFactors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar aeroportos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source?.id) return;

    // Validations based on GHG Protocol requirements
    if (!mobileCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a categoria de transporte",
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
    if (calculationMethod === "fuel" && (!fuelType || !quantity)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo de combustível e quantidade",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "distance" && (!vehicleCategory || !distance)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a categoria do veículo e distância",
        variant: "destructive",
      });
      return;
    }

    if (calculationMethod === "airport" && (!selectedAirport || !flights)) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o aeroporto e número de voos",
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
      // Determine final quantity and unit based on method
      let finalQuantity = "";
      let finalUnit = "";
      let sourceDocument = `Combustão Móvel - ${mobileCategory.toUpperCase()} - ${calculationMethod.toUpperCase()}`;

      switch (calculationMethod) {
        case "fuel":
          finalQuantity = quantity;
          finalUnit = unit || "L";
          sourceDocument += ` - ${fuelType}`;
          break;
        case "distance":
          finalQuantity = distance;
          finalUnit = "km";
          sourceDocument += ` - ${vehicleCategory}`;
          break;
        case "airport":
          finalQuantity = flights;
          finalUnit = "voos";
          const airport = airportFactors.find(f => f.id === selectedAirport);
          sourceDocument += ` - ${airport?.airport_name}`;
          break;
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
        description: "Dados de combustão móvel adicionados com sucesso",
      });

      // Reset form
      setMobileCategory("");
      setCalculationMethod("");
      setFuelType("");
      setVehicleCategory("");
      setQuantity("");
      setUnit("");
      setDistance("");
      setSelectedAirport("");
      setFlights("");
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
    switch (calculationMethod) {
      case "fuel":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fuelType" className="text-sm font-medium">
                Tipo de Combustível <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((fuel) => (
                    <SelectItem key={fuel.value} value={fuel.value}>
                      {fuel.label}
                      {fuel.label.includes("Biocombustível") && (
                        <span className="ml-2 text-green-600 text-xs">(Biogênico)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantidade <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-ghg-required/10"
                  placeholder="Ex: 1000"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium">Unidade</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Litros (L)</SelectItem>
                    <SelectItem value="m3">Metros cúbicos (m³)</SelectItem>
                    <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                    <SelectItem value="t">Toneladas (t)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "distance":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicleCategory" className="text-sm font-medium">
                Categoria do Veículo <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="distance" className="text-sm font-medium">
                Distância Percorrida (km) <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="bg-ghg-required/10"
                placeholder="Ex: 50000"
              />
            </div>
          </div>
        );

      case "airport":
        return (
          <div className="space-y-4">
            <Alert>
              <Plane className="h-4 w-4" />
              <AlertDescription>
                Método específico para aviação utilizando fatores de emissão por aeroporto conforme GHG Protocol Brasil.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="selectedAirport" className="text-sm font-medium">
                Aeroporto <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Select value={selectedAirport} onValueChange={setSelectedAirport}>
                <SelectTrigger className="bg-ghg-required/10">
                  <SelectValue placeholder="Selecione o aeroporto" />
                </SelectTrigger>
                <SelectContent>
                  {airportFactors.map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.airport_code} - {airport.airport_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="flights" className="text-sm font-medium">
                Número de Voos <span className="bg-ghg-required text-white px-1 rounded text-xs">OBRIGATÓRIO</span>
              </Label>
              <Input
                id="flights"
                type="number"
                value={flights}
                onChange={(e) => setFlights(e.target.value)}
                className="bg-ghg-required/10"
                placeholder="Ex: 24"
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Combustão Móvel - {source.name}
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
                <strong>GHG Protocol Brasil 2025.0.1:</strong> Combustão móvel inclui todas as emissões de veículos próprios ou controlados pela organização. Emissões de transporte terceirizado devem ser reportadas no Escopo 3.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transportation Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Categoria de Transporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={mobileCategory} onValueChange={setMobileCategory}>
                    {MOBILE_CATEGORIES.map((category) => (
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

              {/* Calculation Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Método de Cálculo</CardTitle>
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
                        <p className="text-sm text-muted-foreground ml-6">{method.description}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Method-specific form */}
              {calculationMethod && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">3. Dados Específicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCalculationForm()}
                  </CardContent>
                </Card>
              )}

              {/* Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">4. Período dos Dados</CardTitle>
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