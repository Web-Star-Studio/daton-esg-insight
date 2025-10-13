import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Check,
  CheckCircle,
  Zap,
  Target,
  Sparkles,
  Clock,
  Info
} from "lucide-react";
import { QuickSetupMode } from "./QuickSetupMode";
import { Confetti } from "./Confetti";

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(selectedModules.slice(0, 2));

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

  const handleQuickSetup = () => {
    const quickConfig = {
      inventario_gee: { auto_calculate: true, notifications: true, import_data: false },
      gestao_licencas: { renewal_alerts: true, compliance_check: true, document_scan: false },
      gestao_pessoas: { performance_reviews: true, training_tracking: true, goal_setting: false },
      qualidade: { audit_scheduling: true, nonconformity_tracking: true, procedure_management: false }
    };

    selectedModules.forEach(moduleId => {
      if (quickConfig[moduleId]) {
        onConfigurationChange(moduleId, quickConfig[moduleId]);
      } else {
        onConfigurationChange(moduleId, {});
      }
    });

    setShowConfetti(true);
  };

  // Calculate configuration progress
  const configurationProgress = (Object.keys(moduleConfigurations).length / selectedModules.length) * 100;
  const isConfigurationComplete = configurationProgress === 100;

  return (
    <TooltipProvider>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="px-3 py-1">
              Configuração Inteligente
            </Badge>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Configure seus Módulos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Personalize as configurações de cada módulo selecionado. 
            As configurações podem ser ajustadas posteriormente no painel administrativo.
          </p>

          {/* Progress Overview */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 max-w-md mx-auto shadow-lg animate-slide-up">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Progresso da Configuração</span>
                  <span className="text-primary font-bold animate-pulse">{Math.round(configurationProgress)}%</span>
                </div>
                <Progress value={configurationProgress} className="h-3 animate-glow-pulse" />
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{Object.keys(moduleConfigurations).length} configurados</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Módulos já configurados</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>{selectedModules.length - Object.keys(moduleConfigurations).length} pendentes</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Módulos aguardando configuração</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Setup Mode */}
        <QuickSetupMode 
          selectedModules={selectedModules} 
          onApplyQuickSetup={handleQuickSetup}
        />

        {/* Smart Recommendation */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  Configuração Inteligente Ativada
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-xs">
                    IA
                  </Badge>
                </h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Aplicamos automaticamente as configurações mais utilizadas por empresas do seu setor. 
                  Todas as opções podem ser personalizadas agora ou posteriormente no painel.
                </p>
                <div className="flex items-center gap-4 text-xs text-blue-600 pt-2">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Otimizado para seu setor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Configuração rápida</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Configurations - Accordion */}
        <Accordion type="multiple" value={expandedModules} onValueChange={setExpandedModules} className="space-y-4">
          {selectedModules.map((moduleId) => {
            const Icon = MODULE_ICONS[moduleId];
            const moduleName = MODULE_NAMES[moduleId];
            const options = CONFIGURATION_OPTIONS[moduleId] || [];
            const config = getModuleConfig(moduleId);

            if (options.length === 0) {
              return (
                <AccordionItem key={moduleId} value={moduleId} className="border-border/50">
                  <Card className="border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          {Icon && <Icon className="w-4 h-4" />}
                        </div>
                        {moduleName}
                        <Badge variant="outline" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Automático
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </AccordionItem>
              );
            }

            const isConfigured = Object.keys(config).length > 0;

            return (
              <AccordionItem key={moduleId} value={moduleId} className="border-0">
                <Card className={`border-2 transition-all duration-300 ${
                  isConfigured ? 'border-green-200 bg-green-50/30' : 'border-border/50'
                } ${expandedModules.includes(moduleId) ? 'shadow-lg' : 'shadow-sm'}`}>
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isConfigured ? 'bg-green-100' : 'bg-muted'
                        }`}>
                          {Icon && <Icon className={`w-5 h-5 ${isConfigured ? 'text-green-600' : 'text-muted-foreground'}`} />}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-base">{moduleName}</div>
                          <div className="text-xs text-muted-foreground">
                            {options.length} opções disponíveis
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfigured ? (
                          <Badge className="bg-green-600 hover:bg-green-700 animate-bounce-in">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3 pt-2">
                      {options.map((option, idx) => (
                        <div 
                          key={option.key} 
                          className="group flex items-center justify-between p-4 bg-card border border-border/50 rounded-lg hover:shadow-md hover:border-primary/30 transition-all animate-slide-up"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="flex-1 space-y-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label htmlFor={`${moduleId}-${option.key}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                  {option.label}
                                  {config[option.key] && (
                                    <Badge variant="secondary" className="text-xs animate-bounce-in">
                                      <Check className="w-3 h-3 mr-1" />
                                      Ativo
                                    </Badge>
                                  )}
                                </Label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique no switch para ativar/desativar</p>
                              </TooltipContent>
                            </Tooltip>
                            {option.description && (
                              <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {option.description}
                                </p>
                              </div>
                            )}
                          </div>
                          <Switch
                            id={`${moduleId}-${option.key}`}
                            checked={config[option.key] || false}
                            onCheckedChange={(checked) => {
                              handleConfigToggle(moduleId, option.key, checked);
                              if (checked && Object.keys(config).length === options.length - 1) {
                                setShowConfetti(true);
                              }
                            }}
                            className="ml-4 data-[state=checked]:bg-green-600"
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>

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

        {/* Configuration Summary */}
        {isConfigurationComplete && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Configuração Concluída! 🎉</h3>
                  <p className="text-sm text-green-700">
                    Todos os módulos foram configurados com sucesso. Você está pronto para finalizar!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={onPrev}
                className="gap-2 hover-scale group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Anterior
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voltar para seleção de módulos</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onNext}
                disabled={!isConfigurationComplete}
                className={`gap-2 hover-scale group ${isConfigurationComplete ? 'bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl animate-bounce-in' : ''}`}
              >
                Finalizar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isConfigurationComplete ? 'Finalizar configuração' : 'Configure todos os módulos primeiro'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}