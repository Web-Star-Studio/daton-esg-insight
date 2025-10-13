import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Rocket, Leaf, ArrowRight, Clock, Star, Sparkles, Info } from "lucide-react";
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
    <TooltipProvider>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="w-full max-w-2xl space-y-8">
          {/* Main Welcome Card com design aprimorado */}
          <Card className={`shadow-2xl border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,191,99,0.15)] ${
            isAnimating ? 'animate-scale-out' : 'animate-scale-in'
          }`}>
            <CardHeader className="text-center pb-6 sm:pb-8">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl shadow-primary/20 animate-pulse">
                <Leaf className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl sm:rounded-3xl blur-lg -z-10"></div>
              </div>
              
              <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="w-fit mx-auto hover-scale cursor-help bg-gradient-to-r from-secondary to-secondary/80">
                      <Star className="w-3 h-3 mr-1 text-primary" />
                      Setup Inteligente
                      <Info className="w-3 h-3 ml-1 text-muted-foreground" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configuração guiada por IA para melhor experiência</p>
                  </TooltipContent>
                </Tooltip>
                
                <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent leading-tight">
                  Bem-vindo ao Daton! 🌱
                </CardTitle>
                
                <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed px-4">
                  Sua plataforma de gestão ESG está pronta. 
                  <span className="font-semibold text-foreground"> Configure em 3 minutos</span> e comece a usar!
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-4 sm:px-6">
              {/* Key Benefits - Animated com melhor design */}
              <div className="grid gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {[
                  {
                    icon: CheckCircle,
                    title: "8 Módulos Prontos",
                    subtitle: "ESG, Qualidade, RH e Performance",
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    tooltip: "Acesso completo a todos os módulos da plataforma"
                  },
                  {
                    icon: Sparkles,
                    title: "Configuração Automática", 
                    subtitle: "IA sugere as melhores opções",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50",
                    tooltip: "Inteligência artificial otimiza suas configurações"
                  },
                  {
                    icon: Clock,
                    title: "3 Minutos de Setup",
                    subtitle: "Progresso salvo automaticamente", 
                    color: "text-purple-600",
                    bgColor: "bg-purple-50",
                    tooltip: "Configure rapidamente e comece a usar"
                  }
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-muted/40 via-muted/20 to-muted/10 border border-border/40 hover:border-primary/30 transition-all duration-300 hover-scale group cursor-help"
                          style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                        >
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${benefit.bgColor} shadow-sm flex items-center justify-center group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                            <Icon className={`w-5 h-5 ${benefit.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-sm sm:text-base">{benefit.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.subtitle}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{benefit.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Progress Indicator com melhor design */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/20 animate-fade-in backdrop-blur-sm" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/80 animate-pulse shadow-sm shadow-primary/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="font-medium text-foreground">Etapa 1 de 3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons com melhor design */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in px-4" style={{ animationDelay: '1s' }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={onSkip}
                  size="lg"
                  className="min-w-full sm:min-w-40 hover-scale border-2 hover:border-primary/30 transition-all"
                >
                  Configurar Depois
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Você pode fazer a configuração depois no painel</p>
              </TooltipContent>
            </Tooltip>
            
            <Button 
              onClick={handleStartConfiguration}
              size="lg" 
              disabled={isAnimating}
              className="min-w-full sm:min-w-48 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary hover:via-primary/95 hover:to-primary/85 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all hover-scale group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Rocket className="mr-2 h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10 font-semibold">Começar Setup Rápido</span>
              <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Helper Text com melhor design */}
          <div className="text-center animate-fade-in px-4" style={{ animationDelay: '1.2s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30">
              <span className="text-xl">💡</span>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Dica:</span> Você pode personalizar tudo depois na configuração
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}