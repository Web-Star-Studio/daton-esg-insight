export type QualityTrendDirection = "up" | "down" | "stable";

export interface QualityMetricsContract {
  totalNCs: number;
  openNCs: number;
  resolvedNCs: number;
  totalRisks: number;
  criticalRisks: number;
  actionPlans: number;
  overdueActions: number;
  qualityScore: number;
  avgResolutionTime: number;
  trendDirection: QualityTrendDirection;
}

export interface QualityRecentNCContract {
  id: string;
  nc_number: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  created_at: string;
}

export interface QualityActionPlanProgressContract {
  id: string;
  title: string;
  status: string;
  totalItems: number;
  completedItems: number;
  avgProgress: number;
  overdueItems: number;
}

export interface QualityDashboardContract {
  metrics: QualityMetricsContract;
  recentNCs: Array<QualityRecentNCContract>;
  plansProgress: Array<QualityActionPlanProgressContract>;
}

export interface QualityIndicatorDataContract {
  ncTrend: {
    current: number;
    previous: number;
    change: number;
  };
  resolutionRate: {
    resolved: number;
    total: number;
    percentage: number;
  };
  overdueActions: number;
  qualityScore: number;
  hasRealIndicators?: boolean;
}

export interface QualityNonConformityStatsContract {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface QualityPredictiveAnalysisContract {
  nextMonthNCs: number;
  riskLevel: "low" | "medium" | "high";
  patterns: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface QualityNonConformityContract {
  id: string;
  sourceId?: string;
  companyId: string;
  ncNumber: string;
  title: string;
  description?: string;
  category?: string;
  severity: string;
  status: string;
  source?: string;
  detectedDate?: string;
  dueDate?: string;
  resolvedAt?: string;
  completedAt?: string;
  currentStage?: number;
  stage1CompletedAt?: string;
  stage2CompletedAt?: string;
  stage3CompletedAt?: string;
  stage4CompletedAt?: string;
  stage5CompletedAt?: string;
  stage6CompletedAt?: string;
  revisionNumber?: number;
  parentNcId?: string;
  organizationalUnitId?: string;
  processId?: string;
  sector?: string;
  damageLevel?: string;
  impactAnalysis?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  effectivenessEvaluation?: string;
  effectivenessDate?: string;
  responsibleUserId?: string;
  approvedByUserId?: string;
  approvalDate?: string;
  approvalNotes?: string;
  recurrenceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type QualityNonConformitySyncInput = Omit<QualityNonConformityContract, "id">;
