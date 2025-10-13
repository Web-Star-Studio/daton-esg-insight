import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Lightbulb } from 'lucide-react';

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
  selectedModules = [],
  showTips = true 
}: OnboardingProgressProps) {
  const progressValue = (currentStep / (totalSteps - 1)) * 100;

  const getTipForStep = (step: number) => {
    switch (step) {
      case 1:
        return selectedModules.length === 0 
          ? "💡 Dica: Selecione pelo menos 2 módulos para começar"
          : `✅ ${selectedModules.length} módulos selecionados`;
      case 2:
        return "🎯 Quase pronto! Configure as opções básicas para finalizar";
      default:
        return null;
    }
  };

  const tip = getTipForStep(currentStep);

  return (
    <div className="sticky top-0 z-40 bg-background border-b">
      <div className="container mx-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              {stepTitles[currentStep]}
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentStep} de {totalSteps - 1}
            </span>
          </div>
          
          <div className="space-y-3">
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between items-center">
              {stepTitles.slice(0, -1).map((title, index) => (
                <div 
                  key={title} 
                  className={`flex items-center gap-1.5 transition-colors ${
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      index === currentStep 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground/30'
                    }`} />
                  )}
                  <span className="hidden sm:inline text-xs">{title}</span>
                </div>
              ))}
            </div>
          </div>

          {showTips && tip && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-4 h-4" />
                <span>{tip}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}