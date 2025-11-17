import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface IndicatorTarget {
  id: string;
  indicator_id: string;
  target_value: number;
  upper_limit?: number;
  lower_limit?: number;
  critical_upper_limit?: number;
  critical_lower_limit?: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateTargetData {
  indicator_id: string;
  target_value: number;
  upper_limit?: number;
  lower_limit?: number;
  critical_upper_limit?: number;
  critical_lower_limit?: number;
  valid_from: string;
  valid_until?: string;
}

class IndicatorTargetsService {
  async getTargets(indicatorId: string) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .select('*')
      .eq('indicator_id', indicatorId)
      .order('valid_from', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getActiveTarget(indicatorId: string) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .select('*')
      .eq('indicator_id', indicatorId)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
      .order('valid_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createTarget(target: CreateTargetData) {
    // Desativar metas anteriores se necessário
    await supabase
      .from('indicator_targets')
      .update({ is_active: false })
      .eq('indicator_id', target.indicator_id)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('indicator_targets')
      .insert({
        ...target,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTarget(id: string, updates: Partial<IndicatorTarget>) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTarget(id: string) {
    const { error } = await supabase
      .from('indicator_targets')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async getTargetHistory(indicatorId: string) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .select('*')
      .eq('indicator_id', indicatorId)
      .order('valid_from', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const indicatorTargetsService = new IndicatorTargetsService();

// React Query Hooks
export const useIndicatorTargets = (indicatorId: string) => {
  return useQuery({
    queryKey: ['indicator-targets', indicatorId],
    queryFn: () => indicatorTargetsService.getTargets(indicatorId),
    enabled: !!indicatorId
  });
};

export const useActiveTarget = (indicatorId: string) => {
  return useQuery({
    queryKey: ['active-target', indicatorId],
    queryFn: () => indicatorTargetsService.getActiveTarget(indicatorId),
    enabled: !!indicatorId
  });
};

export const useCreateTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: indicatorTargetsService.createTarget,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['indicator-targets', variables.indicator_id] });
      queryClient.invalidateQueries({ queryKey: ['active-target', variables.indicator_id] });
      queryClient.invalidateQueries({ queryKey: ['quality-indicators-list'] });
      queryClient.invalidateQueries({ queryKey: ['quality-performance'] });
      toast({
        title: "Meta criada",
        description: "Meta do indicador definida com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar meta",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IndicatorTarget> }) =>
      indicatorTargetsService.updateTarget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-targets'] });
      queryClient.invalidateQueries({ queryKey: ['active-target'] });
      toast({
        title: "Meta atualizada",
        description: "Meta do indicador atualizada com sucesso"
      });
    }
  });
};