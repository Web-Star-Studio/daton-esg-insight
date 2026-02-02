/**
 * Web Vitals Reporting Utility
 * Tracks Core Web Vitals (LCP, FCP, CLS, FID, TTFB) with rating classification
 */

import { performanceMonitor } from './performanceMonitor';

export interface WebVitalMetric {
  name: 'LCP' | 'FCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

// Thresholds based on Google Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  TTFB: { good: 600, poor: 1000 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals metrics
 * @param onPerfEntry - Callback for each metric
 */
export function reportWebVitals(onPerfEntry?: (metric: WebVitalMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
      
      const metric: WebVitalMetric = {
        name: 'LCP',
        value,
        rating: getRating('LCP', value),
      };
      
      performanceMonitor.recordMetric('web_vital_lcp', value, { rating: metric.rating });
      onPerfEntry?.(metric);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // FCP - First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      if (fcp) {
        const value = fcp.startTime;
        const metric: WebVitalMetric = {
          name: 'FCP',
          value,
          rating: getRating('FCP', value),
        };
        
        performanceMonitor.recordMetric('web_vital_fcp', value, { rating: metric.rating });
        onPerfEntry?.(metric);
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

    // CLS - Cumulative Layout Shift
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
        if (!entry.hadRecentInput && entry.value) {
          clsScore += entry.value;
          const metric: WebVitalMetric = {
            name: 'CLS',
            value: clsScore,
            rating: getRating('CLS', clsScore),
            delta: entry.value,
          };
          
          performanceMonitor.recordMetric('web_vital_cls', clsScore, { rating: metric.rating });
          onPerfEntry?.(metric);
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // FID - First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as (PerformanceEntry & { processingStart?: number })[]; 
      entries.forEach((entry) => {
        if (entry.processingStart) {
          const value = entry.processingStart - entry.startTime;
          const metric: WebVitalMetric = {
            name: 'FID',
            value,
            rating: getRating('FID', value),
          };
          
          performanceMonitor.recordMetric('web_vital_fid', value, { rating: metric.rating });
          onPerfEntry?.(metric);
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // TTFB - Time to First Byte (from navigation timing)
    const navObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceNavigationTiming[];
      entries.forEach((entry) => {
        const value = entry.responseStart - entry.requestStart;
        if (value > 0) {
          const metric: WebVitalMetric = {
            name: 'TTFB',
            value,
            rating: getRating('TTFB', value),
          };
          
          performanceMonitor.recordMetric('web_vital_ttfb', value, { rating: metric.rating });
          onPerfEntry?.(metric);
        }
      });
    });
    navObserver.observe({ type: 'navigation', buffered: true });

  } catch (error) {
    // Silently fail if observers aren't supported
    console.warn('Web Vitals monitoring not fully supported:', error);
  }
}

/**
 * Get a summary of current Web Vitals
 */
export function getWebVitalsSummary(): Record<string, { value: number; rating: string } | null> {
  const stats = performanceMonitor.getAllMetrics();
  const summary: Record<string, { value: number; rating: string } | null> = {};
  
  ['lcp', 'fcp', 'cls', 'fid', 'ttfb'].forEach((vital) => {
    const metric = stats.find(m => m.name === `web_vital_${vital}`);
    if (metric) {
      summary[vital.toUpperCase()] = {
        value: metric.value,
        rating: metric.metadata?.rating || 'unknown',
      };
    } else {
      summary[vital.toUpperCase()] = null;
    }
  });
  
  return summary;
}
