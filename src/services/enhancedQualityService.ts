// DEPRECATED: This service has been consolidated into unifiedQualityService.ts
// This file is kept for backward compatibility but will be removed in future versions

import { unifiedQualityService } from './unifiedQualityService';

// Re-export types from unified service
export type { 
  QualityMetrics,
  QualityInsight 
} from './unifiedQualityService';

// Redirect all methods to unified service
export const enhancedQualityService = {
  getQualityMetrics: () => unifiedQualityService.getQualityDashboard().then(d => d.metrics),
  generateQualityInsights: (metrics: any) => unifiedQualityService.generateInsights(metrics),
  getPredictiveAnalysis: (metrics?: any) => unifiedQualityService.getPredictiveAnalysis(),
  getQualityTrends: (period: string) => unifiedQualityService.getQualityTrends(period),
  getTeamPerformance: () => unifiedQualityService.getTeamPerformance()
};