import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { SmartProgressIndicator } from "./SmartProgressIndicator";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  completedSteps?: boolean[];
  selectedModules?: string[];
  smartMode?: boolean;
}

export function OnboardingProgress({ 
  currentStep, 
  totalSteps, 
  stepTitles, 
  completedSteps = [],
  selectedModules = [],
  smartMode = false
}: OnboardingProgressProps) {
  
  if (smartMode) {
    return (
      <SmartProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        selectedModules={selectedModules}
        stepTitles={stepTitles}
      />
    );
  }
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  const getStepIcon = (stepIndex: number) => {
    if (completedSteps[stepIndex]) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (stepIndex === currentStep) {
      return <Clock className="h-5 w-5 text-primary" />;
    } else {
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps[stepIndex]) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'pending';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">
            Progresso do Onboarding
          </span>
          <Badge variant="outline">
            Passo {currentStep + 1} de {totalSteps}
          </Badge>
        </div>
        
        <Progress value={progressPercentage} className="h-3" />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Iniciado</span>
          <span>{Math.round(progressPercentage)}% concluído</span>
        </div>
      </div>

      {/* Step Breadcrumbs */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Progress line behind steps */}
          <div 
            className="absolute top-6 left-0 h-0.5 bg-muted-foreground/20 transition-all duration-500"
            style={{ 
              width: `${(currentStep / (totalSteps - 1)) * 100}%`
            }}
          />
          <div 
            className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ 
              width: `${(Math.max(0, currentStep - 1) / (totalSteps - 1)) * 100}%`
            }}
          />

          {stepTitles.map((title, index) => {
            const status = getStepStatus(index);
            
            return (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 relative z-10"
              >
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${status === 'completed' 
                      ? 'bg-green-50 border-green-600' 
                      : status === 'current'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-muted-foreground/30'
                    }
                  `}
                >
                  {getStepIcon(index)}
                </div>
                
                <div className="text-center max-w-24">
                  <p 
                    className={`text-sm font-medium ${
                      status === 'current' 
                        ? 'text-primary' 
                        : status === 'completed'
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {title}
                  </p>
                  
                  {status === 'current' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Em andamento
                    </p>
                  )}
                  
                  {status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">
                      Concluído
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden flex items-center justify-center space-x-2">
        {stepTitles.map((_, index) => (
          <div
            key={index}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${getStepStatus(index) === 'completed' 
                ? 'bg-green-600' 
                : getStepStatus(index) === 'current'
                ? 'bg-primary'
                : 'bg-muted-foreground/30'
              }
            `}
          />
        ))}
      </div>

      {/* Current Step Info */}
      <div className="text-center p-4 bg-muted/30 rounded-lg border">
        <h3 className="font-semibold text-foreground mb-1">
          {stepTitles[currentStep]}
        </h3>
        
        <p className="text-sm text-muted-foreground">
          {currentStep === 0 && "Bem-vindo! Vamos começar preparando sua plataforma."}
          {currentStep === 1 && "Selecione os módulos que sua empresa irá utilizar."}
          {currentStep === 2 && "Acesse diretamente os módulos selecionados com orientações."}
          {currentStep === 3 && "Configuração finalizada! Sua plataforma está pronta."}
        </p>
      </div>
    </div>
  );
}