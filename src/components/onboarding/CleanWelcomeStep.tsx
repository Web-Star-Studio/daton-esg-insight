import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
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
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Bem-vindo à Daton</h1>
            <p className="text-sm text-muted-foreground">Configure sua plataforma em minutos</p>
          </div>
        </div>

        {/* Simple Progress Indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`h-1 rounded-full transition-all ${
                index === 0 ? 'w-6 bg-primary' : 'w-4 bg-muted'
              }`} 
            />
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            onClick={handleStartConfiguration}
            className="w-full h-10"
          >
            Começar Configuração
          </Button>
          {onSkip && (
            <Button 
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
            >
              Pular por enquanto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
