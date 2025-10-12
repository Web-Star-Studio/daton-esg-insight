/**
 * Bundle Optimization Utilities
 * Tools for analyzing and optimizing bundle size
 */

/**
 * Dynamic import wrapper with error handling
 */
export async function safeDynamicImport<T>(
  importFunc: () => Promise<T>,
  componentName: string
): Promise<T> {
  try {
    return await importFunc();
  } catch (error) {
    console.error(`Failed to load ${componentName}:`, error);
    throw new Error(`Component ${componentName} failed to load. Please refresh the page.`);
  }
}

/**
 * Check if we should use heavy features based on device capabilities
 */
export function shouldLoadHeavyFeatures(): boolean {
  if (typeof window === 'undefined') return true;

  // Check network quality
  const connection = (navigator as any).connection;
  if (connection) {
    const slowConnection = connection.effectiveType === 'slow-2g' || 
                          connection.effectiveType === '2g' ||
                          connection.saveData;
    if (slowConnection) return false;
  }

  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return false; // Less than 4GB RAM
  }

  return true;
}

/**
 * Lazy load heavy libraries only when needed
 */
export async function loadPDFLibrary() {
  if (!shouldLoadHeavyFeatures()) {
    console.warn('Skipping PDF library load due to device constraints');
    return null;
  }
  
  const jsPDF = await import('jspdf');
  return jsPDF.default;
}

export async function loadExcelLibrary() {
  if (!shouldLoadHeavyFeatures()) {
    console.warn('Skipping Excel library load due to device constraints');
    return null;
  }
  
  const XLSX = await import('xlsx');
  return XLSX;
}

export async function loadChartLibrary() {
  const recharts = await import('recharts');
  return recharts;
}

/**
 * Monitor bundle loading performance
 */
export function monitorBundlePerformance(): void {
  if (typeof window === 'undefined') return;

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            const resourceEntry = entry as PerformanceResourceTiming;
            const loadTime = resourceEntry.duration;
            
            if (loadTime > 1000) {
              console.warn(
                `⚠️ Slow bundle load: ${entry.name.split('/').pop()} took ${loadTime.toFixed(0)}ms`
              );
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Failed to set up performance monitoring:', error);
    }
  }
}
