import { supabase } from "@/integrations/supabase/client";
import { getWasteDashboard } from "./waste";
import { getEmissionStats } from "./emissions";
import { getSafetyMetrics } from "./safetyIncidents";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ESGIndicator {
  code: string;
  name: string;
  value: number;
  unit: string;
  formula: string;
  category: '6.1' | '6.2' | '6.3' | '6.4' | '6.5' | '6.6' | '6.7';
  subcategory: string;
  trend?: number;
  target?: number;
  benchmark?: number;
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  sources: string[];
  metadata?: any;
}

export interface CategoryIndicators {
  categoryCode: string;
  categoryName: string;
  indicators: ESGIndicator[];
  completeness: number;
  lastCalculated: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCompanyId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
};

const getCurrentYear = () => new Date().getFullYear();

const convertToKwh = (quantity: number, unit: string, fuelType: string): number => {
  // Fatores de conversão IPCC/MCTI
  const conversionFactors: Record<string, number> = {
    'diesel': 10.8, // kWh/L
    'gasolina': 9.1, // kWh/L
    'etanol': 6.5, // kWh/L
    'gás natural': 10.6, // kWh/m³
    'GLP': 12.8, // kWh/kg
    'óleo combustível': 11.2, // kWh/L
    'carvão': 7.5, // kWh/kg
  };

  const factor = conversionFactors[fuelType.toLowerCase()] || 0;
  
  // Converter unidade se necessário
  let quantityInBaseUnit = quantity;
  if (unit.toLowerCase() === 'kg' && ['GLP', 'carvão'].includes(fuelType)) {
    quantityInBaseUnit = quantity;
  } else if (unit.toLowerCase() === 'l' && ['diesel', 'gasolina', 'etanol'].includes(fuelType)) {
    quantityInBaseUnit = quantity;
  } else if (unit.toLowerCase() === 'm³' && fuelType === 'gás natural') {
    quantityInBaseUnit = quantity;
  }

  return quantityInBaseUnit * factor;
};

// ============================================
// 6.1 CLIMATE & ENERGY INDICATORS
// ============================================

