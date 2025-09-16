import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createWastewaterTreatment, WastewaterTreatmentData } from "@/services/scope3Categories";
import { Droplets, Factory } from "lucide-react";

interface WastewaterTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WastewaterTreatmentModal({ isOpen, onClose, onSuccess }: WastewaterTreatmentModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WastewaterTreatmentData>({
    treatment_type: "",
    organic_load_bod: undefined,
    nitrogen_content: undefined,
    volume_treated: 0,
    temperature: undefined,
    sludge_removed: false,
    methane_recovered: false,
    discharge_pathway: ""
  });

  const treatmentTypes = [
    { value: "anaerobico", label: "Tratamento Anaeróbico" },
    { value: "aerobico", label: "Tratamento Aeróbico" },
    { value: "lodo_ativado", label: "Lodo Ativado" },
    { value: "lagoa_anaerobica", label: "Lagoa Anaeróbica" },
    { value: "lagoa_facultativa", label: "Lagoa Facultativa" },
    { value: "reator_uasb", label: "Reator UASB" },
    { value: "fossa_septica", label: "Fossa Séptica" }
  ];

  const dischargePathways = [
    "Rio ou corpo d'água",
    "Mar",
    "Solo (infiltração)",
    "Sistema municipal",
    "Reutilização",
    "Evaporação"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createWastewaterTreatment(formData);

      toast({
        title: "Sucesso",
        description: "Tratamento de efluentes registrado com sucesso!",
      });

      setFormData({
        treatment_type: "",
        organic_load_bod: undefined,
        nitrogen_content: undefined,
        volume_treated: 0,
        temperature: undefined,
        sludge_removed: false,
        methane_recovered: false,
        discharge_pathway: ""
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar tratamento de efluentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar tratamento de efluentes",
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
            <Droplets className="h-5 w-5" />
            Tratamento de Efluentes (Escopo 1)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="treatment_type">Tipo de Tratamento</Label>
              <Select
                value={formData.treatment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, treatment_type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de tratamento" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="volume_treated">Volume Tratado (m³/ano)</Label>
              <Input
                id="volume_treated"
                type="number"
                step="0.01"
                value={formData.volume_treated || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, volume_treated: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="temperature">Temperatura Média (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || undefined }))}
                placeholder="Ex: 25"
              />
            </div>

            <div>
              <Label htmlFor="organic_load_bod">Carga Orgânica DBO (kg/ano)</Label>
              <Input
                id="organic_load_bod"
                type="number"
                step="0.01"
                value={formData.organic_load_bod || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, organic_load_bod: parseFloat(e.target.value) || undefined }))}
                placeholder="Demanda Bioquímica de Oxigênio"
              />
            </div>

            <div>
              <Label htmlFor="nitrogen_content">Conteúdo de Nitrogênio (kg/ano)</Label>
              <Input
                id="nitrogen_content"
                type="number"
                step="0.01"
                value={formData.nitrogen_content || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, nitrogen_content: parseFloat(e.target.value) || undefined }))}
                placeholder="Nitrogênio total"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="discharge_pathway">Destino Final do Efluente</Label>
              <Select
                value={formData.discharge_pathway || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, discharge_pathway: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {dischargePathways.map(pathway => (
                    <SelectItem key={pathway} value={pathway}>
                      {pathway}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Operações de Tratamento
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sludge_removed"
                  checked={formData.sludge_removed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sludge_removed: checked as boolean }))}
                />
                <Label htmlFor="sludge_removed">
                  Remoção de Lodo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="methane_recovered"
                  checked={formData.methane_recovered}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, methane_recovered: checked as boolean }))}
                />
                <Label htmlFor="methane_recovered">
                  Recuperação de Metano (reduz emissões em ~80%)
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Metodologia de Cálculo (IPCC 2019)</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>CH₄ (Metano):</strong> Calculado com base na carga orgânica e tipo de tratamento</p>
              <p><strong>N₂O (Óxido Nitroso):</strong> 0,005 kg N₂O/kg N (fator padrão IPCC)</p>
              <p><strong>Fatores por Tratamento:</strong></p>
              <ul className="ml-4 mt-1">
                <li>• Anaeróbico: 0,25 kg CH₄/kg DBO</li>
                <li>• Aeróbico/Lodo Ativado: 0,0 kg CH₄/kg DBO</li>
                <li>• Lagoa Anaeróbica: 0,25 kg CH₄/kg DBO</li>
                <li>• Reator UASB: 0,20 kg CH₄/kg DBO</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Tratamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}