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
  // Fatores de conversão IPCC/MCTI expandidos
  const conversionFactors: Record<string, number> = {
    // Combustíveis Líquidos
    'diesel': 10.8, // kWh/L
    'diesel b': 10.8, // kWh/L
    'diesel s10': 10.8, // kWh/L
    'diesel s500': 10.8, // kWh/L
    'gasolina': 9.1, // kWh/L
    'gasolina comum': 9.1, // kWh/L
    'gasolina premium': 9.1, // kWh/L
    'etanol': 6.5, // kWh/L
    'etanol hidratado': 6.5, // kWh/L
    'etanol anidro': 6.5, // kWh/L
    'biodiesel': 10.0, // kWh/L
    'óleo combustível': 11.2, // kWh/L
    'querosene': 10.2, // kWh/L
    'querosene de aviação': 10.3, // kWh/L
    
    // Combustíveis Gasosos
    'gás natural': 10.6, // kWh/m³
    'gás natural veicular': 10.6, // kWh/m³
    'gnv': 10.6, // kWh/m³
    'glp': 12.8, // kWh/kg
    'gás liquefeito de petróleo': 12.8, // kWh/kg
    'biogás': 6.5, // kWh/m³
    
    // Combustíveis Sólidos
    'carvão': 7.5, // kWh/kg
    'carvão mineral': 7.5, // kWh/kg
    'carvão vegetal': 8.1, // kWh/kg
    'lenha': 4.4, // kWh/kg
    'biomassa': 4.5, // kWh/kg
    'pellet': 5.0, // kWh/kg
    'bagaço de cana': 4.2, // kWh/kg
    
    // Energia Térmica (já em kWh)
    'vapor': 1.0, // kWh/kWh (sem conversão)
    'calor': 1.0, // kWh/kWh (sem conversão)
    'energia térmica': 1.0, // kWh/kWh (sem conversão)
  };

  const factor = conversionFactors[fuelType.toLowerCase()] || 0;
  
  // Converter unidade se necessário
  let quantityInBaseUnit = quantity;
  const unitLower = unit.toLowerCase();
  
  // Normalizar unidades
  if (['kg', 'quilograma', 'quilogramas'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['l', 'litro', 'litros'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['m³', 'm3', 'metro cúbico', 'metros cúbicos'].includes(unitLower)) {
    quantityInBaseUnit = quantity;
  } else if (['t', 'tonelada', 'toneladas'].includes(unitLower)) {
    quantityInBaseUnit = quantity * 1000; // converter para kg
  } else if (['kwh', 'mwh', 'gwh'].includes(unitLower)) {
    // Já está em kWh ou múltiplos
    if (unitLower === 'mwh') quantityInBaseUnit = quantity * 1000;
    if (unitLower === 'gwh') quantityInBaseUnit = quantity * 1000000;
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

    // ✅ USAR FUNÇÃO CENTRALIZADA DE HORAS TRABALHADAS
    const { calculateWorkedHours } = await import('./workedHoursCalculator');
    
    const workedHoursData = await calculateWorkedHours(
      companyId,
      `${getCurrentYear()}-01-01`,
      `${getCurrentYear()}-12-31`
    );

    // a) LTIFR (Lost Time Injury Frequency Rate)
    const { data: incidents } = await supabase
      .from('safety_incidents')
      .select('*')
      .gte('incident_date', `${getCurrentYear()}-01-01`)
      .gt('days_lost', 0);

    const accidentsWithLeave = incidents?.length || 0;
    const ltifr = workedHoursData.total_hours > 0 
      ? (accidentsWithLeave * 1000000) / workedHoursData.total_hours 
      : 0;

    indicators.push({
      code: 'SAFETY_001',
      name: 'LTIFR',
      value: parseFloat(ltifr.toFixed(2)),
      unit: 'acidentes/milhão horas',
      formula: '(Acidentes Afastamento × 1.000.000) / Horas Trabalhadas',
      category: '6.4',
      subcategory: 'Segurança',
      benchmark: 2.5,
      lastUpdated: new Date().toISOString(),
      dataQuality: workedHoursData.data_quality, // ✅ USAR DATA QUALITY DA FUNÇÃO
      sources: ['safety_incidents', 'attendance_records'],
      metadata: {
        accidentsWithLeave,
        workedHours: workedHoursData.total_hours,
        calculationMethod: workedHoursData.calculation_method,
        confidenceLevel: workedHoursData.metadata.confidence_level
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
// 6.2 WATER INDICATORS
// ============================================

async function calculateWaterIndicators(companyId: string): Promise<ESGIndicator[]> {
  const indicators: ESGIndicator[] = [];
  const currentYear = new Date().getFullYear();
  
  const { data: waterData } = await supabase
    .from('water_consumption_data' as any)
    .select('*')
    .eq('company_id', companyId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_end', `${currentYear}-12-31`) as any;
  
  if (!waterData) return indicators;
  
  const totalConsumption = waterData.reduce((sum: number, log: any) => {
    const quantity = typeof log.quantity === 'number' ? log.quantity : parseFloat(log.quantity || '0');
    return sum + quantity;
  }, 0);
  
  indicators.push({
    code: 'AGUA_001',
    name: 'Consumo Total de Água',
    value: totalConsumption,
    unit: 'm³/ano',
    formula: '∑(Água de todas as fontes)',
    category: '6.2',
    subcategory: 'Gestão Hídrica',
    lastUpdated: new Date().toISOString(),
    dataQuality: waterData.length > 0 ? 'high' : 'low',
    sources: ['water_consumption_data'],
    metadata: {
      totalRecords: waterData.length,
      griReference: 'GRI 303-3'
    }
  });
  
  const { data: productionData } = await supabase
    .from('production_data' as any)
    .select('production_units')
    .eq('company_id', companyId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_end', `${currentYear}-12-31`)
    .maybeSingle() as any;
  
  const productionUnits = productionData ? (productionData as any).production_units : null;
  
  if (productionUnits && productionUnits > 0) {
    const intensity = totalConsumption / productionUnits;
    indicators.push({
      code: 'AGUA_002',
      name: 'Intensidade Hídrica',
      value: parseFloat(intensity.toFixed(3)),
      unit: 'm³/unidade',
      formula: 'Consumo Total / Unidades Produzidas',
      category: '6.2',
      subcategory: 'Eficiência Hídrica',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['water_consumption_data', 'production_data'],
      metadata: { productionUnits, griReference: 'GRI 303-1' }
    });
  }
  
  return indicators;
}

// ============================================
// 6.5 HUMAN CAPITAL INDICATORS
// ============================================

async function calculateHumanCapitalIndicators(companyId: string): Promise<ESGIndicator[]> {
  const indicators: ESGIndicator[] = [];
  
  const { data: trainings } = await supabase
    .from('training_programs')
    .select('duration_hours, status')
    .eq('company_id', companyId)
    .eq('status', 'Concluído') as any;
  
  const { count: employeeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'Ativo');
  
  const totalTrainingHours = trainings?.reduce((sum: number, t: any) => 
    sum + (t.duration_hours || 0), 0) || 0;
  
  const avgTrainingHours = employeeCount ? totalTrainingHours / employeeCount : 0;
  
  indicators.push({
    code: 'CAPITAL_001',
    name: 'Horas de Treinamento Médias',
    value: parseFloat(avgTrainingHours.toFixed(1)),
    unit: 'h/funcionário/ano',
    formula: 'Total de Horas / Número de Colaboradores',
    category: '6.5',
    subcategory: 'Desenvolvimento Profissional',
    lastUpdated: new Date().toISOString(),
    dataQuality: trainings && trainings.length > 0 ? 'high' : 'medium',
    sources: ['training_programs', 'employees'],
    benchmark: 40,
    metadata: {
      totalTrainingHours,
      employeeCount,
      griReference: 'GRI 404-1'
    }
  });
  
  return indicators;
}

// ============================================
// 6.6 GOVERNANCE INDICATORS
// ============================================

async function calculateGovernanceIndicators(companyId: string): Promise<ESGIndicator[]> {
  const indicators: ESGIndicator[] = [];
  const currentYear = new Date().getFullYear();
  
  const { data: complaints, count: totalComplaints } = await supabase
    .from('complaints' as any)
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .gte('created_at', `${currentYear}-01-01`) as any;
  
  indicators.push({
    code: 'GOV_001',
    name: 'Denúncias Recebidas',
    value: totalComplaints || 0,
    unit: 'denúncias',
    formula: '∑(Denúncias no período)',
    category: '6.6',
    subcategory: 'Canal de Ética',
    lastUpdated: new Date().toISOString(),
    dataQuality: complaints ? 'high' : 'medium',
    sources: ['complaints'],
    metadata: { period: `${currentYear}`, griReference: 'GRI 2-26' }
  });
  
  if (complaints && complaints.length > 0) {
    const resolvedCount = complaints.filter((c: any) => 
      c.status === 'Resolvida' || c.status === 'Fechada'
    ).length;
    
    const resolutionRate = (resolvedCount / complaints.length) * 100;
    
    indicators.push({
      code: 'GOV_002',
      name: 'Taxa de Resolução de Denúncias',
      value: parseFloat(resolutionRate.toFixed(1)),
      unit: '%',
      formula: '(Resolvidas / Recebidas) × 100',
      category: '6.6',
      subcategory: 'Gestão de Ética',
      lastUpdated: new Date().toISOString(),
      dataQuality: 'high',
      sources: ['complaints'],
      benchmark: 90,
      metadata: {
        totalComplaints: complaints.length,
        resolvedCount,
        griReference: 'GRI 2-26'
      }
    });
  }
  
  return indicators;
}

// ============================================
// 6.7 ECONOMIC INDICATORS
// ============================================

async function calculateEconomicIndicators(companyId: string): Promise<ESGIndicator[]> {
  const indicators: ESGIndicator[] = [];
  const currentYear = new Date().getFullYear();
  
  const { data: investments } = await supabase
    .from('esg_investments' as any)
    .select('amount, currency')
    .eq('company_id', companyId)
    .gte('period', `${currentYear}-01-01`)
    .lte('period', `${currentYear}-12-31`) as any;
  
  const totalInvestments = investments?.reduce((sum: number, inv: any) => {
    const amount = typeof inv.amount === 'number' ? inv.amount : parseFloat(inv.amount || '0');
    return sum + amount;
  }, 0) || 0;
  
  const investmentsInMillions = totalInvestments / 1000000;
  
  indicators.push({
    code: 'ECON_001',
    name: 'Investimentos em Sustentabilidade',
    value: parseFloat(investmentsInMillions.toFixed(2)),
    unit: 'R$ milhões',
    formula: '∑(Projetos ESG)',
    category: '6.7',
    subcategory: 'Investimentos ESG',
    lastUpdated: new Date().toISOString(),
    dataQuality: investments && investments.length > 0 ? 'high' : 'medium',
    sources: ['esg_investments'],
    metadata: {
      projectCount: investments?.length || 0,
      griReference: 'GRI 201-1'
    }
  });
  
  return indicators;
}

// ============================================
// MAIN FUNCTION: GET ALL INDICATORS
// ============================================

export const getAllRecommendedIndicators = async (): Promise<CategoryIndicators[]> => {
  const companyId = await getCompanyId();
  
  console.warn('🔄 Calculating all ESG indicators...');
  
  const [climateEnergy, water, waste, health, humanCapital, governance, economic] = await Promise.all([
    calculateClimateEnergyIndicators(),
    calculateWaterIndicators(companyId),
    calculateWasteIndicators(),
    calculateHealthSafetyIndicators(),
    calculateHumanCapitalIndicators(companyId),
    calculateGovernanceIndicators(companyId),
    calculateEconomicIndicators(companyId)
  ]);

  return [
    {
      categoryCode: '6.1',
      categoryName: 'Clima e Energia',
      indicators: climateEnergy,
      completeness: calculateCompleteness(climateEnergy),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.2',
      categoryName: 'Água',
      indicators: water,
      completeness: calculateCompleteness(water),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.3',
      categoryName: 'Resíduos',
      indicators: waste,
      completeness: calculateCompleteness(waste),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.4',
      categoryName: 'Saúde e Segurança',
      indicators: health,
      completeness: calculateCompleteness(health),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.5',
      categoryName: 'Capital Humano',
      indicators: humanCapital,
      completeness: calculateCompleteness(humanCapital),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.6',
      categoryName: 'Governança e Ética',
      indicators: governance,
      completeness: calculateCompleteness(governance),
      lastCalculated: new Date().toISOString()
    },
    {
      categoryCode: '6.7',
      categoryName: 'Desempenho Econômico',
      indicators: economic,
      completeness: calculateCompleteness(economic),
      lastCalculated: new Date().toISOString()
    }
  ];
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
