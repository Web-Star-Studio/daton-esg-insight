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
  openHints?: string[]; // Pistas para abrir abas/seções antes de procurar o alvo
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
        page: '/dashboard',
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
        page: '/dashboard',
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
        page: '/dashboard',
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
        page: '/dashboard',
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
          page: '/gestao-desempenho',
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
        autoAdvance: false,
        delay: 5000
      },

      // TOUR EXPANDIDO - Cobrindo toda a plataforma a partir daqui
      
      // 1. RH - Estrutura Organizacional
      {
        id: 'navigate-estrutura-organizacional',
        title: '🏢 Estrutura Organizacional',
        description: 'Vamos conhecer a gestão da estrutura organizacional. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/estrutura-organizacional',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'estrutura-organizacional-overview',
        title: '🏢 Estrutura Organizacional Completa',
        description: 'Gerencie organogramas dinâmicos, departamentos e cargos com governança integrada. Defina hierarquias ESG, responsabilidades de sustentabilidade por área e acompanhe a distribuição de competências verdes na organização.',
        target: '[data-tour="estrutura-organizacional-header"]',
        placement: 'bottom' as const,
        page: '/estrutura-organizacional',
        tip: 'Governança ESG: Integre responsabilidades de sustentabilidade em cada cargo. Use org charts para mapear champions ESG e garantir accountability em todos os níveis hierárquicos.',
        highlight: true,
        autoAdvance: false
      },

      // 2. RH - Gestão de Funcionários  
      {
        id: 'navigate-gestao-funcionarios',
        title: '👥 Gestão de Funcionários',
        description: 'Explorando a gestão de funcionários. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/gestao-funcionarios',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'gestao-funcionarios-overview',
        title: '👥 Gestão Avançada de Capital Humano',
        description: 'Plataforma 360° para gestão de pessoas com foco em diversidade, inclusão e desenvolvimento sustentável. Monitore indicadores de diversidade, engajamento ESG, desenvolvimento de competências verdes e retenção de talentos alinhados aos valores organizacionais.',
        target: '[data-tour="gestao-funcionarios-header"]',
        placement: 'bottom' as const,
        page: '/gestao-funcionarios',
        tip: 'Diversidade & Inclusão: Use analytics para monitorar equidade salarial, diversidade em posições de liderança e progressão de carreira inclusiva. Integre metas ESG individuais aos planos de desenvolvimento.',
        highlight: true,
        autoAdvance: false
      },

      // 3. ESG Ambiental - Inventário GEE
      {
        id: 'navigate-inventario-gee',
        title: '🌍 Inventário de Gases de Efeito Estufa',
        description: 'Vamos conhecer a gestão de emissões de GEE. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/inventario-gee',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'inventario-gee-overview',
        title: '🌍 Inventário GEE Inteligente e Automatizado',
        description: 'Sistema avançado de monitoramento de carbono com conformidade GHG Protocol, Science Based Targets e TCFD. Integração automática com sensores IoT, APIs de fornecedores e machine learning para cálculos precisos de Scope 1, 2 e 3.',
        target: '[data-tour="inventario-gee-header"]',
        placement: 'bottom' as const,
        page: '/inventario-gee',
        tip: 'Automação Inteligente: Configure integrações API para coleta automática de dados de atividade. Use IA para detectar anomalias, projetar emissões futuras e recomendar ações de redução baseadas em benchmarks setoriais.',
        highlight: true,
        autoAdvance: false
      },

      // 4. ESG Ambiental - Dashboard GHG
      {
        id: 'navigate-dashboard-ghg',
        title: '📊 Dashboard de Emissões GHG',
        description: 'Explorando analytics avançados de emissões. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/dashboard-ghg',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'dashboard-ghg-overview',
        title: '📊 Analytics Avançados de Carbono com IA',
        description: 'Dashboard executivo com insights de carbono em tempo real, análise de tendências preditivas, cenários de descarbonização e comparações setoriais. Visualizações interativas para comunicação assertiva de resultados ESG aos stakeholders.',
        target: '[data-tour="dashboard-ghg-header"]',
        placement: 'bottom' as const,
        page: '/dashboard-ghg',
        tip: 'Insights Executivos: Use cenários de modelagem para simular impactos de iniciativas de redução. Configure relatórios automáticos para investidores e reguladores, alinhados aos padrões CDP e outras frameworks.',
        highlight: true,
        autoAdvance: false
      },

      // 5. ESG Ambiental - Licenciamento
      {
        id: 'navigate-licenciamento',
        title: '📋 Licenciamento Ambiental',
        description: 'Conhecendo a gestão de licenças ambientais. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/licenciamento',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'licenciamento-overview',
        title: '📋 Licenciamento Ambiental Inteligente',
        description: 'Gestão completa de licenças ambientais com análise automática de documentos via IA, alertas preditivos de vencimento, compliance tracking e workflow de renovação automatizado. Integração com órgãos reguladores e análise de riscos regulatórios.',
        target: '[data-tour="licenciamento-header"]',
        placement: 'bottom' as const,
        page: '/licenciamento',
        tip: 'Compliance Proativo: Configure alertas inteligentes 180/90/30 dias antes do vencimento. IA analisa textos de licenças para extrair condicionantes e gerar calendários de compliance automáticos.',
        highlight: true,
        autoAdvance: false
      },

      // 6. ESG Social & Governança - Social ESG
      {
        id: 'navigate-social-esg',
        title: '🤝 ESG Social',
        description: 'Explorando a dimensão social do ESG. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/social-esg',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'social-esg-overview',
        title: '🤝 ESG Social e Impacto Comunitário',
        description: 'Plataforma integrada para gestão de impactos sociais, diversidade & inclusão, desenvolvimento comunitário e cadeia de valor responsável. Monitoramento de ODS, engajamento de stakeholders e medição de impacto social com metodologias consolidadas.',
        target: '[data-tour="social-esg-header"]',
        placement: 'bottom' as const,
        page: '/social-esg',
        tip: 'Impacto Mensurável: Use frameworks como IRIS+ e SROI para medir retorno social dos investimentos. Configure dashboards de impacto para comunicar valor criado para comunidades e sociedade.',
        highlight: true,
        autoAdvance: false
      },

      // 7. ESG Social & Governança - Governança ESG
      {
        id: 'navigate-governanca-esg',
        title: '⚖️ Governança ESG',
        description: 'Conhecendo a estrutura de governança ESG. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/governanca-esg',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'governanca-esg-overview',
        title: '⚖️ Governança ESG e Transparência Corporativa',
        description: 'Sistema avançado de governança ESG com gestão de riscos climáticos, compliance regulatório, transparência de dados e engajamento de stakeholders. Conformidade automática com TCFD, CSRD, SASB e outros frameworks de reporte.',
        target: '[data-tour="governanca-esg-header"]',
        placement: 'bottom' as const,
        page: '/governanca-esg',
        tip: 'Transparência Estratégica: Configure relatórios automáticos para diferentes stakeholders. Use IA para análise de materialidade dinâmica e identificação de riscos emergentes de ESG.',
        highlight: true,
        autoAdvance: false
      },

      // 8. SGQ - Indicadores de Qualidade
      {
        id: 'navigate-indicadores-qualidade',
        title: '🏆 Indicadores de Qualidade',
        description: 'Explorando o sistema de gestão da qualidade. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/indicadores-qualidade',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'indicadores-qualidade-overview',
        title: '🏆 Sistema Integrado de Gestão da Qualidade',
        description: 'SGQ digital completo com conformidade multi-normas (ISO 9001, 14001, 45001), indicadores em tempo real, auditorias inteligentes e melhoria contínua automatizada. Integração total com módulos ESG para visão 360° de performance organizacional.',
        target: '[data-tour="quality-header"]',
        placement: 'bottom' as const,
        page: '/indicadores-qualidade',
        tip: 'Excelência Integrada: Conecte KPIs de qualidade com metas ESG para visão holística. Use analytics preditivos para antecipação de não-conformidades e otimização de processos críticos.',
        highlight: true,
        autoAdvance: false,
        openHints: ['indicadores', 'dashboard']
      },

      // 9. Dados e Relatórios - Relatórios
      {
        id: 'navigate-relatorios',
        title: '📄 Centro de Relatórios',
        description: 'Acessando o centro de relatórios corporativos. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/relatorios',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'relatorios-overview',
        title: '📄 Centro de Relatórios Inteligente',
        description: 'Hub centralizado de relatórios ESG, sustentabilidade e compliance com geração automática, templates personalizáveis e distribuição inteligente. Conformidade nativa com GRI, SASB, TCFD, CDP e frameworks regulatórios locais.',
        target: '[data-tour="relatorios-header"]',
        placement: 'bottom' as const,
        page: '/relatorios',
        tip: 'Relatórios Automatizados: Configure pipelines de dados para atualizações automáticas. Use IA para narrativas contextuais e insights automáticos baseados em trends e benchmarks setoriais.',
        highlight: true,
        autoAdvance: false
      },

      // 10. Inteligência - Intelligence Center
      {
        id: 'navigate-intelligence-center',
        title: '🧠 Centro de Inteligência',
        description: 'Explorando analytics avançados e IA. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/intelligence-center',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'intelligence-center-overview',
        title: '🧠 Centro de Inteligência ESG Avançada',
        description: 'Plataforma de machine learning e analytics preditivos para ESG. Insights automatizados, detecção de padrões, benchmarking inteligente e recomendações baseadas em IA para otimização de performance sustentável e identificação de oportunidades.',
        target: '[data-tour="intelligence-center-header"]',
        placement: 'bottom' as const,
        page: '/intelligence-center',
        tip: 'IA Estratégica: Use modelos preditivos para antecipação de riscos ESG, otimização de recursos e identificação de oportunidades de inovação sustentável. Configure alertas de ML para anomalias críticas.',
        highlight: true,
        autoAdvance: false
      },

      // 11. Configurações - Gestão de Usuários
      {
        id: 'navigate-gestao-usuarios',
        title: '👤 Gestão de Usuários',
        description: 'Acessando a gestão de usuários e permissões. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/gestao-usuarios',
        action: () => {},
        autoAdvance: true,
        delay: 2000,
        highlight: false
      },
      {
        id: 'gestao-usuarios-overview',
        title: '👤 Gestão Avançada de Usuários e Governança',
        description: 'Sistema robusto de gestão de usuários com roles baseados em responsabilidades ESG, auditoria de acessos, SSO corporativo e governança de dados. Controle granular de permissões alinhado à estrutura organizacional e compliance.',
        target: '[data-tour="gestao-usuarios-header"]',
        placement: 'bottom' as const,
        page: '/gestao-usuarios',
        tip: 'Segurança & Compliance: Configure roles específicos para cada área ESG. Use logs de auditoria para compliance LGPD/GDPR e implemente aprovações multi-nível para ações críticas.',
        highlight: true,
        autoAdvance: false
      },

      // Retorno ao Dashboard - ESG
      {
        id: 'navigate-esg',
        title: '🌱 Retornando ao Hub ESG',
        description: 'Finalizando o tour no centro de comando ESG. Navegando...',
        target: '[data-tour="sidebar"]',
        placement: 'right' as const,
        page: '/gestao-esg',
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
        autoAdvance: false,
        delay: 5000
      },

      // Finalização
        {
          id: 'tour-complete',
          title: '🎉 Jornada ESG Iniciada com Sucesso!',
          description: 'Parabéns por completar o tour! Agora você domina todo o ecossistema Daton ESG. Continue explorando funcionalidades avançadas, personalize dashboards e workflows, configure integrações e inicie a transformação sustentável da sua organização com dados precisos, insights de IA e automação inteligente.',
          target: '[data-tour="dashboard-main"]',
          placement: 'center' as const,
          page: '/dashboard',
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
        page: '/dashboard',
        highlight: true,
        delay: 3000
      },
      {
        id: 'filters-search',
        title: '🔍 Filtros Inteligentes',
        description: 'Use filtros para personalizar a visualização de dados e encontrar informações específicas rapidamente.',
        target: '[data-tour="filters"]',
        placement: 'bottom' as const,
        page: '/dashboard',
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
  const openedStepsRef = useRef<Record<number, boolean>>({});

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

  // Navegação automática entre páginas - só libera isNavigating quando target existe
  const navigateToPage = useCallback(async (page: string) => {
    if (location.pathname !== page) {
      setIsNavigating(true);
      navigate(page);
      
      // Aguardar navegação + tempo para DOM se estabilizar (reduzido de 3s para 1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsNavigating(false);
    }
  }, [navigate, location.pathname]);

  // Tenta abrir abas/seções relevantes com múltiplas tentativas
  const ensureSectionVisible = useCallback((hints: string[]) => {
    const attempt = (retryCount: number) => {
      try {
        const lc = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const hintLC = hints.map(lc);
        const selectors = [
          'button', '[role="tab"]', 'a', '[data-tour-open]',
          '[aria-controls]', '.accordion-trigger', '[data-state]',
          '[data-radix-collection-item]', '.tabs-trigger'
        ];
        const candidates = Array.from(document.querySelectorAll(selectors.join(', '))) as HTMLElement[];
        
        for (const el of candidates) {
          const text = lc(el.textContent || '');
          const attrs = `${el.getAttribute('data-tour-open') || ''} ${el.getAttribute('data-tab') || ''} ${el.getAttribute('aria-controls') || ''}`;
          const attrsLC = lc(attrs);
          if (hintLC.some(h => text.includes(h) || attrsLC.includes(h))) {
            el.click();
            return true; // Sucesso
          }
        }
        return false; // Não encontrou
      } catch (_) {
        return false;
      }
    };

    // Tentar até 3x com delays
    if (!attempt(3)) {
      setTimeout(() => {
        if (!attempt(2)) {
          setTimeout(() => attempt(1), 250);
        }
      }, 200);
    }
  }, []);

  // Executar step atual
  useEffect(() => {
    if (currentTour && tourSteps.length > 0 && currentStep < tourSteps.length && !isPaused && !isNavigating) {
      const step = tourSteps[currentStep];
      
      console.debug('Tour: Executando step', currentStep, ':', step.title, 'na página', location.pathname);
      
      // Executar ação customizada se houver
      if (step.action) {
        step.action();
      }
      
      // Navegar para página se necessário
      if (step.page && location.pathname !== step.page) {
        console.debug('Tour: Navegando para', step.page, 'atual:', location.pathname);
        navigateToPageRef.current(step.page);
        return;
      }
      
      // Verificar condição se houver
      if (step.condition && !step.condition()) {
        nextStepRef.current();
        return;
      }
      
      // Abrir abas/seções se houver dicas configuradas (executa uma vez por passo)
      if (step.openHints && !openedStepsRef.current[currentStep]) {
        console.debug('Tour: Abrindo seções para hints:', step.openHints);
        ensureSectionVisible(step.openHints);
        openedStepsRef.current[currentStep] = true;
      }
      
      // Encontrar elemento alvo com timeout aumentado para aguardar carregamento - aumentado para 8s
      const tryFindTarget = (retries: number) => {
        const el = document.querySelector(step.target) as HTMLElement | null;
        if (el) {
          console.debug('Tour: Target encontrado:', step.target);
          setTargetElement(el);
          // Scroll suave para o elemento
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          // Calcular posição do overlay com leve atraso
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            setOverlayPosition({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height
            });
          }, 100);
        } else if (retries > 0) {
          console.debug('Tour: Target não encontrado, tentando novamente:', step.target, 'retries restantes:', retries);
          setTimeout(() => tryFindTarget(retries - 1), 200);
        } else {
          console.warn('Tour: Target não encontrado após tentativas:', step.target);
          // Fallback para mostrar tooltip no centro se o target não for encontrado
          setTargetElement(null);
        }
      };
      
      tryFindTarget(40); // 40 tentativas = ~8 segundos
    }
  }, [currentTour, tourSteps, currentStep, location.pathname, isPaused, isNavigating, ensureSectionVisible]);

  // Auto-advance logic - só avança automaticamente se for step de navegação
  useEffect(() => {
    if (currentTour && tourSteps.length > 0 && currentStep < tourSteps.length && !isPaused && !isNavigating) {
      const step = tourSteps[currentStep];
      
      // Só avança automaticamente em steps de navegação (que têm autoAdvance: true)
      if (step.autoAdvance && step.delay && step.id.includes('navigate-')) {
        console.debug('Tour: Auto-advance ativado para step de navegação:', step.id, 'delay:', step.delay);
        const timer = setTimeout(() => {
          if (!isPaused && !isNavigating) {
            console.debug('Tour: Auto-avançando para próximo step');
            nextStepRef.current();
          }
        }, step.delay);

        return () => clearTimeout(timer);
      }
    }
  }, [currentTour, tourSteps, currentStep, isPaused, isNavigating]);

  // Handlers
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      nextStepRef.current();
    } else {
      completeTourRef.current();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      prevStepRef.current();
    }
  };

  const handleSkip = () => {
    // Encontrar próximo step de "overview" (não navegação)
    const nextOverviewIndex = tourSteps.findIndex((step, index) => 
      index > currentStep && !step.id.includes('navigate-')
    );
    
    if (nextOverviewIndex !== -1) {
      // Pular para o próximo overview
      const stepsToSkip = nextOverviewIndex - currentStep;
      for (let i = 0; i < stepsToSkip; i++) {
        nextStepRef.current();
      }
    } else {
      // Se não há mais overviews, finalizar tour
      completeTourRef.current();
    }
  };

  const handleRestart = () => {
    setIsPaused(false);
    // Restart by setting current step to 0 - isso será handled pelo TutorialContext
    completeTourRef.current();
    // Depois reinicar o tour...
    setTimeout(() => {
      if (currentTour) {
        // Isso seria feito pelo contexto do tutorial
      }
    }, 100);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const currentStepData = tourSteps[currentStep];
  const progress = tourSteps.length > 0 ? ((currentStep + 1) / tourSteps.length) * 100 : 0;

  // Renderização
  if (!currentTour || !currentStepData) {
    return null;
  }

  const cardStyle = currentStepData.placement === 'center' || !targetElement
    ? {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        maxWidth: isMobile ? '90vw' : '500px',
        width: '100%'
      }
    : {
        position: 'absolute' as const,
        top: currentStepData.placement === 'bottom' 
          ? overlayPosition.top + overlayPosition.height + 10
          : currentStepData.placement === 'top'
          ? overlayPosition.top - 10
          : overlayPosition.top,
        left: currentStepData.placement === 'right'
          ? overlayPosition.left + overlayPosition.width + 10
          : currentStepData.placement === 'left'
          ? overlayPosition.left - 10
          : overlayPosition.left + overlayPosition.width / 2,
        transform: currentStepData.placement === 'top' || currentStepData.placement === 'bottom'
          ? 'translate(-50%, -100%)'
          : currentStepData.placement === 'left'
          ? 'translate(-100%, -50%)'
          : 'translateY(-50%)',
        zIndex: 9999,
        maxWidth: isMobile ? '90vw' : '400px',
        width: isMobile ? '90vw' : 'auto',
        minWidth: '300px'
      };

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        style={{ display: currentTour ? 'block' : 'none' }}
      />
      
      {/* Highlight do elemento alvo */}
      {targetElement && currentStepData.highlight && (
        <div
          className="fixed border-4 border-primary rounded-lg shadow-2xl shadow-primary/30 animate-pulse z-[9998]"
          style={{
            top: overlayPosition.top - 4,
            left: overlayPosition.left - 4,
            width: overlayPosition.width + 8,
            height: overlayPosition.height + 8,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Card do tour */}
      <Card className="shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm" style={cardStyle}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1} de {tourSteps.length}
                </Badge>
              </div>
              {currentTourData && (
                <Badge variant="secondary" className="text-xs">
                  {currentTourData.title}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className="h-8 w-8 p-0"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={completeTourRef.current}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="mb-4 h-2" />

          {/* Navegação (indicador se está navegando) */}
          {isNavigating && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent/50 rounded-lg">
              <Navigation className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Navegando...</span>
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Tip seção */}
            {currentStepData.tip && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTip(!showTip)}
                  className="h-auto p-2 text-xs"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {showTip ? 'Ocultar dica' : 'Ver dica profissional'}
                </Button>
                
                {showTip && (
                  <div className="p-3 bg-accent/30 rounded-lg border-l-4 border-primary">
                    <p className="text-xs text-muted-foreground">
                      {currentStepData.tip}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Auto-advance indicator */}
            {currentStepData.autoAdvance && currentStepData.id.includes('navigate-') && !isPaused && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Avançando automaticamente...</span>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Pular seção
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                className="gap-1"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
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