import { supabase } from "@/integrations/supabase/client";

export interface SupplierContract {
  id: string;
  company_id: string;
  supplier_id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: string;
  value?: number;
  currency: string;
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  renewal_notice_days: number;
  status: string;
  terms_conditions?: string;
  sla_requirements?: any;
  payment_terms?: string;
  responsible_user_id?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierContractData {
  supplier_id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: string;
  value?: number;
  currency?: string;
  start_date: string;
  end_date: string;
  auto_renewal?: boolean;
  renewal_notice_days?: number;
  terms_conditions?: string;
  sla_requirements?: any;
  payment_terms?: string;
  responsible_user_id?: string;
  file_path?: string;
}

export const getSupplierContracts = async (supplierId?: string): Promise<SupplierContract[]> => {
  try {
    let query = supabase
      .from('supplier_contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching supplier contracts:', error);
    throw error;
  }
};

export const getSupplierContractById = async (id: string): Promise<SupplierContract | null> => {
  try {
    const { data, error } = await supabase
      .from('supplier_contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching supplier contract:', error);
    throw error;
  }
};

export const createSupplierContract = async (contractData: CreateSupplierContractData): Promise<SupplierContract> => {
  try {
    // Get user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    const { data, error } = await supabase
      .from('supplier_contracts')
      .insert({
        ...contractData,
        company_id: profile?.company_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating supplier contract:', error);
    throw error;
  }
};

export const updateSupplierContract = async (id: string, updates: Partial<CreateSupplierContractData>): Promise<SupplierContract> => {
  try {
    const { data, error } = await supabase
      .from('supplier_contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating supplier contract:', error);
    throw error;
  }
};

export const deleteSupplierContract = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('supplier_contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting supplier contract:', error);
    throw error;
  }
};

export const getExpiringContracts = async (daysAhead: number = 30): Promise<SupplierContract[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('supplier_contracts')
      .select('*')
      .eq('status', 'Ativo')
      .lte('end_date', futureDate.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expiring contracts:', error);
    throw error;
  }
};

export const getContractsStats = async () => {
  try {
    const { data: contracts, error } = await supabase
      .from('supplier_contracts')
      .select('*');

    if (error) throw error;

    const stats = {
      total: contracts?.length || 0,
      active: contracts?.filter(c => c.status === 'Ativo').length || 0,
      expired: contracts?.filter(c => c.status === 'Vencido').length || 0,
      expiring: 0,
      totalValue: contracts?.reduce((sum, c) => sum + (c.value || 0), 0) || 0
    };

    // Calculate expiring contracts (next 30 days)
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    stats.expiring = contracts?.filter(c => {
      const endDate = new Date(c.end_date);
      return c.status === 'Ativo' && endDate <= future && endDate >= now;
    }).length || 0;

    return stats;
  } catch (error) {
    console.error('Error calculating contracts stats:', error);
    throw error;
  }
};

export const downloadContractFile = async (filePath: string): Promise<{ url: string; fileName: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from('contract-files')
      .download(filePath);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    const fileName = filePath.split('/').pop() || 'contrato.pdf';

    return { url, fileName };
  } catch (error) {
    console.error('Error downloading contract file:', error);
    throw error;
  }
};
