import { supabase } from '@/integrations/supabase/client';

export interface FieldMappingHistory {
  id: string;
  company_id: string;
  source_field_name: string;
  target_field_name: string;
  target_table: string;
  confidence_score: number;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

/**
 * Registra um mapeamento de campo bem-sucedido para aprendizado futuro
 */
export async function recordFieldMapping(
  sourceField: string,
  targetField: string,
  targetTable: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const { error } = await supabase.rpc('increment_field_mapping_usage', {
      p_company_id: profile.company_id,
      p_source_field: sourceField,
      p_target_field: targetField,
      p_target_table: targetTable
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error recording field mapping:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Obtém os mapeamentos mais usados da empresa para sugestões
 */
export async function getLearnedMappings(
  targetTable?: string,
  minUsageCount: number = 2
): Promise<FieldMappingHistory[]> {
  try {
    let query = supabase
      .from('field_mapping_history')
      .select('*')
      .gte('usage_count', minUsageCount)
      .order('usage_count', { ascending: false })
      .limit(100);

    if (targetTable) {
      query = query.eq('target_table', targetTable);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as FieldMappingHistory[];
  } catch (error) {
    console.error('Error fetching learned mappings:', error);
    return [];
  }
}

/**
 * Sugere mapeamentos baseados no histórico da empresa
 */
export async function suggestFieldMappings(
  sourceFields: string[],
  targetTable: string
): Promise<Record<string, string>> {
  try {
    const learnedMappings = await getLearnedMappings(targetTable);
    const suggestions: Record<string, string> = {};

    // Normalizar source fields para comparação
    const normalizedSourceFields = sourceFields.map(f => 
      f.toLowerCase().trim().replace(/\s+/g, '_')
    );

    // Buscar correspondências no histórico
    learnedMappings.forEach(mapping => {
      const normalizedSource = mapping.source_field_name.toLowerCase().trim();
      
      const matchIndex = normalizedSourceFields.findIndex(sf => 
        sf === normalizedSource || 
        sf.includes(normalizedSource) || 
        normalizedSource.includes(sf)
      );

      if (matchIndex !== -1) {
        suggestions[sourceFields[matchIndex]] = mapping.target_field_name;
      }
    });

    return suggestions;
  } catch (error) {
    console.error('Error suggesting field mappings:', error);
    return {};
  }
}

/**
 * Atualiza a confiança de um mapeamento quando aprovado pelo usuário
 */
export async function updateMappingConfidence(
  sourceField: string,
  targetField: string,
  targetTable: string,
  isCorrect: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Buscar o mapping existente
    const { data: existing } = await supabase
      .from('field_mapping_history')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('source_field_name', sourceField)
      .eq('target_field_name', targetField)
      .eq('target_table', targetTable)
      .single();

    if (!existing) {
      // Se não existe, criar com confiança inicial
      await supabase.from('field_mapping_history').insert({
        company_id: profile.company_id,
        source_field_name: sourceField,
        target_field_name: targetField,
        target_table: targetTable,
        confidence_score: isCorrect ? 0.8 : 0.2,
        usage_count: 1,
        created_by_user_id: session.user.id
      });
    } else {
      // Atualizar confiança existente
      const currentConfidence = existing.confidence_score;
      const adjustment = isCorrect ? 0.1 : -0.1;
      const newConfidence = Math.max(0, Math.min(1, currentConfidence + adjustment));

      await supabase
        .from('field_mapping_history')
        .update({
          confidence_score: newConfidence,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating mapping confidence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Obtém estatísticas de aprendizado da empresa
 */
export async function getMappingLearningStats(): Promise<{
  totalMappings: number;
  mostUsedMappings: FieldMappingHistory[];
  tablesCovered: string[];
  avgUsageCount: number;
}> {
  try {
    const learnedMappings = await getLearnedMappings(undefined, 1);

    const tablesCovered = [...new Set(learnedMappings.map(m => m.target_table))];
    const avgUsageCount = learnedMappings.length > 0
      ? learnedMappings.reduce((sum, m) => sum + m.usage_count, 0) / learnedMappings.length
      : 0;

    const mostUsedMappings = learnedMappings
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    return {
      totalMappings: learnedMappings.length,
      mostUsedMappings,
      tablesCovered,
      avgUsageCount: Math.round(avgUsageCount * 10) / 10
    };
  } catch (error) {
    console.error('Error getting mapping learning stats:', error);
    return {
      totalMappings: 0,
      mostUsedMappings: [],
      tablesCovered: [],
      avgUsageCount: 0
    };
  }
}
