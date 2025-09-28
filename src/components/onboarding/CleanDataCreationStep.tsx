import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Leaf, 
  Shield, 
  Users, 
  BarChart3, 
  FileCheck, 
  TrendingUp, 
  Award, 
  Building,
  ArrowLeft,
  ArrowRight,
  Settings,
  Database,
  Lightbulb,
  Check
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
  qualidade: 'Sistema de Qualidade',
  performance: 'Performance',
  documentos: 'Documentos',
  analise_dados: 'Análise de Dados',
  compliance: 'Compliance'
};

const CONFIGURATION_OPTIONS = {
  inventario_gee: [
    { key: 'auto_calculate', label: 'Cálculo automático de emissões', description: 'Calcular automaticamente com base nos dados inseridos' },
    { key: 'import_data', label: 'Importar dados históricos', description: 'Importar planilhas com dados de anos anteriores' },
    { key: 'notifications', label: 'Notificações de coleta', description: 'Lembretes para coleta mensal de dados' }
  ],
  gestao_licencas: [
    { key: 'renewal_alerts', label: 'Alertas de renovação', description: 'Notificações antes do vencimento das licenças' },
    { key: 'document_scan', label: 'Digitalização de documentos', description: 'Escaneamento automático de licenças físicas' },
    { key: 'compliance_check', label: 'Verificação de compliance', description: 'Checagem automática de conformidade' }
  ],
  gestao_pessoas: [
    { key: 'performance_reviews', label: 'Avaliações de performance', description: 'Ciclos automáticos de avaliação' },
    { key: 'training_tracking', label: 'Controle de treinamentos', description: 'Acompanhamento de capacitações obrigatórias' },
    { key: 'goal_setting', label: 'Definição de metas', description: 'Estabelecer e acompanhar metas individuais' }
  ],
  qualidade: [
    { key: 'audit_scheduling', label: 'Agendamento de auditorias', description: 'Programação automática de auditorias internas' },
    { key: 'nonconformity_tracking', label: 'Controle de não conformidades', description: 'Rastreamento de NCs até resolução' },
    { key: 'procedure_management', label: 'Gestão de procedimentos', description: 'Controle de versão de documentos' }
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

  const getModuleConfig = (moduleId: string) => {
    return moduleConfigurations[moduleId] || {};
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Configure seus Módulos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Personalize as configurações de cada módulo para atender suas necessidades específicas.
          </p>
        </div>

        {/* Smart Recommendation */}
        <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Configuração Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Recomendamos ativar as configurações básicas para começar rapidamente. 
                  Você pode personalizar tudo posteriormente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Configurations */}
        <div className="space-y-6">
          {selectedModules.map((moduleId) => {
            const Icon = MODULE_ICONS[moduleId];
            const moduleName = MODULE_NAMES[moduleId];
            const options = CONFIGURATION_OPTIONS[moduleId] || [];
            const config = getModuleConfig(moduleId);

            if (options.length === 0) {
              return (
                <Card key={moduleId} className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {Icon && <Icon className="w-4 h-4" />}
                      </div>
                      {moduleName}
                      <Badge variant="outline" className="text-xs">
                        Configuração automática
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      Este módulo será configurado automaticamente com as melhores práticas
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={moduleId} className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    {moduleName}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {options.map((option) => (
                    <div key={option.key} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground text-sm">
                            {option.label}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                      
                      <Switch
                        checked={config[option.key] || false}
                        onCheckedChange={(checked) => handleConfigToggle(moduleId, option.key, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-foreground">
                  {selectedModules.length} módulos configurados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Suas configurações serão aplicadas após a finalização
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onPrev}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          <Button 
            onClick={onNext}
            className="gap-2"
          >
            Finalizar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}