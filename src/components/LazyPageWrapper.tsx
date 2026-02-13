import React from 'react';
import { TreeLoadingScreen } from '@/components/TreeLoadingScreen';
import { unifiedToast } from '@/utils/unifiedToast';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';

interface LazyPageWrapperProps {
  children: React.ReactNode;
}

// Wrapper otimizado para páginas lazy com loading e error boundary
export const LazyPageWrapper: React.FC<LazyPageWrapperProps> = ({ children }) => {
  return (
    <React.Suspense fallback={<TreeLoadingScreen />}>
      <EnhancedErrorBoundary
        onError={(error, errorInfo) => {
          unifiedToast.error("Erro na página", {
            description: "Ocorreu um erro inesperado. Recarregue a página."
          });
        }}
      >
        {children}
      </EnhancedErrorBoundary>
    </React.Suspense>
  );
};