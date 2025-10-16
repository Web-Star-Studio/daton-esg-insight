import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface Asset {
  id: string;
  company_id: string;
  name: string;
  asset_type: string;
  location?: string;
  description?: string;
  parent_asset_id?: string;
  // Campos ambientais específicos
  productive_capacity?: number;
  capacity_unit?: string;
  installation_year?: number;
  operational_status?: string;
  pollution_potential?: string;
  cnae_code?: string;
  monitoring_frequency?: string;
  critical_parameters?: string[];
  monitoring_responsible?: string;
  created_at: string;
  updated_at: string;
  children?: Asset[];
}

export interface AssetWithLinkedData extends Asset {
  linked_emission_sources: Array<{
    id: string;
    name: string;
    category: string;
    scope: number;
    status: string;
  }>;
  linked_licenses: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    expiration_date: string;
    issuing_body: string;
  }>;
  linked_waste_logs: Array<{
    id: string;
    mtr_number: string;
    waste_description: string;
    quantity: number;
    unit: string;
    collection_date: string;
    status: string;
  }>;
  kpis: {
    total_emissions: number;
    active_licenses: number;
    waste_records: number;
  };
}

export interface CreateAssetData {
  name: string;
  asset_type: string;
  location?: string;
  description?: string;
  parent_asset_id?: string;
  // Campos ambientais específicos
  productive_capacity?: number;
  capacity_unit?: string;
  installation_year?: number;
  operational_status?: string;
  pollution_potential?: string;
  cnae_code?: string;
  monitoring_frequency?: string;
  critical_parameters?: string[];
  monitoring_responsible?: string;
}

export interface UpdateAssetData {
  name?: string;
  asset_type?: string;
  location?: string;
  description?: string;
  parent_asset_id?: string;
  // Campos ambientais específicos
  productive_capacity?: number;
  capacity_unit?: string;
  installation_year?: number;
  operational_status?: string;
  pollution_potential?: string;
  cnae_code?: string;
  monitoring_frequency?: string;
  critical_parameters?: string[];
  monitoring_responsible?: string;
}

export const ASSET_TYPES = [
  'Unidade Industrial',
  'Fonte Fixa de Combustão',
  'Chaminé/Stack',
  'Sistema de Tratamento',
  'Depósito de Resíduos',
  'Fonte Móvel',
  'Equipamento de Monitoramento',
  'Sistema de Controle Ambiental',
  'Infraestrutura Auxiliar'
];

export const OPERATIONAL_STATUS_OPTIONS = ['Ativo', 'Inativo', 'Manutenção'] as const;
export const POLLUTION_POTENTIAL_OPTIONS = ['Alto', 'Médio', 'Baixo'] as const;
export const MONITORING_FREQUENCY_OPTIONS = ['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Anual'] as const;

export async function getAssetsHierarchy(): Promise<Asset[]> {
  try {
    const { data, error } = await supabase.functions.invoke('assets-management');

    if (error) {
      console.error('Error fetching assets hierarchy:', error);
      throw new Error(`Failed to fetch assets: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.assets) {
      console.warn('No assets data returned from function');
      return [];
    }

    return data.assets;
  } catch (err) {
    console.error('Exception in getAssetsHierarchy:', err);
    throw err;
  }
}

export async function getAssetById(id: string): Promise<AssetWithLinkedData> {
  const { data, error } = await supabase.functions.invoke('assets-management', {
    method: 'GET',
    body: null,
    // Adicionar o ID na URL através de query params ou header
  });

  // Como não podemos modificar a URL facilmente, vamos usar uma query direta
  const { data: assetData, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (assetError || !assetData) {
    throw new Error('Ativo não encontrado');
  }

  // Buscar dados vinculados
  const [emissionSourcesRes, licensesRes, wasteLogsRes] = await Promise.all([
    supabase
      .from('emission_sources')
      .select('id, name, category, scope, status')
      .eq('asset_id', id),
    supabase
      .from('licenses')
      .select('id, name, type, status, expiration_date, issuing_body')
      .eq('asset_id', id),
    supabase
      .from('waste_logs')
      .select('id, mtr_number, waste_description, quantity, unit, collection_date, status')
      .eq('asset_id', id)
  ]);

  const linked_emission_sources = emissionSourcesRes.data || [];
  const linked_licenses = licensesRes.data || [];
  const linked_waste_logs = wasteLogsRes.data || [];

  const kpis = {
    total_emissions: linked_emission_sources.length,
    active_licenses: linked_licenses.filter(l => l.status === 'Ativa').length,
    waste_records: linked_waste_logs.length
  };

  return {
    ...assetData,
    linked_emission_sources,
    linked_licenses,
    linked_waste_logs,
    kpis
  };
}

export async function createAsset(assetData: CreateAssetData): Promise<Asset> {
  // Get company_id from user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Não foi possível obter informações da empresa do usuário');
  }

  const { data, error } = await supabase
    .from('assets')
    .insert([{ ...assetData, company_id: profile.company_id }])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar ativo:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Erro ao criar ativo');
  }

  return data;
}

export async function updateAsset(id: string, updates: UpdateAssetData): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar ativo:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Ativo não encontrado');
  }

  return data;
}

export async function deleteAsset(id: string): Promise<void> {
  // Verificar se tem filhos primeiro
  const { data: children } = await supabase
    .from('assets')
    .select('id')
    .eq('parent_asset_id', id);

  if (children && children.length > 0) {
    throw new Error('Cannot delete asset with children. Move or delete child assets first.');
  }

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}

// Função auxiliar para obter ativos como opções de seleção
export async function getAssetsAsOptions(): Promise<Array<{value: string; label: string}>> {
  const { data, error } = await supabase
    .from('assets')
    .select('id, name, asset_type, parent_asset_id')
    .order('name');

  if (error) {
    console.error('Error fetching assets for options:', error);
    throw error;
  }

  return (data || []).map(asset => ({
    value: asset.id,
    label: `${asset.name} (${asset.asset_type})`
  }));
}

// React Query hook for asset options
export const useAssetsAsOptions = () => {
  return useQuery({
    queryKey: ['assets-options'],
    queryFn: getAssetsAsOptions,
  });
};