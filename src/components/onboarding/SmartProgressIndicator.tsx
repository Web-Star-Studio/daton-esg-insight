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
    <Card className="border">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm">Progresso do Setup</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passo {currentStep + 1} de {totalSteps}
              </p>
            </div>
            <div className="text-sm font-semibold">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="text-muted-foreground text-right">
              {selectedModules.length} módulos
            </div>
          </div>

          {/* Current Step */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {stepTitles[currentStep]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
