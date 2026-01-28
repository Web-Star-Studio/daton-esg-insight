import { ReactNode } from 'react';
import { usePermissions, PermissionCode } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface PermissionGateProps {
  permission: PermissionCode | PermissionCode[];
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY
  fallback?: ReactNode;
  showAlert?: boolean;
  children: ReactNode;
}

export const PermissionGate = ({ 
  permission, 
  requireAll = false,
  fallback,
  showAlert = false,
  children 
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // Show loading while checking permissions
  if (isLoading) {
    if (showAlert) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Verificando permissões...</span>
        </div>
      );
    }
    return null;
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  if (!hasAccess) {
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar este recurso.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
