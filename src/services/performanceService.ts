import { QueryClient } from '@tanstack/react-query';

export interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  cacheEfficiency: number;
  networkLatency: number;
}

export interface OptimizationReport {
  score: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    recommendation: string;
  }>;
  metrics: PerformanceMetrics;
}

class PerformanceService {
  private queryClient: QueryClient | null = null;

  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  async analyzePerformance(): Promise<OptimizationReport> {
    const metrics = await this.collectMetrics();
    const issues = this.identifyIssues(metrics);
    const score = this.calculateScore(metrics, issues);

    return {
      score,
      issues,
      metrics
    };
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    // Memory usage
    const memoryUsage = (performance as any).memory ? 
      (performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize * 100 : 0;

    // Render performance
    const renderStart = performance.now();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const renderTime = performance.now() - renderStart;

    // Network metrics
    const networkEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const networkLatency = networkEntries.length > 0 ? 
      networkEntries[0].responseStart - networkEntries[0].requestStart : 0;

    // Cache efficiency
    const cacheStats = this.getCacheStats();
    const cacheEfficiency = cacheStats.totalQueries > 0 ? 
      (cacheStats.totalQueries - cacheStats.fetchingQueries) / cacheStats.totalQueries * 100 : 100;

    return {
      memoryUsage,
      renderTime,
      bundleSize: 0, // Would need build-time analysis
      cacheEfficiency,
      networkLatency
    };
  }

  private identifyIssues(metrics: PerformanceMetrics) {
    const issues = [];

    if (metrics.memoryUsage > 80) {
      issues.push({
        severity: 'high' as const,
        type: 'memory',
        description: 'Alto uso de memória detectado',
        recommendation: 'Considere limpar o cache ou otimizar componentes'
      });
    }

    if (metrics.renderTime > 16) {
      issues.push({
        severity: 'medium' as const,
        type: 'performance',
        description: 'Tempo de renderização acima do ideal',
        recommendation: 'Otimize componentes com React.memo e useCallback'
      });
    }

    if (metrics.cacheEfficiency < 70) {
      issues.push({
        severity: 'medium' as const,
        type: 'cache',
        description: 'Eficiência de cache baixa',
        recommendation: 'Ajuste configurações de staleTime e gcTime'
      });
    }

    if (metrics.networkLatency > 500) {
      issues.push({
        severity: 'high' as const,
        type: 'network',
        description: 'Alta latência de rede',
        recommendation: 'Implemente estratégias de retry e timeout'
      });
    }

    return issues;
  }

  private calculateScore(metrics: PerformanceMetrics, issues: any[]): number {
    let score = 100;

    // Deduct points based on issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Bonus for good metrics
    if (metrics.memoryUsage < 50) score += 5;
    if (metrics.renderTime < 8) score += 5;
    if (metrics.cacheEfficiency > 90) score += 5;
    if (metrics.networkLatency < 200) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private getCacheStats() {
    if (!this.queryClient) {
      return { totalQueries: 0, fetchingQueries: 0, staleQueries: 0 };
    }

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      fetchingQueries: queries.filter(q => q.state.status === 'pending').length,
      staleQueries: queries.filter(q => q.isStale()).length,
    };
  }

  optimizeSystem() {
    if (!this.queryClient) return;

    // Clear stale queries
    this.queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.state.status !== 'pending'
    });

    // Prefetch critical data
    const criticalQueries = [
      { key: ['quality-dashboard'], priority: 'high' },
      { key: ['esg-dashboard'], priority: 'high' },
      { key: ['emission-stats'], priority: 'medium' }
    ];

    criticalQueries.forEach(({ key }) => {
      this.queryClient?.prefetchQuery({
        queryKey: key,
        staleTime: 5 * 60 * 1000,
      });
    });

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  monitorPerformance() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    return () => observer.disconnect();
  }
}

export const performanceService = new PerformanceService();