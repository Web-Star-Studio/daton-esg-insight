import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Users, 
  Zap,
  TrendingUp,
  Target,
  AlertCircle,
  Sparkles
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
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header com progresso principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Configuração Inteligente
                    </h3>
                  </div>
                  
                  <Badge 
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {getMotivationalMessage()}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Decorrido: {formatTime(timeElapsed)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Restante: ~{getEstimatedTimeRemaining()}</span>
                  </div>
                </div>
              </div>

              {/* Barra de progresso principal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Progresso Geral
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage()} 
                  className="h-2 bg-muted/30"
                />
              </div>

              {/* Steps horizontais */}
              <div className="flex items-center justify-between relative">
                {/* Linha conectora */}
                <div className="absolute top-2 left-2 right-2 h-0.5 bg-muted -z-10" />
                <div 
                  className="absolute top-2 left-2 h-0.5 bg-primary transition-all duration-300 -z-10" 
                  style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
                />

                {stepTitles.map((title, index) => {
                  const status = getStepStatus(index);
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
                        onStepClick ? 'hover:scale-105' : ''
                      }`}
                      onClick={() => onStepClick?.(index)}
                    >
                      {/* Ícone do step */}
                      <div className={`
                        w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200
                        ${status === 'completed' ? 'bg-green-100' : 
                          status === 'current' ? 'bg-primary/10' : 'bg-muted'}
                      `}>
                        {getStepIcon(index)}
                      </div>
                      
                      {/* Título do step */}
                      <div className="text-center">
                        <div className={`text-xs font-medium transition-colors duration-200 ${
                          status === 'completed' ? 'text-green-600' :
                          status === 'current' ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {title}
                        </div>
                        
                        {/* Status indicator */}
                        {status === 'current' && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              <Zap className="h-2 w-2 mr-1" />
                              Ativo
                            </Badge>
                          </div>
                        )}
                        
                        {status === 'completed' && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700">
                              <CheckCircle className="h-2 w-2 mr-1" />
                              Feito
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Métricas rápidas */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-muted-foreground">Módulos:</span>
                  <span className="font-medium text-foreground">{selectedModules.length}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">Configurados:</span>
                  <span className="font-medium text-foreground">{Object.keys(moduleConfigurations).length}</span>
                </div>

                {selectedModules.length > 0 && Object.keys(moduleConfigurations).length < selectedModules.length && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="font-medium text-amber-600">
                      {selectedModules.length - Object.keys(moduleConfigurations).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}