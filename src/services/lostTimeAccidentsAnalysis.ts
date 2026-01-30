import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface LostTimeAccidentsByType {
  type: string;
  count: number;
  percentage: number;
  avg_days_lost: number;
}

export interface LostTimeAccidentsBySeverity {
  severity: string;
  count: number;
  percentage: number;
}

export interface LostTimeAccidentsMonthlyTrend {
  month: string;
  count: number;
  days_lost: number;
}

export interface LostTimeAccidentsComparison {
  previous_period_count: number;
  change_percentage: number;
  is_improving: boolean;
}

export interface LostTimeAccidentsTop5 {
  type: string;
  count: number;
  total_days_lost: number;
  avg_days_per_accident: number;
}

export interface LostTimeAccidentsLTIFRContribution {
  ltifr_value: number;
  worked_hours: number;
  accidents_per_million_hours: number;
}

export interface LostTimeAccidentsResult {
  // Totais
  total_accidents_with_lost_time: number;
  total_accidents: number;
  lost_time_accident_rate: number;
  
  // Breakdown por tipo
  by_incident_type: LostTimeAccidentsByType[];
  
  // Breakdown por severidade
  by_severity: LostTimeAccidentsBySeverity[];
  
  // Tendência mensal (últimos 12 meses)
  monthly_trend: LostTimeAccidentsMonthlyTrend[];
  
  // Comparação com período anterior
  comparison: LostTimeAccidentsComparison;
  
  // Top 5 tipos que mais causam afastamento
  top_5_types: LostTimeAccidentsTop5[];
  
  // Classificação de desempenho
  performance_classification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  
  // Relação com LTIFR
  ltifr_contribution: LostTimeAccidentsLTIFRContribution;
  
  calculation_date: string;
}

/**
 * Calcula métricas detalhadas sobre acidentes com afastamento (GRI 403-9)
 * 
 * @param companyId ID da empresa
 * @param startDate Data inicial do período (formato ISO)
 * @param endDate Data final do período (formato ISO)
 * @returns Métricas completas sobre acidentes com afastamento
 */
