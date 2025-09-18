import { supabase } from "@/integrations/supabase/client";
import { 
  getGRIIndicatorData, 
  createOrUpdateGRIIndicatorData,
  calculateReportCompletion 
} from "./griReports";

export interface AutoFillResult {
  indicatorId: string;
  indicatorCode: string;
  originalValue: any;
  suggestedValue: any;
  confidence: string;
  dataSource: string;
  unit?: string;
  breakdown?: any;
  success: boolean;
  skipped?: boolean;
  error?: string;
}

export interface AutoFillSummary {
  totalIndicators: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: AutoFillResult[];
}

/**
 * Obter sugestão inteligente para um indicador específico
 */
export const getIndicatorSuggestion = async (
  companyId: string, 
  indicatorCode: string
): Promise<any> => {
  const { data, error } = await supabase.rpc('get_indicator_suggested_value', {
    p_company_id: companyId,
    p_indicator_code: indicatorCode
  });

  if (error) {
    console.error('Erro ao obter sugestão:', error);
    throw error;
  }

  return data;
};

/**
 * Auto preencher um indicador específico
 */
export const autoFillIndicator = async (
  reportId: string,
  indicatorData: any,
  companyId: string
): Promise<AutoFillResult> => {
  const result: AutoFillResult = {
    indicatorId: indicatorData.indicator_id,
    indicatorCode: indicatorData.indicator?.code || 'N/A',
    originalValue: indicatorData.numeric_value || indicatorData.text_value || indicatorData.percentage_value,
    suggestedValue: null,
    confidence: 'low',
    dataSource: 'unknown',
    success: false
  };

  try {
    // Pular se já estiver completo
    if (indicatorData.is_complete) {
      result.skipped = true;
      result.success = true;
      return result;
    }

    // Obter sugestão
    const suggestion = await getIndicatorSuggestion(companyId, indicatorData.indicator?.code);
    
    if (!suggestion || Object.keys(suggestion).length === 0) {
      result.error = 'Nenhuma sugestão disponível';
      return result;
    }

    result.suggestedValue = suggestion.suggested_value;
    result.confidence = suggestion.confidence || 'low';
    result.dataSource = suggestion.data_source || 'unknown';
    result.unit = suggestion.unit;
    result.breakdown = suggestion.breakdown;

    // Determinar o tipo de dados e preparar update
    const updateData: any = { is_complete: true };
    const dataType = indicatorData.indicator?.data_type || 'Texto';

    switch (dataType) {
      case 'Numérico':
        if (typeof suggestion.suggested_value === 'number') {
          updateData.numeric_value = suggestion.suggested_value;
        } else {
          result.error = 'Valor sugerido não é numérico';
          return result;
        }
        break;
      case 'Percentual':
        if (typeof suggestion.suggested_value === 'number') {
          updateData.percentage_value = suggestion.suggested_value;
        } else {
          result.error = 'Valor sugerido não é percentual';
          return result;
        }
        break;
      case 'Texto':
        updateData.text_value = String(suggestion.suggested_value);
        break;
      case 'Booleano':
        updateData.boolean_value = Boolean(suggestion.suggested_value);
        break;
      case 'Data':
        if (suggestion.suggested_value instanceof Date || typeof suggestion.suggested_value === 'string') {
          updateData.date_value = suggestion.suggested_value;
        } else {
          result.error = 'Valor sugerido não é uma data válida';
          return result;
        }
        break;
      default:
        updateData.text_value = String(suggestion.suggested_value);
    }

    // Salvar no banco
    await createOrUpdateGRIIndicatorData(reportId, indicatorData.indicator_id, updateData);
    
    result.success = true;
    return result;

  } catch (error: any) {
    console.error('Erro ao auto preencher indicador:', error);
    result.error = error.message || 'Erro desconhecido';
    return result;
  }
};

/**
 * Auto preencher múltiplos indicadores
 */
