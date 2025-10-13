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
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Configure Módulos 3/4
            </div>
          </div>

          {/* Modules Configuration */}
          <div className="space-y-6">
            {selectedModules.map(moduleId => {
              const Icon = MODULE_ICONS[moduleId];
              const moduleName = MODULE_NAMES[moduleId];
              const options = CONFIGURATION_OPTIONS[moduleId as keyof typeof CONFIGURATION_OPTIONS] || [];
              const config = moduleConfigurations[moduleId] || {};

              return (
                <div key={moduleId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{moduleName}</span>
                  </div>
                  
                  <div className="space-y-2 pl-6">
                    {options.map(option => (
                      <div key={option.key} className="flex items-center justify-between">
                        <Label htmlFor={`${moduleId}-${option.key}`} className="text-sm cursor-pointer">
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

          {/* Quick Setup Button */}
          <Button 
            variant="outline" 
            onClick={handleQuickSetup}
            className="w-full"
            size="sm"
          >
            Configuração Rápida
          </Button>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onPrev} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={onNext} size="sm">
              Avançar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
