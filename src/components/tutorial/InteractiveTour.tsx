import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ArrowRight, ArrowLeft, Target } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const TOUR_DEFINITIONS = {
  'dashboard-intro': [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Dashboard',
      description: 'Esta é sua visão geral da plataforma. Aqui você encontra métricas importantes e acesso rápido aos módulos.',
      target: '[data-tour="dashboard-main"]',
      placement: 'bottom' as const
    },
    {
      id: 'sidebar',
      title: 'Menu de Navegação',
      description: 'Use este menu para navegar entre os diferentes módulos da plataforma.',
      target: '[data-tour="sidebar"]',
      placement: 'right' as const
    },
    {
      id: 'stats',
      title: 'Estatísticas Principais',
      description: 'Estas métricas mostram o status geral dos seus dados e processos.',
      target: '[data-tour="stats-cards"]',
      placement: 'top' as const
    }
  ],
  'performance-module': [
    {
      id: 'module-intro',
      title: 'Gestão de Desempenho',
      description: 'Este módulo permite gerenciar avaliações, metas e desenvolvimento de colaboradores.',
      target: '[data-tour="performance-header"]',
      placement: 'bottom' as const
    },
    {
      id: 'evaluation-cycles',
      title: 'Ciclos de Avaliação',
      description: 'Aqui você pode criar e gerenciar ciclos de avaliação de desempenho.',
      target: '[data-tour="evaluation-cycles"]',
      placement: 'top' as const
    },
    {
      id: 'quick-actions',
      title: 'Ações Rápidas',
      description: 'Use estes botões para criar rapidamente novos colaboradores ou ciclos.',
      target: '[data-tour="quick-actions"]',
      placement: 'left' as const
    }
  ],
  'emissions-basics': [
    {
      id: 'emissions-intro',
      title: 'Gestão de Emissões',
      description: 'Monitore e calcule as emissões de gases de efeito estufa da sua organização.',
      target: '[data-tour="emissions-header"]',
      placement: 'bottom' as const
    },
    {
      id: 'emission-sources',
      title: 'Fontes de Emissão',
      description: 'Configure e gerencie as diferentes fontes de emissão da sua empresa.',
      target: '[data-tour="emission-sources"]',
      placement: 'top' as const
    }
  ]
};

export function InteractiveTour() {
  const { currentTour, currentStep, nextStep, prevStep, completeTour } = useTutorial();
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (currentTour && TOUR_DEFINITIONS[currentTour as keyof typeof TOUR_DEFINITIONS]) {
      setTourSteps(TOUR_DEFINITIONS[currentTour as keyof typeof TOUR_DEFINITIONS]);
    }
  }, [currentTour]);

  useEffect(() => {
    if (currentTour && tourSteps.length > 0 && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        
        // Scroll para o elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Calcular posição do overlay
        const rect = element.getBoundingClientRect();
        setOverlayPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, [currentTour, currentStep, tourSteps]);

  if (!currentTour || tourSteps.length === 0 || currentStep >= tourSteps.length) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  
  const getTooltipPosition = () => {
    if (!targetElement) return {};
    
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 16;
    
    switch (currentStepData.placement) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - margin,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
      case 'bottom':
        return {
          top: rect.bottom + margin,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
      case 'left':
        return {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.left - tooltipWidth - margin
        };
      case 'right':
        return {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.right + margin
        };
      default:
        return {
          top: rect.bottom + margin,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 pointer-events-auto"
        onClick={completeTour}
      />
      
      {/* Spotlight no elemento alvo */}
      {targetElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: overlayPosition.top - 4,
            left: overlayPosition.left - 4,
            width: overlayPosition.width + 8,
            height: overlayPosition.height + 8,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px'
          }}
        />
      )}

      {/* Tooltip do tour */}
      <Card 
        className="fixed z-50 w-80 shadow-xl border-primary/20"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <Badge variant="outline" className="text-xs">
                {currentStep + 1} de {tourSteps.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={completeTour}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              <Button 
                size="sm"
                onClick={currentStep === tourSteps.length - 1 ? completeTour : nextStep}
              >
                {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                {currentStep !== tourSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}