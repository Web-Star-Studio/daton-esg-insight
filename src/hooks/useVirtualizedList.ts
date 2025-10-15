import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PERFORMANCE_CONFIG } from '@/config/performanceConfig';

interface VirtualizedListConfig<T> {
  items: T[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  enabled?: boolean; // Only enable for large lists
}

interface VirtualizedListResult<T> {
  virtualItems: T[];
  totalHeight: number;
  offsetY: number;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
  };
  itemProps: (index: number) => {
    style: React.CSSProperties;
  };
}

/**
 * Hook for virtualizing large lists to improve performance
 */
export function useVirtualizedList<T>({
  items,
  itemHeight = PERFORMANCE_CONFIG.virtualization.itemHeight,
  containerHeight = 600,
  overscan = PERFORMANCE_CONFIG.virtualization.overscan,
  enabled = items.length > PERFORMANCE_CONFIG.virtualization.threshold,
}: VirtualizedListConfig<T>): VirtualizedListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // If virtualization is disabled, return all items
  if (!enabled) {
    return {
      virtualItems: items,
      totalHeight: 0,
      offsetY: 0,
      containerProps: {
        style: {},
        onScroll: () => {},
      },
      itemProps: () => ({
        style: {},
      }),
    };
  }

  // Calculate visible range with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const virtualItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Debounced scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16); // ~60fps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    virtualItems,
    totalHeight,
    offsetY,
    containerProps: {
      style: {
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative',
      },
      onScroll: handleScroll,
    },
    itemProps: (index: number) => ({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${itemHeight}px`,
        transform: `translateY(${(startIndex + index) * itemHeight}px)`,
      },
    }),
  };
}
