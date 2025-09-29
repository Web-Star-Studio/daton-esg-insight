import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  CheckCircle,
  Navigation,
  SkipForward,
  Clock,
  Zap,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  Leaf,
  Briefcase
} from 'lucide-react';

interface SmartTourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  page?: string; // Página onde o step deve ser executado
  action?: () => void;
  tip?: string;
  highlight?: boolean;
  autoAdvance?: boolean; // Auto avançar após delay
  delay?: number; // Delay em ms antes de auto avançar
  condition?: () => boolean; // Condição para mostrar o step
}

// Definições de tours inteligentes baseados no perfil do usuário
const SMART_TOUR_DEFINITIONS = {
  'complete-platform-tour': {
    title: 'Tour Completo da Plataforma',
    description: 'Conheça todas as funcionalidades principais do sistema',
    icon: BookOpen,
    totalSteps: 0, // Será calculado dinamicamente
    steps: [
      // Dashboard Overview
      {
        id: 'welcome-dashboard',
        title: '🎯 Bem-vindo ao Daton!',
        description: 'Este é seu centro de comando. Aqui você visualiza métricas importantes, acessa módulos e gerencia todas as atividades da plataforma.',
        target: '[data-tour="dashboard-main"]',
        placement: 'center' as const,
        page: '/',
        tip: 'Marque o dashboard como favorito (Ctrl+D) para acesso rápido.',
        highlight: true,
        autoAdvance: true,
        delay: 4000
      },
      {
        id: 'sidebar-navigation',
        title: '🧭 Navegação Inteligente',
        description: 'O menu lateral se adapta ao seu perfil e preferências. Use os favoritos para acesso rápido às funcionalidades mais utilizadas.',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/',
        tip: 'Clique na estrela ao lado de cada item para marcar como favorito.',
        highlight: true,
        delay: 3000
      },
      {
        id: 'stats-overview',
        title: '📊 Métricas em Tempo Real',
        description: 'Acompanhe KPIs importantes que são atualizados automaticamente conforme você utiliza o sistema.',
        target: '[data-tour="stats-cards"]',
        placement: 'top' as const,
        page: '/',
        tip: 'Clique em qualquer métrica para ver detalhes e relatórios específicos.',
        highlight: true,
        delay: 3000
      },
      {
        id: 'quick-actions',
        title: '⚡ Ações Rápidas',
        description: 'Acesse as funcionalidades mais comuns sem navegar pelos menus. Essas ações se adaptam ao seu uso.',
        target: '[data-tour="quick-actions"]',
        placement: 'bottom' as const,
        page: '/',
        tip: 'As ações rápidas mudam baseado nas suas atividades mais frequentes.',
        highlight: true,
        delay: 3000
      },

      // Gestão de Desempenho
      {
        id: 'navigate-performance',
        title: '👥 Módulo de Gestão de Desempenho',
        description: 'Vamos conhecer o módulo de gestão de pessoas e desempenho. Redirecionando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/',
        action: () => {},  // Será preenchido dinamicamente
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'performance-overview',
        title: '📈 Gestão de Desempenho',
        description: 'Aqui você gerencia ciclos de avaliação, define metas, acompanha desenvolvimento e monitora performance dos colaboradores.',
        target: '[data-tour="performance-header"]',
        placement: 'bottom' as const,
        page: '/gestao-desempenho',
        tip: 'Comece criando um ciclo de avaliação para estruturar o processo.',
        highlight: true,
        delay: 4000
      },
      {
        id: 'evaluation-cycles',
        title: '🔄 Ciclos de Avaliação',
        description: 'Configure períodos de avaliação (semestral, anual), defina critérios e gerencie todo o processo avaliativo.',
        target: '[data-tour="evaluation-cycles"]',
        placement: 'top' as const,
        page: '/gestao-desempenho',
        tip: 'Recomendamos ciclos semestrais para melhor acompanhamento.',
        highlight: true,
        delay: 3000
      },

      // ESG/Sustentabilidade 
      {
        id: 'navigate-esg',
        title: '🌱 Módulo ESG e Sustentabilidade',
        description: 'Agora vamos explorar o módulo de ESG e sustentabilidade. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/gestao-desempenho',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'esg-overview',
        title: '🌍 Gestão ESG Completa',
        description: 'Monitore emissões, gerencie projetos sustentáveis, acompanhe métricas sociais e mantenha governança transparente.',
        target: '[data-tour="esg-header"]',
        placement: 'bottom' as const,
        page: '/gestao-esg',
        tip: 'O módulo ESG integra dados de todas as suas operações automaticamente.',
        highlight: true,
        delay: 4000
      },

      // Qualidade
      {
        id: 'navigate-quality',
        title: '🏆 Sistema de Gestão da Qualidade',
        description: 'Vamos conhecer o módulo de qualidade e conformidade. Redirecionando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/gestao-esg',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'quality-overview',
        title: '✅ Gestão da Qualidade',
        description: 'Mantenha conformidade com normas ISO, gerencie auditorias, controle não conformidades e melhore processos continuamente.',
        target: '[data-tour="quality-header"]',
        placement: 'bottom' as const,
        page: '/qualidade',
        tip: 'Configure processos padronizados para automatizar a gestão da qualidade.',
        highlight: true,
        delay: 4000
      },

      // Finalização
      {
        id: 'tour-complete',
        title: '🎉 Tour Concluído!',
        description: 'Parabéns! Você conheceu as principais funcionalidades da plataforma. Continue explorando e personalizando sua experiência.',
        target: '[data-tour="dashboard-main"]',
        placement: 'center' as const,
        page: '/',
        tip: 'Use o botão de ajuda (?) sempre que precisar de orientações adicionais.',
        highlight: false,
        autoAdvance: false
      }
    ]
  },

  'dashboard-deep-dive': {
    title: 'Dashboard Avançado',
    description: 'Explore todas as funcionalidades do dashboard',
    icon: BarChart3,
    totalSteps: 5,
    steps: [
      {
        id: 'dashboard-widgets',
        title: '📋 Widgets Personalizáveis',
        description: 'Os widgets se adaptam ao seu perfil e mostram informações relevantes para suas atividades.',
        target: '[data-tour="dashboard-main"]',
        placement: 'center' as const,
        page: '/',
        highlight: true,
        delay: 3000
      },
      {
        id: 'filters-search',
        title: '🔍 Filtros Inteligentes',
        description: 'Use filtros para personalizar a visualização de dados e encontrar informações específicas rapidamente.',
        target: '[data-tour="filters"]',
        placement: 'bottom' as const,
        page: '/',
        highlight: true,
        delay: 3000
      }
    ]
  }
};