export const calculateClimateEnergyIndicators = async (): Promise<ESGIndicator[]> => {
  const companyId = await getCompanyId();
  const currentYear = getCurrentYear();
  const indicators: ESGIndicator[] = [];

  try {
    // a) Total Energy Consumption (kWh/year)
    const { data: electricityData } = await supabase
      .from('activity_data')
      .select(`
        quantity,
        unit,
        emission_sources!inner(category, name)
      `)
      .eq('emission_sources.category', 'Eletricidade Adquirida')
      .gte('period_start_date', `${currentYear}-01-01`)
      .lte('period_end_date', `${currentYear}-12-31`);

    const electricityKwh = electricityData?.reduce((sum, item) => {
      // Assumir que já está em kWh
      return sum + (item.quantity || 0);
    }, 0) || 0;

    // Buscar combustíveis e converter
    const { data: fuelData } = await supabase
      .from('activity_data')
      .select(`
        quantity,
        unit,
        emission_sources!inner(category, name)
      `)
      .in('emission_sources.category', ['Combustão Móvel', 'Combustão Estacionária'])
      .gte('period_start_date', `${currentYear}-01-01`)
      .lte('period_end_date', `${currentYear}-12-31`);

    let convertedFuelsKwh = 0;
    fuelData?.forEach(item => {
      const fuelType = item.emission_sources?.name || '';
      convertedFuelsKwh += convertToKwh(item.quantity, item.unit, fuelType);
    });

    const totalEnergyKwh = electricityKwh + convertedFuelsKwh;

    indicators.push({
      code: 'CLIMA_001',
      name: 'Consumo Total de Energia',
      value: Math.round(totalEnergyKwh),
      unit: 'kWh/ano',
      formula: '∑(kWh elétrico) + ∑(energia térmica convertida)',
      category: '6.1',
      subcategory: 'Energia',
      lastUpdated: new Date().toISOString(),
      dataQuality: electricityData && fuelData ? 'high' : 'medium',
      sources: ['activity_data', 'emission_sources'],
      metadata: {
        electricityKwh: Math.round(electricityKwh),
        fuelKwh: Math.round(convertedFuelsKwh),
        renewable: 0, // TODO: identificar fontes renováveis
        nonRenewable: Math.round(totalEnergyKwh)
      }
    });

    // b) Energy Intensity (kWh/unit)
    const { data: productionData } = await supabase
      .from('production_data' as any)
      .select('production_units')
      .eq('company_id', companyId)
      .gte('period_start', `${currentYear}-01-01`)
      .lte('period_end', `${currentYear}-12-31`)
      .maybeSingle();

    const productionUnits = productionData ? (productionData as any).production_units : null;

    if (productionUnits) {
      const intensity = totalEnergyKwh / productionUnits;
      indicators.push({
        code: 'CLIMA_002',
        name: 'Intensidade Energética',
        value: parseFloat(intensity.toFixed(2)),
        unit: 'kWh/unidade',
        formula: 'Consumo Total / Unidades Produzidas',
        category: '6.1',
        subcategory: 'Energia',
        lastUpdated: new Date().toISOString(),
        dataQuality: 'high',
        sources: ['activity_data', 'production_data']
      });
    } else {
      // Sem dados de produção
      indicators.push({
        code: 'CLIMA_002',
        name: 'Intensidade Energética',
        value: 0,
        unit: 'kWh/unidade',
        formula: 'Consumo Total / Unidades Produzidas',
        category: '6.1',
        subcategory: 'Energia',
        lastUpdated: new Date().toISOString(),
        dataQuality: 'low',
        sources: ['production_data'],
        metadata: { note: 'Dados de produção não disponíveis' }
      });
    }

    // c) Total GHG Emissions (tCO2e)
    const emissionStats = await getEmissionStats();
    
    indicators.push({
      code: 'CLIMA_003',
      name: 'Emissões GEE Totais',
      value: emissionStats.total,
      unit: 'tCO₂e',
      formula: '∑(Scope 1 + Scope 2 + Scope 3)',
      category: '6.1',
      subcategory: 'Emissões',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['calculated_emissions'],
      metadata: {
        scope1: emissionStats.escopo1,
        scope2: emissionStats.escopo2,
        scope3: emissionStats.escopo3,
        biogenic: 0 // TODO: buscar emissões biogênicas
      }
    });

    // d) GHG Reduction Target (%)
    const { data: goalData } = await supabase
      .from('goals')
      .select('target_value, current_value, target_year')
      .eq('company_id', companyId)
      .ilike('title', '%emiss%')
      .maybeSingle();

    if (goalData) {
      const baselineValue = (goalData as any).current_value || emissionStats.total * 1.3;
      const reductionAchieved = baselineValue 
        ? ((baselineValue - emissionStats.total) / baselineValue) * 100
        : 0;

      indicators.push({
        code: 'CLIMA_004',
        name: 'Meta de Redução GEE',
        value: parseFloat(reductionAchieved.toFixed(1)),
        unit: '%',
        formula: '(Emissões Ano Base - Emissões Atual) / Ano Base × 100',
        category: '6.1',
        subcategory: 'Metas',
        target: (goalData as any).target_value,
        lastUpdated: new Date().toISOString(),
        dataQuality: 'high',
        sources: ['goals', 'calculated_emissions'],
        metadata: {
          baselineYear: (goalData as any).target_year,
          baselineEmissions: baselineValue,
          currentEmissions: emissionStats.total,
          targetReduction: (goalData as any).target_value
        }
      });
    } else {
      indicators.push({
        code: 'CLIMA_004',
        name: 'Meta de Redução GEE',
        value: 0,
        unit: '%',
        formula: '(Emissões Ano Base - Emissões Atual) / Ano Base × 100',
        category: '6.1',
        subcategory: 'Metas',
        lastUpdated: new Date().toISOString(),
        dataQuality: 'low',
        sources: ['goals'],
        metadata: { note: 'Meta de redução não cadastrada' }
      });
    }

  } catch (error) {
    console.error('Error calculating climate indicators:', error);
  }

  return indicators;
};

// ============================================
// 6.3 WASTE INDICATORS
// ============================================

