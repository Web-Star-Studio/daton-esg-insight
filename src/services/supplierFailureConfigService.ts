import { supabase } from "@/integrations/supabase/client";

export interface SupplierFailureConfig {
  id: string;
  company_id: string;
  max_failures_allowed: number;
  failure_period_months: number;
  severity_weight_low: number;
  severity_weight_medium: number;
  severity_weight_high: number;
  severity_weight_critical: number;
  reactivation_block_days: number;
  notify_on_failure: boolean;
  notify_on_at_risk: boolean;
  notify_on_inactivation: boolean;
  notify_emails: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateFailureConfigData {
  max_failures_allowed?: number;
  failure_period_months?: number;
  severity_weight_low?: number;
  severity_weight_medium?: number;
  severity_weight_high?: number;
  severity_weight_critical?: number;
  reactivation_block_days?: number;
  notify_on_failure?: boolean;
  notify_on_at_risk?: boolean;
  notify_on_inactivation?: boolean;
  notify_emails?: string[];
}

async function getCurrentCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  return data?.company_id || null;
}

export async function getFailureConfig(): Promise<SupplierFailureConfig | null> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data, error } = await (supabase
    .from('supplier_failure_config') as any)
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  // If no config exists, create default
  if (!data) {
    return createDefaultConfig(companyId);
  }

  return data;
}

async function createDefaultConfig(companyId: string): Promise<SupplierFailureConfig> {
  const { data, error } = await (supabase
    .from('supplier_failure_config') as any)
    .insert({
      company_id: companyId,
      max_failures_allowed: 3,
      failure_period_months: 12,
      severity_weight_low: 0.5,
      severity_weight_medium: 1.0,
      severity_weight_high: 1.5,
      severity_weight_critical: 2.0,
      reactivation_block_days: 90,
      notify_on_failure: true,
      notify_on_at_risk: true,
      notify_on_inactivation: true,
      notify_emails: []
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFailureConfig(updates: UpdateFailureConfigData): Promise<SupplierFailureConfig> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data, error } = await (supabase
    .from('supplier_failure_config') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Preview how current suppliers would be affected by new config
export async function previewConfigImpact(config: UpdateFailureConfigData): Promise<{
  wouldBeInactivated: Array<{ id: string; name: string; weightedScore: number }>;
  wouldBeAtRisk: Array<{ id: string; name: string; weightedScore: number }>;
}> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const periodMonths = config.failure_period_months || 12;
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - periodMonths);

  // Get all active suppliers with their failures
  const { data: suppliers } = await supabase
    .from('supplier_management')
    .select('id, company_name, full_name')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  if (!suppliers) return { wouldBeInactivated: [], wouldBeAtRisk: [] };

  const weights = {
    low: config.severity_weight_low || 0.5,
    medium: config.severity_weight_medium || 1.0,
    high: config.severity_weight_high || 1.5,
    critical: config.severity_weight_critical || 2.0
  };

  const maxAllowed = config.max_failures_allowed || 3;

  const results = await Promise.all(
    suppliers.map(async (supplier) => {
      const { data: failures } = await (supabase
        .from('supplier_supply_failures') as any)
        .select('severity')
        .eq('supplier_id', supplier.id)
        .gte('failure_date', periodStart.toISOString().split('T')[0]);

      const weightedScore = (failures || []).reduce((sum: number, f: any) => {
        return sum + (weights[f.severity as keyof typeof weights] || 1);
      }, 0);

      return {
        id: supplier.id,
        name: supplier.company_name || supplier.full_name || 'Sem nome',
        weightedScore
      };
    })
  );

  return {
    wouldBeInactivated: results.filter(r => r.weightedScore > maxAllowed),
    wouldBeAtRisk: results.filter(r => r.weightedScore >= maxAllowed * 0.66 && r.weightedScore <= maxAllowed)
  };
}
