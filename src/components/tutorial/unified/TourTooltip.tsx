import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TourStep, TourPlacement } from '@/types/tour';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { TourControls } from './TourControls';
import { TourProgress } from './TourProgress';
import { Lightbulb } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface TourTooltipProps {
  step: TourStep;
  targetElement: HTMLElement | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export function TourTooltip({
  step,
  targetElement,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
  onPause,
  onResume,
  isPaused,
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    targetRef.current = targetElement;
  }, [targetElement]);

  const position = useSmartPosition(
    targetRef,
    tooltipRef,
    {
      preferred: step.placement || 'bottom',
      fallbacks: ['top', 'bottom', 'left', 'right', 'center'],
      padding: 16,
      offset: 12,
    }
  );

  // Scroll suave para o elemento target
  useEffect(() => {
    if (targetElement && step.target) {
      setTimeout(() => {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest',
        });
      }, 100);
    }
  }, [targetElement, step.target]);

  const positionStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      };

  return (
    <div
      ref={tooltipRef}
      style={positionStyle}
      className="animate-in fade-in-0 zoom-in-95 duration-300"
    >
      <Card className="w-[90vw] max-w-[420px] shadow-2xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {step.title}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {step.description}
              </CardDescription>
            </div>
            <TourProgress current={currentStep + 1} total={totalSteps} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Dica extra (collapsible) */}
          {step.tip && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-xs">Ver dica útil</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-muted">
                  {step.tip}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Controles */}
          <TourControls
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={onNext}
            onPrev={onPrev}
            onDismiss={onDismiss}
            onPause={onPause}
            onResume={onResume}
            isPaused={isPaused}
          />
        </CardContent>
      </Card>
    </div>
  );
}
