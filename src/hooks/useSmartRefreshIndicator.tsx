import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RefreshActivity {
  timestamp: Date;
  queryKey: string;
  duration: number;
  success: boolean;
}

export const useSmartRefreshIndicator = () => {
  const [activities, setActivities] = useState<RefreshActivity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Simplified monitoring without complex state tracking
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const handleRefresh = () => {
      setIsRefreshing(true);
      const startTime = Date.now();
      
      refreshTimeout = setTimeout(() => {
        const duration = Date.now() - startTime;
        setActivities(prev => {
          const newActivity: RefreshActivity = {
            timestamp: new Date(),
            queryKey: 'system',
            duration,
            success: true
          };
          return [newActivity, ...prev].slice(0, 10);
        });
        setIsRefreshing(false);
      }, 1000);
    };

    // Trigger on any query invalidation
    const originalInvalidate = queryClient.invalidateQueries;
    queryClient.invalidateQueries = (...args) => {
      handleRefresh();
      return originalInvalidate.apply(queryClient, args);
    };

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      queryClient.invalidateQueries = originalInvalidate;
    };
  }, [queryClient]);

  const getRefreshStats = () => {
    const recentActivities = activities.filter(
      activity => Date.now() - activity.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    
    const successful = recentActivities.filter(a => a.success).length;
    const failed = recentActivities.filter(a => !a.success).length;
    const avgDuration = recentActivities.length > 0 
      ? recentActivities.reduce((sum, a) => sum + a.duration, 0) / recentActivities.length
      : 0;

    return {
      total: recentActivities.length,
      successful,
      failed,
      successRate: recentActivities.length > 0 ? (successful / recentActivities.length) * 100 : 100,
      avgDuration: Math.round(avgDuration),
      isPerformingWell: avgDuration < 1000 && (failed / Math.max(recentActivities.length, 1)) < 0.1
    };
  };

  const clearActivities = () => {
    setActivities([]);
  };

  return {
    activities,
    isRefreshing,
    stats: getRefreshStats(),
    clearActivities
  };
};
