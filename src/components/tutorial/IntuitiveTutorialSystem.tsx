import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  CheckCircle, 
  Lightbulb,
  ArrowRight,
  Eye,
  Hand,
  Target,
  X
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: 'highlight' | 'click' | 'navigate' | 'wait';
  target?: string;
  tip?: string;
}

interface IntuitiveTutorialSystemProps {
  isActive: boolean;
  tutorialId: string;
  onComplete: () => void;
  onClose: () => void;
}

const TUTORIAL_FLOWS = {
  'dashboard-intro': [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Dashboard! 👋',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades',
      action: 'wait',
      tip: 'Este tour leva apenas 2 minutos'
    },
    {
      id: 'sidebar',
      title: 'Menu Principal',
      description: 'Aqui estão todos os módulos da plataforma',
      action: 'highlight',
      target: '[data-sidebar]',
      tip: 'Clique em qualquer item para navegar'
    },
    {
      id: 'kpis',
      title: 'Indicadores Principais',
      description: 'Seus KPIs mais importantes ficam aqui em destaque',
      action: 'highlight', 
      target: '[data-kpis]',
      tip: 'Os dados são atualizados em tempo real'
    },
    {
      id: 'notifications',
      title: 'Central de Notificações',
      description: 'Fique por dentro de alertas e lembretes importantes',
      action: 'highlight',
      target: '[data-notifications]',
      tip: 'Configure quais notificações receber'
    },
    {
      id: 'profile',
      title: 'Seu Perfil',
      description: 'Acesse configurações e preferências pessoais',
      action: 'highlight',
      target: '[data-profile]',
      tip: 'Personalize sua experiência aqui'
    }
  ],
  'module-basics': [
    {
      id: 'module-intro',
      title: 'Explorando Módulos',
      description: 'Cada módulo tem funcionalidades específicas para sua área',
      action: 'wait',
      tip: 'Focamos no que você mais usa'
    },
    {
      id: 'data-entry',
      title: 'Entrada de Dados',
      description: 'Adicione informações de forma simples e rápida',
      action: 'highlight',
      target: '[data-add-button]',
      tip: 'Formulários inteligentes facilitam o preenchimento'
    },
    {
      id: 'reports',
      title: 'Relatórios Automáticos',
      description: 'Gere relatórios profissionais em poucos cliques',
      action: 'highlight',
      target: '[data-reports]',
      tip: 'Exports em PDF, Excel e mais formatos'
    }
  ]
};

const ACTION_ICONS = {
  highlight: Eye,
  click: Hand, 
  navigate: ArrowRight,
  wait: Lightbulb
};

export function IntuitiveTutorialSystem({ 
  isActive, 
  tutorialId, 
  onComplete, 
  onClose 
}: IntuitiveTutorialSystemProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  const tutorial = TUTORIAL_FLOWS[tutorialId] || [];
  const currentStep = tutorial[currentStepIndex];
  const progress = ((currentStepIndex + 1) / tutorial.length) * 100;

  useEffect(() => {
    if (!isActive || !currentStep) return;

    const highlightElement = () => {
      if (currentStep.target) {
        const element = document.querySelector(currentStep.target);
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight effect
          element.classList.add('tutorial-highlight');
          
          return () => {
            element.classList.remove('tutorial-highlight');
          };
        }
      }
    };

    const cleanup = highlightElement();
    
    return cleanup;
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setHighlightedElement(null);
    }
  }, [isActive]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !isActive) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 4000); // 4 seconds per step

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, isActive]);

  const handleNext = () => {
    if (currentStepIndex < tutorial.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsPlaying(false);
    onComplete();
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  if (!isActive || !currentStep) return null;

  const ActionIcon = ACTION_ICONS[currentStep.action];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={onClose} />
      
      {/* Tutorial Card */}
      <Card className="fixed bottom-6 right-6 w-80 z-50 shadow-2xl border-0 animate-slide-in-right">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ActionIcon className="w-5 h-5 text-primary" />
              Tutorial Interativo
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="w-8 h-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Passo {currentStepIndex + 1} de {tutorial.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Step Content */}
          <div className="space-y-3 animate-fade-in">
            <h4 className="font-semibold text-foreground">
              {currentStep.title}
            </h4>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>
            
            {currentStep.tip && (
              <div className="p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Dica:</strong> {currentStep.tip}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reiniciar
            </Button>

            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Play
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="w-8 h-8 p-0"
              >
                ←
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                className="gap-1 hover-scale"
              >
                {currentStepIndex === tutorial.length - 1 ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <SkipForward className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Styles for Highlighting */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                      0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          border-radius: 8px !important;
          animation: tutorial-pulse 2s ease-in-out infinite;
        }
        
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                        0 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.7), 
                        0 0 0 16px rgba(59, 130, 246, 0.1);
          }
        }
      `}</style>
    </>
  );
}