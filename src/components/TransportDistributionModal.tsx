import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createTransportDistribution, TransportDistributionData } from "@/services/scope3Categories";
import { Truck, Ship, Plane, Train } from "lucide-react";

interface TransportDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransportDistributionModal({ isOpen, onClose, onSuccess }: TransportDistributionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TransportDistributionData>({
    direction: 'upstream',
    transport_mode: "",
    distance_km: undefined,
    weight_tonnes: undefined,
    fuel_type: "",
    fuel_consumption: undefined
  });

  const transportModes = [
    { value: "rodoviario", label: "Rodoviário", icon: Truck },
    { value: "ferroviario", label: "Ferroviário", icon: Train },
    { value: "hidroviario", label: "Hidroviário", icon: Ship },
    { value: "aereo", label: "Aéreo", icon: Plane }
  ];

  const fuelTypes = [
    "Diesel",
    "Gasolina", 
    "Etanol",
    "Gás Natural",
    "Querosene de Aviação",
    "Óleo Combustível",
    "Eletricidade"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createTransportDistribution(formData);

      toast({
        title: "Sucesso",
        description: `Transporte ${formData.direction === 'upstream' ? 'upstream' : 'downstream'} registrado com sucesso!`,
      });

      setFormData({
        direction: 'upstream',
        transport_mode: "",
        distance_km: undefined,
        weight_tonnes: undefined,
        fuel_type: "",
        fuel_consumption: undefined
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar transporte e distribuição:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transporte e distribuição",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectionInfo = (direction: 'upstream' | 'downstream') => {
    if (direction === 'upstream') {
      return {
        title: "Transporte e Distribuição Upstream (Categoria 4)",
        description: "Transporte de materias-primas, produtos intermediários e outros bens adquiridos até suas instalações"
      };
    } else {
      return {
        title: "Transporte e Distribuição Downstream (Categoria 9)", 
        description: "Transporte de produtos vendidos desde suas instalações até o cliente final"
      };
    }
  };

  const directionInfo = getDirectionInfo(formData.direction);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {directionInfo.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">ℹ️ Escopo desta Categoria</h4>
            <p className="text-sm text-muted-foreground">
              {directionInfo.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Direção do Transporte</Label>
              <Select
                value={formData.direction}
                onValueChange={(value: 'upstream' | 'downstream') => setFormData(prev => ({ ...prev, direction: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upstream">
                    Upstream - Recebimento (Categoria 4)
                  </SelectItem>
                  <SelectItem value="downstream">
                    Downstream - Distribuição (Categoria 9)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Modal de Transporte</Label>
              <Select
                value={formData.transport_mode}
                onValueChange={(value) => setFormData(prev => ({ ...prev, transport_mode: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modal" />
                </SelectTrigger>
                <SelectContent>
                  {transportModes.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {mode.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fuel_type">Tipo de Combustível</Label>
              <Select
                value={formData.fuel_type || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fuel_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecionar combustível</SelectItem>
                  {fuelTypes.map(fuel => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="distance_km">Distância Total (km)</Label>
              <Input
                id="distance_km"
                type="number"
                step="0.1"
                value={formData.distance_km || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, distance_km: parseFloat(e.target.value) || undefined }))}
                placeholder="Distância média das rotas"
              />
            </div>

            <div>
              <Label htmlFor="weight_tonnes">Peso Transportado (toneladas)</Label>
              <Input
                id="weight_tonnes"
                type="number"
                step="0.01"
                value={formData.weight_tonnes || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_tonnes: parseFloat(e.target.value) || undefined }))}
                placeholder="Peso médio das cargas"
              />
            </div>

            <div>
              <Label htmlFor="fuel_consumption">Consumo de Combustível</Label>
              <Input
                id="fuel_consumption"
                type="number"
                step="0.01"
                value={formData.fuel_consumption || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, fuel_consumption: parseFloat(e.target.value) || undefined }))}
                placeholder="L/100km ou L/tonelada"
              />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Métodos de Cálculo Disponíveis</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Método 1 - Consumo de Combustível:</strong> Emissões = Consumo × Fator de Emissão</p>
              <p><strong>Método 2 - Distância e Peso:</strong> Emissões = Distância × Peso × Fator por t.km</p>
              <p><strong>Método 3 - Gastos:</strong> Emissões = Gastos × Fator Econômico (implementação futura)</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ Importante</h4>
            <div className="text-sm text-muted-foreground">
              <p><strong>Upstream:</strong> Inclui apenas transporte até suas instalações (não sob seu controle direto)</p>
              <p><strong>Downstream:</strong> Inclui transporte de produtos vendidos até o cliente final</p>
              <p><strong>Não incluir:</strong> Transporte próprio (já contabilizado no Escopo 1)</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Transporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}