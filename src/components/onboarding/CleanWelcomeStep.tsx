import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Leaf, ArrowRight, Clock, Star, Sparkles } from "lucide-react";
import { CompanyProfileWizard } from "./CompanyProfileWizard";

interface CleanWelcomeStepProps {
  onNext: (profile?: any) => void;
  onSkip?: () => void;
}

export function CleanWelcomeStep({ onNext, onSkip }: CleanWelcomeStepProps) {
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStartConfiguration = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowProfileWizard(true);
    }, 300);
  };

  const handleProfileComplete = (profile: any) => {
    onNext(profile);
  };

  const handleSkipProfile = () => {
    onNext();
  };

  if (showProfileWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
        <CompanyProfileWizard
          onProfileComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Welcome Card */}
        <Card className={`shadow-xl border-0 bg-gradient-to-br from-card to-card/50 transition-all duration-500 hover:shadow-2xl ${
          isAnimating ? 'animate-scale-out' : 'animate-scale-in'
        }`}>
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Badge variant="secondary" className="w-fit mx-auto hover-scale">
                <Star className="w-3 h-3 mr-1" />
                Setup Inteligente
              </Badge>
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Bem-vindo ao Daton! 🌱
              </CardTitle>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                Sua plataforma de gestão ESG está pronta. 
                <span className="font-semibold text-foreground"> Configure em 3 minutos</span> e comece a usar!
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Benefits - Animated */}
            <div className="grid gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                {
                  icon: CheckCircle,
                  title: "8 Módulos Prontos",
                  subtitle: "ESG, Qualidade, RH e Performance",
                  color: "text-green-600"
                },
                {
                  icon: Sparkles,
                  title: "Configuração Automática", 
                  subtitle: "IA sugere as melhores opções",
                  color: "text-blue-600"
                },
                {
                  icon: Clock,
                  title: "3 Minutos de Setup",
                  subtitle: "Progresso salvo automaticamente", 
                  color: "text-purple-600"
                }
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 hover:border-border/50 transition-all duration-300 hover-scale group"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-background shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow`}>
                      <Icon className={`w-5 h-5 ${benefit.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground">{benefit.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Indicator */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-muted animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-muted animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>Etapa 1 de 3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: '1s' }}>
          <Button 
            variant="outline"
            onClick={onSkip}
            size="lg"
            className="min-w-32 hover-scale"
          >
            Configurar Depois
          </Button>
          
          <Button 
            onClick={handleStartConfiguration}
            size="lg" 
            disabled={isAnimating}
            className="min-w-44 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all hover-scale group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Rocket className="mr-2 h-4 w-4 relative z-10" />
            <span className="relative z-10">Começar Setup Rápido</span>
            <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Dica:</span> Você pode personalizar tudo depois na configuração
          </p>
        </div>
      </div>
    </div>
  );
}