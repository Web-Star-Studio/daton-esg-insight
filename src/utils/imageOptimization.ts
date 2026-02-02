/**
 * Image Optimization Utilities
 * Provides WebP detection, critical image preloading, and optimization helpers
 */

// Cached WebP support check
let webpSupported: boolean | null = null;

/**
 * Check if browser supports WebP format
 */
export async function supportsWebP(): Promise<boolean> {
  if (webpSupported !== null) return webpSupported;
  
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    webpSupported = false;
  }
  
  return webpSupported;
}

/**
 * Synchronous WebP check (uses cached value)
 */
export function supportsWebPSync(): boolean {
  return webpSupported ?? false;
}

/**
 * Initialize WebP support check on module load
 */
if (typeof window !== 'undefined') {
  supportsWebP();
}

/**
 * Get optimized image URL with optional CDN transformations
 */
export function getOptimizedImageUrl(
  src: string, 
  options: { width?: number; quality?: number; format?: 'webp' | 'jpg' | 'png' } = {}
): string {
  const { width = 800, quality = 80 } = options;
  
  // If using a CDN that supports image optimization (e.g., Cloudinary, Imgix)
  // Return transformed URL. For now, return original.
  // Example Cloudinary: `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality}/${src}`
  return src;
}

/**
 * Preload critical images for LCP optimization
 * Call early in page lifecycle for hero/above-fold images
 */
export function preloadCriticalImages(urls: string[]): void {
  if (typeof document === 'undefined') return;
  
  urls.forEach(url => {
    // Check if already preloaded
    const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Create a responsive srcset string for different breakpoints
 */
export function createSrcSet(
  baseSrc: string,
  breakpoints: { width: number; suffix?: string }[] = [
    { width: 480, suffix: '-sm' },
    { width: 768, suffix: '-md' },
    { width: 1024, suffix: '-lg' },
    { width: 1920, suffix: '-xl' },
  ]
): string {
  // This is a placeholder - in production, you'd have actual resized images
  // For now, return the base src for all breakpoints
  return breakpoints
    .map(bp => `${baseSrc} ${bp.width}w`)
    .join(', ');
}

/**
 * Calculate optimal image dimensions based on container and device pixel ratio
 */
export function getOptimalImageDimensions(
  containerWidth: number,
  aspectRatio: number = 16 / 9,
  maxWidth: number = 1920
): { width: number; height: number } {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const width = Math.min(Math.ceil(containerWidth * dpr), maxWidth);
  const height = Math.ceil(width / aspectRatio);
  
  return { width, height };
}

/**
 * Lazy load an image with IntersectionObserver
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  options: { rootMargin?: string; threshold?: number } = {}
): () => void {
  const { rootMargin = '100px', threshold = 0.1 } = options;
  
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback for browsers without IntersectionObserver
    imgElement.src = src;
    return () => {};
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          observer.disconnect();
        }
      });
    },
    { rootMargin, threshold }
  );
  
  observer.observe(imgElement);
  
  return () => observer.disconnect();
}
