import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  emissions: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  compliance: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  employees: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  quality: {
    value: number;
    change: number;
    changeType: 'positive' | 'negative' | 'neutral';
  };
}

const getDateRange = (timeframe: 'week' | 'month' | 'quarter' | 'year') => {
  const now = new Date();
  const startDate = new Date();
  const previousStartDate = new Date();
  
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      previousStartDate.setDate(now.getDate() - 14);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      previousStartDate.setMonth(now.getMonth() - 2);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      previousStartDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      previousStartDate.setFullYear(now.getFullYear() - 2);
      break;
  }
  
  return { 
    startDate: startDate.toISOString(), 
    endDate: now.toISOString(),
    previousStartDate: previousStartDate.toISOString(),
    previousEndDate: startDate.toISOString()
  };
};

export async function getDashboardStats(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<DashboardStats> {
  try {
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(timeframe);
    
    // Get activity data IDs for current period
    const { data: currentActivityData } = await supabase
      .from('activity_data')
      .select('id')
      .gte('period_start_date', startDate)
      .lte('period_start_date', endDate);

    const currentActivityIds = currentActivityData?.map(a => a.id) || [];

    // Get emissions for current period
    const { data: currentEmissions } = await supabase
      .from('calculated_emissions')
      .select('total_co2e')
      .in('activity_data_id', currentActivityIds);

    // Get activity data IDs for previous period
    const { data: previousActivityData } = await supabase
      .from('activity_data')
      .select('id')
      .gte('period_start_date', previousStartDate)
      .lte('period_start_date', previousEndDate);

    const previousActivityIds = previousActivityData?.map(a => a.id) || [];

    // Get emissions for previous period
    const { data: previousEmissions } = await supabase
      .from('calculated_emissions')
      .select('total_co2e')
      .in('activity_data_id', previousActivityIds);

    const currentTotal = currentEmissions?.reduce((sum, e) => sum + (Number(e.total_co2e) || 0), 0) || 0;
    const previousTotal = previousEmissions?.reduce((sum, e) => sum + (Number(e.total_co2e) || 0), 0) || 0;
    const emissionsChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    // Get compliance for current period
    const { data: currentNCs } = await supabase
      .from('non_conformities')
      .select('status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get compliance for previous period
    const { data: previousNCs } = await supabase
      .from('non_conformities')
      .select('status')
      .gte('created_at', previousStartDate)
      .lte('created_at', previousEndDate);

    const totalCurrentNCs = currentNCs?.length || 0;
    // Fixed: Use correct statuses for resolved NCs (Fechada, Aprovada, or Resolvida)
    const resolvedCurrentNCs = currentNCs?.filter(nc => 
      nc.status === 'Fechada' || nc.status === 'Aprovada' || nc.status === 'Resolvida'
    ).length || 0;
    const currentComplianceRate = totalCurrentNCs > 0 ? (resolvedCurrentNCs / totalCurrentNCs) * 100 : 100;

    const totalPreviousNCs = previousNCs?.length || 0;
    const resolvedPreviousNCs = previousNCs?.filter(nc => 
      nc.status === 'Fechada' || nc.status === 'Aprovada' || nc.status === 'Resolvida'
    ).length || 0;
    const previousComplianceRate = totalPreviousNCs > 0 ? (resolvedPreviousNCs / totalPreviousNCs) * 100 : 100;
    const complianceChange = previousComplianceRate > 0 ? currentComplianceRate - previousComplianceRate : 0;

    // Get employees for current period
    const employeesResult = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('status', 'Ativo');

    const employeesCount = employeesResult.count || 0;

    // Get employees for previous period to calculate change
    const previousEmployeesResult = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('status', 'Ativo')
      .lte('created_at', previousEndDate);

    const previousEmployeesCount = previousEmployeesResult.count || 0;
    const employeesChange = previousEmployeesCount > 0 
      ? ((employeesCount - previousEmployeesCount) / previousEmployeesCount) * 100 
      : 0;

    return {
      emissions: {
        value: currentTotal,
        change: emissionsChange,
        changeType: emissionsChange <= 0 ? 'positive' : 'negative'
      },
      compliance: {
        value: currentComplianceRate,
        change: complianceChange,
        changeType: complianceChange >= 0 ? 'positive' : 'negative'
      },
      employees: {
        value: employeesCount,
        change: employeesChange,
        changeType: employeesChange >= 0 ? 'positive' : 'negative'
      },
      quality: {
        value: currentComplianceRate, // Using compliance rate as quality indicator
        change: complianceChange,
        changeType: complianceChange >= 0 ? 'positive' : 'negative'
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    // Return zeroed values on error instead of fake data
    return {
      emissions: { value: 0, change: 0, changeType: 'neutral' },
      compliance: { value: 0, change: 0, changeType: 'neutral' },
      employees: { value: 0, change: 0, changeType: 'neutral' },
      quality: { value: 0, change: 0, changeType: 'neutral' }
    };
  }
}

export function formatEmissionValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M tCO₂e`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k tCO₂e`;
  return `${value.toFixed(1)} tCO₂e`;
}

export function formatEmployeeCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(2)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
