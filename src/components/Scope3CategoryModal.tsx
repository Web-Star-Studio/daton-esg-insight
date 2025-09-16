import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Info, Calculator, Truck, Plane, Ship, Building2, Factory, Users, Home, Recycle, TreePine } from "lucide-react";
import { toast } from "sonner";
import { SCOPE_3_CATEGORIES, createTransportDistribution, createLandUseChange, createWastewaterTreatment } from "@/services/scope3Categories";

interface Scope3CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categoryIcons: Record<number, any> = {
  1: Building2, 2: Factory, 3: Calculator, 4: Truck, 5: Recycle,
  6: Plane, 7: Users, 8: Building2, 9: Ship, 10: Factory,
  11: Users, 12: Recycle, 13: Home, 14: Building2, 15: Calculator
};

export function Scope3CategoryModal({ isOpen, onClose, onSuccess }: Scope3CategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Transport & Distribution (Categories 4 and 9)
  const [transportData, setTransportData] = useState({
    direction: 'upstream' as 'upstream' | 'downstream',
    transport_mode: '',
    distance_km: 0,
    weight_tonnes: 0,
    fuel_type: '',
    fuel_consumption: 0
  });

  // Wastewater Treatment (Category 5)
  const [wastewaterData, setWastewaterData] = useState({
    treatment_type: '',
    organic_load_bod: 0,
    nitrogen_content: 0,
    volume_treated: 0,
    temperature: 20,
    sludge_removed: false,
    methane_recovered: false,
    discharge_pathway: ''
  });

  // Land Use Change (Category 15)
  const [landUseData, setLandUseData] = useState({
    area_hectares: 0,
    previous_use: '',
    current_use: '',
    vegetation_type: '',
    carbon_stock_before: 0,
    carbon_stock_after: 0,
    change_year: new Date().getFullYear(),
    location_state: '',
    climate_zone: ''
  });

  // Generic activity data for other categories
  const [activityData, setActivityData] = useState({
    quantity: 0,
    unit: '',
    emission_factor: 0,
    description: ''
  });

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error("Selecione uma categoria do Escopo 3");
      return;
    }

    setIsSubmitting(true);

    try {
      // Transport & Distribution (Categories 4 and 9)
      if (selectedCategory === 4 || selectedCategory === 9) {
        const direction = selectedCategory === 4 ? 'upstream' : 'downstream';
        await createTransportDistribution({
          ...transportData,
          direction
        });
        toast.success(`Dados de transporte ${direction === 'upstream' ? 'upstream' : 'downstream'} registrados`);
      }
      // Waste Generated in Operations (Category 5) - includes wastewater
      else if (selectedCategory === 5) {
        await createWastewaterTreatment(wastewaterData);
        toast.success("Dados de tratamento de efluentes registrados");
      }
      // Land Use Change (Category 15)
      else if (selectedCategory === 15) {
        await createLandUseChange(landUseData);
        toast.success("Mudança no uso do solo registrada");
      }
      // Generic categories - would need specific implementation
      else {
        toast.info(`Categoria ${selectedCategory} será implementada em versão futura`);
      }

      onSuccess?.();
      onClose();
      resetForms();
    } catch (error) {
      console.error('Erro ao registrar dados:', error);
      toast.error("Erro ao registrar dados do Escopo 3");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setSelectedCategory(null);
    setTransportData({
      direction: 'upstream',
      transport_mode: '',
      distance_km: 0,
      weight_tonnes: 0,
      fuel_type: '',
      fuel_consumption: 0
    });
    setWastewaterData({
      treatment_type: '',
      organic_load_bod: 0,
      nitrogen_content: 0,
      volume_treated: 0,
      temperature: 20,
      sludge_removed: false,
      methane_recovered: false,
      discharge_pathway: ''
    });
    setLandUseData({
      area_hectares: 0,
      previous_use: '',
      current_use: '',
      vegetation_type: '',
      carbon_stock_before: 0,
      carbon_stock_after: 0,
      change_year: new Date().getFullYear(),
      location_state: '',
      climate_zone: ''
    });
    setActivityData({
      quantity: 0,
      unit: '',
      emission_factor: 0,
      description: ''
    });
  };

  const renderTransportForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Modo de Transporte</Label>
          <Select value={transportData.transport_mode} onValueChange={(value) => setTransportData({...transportData, transport_mode: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rodoviario">Rodoviário</SelectItem>
              <SelectItem value="ferroviario">Ferroviário</SelectItem>
              <SelectItem value="aereo">Aéreo</SelectItem>
              <SelectItem value="maritimo">Marítimo</SelectItem>
              <SelectItem value="fluvial">Fluvial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Combustível</Label>
          <Select value={transportData.fuel_type} onValueChange={(value) => setTransportData({...transportData, fuel_type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="gasolina">Gasolina</SelectItem>
              <SelectItem value="etanol">Etanol</SelectItem>
              <SelectItem value="gnv">GNV</SelectItem>
              <SelectItem value="aviacao">Combustível de Aviação</SelectItem>
              <SelectItem value="bunker">Óleo Bunker</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Distância (km)</Label>
          <Input
            type="number"
            value={transportData.distance_km}
            onChange={(e) => setTransportData({...transportData, distance_km: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label>Peso Transportado (t)</Label>
          <Input
            type="number"
            value={transportData.weight_tonnes}
            onChange={(e) => setTransportData({...transportData, weight_tonnes: Number(e.target.value)})}
          />
        </div>
      </div>
      <div>
        <Label>Consumo de Combustível (L ou kg)</Label>
        <Input
          type="number"
          value={transportData.fuel_consumption}
          onChange={(e) => setTransportData({...transportData, fuel_consumption: Number(e.target.value)})}
        />
      </div>
    </div>
  );

  const renderWastewaterForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Tratamento</Label>
          <Select value={wastewaterData.treatment_type} onValueChange={(value) => setWastewaterData({...wastewaterData, treatment_type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anaerobico">Anaeróbico</SelectItem>
              <SelectItem value="aerobico">Aeróbico</SelectItem>
              <SelectItem value="lodo_ativado">Lodo Ativado</SelectItem>
              <SelectItem value="lagoa_anaerobica">Lagoa Anaeróbica</SelectItem>
              <SelectItem value="lagoa_facultativa">Lagoa Facultativa</SelectItem>
              <SelectItem value="reator_uasb">Reator UASB</SelectItem>
              <SelectItem value="fossa_septica">Fossa Séptica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Volume Tratado (m³/ano)</Label>
          <Input
            type="number"
            value={wastewaterData.volume_treated}
            onChange={(e) => setWastewaterData({...wastewaterData, volume_treated: Number(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Carga Orgânica (kg DBO/ano)</Label>
          <Input
            type="number"
            value={wastewaterData.organic_load_bod}
            onChange={(e) => setWastewaterData({...wastewaterData, organic_load_bod: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label>Teor de Nitrogênio (kg N/ano)</Label>
          <Input
            type="number"
            value={wastewaterData.nitrogen_content}
            onChange={(e) => setWastewaterData({...wastewaterData, nitrogen_content: Number(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Temperatura (°C)</Label>
          <Input
            type="number"
            value={wastewaterData.temperature}
            onChange={(e) => setWastewaterData({...wastewaterData, temperature: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label>Destino do Efluente</Label>
          <Select value={wastewaterData.discharge_pathway} onValueChange={(value) => setWastewaterData({...wastewaterData, discharge_pathway: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rio">Rio/Curso d'água</SelectItem>
              <SelectItem value="mar">Mar</SelectItem>
              <SelectItem value="solo">Solo</SelectItem>
              <SelectItem value="rede_publica">Rede Pública</SelectItem>
              <SelectItem value="reuso">Reúso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={wastewaterData.sludge_removed}
            onCheckedChange={(checked) => setWastewaterData({...wastewaterData, sludge_removed: checked})}
          />
          <Label>Remoção de lodo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={wastewaterData.methane_recovered}
            onCheckedChange={(checked) => setWastewaterData({...wastewaterData, methane_recovered: checked})}
          />
          <Label>Recuperação de metano</Label>
        </div>
      </div>
    </div>
  );

  const renderLandUseForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Área (hectares)</Label>
          <Input
            type="number"
            value={landUseData.area_hectares}
            onChange={(e) => setLandUseData({...landUseData, area_hectares: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label>Ano da Mudança</Label>
          <Input
            type="number"
            value={landUseData.change_year}
            onChange={(e) => setLandUseData({...landUseData, change_year: Number(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Uso Anterior</Label>
          <Select value={landUseData.previous_use} onValueChange={(value) => setLandUseData({...landUseData, previous_use: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o uso anterior" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floresta_primaria">Floresta Primária</SelectItem>
              <SelectItem value="floresta_secundaria">Floresta Secundária</SelectItem>
              <SelectItem value="pastagem">Pastagem</SelectItem>
              <SelectItem value="agricultura_anual">Agricultura Anual</SelectItem>
              <SelectItem value="agricultura_perene">Agricultura Perene</SelectItem>
              <SelectItem value="urbano">Área Urbana</SelectItem>
              <SelectItem value="agua">Corpo d'água</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Uso Atual</Label>
          <Select value={landUseData.current_use} onValueChange={(value) => setLandUseData({...landUseData, current_use: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o uso atual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floresta_primaria">Floresta Primária</SelectItem>
              <SelectItem value="floresta_secundaria">Floresta Secundária</SelectItem>
              <SelectItem value="pastagem">Pastagem</SelectItem>
              <SelectItem value="agricultura_anual">Agricultura Anual</SelectItem>
              <SelectItem value="agricultura_perene">Agricultura Perene</SelectItem>
              <SelectItem value="urbano">Área Urbana</SelectItem>
              <SelectItem value="agua">Corpo d'água</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Estado/UF</Label>
          <Input
            value={landUseData.location_state}
            onChange={(e) => setLandUseData({...landUseData, location_state: e.target.value})}
            placeholder="Ex: SP, RJ, MG"
          />
        </div>
        <div>
          <Label>Zona Climática</Label>
          <Select value={landUseData.climate_zone} onValueChange={(value) => setLandUseData({...landUseData, climate_zone: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tropical">Tropical</SelectItem>
              <SelectItem value="subtropical">Subtropical</SelectItem>
              <SelectItem value="temperado">Temperado</SelectItem>
              <SelectItem value="semiarido">Semiárido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Estoque de Carbono Anterior (tC/ha)</Label>
          <Input
            type="number"
            value={landUseData.carbon_stock_before}
            onChange={(e) => setLandUseData({...landUseData, carbon_stock_before: Number(e.target.value)})}
            placeholder="Opcional - será estimado se vazio"
          />
        </div>
        <div>
          <Label>Estoque de Carbono Atual (tC/ha)</Label>
          <Input
            type="number"
            value={landUseData.carbon_stock_after}
            onChange={(e) => setLandUseData({...landUseData, carbon_stock_after: Number(e.target.value)})}
            placeholder="Opcional - será estimado se vazio"
          />
        </div>
      </div>
    </div>
  );

  const renderGenericForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Descrição da Atividade</Label>
        <Textarea
          value={activityData.description}
          onChange={(e) => setActivityData({...activityData, description: e.target.value})}
          placeholder="Descreva a atividade do Escopo 3"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Quantidade</Label>
          <Input
            type="number"
            value={activityData.quantity}
            onChange={(e) => setActivityData({...activityData, quantity: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label>Unidade</Label>
          <Input
            value={activityData.unit}
            onChange={(e) => setActivityData({...activityData, unit: e.target.value})}
            placeholder="Ex: kg, L, kWh"
          />
        </div>
        <div>
          <Label>Fator de Emissão</Label>
          <Input
            type="number"
            step="0.0001"
            value={activityData.emission_factor}
            onChange={(e) => setActivityData({...activityData, emission_factor: Number(e.target.value)})}
            placeholder="kg CO₂e por unidade"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Escopo 3 - Outras Emissões Indiretas
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="form" disabled={!selectedCategory}>Dados da Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SCOPE_3_CATEGORIES).map(([number, name]) => {
                const categoryNumber = Number(number);
                const IconComponent = categoryIcons[categoryNumber];
                const isImplemented = [4, 5, 9, 15].includes(categoryNumber);
                
                return (
                  <Card 
                    key={number}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === categoryNumber ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedCategory(categoryNumber)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={isImplemented ? "default" : "secondary"}>
                            {categoryNumber}
                          </Badge>
                        </div>
                        {isImplemented && (
                          <Badge variant="outline" className="text-xs">
                            Disponível
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-sm font-medium mb-1">{name}</CardTitle>
                      {!isImplemented && (
                        <CardDescription className="text-xs">
                          Em desenvolvimento
                        </CardDescription>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedCategory && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Categoria {selectedCategory}: {SCOPE_3_CATEGORIES[selectedCategory]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory === 4 && "Emissões de transporte e distribuição de produtos, materiais e serviços adquiridos pela empresa, desde o fornecedor até as instalações da empresa."}
                    {selectedCategory === 5 && "Emissões do tratamento e disposição de resíduos gerados nas operações da empresa, incluindo efluentes líquidos."}
                    {selectedCategory === 9 && "Emissões de transporte e distribuição de produtos vendidos pela empresa, desde suas instalações até o consumidor final."}
                    {selectedCategory === 15 && "Emissões associadas a investimentos em empresas ou projetos, incluindo mudanças no uso do solo para fins de investimento."}
                    {![4, 5, 9, 15].includes(selectedCategory) && "Esta categoria será implementada em versão futura do sistema."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            {selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Categoria {selectedCategory}: {SCOPE_3_CATEGORIES[selectedCategory]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(selectedCategory === 4 || selectedCategory === 9) && renderTransportForm()}
                  {selectedCategory === 5 && renderWastewaterForm()}
                  {selectedCategory === 15 && renderLandUseForm()}
                  {![4, 5, 9, 15].includes(selectedCategory) && renderGenericForm()}

                  <Separator className="my-6" />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? "Registrando..." : "Registrar Dados"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}