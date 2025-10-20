import { supabase } from "@/integrations/supabase/client";

export interface EmissionSourceGlossaryEntry {
  id?: string;
  company_id?: string;
  main_term: string;
  synonyms: string[];
  suggested_scope?: number;
  suggested_category?: string;
  is_global?: boolean;
  usage_count?: number;
}

/**
 * Buscar termos no glossário (global + da empresa)
 */
export async function searchGlossary(query: string): Promise<EmissionSourceGlossaryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('emission_source_glossary')
      .select('*')
      .or(`main_term.ilike.%${query}%,synonyms.cs.{${query}}`)
      .order('usage_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching glossary:', error);
    return [];
  }
}

/**
 * Obter sugestão de termo padrão baseado em sinônimos
 */
export async function getSuggestedTerm(userInput: string): Promise<EmissionSourceGlossaryEntry | null> {
  try {
    const { data, error } = await supabase
      .from('emission_source_glossary')
      .select('*')
      .contains('synonyms', [userInput.toLowerCase()])
      .order('is_global', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting suggested term:', error);
    return null;
  }
}

/**
 * Adicionar novo termo ao glossário da empresa
 */
export async function addCustomGlossaryTerm(
  mainTerm: string,
  synonyms: string[] = [],
  suggestedScope?: number,
  suggestedCategory?: string
): Promise<EmissionSourceGlossaryEntry | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company ID not found');

    const { data, error } = await supabase
      .from('emission_source_glossary')
      .insert({
        company_id: profile.company_id,
        main_term: mainTerm,
        synonyms,
        suggested_scope: suggestedScope,
        suggested_category: suggestedCategory,
        is_global: false,
        usage_count: 1
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding custom glossary term:', error);
    return null;
  }
}

/**
 * Incrementar contador de uso de um termo
 */
export async function incrementTermUsage(termId: string): Promise<void> {
  try {
    await supabase.rpc('increment_glossary_usage', { term_id: termId });
  } catch (error) {
    console.error('Error incrementing term usage:', error);
  }
}

/**
 * Obter categorias válidas por escopo
 */
export function getCategoriesByScope(scope: number): string[] {
  const categoriesByScope: Record<number, string[]> = {
    1: [
      "Combustão Estacionária",
      "Combustão Móvel",
      "Emissões Fugitivas",
      "Processos Industriais"
    ],
    2: [
      "Eletricidade Adquirida",
      "Vapor, Aquecimento ou Resfriamento Adquirido"
    ],
    3: [
      "Transporte de Funcionários",
      "Viagens Corporativas",
      "Resíduos Gerados",
      "Transporte e Distribuição (Upstream)",
      "Transporte e Distribuição (Downstream)",
      "Bens e Serviços Adquiridos",
      "Bens de Capital",
      "Uso de Produtos Vendidos",
      "Processamento de Produtos Vendidos",
      "Fim de Vida de Produtos Vendidos",
      "Franquias",
      "Investimentos"
    ]
  };

  return categoriesByScope[scope] || [];
}
