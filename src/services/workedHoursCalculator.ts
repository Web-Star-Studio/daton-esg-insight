import { supabase } from "@/integrations/supabase/client";

export interface WorkedHoursResult {
  total_hours: number;
  calculation_method: 'real_data' | 'estimated_by_employees' | 'estimated_default';
  data_quality: 'high' | 'medium' | 'low';
  period_start: string;
  period_end: string;
  employee_count?: number;
  records_count?: number;
  metadata: {
    source: string;
    confidence_level: number; // 0-100
    notes?: string;
  };
}

/**
 * Calcula total de horas trabalhadas com fallback inteligente
 * 
 * Hierarquia de precisão:
 * 1. Dados reais de attendance_records (melhor) - confidence 95%
 * 2. Estimativa por número de funcionários - confidence 70%
 * 3. Estimativa padrão (200.000 horas/ano) - confidence 50%
 * 
 * @param companyId - ID da empresa
 * @param startDate - Data inicial (formato: YYYY-MM-DD)
 * @param endDate - Data final (formato: YYYY-MM-DD)
 */
export async function calculateWorkedHours(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<WorkedHoursResult> {
  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);

  // TENTATIVA 1: Buscar dados reais de attendance_records
  try {
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('total_hours')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!attendanceError && attendanceRecords && attendanceRecords.length > 0) {
      const totalHours = attendanceRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
      
      if (totalHours > 0) {
        return {
          total_hours: totalHours,
          calculation_method: 'real_data',
          data_quality: 'high',
          period_start: startDate,
          period_end: endDate,
          records_count: attendanceRecords.length,
          metadata: {
            source: 'attendance_records',
            confidence_level: 95,
            notes: `Dados reais de ${attendanceRecords.length} registros de ponto`
          }
        };
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar attendance_records:', error);
  }

  // TENTATIVA 2: Estimar por número de funcionários ativos
  try {
    const { count: employeeCount, error: employeeError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'Ativo');

    if (!employeeError && employeeCount && employeeCount > 0) {
      const workingDays = calculateWorkingDays(periodStart, periodEnd);
      const estimatedHours = employeeCount * workingDays * 8; // 8h/dia
      
      return {
        total_hours: estimatedHours,
        calculation_method: 'estimated_by_employees',
        data_quality: 'medium',
        period_start: startDate,
        period_end: endDate,
        employee_count: employeeCount,
        metadata: {
          source: 'employees',
          confidence_level: 70,
          notes: `Estimativa: ${employeeCount} funcionários × ${workingDays} dias úteis × 8h`
        }
      };
    }
  } catch (error) {
    console.warn('Erro ao buscar employees:', error);
  }

  // TENTATIVA 3: Usar estimativa padrão OIT (último recurso)
  const daysInPeriod = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const yearFraction = daysInPeriod / 365;
  const defaultAnnualHours = 200000; // Padrão OIT
  const estimatedHours = defaultAnnualHours * yearFraction;

  return {
    total_hours: estimatedHours,
    calculation_method: 'estimated_default',
    data_quality: 'low',
    period_start: startDate,
    period_end: endDate,
    metadata: {
      source: 'default_estimate',
      confidence_level: 50,
      notes: `Estimativa padrão OIT: ${defaultAnnualHours.toLocaleString()} horas/ano × ${yearFraction.toFixed(2)} anos`
    }
  };
}

/**
 * Calcula número de dias úteis aproximados entre duas datas
 * Aproximação: 60% dos dias são úteis (220 dias úteis / 365 dias = 0.603)
 */
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(days * 0.6);
}