export const calculateWasteIndicators = async (): Promise<ESGIndicator[]> => {
  const indicators: ESGIndicator[] = [];

  try {
    const wasteDashboard = await getWasteDashboard();
    const companyId = await getCompanyId();
    const currentYear = getCurrentYear();

    // Buscar dados detalhados de resíduos
    const { data: wasteData } = await supabase
      .from('waste_logs')
      .select('quantity, unit, final_treatment_type')
      .gte('collection_date', `${currentYear}-01-01`)
      .lte('collection_date', `${currentYear}-12-31`);

    if (!wasteData || wasteData.length === 0) {
      return [{
        code: 'WASTE_001',
        name: 'Total de Resíduos Gerados',
        value: 0,
        unit: 't/ano',
        formula: '∑Resíduos',
        category: '6.3',
        subcategory: 'Resíduos',
        lastUpdated: new Date().toISOString(),
        dataQuality: 'low',
        sources: ['waste_logs'],
        metadata: { note: 'Sem dados de resíduos no período' }
      }];
    }

    const convertToTons = (quantity: number, unit: string): number => {
      switch (unit.toLowerCase()) {
        case 'tonelada':
        case 'ton':
          return quantity;
        case 'kg':
          return quantity / 1000;
        case 'g':
          return quantity / 1000000;
        default:
          return quantity;
      }
    };

    const totalTons = wasteData.reduce((sum, log) => 
      sum + convertToTons(log.quantity, log.unit), 0
    );

    // a) Total Generated
    indicators.push({
      code: 'WASTE_001',
      name: 'Total de Resíduos Gerados',
      value: parseFloat(totalTons.toFixed(2)),
      unit: 't/ano',
      formula: '∑Resíduos',
      category: '6.3',
      subcategory: 'Resíduos',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['waste_logs']
    });

    // b) Recycling Rate
    const recycledCount = wasteData.filter(log => 
      ['Reciclagem', 'Reaproveitamento'].includes(log.final_treatment_type || '')
    ).length;
    const recyclingRate = (recycledCount / wasteData.length) * 100;

    indicators.push({
      code: 'WASTE_002',
      name: 'Taxa de Reciclagem',
      value: parseFloat(recyclingRate.toFixed(1)),
      unit: '%',
      formula: 'Reciclados / Total × 100',
      category: '6.3',
      subcategory: 'Reciclagem',
      benchmark: 65, // Benchmark setorial (exemplo)
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['waste_logs']
    });

    // c) Reuse Rate
    const reusedCount = wasteData.filter(log => 
      log.final_treatment_type === 'Reuso'
    ).length;
    const reuseRate = (reusedCount / wasteData.length) * 100;

    indicators.push({
      code: 'WASTE_003',
      name: 'Taxa de Reuso',
      value: parseFloat(reuseRate.toFixed(1)),
      unit: '%',
      formula: 'Reutilizados / Total × 100',
      category: '6.3',
      subcategory: 'Reuso',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['waste_logs']
    });

    // d) Landfill Rate
    const landfillCount = wasteData.filter(log => 
      log.final_treatment_type === 'Aterro Sanitário'
    ).length;
    const landfillRate = (landfillCount / wasteData.length) * 100;

    indicators.push({
      code: 'WASTE_004',
      name: 'Taxa de Aterro',
      value: parseFloat(landfillRate.toFixed(1)),
      unit: '%',
      formula: 'Dispostos em Aterro / Total × 100',
      category: '6.3',
      subcategory: 'Destinação',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['waste_logs']
    });

  } catch (error) {
    console.error('Error calculating waste indicators:', error);
  }

  return indicators;
};

// ============================================
// 6.4 HEALTH & SAFETY INDICATORS
// ============================================

