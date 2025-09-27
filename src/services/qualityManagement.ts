// DEPRECATED: This service has been consolidated into unifiedQualityService.ts
// This file is kept for backward compatibility but will be removed in future versions

import { unifiedQualityService } from './unifiedQualityService';

// Re-export types from unified service
export type { 
  QualityDashboard,
  QualityIndicatorData,
  QualityInsight,
  QualityMetrics,
  QualityIndicator
} from './unifiedQualityService';

// Redirect all methods to unified service
export const qualityManagementService = {
  getQualityDashboard: () => unifiedQualityService.getQualityDashboard(),
  getNonConformityStats: () => unifiedQualityService.getNonConformityStats(),
  getActionPlansProgress: () => unifiedQualityService.getActionPlansProgress(),
  getRiskMatrix: (id: string) => unifiedQualityService.getRiskMatrix(id),
  getProcessEfficiency: () => unifiedQualityService.getProcessEfficiency(),
  getQualityIndicators: () => unifiedQualityService.getQualityIndicators(),
  getStrategicMaps: () => unifiedQualityService.getStrategicMaps(),
  createStrategicMap: (data: any) => unifiedQualityService.createStrategicMap(data),
  getBSCPerspectives: (id: string) => unifiedQualityService.getBSCPerspectives(id),
  createBSCPerspective: (data: any) => unifiedQualityService.createBSCPerspective(data),
  getProcessMaps: () => unifiedQualityService.getProcessMaps(),
  createProcessMap: (data: any) => unifiedQualityService.createProcessMap(data),
  getRiskMatrices: () => unifiedQualityService.getRiskMatrices(),
  createRiskMatrix: (data: any) => unifiedQualityService.createRiskMatrix(data),
  getNonConformities: () => unifiedQualityService.getNonConformities(),
  createNonConformity: (data: any) => unifiedQualityService.createNonConformity(data),
  getSuppliers: async () => [], // Deprecated - moved to dedicated supplier service
  createSupplier: async (data: any) => ({}) // Deprecated - moved to dedicated supplier service
};
// All methods have been moved to unifiedQualityService.ts