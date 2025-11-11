import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Droplets, Save } from "lucide-react";
import { toast } from "sonner";
import { saveWaterConsumptionRecord } from "@/services/waterManagement";

interface WaterConsumptionFormProps {
  year: number;
  onSaved?: () => void;
}

export function WaterConsumptionForm({ year, onSaved }: WaterConsumptionFormProps) {
  const [formData, setFormData] = useState({
    source_type: 'Terceiros - Rede Pública',
    source_name: '',
    period_start_date: `${year}-01-01`,
    period_end_date: `${year}-12-31`,
    withdrawal_volume_m3: 0,
    consumption_volume_m3: 0,
    discharge_volume_m3: 0,
    water_quality: 'Potável',
    is_water_stressed_area: false,
    measurement_method: 'Hidrômetro',
    data_source: 'Conta de Água',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (formData.withdrawal_volume_m3 <= 0) {
      toast.error('Informe o volume de água retirada');
      return;
    }
    
    setSaving(true);
    try {
      await saveWaterConsumptionRecord(formData);
      toast.success('Dados de água salvos com sucesso!');
      
      setFormData({
        ...formData,
        source_name: '',
        withdrawal_volume_m3: 0,
        consumption_volume_m3: 0,
        discharge_volume_m3: 0,
        notes: ''
      });
      
      onSaved?.();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados de água');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600" />
          <CardTitle>Registrar Consumo de Água ({year})</CardTitle>
        </div>
        <CardDescription>
          Informe os dados de captação e consumo de água por fonte (GRI 303-3, 303-5)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Fonte de Água</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Fonte *</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) => setFormData({ ...formData, source_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Terceiros - Rede Pública">Rede Pública (Concessionária)</SelectItem>
                  <SelectItem value="Subterrânea - Poço Artesiano">Poço Artesiano</SelectItem>
                  <SelectItem value="Subterrânea - Poço Cacimba">Poço Cacimba/Raso</SelectItem>
                  <SelectItem value="Superficial - Rio/Lago">Rio ou Lago</SelectItem>
                  <SelectItem value="Superficial - Reservatório">Reservatório/Açude</SelectItem>
                  <SelectItem value="Água de Chuva">Água de Chuva</SelectItem>
                  <SelectItem value="Água de Reuso/Reciclada">Água de Reuso</SelectItem>
                  <SelectItem value="Terceiros - Caminhão Pipa">Caminhão Pipa</SelectItem>
                  <SelectItem value="Outras Fontes">Outras Fontes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nome/Identificação da Fonte</Label>
              <Input
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                placeholder="Ex: Poço 01, Rio Tietê, Conta 123456"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Inicial *</Label>
              <Input
                type="date"
                value={formData.period_start_date}
                onChange={(e) => setFormData({ ...formData, period_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Data Final *</Label>
              <Input
                type="date"
                value={formData.period_end_date}
                onChange={(e) => setFormData({ ...formData, period_end_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Volumes de Água (m³)</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Volume Retirado (m³) *</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.withdrawal_volume_m3}
                onChange={(e) => setFormData({
                  ...formData,
                  withdrawal_volume_m3: parseFloat(e.target.value) || 0
                })}
                placeholder="Ex: 1500.250"
              />
              <p className="text-xs text-muted-foreground mt-1">GRI 303-3</p>
            </div>
            
            <div>
              <Label>Volume Consumido (m³)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.consumption_volume_m3}
                onChange={(e) => setFormData({
                  ...formData,
                  consumption_volume_m3: parseFloat(e.target.value) || 0
                })}
                placeholder="Deixe vazio para assumir 100%"
              />
              <p className="text-xs text-muted-foreground mt-1">GRI 303-5</p>
            </div>
            
            <div>
              <Label>Volume Devolvido (m³)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.discharge_volume_m3}
                onChange={(e) => setFormData({
                  ...formData,
                  discharge_volume_m3: parseFloat(e.target.value) || 0
                })}
                placeholder="Ex: 200.000"
              />
              <p className="text-xs text-muted-foreground mt-1">GRI 303-4</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Características</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Qualidade da Água</Label>
              <Select
                value={formData.water_quality}
                onValueChange={(value) => setFormData({ ...formData, water_quality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Potável">Potável</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Água Doce (≤1.000 mg/L TDS)">Água Doce (≤1.000 mg/L TDS)</SelectItem>
                  <SelectItem value="Água Salobra (>1.000 mg/L TDS)">Água Salobra</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Método de Medição</Label>
              <Select
                value={formData.measurement_method}
                onValueChange={(value) => setFormData({ ...formData, measurement_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hidrômetro">Hidrômetro</SelectItem>
                  <SelectItem value="Medidor de Vazão">Medidor de Vazão</SelectItem>
                  <SelectItem value="Fatura">Fatura de Concessionária</SelectItem>
                  <SelectItem value="Estimativa">Estimativa</SelectItem>
                  <SelectItem value="Sistema de Monitoramento">Sistema de Monitoramento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="water_stressed"
              checked={formData.is_water_stressed_area}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_water_stressed_area: checked as boolean })
              }
            />
            <label
              htmlFor="water_stressed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Área com estresse hídrico (GRI 303-3-a-ii)
            </label>
          </div>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais sobre a fonte ou medição..."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Registro de Água'}
        </Button>
      </CardContent>
    </Card>
  );
}
