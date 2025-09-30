import { useState, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useSmartCache } from '@/hooks/useSmartCache';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { supabase } from '@/integrations/supabase/client';

// Fetch real emissions data from Supabase
const getEmissionsData = async (dateRange?: DateRange) => {
  let query = supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      calculation_date,
      activity_data (
        period_start_date,
        period_end_date,
        emission_sources (
          scope,
          category,
          name
        )
      )
    `)
    .order('calculation_date', { ascending: true });

  if (dateRange?.from) {
    query = query.gte('calculation_date', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    query = query.lte('calculation_date', dateRange.to.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching emissions:', error);
    throw error;
  }

  return data || [];
};

export function useDashboardGHG() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 11, 31),
  });

  const dateRangeKey = dateRange ? `${dateRange.from?.toISOString()}-${dateRange.to?.toISOString()}` : 'no-range';

  const { data: emissionsData, isLoading, cacheInfo } = useSmartCache({
    queryKey: ['emissions-data', dateRangeKey],
    queryFn: () => getEmissionsData(dateRange),
    priority: 'high',
    preloadRelated: [['emission-factors'], ['activity-data']],
    backgroundRefetch: true,
  });

  const { refresh, isRefreshing, lastRefresh } = useAutoRefresh({
    queryKeys: [['emissions-data', dateRangeKey]],
    interval: 60000,
    enableRealtime: true,
    realtimeTable: 'calculated_emissions',
  });

  useRealTimeData([
    {
      table: 'calculated_emissions',
      queryKey: ['emissions-data', dateRangeKey],
      events: ['INSERT', 'UPDATE'],
      debounceMs: 1000,
    },
    {
      table: 'activity_data',
      queryKey: ['emissions-data', dateRangeKey],
      events: ['INSERT', 'UPDATE', 'DELETE'],
      debounceMs: 1000,
    }
  ]);

  const { monthlyData, escopoData, fontesEscopo1Data, totals } = useMemo(() => {
    if (!emissionsData || emissionsData.length === 0) {
      return {
        monthlyData: [],
        escopoData: [],
        fontesEscopo1Data: [],
        totals: { total: 0, escopo1: 0, escopo2: 0, escopo3: 0 }
      };
    }

    const monthlyTotals: Record<string, { escopo1: number; escopo2: number; escopo3: number }> = {};
    const scopeTotals = { escopo1: 0, escopo2: 0, escopo3: 0 };
    const categoryTotals: Record<string, number> = {};

    emissionsData.forEach(emission => {
      const scope = emission.activity_data?.emission_sources?.scope;
      const category = emission.activity_data?.emission_sources?.category || 'Outros';
      const co2e = emission.total_co2e || 0;
      const date = new Date(emission.calculation_date);
      const monthKey = format(date, 'MMM');

      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { escopo1: 0, escopo2: 0, escopo3: 0 };
      }

      if (scope === 1) {
        monthlyTotals[monthKey].escopo1 += co2e;
        scopeTotals.escopo1 += co2e;
        categoryTotals[category] = (categoryTotals[category] || 0) + co2e;
      } else if (scope === 2) {
        monthlyTotals[monthKey].escopo2 += co2e;
        scopeTotals.escopo2 += co2e;
      } else if (scope === 3) {
        monthlyTotals[monthKey].escopo3 += co2e;
        scopeTotals.escopo3 += co2e;
      }
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const processedMonthlyData = months.map(mes => ({
      mes,
      escopo1: Math.round((monthlyTotals[mes]?.escopo1 || 0) * 100) / 100,
      escopo2: Math.round((monthlyTotals[mes]?.escopo2 || 0) * 100) / 100,
      escopo3: Math.round((monthlyTotals[mes]?.escopo3 || 0) * 100) / 100,
    }));

    const totalEmissions = scopeTotals.escopo1 + scopeTotals.escopo2 + scopeTotals.escopo3;
    const processedEscopoData = [
      { 
        name: "Escopo 1", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo1 / totalEmissions) * 1000) / 10 : 0, 
        color: "#1e40af" 
      },
      { 
        name: "Escopo 2", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo2 / totalEmissions) * 1000) / 10 : 0, 
        color: "#3b82f6" 
      },
      { 
        name: "Escopo 3", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo3 / totalEmissions) * 1000) / 10 : 0, 
        color: "#93c5fd" 
      },
    ].filter(item => item.value > 0);

    const totalScope1 = scopeTotals.escopo1;
    const processedFontesData = Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: category,
        value: totalScope1 > 0 ? Math.round((value / totalScope1) * 1000) / 10 : 0,
        color: "#" + Math.floor(Math.random()*16777215).toString(16)
      }))
      .filter(item => item.value > 0);

    return {
      monthlyData: processedMonthlyData,
      escopoData: processedEscopoData,
      fontesEscopo1Data: processedFontesData,
      totals: {
        total: Math.round(totalEmissions * 100) / 100,
        escopo1: Math.round(scopeTotals.escopo1 * 100) / 100,
        escopo2: Math.round(scopeTotals.escopo2 * 100) / 100,
        escopo3: Math.round(scopeTotals.escopo3 * 100) / 100,
      }
    };
  }, [emissionsData]);

  return {
    dateRange,
    setDateRange,
    emissionsData,
    isLoading,
    cacheInfo,
    refresh,
    isRefreshing,
    monthlyData,
    escopoData,
    fontesEscopo1Data,
    totals,
  };
}
