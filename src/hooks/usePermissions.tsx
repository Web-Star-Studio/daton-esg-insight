import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PermissionCode = 
  | 'emissions.view' | 'emissions.create' | 'emissions.edit' | 'emissions.delete' | 'emissions.approve'
  | 'goals.view' | 'goals.create' | 'goals.edit' | 'goals.delete'
  | 'reports.view' | 'reports.create' | 'reports.edit' | 'reports.publish' | 'reports.export'
  | 'risks.view' | 'risks.create' | 'risks.edit' | 'risks.delete'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete' | 'users.manage_permissions'
  | 'company.view' | 'company.edit' | 'company.billing'
  | 'analytics.view' | 'analytics.advanced'
  | 'audit.view' | 'audit.export';

export type UserRole = 
  | 'platform_admin'
  | 'super_admin' 
  | 'admin' 
  | 'manager' 
  | 'analyst' 
  | 'operator' 
  | 'viewer' 
  | 'auditor';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

export const usePermissions = () => {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      return data?.role as UserRole | null;
    },
    enabled: !!user?.id
  });

  const { data: rolePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['role-permissions', userRole],
    queryFn: async () => {
      if (!userRole) return [];
      
      const { data } = await supabase
        .from('role_permissions')
        .select('permission_id, permissions(code, name, description, category)')
        .eq('role', userRole);
      
      // Type-safe mapping - extract permissions objects
      if (!data) return [];
      return data
        .map(rp => rp.permissions)
        .filter((p): p is { code: string; name: string; description: string; category: string } => p !== null)
        .map(p => ({ ...p, id: '' } as Permission));
    },
    enabled: !!userRole
  });

  interface CustomPermissionRow {
    granted: boolean;
    permissions: { code: string; name: string; description: string; category: string } | null;
  }

  const { data: customPermissions, isLoading: customLoading } = useQuery({
    queryKey: ['custom-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('user_custom_permissions')
        .select('granted, permissions(code, name, description, category)')
        .eq('user_id', user.id);
      
      // Type-safe return
      return (data as CustomPermissionRow[] | null) || [];
    },
    enabled: !!user?.id
  });

  // Combined loading state
  const isLoading = userLoading || roleLoading || permissionsLoading || customLoading;

  const hasPermission = (permissionCode: PermissionCode): boolean => {
    // Platform admin and Super admin have all permissions
    if (userRole === 'platform_admin' || userRole === 'super_admin') return true;

    // Check custom permissions first (overrides) - type-safe access
    const customPerm = customPermissions?.find(cp => {
      const typedCp = cp as CustomPermissionRow;
      return typedCp.permissions?.code === permissionCode;
    });
    if (customPerm) {
      return customPerm.granted;
    }

    // Check role-based permissions
    return rolePermissions?.some(p => p.code === permissionCode) || false;
  };

  const hasAnyPermission = (permissionCodes: PermissionCode[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  };

  const hasAllPermissions = (permissionCodes: PermissionCode[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  };

  return {
    userRole,
    rolePermissions: rolePermissions || [],
    customPermissions: customPermissions || [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: userRole === 'platform_admin' || userRole === 'super_admin' || userRole === 'admin',
    isSuperAdmin: userRole === 'super_admin',
    isPlatformAdmin: userRole === 'platform_admin',
    isLoading
  };
};
