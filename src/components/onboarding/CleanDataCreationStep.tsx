import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Leaf, 
  Shield, 
  Users, 
  BarChart3, 
  FileCheck, 
  TrendingUp, 
  Award, 
  Building,
  ArrowLeft
} from "lucide-react";

interface CleanDataCreationStepProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onConfigurationChange: (moduleId: string, config: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const MODULE_ICONS: Record<string, any> = {
  inventario_gee: Leaf,
  gestao_licencas: Shield,
  gestao_pessoas: Users,
  qualidade: Award,
  performance: TrendingUp,
  documentos: FileCheck,
  analise_dados: BarChart3,
  compliance: Building
};

const MODULE_NAMES: Record<string, string> = {
  inventario_gee: 'Inventário GEE',
  gestao_licencas: 'Licenças Ambientais',
  gestao_pessoas: 'Gestão de Pessoas',
  qualidade: 'Qualidade',
  performance: 'Performance',
  documentos: 'Documentos',
  analise_dados: 'Análise de Dados',
  compliance: 'Compliance'
};

const CONFIGURATION_OPTIONS = {
  inventario_gee: [
    { key: 'auto_calculate', label: 'Cálculo automático' },
    { key: 'import_data', label: 'Importar histórico' },
    { key: 'notifications', label: 'Notificações' }
  ],
  gestao_licencas: [
    { key: 'renewal_alerts', label: 'Alertas de renovação' },
    { key: 'compliance_check', label: 'Verificar compliance' },
    { key: 'document_scan', label: 'Scan de documentos' }
  ],
  gestao_pessoas: [
    { key: 'performance_reviews', label: 'Avaliações' },
    { key: 'training_tracking', label: 'Treinamentos' },
    { key: 'goal_setting', label: 'Metas' }
  ],
  qualidade: [
    { key: 'audit_scheduling', label: 'Auditorias' },
    { key: 'nonconformity_tracking', label: 'Não conformidades' },
    { key: 'procedure_management', label: 'Procedimentos' }
  ]
};

export function CleanDataCreationStep({ 
  selectedModules, 
  moduleConfigurations, 
  onConfigurationChange, 
  onNext, 
  onPrev 
}: CleanDataCreationStepProps) {

  const handleConfigToggle = (moduleId: string, configKey: string, enabled: boolean) => {
    const currentConfig = moduleConfigurations[moduleId] || {};
    onConfigurationChange(moduleId, {
      ...currentConfig,
      [configKey]: enabled
    });
  };

  const handleQuickSetup = () => {
    selectedModules.forEach(moduleId => {
      const options = CONFIGURATION_OPTIONS[moduleId as keyof typeof CONFIGURATION_OPTIONS];
      if (options) {
        const quickConfig: Record<string, boolean> = {};
        options.forEach(opt => {
          quickConfig[opt.key] = true;
        });
        onConfigurationChange(moduleId, quickConfig);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Etapa 3 de 4</p>
          <h2 className="text-xl font-semibold tracking-tight">Configure os Módulos</h2>
          <Button
            onClick={handleQuickSetup}
            variant="outline"
            size="sm"
            className="h-9"
          >
            Ativar Tudo
          </Button>
        </div>

        {/* Module Configurations */}
        <div className="space-y-6">
          {selectedModules.map((moduleId) => {
            const Icon = MODULE_ICONS[moduleId];
            const moduleName = MODULE_NAMES[moduleId];
            const options = CONFIGURATION_OPTIONS[moduleId as keyof typeof CONFIGURATION_OPTIONS] || [];
            const config = moduleConfigurations[moduleId] || {};

            return (
              <div key={moduleId} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{moduleName}</h3>
                </div>

                <div className="space-y-2 pl-6">
                  {options.map(option => (
                    <div key={option.key} className="flex items-center justify-between py-1">
                      <Label htmlFor={`${moduleId}-${option.key}`} className="text-sm text-muted-foreground">
                        {option.label}
                      </Label>
                      <Switch
                        id={`${moduleId}-${option.key}`}
                        checked={config[option.key] || false}
                        onCheckedChange={(checked) => handleConfigToggle(moduleId, option.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-11"
          >
            Voltar
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-11"
          >
            Avançar
          </Button>
        </div>
      </div>
    </div>
  );
}
