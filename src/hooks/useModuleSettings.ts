import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemo } from '@/contexts/DemoContext';
import { ENABLED_MODULES, type ModuleKey } from '@/config/enabledModules';
import { useAuth } from '@/contexts/AuthContext';

export interface ModuleSetting {
  id: string;
  module_key: string;
  module_name: string;
  enabled_live: boolean;
  enabled_demo: boolean;
  updated_at: string;
  updated_by_user_id: string | null;
}

interface UserModuleAccessRecord {
  module_key: string;
  has_access: boolean;
}

export function useModuleSettings() {
  const { isDemo } = useDemo();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-module-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_module_settings' as any)
        .select('*')
        .order('module_key');
      
      if (error) {
        console.warn('Failed to fetch module settings, using fallback:', error.message);
        return null;
      }
      return data as unknown as ModuleSetting[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch current user's module access restrictions
  const { data: userAccess } = useQuery({
    queryKey: ['user-module-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_module_access' as any)
        .select('module_key, has_access')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Failed to fetch user module access:', error.message);
        return [];
      }
      return data as unknown as UserModuleAccessRecord[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const isModuleVisible = (moduleKey: string): boolean => {
    // 1. Check global platform settings
    if (settings) {
      const setting = settings.find(s => s.module_key === moduleKey);
      if (setting) {
        const globalEnabled = isDemo ? setting.enabled_demo : setting.enabled_live;
        if (!globalEnabled) return false;
      }
    } else {
      // Fallback to static config
      if (moduleKey in ENABLED_MODULES) {
        if (!ENABLED_MODULES[moduleKey as ModuleKey]) return false;
      }
    }

    // 2. Check user-level access (if restricted)
    if (userAccess && userAccess.length > 0) {
      const userPerm = userAccess.find(p => p.module_key === moduleKey);
      if (userPerm && !userPerm.has_access) return false;
    }

    return true;
  };

  // Map section IDs to module keys
  const sectionToModuleKey: Record<string, string> = {
    'financial': 'financial',
    'data-reports': 'dataReports',
    'sgq': 'quality',
    'suppliers': 'suppliers',
    'settings': 'settings',
    'help': 'help',
  };

  // Map ESG category IDs to module keys
  const esgCategoryToModuleKey: Record<string, string> = {
    'environmental-category': 'esgEnvironmental',
    'governance-category': 'esgGovernance',
    'social-category': 'esgSocial',
    'esg-management': 'esgManagement',
  };

  const isSectionVisible = (sectionId: string): boolean => {
    const moduleKey = sectionToModuleKey[sectionId];
    if (!moduleKey) return true;
    return isModuleVisible(moduleKey);
  };

  const isEsgCategoryVisible = (categoryId: string): boolean => {
    const moduleKey = esgCategoryToModuleKey[categoryId];
    if (!moduleKey) return true;
    return isModuleVisible(moduleKey);
  };

  const updateModuleSetting = useMutation({
    mutationFn: async ({ moduleKey, field, value }: { moduleKey: string; field: 'enabled_live' | 'enabled_demo'; value: boolean }) => {
      const { error } = await supabase
        .from('platform_module_settings' as any)
        .update({ [field]: value, updated_at: new Date().toISOString() } as any)
        .eq('module_key', moduleKey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-module-settings'] });
    },
  });

  return {
    settings,
    isLoading,
    isModuleVisible,
    isSectionVisible,
    isEsgCategoryVisible,
    updateModuleSetting,
  };
}
