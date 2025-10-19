/**
 * Simple in-memory cache with TTL for company data
 * Reduces database queries and improves response time
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get data from cache
 */
export function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  console.log(`✅ Cache HIT: ${key}`);
  return entry.data;
}

/**
 * Set data in cache with TTL
 */
export function setInCache(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
  console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  cache.delete(key);
  console.log(`🗑️ Cleared cache: ${key}`);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  const size = cache.size;
  cache.clear();
  console.log(`🗑️ Cleared all cache (${size} entries)`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
  }
}

// Auto-cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);
