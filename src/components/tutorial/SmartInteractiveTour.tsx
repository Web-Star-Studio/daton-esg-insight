import { useEffect, useState, useCallback, useRef } from 'react';
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
        description: 'Esta é sua central de comando ESG integrada e inteligente. Aqui você monitora métricas sustentáveis em tempo real, acompanha o progresso das iniciativas ESG e toma decisões baseadas em dados precisos e insights acionáveis para impulsionar a transformação sustentável da sua organização.',
        target: '[data-tour="dashboard-main"]',
        placement: 'center' as const,
        page: '/',
        tip: 'O dashboard adapta-se automaticamente ao seu perfil profissional, priorizando métricas e funcionalidades mais relevantes. Use os filtros para personalizar ainda mais sua experiência.',
        highlight: true,
        autoAdvance: false,
        delay: 5000
      },
      {
        id: 'sidebar-navigation',
        title: '🧭 Navegação Inteligente e Estruturada',
        description: 'O menu lateral organiza estrategicamente todos os módulos ESG seguindo as melhores práticas de sustentabilidade. Cada seção representa um pilar fundamental: Environmental (gestão ambiental), Social (capital humano e comunidade) e Governance (transparência e ética corporativa).',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/',
        tip: 'Produtividade: Use atalhos Ctrl+K para busca global, Ctrl+1 Dashboard, Ctrl+2 ESG, Ctrl+3 Qualidade. O menu colapsa automaticamente em telas menores para otimizar espaço.',
        highlight: true,
        delay: 4000
      },
      {
        id: 'stats-overview',
        title: '📊 KPIs ESG em Tempo Real com IA',
        description: 'Monitore indicadores-chave de sustentabilidade atualizados automaticamente via integrações e análise de IA. Acompanhe emissões de CO₂, índices de conformidade regulatória, indicadores sociais, métricas de governança e alertas inteligentes de desvio - tudo consolidado em uma visão executiva.',
        target: '[data-tour="stats-cards"]',
        placement: 'top' as const,
        page: '/',
        tip: 'Análise Avançada: Clique em qualquer KPI para drill-down com tendências históricas, benchmarks do setor, projeções baseadas em ML e planos de ação automáticos. Configurar alertas personalizados para metas críticas.',
        highlight: true,
        delay: 4000
      },
      {
        id: 'quick-actions',
        title: '⚡ Ações Rápidas Inteligentes e Contextuais',
        description: 'Hub de produtividade com acesso direto às tarefas mais críticas: registrar emissões via upload ou API, iniciar auditorias automatizadas, agendar treinamentos com IA, gerar relatórios regulatórios e executar workflows personalizados. As ações se adaptam dinamicamente às suas responsabilidades e urgências.',
        target: '[data-tour="quick-actions"]',
        placement: 'bottom' as const,
        page: '/',
        tip: 'Automação Inteligente: O sistema aprende seus padrões de uso e sugere ações baseadas em deadline, sazonalidade e prioridades. Configure macros para automatizar sequências de tarefas recorrentes.',
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
        title: '👥 Gestão Estratégica de Capital Humano ESG',
        description: 'Desenvolva seu capital humano com ferramentas avançadas de gestão de performance alinhadas aos critérios ESG. Crie ciclos avaliativos integrados aos ODS, defina metas individuais conectadas aos objetivos ESG organizacionais, acompanhe desenvolvimento de competências sustentáveis e construa uma cultura de alta performance com propósito.',
        target: '[data-tour="performance-header"]',
        placement: 'bottom' as const,
        page: '/gestao-desempenho',
        tip: 'Impacto Estratégico: Vincule metas individuais aos KPIs ESG corporativos para multiplicar o engajamento. Use analytics de RH para identificar talentos ESG e desenvolver lideranças sustentáveis através de trilhas de aprendizagem personalizadas.',
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
        title: '🌍 Central ESG Completa e Integrada',
        description: 'Plataforma ESG end-to-end que unifica Environmental (monitoramento de carbono, economia circular, biodiversidade), Social (diversidade, impacto comunitário, cadeia de fornecimento) e Governance (transparência, ética, riscos climáticos). Integração nativa com frameworks GRI, SASB, TCFD e regulamentações como CSRD.',
        target: '[data-tour="esg-header"]',
        placement: 'bottom' as const,
        page: '/gestao-esg',
        tip: 'Compliance Automático: Integração API com ERP, sensores IoT e fontes externas para coleta automatizada. Motor de IA calcula automaticamente métricas complexas como Scope 3, análise de materialidade e benchmarking setorial.',
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
        title: '🏆 Sistema de Excelência em Qualidade Integrada',
        description: 'Sistema avançado de gestão da qualidade com conformidade multi-normas (ISO 9001, 14001, 45001, 50001), gestão inteligente de auditorias com IA, controle preditivo de não conformidades, automação de processos críticos e melhoria contínua baseada em analytics. Integração completa com sistemas ESG para visão 360°.',
        target: '[data-tour="quality-header"]',
        placement: 'bottom' as const,
        page: '/qualidade',
        tip: 'Qualidade Preditiva: IA identifica potenciais não-conformidades antes que ocorram. Workflows automatizados garantem CAPA (Ações Corretivas e Preventivas) sistemáticas e rastreamento end-to-end de melhorias.',
        highlight: true,
        delay: 5000
      },

      // Finalização
        {
          id: 'tour-complete',
          title: '🎉 Jornada ESG Iniciada com Sucesso!',
          description: 'Parabéns por completar o tour! Agora você domina todo o ecossistema Daton ESG. Continue explorando funcionalidades avançadas, personalize dashboards e workflows, configure integrações e inicie a transformação sustentável da sua organização com dados precisos, insights de IA e automação inteligente.',
          target: '[data-tour="dashboard-main"]',
          placement: 'center' as const,
          page: '/',
          tip: 'Próximos Passos: Configure suas integrações (ERP, sensores, APIs), personalize dashboards, defina metas ESG e explore nossa academy com cursos especializados. Suporte 24/7 disponível via chat.',
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
  const [stepsPatched, setStepsPatched] = useState(false);

  // Refs estáveis para evitar loops por identidades mutáveis
  const nextStepRef = useRef(nextStep);
  const prevStepRef = useRef(prevStep);
  const completeTourRef = useRef(completeTour);
  const navigateToPageRef = useRef<(page: string) => void>(() => {});

  useEffect(() => {
    nextStepRef.current = nextStep;
    prevStepRef.current = prevStep;
    completeTourRef.current = completeTour;
    navigateToPageRef.current = navigateToPage;
  });

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
      // Atualizar total de steps e resetar patch flag
      tourData.totalSteps = filteredSteps.length;
      setStepsPatched(false);
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
        navigateToPageRef.current(step.page);
        return;
      }
      
      // Verificar condição se houver
      if (step.condition && !step.condition()) {
        nextStepRef.current();
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
              nextStepRef.current();
            }
          }, step.delay);
        }
      } else {
        // Se elemento não encontrado, avançar automaticamente
        setTimeout(() => nextStepRef.current(), 1000);
      }
    }
  }, [currentTour, currentStep, tourSteps, isPaused, isNavigating, location.pathname]);

  // Preencher ações de navegação dinamicamente (executa uma vez por tour)
  useEffect(() => {
    if (!tourSteps.length || stepsPatched) return;

    let changed = false;
    const updatedSteps = tourSteps.map(step => {
      if (step.id === 'navigate-performance' && !step.action) {
        changed = true;
        return { ...step, action: () => navigateToPageRef.current('/gestao-desempenho') };
      }
      if (step.id === 'navigate-esg' && !step.action) {
        changed = true;
        return { ...step, action: () => navigateToPageRef.current('/gestao-esg') };
      }
      if (step.id === 'navigate-quality' && !step.action) {
        changed = true;
        return { ...step, action: () => navigateToPageRef.current('/qualidade') };
      }
      return step;
    });

    if (changed) {
      setTourSteps(updatedSteps);
    }
    setStepsPatched(true);
  }, [tourSteps, stepsPatched]);

