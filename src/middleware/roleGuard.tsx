/**
 * Role-Based Access Control Guard
 * Protects routes based on user roles
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { ROUTE_PATHS } from '@/constants/routePaths';

export type UserRole = 'platform_admin' | 'super_admin' | 'admin' | 'manager' | 'analyst' | 'operator' | 'auditor' | 'viewer';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
  fallbackPath?: string;
}

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  platform_admin: 8,
  super_admin: 7,
  admin: 6,
  manager: 5,
  analyst: 4,
  operator: 3,
  auditor: 2,
  viewer: 1,
};

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole | UserRole[]): boolean {
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userLevel >= ROLE_HIERARCHY[role]);
  }
  
  return userLevel >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Route guard component that checks user role
 */
export function RoleGuard({ children, requiredRole, fallbackPath = ROUTE_PATHS.CORE.DASHBOARD }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication
  if (!user) {
    logger.warn('RoleGuard: User not authenticated, redirecting to auth');
    return <Navigate to={ROUTE_PATHS.PUBLIC.AUTH} replace />;
  }

  // Check role authorization
  const userRole = user.role as UserRole | undefined;
  if (!hasRole(userRole, requiredRole)) {
    logger.warn('RoleGuard: Insufficient permissions', {
      userRole,
      requiredRole,
      userId: user.id,
    });
    
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  return hasRole(user?.role as UserRole | undefined, requiredRole);
}

/**
 * Hook to get current user's role level
 */
export function useRoleLevel(): number {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;
  return ROLE_HIERARCHY[userRole || 'viewer'] || 0;
}