import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, CheckCircle2, ArrowRight, Clock, Target,
  Leaf, Shield, BarChart3, Users, FileText, Building
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

  // Estado completo
  if (isComplete) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Configuração Concluída</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Sua plataforma está completamente configurada com {totalSteps} módulos ativos.
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/relatorios')}
            className="w-full"
          >
            Ver Relatórios
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Estado inicial - nunca começou
  if (shouldShowOnboarding && completedSteps === 0) {
    return (
      <div className="border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Complete Sua Configuração</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Configure sua plataforma em poucos minutos criando seus primeiros dados reais em cada módulo.
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>5-10 min</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{totalSteps} passos</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleStartOnboarding}
              size="sm" 
              className="flex-1"
            >
              Começar Agora
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
      </div>
    );
  }

  // Estado em progresso - mostrar próximos passos
  return (
    <div className="border rounded-lg p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Primeiros Passos</h3>
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{totalSteps}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-1.5" />
        </div>

        <p className="text-sm text-muted-foreground">
          Complete estes passos para aproveitar ao máximo sua plataforma.
        </p>
        
        <div className="space-y-2">
          {pendingSteps.slice(0, 3).map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => navigate(step.route)}
            >
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                {step.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>

        {pendingSteps.length > 3 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleStartOnboarding}
            className="w-full"
          >
            Ver todos os {pendingSteps.length} passos restantes
          </Button>
        )}
      </div>
    </div>
  );
}
