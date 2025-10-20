/**
 * Centralized React Query Keys
 * Ensures consistency and easier invalidation
 */

export const queryKeys = {
  // Auth & User
  auth: {
    user: ['auth', 'user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
    companyUsers: (companyId: string) => ['auth', 'company-users', companyId] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    activities: (userId: string) => ['dashboard', 'activities', userId] as const,
    alerts: ['dashboard', 'alerts'] as const,
    predictive: ['dashboard', 'predictive'] as const,
  },

  // Emissions & GHG
  emissions: {
    all: (companyId: string) => ['emissions', companyId] as const,
    byId: (id: string) => ['emissions', 'detail', id] as const,
    inventory: (companyId: string, year: number) => ['emissions', 'inventory', companyId, year] as const,
    factors: ['emissions', 'factors'] as const,
    dashboard: (companyId: string) => ['emissions', 'dashboard', companyId] as const,
  },

  // Licenses
  licenses: {
    all: (companyId: string) => ['licenses', companyId] as const,
    byId: (id: string) => ['licenses', 'detail', id] as const,
    monitoring: (companyId: string) => ['licenses', 'monitoring', companyId] as const,
    expiring: (companyId: string) => ['licenses', 'expiring', companyId] as const,
  },

  // Waste Management
  waste: {
    all: (companyId: string) => ['waste', companyId] as const,
    byId: (id: string) => ['waste', 'detail', id] as const,
    destinations: (companyId: string) => ['waste', 'destinations', companyId] as const,
    suppliers: (companyId: string) => ['waste', 'suppliers', companyId] as const,
  },

  // Goals & Targets
  goals: {
    all: (companyId: string) => ['goals', companyId] as const,
    byId: (id: string) => ['goals', 'detail', id] as const,
    progress: (goalId: string) => ['goals', 'progress', goalId] as const,
  },

  // Documents
  documents: {
    all: (companyId: string) => ['documents', companyId] as const,
    byId: (id: string) => ['documents', 'detail', id] as const,
    extractions: (companyId: string) => ['documents', 'extractions', companyId] as const,
    reconciliation: (companyId: string) => ['documents', 'reconciliation', companyId] as const,
  },

  // Quality (SGQ)
  quality: {
    dashboard: (companyId: string) => ['quality', 'dashboard', companyId] as const,
    nonConformities: (companyId: string) => ['quality', 'non-conformities', companyId] as const,
    correctiveActions: (companyId: string) => ['quality', 'corrective-actions', companyId] as const,
    processes: (companyId: string) => ['quality', 'processes', companyId] as const,
  },

  // HR & Social
  hr: {
    employees: (companyId: string) => ['hr', 'employees', companyId] as const,
    training: (companyId: string) => ['hr', 'training', companyId] as const,
    safety: (companyId: string) => ['hr', 'safety', companyId] as const,
    performance: (companyId: string) => ['hr', 'performance', companyId] as const,
  },

  // Compliance & Audit
  compliance: {
    all: (companyId: string) => ['compliance', companyId] as const,
    audits: (companyId: string) => ['compliance', 'audits', companyId] as const,
    policies: (companyId: string) => ['compliance', 'policies', companyId] as const,
  },

  // Stakeholders
  stakeholders: {
    all: (companyId: string) => ['stakeholders', companyId] as const,
    byId: (id: string) => ['stakeholders', 'detail', id] as const,
    engagement: (companyId: string) => ['stakeholders', 'engagement', companyId] as const,
  },

  // Reports
  reports: {
    all: (companyId: string) => ['reports', companyId] as const,
    byId: (id: string) => ['reports', 'detail', id] as const,
    templates: ['reports', 'templates'] as const,
  },

  // Suppliers
  suppliers: {
    all: (companyId: string) => ['suppliers', companyId] as const,
    byId: (id: string) => ['suppliers', 'detail', id] as const,
    evaluation: (companyId: string) => ['suppliers', 'evaluation', companyId] as const,
  },

  // Assets
  assets: {
    all: (companyId: string) => ['assets', companyId] as const,
    byId: (id: string) => ['assets', 'detail', id] as const,
  },

  // Notifications
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
  },
} as const;

/**
 * Helper function to invalidate multiple related queries
 */
export const createInvalidateHelper = (queryClient: any) => ({
  invalidateDashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts });
  },
  invalidateEmissions: (companyId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.emissions.all(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.emissions.dashboard(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  invalidateLicenses: (companyId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.licenses.monitoring(companyId) });
  },
});