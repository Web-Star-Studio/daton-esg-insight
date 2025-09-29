import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTutorial } from '@/contexts/TutorialContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Play, 
  Pause, 
  RotateCcw,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  tip?: string;
  highlight?: boolean;
}

const ENHANCED_TOUR_DEFINITIONS = {
  'dashboard-intro': [
    {
      id: 'welcome',
      title: 'Bem-vindo ao seu Dashboard! 🎉',
      description: 'Este é seu centro de controle. Aqui você encontra um resumo de todas as atividades e pode navegar para qualquer módulo.',
      target: '[data-tour="dashboard-main"]',
      placement: 'bottom' as const,
      tip: 'Dica: Use Ctrl+D para marcar como favorito e acessar rapidamente.',
      highlight: true
    },
    {
      id: 'sidebar',
      title: 'Menu de Navegação',
      description: 'Este menu lateral dá acesso a todos os módulos que você configurou durante o onboarding.',
      target: '[data-tour="sidebar"]',
      placement: 'right' as const,
      tip: 'O menu se adapta automaticamente aos módulos que você selecionou.',
      highlight: true
    },
    {
      id: 'stats',
      title: 'Métricas em Tempo Real',
      description: 'Acompanhe os principais indicadores de performance, qualidade e sustentabilidade da sua organização.',
      target: '[data-tour="stats-cards"]',
      placement: 'top' as const,
      tip: 'As métricas são atualizadas automaticamente conforme você adiciona dados.',
      highlight: true
    },
    {
      id: 'quick-actions',
      title: 'Ações Rápidas',
      description: 'Acesse rapidamente as funcionalidades mais utilizadas sem navegar pelos menus.',
      target: '[data-tour="quick-actions"]',
      placement: 'left' as const,
      tip: 'Personalize estas ações nas configurações do seu perfil.',
      highlight: false
    }
  ],
  'performance-module': [
    {
      id: 'module-intro',
      title: 'Módulo de Performance 📊',
      description: 'Gerencie ciclos de avaliação, defina metas e acompanhe o desenvolvimento dos colaboradores.',
      target: '[data-tour="performance-header"]',
      placement: 'bottom' as const,
      highlight: true
    },
    {
      id: 'evaluation-cycles',
      title: 'Ciclos de Avaliação',
      description: 'Crie e gerencie ciclos de avaliação periódicos com diferentes critérios e participantes.',
      target: '[data-tour="evaluation-cycles"]',
      placement: 'top' as const,
      tip: 'Recomendamos ciclos semestrais ou anuais para melhores resultados.',
      highlight: true
    },
    {
      id: 'goals-management',
      title: 'Gestão de Metas',
      description: 'Defina metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais) para equipes e indivíduos.',
      target: '[data-tour="goals-section"]',
      placement: 'top' as const,
      highlight: true
    }
  ],
  'quality-module': [
    {
      id: 'quality-intro',
      title: 'Sistema de Gestão da Qualidade 🏆',
      description: 'Mantenha conformidade com normas ISO, gerencie auditorias e controle não conformidades.',
      target: '[data-tour="quality-header"]',
      placement: 'bottom' as const,
      highlight: true
    },
    {
      id: 'audit-management',
      title: 'Gestão de Auditorias',
      description: 'Programe, execute e acompanhe auditorias internas e externas.',
      target: '[data-tour="audit-section"]',
      placement: 'top' as const,
      tip: 'Configure lembretes automáticos para auditorias recorrentes.',
      highlight: true
    }
  ]
};

