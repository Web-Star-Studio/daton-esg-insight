import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Settings, BarChart, Clock, Users, Shield, Leaf } from "lucide-react";

interface EnhancedWelcomeStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function EnhancedWelcomeStep({ onNext, onSkip }: EnhancedWelcomeStepProps) {
  const benefits = [
    {
      icon: <Settings className="h-5 w-5 text-blue-600" />,
      title: "Configuração Inteligente",
      description: "Sistema se adapta às suas necessidades específicas com sugestões inteligentes",
      highlight: "IA integrada"
    },
    {
      icon: <BarChart className="h-5 w-5 text-green-600" />,
      title: "Dados Reais Desde o Início",
      description: "Criamos seus primeiros registros reais em cada módulo durante o setup",
      highlight: "Pronto para usar"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Card */}
        <Card className="shadow-xl border-border/40 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Rocket className="h-10 w-10 text-primary-foreground animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant="secondary" className="px-3 py-1">
                  🚀 Setup Inteligente
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Bem-vindo ao Daton!
              </CardTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Sua plataforma de gestão ESG e sustentabilidade está quase pronta. 
                Vamos configurar os módulos essenciais e criar seus <strong>primeiros dados reais</strong> em apenas alguns minutos.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-6 rounded-lg border border-border/50 bg-card/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-background shadow-sm">
                        {benefit.icon}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {benefit.highlight}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
                    <strong>5-8 minutos</strong> para configuração completa. Seu progresso é salvo automaticamente.
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
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={onSkip}
            size="lg"
            className="min-w-40 hover:bg-muted/50"
          >
            Configurar Depois
          </Button>
          <Button 
            onClick={onNext}
            size="lg" 
            className="min-w-52 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Começar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
}