// Navegação por teclado para o tour
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextStep();
    if (e.key === 'ArrowLeft') prevStep();
    if (e.key === 'Escape') completeTour();
  };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [nextStep, prevStep, completeTour]);


  if (!currentTour || tourSteps.length === 0 || currentStep >= tourSteps.length) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  const getTooltipPosition = (): { top: number; left: number } => {
    if (!targetElement) return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
    
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = isMobile ? 340 : 420;
    const tooltipHeight = isMobile ? 300 : 320;
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
        onClick={() => completeTourRef.current()}
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
        className={`fixed z-[60] shadow-2xl transition-all duration-500 ease-out animate-scale-in max-w-[92vw]
          ${isMobile ? 'w-[340px]' : 'w-[420px]'} 
          ${currentStepData.placement === 'center' ? 'border-2 border-primary/20 bg-card/95 backdrop-blur-lg' : 'bg-card/95 backdrop-blur-sm border-border/50'}`}
        style={{
          top: currentStepData.placement === 'center' ? '50%' : tooltipPosition.top,
          left: currentStepData.placement === 'center' ? '50%' : tooltipPosition.left,
          transform: currentStepData.placement === 'center' ? 'translate(-50%, -50%)' : 'none',
          width: isMobile ? 'min(92vw, 340px)' : 'min(92vw, 420px)'
        }}
      >
        <CardContent className="p-6 space-y-6">
          {/* Header minimalista */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
                        {currentStep + 1} de {tourSteps.length}
                      </Badge>
                      {currentStepData.autoAdvance && !isPaused && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-700 font-medium">Avançando...</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {currentTourData?.title}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={completeTour}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Fechar tour"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-2.5 bg-muted/30" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso do Tour</span>
                <span className="font-medium">{Math.round(progress)}% concluído</span>
              </div>
            </div>
          </div>

          {/* Conteúdo principal aprimorado */}
          <div className="space-y-5">
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight">
                {currentStepData.title}
              </h3>
              <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Dica profissional aprimorada */}
            {currentStepData.tip && (
              <div 
                className={`group p-5 rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                  showTip 
                    ? 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30 shadow-lg' 
                    : 'bg-gradient-to-br from-muted/20 to-muted/10 border-border/40 hover:border-primary/20 hover:shadow-md'
                }`}
                onClick={() => setShowTip(!showTip)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    showTip ? 'bg-primary/20 shadow-md' : 'bg-muted/60 group-hover:bg-primary/10'
                  }`}>
                    <Lightbulb className={`w-4 h-4 transition-colors ${
                      showTip ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'
                    }`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold transition-colors ${
                      showTip ? 'text-primary' : 'text-foreground group-hover:text-primary/80'
                    }`}>
                      {showTip ? 'Ocultar dica profissional' : '💡 Ver dica profissional'}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      showTip ? 'bg-primary/20' : 'bg-muted/40 group-hover:bg-primary/10'
                    }`}>
                      <span className={`text-xs transition-transform ${showTip ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                </div>
                {showTip && (
                  <div className="animate-fade-in pl-11 space-y-2">
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      {currentStepData.tip}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status interativo */}
            {isPaused && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
                <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center">
                  <Pause className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <span className="text-sm text-orange-700 font-semibold">Tour pausado - Clique em "Próximo" para continuar</span>
              </div>
            )}

            {/* Navegação aprimorada */}
            <div className="flex gap-3 pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                size="lg"
                onClick={prevStep}
                disabled={currentStep === 0 || isNavigating}
                className="flex-1 h-12 gap-3 font-semibold border-2 hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <Button 
                size="lg"
                onClick={currentStep === tourSteps.length - 1 ? completeTour : nextStep}
                disabled={isNavigating}
                className={`flex-1 h-12 gap-3 font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  currentStep === tourSteps.length - 1 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent/90 text-white'
                }`}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Finalizar Tour
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Informação adicional */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Use as setas do teclado ← → para navegar | ESC para sair
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}