import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface GRIConfigurationProgressProps {
  currentStep: number;
  steps: Step[];
}

export function GRIConfigurationProgress({ currentStep, steps }: GRIConfigurationProgressProps) {
  return (
    <div className="relative">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full border-2 flex items-center justify-center font-semibold transition-all',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'bg-primary/10 border-primary text-primary scale-110',
                    isUpcoming && 'bg-background border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-1/2 top-5 h-0.5 transition-all',
                      isCompleted ? 'bg-primary' : 'bg-muted',
                      'w-full'
                    )}
                    style={{ width: 'calc(100vw / 7)' }}
                  />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Background */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
    </div>
  );
}
