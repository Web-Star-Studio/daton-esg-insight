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
  expiry_date?: string;
  is_exempt?: boolean;
  exempt_reason?: string;
  next_evaluation_date?: string;
  evaluation_status?: 'Ativo' | 'Inativo';
  created_at: string;
  updated_at: string;
  required_document?: RequiredDocument;
}

// Interface para associação Documento ↔ Tipo
export interface DocumentTypeRequirement {
  id: string;
  company_id: string;
  supplier_type_id: string;
  required_document_id: string;
  is_mandatory: boolean;
  created_at: string;
  required_document?: RequiredDocument;
  supplier_type?: SupplierType;
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

// ==================== ASSOCIAÇÃO DOCUMENTO ↔ TIPO ====================

export async function getDocumentsForType(typeId: string): Promise<DocumentTypeRequirement[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_document_type_requirements')
    .select(`
      *,
      required_document:supplier_required_documents(*)
    `)
    .eq('company_id', companyId)
    .eq('supplier_type_id', typeId);
    
  if (error) throw error;
  return (data || []) as DocumentTypeRequirement[];
}

export async function getDocumentTypeRequirements(): Promise<DocumentTypeRequirement[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_document_type_requirements')
    .select(`
      *,
      required_document:supplier_required_documents(*),
      supplier_type:supplier_types(*)
    `)
    .eq('company_id', companyId);
    
  if (error) throw error;
  return (data || []) as DocumentTypeRequirement[];
}

export async function updateTypeDocuments(typeId: string, documentIds: string[]): Promise<void> {
  const companyId = await getCurrentUserCompanyId();
  
  // Remover associações existentes para este tipo
  const { error: deleteError } = await supabase
    .from('supplier_document_type_requirements')
    .delete()
    .eq('supplier_type_id', typeId)
    .eq('company_id', companyId);
    
  if (deleteError) throw deleteError;
  
  // Criar novas associações
  if (documentIds.length > 0) {
    const insertData = documentIds.map(docId => ({
      company_id: companyId,
      supplier_type_id: typeId,
      required_document_id: docId,
      is_mandatory: true
    }));
    
    const { error: insertError } = await supabase
      .from('supplier_document_type_requirements')
      .insert(insertData);
      
    if (insertError) throw insertError;
  }
}

// ==================== VINCULAÇÕES DE FORNECEDOR ====================

export interface SupplierUnitAssignment {
  id: string;
  company_id: string;
  supplier_id: string;
  business_unit_id: string;
  is_corporate: boolean;
  created_at: string;
}

export interface SupplierCategoryAssignment {
  id: string;
  company_id: string;
  supplier_id: string;
  category_id: string;
  created_at: string;
  category?: SupplierCategory;
}

export interface SupplierTypeAssignment {
  id: string;
  supplier_id: string;
  supplier_type_id: string;
  company_id?: string;
  supplier_type?: SupplierType;
}

export interface SupplierAssignments {
  units: SupplierUnitAssignment[];
  types: SupplierTypeAssignment[];
  categories: SupplierCategoryAssignment[];
}

interface BusinessUnit {
  id: string;
  name: string;
}

export async function getBusinessUnits(): Promise<BusinessUnit[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('companies')
    .select('business_units')
    .eq('id', companyId)
    .single();
    
  if (error) throw error;
  
  // business_units é JSONB - retornar como array
  const units = data?.business_units;
  if (Array.isArray(units)) {
    return units.map((u: any, index: number) => ({
      id: u.id || `unit-${index}`,
      name: u.name || u
    }));
  }
  
  return [];
}

export async function getSupplierAssignments(supplierId: string): Promise<SupplierAssignments> {
  const companyId = await getCurrentUserCompanyId();
  
  const [unitsResult, typesResult, categoriesResult] = await Promise.all([
    supabase
      .from('supplier_unit_assignments')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('company_id', companyId),
    supabase
      .from('supplier_type_assignments')
      .select('*, supplier_type:supplier_types(*)')
      .eq('supplier_id', supplierId),
    supabase
      .from('supplier_category_assignments')
      .select('*, category:supplier_categories(*)')
      .eq('supplier_id', supplierId)
      .eq('company_id', companyId)
  ]);
  
  if (unitsResult.error) throw unitsResult.error;
  if (typesResult.error) throw typesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  
  return {
    units: (unitsResult.data || []) as SupplierUnitAssignment[],
    types: (typesResult.data || []) as SupplierTypeAssignment[],
    categories: (categoriesResult.data || []) as SupplierCategoryAssignment[]
  };
}

export async function updateSupplierAssignments(
  supplierId: string,
  data: {
    units: string[];
    types: string[];
    categories: string[];
    isCorporate: boolean;
  }
): Promise<void> {
  const companyId = await getCurrentUserCompanyId();
  
  // Atualizar unidades
  await supabase
    .from('supplier_unit_assignments')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('company_id', companyId);
  
  if (data.units.length > 0) {
    await supabase
      .from('supplier_unit_assignments')
      .insert(data.units.map(unitId => ({
        company_id: companyId,
        supplier_id: supplierId,
        business_unit_id: unitId,
        is_corporate: data.isCorporate
      })));
  }
  
  // Atualizar tipos
  await supabase
    .from('supplier_type_assignments')
    .delete()
    .eq('supplier_id', supplierId);
  
  if (data.types.length > 0) {
    await supabase
      .from('supplier_type_assignments')
      .insert(data.types.map(typeId => ({
        supplier_id: supplierId,
        supplier_type_id: typeId,
        company_id: companyId
      })));
  }
  
  // Atualizar categorias
  await supabase
    .from('supplier_category_assignments')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('company_id', companyId);
  
  if (data.categories.length > 0) {
    await supabase
      .from('supplier_category_assignments')
      .insert(data.categories.map(catId => ({
        company_id: companyId,
        supplier_id: supplierId,
        category_id: catId
      })));
  }
}

// ==================== PRODUTOS/SERVIÇOS [ALX] ====================

export interface SupplierProductService {
  id: string;
  company_id: string;
  supplier_id: string;
  name: string;
  item_type: 'produto' | 'servico';
  description?: string;
  category?: string;
  unit_of_measure?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSupplierProductsServices(supplierId: string): Promise<SupplierProductService[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_products_services')
    .select('*')
    .eq('company_id', companyId)
    .eq('supplier_id', supplierId)
    .order('name');
    
  if (error) throw error;
  return (data || []) as SupplierProductService[];
}

export async function createSupplierProductService(item: {
  supplier_id: string;
  name: string;
  item_type: 'produto' | 'servico';
  description?: string;
  category?: string;
  unit_of_measure?: string;
}): Promise<SupplierProductService> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_products_services')
    .insert({ ...item, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierProductService;
}

export async function updateSupplierProductService(id: string, updates: Partial<SupplierProductService>): Promise<SupplierProductService> {
  const { data, error } = await supabase
    .from('supplier_products_services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierProductService;
}

export async function deleteSupplierProductService(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_products_services')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== AVALIAÇÕES DOCUMENTAIS [AVA1] ====================

export interface SupplierDocumentEvaluation {
  id: string;
  company_id: string;
  supplier_id: string;
  evaluation_date: string;
  total_weight_required: number;
  total_weight_achieved: number;
  compliance_percentage: number;
  next_evaluation_date?: string;
  observation?: string;
  evaluated_by?: string;
  supplier_status: 'Ativo' | 'Inativo';
  created_at: string;
}

export async function getSupplierDocumentEvaluations(supplierId: string): Promise<SupplierDocumentEvaluation[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_document_evaluations')
    .select('*')
    .eq('company_id', companyId)
    .eq('supplier_id', supplierId)
    .order('evaluation_date', { ascending: false });
    
  if (error) throw error;
  return (data || []) as SupplierDocumentEvaluation[];
}

export async function createSupplierDocumentEvaluation(evaluation: {
  supplier_id: string;
  total_weight_required: number;
  total_weight_achieved: number;
  compliance_percentage: number;
  next_evaluation_date?: string | null;
  observation?: string | null;
  supplier_status: 'Ativo' | 'Inativo';
}): Promise<SupplierDocumentEvaluation> {
  const companyId = await getCurrentUserCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('supplier_document_evaluations')
    .insert({ ...evaluation, company_id: companyId, evaluated_by: user?.id })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierDocumentEvaluation;
}

export async function updateDocumentSubmission(id: string, updates: {
  is_exempt?: boolean;
  exempt_reason?: string | null;
  expiry_date?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('supplier_document_submissions')
    .update(updates)
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== AVALIAÇÕES DE DESEMPENHO [AVA2] ====================

export interface SupplierPerformanceEvaluation {
  id: string;
  company_id: string;
  supplier_id: string;
  product_service_id: string;
  evaluation_date: string;
  quality_score: number;
  delivery_score: number;
  price_score: number;
  communication_score: number;
  compliance_score: number;
  overall_score: number;
  observation?: string;
  evaluated_by?: string;
  created_at: string;
}

export async function getSupplierPerformanceEvaluations(supplierId: string): Promise<SupplierPerformanceEvaluation[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_performance_evaluations')
    .select('*')
    .eq('company_id', companyId)
    .eq('supplier_id', supplierId)
    .order('evaluation_date', { ascending: false });
    
  if (error) throw error;
  return (data || []) as SupplierPerformanceEvaluation[];
}

export async function createSupplierPerformanceEvaluation(evaluation: {
  supplier_id: string;
  product_service_id: string;
  quality_score: number;
  delivery_score: number;
  price_score: number;
  communication_score: number;
  compliance_score: number;
  overall_score: number;
  observation?: string | null;
}): Promise<SupplierPerformanceEvaluation> {
  const companyId = await getCurrentUserCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('supplier_performance_evaluations')
    .insert({ ...evaluation, company_id: companyId, evaluated_by: user?.id })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierPerformanceEvaluation;
}

// ==================== ALERTAS DE VENCIMENTO ====================

export interface SupplierExpirationAlert {
  id: string;
  company_id: string;
  supplier_id: string;
  alert_type: 'documento' | 'treinamento' | 'avaliacao';
  reference_id: string;
  reference_name: string;
  expiry_date: string;
  days_until_expiry?: number;
  alert_status: 'Pendente' | 'Visualizado' | 'Resolvido';
  created_at: string;
  supplier?: { company_name?: string; full_name?: string };
}

export async function getSupplierExpirationAlerts(): Promise<SupplierExpirationAlert[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_expiration_alerts')
    .select('*, supplier:supplier_management(company_name, full_name)')
    .eq('company_id', companyId)
    .order('expiry_date');
    
  if (error) throw error;
  return (data || []) as SupplierExpirationAlert[];
}

export async function updateExpirationAlertStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_expiration_alerts')
    .update({ alert_status: status })
    .eq('id', id);
    
  if (error) throw error;
}
