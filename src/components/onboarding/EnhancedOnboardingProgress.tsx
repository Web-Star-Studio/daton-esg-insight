import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Users, 
  Zap,
  TrendingUp,
  Target,
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react";

interface EnhancedOnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  selectedModules: string[];
  moduleConfigurations?: Record<string, any>;
  timeElapsed?: number;
  onStepClick?: (step: number) => void;
}

export function EnhancedOnboardingProgress({ 
  currentStep, 
  totalSteps, 
  stepTitles, 
  selectedModules,
  moduleConfigurations = {},
  onStepClick
}: EnhancedOnboardingProgressProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  };

  const getEstimatedTimeRemaining = () => {
    const avgTimePerStep = timeElapsed / (currentStep + 1);
    const remainingSteps = totalSteps - currentStep - 1;
    const estimated = Math.round(avgTimePerStep * remainingSteps);
    return estimated > 0 ? formatTime(estimated) : '0:00';
  };

  const isStepCompleted = (step: number) => {
    if (step < currentStep) return true;
    if (step === 1 && selectedModules.length > 0) return true;
    if (step === 2 && Object.keys(moduleConfigurations).length > 0) return true;
    return false;
  };

  const isStepCurrent = (step: number) => step === currentStep;

  const getStepIcon = (step: number) => {
    if (isStepCompleted(step)) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (isStepCurrent(step)) {
      return <Circle className="h-4 w-4 text-primary fill-current" />;
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStepStatus = (step: number) => {
    if (isStepCompleted(step)) return 'completed';
    if (isStepCurrent(step)) return 'current';
    return 'pending';
  };

  const getMotivationalMessage = () => {
    const progress = getProgressPercentage();
    if (progress >= 75) return "Quase lá! 🎯";
    if (progress >= 50) return "Ótimo progresso! 🚀";
    if (progress >= 25) return "Você está indo bem! ⭐";
    return "Vamos começar! 💪";
  };

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <Card className="shadow-lg border-primary/10 bg-gradient-to-r from-card to-card/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header com progresso principal */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        Configuração Inteligente
                      </h3>
                    </div>
                    
                    <Badge 
                      className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/20 hover:to-primary/10 transition-all animate-scale-in"
                    >
                      {getMotivationalMessage()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">Decorrido: </span>
                          <span className="font-medium">{formatTime(timeElapsed)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tempo desde o início da configuração</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
                          <Target className="h-3 w-3" />
                          <span className="hidden sm:inline">Restante: </span>
                          <span className="font-medium">~{getEstimatedTimeRemaining()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tempo estimado para conclusão</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Barra de progresso principal com animação */}
                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      Progresso Geral
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Complete todas as etapas para finalizar a configuração</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="text-sm font-bold text-primary animate-pulse">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                  <Progress 
                    value={getProgressPercentage()} 
                    className="h-2.5 bg-muted/30 transition-all duration-500"
                  />
                </div>

                {/* Steps horizontais com melhor visualização */}
                <div className="flex items-center justify-between relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {/* Linha conectora com gradiente */}
                  <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-muted via-muted to-muted rounded-full -z-10" />
                  <div 
                    className="absolute top-2 left-2 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 ease-out rounded-full -z-10 shadow-lg shadow-primary/20" 
                    style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
                  />

                  {stepTitles.map((title, index) => {
                    const status = getStepStatus(index);
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`flex flex-col items-center gap-2 transition-all duration-300 group ${
                              onStepClick ? 'cursor-pointer hover:scale-110' : ''
                            }`}
                            onClick={() => onStepClick?.(index)}
                            role="button"
                            tabIndex={0}
                            aria-label={`${title} - ${status === 'completed' ? 'Concluído' : status === 'current' ? 'Em andamento' : 'Pendente'}`}
                          >
                            {/* Ícone do step com animação aprimorada */}
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                              ${status === 'completed' ? 'bg-gradient-to-br from-green-100 to-green-50 ring-2 ring-green-200 group-hover:ring-green-300' : 
                                status === 'current' ? 'bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/30 animate-pulse group-hover:ring-primary/50' : 
                                'bg-gradient-to-br from-muted to-muted/80 group-hover:ring-2 group-hover:ring-muted-foreground/20'}
                            `}>
                              {getStepIcon(index)}
                            </div>
                            
                            {/* Título do step com melhor tipografia */}
                            <div className="text-center">
                              <div className={`text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                                status === 'completed' ? 'text-green-600 font-semibold' :
                                status === 'current' ? 'text-primary font-semibold' : 'text-muted-foreground'
                              }`}>
                                {title}
                              </div>
                              
                              {/* Status indicator com melhor design */}
                              {status === 'current' && (
                                <div className="mt-1.5 animate-fade-in">
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/5 border-primary/20">
                                    <Zap className="h-2 w-2 mr-1 animate-pulse" />
                                    Ativo
                                  </Badge>
                                </div>
                              )}
                              
                              {status === 'completed' && (
                                <div className="mt-1.5 animate-scale-in">
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-2 w-2 mr-1" />
                                    Feito
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {status === 'completed' ? 'Etapa concluída com sucesso' : 
                             status === 'current' ? 'Etapa em andamento' : 
                             'Aguardando etapas anteriores'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Métricas rápidas com melhor visualização */}
                <div className="flex items-center justify-center gap-6 pt-3 border-t border-border/30 animate-fade-in flex-wrap" style={{ animationDelay: '0.3s' }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-50/50 hover:from-blue-100 hover:to-blue-50 transition-all cursor-help">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-muted-foreground hidden sm:inline">Módulos:</span>
                        <span className="font-semibold text-foreground">{selectedModules.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de módulos selecionados</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-green-50/50 hover:from-green-100 hover:to-green-50 transition-all cursor-help">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-muted-foreground hidden sm:inline">Configurados:</span>
                        <span className="font-semibold text-foreground">{Object.keys(moduleConfigurations).length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Módulos com configuração completa</p>
                    </TooltipContent>
                  </Tooltip>

                  {selectedModules.length > 0 && Object.keys(moduleConfigurations).length < selectedModules.length && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-50/50 hover:from-amber-100 hover:to-amber-50 transition-all cursor-help animate-pulse">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-muted-foreground hidden sm:inline">Pendentes:</span>
                          <span className="font-semibold text-amber-600">
                            {selectedModules.length - Object.keys(moduleConfigurations).length}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Módulos aguardando configuração</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}