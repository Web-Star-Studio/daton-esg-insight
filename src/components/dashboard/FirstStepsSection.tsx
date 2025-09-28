import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, ArrowRight, FileText, 
  Shield, BarChart3, Users, Leaf 
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface FirstStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  route: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface FirstStepsSectionProps {
  completedModules?: string[];
}

export function FirstStepsSection({ completedModules = [] }: FirstStepsSectionProps) {
  const navigate = useNavigate();

  const firstSteps: FirstStep[] = [
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
      title: 'Configurar Sistema de Qualidade',
      description: 'Defina processos e registre não conformidades',
      icon: <BarChart3 className="h-4 w-4" />,
      route: '/qualidade/nao-conformidades',
      completed: completedModules.includes('sistema_qualidade'),
      priority: 'medium'
    },
    {
      id: 'training',
      title: 'Criar Programas de Treinamento',
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

  const pendingSteps = firstSteps.filter(step => !step.completed);
  const completedSteps = firstSteps.filter(step => step.completed);

  if (pendingSteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Primeiros Passos Concluídos!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Parabéns! Você completou todos os passos iniciais essenciais. 
            Sua plataforma está pronta para uso avançado.
          </p>
          <Button onClick={() => navigate('/relatorios')}>
            Gerar Primeiro Relatório
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Primeiros Passos</CardTitle>
          <Badge variant="outline">
            {completedSteps.length}/{firstSteps.length} completos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Complete estes passos para aproveitar ao máximo sua plataforma ESG.
          </p>
          
          <div className="space-y-2">
            {pendingSteps.slice(0, 3).map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  step.priority === 'high' ? 'bg-red-100 text-red-600' :
                  step.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(step.route)}
                >
                  Fazer
                </Button>
              </div>
            ))}
          </div>

          {pendingSteps.length > 3 && (
            <div className="text-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/onboarding')}
              >
                Ver todos os {pendingSteps.length} passos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}