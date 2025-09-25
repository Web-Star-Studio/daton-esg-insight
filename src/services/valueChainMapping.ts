import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ValueChainProcess {
  id: string;
  company_id: string;
  process_name: string;
  process_type: string;
  input_description?: string;
  output_description?: string;
  internal_client?: string;
  internal_supplier?: string;
  external_suppliers: any[];
  external_clients: any[];
  requirements: any[];
  kpis: any[];
  responsible_user_id?: string;
  process_owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InternalRelationship {
  id: string;
  company_id: string;
  client_department: string;
  supplier_department: string;
  service_description: string;
  sla_requirements: any;
  communication_protocol?: string;
  escalation_matrix: any[];
  performance_indicators: any[];
  relationship_manager_user_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternalClientEvaluation {
  id: string;
  company_id: string;
  relationship_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  overall_satisfaction_score?: number;
  service_quality_score?: number;
  response_time_score?: number;
  communication_score?: number;
  problem_resolution_score?: number;
  feedback_text?: string;
  improvement_suggestions?: string;
  evaluated_by_user_id: string;
  nps_score?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateValueChainProcessData {
  process_name: string;
  process_type?: string;
  input_description?: string;
  output_description?: string;
  internal_client?: string;
  internal_supplier?: string;
  external_suppliers?: any[];
  external_clients?: any[];
  requirements?: any[];
  kpis?: any[];
  responsible_user_id?: string;
  process_owner_user_id?: string;
}

export interface CreateInternalRelationshipData {
  client_department: string;
  supplier_department: string;
  service_description: string;
  sla_requirements?: any;
  communication_protocol?: string;
  escalation_matrix?: any[];
  performance_indicators?: any[];
  relationship_manager_user_id?: string;
}

export interface CreateInternalEvaluationData {
  relationship_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  overall_satisfaction_score?: number;
  service_quality_score?: number;
  response_time_score?: number;
  communication_score?: number;
  problem_resolution_score?: number;
  feedback_text?: string;
  improvement_suggestions?: string;
  nps_score?: number;
}

// Value Chain Processes
export const useValueChainProcesses = () => {
  return useQuery({
    queryKey: ['value-chain-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('value_chain_mapping')
        .select('*')
        .order('process_name');

      if (error) throw error;
      return data as ValueChainProcess[];
    }
  });
};

export const useCreateValueChainProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateValueChainProcessData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: process, error } = await supabase
        .from('value_chain_mapping')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;
      return process;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-chain-processes'] });
    }
  });
};

// Internal Relationships
export const useInternalRelationships = () => {
  return useQuery({
    queryKey: ['internal-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_client_supplier_relationships')
        .select('*')
        .eq('is_active', true)
        .order('client_department');

      if (error) throw error;
      return data as InternalRelationship[];
    }
  });
};

export const useCreateInternalRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInternalRelationshipData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: relationship, error } = await supabase
        .from('internal_client_supplier_relationships')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;
      return relationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-relationships'] });
    }
  });
};

// Internal Client Evaluations
export const useInternalEvaluations = () => {
  return useQuery({
    queryKey: ['internal-evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_client_evaluations')
        .select(`
          *,
          internal_client_supplier_relationships(client_department, supplier_department, service_description)
        `)
        .order('evaluation_period_end', { ascending: false });

      if (error) throw error;
      return data as (InternalClientEvaluation & { internal_client_supplier_relationships: any })[];
    }
  });
};

export const useCreateInternalEvaluation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInternalEvaluationData) => {
      // Get user's company_id and user_id
      const user = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.data.user?.id)
        .single();

      if (!profile?.company_id || !user.data.user?.id) {
        throw new Error('Company ID or User ID not found');
      }

      const { data: evaluation, error } = await supabase
        .from('internal_client_evaluations')
        .insert({
          ...data,
          company_id: profile.company_id,
          evaluated_by_user_id: user.data.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-evaluations'] });
    }
  });
};

export const useValueChainStats = () => {
  return useQuery({
    queryKey: ['value-chain-stats'],
    queryFn: async () => {
      const { data: processes } = await supabase
        .from('value_chain_mapping')
        .select('process_type');

      const { data: relationships } = await supabase
        .from('internal_client_supplier_relationships')
        .select('is_active')
        .eq('is_active', true);

      const { data: evaluations } = await supabase
        .from('internal_client_evaluations')
        .select('overall_satisfaction_score, nps_score')
        .gte('evaluation_period_end', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const totalProcesses = processes?.length || 0;
      const principalProcesses = processes?.filter(p => p.process_type === 'principal').length || 0;
      const supportProcesses = processes?.filter(p => p.process_type === 'suporte').length || 0;
      const activeRelationships = relationships?.length || 0;

      const avgSatisfaction = evaluations?.length > 0 
        ? evaluations.reduce((sum, e) => sum + (e.overall_satisfaction_score || 0), 0) / evaluations.length 
        : 0;

      const avgNPS = evaluations?.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.nps_score || 0), 0) / evaluations.length
        : 0;

      return {
        totalProcesses,
        principalProcesses,
        supportProcesses,
        activeRelationships,
        avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
        avgNPS: Number(avgNPS.toFixed(1)),
        recentEvaluations: evaluations?.length || 0
      };
    }
  });
};