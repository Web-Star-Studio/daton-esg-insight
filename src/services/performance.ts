import { supabase } from "@/integrations/supabase/client";

export interface AnalysisConfig {
  metric_key: string;
  time_range: { start: string; end: string };
  granularity: 'monthly' | 'quarterly' | 'yearly';
  comparison_dimension?: 'asset' | 'waste_class' | 'scope';
  filter_ids?: string[];
}

export interface ChartDataset {
  id: string;
  label: string;
  data: number[];
  color: string;
}

export interface AnalysisResponse {
  query_details: {
    metric_key: string;
    metric_label: string;
    time_range: { start: string; end: string };
    granularity: string;
    comparison_dimension?: string;
  };
  chart_data: {
    labels: string[];
    datasets: ChartDataset[];
    summary_stats: {
      total: number;
      average: number;
      count: number;
      max: number;
      min: number;
    };
  };
}

export const METRICS_OPTIONS = [
  { value: 'TOTAL_GHG_EMISSIONS', label: 'Emissões Totais (tCO₂e)' },
  { value: 'SCOPE_1_EMISSIONS', label: 'Emissões Escopo 1 (tCO₂e)' },
  { value: 'SCOPE_2_EMISSIONS', label: 'Emissões Escopo 2 (tCO₂e)' },
  { value: 'SCOPE_3_EMISSIONS', label: 'Emissões Escopo 3 (tCO₂e)' },
  { value: 'WASTE_GENERATION', label: 'Geração de Resíduos (t)' },
  { value: 'LICENSE_COMPLIANCE', label: 'Taxa de Conformidade (%)' },
];

export const COMPARISON_DIMENSIONS = [
  { value: 'asset', label: 'Ativos' },
  { value: 'scope', label: 'Escopos GEE' },
  { value: 'waste_class', label: 'Classe de Resíduo' },
];

export const GRANULARITY_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export async function executePerformanceAnalysis(config: AnalysisConfig): Promise<AnalysisResponse> {
  const { data, error } = await supabase.functions.invoke('performance-analysis', {
    body: config
  });

  if (error) {
    console.error('Erro na análise de desempenho:', error);
    throw new Error(`Erro na análise: ${error.message}`);
  }

  return data;
}

export async function getAssetsForComparison() {
  const { data, error } = await supabase
    .from('assets')
    .select('id, name, asset_type, location')
    .eq('asset_type', 'Unidade Industrial')
    .order('name');

  if (error) {
    console.error('Erro ao carregar ativos:', error);
    throw error;
  }

  return data || [];
}

export async function getWasteClassesForComparison() {
  const { data, error } = await supabase
    .from('waste_logs')
    .select('waste_class')
    .not('waste_class', 'is', null)
    .order('waste_class');

  if (error) {
    console.error('Erro ao carregar classes de resíduo:', error);
    return [];
  }

  // Filtrar string "null" e valores vazios APÓS a query
  const validClasses = data
    ?.map(item => item.waste_class)
    .filter(wc => wc && wc.toLowerCase() !== 'null' && wc.trim() !== '');
  
  const uniqueClasses = [...new Set(validClasses)];
  
  return uniqueClasses.map(waste_class => ({
    id: waste_class,
    name: waste_class,
    label: waste_class
  }));
}