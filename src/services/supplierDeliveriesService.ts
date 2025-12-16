import { supabase } from '@/integrations/supabase/client';

export interface SupplierDelivery {
  id: string;
  company_id: string;
  supplier_id: string;
  supplier_type_id: string | null;
  business_unit_id: string | null;
  delivery_date: string;
  description: string;
  reference_number: string | null;
  quantity: number | null;
  total_value: number | null;
  status: 'Pendente' | 'Avaliado' | 'Problema';
  evaluation_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  supplier?: {
    id: string;
    company_name: string | null;
    full_name: string | null;
    person_type: string;
  };
  supplier_type?: {
    id: string;
    name: string;
  };
}

export interface DeliveryFilters {
  supplier_id?: string;
  supplier_type_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

async function getCurrentUserCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (error || !profile?.company_id) {
    throw new Error('Empresa não encontrada para o usuário');
  }

  return profile.company_id;
}

export async function getDeliveries(filters?: DeliveryFilters): Promise<SupplierDelivery[]> {
  const companyId = await getCurrentUserCompanyId();

  let query = supabase
    .from('supplier_deliveries')
    .select(`
      *,
      supplier:supplier_management(id, company_name, full_name, person_type),
      supplier_type:supplier_types(id, name)
    `)
    .eq('company_id', companyId)
    .order('delivery_date', { ascending: false });

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }
  if (filters?.supplier_type_id) {
    query = query.eq('supplier_type_id', filters.supplier_type_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.start_date) {
    query = query.gte('delivery_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('delivery_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching deliveries:', error);
    throw error;
  }

  return (data || []) as SupplierDelivery[];
}

export async function getDeliveryById(id: string): Promise<SupplierDelivery | null> {
  const { data, error } = await supabase
    .from('supplier_deliveries')
    .select(`
      *,
      supplier:supplier_management(id, company_name, full_name, person_type),
      supplier_type:supplier_types(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching delivery:', error);
    throw error;
  }

  return data as SupplierDelivery;
}

export async function createDelivery(delivery: {
  supplier_id: string;
  supplier_type_id?: string;
  business_unit_id?: string;
  delivery_date: string;
  description: string;
  reference_number?: string;
  quantity?: number;
  total_value?: number;
}): Promise<SupplierDelivery> {
  const companyId = await getCurrentUserCompanyId();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('supplier_deliveries')
    .insert({
      ...delivery,
      company_id: companyId,
      created_by: user?.id,
      status: 'Pendente'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating delivery:', error);
    throw error;
  }

  return data as SupplierDelivery;
}

export async function updateDelivery(id: string, updates: Partial<SupplierDelivery>): Promise<SupplierDelivery> {
  const { data, error } = await supabase
    .from('supplier_deliveries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating delivery:', error);
    throw error;
  }

  return data as SupplierDelivery;
}

export async function deleteDelivery(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_deliveries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting delivery:', error);
    throw error;
  }
}

export async function getDeliveriesPendingEvaluation(supplierId?: string): Promise<SupplierDelivery[]> {
  const companyId = await getCurrentUserCompanyId();

  let query = supabase
    .from('supplier_deliveries')
    .select(`
      *,
      supplier:supplier_management(id, company_name, full_name, person_type),
      supplier_type:supplier_types(id, name)
    `)
    .eq('company_id', companyId)
    .eq('status', 'Pendente')
    .is('evaluation_id', null)
    .order('delivery_date', { ascending: false });

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pending deliveries:', error);
    throw error;
  }

  return (data || []) as SupplierDelivery[];
}

export async function linkEvaluation(deliveryId: string, evaluationId: string, status: 'Avaliado' | 'Problema' = 'Avaliado'): Promise<void> {
  const { error } = await supabase
    .from('supplier_deliveries')
    .update({ 
      evaluation_id: evaluationId, 
      status 
    })
    .eq('id', deliveryId);

  if (error) {
    console.error('Error linking evaluation:', error);
    throw error;
  }
}

export async function getDeliveryStats(): Promise<{
  total: number;
  pending: number;
  evaluated: number;
  problems: number;
}> {
  const companyId = await getCurrentUserCompanyId();

  const { data, error } = await supabase
    .from('supplier_deliveries')
    .select('status')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching delivery stats:', error);
    throw error;
  }

  const deliveries = data || [];
  return {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'Pendente').length,
    evaluated: deliveries.filter(d => d.status === 'Avaliado').length,
    problems: deliveries.filter(d => d.status === 'Problema').length,
  };
}
