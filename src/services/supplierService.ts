import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  cnpj?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  category?: string;
  status: string;
  qualification_status: string;
  rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier_evaluations?: SupplierEvaluation[];
}

export interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  evaluation_date: string;
  quality_score: number;
  delivery_score: number;
  service_score: number;
  overall_score: number;
  comments?: string;
  evaluator_user_id?: string;
  created_at: string;
}

export interface CreateSupplierData {
  name: string;
  cnpj?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  category?: string;
  notes?: string;
}

export interface CreateSupplierEvaluationData {
  supplier_id: string;
  quality_score: number;
  delivery_score: number;
  service_score: number;
  comments?: string;
}

export interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  qualified_suppliers: number;
  average_score: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}

// Helper function to get current user's company ID
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

// Get all suppliers
export const getSuppliers = async (): Promise<Supplier[]> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      id,
      company_id,
      name,
      cnpj,
      contact_email,
      contact_phone,
      address,
      category,
      status,
      qualification_status,
      rating,
      notes,
      created_at,
      updated_at
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
  
  // Get evaluations separately to avoid complex joins
  const suppliers = data || [];
  const suppliersWithEvaluations = await Promise.all(
    suppliers.map(async (supplier) => {
      const { data: evaluations } = await supabase
        .from('supplier_evaluations')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        ...supplier,
        supplier_evaluations: evaluations || []
      };
    })
  );

  return suppliersWithEvaluations;
};

// Get single supplier by ID
export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      id,
      company_id,
      name,
      cnpj,
      contact_email,
      contact_phone,
      address,
      category,
      status,
      qualification_status,
      rating,
      notes,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
  
  // Get evaluations separately
  const { data: evaluations } = await supabase
    .from('supplier_evaluations')
    .select('*')
    .eq('supplier_id', id)
    .order('created_at', { ascending: false });

  return {
    ...data,
    supplier_evaluations: evaluations || []
  };
};

// Create new supplier
export const createSupplier = async (supplierData: CreateSupplierData): Promise<Supplier> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ 
      ...supplierData, 
      company_id: companyId,
      status: 'Ativo',
      qualification_status: 'Não Qualificado',
      rating: 0
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar fornecedor: ${error.message}`);
  return data;
};

// Update supplier
export const updateSupplier = async (id: string, updates: Partial<CreateSupplierData & { status: string; qualification_status: string; rating: number }>): Promise<Supplier> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
  return data;
};

// Delete supplier
export const deleteSupplier = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar fornecedor: ${error.message}`);
};

// Create supplier evaluation
export const createSupplierEvaluation = async (evaluationData: CreateSupplierEvaluationData): Promise<SupplierEvaluation> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Calculate overall score
  const overall_score = (evaluationData.quality_score + evaluationData.delivery_score + evaluationData.service_score) / 3;

  const { data, error } = await supabase
    .from('supplier_evaluations')
    .insert({
      ...evaluationData,
      overall_score,
      evaluator_user_id: user.id,
      evaluation_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar avaliação: ${error.message}`);

  // Update supplier rating with the new evaluation
  await updateSupplierRating(evaluationData.supplier_id);

  return data;
};

// Update supplier rating based on evaluations
const updateSupplierRating = async (supplierId: string): Promise<void> => {
  const { data: evaluations, error } = await supabase
    .from('supplier_evaluations')
    .select('overall_score')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(5); // Consider last 5 evaluations

  if (error) return;

  if (evaluations && evaluations.length > 0) {
    const avgRating = evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length;
    
    await supabase
      .from('suppliers')
      .update({ rating: Number(avgRating.toFixed(2)) })
      .eq('id', supplierId);
  }
};

// Get supplier evaluations
export const getSupplierEvaluations = async (supplierId?: string): Promise<SupplierEvaluation[]> => {
  let query = supabase
    .from('supplier_evaluations')
    .select('*')
    .order('created_at', { ascending: false });

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Erro ao buscar avaliações: ${error.message}`);
  return data || [];
};

// Get suppliers statistics
export const getSuppliersStats = async (): Promise<SupplierStats> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('suppliers')
    .select('category, status, qualification_status, rating')
    .eq('company_id', companyId);

  if (error) throw new Error(`Erro ao buscar estatísticas: ${error.message}`);

  const suppliers = data || [];

  const stats: SupplierStats = {
    total_suppliers: suppliers.length,
    active_suppliers: suppliers.filter(s => s.status === 'Ativo').length,
    qualified_suppliers: suppliers.filter(s => s.qualification_status === 'Qualificado').length,
    average_score: suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length 
      : 0,
    by_category: {},
    by_status: {}
  };

  // Count by category
  suppliers.forEach(supplier => {
    if (supplier.category) {
      stats.by_category[supplier.category] = (stats.by_category[supplier.category] || 0) + 1;
    }
  });

  // Count by status
  suppliers.forEach(supplier => {
    stats.by_status[supplier.status] = (stats.by_status[supplier.status] || 0) + 1;
  });

  return stats;
};

// Qualify supplier
export const qualifySupplier = async (supplierId: string, qualificationStatus: string, notes?: string): Promise<void> => {
  const { error } = await supabase
    .from('suppliers')
    .update({ 
      qualification_status: qualificationStatus,
      notes: notes 
    })
    .eq('id', supplierId);

  if (error) throw new Error(`Erro ao qualificar fornecedor: ${error.message}`);
};

// Get suppliers by category
export const getSuppliersByCategory = async (category: string): Promise<Supplier[]> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, company_id, name, cnpj, contact_email, contact_phone, address, category, status, qualification_status, rating, notes, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('category', category)
    .eq('status', 'Ativo')
    .order('name');

  if (error) throw new Error(`Erro ao buscar fornecedores por categoria: ${error.message}`);
  return (data || []).map(supplier => ({ ...supplier, supplier_evaluations: [] }));
};

// Get qualified suppliers
export const getQualifiedSuppliers = async (): Promise<Supplier[]> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, company_id, name, cnpj, contact_email, contact_phone, address, category, status, qualification_status, rating, notes, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('qualification_status', 'Qualificado')
    .eq('status', 'Ativo')
    .order('rating', { ascending: false });

  if (error) throw new Error(`Erro ao buscar fornecedores qualificados: ${error.message}`);
  return (data || []).map(supplier => ({ ...supplier, supplier_evaluations: [] }));
};