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
  Building
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
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`h-1 rounded-full transition-all ${
                  index === 2 ? 'w-6 bg-primary' : index < 2 ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`} 
              />
            ))}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Configure os Módulos</h2>
          <p className="text-xs text-muted-foreground">Ative as funcionalidades desejadas</p>
        </div>

        {/* Quick Action */}
        <div className="flex justify-center">
          <Button
            onClick={handleQuickSetup}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            Ativar Tudo Recomendado
          </Button>
        </div>

        {/* Module Configurations */}
        <div className="space-y-4">
          {selectedModules.map((moduleId) => {
            const Icon = MODULE_ICONS[moduleId];
            const moduleName = MODULE_NAMES[moduleId];
            const options = CONFIGURATION_OPTIONS[moduleId as keyof typeof CONFIGURATION_OPTIONS] || [];
            const config = moduleConfigurations[moduleId] || {};

            return (
              <div key={moduleId} className="space-y-2 p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-medium">{moduleName}</h3>
                </div>

                <div className="space-y-1.5 pl-5">
                  {options.map(option => (
                    <div key={option.key} className="flex items-center justify-between">
                      <Label htmlFor={`${moduleId}-${option.key}`} className="text-xs text-muted-foreground">
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
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-10"
          >
            Voltar
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-10"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
