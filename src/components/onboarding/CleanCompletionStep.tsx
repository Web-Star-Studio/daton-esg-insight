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
      <div className="w-full max-w-sm text-center space-y-12">
        {/* Checkmark */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Tudo pronto</h1>
          
          {/* Stats */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>{selectedModules.length} módulos configurados</div>
            <div>{totalConfigOptions} opções ativadas</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onStartUsingPlatform}
            className="w-full h-11"
          >
            Ir para Dashboard
          </Button>
          <Button 
            onClick={onTakeTour}
            variant="outline"
            className="w-full h-11"
          >
            Fazer Tour
          </Button>
        </div>
      </div>
    </div>
  );
}