export const calculateHealthSafetyIndicators = async (): Promise<ESGIndicator[]> => {
  const indicators: ESGIndicator[] = [];

  try {
    const safetyMetrics = await getSafetyMetrics();
    const companyId = await getCompanyId();

    // Buscar número de funcionários para calcular horas trabalhadas
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'Ativo');

    const workedHours = (employeeCount || 0) * 220 * 8; // 220 dias úteis, 8h/dia

    // a) LTIFR (Lost Time Injury Frequency Rate)
    const { data: incidents } = await supabase
      .from('safety_incidents')
      .select('*')
      .gte('incident_date', `${getCurrentYear()}-01-01`)
      .gt('days_lost', 0);

    const accidentsWithLeave = incidents?.length || 0;
    const ltifr = workedHours > 0 ? (accidentsWithLeave * 1000000) / workedHours : 0;

    indicators.push({
      code: 'SAFETY_001',
      name: 'LTIFR',
      value: parseFloat(ltifr.toFixed(2)),
      unit: 'acidentes/milhão horas',
      formula: '(Acidentes Afastamento × 1.000.000) / Horas Trabalhadas',
      category: '6.4',
      subcategory: 'Segurança',
      benchmark: 2.5, // Benchmark setorial
      lastUpdated: new Date().toISOString(),
      dataQuality: workedHours > 0 ? 'high' : 'medium',
      sources: ['safety_incidents', 'employees'],
      metadata: {
        accidentsWithLeave,
        workedHours,
        employeeCount
      }
    });

    // b) Days Lost
    indicators.push({
      code: 'SAFETY_002',
      name: 'Dias Perdidos',
      value: safetyMetrics.daysLostTotal,
      unit: 'dias',
      formula: '∑Dias de Afastamento',
      category: '6.4',
      subcategory: 'Impacto',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['safety_incidents']
    });

    // c) Accidents with Leave
    indicators.push({
      code: 'SAFETY_003',
      name: 'Acidentes com Afastamento',
      value: accidentsWithLeave,
      unit: 'acidentes',
      formula: 'Contagem de acidentes com dias perdidos > 0',
      category: '6.4',
      subcategory: 'Acidentes',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['safety_incidents']
    });

    // d) Total Incidents
    indicators.push({
      code: 'SAFETY_004',
      name: 'Total de Incidentes',
      value: safetyMetrics.totalIncidents,
      unit: 'incidentes',
      formula: 'Contagem total de incidentes reportados',
      category: '6.4',
      subcategory: 'Incidentes',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['safety_incidents']
    });

  } catch (error) {
    console.error('Error calculating health & safety indicators:', error);
  }

  return indicators;
};

// ============================================
// MAIN FUNCTION: GET ALL INDICATORS
// ============================================

export const getAllRecommendedIndicators = async (): Promise<CategoryIndicators[]> => {
  const [climateIndicators, wasteIndicators, safetyIndicators] = await Promise.all([
    calculateClimateEnergyIndicators(),
    calculateWasteIndicators(),
    calculateHealthSafetyIndicators()
  ]);

  const categories: CategoryIndicators[] = [
    {
      categoryCode: '6.1',
      categoryName: 'Clima e Energia',
      indicators: climateIndicators,
      completeness: calculateCompleteness(climateIndicators),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.3',
      categoryName: 'Resíduos',
      indicators: wasteIndicators,
      completeness: calculateCompleteness(wasteIndicators),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.4',
      categoryName: 'Saúde e Segurança',
      indicators: safetyIndicators,
      completeness: calculateCompleteness(safetyIndicators),
      lastCalculated: new Date().toISOString()
    }
  ];

  return categories;
};

const calculateCompleteness = (indicators: ESGIndicator[]): number => {
  if (indicators.length === 0) return 0;
  const highQuality = indicators.filter(i => i.dataQuality === 'high').length;
  return (highQuality / indicators.length) * 100;
};

// ============================================
// CACHE MANAGEMENT
// ============================================

export const getCachedIndicators = async (): Promise<CategoryIndicators[] | null> => {
  const companyId = await getCompanyId();
  
  const { data } = await supabase
    .from('esg_indicator_cache' as any)
    .select('indicators, calculated_at')
    .eq('company_id', companyId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Check if cache is fresh (less than 24 hours old)
  const cacheAge = Date.now() - new Date((data as any).calculated_at).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (cacheAge > maxAge) return null;

  return (data as any).indicators as CategoryIndicators[];
};

export const saveIndicatorsToCache = async (indicators: CategoryIndicators[]): Promise<void> => {
  const companyId = await getCompanyId();
  
  // Delete old cache entries for this company (keep only today's)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await supabase
    .from('esg_indicator_cache' as any)
    .delete()
    .eq('company_id', companyId)
    .lt('calculated_at', today.toISOString());
  
  // Insert new cache entry
  await supabase
    .from('esg_indicator_cache' as any)
    .insert({
      company_id: companyId,
      calculated_at: new Date().toISOString(),
      indicators: indicators as any,
      data_quality_score: calculateOverallQuality(indicators)
    });
};

const calculateOverallQuality = (categories: CategoryIndicators[]): number => {
  const allIndicators = categories.flatMap(c => c.indicators);
  if (allIndicators.length === 0) return 0;
  
  const qualityScores = { high: 100, medium: 60, low: 20 };
  const totalScore = allIndicators.reduce((sum, ind) => 
    sum + qualityScores[ind.dataQuality], 0
  );
  
  return totalScore / allIndicators.length;
};