export function EnhancedInteractiveTour() {
  const { currentTour, currentStep, nextStep, prevStep, completeTour } = useTutorial();
  const isMobile = useIsMobile();
  
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (currentTour && ENHANCED_TOUR_DEFINITIONS[currentTour as keyof typeof ENHANCED_TOUR_DEFINITIONS]) {
      setTourSteps(ENHANCED_TOUR_DEFINITIONS[currentTour as keyof typeof ENHANCED_TOUR_DEFINITIONS]);
    }
  }, [currentTour]);

  useEffect(() => {
    if (currentTour && tourSteps.length > 0 && currentStep < tourSteps.length && !isPaused) {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        
        // Scroll suave para o elemento
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Calcular posição do overlay com delay para permitir scroll
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setOverlayPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 500);
      }
    }
  }, [currentTour, currentStep, tourSteps, isPaused]);

  if (!currentTour || tourSteps.length === 0 || currentStep >= tourSteps.length) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  const getTooltipPosition = (): { top: number; left: number } => {
    if (!targetElement) return { top: 0, left: 0 };
    
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = isMobile ? 300 : 360;
    const tooltipHeight = 220;
    const margin = 16;
    
    let position: { top: number; left: number };
    
    // Mobile-specific positioning
    if (isMobile) {
      // Always show at bottom on mobile for better usability
      position = {
        top: rect.bottom + margin,
        left: Math.max(margin, Math.min(
          window.innerWidth - tooltipWidth - margin,
          rect.left + (rect.width / 2) - (tooltipWidth / 2)
        ))
      };
    } else {
      // Desktop positioning logic
      switch (currentStepData.placement) {
        case 'top':
          position = {
            top: rect.top - tooltipHeight - margin,
            left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
          };
          break;
        case 'bottom':
          position = {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
          };
          break;
        case 'left':
          position = {
            top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
            left: rect.left - tooltipWidth - margin
          };
          break;
        case 'right':
          position = {
            top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
            left: rect.right + margin
          };
          break;
        default:
          position = {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
          };
      }
      
      // Ensure tooltip stays within viewport
      if (position.left < margin) position.left = margin;
      if (position.left + tooltipWidth > window.innerWidth - margin) {
        position.left = window.innerWidth - tooltipWidth - margin;
      }
      if (position.top < margin) position.top = margin;
    }
    
    return position;
  };

  const tooltipPosition = getTooltipPosition();

  const handlePause = () => setIsPaused(!isPaused);
  const handleRestart = () => {
    setIsPaused(false);
    // Restart tour logic could go here
  };

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 pointer-events-auto transition-opacity duration-300"
        onClick={completeTour}
      />
      
      {/* Spotlight on target element */}
      {targetElement && currentStepData.highlight && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-500"
          style={{
            top: overlayPosition.top - 8,
            left: overlayPosition.left - 8,
            width: overlayPosition.width + 16,
            height: overlayPosition.height + 16,
            boxShadow: `
              0 0 0 4px rgba(59, 130, 246, 0.6), 
              0 0 0 8px rgba(59, 130, 246, 0.3),
              0 0 0 9999px rgba(0, 0, 0, 0.6)
            `,
            borderRadius: '12px'
          }}
        />
      )}

      {/* Enhanced tooltip */}
      <Card 
        className={`fixed z-50 shadow-2xl border-primary/20 transition-all duration-300 ${
          isMobile ? 'w-[300px]' : 'w-[360px]'
        }`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <CardContent className="p-6">
          {/* Header with progress */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-xs font-medium">
                  {currentStep + 1} de {tourSteps.length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePause}
                  className="h-8 w-8 p-0"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRestart}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={completeTour}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Progress value={progress} className="w-full h-2" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-base mb-2 leading-tight">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Tip section */}
            {currentStepData.tip && (
              <div 
                className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/50 cursor-pointer transition-all hover:bg-blue-50"
                onClick={() => setShowTip(!showTip)}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {showTip ? 'Ocultar dica' : 'Ver dica útil'}
                  </span>
                </div>
                {showTip && (
                  <p className="text-xs text-blue-700 mt-2 animate-fade-in">
                    {currentStepData.tip}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0 || isPaused}
                className="flex-1 mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              <Button 
                size="sm"
                onClick={currentStep === tourSteps.length - 1 ? completeTour : nextStep}
                disabled={isPaused}
                className={`flex-1 ml-2 ${
                  currentStep === tourSteps.length - 1 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}