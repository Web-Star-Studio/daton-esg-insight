import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/MainLayout';
import { logger } from '@/utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Editor' | 'Leitor';
}

// Map service roles to UI role types
const mapRoleToUIRole = (serviceRole: string): 'Admin' | 'Editor' | 'Leitor' => {
  const lowerRole = serviceRole.toLowerCase();
  if (lowerRole === 'admin' || lowerRole === 'super_admin') return 'Admin';
  if (lowerRole === 'manager' || lowerRole === 'analyst' || lowerRole === 'operator' || lowerRole === 'auditor') return 'Editor';
  return 'Leitor'; // viewer and any other role
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  logger.debug('ProtectedRoute check', 'auth', { 
    hasUser: !!user, 
    isLoading, 
    requiredRole,
    userRole: user?.role 
  });

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Verificar permissões de role se especificado
  if (requiredRole) {
    const roleHierarchy = { 'Leitor': 1, 'Editor': 2, 'Admin': 3 };
    const mappedUserRole = mapRoleToUIRole(user.role);
    const userRoleLevel = roleHierarchy[mappedUserRole];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    logger.debug('Role check', 'auth', {
      serviceRole: user.role,
      mappedRole: mappedUserRole,
      requiredRole,
      userLevel: userRoleLevel,
      requiredLevel: requiredRoleLevel
    });

    if (userRoleLevel < requiredRoleLevel) {
      logger.warn('Access denied - insufficient role', 'auth', {
        required: requiredRole,
        user: mappedUserRole
      });
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Necessário: {requiredRole} | Seu nível: {mappedUserRole}
            </p>
          </div>
        </div>
      );
    }
  }

  logger.debug('ProtectedRoute: Access granted', 'auth');

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}