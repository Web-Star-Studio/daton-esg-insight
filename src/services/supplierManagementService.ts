import { supabase } from "@/integrations/supabase/client";

// Interfaces
export interface RequiredDocument {
  id: string;
  company_id: string;
  document_name: string;
  weight: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCategory {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierType {
  id: string;
  company_id: string;
  name: string;
  parent_type_id?: string;
  category_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: SupplierType[];
  category?: SupplierCategory;
}

export interface ManagedSupplier {
  id: string;
  company_id: string;
  person_type: 'PF' | 'PJ';
  full_name?: string;
  cpf?: string;
  company_name?: string;
  cnpj?: string;
  responsible_name?: string;
  nickname?: string;
  full_address: string;
  phone_1: string;
  phone_2?: string;
  email?: string;
  registration_date: string;
  temporary_password?: string;
  access_code?: string;
  status: 'Ativo' | 'Inativo' | 'Suspenso';
  created_at: string;
  updated_at: string;
  supplier_types?: SupplierType[];
}

export interface SupplierConnection {
  id: string;
  company_id: string;
  primary_supplier_id: string;
  connected_supplier_id: string;
  connection_type: 'logistica_reversa' | 'material_perigoso' | 'outro';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  primary_supplier?: ManagedSupplier;
  connected_supplier?: ManagedSupplier;
}

export interface DocumentSubmission {
  id: string;
  company_id: string;
  supplier_id: string;
  required_document_id: string;
  file_path?: string;
  file_name?: string;
  submitted_at: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  evaluated_by?: string;
  evaluated_at?: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  required_document?: RequiredDocument;
}

// Helper
async function getCurrentUserCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (error || !profile?.company_id) {
    throw new Error("Empresa não encontrada para o usuário");
  }
  
  return profile.company_id;
}

// ==================== DOCUMENTOS OBRIGATÓRIOS ====================

export async function getRequiredDocuments(): Promise<RequiredDocument[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_required_documents')
    .select('*')
    .eq('company_id', companyId)
    .order('document_name');
    
  if (error) throw error;
  return data || [];
}

export async function createRequiredDocument(doc: { document_name: string; weight: number; description?: string }): Promise<RequiredDocument> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_required_documents')
    .insert({ ...doc, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateRequiredDocument(id: string, updates: Partial<RequiredDocument>): Promise<RequiredDocument> {
  const { data, error } = await supabase
    .from('supplier_required_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteRequiredDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_required_documents')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== CATEGORIAS DE FORNECEDOR ====================

export async function getSupplierCategories(): Promise<SupplierCategory[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name');
    
  if (error) throw error;
  return (data || []) as SupplierCategory[];
}

export async function createSupplierCategory(category: { name: string }): Promise<SupplierCategory> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_categories')
    .insert({ name: category.name, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierCategory;
}

export async function updateSupplierCategory(id: string, updates: Partial<SupplierCategory>): Promise<SupplierCategory> {
  const { data, error } = await supabase
    .from('supplier_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierCategory;
}

export async function deleteSupplierCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_categories')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== TIPOS DE FORNECEDOR ====================

export async function getSupplierTypes(): Promise<SupplierType[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_types')
    .select('*')
    .eq('company_id', companyId)
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export function buildTypeTree(types: SupplierType[]): SupplierType[] {
  const typeMap = new Map<string, SupplierType>();
  const roots: SupplierType[] = [];
  
  types.forEach(type => {
    typeMap.set(type.id, { ...type, children: [] });
  });
  
  types.forEach(type => {
    const node = typeMap.get(type.id)!;
    if (type.parent_type_id && typeMap.has(type.parent_type_id)) {
      typeMap.get(type.parent_type_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

export async function createSupplierType(type: { name: string; parent_type_id?: string; category_id?: string; description?: string }): Promise<SupplierType> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_types')
    .insert({ ...type, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateSupplierType(id: string, updates: Partial<SupplierType>): Promise<SupplierType> {
  const { data, error } = await supabase
    .from('supplier_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteSupplierType(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_types')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== FORNECEDORES ====================

export async function getManagedSuppliers(): Promise<ManagedSupplier[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_management')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return (data || []) as ManagedSupplier[];
}

export async function getManagedSupplierById(id: string): Promise<ManagedSupplier | null> {
  const { data, error } = await supabase
    .from('supplier_management')
    .select('*')
    .eq('id', id)
    .maybeSingle();
    
  if (error) throw error;
  return data as ManagedSupplier | null;
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function generateAccessCode(): string {
  return `FORN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

interface CreateSupplierData {
  person_type: 'PF' | 'PJ';
  full_name?: string;
  cpf?: string;
  company_name?: string;
  cnpj?: string;
  responsible_name?: string;
  nickname?: string;
  full_address: string;
  phone_1: string;
  phone_2?: string;
  email?: string;
  type_ids?: string[];
}

export async function createManagedSupplier(supplierData: CreateSupplierData): Promise<ManagedSupplier> {
  const companyId = await getCurrentUserCompanyId();
  const { type_ids, ...supplier } = supplierData;
  
  const { data, error } = await supabase
    .from('supplier_management')
    .insert({
      ...supplier,
      company_id: companyId,
      temporary_password: generateTemporaryPassword(),
      access_code: generateAccessCode(),
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Assign types if provided
  if (type_ids && type_ids.length > 0) {
    const assignments = type_ids.map(typeId => ({
      supplier_id: data.id,
      supplier_type_id: typeId
    }));
    
    await supabase
      .from('supplier_type_assignments')
      .insert(assignments);
  }
  
  return data as ManagedSupplier;
}

export async function updateManagedSupplier(id: string, updates: Partial<ManagedSupplier>): Promise<ManagedSupplier> {
  const { data, error } = await supabase
    .from('supplier_management')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as ManagedSupplier;
}

export async function deleteManagedSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_management')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== CONEXÕES ====================

export async function getSupplierConnections(): Promise<SupplierConnection[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_connections')
    .select(`
      *,
      primary_supplier:supplier_management!supplier_connections_primary_supplier_id_fkey(*),
      connected_supplier:supplier_management!supplier_connections_connected_supplier_id_fkey(*)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return (data || []) as SupplierConnection[];
}

export async function createSupplierConnection(connection: {
  primary_supplier_id: string;
  connected_supplier_id: string;
  connection_type: 'logistica_reversa' | 'material_perigoso' | 'outro';
  description?: string;
}): Promise<SupplierConnection> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_connections')
    .insert({ ...connection, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierConnection;
}

export async function deleteSupplierConnection(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_connections')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== SUBMISSÕES DE DOCUMENTOS ====================

export async function getDocumentSubmissions(supplierId?: string): Promise<DocumentSubmission[]> {
  const companyId = await getCurrentUserCompanyId();
  
  let query = supabase
    .from('supplier_document_submissions')
    .select(`
      *,
      required_document:supplier_required_documents(*)
    `)
    .eq('company_id', companyId);
    
  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }
  
  const { data, error } = await query.order('submitted_at', { ascending: false });
    
  if (error) throw error;
  return (data || []) as DocumentSubmission[];
}

export async function evaluateDocumentSubmission(
  id: string, 
  evaluation: { status: 'Aprovado' | 'Rejeitado'; score?: number; notes?: string }
): Promise<DocumentSubmission> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('supplier_document_submissions')
    .update({
      ...evaluation,
      evaluated_by: user?.id,
      evaluated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as DocumentSubmission;
}

// ==================== ESTATÍSTICAS ====================

export async function getSupplierStats() {
  const companyId = await getCurrentUserCompanyId();
  
  const [suppliers, types, documents, connections] = await Promise.all([
    supabase.from('supplier_management').select('id, status, person_type').eq('company_id', companyId),
    supabase.from('supplier_types').select('id').eq('company_id', companyId).eq('is_active', true),
    supabase.from('supplier_required_documents').select('id').eq('company_id', companyId).eq('is_active', true),
    supabase.from('supplier_connections').select('id').eq('company_id', companyId).eq('is_active', true)
  ]);
  
  const supplierList = suppliers.data || [];
  
  return {
    totalSuppliers: supplierList.length,
    activeSuppliers: supplierList.filter(s => s.status === 'Ativo').length,
    pfCount: supplierList.filter(s => s.person_type === 'PF').length,
    pjCount: supplierList.filter(s => s.person_type === 'PJ').length,
    totalTypes: types.data?.length || 0,
    totalDocuments: documents.data?.length || 0,
    totalConnections: connections.data?.length || 0
  };
}

// Weight labels
export const weightLabels: Record<number, string> = {
  1: 'Não atende',
  2: 'Atende parcialmente',
  3: 'Atende de forma razoável',
  4: 'Atende bem',
  5: 'Atende totalmente'
};

export const connectionTypeLabels: Record<string, string> = {
  'logistica_reversa': 'Logística Reversa',
  'material_perigoso': 'Material Perigoso',
  'outro': 'Outro'
};

// ==================== TREINAMENTOS E INFORMATIVOS ====================

export interface SupplierTrainingMaterial {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  material_type: 'arquivo' | 'link' | 'questionario';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  external_url?: string;
  custom_form_id?: string;
  is_active: boolean;
  is_mandatory: boolean;
  due_days?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  categories?: SupplierCategory[];
  custom_form?: { id: string; title: string };
}

export interface SupplierTrainingCategoryLink {
  id: string;
  training_material_id: string;
  category_id: string;
  created_at: string;
}

export async function getTrainingMaterials(): Promise<SupplierTrainingMaterial[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_training_materials')
    .select(`
      *,
      custom_forms(id, title)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  // Buscar categorias vinculadas
  const materials = data || [];
  const materialIds = materials.map(m => m.id);
  
  if (materialIds.length > 0) {
    const { data: links } = await supabase
      .from('supplier_training_category_links')
      .select('training_material_id, category_id, supplier_categories(id, name)')
      .in('training_material_id', materialIds);
    
    const linksByMaterial = new Map<string, SupplierCategory[]>();
    (links || []).forEach((link: any) => {
      if (!linksByMaterial.has(link.training_material_id)) {
        linksByMaterial.set(link.training_material_id, []);
      }
      if (link.supplier_categories) {
        linksByMaterial.get(link.training_material_id)!.push(link.supplier_categories);
      }
    });
    
    materials.forEach(m => {
      (m as SupplierTrainingMaterial).categories = linksByMaterial.get(m.id) || [];
      (m as SupplierTrainingMaterial).custom_form = m.custom_forms;
    });
  }
  
  return materials as SupplierTrainingMaterial[];
}

export async function createTrainingMaterial(material: {
  title: string;
  description?: string;
  material_type: 'arquivo' | 'link' | 'questionario';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  external_url?: string;
  custom_form_id?: string;
  is_mandatory?: boolean;
  due_days?: number;
  category_ids?: string[];
}): Promise<SupplierTrainingMaterial> {
  const companyId = await getCurrentUserCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { category_ids, ...materialData } = material;
  
  const { data, error } = await supabase
    .from('supplier_training_materials')
    .insert({
      ...materialData,
      company_id: companyId,
      created_by: user?.id
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Vincular categorias
  if (category_ids && category_ids.length > 0) {
    await supabase
      .from('supplier_training_category_links')
      .insert(category_ids.map(catId => ({
        training_material_id: data.id,
        category_id: catId
      })));
  }
  
  return data as SupplierTrainingMaterial;
}

export async function updateTrainingMaterial(
  id: string, 
  updates: Partial<SupplierTrainingMaterial> & { category_ids?: string[] }
): Promise<SupplierTrainingMaterial> {
  const { category_ids, categories, custom_form, ...materialUpdates } = updates;
  
  const { data, error } = await supabase
    .from('supplier_training_materials')
    .update(materialUpdates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  
  // Atualizar categorias se fornecidas
  if (category_ids !== undefined) {
    await supabase
      .from('supplier_training_category_links')
      .delete()
      .eq('training_material_id', id);
    
    if (category_ids.length > 0) {
      await supabase
        .from('supplier_training_category_links')
        .insert(category_ids.map(catId => ({
          training_material_id: id,
          category_id: catId
        })));
    }
  }
  
  return data as SupplierTrainingMaterial;
}

export async function deleteTrainingMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_training_materials')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export const materialTypeLabels: Record<string, string> = {
  'arquivo': 'Arquivo',
  'link': 'Link',
  'questionario': 'Questionário'
};
