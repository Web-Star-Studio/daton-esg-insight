import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Save } from "lucide-react";
import { toast } from "sonner";
import { saveEnergyConsumptionRecord } from "@/services/energyManagement";

interface EnergyConsumptionFormProps {
  year: number;
  onSaved?: () => void;
}

export function EnergyConsumptionForm({ year, onSaved }: EnergyConsumptionFormProps) {
  const [formData, setFormData] = useState({
    energy_source_type: 'Rede Elétrica',
    energy_source_name: '',
    period_start_date: `${year}-01-01`,
    period_end_date: `${year}-12-31`,
    consumption_value: 0,
    consumption_unit: 'kWh',
    is_renewable: false,
    is_from_grid: true,
    is_self_generated: false,
    cost_brl: 0,
    production_volume: 0,
    production_unit: '',
    revenue_brl: 0,
    notes: '',
    data_source: 'Manual',
    data_quality_score: 80
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.consumption_value || formData.consumption_value <= 0) {
      toast.error("Consumo deve ser maior que zero");
      return;
    }

    setIsSaving(true);
    try {
      await saveEnergyConsumptionRecord({
        ...formData,
        year
      });
      
      toast.success("Registro de energia salvo com sucesso!");
      
      // Reset form
      setFormData({
        ...formData,
        consumption_value: 0,
        cost_brl: 0,
        notes: ''
      });
      
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      toast.error(error.message || "Erro ao salvar registro de energia");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-600" />
          <div>
            <CardTitle>Registrar Consumo de Energia</CardTitle>
            <CardDescription>GRI 302-1: Consumo de energia dentro da organização</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Fonte de Energia *</Label>
            <Select
              value={formData.energy_source_type}
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  energy_source_type: value,
                  is_renewable: ['Solar', 'Eólica', 'Biomassa', 'Hidrelétrica'].includes(value),
                  is_from_grid: ['Rede Elétrica'].includes(value),
                  is_self_generated: ['Solar', 'Eólica', 'Biomassa'].includes(value),
                  consumption_unit: ['Diesel', 'Gasolina', 'Biodiesel', 'Etanol'].includes(value) ? 'litros' : 
                                   ['GLP', 'Biomassa'].includes(value) ? 'kg' : 
                                   ['Gás Natural'].includes(value) ? 'm3' : 'kWh'
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rede Elétrica">Rede Elétrica</SelectItem>
                <SelectItem value="Solar">Solar (Fotovoltaica)</SelectItem>
                <SelectItem value="Eólica">Eólica</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Gasolina">Gasolina</SelectItem>
                <SelectItem value="Biodiesel">Biodiesel</SelectItem>
                <SelectItem value="Etanol">Etanol</SelectItem>
                <SelectItem value="GLP">GLP (Gás Liquefeito de Petróleo)</SelectItem>
                <SelectItem value="Gás Natural">Gás Natural</SelectItem>
                <SelectItem value="Biomassa">Biomassa</SelectItem>
                <SelectItem value="Hidrelétrica">Hidrelétrica</SelectItem>
                <SelectItem value="Outra">Outra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome da Fonte (opcional)</Label>
            <Input
              value={formData.energy_source_name}
              onChange={(e) => setFormData({ ...formData, energy_source_name: e.target.value })}
              placeholder="Ex: Painel Solar Prédio A, Gerador Diesel"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Início *</Label>
            <Input
              type="date"
              value={formData.period_start_date}
              onChange={(e) => setFormData({ ...formData, period_start_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Fim *</Label>
            <Input
              type="date"
              value={formData.period_end_date}
              onChange={(e) => setFormData({ ...formData, period_end_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Consumo *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.consumption_value}
              onChange={(e) => setFormData({ ...formData, consumption_value: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select
              value={formData.consumption_unit}
              onValueChange={(value) => setFormData({ ...formData, consumption_unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kWh">kWh (Kilowatt-hora)</SelectItem>
                <SelectItem value="MWh">MWh (Megawatt-hora)</SelectItem>
                <SelectItem value="GJ">GJ (Gigajoules)</SelectItem>
                <SelectItem value="litros">Litros</SelectItem>
                <SelectItem value="kg">kg (Quilogramas)</SelectItem>
                <SelectItem value="m3">m³ (Metros cúbicos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.cost_brl}
              onChange={(e) => setFormData({ ...formData, cost_brl: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Qualidade dos Dados (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.data_quality_score}
              onChange={(e) => setFormData({ ...formData, data_quality_score: parseInt(e.target.value) || 80 })}
            />
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_renewable"
              checked={formData.is_renewable}
              onCheckedChange={(checked) => setFormData({ ...formData, is_renewable: checked as boolean })}
            />
            <Label htmlFor="is_renewable" className="cursor-pointer">Energia Renovável</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_from_grid"
              checked={formData.is_from_grid}
              onCheckedChange={(checked) => setFormData({ ...formData, is_from_grid: checked as boolean })}
            />
            <Label htmlFor="is_from_grid" className="cursor-pointer">Da Rede Elétrica</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_self_generated"
              checked={formData.is_self_generated}
              onCheckedChange={(checked) => setFormData({ ...formData, is_self_generated: checked as boolean })}
            />
            <Label htmlFor="is_self_generated" className="cursor-pointer">Autogeração</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais sobre o consumo"
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Registro"}
        </Button>
      </CardContent>
    </Card>
  );
}
