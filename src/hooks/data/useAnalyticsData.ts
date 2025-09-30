import { useState, useEffect, useCallback } from 'react';
import { analyticsService, AnalyticsData, UserActivityData, SystemPerformanceData } from '@/services/analyticsService';
import { errorHandler } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export function useAnalyticsData() {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [emissionsData, setEmissionsData] = useState<AnalyticsData | null>(null);
  const [qualityData, setQualityData] = useState<AnalyticsData | null>(null);
  const [complianceData, setComplianceData] = useState<AnalyticsData | null>(null);
  const [userActivityData, setUserActivityData] = useState<UserActivityData | null>(null);
  const [systemPerformanceData, setSystemPerformanceData] = useState<SystemPerformanceData | null>(null);

  const companyId = 'mock-company-id'; // This would come from auth context

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emissions, quality, compliance, userActivity, systemPerformance] = await Promise.all([
        analyticsService.getEmissionsAnalytics(companyId, 'quarter'),
        analyticsService.getQualityAnalytics(companyId),
        analyticsService.getComplianceAnalytics(companyId),
        analyticsService.getUserActivityAnalytics(),
        analyticsService.getSystemPerformanceAnalytics()
      ]);

      setEmissionsData(emissions);
      setQualityData(quality);
      setComplianceData(compliance);
      setUserActivityData(userActivity);
      setSystemPerformanceData(systemPerformance);
    } catch (error) {
      logger.error('Erro ao carregar analytics', error as Error, {
        component: 'useAnalyticsData',
        action: 'loadAnalyticsData'
      });
      errorHandler.showUserError(error, {
        component: 'useAnalyticsData',
        function: 'loadAnalyticsData'
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData, refreshKey]);

  return {
    isLoading,
    emissionsData,
    qualityData,
    complianceData,
    userActivityData,
    systemPerformanceData,
    handleRefresh,
  };
}
