import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Clock, 
  Users, 
  Zap,
  ChevronRight,
  Play
} from 'lucide-react';

interface UserBehaviorPattern {
  hesitationPoints: number[];
  quickSteps: number[];
  timeSpentPerStep: number[];
  backtrackingPattern: boolean;
  helpSeekingBehavior: 'high' | 'medium' | 'low';
}

interface AdaptiveGuide {
  id: string;
  step: number;
  title: string;
  description: string;
  actionText: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  adaptedFor: 'beginner' | 'advanced' | 'uncertain' | 'rushed';
  estimatedTime: string;
  onAction?: () => void;
}

interface AdaptiveGuidanceSystemProps {
  currentStep: number;
  userBehavior: UserBehaviorPattern;
  onGuidanceAction: (actionId: string) => void;
}

export function AdaptiveGuidanceSystem({
  currentStep,
  userBehavior,
  onGuidanceAction
}: AdaptiveGuidanceSystemProps) {
  const [activeGuides, setActiveGuides] = useState<AdaptiveGuide[]>([]);
  const [userProfile, setUserProfile] = useState<'beginner' | 'advanced' | 'uncertain' | 'rushed'>('beginner');

  const analyzeUserProfile = (behavior: UserBehaviorPattern) => {
    const avgTimePerStep = behavior.timeSpentPerStep.reduce((sum, time) => sum + time, 0) / behavior.timeSpentPerStep.length;
    const hesitationRatio = behavior.hesitationPoints.length / 4; // Assuming 4 total steps
    const quickRatio = behavior.quickSteps.length / 4;

    if (avgTimePerStep < 30 && quickRatio > 0.5) {
      return 'rushed';
    } else if (hesitationRatio > 0.5 || behavior.helpSeekingBehavior === 'high') {
      return 'uncertain';
    } else if (avgTimePerStep > 120 && behavior.backtrackingPattern) {
      return 'beginner';
    } else {
      return 'advanced';
    }
  };

  const generateAdaptiveGuides = (step: number, profile: typeof userProfile): AdaptiveGuide[] => {
    const guides: AdaptiveGuide[] = [];

    switch (step) {
      case 0: // Welcome
        if (profile === 'rushed') {
          guides.push({
            id: 'quick_start',
            step: 0,
            title: 'Configuração Rápida Disponível',
            description: 'Use nossas recomendações inteligentes para configurar em menos de 5 minutos.',
            actionText: 'Ativar Modo Rápido',
            priority: 'high',
            adaptedFor: 'rushed',
            estimatedTime: '3-5 min'
          });
        } else if (profile === 'beginner') {
          guides.push({
            id: 'guided_tour',
            step: 0,
            title: 'Tour Guiado Recomendado',
            description: 'Vamos te orientar passo a passo para uma configuração completa e segura.',
            actionText: 'Iniciar Tour',
            priority: 'high',
            adaptedFor: 'beginner',
            estimatedTime: '10-15 min'
          });
        }
        break;

      case 1: // Module Selection
        if (profile === 'uncertain') {
          guides.push({
            id: 'smart_recommendations',
            step: 1,
            title: 'Deixe a IA Escolher por Você',
            description: 'Nossas recomendações inteligentes selecionarão os módulos ideais baseado no seu perfil.',
            actionText: 'Ver Recomendações',
            priority: 'critical',
            adaptedFor: 'uncertain',
            estimatedTime: '2 min'
          });
        }

        if (profile === 'advanced') {
          guides.push({
            id: 'advanced_config',
            step: 1,
            title: 'Configuração Avançada',
            description: 'Acesse opções avançadas para customizar completamente seus módulos.',
            actionText: 'Modo Avançado',
            priority: 'medium',
            adaptedFor: 'advanced',
            estimatedTime: '5-10 min'
          });
        }

        if (profile === 'rushed') {
          guides.push({
            id: 'preset_packages',
            step: 1,
            title: 'Pacotes Pré-Configurados',
            description: 'Escolha um pacote pronto baseado no seu setor e comece imediatamente.',
            actionText: 'Ver Pacotes',
            priority: 'high',
            adaptedFor: 'rushed',
            estimatedTime: '1 min'
          });
        }
        break;

      case 2: // Configuration
        if (profile === 'beginner') {
          guides.push({
            id: 'step_by_step_config',
            step: 2,
            title: 'Configuração Passo a Passo',
            description: 'Vamos configurar cada módulo individualmente com explicações detalhadas.',
            actionText: 'Configurar Gradualmente',
            priority: 'high',
            adaptedFor: 'beginner',
            estimatedTime: '3-5 min por módulo'
          });
        }

        if (userBehavior.hesitationPoints.includes(2)) {
          guides.push({
            id: 'help_wizard',
            step: 2,
            title: 'Assistente de Configuração',
            description: 'Parece que você está com dúvidas. Use nosso assistente inteligente.',
            actionText: 'Abrir Assistente',
            priority: 'critical',
            adaptedFor: 'uncertain',
            estimatedTime: '5 min'
          });
        }
        break;

      case 3: // Completion
        guides.push({
          id: 'personalized_insights',
          step: 3,
          title: 'Seus Insights Personalizados',
          description: 'Veja um resumo personalizado da sua configuração e próximos passos recomendados.',
          actionText: 'Ver Insights',
          priority: 'medium',
          adaptedFor: profile,
          estimatedTime: '2 min'
        });
        break;
    }

    return guides.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  useEffect(() => {
    const profile = analyzeUserProfile(userBehavior);
    setUserProfile(profile);
    
    const guides = generateAdaptiveGuides(currentStep, profile);
    setActiveGuides(guides.slice(0, 2)); // Show max 2 guides
  }, [currentStep, userBehavior]);

  const getPriorityColor = (priority: AdaptiveGuide['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProfileIcon = (profile: typeof userProfile) => {
    switch (profile) {
      case 'rushed': return <Zap className="h-4 w-4" />;
      case 'beginner': return <Users className="h-4 w-4" />;
      case 'uncertain': return <Lightbulb className="h-4 w-4" />;
      case 'advanced': return <Target className="h-4 w-4" />;
    }
  };

  const getProfileDescription = (profile: typeof userProfile) => {
    switch (profile) {
      case 'rushed': return 'Usuário rápido - prefere eficiência';
      case 'beginner': return 'Novo usuário - precisa de orientação';
      case 'uncertain': return 'Usuário cauteloso - busca segurança';
      case 'advanced': return 'Usuário experiente - quer controle';
    }
  };

  if (activeGuides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* User Profile Indicator */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              {getProfileIcon(userProfile)}
            </div>
            <div>
              <h4 className="font-medium text-indigo-800 text-sm">
                Orientação Personalizada
              </h4>
              <p className="text-xs text-indigo-600">
                {getProfileDescription(userProfile)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Guides */}
      {activeGuides.map((guide) => (
        <Card key={guide.id} className={`border ${getPriorityColor(guide.priority)}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm">{guide.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {guide.priority}
                  </Badge>
                </div>
                <p className="text-sm opacity-90 mb-3">{guide.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {guide.estimatedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Adaptado para seu perfil
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => onGuidanceAction(guide.id)}
                className="ml-4 flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                {guide.actionText}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}