export { SmartInteractiveTour };
  const { currentTour, currentStep, nextStep, prevStep, completeTour, userProfile } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const [tourSteps, setTourSteps] = useState<SmartTourStep[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentTourData, setCurrentTourData] = useState<any>(null);

  // Filtrar steps baseado no perfil do usuário
  const filterStepsByProfile = useCallback((steps: SmartTourStep[]) => {
    // Lógica para filtrar steps baseado no perfil
    switch (userProfile) {
      case 'iniciante':
        return steps; // Mostrar todos os steps para iniciantes
      case 'esg':
        return steps.filter(step => 
          step.id.includes('esg') || 
          step.id.includes('dashboard') || 
          step.id === 'welcome-dashboard' ||
          step.id === 'tour-complete'
        );
      case 'qualidade':
        return steps.filter(step => 
          step.id.includes('quality') || 
          step.id.includes('dashboard') || 
          step.id === 'welcome-dashboard' ||
          step.id === 'tour-complete'
        );
      case 'rh':
        return steps.filter(step => 
          step.id.includes('performance') || 
          step.id.includes('dashboard') || 
          step.id === 'welcome-dashboard' ||
          step.id === 'tour-complete'
        );
      default:
        return steps;
    }
  }, [userProfile]);

  // Inicializar tour
  useEffect(() => {
    if (currentTour && SMART_TOUR_DEFINITIONS[currentTour as keyof typeof SMART_TOUR_DEFINITIONS]) {
      const tourData = SMART_TOUR_DEFINITIONS[currentTour as keyof typeof SMART_TOUR_DEFINITIONS];
      setCurrentTourData(tourData);
      
      const filteredSteps = filterStepsByProfile(tourData.steps);
      setTourSteps(filteredSteps);
      
      // Atualizar total de steps
      tourData.totalSteps = filteredSteps.length;
    }
  }, [currentTour, filterStepsByProfile]);

  // Navegação automática entre páginas
  const navigateToPage = useCallback(async (page: string) => {
    if (location.pathname !== page) {
      setIsNavigating(true);
      navigate(page);
      
      // Aguardar um pouco para a página carregar
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsNavigating(false);
    }
  }, [navigate, location.pathname]);

  // Executar step atual
  useEffect(() => {
    if (currentTour && tourSteps.length > 0 && currentStep < tourSteps.length && !isPaused && !isNavigating) {
      const step = tourSteps[currentStep];
      
      // Executar ação customizada se houver
      if (step.action) {
        step.action();
      }
      
      // Navegar para página se necessário
      if (step.page && location.pathname !== step.page) {
        navigateToPage(step.page);
        return;
      }
      
      // Verificar condição se houver
      if (step.condition && !step.condition()) {
        nextStep();
        return;
      }
      
      // Encontrar elemento alvo
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        
        // Scroll suave para o elemento
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Calcular posição do overlay
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setOverlayPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 500);
        
        // Auto advance se configurado
        if (step.autoAdvance && step.delay && !isPaused) {
          setTimeout(() => {
            if (!isPaused && currentStep < tourSteps.length - 1) {
              nextStep();
            }
          }, step.delay);
        }
      } else {
        // Se elemento não encontrado, avançar automaticamente
        setTimeout(() => nextStep(), 1000);
      }
    }
  }, [currentTour, currentStep, tourSteps, isPaused, isNavigating, location.pathname, navigateToPage, nextStep]);

  // Preencher ações de navegação dinamicamente
  useEffect(() => {
    if (tourSteps.length > 0) {
      const updatedSteps = tourSteps.map(step => {
        if (step.id === 'navigate-performance' && !step.action) {
          return {
            ...step,
            action: () => navigateToPage('/gestao-desempenho')
          };
        }
        if (step.id === 'navigate-esg' && !step.action) {
          return {
            ...step,
            action: () => navigateToPage('/gestao-esg')
          };
        }
        if (step.id === 'navigate-quality' && !step.action) {
          return {
            ...step,
            action: () => navigateToPage('/qualidade')
          };
        }
        return step;
      });
      
      if (updatedSteps !== tourSteps) {
        setTourSteps(updatedSteps);
      }
    }
  }, [tourSteps, navigateToPage]);

  if (!currentTour || tourSteps.length === 0 || currentStep >= tourSteps.length) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  const getTooltipPosition = (): { top: number; left: number } => {
    if (!targetElement) return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
    
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = isMobile ? 320 : 400;
    const tooltipHeight = 280;
    const margin = 20;
    
    let position: { top: number; left: number };
    
    // Posicionamento especial para center
    if (currentStepData.placement === 'center') {
      position = {
        top: window.innerHeight / 2 - tooltipHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2
      };
    } else if (isMobile) {
      // Mobile sempre no bottom
      position = {
        top: rect.bottom + margin,
        left: Math.max(margin, Math.min(
          window.innerWidth - tooltipWidth - margin,
          rect.left + (rect.width / 2) - (tooltipWidth / 2)
        ))
      };
    } else {
      // Desktop positioning
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
      
      // Manter dentro da viewport
      if (position.left < margin) position.left = margin;
      if (position.left + tooltipWidth > window.innerWidth - margin) {
        position.left = window.innerWidth - tooltipWidth - margin;
      }
      if (position.top < margin) position.top = margin;
      if (position.top + tooltipHeight > window.innerHeight - margin) {
        position.top = window.innerHeight - tooltipHeight - margin;
      }
    }
    
    return position;
  };

  const tooltipPosition = getTooltipPosition();

  const handlePause = () => setIsPaused(!isPaused);
  const handleSkip = () => {
    const nextNonAutoStep = tourSteps.findIndex((step, index) => 
      index > currentStep && !step.autoAdvance
    );
    if (nextNonAutoStep !== -1) {
      // Skip para próximo step não automático
      for (let i = currentStep; i < nextNonAutoStep; i++) {
        nextStep();
      }
    } else {
      nextStep();
    }
  };

  const handleRestart = () => {
    setIsPaused(false);
    // Reiniciar tour - implementar lógica
    navigate('/');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 pointer-events-auto transition-opacity duration-500"
        onClick={completeTour}
      />
      
      {/* Loading indicator durante navegação */}
      {isNavigating && (
        <div className="fixed inset-0 z-45 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Navegando...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Spotlight no elemento alvo */}
      {targetElement && currentStepData.highlight && currentStepData.placement !== 'center' && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-700 ease-out"
          style={{
            top: overlayPosition.top - 12,
            left: overlayPosition.left - 12,
            width: overlayPosition.width + 24,
            height: overlayPosition.height + 24,
            boxShadow: `
              0 0 0 4px rgba(59, 130, 246, 0.8), 
              0 0 0 8px rgba(59, 130, 246, 0.4),
              0 0 0 12px rgba(59, 130, 246, 0.2),
              0 0 0 9999px rgba(0, 0, 0, 0.7)
            `,
            borderRadius: '16px',
            animation: currentStepData.autoAdvance ? 'pulse 2s infinite' : 'none'
          }}
        />
      )}

      {/* Tooltip aprimorado */}
      <Card 
        className={`fixed z-50 shadow-2xl border-primary/30 transition-all duration-500 backdrop-blur-sm bg-background/95 ${
          isMobile ? 'w-[320px]' : 'w-[400px]'
        } ${currentStepData.placement === 'center' ? 'border-2' : ''}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <CardContent className="p-6 space-y-5">
          {/* Header com tour info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Badge variant="outline" className="text-xs font-medium mb-1">
                    {currentStep + 1} de {tourSteps.length}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {currentTourData?.title}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {currentStepData.autoAdvance && !isPaused && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary">Auto</span>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePause}
                  className="h-8 w-8 p-0"
                  title={isPaused ? 'Continuar' : 'Pausar'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkip}
                  className="h-8 w-8 p-0"
                  title="Pular"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRestart}
                  className="h-8 w-8 p-0"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={completeTour}
                  className="h-8 w-8 p-0"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Progress value={progress} className="w-full h-3" />
          </div>

          {/* Conteúdo principal */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 leading-tight">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Dica */}
            {currentStepData.tip && (
              <div 
                className="p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/50 cursor-pointer transition-all hover:from-blue-50 hover:to-indigo-50"
                onClick={() => setShowTip(!showTip)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {showTip ? 'Ocultar dica' : 'Ver dica útil'}
                  </span>
                </div>
                {showTip && (
                  <p className="text-xs text-blue-700 animate-fade-in">
                    {currentStepData.tip}
                  </p>
                )}
              </div>
            )}

            {/* Status do tour */}
            {isPaused && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50/50 rounded-lg border border-yellow-200/50">
                <Pause className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">Tour pausado</span>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between gap-3 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0 || isPaused || isNavigating}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              <Button 
                size="sm"
                onClick={currentStep === tourSteps.length - 1 ? completeTour : nextStep}
                disabled={isPaused || isNavigating}
                className={`flex-1 ${
                  currentStep === tourSteps.length - 1 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
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