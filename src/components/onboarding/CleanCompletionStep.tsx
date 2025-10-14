import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface CleanCompletionStepProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onStartUsingPlatform: () => void;
  onTakeTour: () => void;
  onSetupInitialData?: () => void;
  onRunValidation?: () => void;
  onEmergencyComplete?: () => void;
}

export function CleanCompletionStep({ 
  selectedModules, 
  moduleConfigurations, 
  onStartUsingPlatform, 
  onTakeTour
}: CleanCompletionStepProps) {

  const totalConfigOptions = Object.values(moduleConfigurations).reduce(
    (acc, config) => acc + Object.values(config).filter(Boolean).length, 
    0
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-8 animate-scale-in">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title & Stats */}
        <div className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Configuração Completa! 🎉</h1>
          
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full bg-muted/50 text-xs text-muted-foreground">
            <span>{selectedModules.length} módulos</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>{totalConfigOptions} recursos</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className="h-1 w-6 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            onClick={onStartUsingPlatform}
            className="w-full h-10"
          >
            Acessar Plataforma
          </Button>
          <Button 
            onClick={onTakeTour}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
          >
            Fazer tour guiado
          </Button>
        </div>
      </div>
    </div>
  );
}
