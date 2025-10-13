import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Building2, Sliders, Database, CheckCircle, Clock } from "lucide-react";
import { CompanyProfileWizard } from "./CompanyProfileWizard";

interface CleanWelcomeStepProps {
  onNext: (profile?: any) => void;
  onSkip?: () => void;
}

export function CleanWelcomeStep({ onNext, onSkip }: CleanWelcomeStepProps) {
  const [showProfileWizard, setShowProfileWizard] = useState(false);

  const handleStartConfiguration = () => {
    setShowProfileWizard(true);
  };

  const handleProfileComplete = (profile: any) => {
    onNext(profile);
  };

  const handleSkipProfile = () => {
    onNext();
  };

  if (showProfileWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <CompanyProfileWizard
          onProfileComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12 px-8 text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Configure sua plataforma ESG</h1>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Setor</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sliders className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Módulos</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Dados</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pronto</span>
            </div>
          </div>

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>3 minutos · 4 etapas</span>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleStartConfiguration}
              className="w-full"
              size="lg"
            >
              Começar
            </Button>
            {onSkip && (
              <Button 
                onClick={onSkip}
                variant="ghost"
                className="w-full"
              >
                Depois
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
