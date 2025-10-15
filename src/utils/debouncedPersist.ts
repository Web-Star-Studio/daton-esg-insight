// Debounced persistence utility for optimized localStorage writes
import { logger } from './logger';

interface PersistQueueItem {
  key: string;
  value: any;
  timestamp: number;
}

class DebouncedPersist {
  private queue: Map<string, PersistQueueItem> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms debounce
  private readonly MAX_QUEUE_SIZE = 50;

  /**
   * Schedule a debounced save to localStorage
   */
  save(key: string, value: any): void {
    // Add to queue
    this.queue.set(key, {
      key,
      value,
      timestamp: Date.now()
    });

    // Auto-flush if queue gets too large
    if (this.queue.size >= this.MAX_QUEUE_SIZE) {
      logger.warn('DebouncedPersist: Queue size limit reached, flushing immediately');
      this.flush();
      return;
    }

    // Reset debounce timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Immediately flush all pending writes
   */
  flush(): void {
    if (this.queue.size === 0) return;

    const items = Array.from(this.queue.values());
    
    try {
      items.forEach(item => {
        try {
          const serialized = JSON.stringify(item.value);
          localStorage.setItem(item.key, serialized);
        } catch (err) {
          logger.error(`Failed to persist ${item.key}:`, err);
        }
      });

      logger.info(`💾 Flushed ${items.length} items to localStorage`);
    } finally {
      this.queue.clear();
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: string): void {
    this.queue.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (err) {
      logger.error(`Failed to remove ${key}:`, err);
    }
  }

  /**
   * Clear all pending writes and optionally clear storage
   */
  clear(clearStorage = false): void {
    this.queue.clear();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (clearStorage) {
      try {
        localStorage.clear();
      } catch (err) {
        logger.error('Failed to clear localStorage:', err);
      }
    }
  }
}

// Export singleton instance
export const debouncedPersist = new DebouncedPersist();

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    debouncedPersist.flush();
  });
}
