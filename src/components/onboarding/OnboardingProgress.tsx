import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  selectedModules?: string[];
  showTips?: boolean;
}

export function OnboardingProgress({ 
  currentStep, 
  totalSteps, 
  stepTitles, 
  selectedModules = []
}: OnboardingProgressProps) {
  const progressValue = (currentStep / (totalSteps - 1)) * 100;
  const displaySteps = stepTitles.slice(0, -1);

  return (
    <div className="border-b bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Progresso Geral
          </h2>
          <span className="text-2xl font-semibold text-primary">
            {Math.round(progressValue)}%
          </span>
        </div>

        {/* Progress Bar */}
        <Progress value={progressValue} className="h-1.5 mb-6" />

        {/* Step Indicators */}
        <div className="flex items-start justify-between gap-2">
          {displaySteps.map((title, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div 
                key={title} 
                className="flex flex-col items-center flex-1 min-w-0"
              >
                {/* Circle Indicator */}
                <div className="relative mb-2">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'border-primary bg-primary' 
                        : 'border-muted bg-background'
                    }`}>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* Step Title */}
                <p className={`text-xs text-center transition-colors ${
                  isCompleted || isActive 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground'
                }`}>
                  <span className="hidden sm:inline">{title}</span>
                  <span className="sm:hidden">{title.split(' ')[0]}</span>
                </p>

                {/* Status Badge */}
                {(isCompleted || isActive) && (
                  <span className={`mt-1.5 px-2 py-0.5 text-xs rounded-full ${
                    isCompleted 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {isCompleted ? 'Feito' : 'Ativo'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Module Stats */}
        {selectedModules.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Módulos:</span>
              <span className="text-lg font-semibold text-foreground">
                {selectedModules.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}