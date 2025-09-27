import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createLandUseChange, LandUseChangeData } from "@/services/scope3Categories";
import { Leaf, TreePine, MapPin } from "lucide-react";

interface LandUseChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LandUseChangeModal({ isOpen, onClose, onSuccess }: LandUseChangeModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LandUseChangeData>({
    area_hectares: 0,
    previous_use: "",
    current_use: "",
    vegetation_type: "",
    carbon_stock_before: undefined,
    carbon_stock_after: undefined,
    change_year: new Date().getFullYear(),
    location_state: "",
    climate_zone: "tropical"
  });

  const landUseTypes = [
    "floresta_primaria",
    "floresta_secundaria", 
    "pastagem",
    "agricultura_anual",
    "agricultura_perene",
    "urbano",
    "agua"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createLandUseChange(formData);

      toast({
        title: "Sucesso",
        description: "Mudança no uso do solo registrada com sucesso!",
      });

      setFormData({
        area_hectares: 0,
        previous_use: "",
        current_use: "",
        vegetation_type: "",
        carbon_stock_before: undefined,
        carbon_stock_after: undefined,
        change_year: new Date().getFullYear(),
        location_state: "",
        climate_zone: "tropical"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar mudança no uso do solo:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar mudança no uso do solo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Mudança no Uso do Solo (Escopo 1)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area_hectares">Área (hectares)</Label>
              <Input
                id="area_hectares"
                type="number"
                step="0.01"
                value={formData.area_hectares || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, area_hectares: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="change_year">Ano da Mudança</Label>
              <Input
                id="change_year"
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                value={formData.change_year}
                onChange={(e) => setFormData(prev => ({ ...prev, change_year: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="previous_use">Uso Anterior do Solo</Label>
              <Select
                value={formData.previous_use}
                onValueChange={(value) => setFormData(prev => ({ ...prev, previous_use: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o uso anterior" />
                </SelectTrigger>
                <SelectContent>
                  {landUseTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="current_use">Uso Atual do Solo</Label>
              <Select
                value={formData.current_use}
                onValueChange={(value) => setFormData(prev => ({ ...prev, current_use: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o uso atual" />
                </SelectTrigger>
                <SelectContent>
                  {landUseTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vegetation_type">Tipo de Vegetação</Label>
              <Select
                value={formData.vegetation_type || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vegetation_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecionar tipo</SelectItem>
                  <SelectItem value="primaria">Vegetação Primária</SelectItem>
                  <SelectItem value="secundaria">Vegetação Secundária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location_state">Estado/Região</Label>
              <Input
                id="location_state"
                value={formData.location_state || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, location_state: e.target.value }))}
                placeholder="Ex: São Paulo"
              />
            </div>

            <div>
              <Label htmlFor="climate_zone">Zona Climática</Label>
              <Select
                value={formData.climate_zone || "tropical"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, climate_zone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tropical">Tropical</SelectItem>
                  <SelectItem value="temperado">Temperado</SelectItem>
                  <SelectItem value="arido">Árido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Estoque de Carbono (Opcional - Tier 2)
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Se você tem dados específicos de estoque de carbono, pode informá-los aqui. 
              Caso contrário, serão utilizados valores padrão do IPCC.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carbon_stock_before">Estoque Anterior (tC/ha)</Label>
                <Input
                  id="carbon_stock_before"
                  type="number"
                  step="0.1"
                  value={formData.carbon_stock_before || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbon_stock_before: parseFloat(e.target.value) || undefined }))}
                  placeholder="Valor padrão será usado"
                />
              </div>
              <div>
                <Label htmlFor="carbon_stock_after">Estoque Atual (tC/ha)</Label>
                <Input
                  id="carbon_stock_after"
                  type="number"
                  step="0.1"
                  value={formData.carbon_stock_after || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbon_stock_after: parseFloat(e.target.value) || undefined }))}
                  placeholder="Valor padrão será usado"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Metodologia de Cálculo</h4>
            <p className="text-sm text-muted-foreground">
              As emissões serão calculadas usando a metodologia IPCC Tier 1, considerando:
              <br />• Diferença no estoque de carbono entre usos do solo
              <br />• Fatores de conversão C → CO₂ (3,67)
              <br />• Fatores padrão brasileiros por tipo de uso
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Mudança"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}