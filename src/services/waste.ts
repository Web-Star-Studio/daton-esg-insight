import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WasteStatusEnum = Database["public"]["Enums"]["waste_status_enum"];
type WasteClassEnum = Database["public"]["Enums"]["waste_class_enum"];

// Type definitions
export interface WasteLogListItem {
  id: string;
  mtr_number: string;
  waste_description: string;
  collection_date: string;
  quantity: number;
  unit: string;
  status: string;
  waste_class?: string;
  destination_name?: string;
}

export interface WasteLogDetail extends WasteLogListItem {
  transporter_name?: string;
  transporter_cnpj?: string;
  destination_cnpj?: string;
  final_treatment_type?: string;
  cost?: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWasteLogData {
  mtr_number: string;
  waste_description: string;
  waste_class: WasteClassEnum;
  collection_date: string;
  quantity: number;
  unit: string;
  transporter_name?: string;
  transporter_cnpj?: string;
  destination_name?: string;
  destination_cnpj?: string;
  final_treatment_type?: string;
  cost?: number;
  status?: WasteStatusEnum;
}

export interface UpdateWasteLogData {
  mtr_number?: string;
  waste_description?: string;
  waste_class?: WasteClassEnum;
  collection_date?: string;
  quantity?: number;
  unit?: string;
  transporter_name?: string;
  transporter_cnpj?: string;
  destination_name?: string;
  destination_cnpj?: string;
  final_treatment_type?: string;
  cost?: number;
  status?: WasteStatusEnum;
}

export interface WasteDashboard {
  total_generated: { value: number; unit: "toneladas" };
  recycling_rate_percent: number;
  sent_to_landfill: { value: number; unit: "toneladas" };
  disposal_cost_month: number;
}

export interface WasteFilters {
  start_date?: string;
  end_date?: string;
}

export interface DashboardFilters {
  month?: number;
  year?: number;
}

// Utility function to convert units to tons
const convertToTons = (quantity: number, unit: string): number => {
  switch (unit.toLowerCase()) {
    case 'tonelada':
    case 'ton':
      return quantity;
    case 'kg':
      return quantity / 1000;
    case 'g':
      return quantity / 1000000;
    default:
      return quantity; // Assume already in tons if unknown
  }
};

// Format dates for display
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// GET /api/v1/waste-logs
export const getWasteLogs = async (filters?: WasteFilters): Promise<WasteLogListItem[]> => {
  let query = supabase
    .from('waste_logs')
    .select(`
      id,
      mtr_number,
      waste_description,
      collection_date,
      quantity,
      unit,
      status,
      waste_class,
      destination_name
    `)
    .order('collection_date', { ascending: false });

  // Apply date filters
  if (filters?.start_date) {
    query = query.gte('collection_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('collection_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching waste logs:', error);
    throw new Error('Erro ao buscar registros de resíduos');
  }

  return (data || []).map(log => ({
    ...log,
    collection_date: formatDate(log.collection_date)
  }));
};

// GET /api/v1/waste-logs/{id}
export const getWasteLogById = async (id: string): Promise<WasteLogDetail> => {
  const { data, error } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching waste log:', error);
    throw new Error('Registro de resíduo não encontrado');
  }

  return {
    ...data,
    collection_date: formatDate(data.collection_date)
  };
};

// POST /api/v1/waste-logs
export const createWasteLog = async (wasteData: CreateWasteLogData): Promise<WasteLogDetail> => {
  console.log("🔍 [API] Iniciando createWasteLog...");
  console.log("📥 [API] Dados recebidos:", wasteData);
  
  // Get user first
  console.log("👤 [API] Buscando usuário autenticado...");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("❌ [API] Erro ao obter usuário:", userError);
    throw new Error('Erro de autenticação. Por favor, faça login novamente.');
  }
  
  if (!user) {
    console.error("❌ [API] Nenhum usuário autenticado");
    throw new Error('Você precisa estar autenticado para registrar resíduos.');
  }
  
  console.log("✅ [API] Usuário autenticado:", user.id);
  
  // Get user's company ID
  console.log("🏢 [API] Buscando company_id do usuário...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error("❌ [API] Erro ao buscar profile:", profileError);
    throw new Error('Erro ao obter dados da empresa. Contate o suporte.');
  }
  
  if (!profile || !profile.company_id) {
    console.error("❌ [API] Profile não encontrado ou sem company_id:", profile);
    throw new Error('Sua conta não está vinculada a uma empresa. Contate o administrador.');
  }

  console.log("✅ [API] Company ID encontrado:", profile.company_id);

  const insertData = {
    ...wasteData,
    company_id: profile.company_id,
    status: (wasteData.status || 'Coletado') as WasteStatusEnum
  };

  console.log("📤 [API] Inserindo dados no banco:", insertData);

