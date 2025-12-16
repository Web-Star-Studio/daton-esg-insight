import { supabase } from "@/integrations/supabase/client";

export interface SupplierFailure {
  id: string;
  company_id: string;
  supplier_id: string;
  failure_type: 'delivery' | 'quality' | 'document' | 'compliance' | 'other';
  failure_date: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  related_evaluation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    company_name: string | null;
    full_name: string | null;
    status: string;
    supply_failure_count: number | null;
  };
}

export interface CreateFailureData {
  supplier_id: string;
  failure_type: SupplierFailure['failure_type'];
  failure_date: string;
  description?: string;
  severity?: SupplierFailure['severity'];
  related_evaluation_id?: string;
}

// Obter company_id do usuário atual
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

// Listar todas as falhas da empresa
export async function getSupplierFailures(): Promise<SupplierFailure[]> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data, error } = await (supabase
    .from('supplier_supply_failures') as any)
    .select(`
      *,
      supplier:supplier_management(id, company_name, full_name, status, supply_failure_count)
    `)
    .eq('company_id', companyId)
    .order('failure_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obter falhas de um fornecedor específico
export async function getSupplierFailuresById(supplierId: string): Promise<SupplierFailure[]> {
  const { data, error } = await (supabase
    .from('supplier_supply_failures') as any)
    .select('*')
    .eq('supplier_id', supplierId)
    .order('failure_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Registrar nova falha
export async function registerSupplyFailure(failureData: CreateFailureData): Promise<SupplierFailure> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await (supabase
    .from('supplier_supply_failures') as any)
    .insert({
      company_id: companyId,
      supplier_id: failureData.supplier_id,
      failure_type: failureData.failure_type,
      failure_date: failureData.failure_date,
      description: failureData.description || null,
      severity: failureData.severity || 'medium',
      related_evaluation_id: failureData.related_evaluation_id || null,
      created_by: user?.id || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Excluir falha
export async function deleteSupplyFailure(id: string): Promise<void> {
  const { error } = await (supabase
    .from('supplier_supply_failures') as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Obter fornecedores com risco de inativação (2-3 falhas)
export async function getSuppliersAtRisk(): Promise<any[]> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('supplier_management')
    .select('id, company_name, full_name, status, supply_failure_count, last_failure_date')
    .eq('company_id', companyId)
    .eq('status', 'Ativo')
    .gte('supply_failure_count', 2)
    .order('supply_failure_count', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obter fornecedores inativados automaticamente
export async function getAutoInactivatedSuppliers(): Promise<any[]> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('supplier_management')
    .select('id, company_name, full_name, status, auto_inactivation_reason, auto_inactivated_at, reactivation_blocked_until')
    .eq('company_id', companyId)
    .not('auto_inactivated_at', 'is', null)
    .order('auto_inactivated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Solicitar reativação de fornecedor
export async function requestReactivation(supplierId: string, justification: string): Promise<void> {
  const { data: supplier, error: fetchError } = await supabase
    .from('supplier_management')
    .select('reactivation_blocked_until')
    .eq('id', supplierId)
    .single();

  if (fetchError) throw fetchError;

  // Verificar se o bloqueio expirou
  if (supplier?.reactivation_blocked_until) {
    const blockedUntil = new Date(supplier.reactivation_blocked_until);
    if (blockedUntil > new Date()) {
      throw new Error(`Reativação bloqueada até ${blockedUntil.toLocaleDateString('pt-BR')}`);
    }
  }

  // Reativar fornecedor
  const { error } = await supabase
    .from('supplier_management')
    .update({
      status: 'Ativo',
      auto_inactivation_reason: null,
      auto_inactivated_at: null,
      reactivation_blocked_until: null,
      supply_failure_count: 0
    })
    .eq('id', supplierId);

  if (error) throw error;
}

// Estatísticas de falhas
export async function getFailureStats(): Promise<{
  total_failures: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  suppliers_at_risk: number;
  auto_inactivated: number;
}> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Usuário não autenticado');

  // Total de falhas nos últimos 12 meses
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: failures, error: failuresError } = await (supabase
    .from('supplier_supply_failures') as any)
    .select('failure_type, severity')
    .eq('company_id', companyId)
    .gte('failure_date', oneYearAgo.toISOString().split('T')[0]);

  if (failuresError) throw failuresError;

  // Fornecedores em risco
  const { count: atRiskCount } = await supabase
    .from('supplier_management')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'Ativo')
    .gte('supply_failure_count', 2);

  // Fornecedores inativados automaticamente
  const { count: inactivatedCount } = await supabase
    .from('supplier_management')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .not('auto_inactivated_at', 'is', null);

  // Agrupar por tipo e severidade
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const f of failures || []) {
    byType[f.failure_type] = (byType[f.failure_type] || 0) + 1;
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }

  return {
    total_failures: failures?.length || 0,
    by_type: byType,
    by_severity: bySeverity,
    suppliers_at_risk: atRiskCount || 0,
    auto_inactivated: inactivatedCount || 0
  };
}

// Mapeamento de tipos de falha para português
export const failureTypeLabels: Record<string, string> = {
  delivery: 'Entrega',
  quality: 'Qualidade',
  document: 'Documentação',
  compliance: 'Conformidade',
  other: 'Outro'
};

// Mapeamento de severidade para português
export const severityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};
