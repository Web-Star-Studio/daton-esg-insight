import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Bot, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Users,
  Target,
  MessageCircle,
  X,
  ChevronUp,
  ChevronDown,
  Minimize2
} from "lucide-react";

interface OnboardingAssistantProps {
  currentStep: number;
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  companyProfile?: any;
  onSuggestionAccept?: (suggestion: string) => void;
}

interface Suggestion {
  id: string;
  type: 'tip' | 'warning' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export function OnboardingAssistant({ 
  currentStep, 
  selectedModules, 
  moduleConfigurations,
  companyProfile,
  onSuggestionAccept 
}: OnboardingAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Sugestões baseadas no passo atual
    switch (currentStep) {
      case 1: // Seleção de módulos
        if (selectedModules.length === 0) {
          suggestions.push({
            id: 'no-modules',
            type: 'warning',
            title: 'Nenhum módulo selecionado',
            description: 'Recomendamos selecionar ao menos 2-3 módulos essenciais para começar.',
            priority: 'high'
          });
        }

        if (selectedModules.length > 5) {
          suggestions.push({
            id: 'too-many-modules',
            type: 'tip',
            title: 'Muitos módulos selecionados',
            description: 'Para uma implementação mais eficiente, considere começar com 3-4 módulos principais.',
            priority: 'medium'
          });
        }

        if (companyProfile?.sector === 'industrial' && !selectedModules.includes('inventario_gee')) {
          suggestions.push({
            id: 'gee-industrial',
            type: 'recommendation',
            title: 'Inventário GEE Recomendado',
            description: 'Para empresas industriais, o controle de emissões é fundamental para compliance.',
            action: 'Adicionar Inventário GEE',
            priority: 'high'
          });
        }
        break;

      case 2: // Configuração
        const configuredModules = Object.keys(moduleConfigurations).length;
        if (configuredModules < selectedModules.length) {
          suggestions.push({
            id: 'incomplete-config',
            type: 'warning',
            title: 'Configuração incompleta',
            description: `${selectedModules.length - configuredModules} módulos ainda precisam ser configurados.`,
            priority: 'high'
          });
        }

        if (selectedModules.includes('inventario_gee') && !moduleConfigurations['inventario_gee']?.automatic_calculation) {
          suggestions.push({
            id: 'gee-automation',
            type: 'tip',
            title: 'Habilitar cálculos automáticos',
            description: 'Recomendamos ativar os cálculos automáticos para maior eficiência no inventário GEE.',
            action: 'Ativar automação',
            priority: 'medium'
          });
        }
        break;
    }

    // Sugestões gerais baseadas no perfil
    if (companyProfile?.size === 'pequena' && selectedModules.length > 3) {
      suggestions.push({
        id: 'small-company-modules',
        type: 'tip',
        title: 'Foco em módulos essenciais',
        description: 'Para empresas menores, recomendamos focar nos módulos mais críticos primeiro.',
        priority: 'medium'
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();
  const currentSuggestion = suggestions[currentSuggestionIndex];

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'recommendation': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4 text-green-600" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'recommendation': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getProgressText = () => {
    const progress = Math.round(((currentStep + 1) / 4) * 100);
    return `${progress}% concluído`;
  };

  const getStepEstimate = () => {
    const estimates = {
      0: '1 min',
      1: '2-3 min',
      2: '3-5 min',
      3: '1 min'
    };
    return estimates[currentStep as keyof typeof estimates] || '1 min';
  };

  if (!isExpanded) {
    return (
      <TooltipProvider>
        <div className="fixed bottom-4 right-4 z-40">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsExpanded(true)}
                className="rounded-full shadow-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/85 hover-scale animate-pulse"
                size="lg"
              >
                <Bot className="h-5 w-5 mr-2" />
                <span className="font-semibold">Assistente</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Abrir assistente de configuração</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 w-80 sm:w-96 z-40 animate-slide-in-right">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-lg">
        <CardHeader className="pb-3 bg-gradient-to-b from-muted/10 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Assistente de Configuração</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-7 w-7 p-0 hover-scale"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Minimizar assistente</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help hover:text-foreground transition-colors">{getProgressText()}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Progresso total do onboarding</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
                    <Clock className="h-3 w-3" />
                    <span>{getStepEstimate()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tempo estimado para esta etapa</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Progress value={((currentStep + 1) / 4) * 100} className="h-2 bg-muted/50" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/40 hover:border-primary/30 transition-all hover-scale cursor-help">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-base">{selectedModules.length}</div>
                    <div className="text-muted-foreground">Módulos</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de módulos selecionados</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/40 hover:border-primary/30 transition-all hover-scale cursor-help">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-semibold text-base">{Object.keys(moduleConfigurations).length}</div>
                    <div className="text-muted-foreground">Configurados</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Módulos já configurados</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-3 w-3" />
                  Sugestões Inteligentes
                </h4>
                {suggestions.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentSuggestionIndex + 1}/{suggestions.length}
                  </Badge>
                )}
              </div>

              {currentSuggestion && (
                <div className={`p-3 rounded-lg border ${getSuggestionColor(currentSuggestion.type)}`}>
                  <div className="flex items-start gap-2">
                    {getSuggestionIcon(currentSuggestion.type)}
                    <div className="flex-1 space-y-2">
                      <h5 className="text-sm font-medium text-foreground">
                        {currentSuggestion.title}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentSuggestion.description}
                      </p>
                      {currentSuggestion.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => onSuggestionAccept?.(currentSuggestion.id)}
                        >
                          {currentSuggestion.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navegação de sugestões */}
              {suggestions.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentSuggestionIndex(Math.max(0, currentSuggestionIndex - 1))}
                    disabled={currentSuggestionIndex === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentSuggestionIndex(Math.min(suggestions.length - 1, currentSuggestionIndex + 1))}
                    disabled={currentSuggestionIndex === suggestions.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Dicas rápidas */}
          <div className="p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold">Dica Rápida</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentStep === 1 && "Use 'Selecionar Recomendados' para uma configuração otimizada."}
              {currentStep === 2 && "Configurações podem ser ajustadas posteriormente no painel."}
              {currentStep === 3 && "O tour guiado te ajudará a explorar todos os recursos."}
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}