import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DashboardPreferences {
  widgets: string[];
  layout: 'default' | 'compact' | 'expanded';
  pinnedModules?: string[];
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  notifications?: {
    inApp: boolean;
    email: boolean;
    emailWeeklySummary: boolean;
    systemUpdates: boolean;
  };
}

export const useDashboardPreferences = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['dashboard-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('dashboard_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Safely parse dashboard preferences with fallback
      const rawPrefs = data?.dashboard_preferences;
      if (!rawPrefs || typeof rawPrefs !== 'object') {
        return {
          widgets: ['onboarding', 'tasks', 'goals', 'intelligence'],
          layout: 'default' as const,
        };
      }

      return {
        widgets: (rawPrefs as any).widgets || ['onboarding', 'tasks', 'goals', 'intelligence'],
        layout: (rawPrefs as any).layout || 'default',
        pinnedModules: (rawPrefs as any).pinnedModules,
        theme: (rawPrefs as any).theme,
        timezone: (rawPrefs as any).timezone,
        notifications: (rawPrefs as any).notifications,
      } as DashboardPreferences;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<DashboardPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const mergedPreferences = {
        ...preferences,
        ...newPreferences,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: mergedPreferences })
        .eq('id', user.id);

      if (error) throw error;
      return mergedPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] });
      toast.success('Preferências atualizadas');
    },
    onError: () => {
      toast.error('Erro ao atualizar preferências');
    },
  });

  const toggleWidget = (widgetId: string) => {
    if (!preferences) return;
    
    const currentWidgets = preferences.widgets || [];
    const newWidgets = currentWidgets.includes(widgetId)
      ? currentWidgets.filter(w => w !== widgetId)
      : [...currentWidgets, widgetId];

    updatePreferencesMutation.mutate({ widgets: newWidgets });
  };

  return {
    preferences: preferences || {
      widgets: ['onboarding', 'tasks', 'goals', 'intelligence'],
      layout: 'default' as const,
      theme: 'system' as const,
      timezone: 'America/Sao_Paulo',
      notifications: {
        inApp: true,
        email: true,
        emailWeeklySummary: false,
        systemUpdates: true,
      },
    },
    isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    toggleWidget,
  };
};
