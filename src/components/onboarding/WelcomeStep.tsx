import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Rocket, Settings, BarChart } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const benefits = [
    {
      icon: <Settings className="h-5 w-5 text-primary" />,
      title: "Configuração Personalizada",
      description: "Configure apenas os módulos que sua empresa realmente precisa"
    },
    {
      icon: <BarChart className="h-5 w-5 text-primary" />,
      title: "Insights Imediatos",
      description: "Comece a gerar relatórios e análises desde o primeiro dia"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
      title: "Implementação Rápida",
      description: "Setup completo em apenas alguns minutos"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl shadow-xl border-border/40">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              Bem-vindo ao Daton!
            </CardTitle>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Vamos ativar e configurar os módulos essenciais para sua jornada de gestão. 
              <strong>Aprenda fazendo</strong> - você criará seus primeiros dados reais em cada módulo.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid gap-6">
            <h3 className="text-xl font-semibold text-foreground text-center">
              O que você vai conseguir:
            </h3>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {benefit.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm text-foreground">Estimativa de tempo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Este processo leva aproximadamente <strong>5-10 minutos</strong> e pode ser pausado a qualquer momento. Seu progresso será salvo automaticamente.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button 
              variant="outline"
              onClick={() => {
                // Skip onboarding - implement later
                console.log('Skip onboarding');
              }}
              size="lg"
              className="min-w-32"
            >
              Pular e configurar depois
            </Button>
            <Button 
              onClick={onNext}
              size="lg" 
              className="min-w-48"
            >
              Começar Setup
              <Rocket className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}