import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface ProgressMinimapProps {
  currentStep: number;
  steps: Array<{ title: string; description?: string }>;
  onStepClick?: (step: number) => void;
}

export function ProgressMinimap({ currentStep, steps, onStepClick }: ProgressMinimapProps) {
  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/40 animate-fade-in">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Progresso do Setup</h4>
              <Badge variant="outline" className="text-xs">
                {currentStep + 1} de {steps.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;
                const isClickable = onStepClick && isCompleted;

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-primary/10 border border-primary/30'
                            : isCompleted
                            ? 'bg-green-50 border border-green-200/50 hover:bg-green-100'
                            : 'bg-muted/20 border border-border/30'
                        } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => isClickable && onStepClick(index)}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isCurrent ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${
                            isCurrent
                              ? 'text-primary'
                              : isCompleted
                              ? 'text-green-700'
                              : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </p>
                        </div>

                        {isCurrent && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 animate-pulse">
                            Atual
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="space-y-1">
                        <p className="font-medium">{step.title}</p>
                        {step.description && (
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        )}
                        {isCompleted && (
                          <p className="text-xs text-green-600">✓ Concluído</p>
                        )}
                        {isCurrent && (
                          <p className="text-xs text-primary">→ Em andamento</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
