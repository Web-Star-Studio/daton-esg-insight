import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  performance_score: number;
  memory_usage: number;
  api_response_time: number;
  cache_hit_rate: number;
  active_users: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: Date;
}

interface OptimizationSettings {
  auto_refresh_enabled: boolean;
  cache_duration: number;
  background_sync: boolean;
  performance_mode: 'balanced' | 'performance' | 'battery';
  notification_throttle: number;
}

export const useSystemOptimization = () => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    performance_score: 95,
    memory_usage: 42,
    api_response_time: 120,
    cache_hit_rate: 89,
    active_users: 1,
    system_health: 'excellent',
    last_updated: new Date()
  });

  const [settings, setSettings] = useState<OptimizationSettings>({
    auto_refresh_enabled: true,
    cache_duration: 300000, // 5 minutes
    background_sync: true,
    performance_mode: 'balanced',
    notification_throttle: 5000 // 5 seconds
  });

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!settings.auto_refresh_enabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        performance_score: Math.max(85, Math.min(100, prev.performance_score + (Math.random() - 0.5) * 3)),
        memory_usage: Math.max(20, Math.min(80, prev.memory_usage + (Math.random() - 0.5) * 5)),
        api_response_time: Math.max(50, Math.min(300, prev.api_response_time + (Math.random() - 0.5) * 20)),
        cache_hit_rate: Math.max(70, Math.min(95, prev.cache_hit_rate + (Math.random() - 0.5) * 2)),
        last_updated: new Date()
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [settings.auto_refresh_enabled]);

  // Smart cache management
  const optimizeCache = useCallback(() => {
    // Clear stale queries
    queryClient.clear();
    
    // Prefetch critical data
    const criticalQueries = [
      'quality-dashboard',
      'esg-dashboard',
      'emission-stats',
      'smart-report-templates'
    ];

    criticalQueries.forEach(key => {
      queryClient.prefetchQuery({
        queryKey: [key],
        staleTime: settings.cache_duration,
      });
    });
  }, [queryClient, settings.cache_duration]);

  // Performance monitoring
  const { data: performanceData } = useQuery({
    queryKey: ['system-performance'],
    queryFn: async () => {
      // Simulate performance check
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 50));
      const end = performance.now();
      
      return {
        response_time: end - start,
        timestamp: new Date(),
        health_score: metrics.performance_score
      };
    },
    refetchInterval: settings.auto_refresh_enabled ? 30000 : false,
  });

  // Real-time system health
  useEffect(() => {
    const channel = supabase
      .channel('system-health')
      .on('broadcast', { event: 'health-update' }, (payload) => {
        setMetrics(prev => ({
          ...prev,
          ...payload.data,
          last_updated: new Date()
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Intelligent background sync
  useEffect(() => {
    if (!settings.background_sync) return;

    const syncInterval = setInterval(() => {
      // Sync only if user is active and performance is good
      if (document.visibilityState === 'visible' && metrics.performance_score > 80) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const age = Date.now() - (query.state.dataUpdatedAt || 0);
            return age > settings.cache_duration;
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(syncInterval);
  }, [settings.background_sync, metrics.performance_score, queryClient, settings.cache_duration]);

  // Performance mode adjustments
  useEffect(() => {
    switch (settings.performance_mode) {
      case 'performance':
        setSettings(prev => ({
          ...prev,
          cache_duration: 600000, // 10 minutes
          notification_throttle: 2000
        }));
        break;
      case 'battery':
        setSettings(prev => ({
          ...prev,
          cache_duration: 1800000, // 30 minutes
          notification_throttle: 10000,
          auto_refresh_enabled: false
        }));
        break;
      default: // balanced
        break;
    }
  }, [settings.performance_mode]);

  const getSystemStatus = useCallback(() => {
    const { performance_score, memory_usage, api_response_time } = metrics;
    
    if (performance_score > 90 && memory_usage < 50 && api_response_time < 150) {
      return 'excellent';
    } else if (performance_score > 80 && memory_usage < 70 && api_response_time < 200) {
      return 'good';
    } else if (performance_score > 70 && memory_usage < 85 && api_response_time < 300) {
      return 'warning';
    } else {
      return 'critical';
    }
  }, [metrics]);

  const optimizeForMobile = useCallback(() => {
    if (window.innerWidth < 768) {
      setSettings(prev => ({
        ...prev,
        performance_mode: 'battery',
        cache_duration: 900000, // 15 minutes
        notification_throttle: 15000
      }));
    }
  }, []);

  useEffect(() => {
    optimizeForMobile();
    window.addEventListener('resize', optimizeForMobile);
    return () => window.removeEventListener('resize', optimizeForMobile);
  }, [optimizeForMobile]);

  return {
    metrics: {
      ...metrics,
      system_health: getSystemStatus()
    },
    settings,
    updateSettings: setSettings,
    optimizeCache,
    performanceData,
    isOptimized: metrics.performance_score > 85,
    recommendations: {
      cache_optimization: metrics.cache_hit_rate < 80,
      memory_cleanup: metrics.memory_usage > 75,
      api_optimization: metrics.api_response_time > 250
    }
  };
};