import { memo, useCallback, useMemo, useRef } from 'react';

// Hook para memoização inteligente de props
export function useStableCallback<T extends (...args: any[]) => any>(fn: T, deps: React.DependencyList): T {
  return useCallback(fn, deps);
}

// Hook para memoização de objetos complexos
export function useStableObject<T extends Record<string, any>>(obj: T, deps: React.DependencyList): T {
  return useMemo(() => obj, deps);
}

// HOC para criar componentes memoizados com comparação personalizada
export function createMemoizedComponent<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

// Comparador padrão que ignora mudanças em funções
export const defaultPropsComparator = <P extends Record<string, any>>(
  prevProps: P,
  nextProps: P
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    // Ignora comparação de funções (assume que são estáveis se memoizadas corretamente)
    if (typeof prevValue === 'function' && typeof nextValue === 'function') {
      return true;
    }
    
    return prevValue === nextValue;
  });
};

// Hook para detectar re-renders desnecessários (desenvolvimento)
export function useRenderTracker(componentName: string, props?: Record<string, any>) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  if (process.env.NODE_ENV === 'development') {
    const count = (window as any).__renderCounts?.[componentName] || 0;
    (window as any).__renderCounts = {
      ...(window as any).__renderCounts,
      [componentName]: count + 1,
    };
    
    console.warn(`🔄 ${componentName} rendered (${renderCountRef.current}x)`, props);
  }
}
