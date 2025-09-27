import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CacheEntry {
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  usage: number;
  size: number;
}

interface CacheMetrics {
  hitRate: number;
  memoryUsage: number;
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

const CACHE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
const TTL_CONFIG = {
  high: 30 * 60 * 1000, // 30 minutes
  medium: 15 * 60 * 1000, // 15 minutes
  low: 5 * 60 * 1000, // 5 minutes
};

export function useIntelligentCache() {
  const queryClient = useQueryClient();
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [metrics, setMetrics] = useState<CacheMetrics>({
    hitRate: 0,
    memoryUsage: 0,
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  // Calculate cache size in bytes
  const calculateCacheSize = useCallback(() => {
    let totalSize = 0;
    cache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }, [cache]);

  // Intelligent cache eviction based on LRU + priority + usage frequency
  const evictLeastUseful = useCallback(() => {
    const entries = Array.from(cache.entries());
    
    // Sort by usefulness score (lower is less useful)
    entries.sort(([, a], [, b]) => {
      const scoreA = (a.usage * getPriorityWeight(a.priority)) / (Date.now() - a.timestamp);
      const scoreB = (b.usage * getPriorityWeight(b.priority)) / (Date.now() - b.timestamp);
      return scoreA - scoreB;
    });

    // Remove least useful entries until we're under 80% of limit
    const targetSize = CACHE_SIZE_LIMIT * 0.8;
    let currentSize = calculateCacheSize();
    let evicted = 0;

    for (const [key] of entries) {
      if (currentSize <= targetSize) break;
      
      const entry = cache.get(key);
      if (entry) {
        currentSize -= entry.size;
        cache.delete(key);
        queryClient.removeQueries({ queryKey: [key] });
        evicted++;
      }
    }

    console.log(`🧹 Cache eviction: removed ${evicted} entries`);
    return evicted;
  }, [cache, calculateCacheSize, queryClient]);

  // Get priority weight for scoring
  const getPriorityWeight = (priority: CacheEntry['priority']): number => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  };

  // Smart cache storage
  const setInCache = useCallback((
    key: string, 
    data: any, 
    priority: CacheEntry['priority'] = 'medium'
  ) => {
    const size = JSON.stringify(data).length * 2; // Approximate size in bytes
    const currentSize = calculateCacheSize();

    // Check if we need to evict before adding
    if (currentSize + size > CACHE_SIZE_LIMIT) {
      evictLeastUseful();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      priority,
      usage: 1,
      size,
    };

    setCache(prev => new Map(prev.set(key, entry)));
    
    // Store in React Query cache with TTL
    queryClient.setQueryData([key], data, {
      updatedAt: Date.now(),
    });

    console.log(`💾 Cached "${key}" (${priority} priority, ${(size / 1024).toFixed(1)}KB)`);
  }, [calculateCacheSize, evictLeastUseful, queryClient]);

  // Smart cache retrieval
  const getFromCache = useCallback((key: string) => {
    const entry = cache.get(key);
    
    if (!entry) {
      setMetrics(prev => ({
        ...prev,
        cacheMisses: prev.cacheMisses + 1,
        totalQueries: prev.totalQueries + 1,
      }));
      return null;
    }

    // Check TTL based on priority
    const ttl = TTL_CONFIG[entry.priority];
    const isExpired = Date.now() - entry.timestamp > ttl;

    if (isExpired) {
      cache.delete(key);
      queryClient.removeQueries({ queryKey: [key] });
      setMetrics(prev => ({
        ...prev,
        cacheMisses: prev.cacheMisses + 1,
        totalQueries: prev.totalQueries + 1,
      }));
      return null;
    }

    // Update usage and hit metrics
    entry.usage++;
    setMetrics(prev => ({
      ...prev,
      cacheHits: prev.cacheHits + 1,
      totalQueries: prev.totalQueries + 1,
      hitRate: ((prev.cacheHits + 1) / (prev.totalQueries + 1)) * 100,
    }));

    console.log(`⚡ Cache hit for "${key}" (usage: ${entry.usage})`);
    return entry.data;
  }, [cache, queryClient]);

  // Prefetch based on user behavior patterns
  const prefetchData = useCallback(async (
    keys: string[], 
    fetchFn: (key: string) => Promise<any>,
    priority: CacheEntry['priority'] = 'low'
  ) => {
    const prefetchPromises = keys.map(async (key) => {
      if (!cache.has(key)) {
        try {
          const data = await fetchFn(key);
          setInCache(key, data, priority);
        } catch (error) {
          console.warn(`Failed to prefetch ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
    console.log(`🔮 Prefetched ${keys.length} items`);
  }, [cache, setInCache]);

  // Clear expired entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      cache.forEach((entry, key) => {
        const ttl = TTL_CONFIG[entry.priority];
        if (now - entry.timestamp > ttl) {
          cache.delete(key);
          queryClient.removeQueries({ queryKey: [key] });
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }

      // Update memory usage metric
      setMetrics(prev => ({
        ...prev,
        memoryUsage: (calculateCacheSize() / CACHE_SIZE_LIMIT) * 100,
      }));
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [cache, queryClient, calculateCacheSize]);

  // Clear all cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    queryClient.clear();
    setMetrics({
      hitRate: 0,
      memoryUsage: 0,
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });
    console.log('🗑️ Cache cleared');
  }, [queryClient]);

  return {
    setInCache,
    getFromCache,
    prefetchData,
    clearCache,
    metrics,
    cacheSize: cache.size,
    memoryUsage: calculateCacheSize(),
  };
}