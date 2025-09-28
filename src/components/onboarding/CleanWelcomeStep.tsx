import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Leaf, ArrowRight, Clock, Star } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <CompanyProfileWizard
          onProfileComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Welcome Card */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            
            <Badge variant="secondary" className="w-fit mx-auto mb-4">
              <Star className="w-3 h-3 mr-1" />
              Configuração Inteligente
            </Badge>
            
            <CardTitle className="text-3xl font-bold text-foreground mb-4">
              Bem-vindo ao Daton!
            </CardTitle>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Sua plataforma de gestão ESG está pronta. 
              Configure os módulos essenciais em poucos passos.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Key Benefits - Simplified */}
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">8 Módulos Integrados</h4>
                  <p className="text-sm text-muted-foreground">ESG, Qualidade, Pessoas e Performance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Relatórios Automáticos</h4>
                  <p className="text-sm text-muted-foreground">Dashboards e análises em tempo real</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Setup Personalizado</h4>
                  <p className="text-sm text-muted-foreground">Configuração adaptada ao seu perfil</p>
                </div>
              </div>
            </div>

            {/* Time Estimate */}
            <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg p-4 border border-blue-200/30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-foreground">Tempo estimado: 3-5 minutos</h4>
                  <p className="text-sm text-muted-foreground">
                    Progresso salvo automaticamente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={onSkip}
            size="lg"
            className="min-w-32"
          >
            Pular Setup
          </Button>
          
          <Button 
            onClick={handleStartConfiguration}
            size="lg" 
            className="min-w-40 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Começar Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}