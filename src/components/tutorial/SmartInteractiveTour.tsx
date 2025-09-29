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
        title: '🎯 Bem-vindo ao Daton ESG!',
        description: 'Esta é sua central de comando ESG. Aqui você monitora métricas sustentáveis em tempo real, acompanha o progresso das iniciativas e toma decisões baseadas em dados para impulsionar a transformação ESG da sua organização.',
        target: '[data-tour="dashboard-main"]',
        placement: 'center' as const,
        page: '/',
        tip: 'O dashboard é personalizado conforme seu perfil e exibe apenas as métricas mais relevantes para suas responsabilidades.',
        highlight: true,
        autoAdvance: true,
        delay: 5000
      },
      {
        id: 'sidebar-navigation',
        title: '🧭 Navegação Inteligente',
        description: 'O menu lateral organiza todos os módulos ESG de forma intuitiva. Cada seção é focada em uma área específica da sustentabilidade: Environmental (Ambiental), Social (Social) e Governance (Governança).',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/',
        tip: 'Use atalhos de teclado: Ctrl+1 para Dashboard, Ctrl+2 para ESG, Ctrl+3 para Qualidade.',
        highlight: true,
        delay: 4000
      },
      {
        id: 'stats-overview',
        title: '📊 KPIs ESG em Tempo Real',
        description: 'Monitore indicadores-chave de sustentabilidade que são atualizados automaticamente. Emissões de CO₂, conformidade regulatória, indicadores sociais e métricas de governança - tudo em um só lugar.',
        target: '[data-tour="stats-cards"]',
        placement: 'top' as const,
        page: '/',
        tip: 'Clique em qualquer KPI para ver análises detalhadas, tendências históricas e planos de ação.',
        highlight: true,
        delay: 4000
      },
      {
        id: 'quick-actions',
        title: '⚡ Ações Rápidas Contextuais',
        description: 'Acesso direto às tarefas mais comuns: registrar emissões, iniciar auditorias, agendar treinamentos e gerar relatórios. As ações se adaptam às suas atividades mais frequentes.',
        target: '[data-tour="quick-actions"]',
        placement: 'bottom' as const,
        page: '/',
        tip: 'Essas ações mudam dinamicamente baseado no seu perfil e nas tarefas pendentes mais urgentes.',
        highlight: true,
        delay: 4000
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
        title: '👥 Gestão de Capital Humano',
        description: 'Desenvolva seu capital humano com ferramentas completas de gestão de desempenho. Crie ciclos avaliativos, defina metas alinhadas aos ODS, acompanhe desenvolvimento e promova uma cultura de alta performance sustentável.',
        target: '[data-tour="performance-header"]',
        placement: 'bottom' as const,
        page: '/gestao-desempenho',
        tip: 'Integre metas ESG individuais aos objetivos organizacionais para fortalecer o engajamento em sustentabilidade.',
        highlight: true,
        delay: 5000
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
        title: '🌍 Central ESG Completa',
        description: 'Gerencie todos os aspectos ESG em uma plataforma integrada: monitore emissões de carbono, desenvolva projetos sustentáveis, acompanhe indicadores sociais e mantenha governança transparente e ética.',
        target: '[data-tour="esg-header"]',
        placement: 'bottom' as const,
        page: '/gestao-esg',
        tip: 'O sistema integra automaticamente dados de todas as suas operações para cálculos precisos de impacto ESG.',
        highlight: true,
        delay: 5000
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
        title: '🏆 Excelência em Qualidade',
        description: 'Mantenha os mais altos padrões de qualidade com conformidade às normas ISO, gestão inteligente de auditorias, controle sistemático de não conformidades e melhoria contínua de processos.',
        target: '[data-tour="quality-header"]',
        placement: 'bottom' as const,
        page: '/qualidade',
        tip: 'Automatize processos de qualidade para reduzir erros humanos e garantir conformidade consistente.',
        highlight: true,
        delay: 5000
      },

      // Finalização
        {
          id: 'tour-complete',
          title: '🎉 Jornada ESG Iniciada!',
          description: 'Parabéns! Agora você conhece todo o poder do Daton. Continue explorando, personalize sua experiência e comece a transformação ESG da sua organização com dados precisos e insights acionáveis.',
          target: '[data-tour="dashboard-main"]',
          placement: 'center' as const,
          page: '/',
          tip: 'Acesse nossa central de ajuda (?) sempre que precisar de orientações detalhadas ou tutoriais específicos.',
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

export function SmartInteractiveTour() {
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
      {/* Overlay escuro com blur profissional */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 pointer-events-auto transition-all duration-500 ease-out"
        onClick={completeTour}
      />
      
      {/* Loading indicator minimalista */}
      {isNavigating && (
        <div className="fixed inset-0 z-45 flex items-center justify-center">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-border/50 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">Navegando...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Spotlight minimalista no elemento alvo */}
      {targetElement && currentStepData.highlight && currentStepData.placement !== 'center' && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-700 ease-out"
          style={{
            top: overlayPosition.top - 8,
            left: overlayPosition.left - 8,
            width: overlayPosition.width + 16,
            height: overlayPosition.height + 16,
            boxShadow: `
              0 0 0 2px hsl(var(--primary)),
              0 0 0 4px hsl(var(--primary) / 0.3),
              0 0 0 8px hsl(var(--primary) / 0.1),
              0 0 0 9999px hsl(var(--background) / 0.8)
            `,
            borderRadius: '12px',
            animation: currentStepData.autoAdvance ? 'pulse 3s ease-in-out infinite' : 'none'
          }}
        />
      )}

      {/* Card do tour redesignado */}
      <Card 
        className={`fixed z-50 shadow-2xl transition-all duration-500 ease-out animate-scale-in
          ${isMobile ? 'w-[340px]' : 'w-[420px]'} 
          ${currentStepData.placement === 'center' ? 'border-2 border-primary/20 bg-card/95 backdrop-blur-lg' : 'bg-card/95 backdrop-blur-sm border-border/50'}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <CardContent className="p-6 space-y-6">
          {/* Header minimalista */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                    {currentStep + 1} de {tourSteps.length}
                  </Badge>
                  <div className="text-xs text-muted-foreground font-medium">
                    {currentTourData?.title}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {currentStepData.autoAdvance && !isPaused && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs text-primary font-medium">Auto</span>
                  </div>
                )}
                <div className="flex items-center rounded-lg border border-border/50 bg-background/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePause}
                    className="h-8 w-8 p-0 rounded-r-none border-r border-border/50"
                    title={isPaused ? 'Continuar' : 'Pausar'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSkip}
                    className="h-8 w-8 p-0 rounded-none border-r border-border/50"
                    title="Pular step"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRestart}
                    className="h-8 w-8 p-0 rounded-none border-r border-border/50"
                    title="Reiniciar tour"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={completeTour}
                    className="h-8 w-8 p-0 rounded-l-none hover:bg-destructive/10 hover:text-destructive"
                    title="Fechar tour"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Progress value={progress} className="w-full h-2 bg-muted/50" />
          </div>

          {/* Conteúdo principal refinado */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground leading-tight">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Dica elegante */}
            {currentStepData.tip && (
              <div 
                className={`group p-4 rounded-xl transition-all duration-300 cursor-pointer border ${
                  showTip 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border'
                }`}
                onClick={() => setShowTip(!showTip)}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    showTip ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Lightbulb className={`w-3.5 h-3.5 transition-colors ${
                      showTip ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    showTip ? 'text-primary' : 'text-foreground'
                  }`}>
                    {showTip ? 'Ocultar dica' : 'Ver dica útil'}
                  </span>
                </div>
                {showTip && (
                  <p className="text-xs text-muted-foreground leading-relaxed animate-fade-in pl-8">
                    {currentStepData.tip}
                  </p>
                )}
              </div>
            )}

            {/* Status elegante */}
            {isPaused && (
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-xl border border-warning/20">
                <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center">
                  <Pause className="w-3 h-3 text-warning" />
                </div>
                <span className="text-sm text-warning font-medium">Tour pausado</span>
              </div>
            )}

            {/* Navegação refinada */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0 || isPaused || isNavigating}
                className="flex-1 h-10 gap-2 focus-ring"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <Button 
                size="sm"
                onClick={currentStep === tourSteps.length - 1 ? completeTour : nextStep}
                disabled={isPaused || isNavigating}
                className={`flex-1 h-10 gap-2 focus-ring font-medium ${
                  currentStep === tourSteps.length - 1 
                    ? 'bg-success hover:bg-success/90 text-success-foreground shadow-md' 
                    : 'bg-primary hover:bg-primary/90 shadow-md'
                }`}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
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