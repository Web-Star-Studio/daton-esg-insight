import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Pause, Play, Check } from 'lucide-react';

interface TourControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export function TourControls({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
  onPause,
  onResume,
  isPaused,
}: TourControlsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        Sair
      </Button>

      <div className="flex items-center gap-2">
        {/* Pause/Resume (opcional) */}
        {(onPause || onResume) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={isPaused ? onResume : onPause}
            className="h-8 w-8"
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={isFirstStep}
          className="min-w-[80px]"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        {/* Próximo/Concluir */}
        <Button
          size="sm"
          onClick={onNext}
          className="min-w-[80px]"
        >
          {isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Concluir
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