export const calculateLostTimeAccidentsMetrics = async (
  companyId: string,
  startDate: string,
  endDate: string
): Promise<LostTimeAccidentsResult> => {
  try {
    // Buscar todos os acidentes do período atual
    const { data: currentPeriodIncidents, error: currentError } = await supabase
      .from('safety_incidents')
      .select('*')
      .eq('company_id', companyId)
      .gte('incident_date', startDate)
      .lte('incident_date', endDate);

    if (currentError) throw currentError;

    const allIncidents = currentPeriodIncidents || [];
    const accidentsWithLostTime = allIncidents.filter(inc => (inc.days_lost || 0) > 0);

    // Calcular período anterior para comparação
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const periodDuration = endDateObj.getTime() - startDateObj.getTime();
    const previousStartDate = new Date(startDateObj.getTime() - periodDuration).toISOString();
    const previousEndDate = new Date(startDateObj.getTime() - 1).toISOString();

    const { data: previousPeriodIncidents } = await supabase
      .from('safety_incidents')
      .select('*')
      .eq('company_id', companyId)
      .gte('incident_date', previousStartDate)
      .lte('incident_date', previousEndDate);

    const previousAccidentsWithLostTime = (previousPeriodIncidents || []).filter(
      inc => (inc.days_lost || 0) > 0
    );

    // 1. TOTAIS E TAXA
    const totalAccidents = allIncidents.length;
    const totalAccidentsWithLostTime = accidentsWithLostTime.length;
    const lostTimeRate = totalAccidents > 0 
      ? (totalAccidentsWithLostTime / totalAccidents) * 100 
      : 0;

    // 2. BREAKDOWN POR TIPO DE INCIDENTE
    const typeBreakdown = accidentsWithLostTime.reduce((acc, inc) => {
      const type = inc.incident_type || 'Outro';
      if (!acc[type]) {
        acc[type] = { count: 0, total_days: 0 };
      }
      acc[type].count++;
      acc[type].total_days += inc.days_lost || 0;
      return acc;
    }, {} as Record<string, { count: number; total_days: number }>);

    const byIncidentType: LostTimeAccidentsByType[] = Object.entries(typeBreakdown).map(
      ([type, data]) => ({
        type,
        count: data.count,
        percentage: totalAccidentsWithLostTime > 0 
          ? (data.count / totalAccidentsWithLostTime) * 100 
          : 0,
        avg_days_lost: data.count > 0 ? data.total_days / data.count : 0,
      })
    ).sort((a, b) => b.count - a.count);

    // 3. BREAKDOWN POR SEVERIDADE
    const severityBreakdown = accidentsWithLostTime.reduce((acc, inc) => {
      const severity = inc.severity || 'N/A';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity: LostTimeAccidentsBySeverity[] = Object.entries(severityBreakdown).map(
      ([severity, count]) => ({
        severity,
        count,
        percentage: totalAccidentsWithLostTime > 0 
          ? (count / totalAccidentsWithLostTime) * 100 
          : 0,
      })
    ).sort((a, b) => b.count - a.count);

    // 4. TENDÊNCIA MENSAL (últimos 12 meses)
    const monthlyData: Record<string, { count: number; days_lost: number }> = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    accidentsWithLostTime.forEach(inc => {
      const date = new Date(inc.incident_date);
      const monthKey = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, days_lost: 0 };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].days_lost += inc.days_lost || 0;
    });

    const monthlyTrend: LostTimeAccidentsMonthlyTrend[] = Object.entries(monthlyData).map(
      ([month, data]) => ({
        month,
        count: data.count,
        days_lost: data.days_lost,
      })
    );

    // 5. COMPARAÇÃO COM PERÍODO ANTERIOR
    const previousCount = previousAccidentsWithLostTime.length;
    const changePercentage = previousCount > 0
      ? ((totalAccidentsWithLostTime - previousCount) / previousCount) * 100
      : totalAccidentsWithLostTime > 0 ? 100 : 0;
    const isImproving = totalAccidentsWithLostTime < previousCount;

    const comparison: LostTimeAccidentsComparison = {
      previous_period_count: previousCount,
      change_percentage: Math.abs(changePercentage),
      is_improving: isImproving,
    };

    // 6. TOP 5 TIPOS QUE MAIS CAUSAM AFASTAMENTO
    const top5Types: LostTimeAccidentsTop5[] = byIncidentType.slice(0, 5).map(type => ({
      type: type.type,
      count: type.count,
      total_days_lost: Math.round(type.avg_days_lost * type.count),
      avg_days_per_accident: Math.round(type.avg_days_lost * 100) / 100,
    }));

    // 7. CLASSIFICAÇÃO DE DESEMPENHO
    let performanceClassification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
    if (lostTimeRate <= 10) {
      performanceClassification = 'Excelente';
    } else if (lostTimeRate <= 25) {
      performanceClassification = 'Bom';
    } else if (lostTimeRate <= 50) {
      performanceClassification = 'Atenção';
    } else {
      performanceClassification = 'Crítico';
    }

    // 8. RELAÇÃO COM LTIFR
    const { calculateWorkedHours } = await import('./workedHoursCalculator');
    const workedHoursData = await calculateWorkedHours(companyId, startDate, endDate);
    
    const ltifr = workedHoursData.total_hours > 0
      ? (totalAccidentsWithLostTime * 1000000) / workedHoursData.total_hours
      : 0;

    const ltifrContribution: LostTimeAccidentsLTIFRContribution = {
      ltifr_value: Math.round(ltifr * 100) / 100,
      worked_hours: workedHoursData.total_hours,
      accidents_per_million_hours: Math.round(ltifr * 100) / 100,
    };

    return {
      total_accidents_with_lost_time: totalAccidentsWithLostTime,
      total_accidents: totalAccidents,
      lost_time_accident_rate: Math.round(lostTimeRate * 100) / 100,
      by_incident_type: byIncidentType,
      by_severity: bySeverity,
      monthly_trend: monthlyTrend,
      comparison,
      top_5_types: top5Types,
      performance_classification: performanceClassification,
      ltifr_contribution: ltifrContribution,
      calculation_date: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error calculating lost time accidents metrics', error, 'service');
    throw error;
  }
};
