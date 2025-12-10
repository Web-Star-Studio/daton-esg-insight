import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnitComplianceStats {
  total: number;
  byStatus: {
    conforme: number;
    para_conhecimento: number;
    adequacao: number;
    plano_acao: number;
    pending: number;
  };
  byApplicability: {
    real: number;
    potential: number;
    na: number;
    revoked: number;
  };
  pendencias: Array<{
    id: string;
    legislation_id: string;
    legislation_title: string;
    norm_number: string;
    pending_requirements: string;
    responsible_user_name?: string;
  }>;
  planosAcao: Array<{
    id: string;
    legislation_id: string;
    legislation_title: string;
    norm_number: string;
    action_plan: string;
    deadline?: string;
    responsible_user_name?: string;
  }>;
  complianceRate: number;
}

export const fetchUnitComplianceStats = async (
  branchId: string
): Promise<UnitComplianceStats> => {
  const { data, error } = await supabase
    .from('legislation_unit_compliance')
    .select(`
      *,
      legislation:legislation_id (
        id, 
        title, 
        norm_number, 
        norm_type, 
        jurisdiction
      ),
      responsible_user:profiles!unit_responsible_user_id (
        full_name
      )
    `)
    .eq('branch_id', branchId);

  if (error) {
    console.error('Error fetching unit compliance:', error);
    throw error;
  }

  const records = data || [];
  
  // Calculate stats
  const byStatus = {
    conforme: records.filter(d => d.compliance_status === 'conforme').length,
    para_conhecimento: records.filter(d => d.compliance_status === 'para_conhecimento').length,
    adequacao: records.filter(d => d.compliance_status === 'adequacao').length,
    plano_acao: records.filter(d => d.compliance_status === 'plano_acao').length,
    pending: records.filter(d => d.compliance_status === 'pending' || !d.compliance_status).length,
  };

  const byApplicability = {
    real: records.filter(d => d.applicability === 'real').length,
    potential: records.filter(d => d.applicability === 'potential').length,
    na: records.filter(d => d.applicability === 'na').length,
    revoked: records.filter(d => d.applicability === 'revoked').length,
  };

  const pendencias = records
    .filter(d => d.has_pending_requirements)
    .map(d => ({
      id: d.id,
      legislation_id: d.legislation_id,
      legislation_title: (d.legislation as any)?.title || 'Legislação',
      norm_number: (d.legislation as any)?.norm_number || '-',
      pending_requirements: (d as any).observation || 'Pendência registrada',
      responsible_user_name: (d.responsible_user as any)?.full_name,
    }));

  const planosAcao = records
    .filter(d => d.action_plan)
    .map(d => ({
      id: d.id,
      legislation_id: d.legislation_id,
      legislation_title: (d.legislation as any)?.title || 'Legislação',
      norm_number: (d.legislation as any)?.norm_number || '-',
      action_plan: d.action_plan || '',
      deadline: d.action_plan_deadline,
      responsible_user_name: (d.responsible_user as any)?.full_name,
    }));

  const realCount = byApplicability.real;
  const complianceRate = realCount > 0 
    ? Math.round((byStatus.conforme / realCount) * 100) 
    : 0;

  return {
    total: records.length,
    byStatus,
    byApplicability,
    pendencias,
    planosAcao,
    complianceRate,
  };
};

export const useUnitComplianceStats = (branchId: string | undefined) => {
  return useQuery({
    queryKey: ['unit-compliance-stats', branchId],
    queryFn: () => fetchUnitComplianceStats(branchId!),
    enabled: !!branchId,
  });
};
