import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function NavigationMonitor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const lastPathRef = useRef<string>('');
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const isAuthenticated = !!user;
    
    // Skip if same path to avoid unnecessary processing
    if (lastPathRef.current === currentPath) {
      return;
    }
    
    lastPathRef.current = currentPath;
    
    // Clear any existing loading toast
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    // Skip monitoring if still loading auth
    if (isLoading) {
      return;
    }
    
    // Log navigation for debugging (less verbose)
    console.info(`NavigationMonitor: ${currentPath}`);
    
    // Check for authentication issues - only for protected routes
    const protectedRoutes = ['/dashboard', '/inventario-gee', '/licenciamento', '/residuos', '/metas', '/relatorios'];
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
    
    if (!isAuthenticated && isProtectedRoute) {
      console.warn(`NavigationMonitor: Acesso negado para ${currentPath}`);
      toast.error('Acesso negado', {
        description: 'Você precisa estar logado para acessar esta página.',
        duration: 4000,
      });
      navigate('/auth', { replace: true });
      return;
    }

    // Improved loading detection - only for complex pages
    const complexPages = ['/dashboard', '/inventario-gee', '/gestao-esg', '/ia-insights'];
    const isComplexPage = complexPages.some(route => currentPath.startsWith(route));
    
    if (isComplexPage) {
      const timeoutId = setTimeout(() => {
        // More sophisticated loading check for React SPAs
        const mainContent = document.querySelector('main');
        const hasLoadingSpinner = document.querySelector('[data-loading="true"]');
        const hasErrorBoundary = document.querySelector('[data-error="true"]');
        
        // Only show warning if there's actually a problem
        if (mainContent && !hasLoadingSpinner && !hasErrorBoundary) {
          const hasContent = mainContent.querySelector('[data-testid], .card, .widget, .dashboard-item, .content-area');
          
          if (!hasContent) {
            console.warn(`NavigationMonitor: Conteúdo não detectado em ${currentPath}`);
            toastIdRef.current = toast.warning('Carregando...', {
              description: 'A página está demorando para carregar.',
              duration: 5000,
            });
          }
        }
      }, 5000); // Increased timeout for lazy-loaded components

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, navigate, user, isLoading]);

  return null;
}