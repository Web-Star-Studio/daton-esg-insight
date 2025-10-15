// Memory cleanup utilities for optimized performance
import { logger } from './logger';
import { debouncedPersist } from './debouncedPersist';

/**
 * Clean up stale localStorage entries
 */
export function cleanupStaleCache(prefix: string, maxAge: number = 24 * 60 * 60 * 1000) {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const data = JSON.parse(item);
        const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).getTime() : 0;

        if (now - lastUpdate > maxAge) {
          keysToRemove.push(key);
        }
      } catch (err) {
        // Invalid JSON, mark for removal
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      logger.info(`🧹 Cleaned up ${keysToRemove.length} stale cache entries`);
    }
  } catch (error) {
    logger.error('Failed to cleanup stale cache:', error);
  }
}

/**
 * Measure and log localStorage usage
 */
export function measureStorageUsage(): { used: number; limit: number; percentage: number } {
  try {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }

    // Most browsers support 5-10MB, use 5MB as safe limit
    const limit = 5 * 1024 * 1024;
    const percentage = (total / limit) * 100;

    logger.info(`💾 Storage: ${(total / 1024).toFixed(2)} KB / ${(limit / 1024).toFixed(0)} KB (${percentage.toFixed(1)}%)`);

    return {
      used: total,
      limit,
      percentage
    };
  } catch (error) {
    logger.error('Failed to measure storage:', error);
    return { used: 0, limit: 0, percentage: 0 };
  }
}

/**
 * Setup automatic cleanup on app initialization
 */
export function setupAutomaticCleanup() {
  // Cleanup stale caches on load
  cleanupStaleCache('chat_messages_', 7 * 24 * 60 * 60 * 1000); // 7 days
  cleanupStaleCache('chat_attachments_', 7 * 24 * 60 * 60 * 1000); // 7 days

  // Measure storage
  const usage = measureStorageUsage();

  // Warn if storage is >80% full
  if (usage.percentage > 80) {
    logger.warn('⚠️ localStorage is >80% full, consider clearing old data');
  }

  // Flush pending writes before unload
  window.addEventListener('beforeunload', () => {
    debouncedPersist.flush();
  });
}

/**
 * Memory-safe JSON parse with error handling
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.warn('Failed to parse JSON, using fallback:', error);
    return fallback;
  }
}

/**
 * Trim old items from array to keep memory usage low
 */
export function trimArray<T>(arr: T[], maxItems: number): T[] {
  if (arr.length <= maxItems) return arr;
  return arr.slice(-maxItems);
}
