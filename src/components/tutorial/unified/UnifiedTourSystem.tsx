import React, { useEffect, useState, useRef } from 'react';
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';
import { TourOverlay } from './TourOverlay';
import { TourTooltip } from './TourTooltip';
import { useIsMobile } from '@/hooks/use-mobile';

export function UnifiedTourSystem() {
  const {
    activeTour,
    currentStepIndex,
    isPlaying,
    isPaused,
    nextStep,
    prevStep,
    dismissTour,
    pauseTour,
    resumeTour,
  } = useUnifiedTour();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const previousStepRef = useRef<number>(-1);

  const currentStep = activeTour?.steps[currentStepIndex];

  // Encontrar elemento target quando step muda
  useEffect(() => {
    if (!currentStep || !isPlaying) {
      setTargetElement(null);
      return;
    }

    // Se step mudou, encontrar novo elemento
    if (previousStepRef.current !== currentStepIndex) {
      previousStepRef.current = currentStepIndex;

      if (currentStep.target) {
        // Pequeno delay para garantir que DOM está pronto
        const timer = setTimeout(() => {
          const element = document.querySelector<HTMLElement>(currentStep.target!);
          setTargetElement(element);

          if (!element) {
            console.warn(`Tour target not found: ${currentStep.target}`);
          }
        }, 100);

        return () => clearTimeout(timer);
      } else {
        setTargetElement(null);
      }
    }
  }, [currentStep, currentStepIndex, isPlaying]);

  // Executar action do step se houver
  useEffect(() => {
    if (currentStep?.action && isPlaying && !isPaused) {
      currentStep.action();
    }
  }, [currentStep, isPlaying, isPaused]);

  // Suporte a teclado (ESC, setas)
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isPaused) nextStep();
      } else if (e.key === 'ArrowLeft') {
        if (!isPaused) prevStep();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPaused) {
          resumeTour();
        } else {
          pauseTour();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, nextStep, prevStep, dismissTour, pauseTour, resumeTour]);

  // Não renderizar se não há tour ativo
  if (!activeTour || !isPlaying || !currentStep) {
    return null;
  }

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      <TourOverlay
        targetElement={targetElement}
        allowInteraction={currentStep.allowInteraction}
        onClickOutside={dismissTour}
        intensity="medium"
      />

      <TourTooltip
        step={currentStep}
        targetElement={targetElement}
        currentStep={currentStepIndex}
        totalSteps={activeTour.steps.length}
        onNext={nextStep}
        onPrev={prevStep}
        onDismiss={dismissTour}
        onPause={pauseTour}
        onResume={resumeTour}
        isPaused={isPaused}
      />
    </div>
  );
}
