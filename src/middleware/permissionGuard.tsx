/**
 * Permission-Based Access Control Guard
 * Finer-grained control than roles - checks specific permissions
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { ROUTE_PATHS } from '@/constants/routePaths';
import { hasRole, UserRole } from './roleGuard';

/**
 * Available permissions in the system
 */
export enum Permission {
  // Emissions & GHG
  VIEW_EMISSIONS = 'view_emissions',
  CREATE_EMISSIONS = 'create_emissions',
  EDIT_EMISSIONS = 'edit_emissions',
  DELETE_EMISSIONS = 'delete_emissions',
  
  // Licenses
  VIEW_LICENSES = 'view_licenses',
  CREATE_LICENSES = 'create_licenses',
  EDIT_LICENSES = 'edit_licenses',
  DELETE_LICENSES = 'delete_licenses',
  PROCESS_LICENSES = 'process_licenses',
  
  // Documents
  VIEW_DOCUMENTS = 'view_documents',
  UPLOAD_DOCUMENTS = 'upload_documents',
  DELETE_DOCUMENTS = 'delete_documents',
  EXTRACT_DOCUMENTS = 'extract_documents',
  
  // Goals
  VIEW_GOALS = 'view_goals',
  CREATE_GOALS = 'create_goals',
  EDIT_GOALS = 'edit_goals',
  DELETE_GOALS = 'delete_goals',
  
  // Reports
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Users & Admin
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_ROLES = 'manage_roles',
  
  // Configuration
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',
  MANAGE_COMPANY = 'manage_company',
  
  // Audit & Compliance
  VIEW_AUDITS = 'view_audits',
  CREATE_AUDITS = 'create_audits',
  APPROVE_AUDITS = 'approve_audits',
  
  // Quality (SGQ)
  VIEW_QUALITY = 'view_quality',
  MANAGE_QUALITY = 'manage_quality',
  APPROVE_ACTIONS = 'approve_actions',
}

/**
 * Permission mappings by role
 * Higher roles inherit all permissions from lower roles
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  platform_admin: Object.values(Permission), // All permissions - Platform owner
  super_admin: Object.values(Permission), // All permissions
  
  admin: [
    // Emissions
    Permission.VIEW_EMISSIONS,
    Permission.CREATE_EMISSIONS,
    Permission.EDIT_EMISSIONS,
    Permission.DELETE_EMISSIONS,
    // Licenses
    Permission.VIEW_LICENSES,
    Permission.CREATE_LICENSES,
    Permission.EDIT_LICENSES,
    Permission.DELETE_LICENSES,
    Permission.PROCESS_LICENSES,
    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.DELETE_DOCUMENTS,
    Permission.EXTRACT_DOCUMENTS,
    // Goals
    Permission.VIEW_GOALS,
    Permission.CREATE_GOALS,
    Permission.EDIT_GOALS,
    Permission.DELETE_GOALS,
    // Reports
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    // Users (limited)
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    // Settings (limited)
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    // Audit
    Permission.VIEW_AUDITS,
    Permission.CREATE_AUDITS,
    // Quality
    Permission.VIEW_QUALITY,
    Permission.MANAGE_QUALITY,
  ],

  manager: [
    // Emissions
    Permission.VIEW_EMISSIONS,
    Permission.CREATE_EMISSIONS,
    Permission.EDIT_EMISSIONS,
    // Licenses
    Permission.VIEW_LICENSES,
    Permission.CREATE_LICENSES,
    Permission.EDIT_LICENSES,
    Permission.PROCESS_LICENSES,
    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.DELETE_DOCUMENTS,
    Permission.EXTRACT_DOCUMENTS,
    // Goals
    Permission.VIEW_GOALS,
    Permission.CREATE_GOALS,
    Permission.EDIT_GOALS,
    // Reports
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    // Users (limited view)
    Permission.VIEW_USERS,
    // Settings
    Permission.VIEW_SETTINGS,
    // Audit
    Permission.VIEW_AUDITS,
    Permission.CREATE_AUDITS,
    // Quality
    Permission.VIEW_QUALITY,
    Permission.MANAGE_QUALITY,
    Permission.APPROVE_ACTIONS,
  ],

  analyst: [
    // Emissions - full access
    Permission.VIEW_EMISSIONS,
    Permission.CREATE_EMISSIONS,
    Permission.EDIT_EMISSIONS,
    // Licenses
    Permission.VIEW_LICENSES,
    Permission.CREATE_LICENSES,
    Permission.EDIT_LICENSES,
    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.EXTRACT_DOCUMENTS,
    // Goals
    Permission.VIEW_GOALS,
    Permission.CREATE_GOALS,
    Permission.EDIT_GOALS,
    // Reports - full access
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    // Settings
    Permission.VIEW_SETTINGS,
    // Audit
    Permission.VIEW_AUDITS,
    // Quality
    Permission.VIEW_QUALITY,
  ],

  operator: [
    // Basic data entry permissions
    Permission.VIEW_EMISSIONS,
    Permission.CREATE_EMISSIONS,
    Permission.EDIT_EMISSIONS,
    Permission.VIEW_LICENSES,
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.VIEW_GOALS,
    Permission.CREATE_GOALS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_QUALITY,
  ],
  
  auditor: [
    // View-only for most features
    Permission.VIEW_EMISSIONS,
    Permission.VIEW_LICENSES,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_GOALS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_USERS,
    Permission.VIEW_SETTINGS,
    // Full audit permissions
    Permission.VIEW_AUDITS,
    Permission.CREATE_AUDITS,
    Permission.APPROVE_AUDITS,
    Permission.VIEW_QUALITY,
  ],
  
  viewer: [
    // Read-only permissions
    Permission.VIEW_EMISSIONS,
    Permission.VIEW_LICENSES,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_GOALS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_AUDITS,
    Permission.VIEW_QUALITY,
  ],
};

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: Permission | Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  fallbackPath?: string;
}

/**
 * Route guard component that checks specific permissions
 */
export function PermissionGuard({ 
  children, 
  requiredPermission, 
  requireAll = false,
  fallbackPath = ROUTE_PATHS.CORE.DASHBOARD 
}: PermissionGuardProps) {
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
    logger.warn('PermissionGuard: User not authenticated, redirecting to auth');
    return <Navigate to={ROUTE_PATHS.PUBLIC.AUTH} replace />;
  }

  // Check permission authorization
  const userRole = user.role as UserRole | undefined;
  const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(userRole, permissions)
    : hasAnyPermission(userRole, permissions);

  if (!hasAccess) {
    logger.warn('PermissionGuard: Insufficient permissions', {
      userRole,
      requiredPermission,
      userId: user.id,
    });
    
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user?.role as UserRole | undefined, permission);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user?.role as UserRole | undefined, permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAllPermissions(user?.role as UserRole | undefined, permissions);
}