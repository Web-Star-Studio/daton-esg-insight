import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

interface MobileOnboardingNavProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  nextLabel?: string;
  prevLabel?: string;
}

export function MobileOnboardingNav({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  nextDisabled = false,
  prevDisabled = false,
  nextLabel = 'Próximo',
  prevLabel = 'Anterior'
}: MobileOnboardingNavProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 md:hidden">
      <div className="flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {currentStep > 0 && onPrev && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onPrev}
              disabled={prevDisabled}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {prevLabel}
            </Button>
          )}
          
          {onSkip && currentStep === 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSkip}
              className="gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Pular
            </Button>
          )}
        </div>

        {/* Center - Progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps - 1 }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index <= currentStep 
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Right side */}
        <div>
          {onNext && (
            <Button 
              size="sm"
              onClick={onNext}
              disabled={nextDisabled}
              className="gap-2"
            >
              {nextLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}