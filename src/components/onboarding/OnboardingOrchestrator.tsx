import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, CheckCircle2, ArrowRight, Clock, Target,
  Leaf, Shield, BarChart3, Users, FileText, Building, Database
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  route: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface OnboardingOrchestratorProps {
  completedModules?: string[];
}

export function OnboardingOrchestrator({ completedModules = [] }: OnboardingOrchestratorProps) {
  const { shouldShowOnboarding, skipOnboarding } = useAuth();
  const navigate = useNavigate();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'config-org',
      title: 'Configure sua Organização',
      description: 'Defina dados básicos e estrutura organizacional',
      icon: <Building className="h-4 w-4" />,
      route: '/configuracao-organizacao',
      completed: completedModules.includes('organizacao'),
      priority: 'high'
    },
    {
      id: 'emissions',
      title: 'Cadastrar Fontes de Emissão',
      description: 'Adicione suas principais fontes de gases de efeito estufa',
      icon: <Leaf className="h-4 w-4" />,
      route: '/emissoes/fontes',
      completed: completedModules.includes('inventario_gee'),
      priority: 'high'
    },
    {
      id: 'licenses',
      title: 'Adicionar Licenças Ambientais',
      description: 'Cadastre e controle suas licenças e autorizações',
      icon: <Shield className="h-4 w-4" />,
      route: '/licenciamento',
      completed: completedModules.includes('gestao_licencas'),
      priority: 'high'
    },
    {
      id: 'quality',
      title: 'Sistema de Qualidade',
      description: 'Defina processos e registre não conformidades',
      icon: <BarChart3 className="h-4 w-4" />,
      route: '/qualidade/nao-conformidades',
      completed: completedModules.includes('sistema_qualidade'),
      priority: 'medium'
    },
    {
      id: 'training',
      title: 'Programas de Treinamento',
      description: 'Desenvolva e gerencie capacitações da equipe',
      icon: <Users className="h-4 w-4" />,
      route: '/pessoas/treinamentos',
      completed: completedModules.includes('treinamentos'),
      priority: 'medium'
    },
    {
      id: 'documents',
      title: 'Organizar Documentos',
      description: 'Upload e controle de políticas e procedimentos',
      icon: <FileText className="h-4 w-4" />,
      route: '/documentos',
      completed: completedModules.includes('documentos'),
      priority: 'low'
    }
  ];

  const totalSteps = onboardingSteps.length;
  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const completionPercentage = (completedSteps / totalSteps) * 100;
  const isComplete = completionPercentage === 100;
  const pendingSteps = onboardingSteps.filter(step => !step.completed);

  const handleStartOnboarding = () => {
    navigate('/onboarding');
  };

  const handleSkipOnboarding = async () => {
    try {
      await skipOnboarding();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  // Estado completo
  if (isComplete) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Configuração Concluída!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sua plataforma Daton está completamente configurada. Todos os {totalSteps} módulos foram ativados com dados reais.
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-success border-success/30">
                {completedSteps}/{totalSteps} módulos ativos
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/relatorios')}
              >
                Ver Relatórios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado inicial - nunca começou
  if (shouldShowOnboarding && completedSteps === 0) {
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
              <span>{totalSteps} passos essenciais</span>
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

  // Estado em progresso - mostrar próximos passos
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Primeiros Passos</CardTitle>
          <Badge variant="outline">
            {completedSteps}/{totalSteps} concluídos
          </Badge>
        </div>
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

          <p className="text-sm text-muted-foreground">
            Complete estes passos para aproveitar ao máximo sua plataforma ESG.
          </p>
          
          <div className="space-y-2">
            {pendingSteps.slice(0, 3).map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(step.route)}
              >
                <div className={`p-2 rounded-lg ${getPriorityColor(step.priority)}`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {getPriorityLabel(step.priority)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                
                <Button variant="ghost" size="sm">
                  Fazer
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {pendingSteps.length > 3 && (
            <div className="text-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleStartOnboarding}
              >
                Ver todos os {pendingSteps.length} passos restantes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
