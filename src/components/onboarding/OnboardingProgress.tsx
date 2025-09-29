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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 animate-slide-in-right">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground animate-fade-in">
              {stepTitles[currentStep]}
            </h2>
            <Badge variant="outline" className="text-sm animate-scale-in">
              {currentStep} de {totalSteps - 1}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress value={progressValue} className="h-3 animate-fade-in" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {stepTitles.slice(0, -1).map((title, index) => (
                <div 
                  key={title} 
                  className={`flex items-center gap-1 transition-all duration-300 ${
                    index <= currentStep ? 'text-primary animate-scale-in' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-3 h-3 animate-scale-in" />
                  ) : (
                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                      index === currentStep 
                        ? 'border-primary bg-primary animate-pulse' 
                        : 'border-muted-foreground'
                    }`} />
                  )}
                  <span className="hidden sm:inline">{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Tips */}
          {showTips && tip && (
            <Card 
              className={`${
                tip.startsWith('✅') 
                  ? 'bg-green-50/50 border-green-200/50' 
                  : 'bg-blue-50/50 border-blue-200/50'
              } animate-fade-in`} 
              style={{ animationDelay: '0.5s' }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className={`w-4 h-4 ${
                    tip.startsWith('✅') ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <span className={tip.startsWith('✅') ? 'text-green-800' : 'text-blue-800'}>
                    {tip}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}