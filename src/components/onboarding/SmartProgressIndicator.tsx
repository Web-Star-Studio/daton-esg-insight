import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

interface SmartProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  selectedModules: string[];
  stepTitles: string[];
  onStepTimeUpdate?: (stepTime: number) => void;
}

export function SmartProgressIndicator({
  currentStep,
  totalSteps,
  selectedModules,
  stepTitles,
  onStepTimeUpdate
}: SmartProgressIndicatorProps) {
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [totalStartTime] = useState<number>(() => {
    const saved = localStorage.getItem('onboarding_start_time');
    return saved ? parseInt(saved) : Date.now();
  });
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);

  useEffect(() => {
    setStepStartTime(Date.now());
  }, [currentStep]);

  useEffect(() => {
    if (!localStorage.getItem('onboarding_start_time')) {
      localStorage.setItem('onboarding_start_time', totalStartTime.toString());
    }
  }, [totalStartTime]);

  useEffect(() => {
    // Calculate estimated time remaining based on current progress
    const elapsedTime = (Date.now() - totalStartTime) / 1000; // in seconds
    const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
    
    if (progressPercentage > 0) {
      const estimatedTotalTime = (elapsedTime / progressPercentage) * 100;
      const remaining = Math.max(0, estimatedTotalTime - elapsedTime);
      setEstimatedTimeRemaining(remaining);
    }
  }, [currentStep, totalSteps, totalStartTime]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    } else {
      return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}min`;
    }
  };

  const getProgressColor = () => {
    const progress = (currentStep / (totalSteps - 1)) * 100;
    if (progress < 25) return 'from-blue-500 to-blue-600';
    if (progress < 50) return 'from-purple-500 to-purple-600';
    if (progress < 75) return 'from-orange-500 to-orange-600';
    return 'from-green-500 to-green-600';
  };

  const getMotivationalMessage = () => {
    const progress = (currentStep / (totalSteps - 1)) * 100;
    if (progress < 25) return 'Ótimo começo! Continue assim 🚀';
    if (progress < 50) return 'Você está indo muito bem! 💪';
    if (progress < 75) return 'Quase lá! Falta pouco 🎯';
    return 'Parabéns! Você está quase finalizando! 🎉';
  };

  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
  const elapsedTime = (Date.now() - totalStartTime) / 1000;

  return (
    <Card className="border-border/40 bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${getProgressColor()} shadow-lg`}>
                {currentStep === totalSteps - 1 ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Progresso do Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getMotivationalMessage()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={`bg-gradient-to-r ${getProgressColor()} border-0 text-white`}>
                {Math.round(progressPercentage)}% concluído
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Passo {currentStep + 1} de {totalSteps}</span>
              <span>{stepTitles[currentStep]}</span>
            </div>
          </div>

          {/* Time and Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                Tempo decorrido
              </div>
              <div className="font-semibold text-sm">
                {formatTime(elapsedTime)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Zap className="h-3 w-3" />
                Tempo restante
              </div>
              <div className="font-semibold text-sm">
                {estimatedTimeRemaining > 0 ? formatTime(estimatedTimeRemaining) : '—'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="h-3 w-3" />
                Módulos
              </div>
              <div className="font-semibold text-sm">
                {selectedModules.length} selecionados
              </div>
            </div>
          </div>

          {/* Smart Insights */}
          {progressPercentage > 50 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Insight Inteligente:
                </span>
                <span className="text-green-700">
                  {selectedModules.length > 3 
                    ? 'Excelente seleção! Você terá uma cobertura ampla das funcionalidades.'
                    : 'Boa escolha focada! Você pode adicionar mais módulos depois.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}