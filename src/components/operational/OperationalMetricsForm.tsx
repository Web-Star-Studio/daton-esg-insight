import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { saveOperationalMetric, type OperationalMetric } from "@/services/operationalMetrics";

interface OperationalMetricsFormProps {
  companyId: string;
  year: number;
  onSaved?: () => void;
}

export function OperationalMetricsForm({ companyId, year, onSaved }: OperationalMetricsFormProps) {
  const [formData, setFormData] = useState<Partial<OperationalMetric>>({
    company_id: companyId,
    year,
    period_start_date: `${year}-01-01`,
    period_end_date: `${year}-12-31`,
    production_unit: 'toneladas'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveOperationalMetric(formData as OperationalMetric);
      toast.success('Dados operacionais salvos com sucesso!');
      onSaved?.();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados operacionais');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          <CardTitle>Dados de Produção/Operação ({year})</CardTitle>
        </div>
        <CardDescription>
          Informe os dados de produção ou operação para calcular a intensidade energética
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SEÇÃO: Produção */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Produção</Badge>
            <span className="text-sm text-muted-foreground">
              Quantidade de produtos/serviços no período
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label>Volume de Produção</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.production_volume || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  production_volume: parseFloat(e.target.value) || undefined
                })}
                placeholder="Ex: 1500"
              />
            </div>
            
            <div className="md:col-span-1">
              <Label>Unidade</Label>
              <Select
                value={formData.production_unit}
                onValueChange={(value) => setFormData({ ...formData, production_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toneladas">Toneladas (t)</SelectItem>
                  <SelectItem value="unidades">Unidades</SelectItem>
                  <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                  <SelectItem value="litros">Litros (L)</SelectItem>
                  <SelectItem value="m3">Metros Cúbicos (m³)</SelectItem>
                  <SelectItem value="km">Quilômetros (km)</SelectItem>
                  <SelectItem value="horas">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1">
              <Label>Tipo de Produto/Serviço</Label>
              <Input
                value={formData.production_type || ''}
                onChange={(e) => setFormData({ ...formData, production_type: e.target.value })}
                placeholder="Ex: Produto A"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO: Métricas Operacionais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Operação</Badge>
            <span className="text-sm text-muted-foreground">
              Dados operacionais complementares
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Distância Percorrida (km)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.distance_traveled_km || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  distance_traveled_km: parseFloat(e.target.value) || undefined
                })}
                placeholder="Para transportadoras"
              />
            </div>
            
            <div>
              <Label>Horas de Operação</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.operational_hours || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  operational_hours: parseFloat(e.target.value) || undefined
                })}
              />
            </div>
            
            <div>
              <Label>Área Operacional (m²)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.operational_area_m2 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  operational_area_m2: parseFloat(e.target.value) || undefined
                })}
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO: Receita */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Financeiro</Badge>
            <span className="text-sm text-muted-foreground">
              Dados financeiros (opcional)
            </span>
          </div>
          
          <div>
            <Label>Receita Bruta (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.revenue_brl || ''}
              onChange={(e) => setFormData({
                ...formData,
                revenue_brl: parseFloat(e.target.value) || undefined
              })}
              placeholder="Ex: 2500000.00"
            />
          </div>
        </div>

        {/* SEÇÃO: Observações */}
        <div>
          <Label>Observações</Label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais sobre os dados..."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Dados de Produção'}
        </Button>
      </CardContent>
    </Card>
  );
}
