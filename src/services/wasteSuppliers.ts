import { supabase } from "@/integrations/supabase/client";

export interface WasteSupplier {
  id: string;
  company_id: string;
  company_name: string;
  cnpj?: string;
  supplier_type: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  license_number?: string;
  license_type?: string;
  license_expiry?: string;
  license_issuing_body?: string;
  status: string;
  rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWasteSupplierData {
  company_name: string;
  cnpj?: string;
  supplier_type: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  license_number?: string;
  license_type?: string;
  license_expiry?: string;
  license_issuing_body?: string;
  notes?: string;
}

export interface UpdateWasteSupplierData extends Partial<CreateWasteSupplierData> {
  status?: string;
  rating?: number;
}

export interface WasteSupplierFilters {
  supplier_type?: string;
  status?: string;
  search?: string;
}

export interface WasteSuppliersStats {
  total_suppliers: number;
  active_suppliers: number;
  expired_licenses: number;
  expiring_soon: number;
  by_type: {
    transporter: number;
    destination: number;
    both: number;
  };
}

// Helper function to get current company ID
const getCurrentUserCompanyId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
};

// Get all waste suppliers with filters
export const getWasteSuppliers = async (filters?: WasteSupplierFilters): Promise<WasteSupplier[]> => {
  let query = supabase
    .from('waste_suppliers')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.supplier_type) {
    query = query.eq('supplier_type', filters.supplier_type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`company_name.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
  return data || [];
};

// Get waste supplier by ID
export const getWasteSupplierById = async (id: string): Promise<WasteSupplier> => {
  const { data, error } = await supabase
    .from('waste_suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
  return data;
};

// Create waste supplier
export const createWasteSupplier = async (supplierData: CreateWasteSupplierData): Promise<WasteSupplier> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('waste_suppliers')
    .insert({ ...supplierData, company_id: companyId })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar fornecedor: ${error.message}`);
  return data;
};

// Update waste supplier
export const updateWasteSupplier = async (id: string, updates: UpdateWasteSupplierData): Promise<WasteSupplier> => {
  const { data, error } = await supabase
    .from('waste_suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
  return data;
};

// Delete waste supplier
export const deleteWasteSupplier = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('waste_suppliers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar fornecedor: ${error.message}`);
};

// Get suppliers with expiring licenses
export const getSuppliersWithExpiringLicenses = async (days: number = 30): Promise<WasteSupplier[]> => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const { data, error } = await supabase
    .from('waste_suppliers')
    .select('*')
    .not('license_expiry', 'is', null)
    .lt('license_expiry', expiryDate.toISOString().split('T')[0])
    .eq('status', 'Ativo')
    .order('license_expiry', { ascending: true });

  if (error) throw new Error(`Erro ao buscar licenças vencendo: ${error.message}`);
  return data || [];
};

// Get suppliers statistics
export const getWasteSuppliersStats = async (): Promise<WasteSuppliersStats> => {
  const { data, error } = await supabase
    .from('waste_suppliers')
    .select('supplier_type, status, license_expiry');

  if (error) throw new Error(`Erro ao buscar estatísticas: ${error.message}`);

  const suppliers = data || [];
  const currentDate = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

  const stats: WasteSuppliersStats = {
    total_suppliers: suppliers.length,
    active_suppliers: suppliers.filter(s => s.status === 'Ativo').length,
    expired_licenses: 0,
    expiring_soon: 0,
    by_type: {
      transporter: suppliers.filter(s => s.supplier_type === 'transporter').length,
      destination: suppliers.filter(s => s.supplier_type === 'destination').length,
      both: suppliers.filter(s => s.supplier_type === 'both').length,
    }
  };

  // Count expired and expiring licenses
  suppliers.forEach(supplier => {
    if (supplier.license_expiry) {
      const expiryDate = new Date(supplier.license_expiry);
      if (expiryDate < currentDate) {
        stats.expired_licenses++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        stats.expiring_soon++;
      }
    }
  });

  return stats;
};

// Helper function to format supplier type
export const formatSupplierType = (type: string): string => {
  const types = {
    transporter: 'Transportador',
    destination: 'Destinador',
    both: 'Transportador e Destinador'
  };
  return types[type as keyof typeof types] || type;
};

// Helper function to get license status
export const getLicenseStatus = (expiryDate?: string): 'valid' | 'expiring' | 'expired' | 'unknown' => {
  if (!expiryDate) return 'unknown';
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (expiry < today) return 'expired';
  if (expiry <= thirtyDaysFromNow) return 'expiring';
  return 'valid';
};