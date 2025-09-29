import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useState } from 'react';

interface MobileOptimizedOnboardingProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onNext: () => void;
  onPrev: () => void;
  onSkip?: () => void;
  children: React.ReactNode;
}

export function MobileOptimizedOnboarding({
  currentStep,
  totalSteps,
  stepTitles,
  onNext,
  onPrev,
  onSkip,
  children
}: MobileOptimizedOnboardingProps) {
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const progress = ((currentStep + 1) / totalSteps) * 100;

  if (!isMobile) {
    // Return desktop version
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(true)}
              className="p-1"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                Etapa {currentStep + 1}
              </span>
            </div>
          </div>
          
          {onSkip && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSkip}
              className="text-xs"
            >
              Pular
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 space-y-2">
          <Progress value={progress} className="w-full h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stepTitles[currentStep]}</span>
            <span>{currentStep + 1} de {totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Progresso do Setup</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {stepTitles.map((title, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    index === currentStep 
                      ? 'bg-primary/10 border-primary/20' 
                      : index < currentStep 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-muted/30 border-border/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep 
                      ? 'bg-green-100 text-green-700' 
                      : index === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {index < currentStep 
                        ? 'Concluído' 
                        : index === currentStep 
                          ? 'Em andamento' 
                          : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Mobile Navigation Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/20 p-4">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={onPrev}
              className="flex-1"
              size="lg"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
          
          <Button
            onClick={onNext}
            className="flex-1"
            size="lg"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                Finalizar
                <CheckCircle className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Device Orientation Helper */}
      <div className="fixed bottom-4 left-4 right-4 pointer-events-none">
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Tablet className="w-3 h-3" />
            Para melhor experiência, use no modo paisagem
          </Badge>
        </div>
      </div>
    </div>
  );
}