import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { auditService } from '@/services/audit';
import type { Json } from '@/integrations/supabase/types';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: Json;
  description: string | null;
  updated_at: string;
  updated_by_user_id: string | null;
}

export interface SettingHistoryEntry {
  id: string;
  setting_key: string;
  old_value: Json;
  new_value: Json;
  changed_by_user_id: string | null;
  changed_at: string;
  user_name?: string;
}

export interface SettingUpdatePayload {
  setting_key: string;
  setting_value: Json;
}

// Setting constraints for validation
export const SETTING_CONSTRAINTS: Record<string, { min: number; max: number; label: string }> = {
  session_timeout_minutes: { min: 5, max: 1440, label: 'Timeout de Sessão (minutos)' },
  max_upload_size_mb: { min: 1, max: 100, label: 'Tamanho Máx. Upload (MB)' },
  max_login_attempts: { min: 3, max: 10, label: 'Tentativas de Login' },
  login_lock_duration_minutes: { min: 5, max: 60, label: 'Duração do Lock (minutos)' },
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        throw new Error(`Erro ao buscar configurações: ${error.message}`);
      }

      return data || [];
    },
  });
};

export const useSettingsHistory = () => {
  return useQuery({
    queryKey: ['system-settings-history'],
    queryFn: async (): Promise<SettingHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('system_settings_history')
        .select(`
          id,
          setting_key,
          old_value,
          new_value,
          changed_by_user_id,
          changed_at
        `)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      // Fetch user names for history entries
      const userIds = [...new Set((data || []).map(h => h.changed_by_user_id).filter(Boolean))];
      
      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        userMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || 'Desconhecido';
          return acc;
        }, {} as Record<string, string>);
      }

      return (data || []).map(entry => ({
        ...entry,
        user_name: entry.changed_by_user_id ? userMap[entry.changed_by_user_id] || 'Desconhecido' : 'Sistema',
      }));
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SettingUpdatePayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validate the value
      const constraint = SETTING_CONSTRAINTS[payload.setting_key];
      if (constraint) {
        const numValue = Number(payload.setting_value);
        if (isNaN(numValue) || numValue < constraint.min || numValue > constraint.max) {
          throw new Error(`${constraint.label} deve estar entre ${constraint.min} e ${constraint.max}`);
        }
      }

      const { data, error } = await supabase
        .from('system_settings')
        .update({
          setting_value: payload.setting_value,
          updated_by_user_id: user.id,
        })
        .eq('setting_key', payload.setting_key)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar configuração: ${error.message}`);
      }

      // Log the activity
      await auditService.logActivity('settings_updated', `Configuração alterada: ${payload.setting_key}`, {
        setting_key: payload.setting_key,
        new_value: payload.setting_value,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-history'] });
      toast.success('Configuração atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateMultipleSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SettingUpdatePayload[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validate all values first
      for (const setting of settings) {
        const constraint = SETTING_CONSTRAINTS[setting.setting_key];
        if (constraint) {
          const numValue = Number(setting.setting_value);
          if (isNaN(numValue) || numValue < constraint.min || numValue > constraint.max) {
            throw new Error(`${constraint.label} deve estar entre ${constraint.min} e ${constraint.max}`);
          }
        }
      }

      // Update each setting
      const results = await Promise.all(
        settings.map(async (setting) => {
          const { data, error } = await supabase
            .from('system_settings')
            .update({
              setting_value: setting.setting_value,
              updated_by_user_id: user.id,
            })
            .eq('setting_key', setting.setting_key)
            .select()
            .single();

          if (error) {
            throw new Error(`Erro ao atualizar ${setting.setting_key}: ${error.message}`);
          }

          return data;
        })
      );

      // Log the activity
      await auditService.logActivity('settings_updated', `Múltiplas configurações alteradas`, {
        settings: settings.map(s => s.setting_key),
      });

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-history'] });
      toast.success('Configurações atualizadas com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
