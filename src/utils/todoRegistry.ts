/**
 * Registro de Funcionalidades Pendentes de Implementação
 * 
 * Este arquivo documenta todas as funcionalidades marcadas com TODO/FIXME
 * no código, categorizadas por tipo e prioridade.
 * 
 * @lastUpdated 2026-02-02
 */

/**
 * Categorias de funcionalidades pendentes
 */
export const PENDING_FEATURES = {
  /**
   * Integrações com serviços externos
   */
  INTEGRATIONS: {
    SENTRY: {
      description: 'Integração com Sentry para error reporting em produção',
      files: ['src/utils/logger.ts', 'src/components/ErrorBoundary.tsx'],
      priority: 'high',
      effort: 'medium',
    },
    MONITORING: {
      description: 'Envio de métricas de performance para serviço de monitoramento',
      files: ['src/utils/performanceMonitor.ts'],
      priority: 'medium',
      effort: 'medium',
    },
  },

  /**
   * APIs financeiras
   */
  FINANCIAL_APIS: {
    BALANCETE: {
      description: 'Implementar serviço getBalancete para balancete de verificação',
      files: ['src/components/financial/BalanceteVerificacao.tsx'],
      priority: 'medium',
      effort: 'high',
    },
    ACCOUNT_STATEMENT: {
      description: 'Implementar serviço getAccountStatement para extrato de contas',
      files: ['src/components/financial/AccountStatement.tsx'],
      priority: 'medium',
      effort: 'high',
    },
  },

  /**
   * Módulos de atendimento
   */
  OMBUDSMAN: {
    HOOK: {
      description: 'Implementar hook useOmbudsman para gestão de ouvidoria',
      files: ['src/pages/OuvidoriaClientes.tsx'],
      priority: 'medium',
      effort: 'medium',
    },
  },

  /**
   * Recursos Humanos
   */
  HR_FEATURES: {
    SCHEDULE_ASSIGNMENT: {
      description: 'API de atribuição de escala de trabalho',
      files: ['src/components/EmployeeScheduleAssignmentModal.tsx'],
      priority: 'medium',
      effort: 'medium',
    },
    ATTENDANCE_EXPORT: {
      description: 'Exportação real de relatórios de presença',
      files: ['src/components/AttendanceReportsModal.tsx'],
      priority: 'low',
      effort: 'low',
    },
  },

  /**
   * Qualidade e conformidade
   */
  QUALITY: {
    ROOT_CAUSE_API: {
      description: 'Integrar análise de causa raiz com API backend',
      files: ['src/components/RootCauseAnalysisModal.tsx'],
      priority: 'high',
      effort: 'medium',
    },
    GRI_API: {
      description: 'Implementar chamada de API para indicadores GRI',
      files: ['src/components/GRIIndicatorFormModal.tsx'],
      priority: 'medium',
      effort: 'medium',
    },
  },

  /**
   * Upload e armazenamento
   */
  UPLOADS: {
    ACTIVITY_EVIDENCE: {
      description: 'Upload de arquivos de evidência em monitoramento de atividades',
      files: ['src/components/ActivityMonitoringModal.tsx'],
      priority: 'medium',
      effort: 'medium',
    },
  },

  /**
   * Analytics e feedback
   */
  ANALYTICS: {
    TOUR_ANALYTICS: {
      description: 'Envio de analytics de tour para backend',
      files: ['src/hooks/useTourAnalytics.ts'],
      priority: 'low',
      effort: 'low',
    },
    FEEDBACK_COLLECTOR: {
      description: 'Criar tabela ai_feedback_logs e descomentar salvamento',
      files: ['src/components/intelligence/FeedbackCollector.tsx'],
      priority: 'low',
      effort: 'low',
    },
  },
} as const;

/**
 * Estatísticas das funcionalidades pendentes
 */
export const PENDING_STATS = {
  total: 13,
  byPriority: {
    high: 2,
    medium: 9,
    low: 3,
  },
  byEffort: {
    low: 3,
    medium: 8,
    high: 2,
  },
  categories: Object.keys(PENDING_FEATURES).length,
};

/**
 * Retorna todas as funcionalidades pendentes de alta prioridade
 */
export function getHighPriorityFeatures() {
  const highPriority: Array<{ category: string; feature: string; description: string }> = [];
  
  Object.entries(PENDING_FEATURES).forEach(([category, features]) => {
    Object.entries(features).forEach(([feature, details]) => {
      if (details.priority === 'high') {
        highPriority.push({
          category,
          feature,
          description: details.description,
        });
      }
    });
  });
  
  return highPriority;
}
