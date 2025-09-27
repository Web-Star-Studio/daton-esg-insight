import { useMemo, useCallback, useRef, useEffect } from 'react';
import { errorHandler } from '@/utils/errorHandler';

// Hook para memoização de listas com comparação inteligente
export function useOptimizedList<T>(
  list: T[],
  keyExtractor: (item: T) => string | number,
  dependencies: React.DependencyList = []
) {
  return useMemo(() => {
    return list.map((item, index) => ({
      item,
      key: keyExtractor(item),
      index
    }));
  }, [list, keyExtractor, ...dependencies]);
}

// Hook para debounced search otimizado
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    async (query: string): Promise<T[]> => {
      return new Promise((resolve) => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(async () => {
          try {
            const results = await searchFunction(query);
            resolve(results);
          } catch (error) {
            errorHandler.handle(error, {
              component: 'useDebouncedSearch',
              function: 'searchFunction'
            });
            resolve([]);
          }
        }, delay);
      });
    },
    [searchFunction, delay]
  );
}

// Hook para callback estável com error handling
export function useStableAsyncCallback<T extends any[], R>(
  callback: (...args: T) => Promise<R>,
  deps: React.DependencyList,
  context?: { component: string; function: string }
) {
  return useCallback(
    async (...args: T): Promise<R | undefined> => {
      try {
        return await callback(...args);
      } catch (error) {
        errorHandler.handle(error, context);
        return undefined;
      }
    },
    deps
  );
}

// Hook para memoização de objetos complexos
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// Hook para cache de recursos computacionalmente caros
export function useComputedCache<T>(
  computeFunction: () => T,
  dependencies: React.DependencyList,
  cacheKey?: string
) {
  const cache = useRef<Map<string, T>>(new Map());
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(dependencies);
    
    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }
    
    const result = computeFunction();
    cache.current.set(key, result);
    
    // Limitar cache size
    if (cache.current.size > 50) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return result;
  }, dependencies);
}

// Hook para detectar mudanças desnecessárias no desenvolvimento
export function useRenderOptimizer(componentName: string, props?: any) {
  const renderCountRef = useRef(0);
  const prevPropsRef = useRef(props);
  
  useEffect(() => {
    renderCountRef.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCountRef.current} times`);
      
      if (prevPropsRef.current && props) {
        const changedProps = Object.keys(props).filter(
          key => prevPropsRef.current[key] !== props[key]
        );
        
        if (changedProps.length > 0) {
          console.log(`📝 ${componentName} props changed:`, changedProps);
        }
      }
    }
    
    prevPropsRef.current = props;
  });
  
  return renderCountRef.current;
}