import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Rocket, Settings, BarChart, Clock, Users, Shield, Leaf, ArrowRight, Zap, Info } from "lucide-react";
import { OnboardingWelcomeAnimation } from "./OnboardingWelcomeAnimation";
import { CompanyProfileWizard } from "./CompanyProfileWizard";

interface EnhancedWelcomeStepProps {
  onNext: (profile?: any) => void;
  onSkip?: () => void;
}

export function EnhancedWelcomeStep({ onNext, onSkip }: EnhancedWelcomeStepProps) {
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showProfileWizard) {
        handleStartConfiguration();
      } else if (e.key === 'Escape' && onSkip) {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showProfileWizard, onSkip]);

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
      <div className="animate-fade-in">
        <CompanyProfileWizard
          onProfileComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      </div>
    );
  }
  const benefits = [
    {
      icon: <Settings className="h-5 w-5 text-blue-600" />,
      title: "Configuração Inteligente",
      description: "Sistema se adapta às suas necessidades específicas com sugestões inteligentes",
      highlight: "IA integrada"
    },
    {
      icon: <BarChart className="h-5 w-5 text-green-600" />,
      title: "Acesso Direto aos Módulos",
      description: "Navegue diretamente para cada funcionalidade com orientações personalizadas",
      highlight: "Sem complexidade"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-purple-600" />,
      title: "Implementação Guiada",
      description: "Passo a passo com explicações e validações automáticas",
      highlight: "Zero complexidade"
    }
  ];

  const modules = [
    { icon: <Leaf className="h-4 w-4" />, name: "Inventário GEE", color: "text-green-600" },
    { icon: <Shield className="h-4 w-4" />, name: "Licenças Ambientais", color: "text-blue-600" },
    { icon: <Users className="h-4 w-4" />, name: "Gestão de Pessoas", color: "text-purple-600" },
    { icon: <BarChart className="h-4 w-4" />, name: "Qualidade", color: "text-orange-600" }
  ];

  return (
    <TooltipProvider>
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 transition-all duration-700 ${
        isAnimating ? 'animate-scale-out opacity-0' : 'animate-fade-in'
      }`}>
        <div className="w-full max-w-4xl space-y-6">
          {/* Header Card */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(0,191,99,0.15)] transition-all duration-700">
          <CardHeader className="text-center space-y-6 pb-8">
            <OnboardingWelcomeAnimation />
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="px-3 py-1 hover-scale cursor-help bg-gradient-to-r from-secondary to-secondary/80">
                      <Zap className="w-3 h-3 mr-1 text-primary" />
                      Setup Inteligente
                      <Info className="w-3 h-3 ml-1 text-muted-foreground" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configuração guiada por IA para melhor experiência</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Bem-vindo ao Daton!
              </CardTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Sua plataforma de gestão ESG e sustentabilidade está pronta. 
                Vamos selecionar os módulos essenciais e criar <strong>atalhos personalizados</strong> para você começar rapidamente.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Benefits Grid - Enhanced */}
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div 
                      className="group relative animate-slide-up cursor-help"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative p-5 rounded-lg border border-border/50 bg-card/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover-scale">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-background to-muted shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                            {benefit.icon}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground text-sm">{benefit.title}</h4>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                {benefit.highlight}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para saber mais sobre {benefit.title}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Modules Preview */}
            <div className="bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl p-6 border border-border/50">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Módulos Disponíveis
                </h3>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {modules.map((module, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border/30 hover:shadow-sm transition-all duration-200">
                      <span className={module.color}>{module.icon}</span>
                      <span className="text-sm font-medium text-foreground">{module.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Estimate */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Tempo Estimado</h4>
                  <p className="text-sm text-blue-700">
                    <strong>3-5 minutos</strong> para configuração completa. Seu progresso é salvo automaticamente.
                  </p>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  Rápido & Fácil
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={onSkip}
                  size="lg"
                  disabled={isAnimating}
                  className="min-w-40 hover:bg-muted/50 hover-scale border-2 hover:border-primary/30 transition-all"
                >
                  Configurar Depois
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pressione <Badge variant="outline" className="text-[10px] mx-1">Esc</Badge> para pular</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleStartConfiguration}
                  size="lg"
                  disabled={isAnimating}
                  className="min-w-52 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary hover:via-primary/95 hover:to-primary/85 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all hover-scale group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Rocket className="mr-2 h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10 font-semibold">Começar Configuração Inteligente</span>
                  <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pressione <Badge variant="outline" className="text-[10px] mx-1">Enter</Badge> para começar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}