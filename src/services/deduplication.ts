import { supabase } from '@/integrations/supabase/client';

export interface DeduplicationRule {
  id: string;
  company_id: string;
  target_table: string;
  rule_name: string;
  unique_fields: string[]; // Array de campos que devem ser únicos
  merge_strategy: 'skip_if_exists' | 'update_existing' | 'merge_fields';
  enabled: boolean;
  priority: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleData {
  target_table: string;
  rule_name: string;
  unique_fields: string[];
  merge_strategy: 'skip_if_exists' | 'update_existing' | 'merge_fields';
  enabled?: boolean;
  priority?: number;
}

/**
 * Busca todas as regras de deduplicação da empresa
 */
export async function getDeduplicationRules(): Promise<DeduplicationRule[]> {
  try {
    const { data, error } = await supabase
      .from('deduplication_rules')
      .select('*')
      .order('target_table', { ascending: true })
      .order('priority', { ascending: true });

    if (error) throw error;
    return (data || []) as DeduplicationRule[];
  } catch (error) {
    console.error('Error fetching deduplication rules:', error);
    throw error;
  }
}

/**
 * Busca regras de deduplicação para uma tabela específica
 */
export async function getRulesForTable(tableName: string): Promise<DeduplicationRule[]> {
  try {
    const { data, error } = await supabase
      .from('deduplication_rules')
      .select('*')
      .eq('target_table', tableName)
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (error) throw error;
    return (data || []) as DeduplicationRule[];
  } catch (error) {
    console.error('Error fetching rules for table:', error);
    throw error;
  }
}

/**
 * Cria uma nova regra de deduplicação
 */
export async function createDeduplicationRule(
  ruleData: CreateRuleData
): Promise<DeduplicationRule> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('deduplication_rules')
      .insert({
        company_id: profile.company_id,
        target_table: ruleData.target_table,
        rule_name: ruleData.rule_name,
        unique_fields: ruleData.unique_fields,
        merge_strategy: ruleData.merge_strategy,
        enabled: ruleData.enabled ?? true,
        priority: ruleData.priority ?? 0,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as DeduplicationRule;
  } catch (error) {
    console.error('Error creating deduplication rule:', error);
    throw error;
  }
}

/**
 * Atualiza uma regra de deduplicação existente
 */
export async function updateDeduplicationRule(
  ruleId: string,
  updates: Partial<CreateRuleData>
): Promise<DeduplicationRule> {
  try {
    const { data, error } = await supabase
      .from('deduplication_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data as DeduplicationRule;
  } catch (error) {
    console.error('Error updating deduplication rule:', error);
    throw error;
  }
}

/**
 * Deleta uma regra de deduplicação
 */
export async function deleteDeduplicationRule(ruleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('deduplication_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting deduplication rule:', error);
    throw error;
  }
}

/**
 * Habilita ou desabilita uma regra
 */
export async function toggleRuleEnabled(
  ruleId: string,
  enabled: boolean
): Promise<DeduplicationRule> {
  return updateDeduplicationRule(ruleId, { enabled });
}

/**
 * Tabelas disponíveis para configuração de regras
 */
export const AVAILABLE_TABLES = [
  { value: 'emission_sources', label: 'Fontes de Emissão' },
  { value: 'activity_data', label: 'Dados de Atividade' },
  { value: 'waste_logs', label: 'Logs de Resíduos' },
  { value: 'licenses', label: 'Licenças' },
  { value: 'employees', label: 'Funcionários' },
  { value: 'suppliers', label: 'Fornecedores' },
  { value: 'energy_consumption', label: 'Consumo de Energia' },
  { value: 'water_consumption', label: 'Consumo de Água' },
  { value: 'safety_incidents', label: 'Incidentes de Segurança' },
  { value: 'training_programs', label: 'Programas de Treinamento' },
] as const;

/**
 * Estratégias de mesclagem disponíveis
 */
export const MERGE_STRATEGIES = [
  {
    value: 'skip_if_exists',
    label: 'Pular se existir',
    description: 'Não insere se encontrar duplicata (mantém o registro original)'
  },
  {
    value: 'update_existing',
    label: 'Atualizar existente',
    description: 'Atualiza o registro existente com os novos dados'
  },
  {
    value: 'merge_fields',
    label: 'Mesclar campos',
    description: 'Mescla campos não-nulos dos dois registros'
  }
] as const;

/**
 * Campos comuns por tabela (sugestões)
 */
export const TABLE_FIELD_SUGGESTIONS: Record<string, string[]> = {
  emission_sources: ['source_name', 'scope', 'source_type'],
  activity_data: ['emission_source_id', 'period_start_date', 'period_end_date'],
  waste_logs: ['waste_type_id', 'log_date', 'destination_id'],
  licenses: ['license_number', 'license_type'],
  employees: ['cpf', 'email', 'employee_id'],
  suppliers: ['cnpj', 'supplier_name'],
  energy_consumption: ['meter_id', 'reading_date'],
  water_consumption: ['meter_id', 'reading_date'],
  safety_incidents: ['incident_date', 'location', 'incident_type'],
  training_programs: ['program_name', 'start_date'],
};
