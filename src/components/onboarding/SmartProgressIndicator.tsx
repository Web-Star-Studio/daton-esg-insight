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
    <div className="border rounded-lg p-4 space-y-4">
      {/* Progress Bar */}
      <Progress value={progressPercentage} className="h-1" />
      
      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Etapa {currentStep + 1}/{totalSteps}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <span>{selectedModules.length} módulos</span>
      </div>
    </div>
  );
}
