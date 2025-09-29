import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function NavigationMonitor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const currentPath = location.pathname;
    const isAuthenticated = !!user;
    
    // Log navigation for debugging
    console.info(`NavigationMonitor: Navegando para ${currentPath}`);
    
    // Check for authentication issues
    if (!isAuthenticated && currentPath !== '/' && currentPath !== '/auth' && currentPath !== '/onboarding') {
      console.warn(`NavigationMonitor: Usuário não autenticado tentando acessar ${currentPath}`);
      toast.error('Acesso negado', {
        description: 'Você precisa estar logado para acessar esta página.',
        duration: 4000,
      });
      navigate('/auth', { replace: true });
      return;
    }

    // Monitor for route loading issues
    const timeoutId = setTimeout(() => {
      // Check if page content loaded properly
      const mainContent = document.querySelector('main');
      if (!mainContent || mainContent.children.length === 0) {
        console.warn(`NavigationMonitor: Possível falha no carregamento da página ${currentPath}`);
        toast.warning('Problema de carregamento', {
          description: 'A página pode não ter carregado completamente. Tentando recarregar...',
          duration: 3000,
        });
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, navigate, user]);

  return null;
}