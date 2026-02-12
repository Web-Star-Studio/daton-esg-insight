import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemo } from '@/contexts/DemoContext';
import { ENABLED_MODULES, type ModuleKey } from '@/config/enabledModules';

export interface ModuleSetting {
  id: string;
  module_key: string;
  module_name: string;
  enabled_live: boolean;
  enabled_demo: boolean;
  updated_at: string;
  updated_by_user_id: string | null;
}

export function useModuleSettings() {
  const { isDemo } = useDemo();
  const queryClient = useQueryClient();

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isModuleVisible = (moduleKey: string): boolean => {
    // If DB settings loaded, use them
    if (settings) {
      const setting = settings.find(s => s.module_key === moduleKey);
      if (setting) {
        return isDemo ? setting.enabled_demo : setting.enabled_live;
      }
    }
    // Fallback to static config
    if (moduleKey in ENABLED_MODULES) {
      return ENABLED_MODULES[moduleKey as ModuleKey];
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
    if (!moduleKey) return true; // No mapping = always visible
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