  const { data, error } = await supabase
    .from('waste_logs')
    .insert([insertData])
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ [API] Erro ao inserir waste log:', error);
    console.error('❌ [API] Detalhes do erro:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    // Mensagens específicas por tipo de erro
    if (error.code === '42501') {
      throw new Error('Você não tem permissão para registrar resíduos. Verifique suas permissões de acesso.');
    } else if (error.code === '23505') {
      throw new Error('Já existe um registro com este número MTR. Use um número diferente.');
    } else if (error.message.includes('company_id')) {
      throw new Error('Erro ao vincular registro à empresa. Contate o suporte.');
    }
    
    throw new Error(`Erro ao criar registro: ${error.message}`);
  }

  if (!data) {
    console.error('❌ [API] Nenhum dado retornado após insert');
    throw new Error('Erro ao criar registro de resíduo. Nenhum dado foi retornado.');
  }

  console.log("✅ [API] Registro criado com sucesso:", data);

  return {
    ...data,
    collection_date: formatDate(data.collection_date)
  };
};

// PUT /api/v1/waste-logs/{id}
export const updateWasteLog = async (id: string, updates: UpdateWasteLogData): Promise<WasteLogDetail> => {
  const { data, error } = await supabase
    .from('waste_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating waste log:', error);
    throw new Error('Erro ao atualizar registro de resíduo');
  }

  if (!data) {
    throw new Error('Registro de resíduo não encontrado');
  }

  return {
    ...data,
    collection_date: formatDate(data.collection_date)
  };
};

// GET /api/v1/dashboards/waste
export const getWasteDashboard = async (filters?: DashboardFilters): Promise<WasteDashboard> => {
  const currentDate = new Date();
  const month = filters?.month || currentDate.getMonth() + 1;
  const year = filters?.year || currentDate.getFullYear();

  // Create date range for the specified month
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('waste_logs')
    .select('quantity, unit, final_treatment_type, cost')
    .gte('collection_date', startDate)
    .lte('collection_date', endDate);

  if (error) {
    console.error('Error fetching waste dashboard:', error);
    throw new Error('Erro ao buscar dados do dashboard');
  }

  if (!data || data.length === 0) {
    return {
      total_generated: { value: 0, unit: "toneladas" },
      recycling_rate_percent: 0,
      sent_to_landfill: { value: 0, unit: "toneladas" },
      disposal_cost_month: 0
    };
  }

  // Calculate total generated in tons
  const totalGeneratedTons = data.reduce((sum, log) => {
    return sum + convertToTons(log.quantity, log.unit);
  }, 0);

  // Calculate recycling rate
  const recyclingTypes = ['Reciclagem', 'Reaproveitamento'];
  const recycledCount = data.filter(log => 
    log.final_treatment_type && recyclingTypes.includes(log.final_treatment_type)
  ).length;
  const recyclingRate = data.length > 0 ? (recycledCount / data.length) * 100 : 0;

  // Calculate sent to landfill in tons
  const landfillTons = data
    .filter(log => log.final_treatment_type === 'Aterro Sanitário')
    .reduce((sum, log) => sum + convertToTons(log.quantity, log.unit), 0);

  // Calculate total disposal cost
  const totalCost = data.reduce((sum, log) => sum + (log.cost || 0), 0);

  return {
    total_generated: { 
      value: Math.round(totalGeneratedTons * 100) / 100, 
      unit: "toneladas" 
    },
    recycling_rate_percent: Math.round(recyclingRate),
    sent_to_landfill: { 
      value: Math.round(landfillTons * 100) / 100, 
      unit: "toneladas" 
    },
    disposal_cost_month: totalCost
  };
};

// Upload document for waste log
export const uploadWasteDocument = async (wasteLogId: string, file: File): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Usuário não autenticado');
  }

  // Get user's company ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Erro ao obter dados da empresa');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `waste-logs/${wasteLogId}/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error('Erro ao fazer upload do arquivo');
  }

  // Save document record in database
  const { error: dbError } = await supabase
    .from('documents')
    .insert([{
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      related_model: 'waste_logs',
      related_id: wasteLogId,
      company_id: profile.company_id,
      uploader_user_id: user.user.id
    }]);

  if (dbError) {
    console.error('Error saving document record:', dbError);
    throw new Error('Erro ao salvar registro do documento');
  }

  return filePath;
};

// GET documents for waste log
export const getWasteLogDocuments = async (wasteLogId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('related_model', 'waste_logs')
    .eq('related_id', wasteLogId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Erro ao buscar documentos');
  }

  return data || [];
};

// DELETE document
export const deleteWasteDocument = async (documentId: string) => {
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError || !doc) {
    throw new Error('Documento não encontrado');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.file_path]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    throw new Error('Erro ao excluir documento');
  }
};