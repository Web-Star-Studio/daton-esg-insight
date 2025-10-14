import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Users, 
  TrendingUp,
  Target,
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
    <TooltipProvider>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 animate-fade-in">
        <div className="container mx-auto px-4 py-3">
          <div className="space-y-4">
            {/* Header minimalista */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-primary/5 rounded-lg">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Configuração Inteligente
                </h3>
                <Badge 
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {getMotivationalMessage()}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">Decorrido: </span>
                  <span>{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span className="hidden sm:inline">Restante: </span>
                  <span>~{getEstimatedTimeRemaining()}</span>
                </div>
              </div>
            </div>

            {/* Steps horizontais minimalistas */}
            <div className="flex items-center justify-between relative">
              {/* Linha conectora */}
              <div className="absolute top-2 left-2 right-2 h-0.5 bg-muted rounded-full -z-10" />
              <div 
                className="absolute top-2 left-2 h-0.5 bg-primary transition-all duration-500 rounded-full -z-10" 
                style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
              />

              {stepTitles.map((title, index) => {
                const status = getStepStatus(index);
                
                return (
                  <div 
                    key={index}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                      onStepClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onStepClick?.(index)}
                  >
                    {/* Ícone do step minimalista */}
                    <div className={`
                      w-4 h-4 rounded-full flex items-center justify-center transition-all
                      ${status === 'completed' ? 'bg-green-500/10 ring-2 ring-green-500/30' : 
                        status === 'current' ? 'bg-primary/10 ring-2 ring-primary/30' : 
                        'bg-muted'}
                    `}>
                      {getStepIcon(index)}
                    </div>
                    
                    {/* Título do step */}
                    <div className="text-center">
                      <div className={`text-[10px] font-medium whitespace-nowrap ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'current' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {title}
                      </div>
                      
                      {/* Status badge minimalista */}
                      {status === 'current' && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 bg-primary/5 border-primary/20">
                          Ativo
                        </Badge>
                      )}
                      
                      {status === 'completed' && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 mt-1 bg-green-50 text-green-700 border-green-200">
                          Feito
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Métricas minimalistas */}
            <div className="flex items-center justify-center gap-4 pt-2.5 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-blue-50/50">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="text-muted-foreground hidden sm:inline">Módulos:</span>
                <span className="font-semibold text-foreground">{selectedModules.length}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-green-50/50">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground hidden sm:inline">Configurados:</span>
                <span className="font-semibold text-foreground">{Object.keys(moduleConfigurations).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}