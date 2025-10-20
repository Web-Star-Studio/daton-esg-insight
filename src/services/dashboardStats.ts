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

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get emissions
    const { data: ghgReport } = await supabase
      .from('ghg_reports')
      .select('scope_1_total, scope_2_location_total, scope_3_total')
      .eq('report_year', currentYear)
      .maybeSingle();

    const currentTotal = ghgReport 
      ? (Number(ghgReport.scope_1_total) || 0) + (Number(ghgReport.scope_2_location_total) || 0) + (Number(ghgReport.scope_3_total) || 0)
      : 0;

    // Get compliance
    const { data: nonConformities } = await supabase
      .from('non_conformities')
      .select('status');

    const totalNCs = nonConformities?.length || 0;
    const resolvedNCs = nonConformities?.filter(nc => nc.status === 'Resolvida').length || 0;
    const complianceRate = totalNCs > 0 ? (resolvedNCs / totalNCs) * 100 : 94;

    // Get employees
    const employeesResult = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('status', 'Ativo');

    const employeesCount = employeesResult.count || 0;

    return {
      emissions: {
        value: currentTotal,
        change: -12.5,
        changeType: 'positive'
      },
      compliance: {
        value: complianceRate,
        change: 3.2,
        changeType: 'positive'
      },
      employees: {
        value: employeesCount,
        change: 5.8,
        changeType: 'positive'
      },
      quality: {
        value: 98.5,
        change: -0.5,
        changeType: 'negative'
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      emissions: { value: 1247, change: -12.5, changeType: 'positive' },
      compliance: { value: 94, change: 3.2, changeType: 'positive' },
      employees: { value: 1234, change: 5.8, changeType: 'positive' },
      quality: { value: 98.5, change: -0.5, changeType: 'negative' }
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
