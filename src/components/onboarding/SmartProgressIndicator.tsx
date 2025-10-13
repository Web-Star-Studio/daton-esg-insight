import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

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
  stepTitles
}: SmartProgressIndicatorProps) {
  const [totalStartTime] = useState<number>(() => {
    const saved = localStorage.getItem('onboarding_start_time');
    return saved ? parseInt(saved) : Date.now();
  });

  useEffect(() => {
    if (!localStorage.getItem('onboarding_start_time')) {
      localStorage.setItem('onboarding_start_time', totalStartTime.toString());
    }
  }, [totalStartTime]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}min`;
  };

  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
  const elapsedTime = (Date.now() - totalStartTime) / 1000;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">Etapa {currentStep + 1} de {totalSteps}</span>
        <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        <span>{selectedModules.length} módulos</span>
      </div>
    </div>
  );
}
