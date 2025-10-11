/**
 * Performance Monitoring Utility
 * Tracks application performance metrics in production
 */

import { PRODUCTION_CONFIG, isProduction } from './productionConfig';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, metadata);
      
      if (!isProduction() && duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, { ...metadata, error });
      throw error;
    }
  }

  /**
   * Measure synchronous function execution
   */
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, metadata);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, { ...metadata, error });
      throw error;
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // In production, send to monitoring service
    if (isProduction() && PRODUCTION_CONFIG.LOGGING.ENABLE_ERROR_REPORTING) {
      // TODO: Send to monitoring service (e.g., DataDog, New Relic)
      // Example: monitoringService.recordMetric(metric);
    }
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const matchingMetrics = this.metrics.filter(m => m.name === name);
    
    if (matchingMetrics.length === 0) {
      return null;
    }

    const values = matchingMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[p95Index] || values[values.length - 1],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Monitor Web Vitals (CLS, FID, LCP)
   */
  observeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('web_vital_lcp', lastEntry.renderTime || lastEntry.loadTime, {
            type: 'largest_contentful_paint'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('web_vital_fid', entry.processingStart - entry.startTime, {
              type: 'first_input_delay'
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Observe Cumulative Layout Shift (CLS)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
              this.recordMetric('web_vital_cls', clsScore, {
                type: 'cumulative_layout_shift'
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.error('Error observing web vitals:', error);
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Initialize web vitals monitoring if enabled
if (PRODUCTION_CONFIG.PERFORMANCE.ENABLE_MEMORY_OPTIMIZATION) {
  performanceMonitor.observeWebVitals();
}
