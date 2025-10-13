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
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12 px-8 text-center space-y-8">
          {/* Checkmark */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Tudo pronto!</h1>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>{selectedModules.length} módulos configurados</div>
            <div>{totalConfigOptions} opções ativadas</div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={onTakeTour}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Começar Tour
            </Button>
            <Button 
              onClick={onStartUsingPlatform}
              className="w-full"
              size="lg"
            >
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
