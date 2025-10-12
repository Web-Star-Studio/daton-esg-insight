import { TourDefinition } from '@/types/tour';

export const tourDefinitions: Record<string, TourDefinition> = {
  'dashboard-intro': {
    id: 'dashboard-intro',
    title: 'Bem-vindo ao Dashboard',
    description: 'Conheça os principais recursos do seu dashboard',
    priority: 'user-initiated',
    steps: [
      {
        id: 'welcome',
        title: '👋 Bem-vindo!',
        description: 'Este tour rápido vai te mostrar como usar o dashboard de forma eficiente.',
        placement: 'center',
      },
      {
        id: 'sidebar',
        title: 'Navegação',
        description: 'Use a barra lateral para acessar todas as funcionalidades da plataforma.',
        target: '[data-tour="sidebar"]',
        placement: 'right',
      },
      {
        id: 'metrics',
        title: 'Métricas Principais',
        description: 'Aqui você vê os indicadores mais importantes do seu negócio em tempo real.',
        target: '[data-tour="metrics"]',
        placement: 'bottom',
      },
      {
        id: 'search',
        title: 'Busca Rápida',
        description: 'Use a busca para encontrar rapidamente qualquer informação.',
        target: '[data-tour="search"]',
        placement: 'bottom',
      },
    ],
  },
  
  'license-management': {
    id: 'license-management',
    title: 'Gestão de Licenças',
    description: 'Aprenda a gerenciar licenças e certificações',
    priority: 'contextual',
    steps: [
      {
        id: 'intro',
        title: '📋 Gestão de Licenças',
        description: 'Mantenha todas as suas licenças e certificações organizadas e atualizadas.',
        placement: 'center',
      },
      {
        id: 'add-license',
        title: 'Adicionar Licença',
        description: 'Clique aqui para adicionar uma nova licença ou certificação.',
        target: '[data-tour="add-license"]',
        placement: 'left',
        allowInteraction: true,
      },
      {
        id: 'alerts',
        title: 'Alertas Automáticos',
        description: 'Configure alertas para ser notificado antes do vencimento das licenças.',
        target: '[data-tour="license-alerts"]',
        placement: 'bottom',
      },
      {
        id: 'history',
        title: 'Histórico de Ações',
        description: 'Acompanhe todas as alterações feitas nas licenças.',
        target: '[data-tour="license-history"]',
        placement: 'top',
      },
    ],
  },

  'stakeholder-management': {
    id: 'stakeholder-management',
    title: 'Gestão de Stakeholders',
    description: 'Gerencie relacionamentos com partes interessadas',
    priority: 'contextual',
    steps: [
      {
        id: 'intro',
        title: '🤝 Stakeholders',
        description: 'Mantenha um registro organizado de todas as partes interessadas do projeto.',
        placement: 'center',
      },
      {
        id: 'categories',
        title: 'Categorias',
        description: 'Organize stakeholders por categorias como parceiros, fornecedores, clientes, etc.',
        target: '[data-tour="stakeholder-categories"]',
        placement: 'right',
      },
      {
        id: 'engagement',
        title: 'Nível de Engajamento',
        description: 'Avalie e monitore o nível de engajamento de cada stakeholder.',
        target: '[data-tour="engagement-level"]',
        placement: 'bottom',
      },
    ],
  },

  'performance-module': {
    id: 'performance-module',
    title: 'Módulo de Performance',
    description: 'Monitore e melhore a performance da empresa',
    priority: 'contextual',
    requiredModules: ['performance'],
    steps: [
      {
        id: 'intro',
        title: '📊 Performance',
        description: 'Acompanhe KPIs e métricas de desempenho em tempo real.',
        placement: 'center',
      },
      {
        id: 'kpis',
        title: 'Indicadores (KPIs)',
        description: 'Defina e monitore os indicadores mais importantes para seu negócio.',
        target: '[data-tour="kpis"]',
        placement: 'bottom',
      },
      {
        id: 'goals',
        title: 'Metas e Objetivos',
        description: 'Configure metas e acompanhe o progresso da equipe.',
        target: '[data-tour="goals"]',
        placement: 'bottom',
      },
    ],
  },

  'quality-module': {
    id: 'quality-module',
    title: 'Módulo de Qualidade',
    description: 'Gestão de qualidade e não conformidades',
    priority: 'contextual',
    requiredModules: ['quality'],
    steps: [
      {
        id: 'intro',
        title: '✨ Qualidade',
        description: 'Gerencie processos de qualidade e controle de não conformidades.',
        placement: 'center',
      },
      {
        id: 'nonconformities',
        title: 'Não Conformidades',
        description: 'Registre e acompanhe não conformidades até a resolução.',
        target: '[data-tour="nonconformities"]',
        placement: 'bottom',
      },
      {
        id: 'audits',
        title: 'Auditorias',
        description: 'Planeje e execute auditorias de qualidade.',
        target: '[data-tour="audits"]',
        placement: 'bottom',
      },
    ],
  },
};
