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
      <div className="w-full max-w-sm space-y-12 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/5">
            <Leaf className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Configure sua plataforma</h1>
            <p className="text-sm text-muted-foreground">4 etapas · 3 minutos</p>
          </div>
        </div>

        {/* Steps Preview */}
        <div className="flex items-center justify-between px-4">
          {[
            { icon: Building2, label: "Perfil" },
            { icon: Sliders, label: "Módulos" },
            { icon: Database, label: "Dados" },
            { icon: CheckCircle, label: "Pronto" }
          ].map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                <step.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleStartConfiguration}
            className="w-full h-11"
          >
            Começar
          </Button>
          {onSkip && (
            <Button 
              onClick={onSkip}
              variant="ghost"
              className="w-full h-11"
            >
              Fazer depois
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
