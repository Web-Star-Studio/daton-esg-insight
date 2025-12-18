/**
 * ScoringConfigPanel - Painel de configuração de pontuação
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScoringConfig } from "@/services/audit/scoring";
import { Settings, Save } from "lucide-react";

interface ScoringConfigPanelProps {
  config: ScoringConfig | null;
  onSave: (config: Partial<ScoringConfig>) => void;
  isSaving?: boolean;
}

export function ScoringConfigPanel({ config, onSave, isSaving }: ScoringConfigPanelProps) {
  const [formData, setFormData] = useState({
    scoring_method: config?.scoring_method || 'weighted',
    nc_major_penalty: config?.nc_major_penalty || 10,
    nc_minor_penalty: config?.nc_minor_penalty || 5,
    observation_penalty: config?.observation_penalty || 2,
    opportunity_bonus: config?.opportunity_bonus || 1,
    include_na_in_total: config?.include_na_in_total || false,
    max_score: config?.max_score || 100,
    passing_score: config?.passing_score || 70,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        scoring_method: config.scoring_method,
        nc_major_penalty: config.nc_major_penalty,
        nc_minor_penalty: config.nc_minor_penalty,
        observation_penalty: config.observation_penalty,
        opportunity_bonus: config.opportunity_bonus,
        include_na_in_total: config.include_na_in_total,
        max_score: config.max_score,
        passing_score: config.passing_score,
      });
    }
  }, [config]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Método de cálculo */}
        <div className="space-y-2">
          <Label>Método de Cálculo</Label>
          <Select 
            value={formData.scoring_method} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, scoring_method: v as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weighted">Ponderado (por peso das respostas)</SelectItem>
              <SelectItem value="simple">Simples (contagem de conformidades)</SelectItem>
              <SelectItem value="percentage">Percentual (% de conformidade)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Penalidades */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Penalidades por Ocorrência</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">NC Maior (pts)</Label>
              <Input
                type="number"
                value={formData.nc_major_penalty}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  nc_major_penalty: Number(e.target.value) 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">NC Menor (pts)</Label>
              <Input
                type="number"
                value={formData.nc_minor_penalty}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  nc_minor_penalty: Number(e.target.value) 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Observação (pts)</Label>
              <Input
                type="number"
                value={formData.observation_penalty}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  observation_penalty: Number(e.target.value) 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Oportunidade - Bônus (pts)</Label>
              <Input
                type="number"
                value={formData.opportunity_bonus}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  opportunity_bonus: Number(e.target.value) 
                }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Configurações gerais */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Configurações Gerais</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Pontuação Máxima</Label>
              <Input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_score: Number(e.target.value) 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Nota de Aprovação (%)</Label>
              <Input
                type="number"
                value={formData.passing_score}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  passing_score: Number(e.target.value) 
                }))}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Incluir N/A no total</div>
              <div className="text-sm text-muted-foreground">
                Considerar itens não aplicáveis no cálculo total
              </div>
            </div>
            <Switch
              checked={formData.include_na_in_total}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                include_na_in_total: checked 
              }))}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