export const autoFillMultipleIndicators = async (
  reportId: string,
  companyId: string,
  indicatorIds?: string[],
  onProgress?: (progress: number, current: string) => void
): Promise<AutoFillSummary> => {
  const summary: AutoFillSummary = {
    totalIndicators: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: []
  };

  try {
    // Obter indicadores do relatório
    const indicators = await getGRIIndicatorData(reportId);
    
    // Filtrar por IDs específicos se fornecidos
    const targetIndicators = indicatorIds 
      ? indicators.filter(ind => indicatorIds.includes(ind.indicator_id))
      : indicators;

    summary.totalIndicators = targetIndicators.length;

    // Processar cada indicador
    for (let i = 0; i < targetIndicators.length; i++) {
      const indicator = targetIndicators[i];
      
      // Atualizar progresso
      if (onProgress) {
        const progress = Math.round(((i + 1) / targetIndicators.length) * 100);
        onProgress(progress, indicator.indicator?.code || 'N/A');
      }

      // Auto preencher indicador
      const result = await autoFillIndicator(reportId, indicator, companyId);
      summary.results.push(result);
      summary.processed++;

      if (result.success) {
        if (result.skipped) {
          summary.skipped++;
        } else {
          summary.successful++;
        }
      } else {
        summary.failed++;
      }

      // Pequena pausa para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Recalcular completion do relatório
    await calculateReportCompletion(reportId);

    return summary;

  } catch (error: any) {
    console.error('Erro no auto preenchimento múltiplo:', error);
    throw error;
  }
};

/**
 * Auto preencher apenas indicadores obrigatórios
 */
export const autoFillMandatoryIndicators = async (
  reportId: string,
  companyId: string,
  onProgress?: (progress: number, current: string) => void
): Promise<AutoFillSummary> => {
  try {
    const indicators = await getGRIIndicatorData(reportId);
    const mandatoryIndicators = indicators.filter(ind => ind.indicator?.is_mandatory);
    const mandatoryIds = mandatoryIndicators.map(ind => ind.indicator_id);
    
    return await autoFillMultipleIndicators(reportId, companyId, mandatoryIds, onProgress);
  } catch (error) {
    console.error('Erro ao auto preencher indicadores obrigatórios:', error);
    throw error;
  }
};

/**
 * Auto preencher indicadores por categoria
 */
export const autoFillByCategory = async (
  reportId: string,
  companyId: string,
  category: string,
  onProgress?: (progress: number, current: string) => void
): Promise<AutoFillSummary> => {
  try {
    const indicators = await getGRIIndicatorData(reportId);
    const categoryIndicators = indicators.filter(ind => 
      ind.indicator?.indicator_type === category
    );
    const categoryIds = categoryIndicators.map(ind => ind.indicator_id);
    
    return await autoFillMultipleIndicators(reportId, companyId, categoryIds, onProgress);
  } catch (error) {
    console.error(`Erro ao auto preencher indicadores da categoria ${category}:`, error);
    throw error;
  }
};

/**
 * Obter estatísticas de completude do relatório
 */
export const getReportCompletenessStats = async (reportId: string) => {
  try {
    const indicators = await getGRIIndicatorData(reportId);
    
    const stats = {
      total: indicators.length,
      completed: indicators.filter(ind => ind.is_complete).length,
      inProgress: indicators.filter(ind => !ind.is_complete && (
        ind.numeric_value || ind.text_value || ind.percentage_value || ind.boolean_value || ind.date_value
      )).length,
      notStarted: 0,
      mandatory: {
        total: indicators.filter(ind => ind.indicator?.is_mandatory).length,
        completed: indicators.filter(ind => ind.indicator?.is_mandatory && ind.is_complete).length
      },
      byCategory: {} as Record<string, { total: number; completed: number }>
    };

    stats.notStarted = stats.total - stats.completed - stats.inProgress;

    // Estatísticas por categoria
    indicators.forEach(ind => {
      const category = ind.indicator?.indicator_type || 'Outros';
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { total: 0, completed: 0 };
      }
      stats.byCategory[category].total++;
      if (ind.is_complete) {
        stats.byCategory[category].completed++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Erro ao obter estatísticas de completude:', error);
    throw error;
  }
};