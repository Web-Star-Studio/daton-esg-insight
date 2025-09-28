import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, CheckCircle2, Settings, 
  ArrowRight, Clock, Target 
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingDashboardWidgetProps {
  completedModules?: string[];
  totalModules?: number;
  showWidget?: boolean;
}

export function OnboardingDashboardWidget({ 
  completedModules = [], 
  totalModules = 5,
  showWidget = true 
}: OnboardingDashboardWidgetProps) {
  const { shouldShowOnboarding, skipOnboarding } = useAuth();
  const navigate = useNavigate();

  // Don't show widget if onboarding is not needed or not enabled
  if (!showWidget && !shouldShowOnboarding) return null;

  const completionPercentage = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;
  const isComplete = completionPercentage === 100;

  const handleStartOnboarding = () => {
    navigate('/');
  };

  const handleSkipOnboarding = async () => {
    try {
      await skipOnboarding();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  if (isComplete) {
    // Show success state for completed onboarding
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Configuração Concluída!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-green-700">
              Sua plataforma Daton está completamente configurada. Todos os {totalModules} módulos foram ativados com dados reais.
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-green-700 border-green-300">
                {completedModules.length}/{totalModules} módulos ativos
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/relatorios')}
              >
                Ver Relatórios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (shouldShowOnboarding) {
    // Show initial onboarding prompt
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Complete Sua Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure sua plataforma em poucos minutos criando seus primeiros dados reais em cada módulo.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>5-10 minutos</span>
              <span>•</span>
              <Target className="h-3 w-3" />
              <span>Aprenda fazendo</span>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleStartOnboarding}
                size="sm" 
                className="flex-1"
              >
                Começar Agora
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSkipOnboarding}
              >
                Pular
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show progress state for partial completion
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Settings className="h-5 w-5" />
          Configuração em Andamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              {completedModules.length}/{totalModules} módulos
            </Badge>
            <Button 
              size="sm"
              onClick={handleStartOnboarding}
            >
              Continuar Setup
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}