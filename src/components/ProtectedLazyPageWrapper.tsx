import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LazyPageWrapper } from '@/components/LazyPageWrapper';

interface ProtectedLazyPageWrapperProps {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Editor' | 'Leitor';
}

/**
 * Wrapper que combina ProtectedRoute (autenticação + MainLayout) com LazyPageWrapper (Suspense + ErrorBoundary)
 * Garante que todas as páginas protegidas tenham:
 * - Verificação de autenticação
 * - MainLayout com AppSidebar
 * - Loading states consistentes
 * - Error boundaries robustos
 */
export const ProtectedLazyPageWrapper: React.FC<ProtectedLazyPageWrapperProps> = ({ 
  children, 
  requiredRole 
}) => {
  return (
    <LazyPageWrapper>
      <ProtectedRoute requiredRole={requiredRole}>
        {children}
      </ProtectedRoute>
    </LazyPageWrapper>
  );
};
