/**
 * Waste Disposal Percentage Service
 * Cálculo de % Aterro/Incineração seguindo GRI 306-5
 * OBJETIVO: MINIMIZAR disposal (meta: ≤10% para Zero Waste)
 */

import { supabase } from "@/integrations/supabase/client";
import { calculateTotalWasteGeneration } from "./wasteManagement";

/**
 * Resultado detalhado de análise de disposal
 */
export interface WasteDisposalResult {
  // Percentuais (quanto MENOR, melhor)
  disposal_percentage: number;          // Aterro + Incineração (TOTAL)
  landfill_percentage: number;          // Apenas aterro
  incineration_percentage: number;      // Apenas incineração
  
  // Volumes em toneladas
  disposal_volume_tonnes: number;       // Total disposal
  landfill_volume_tonnes: number;
  incineration_volume_tonnes: number;
  total_generated_tonnes: number;
  
  // Comparação com ano anterior
  baseline_disposal_percentage?: number;
  is_improving?: boolean;                // TRUE se REDUZIR disposal
  improvement_percent?: number;
  
  // Breakdown por tipo de resíduo (Top 10 em disposal)
  disposal_by_waste_type: Array<{
    waste_description: string;
    waste_class: string;
    landfill_tonnes: number;
    incineration_tonnes: number;
    total_disposal_tonnes: number;
    percentage_of_total_disposal: number;
  }>;
  
  // Breakdown por perigosidade
  disposal_breakdown: {
    hazardous_disposal_tonnes: number;
    non_hazardous_disposal_tonnes: number;
    hazardous_percentage: number;
  };
  
  // Compliance com Zero Waste
  zero_waste_compliance: {
    current_disposal_rate: number;
    zero_waste_target: number;          // 10% máximo
    gap_to_target: number;
    is_compliant: boolean;
  };
  
  // Classificação de desempenho
  performance_classification: 'Zero Waste' | 'Excelente' | 'Bom' | 'Regular' | 'Crítico';
  
  // Impactos ambientais estimados
  environmental_impact: {
    landfill_co2_emissions_kg: number;   // ~500 kg CO2e/ton aterro
    incineration_co2_emissions_kg: number; // ~700 kg CO2e/ton incineração
    total_disposal_emissions_kg: number;
  };
  
  // Custos estimados (valores médios Brasil 2025)
  disposal_cost_estimate: {
    landfill_cost_brl: number;          // ~R$200/ton
    incineration_cost_brl: number;      // ~R$600/ton
    total_disposal_cost_brl: number;
  };
  
  calculation_date: string;
}

/**
 * Calcula percentual de disposição final (aterro + incineração)
 * IMPORTANTE: Quanto MENOR, melhor (indicador inverso)
 */
export async function calculateWasteDisposalPercentage(year: number): Promise<WasteDisposalResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  // Buscar dados de geração total de resíduos
  const wasteData = await calculateTotalWasteGeneration(year);
  
  const landfill_volume_tonnes = wasteData.by_treatment.landfill;
  const incineration_volume_tonnes = wasteData.by_treatment.incineration;
  const disposal_volume_tonnes = landfill_volume_tonnes + incineration_volume_tonnes;
  const total_generated_tonnes = wasteData.total_generated_tonnes;

  // Calcular percentuais
  const landfill_percentage = total_generated_tonnes > 0 
    ? (landfill_volume_tonnes / total_generated_tonnes) * 100 
    : 0;
  
  const incineration_percentage = total_generated_tonnes > 0 
    ? (incineration_volume_tonnes / total_generated_tonnes) * 100 
    : 0;
  
  const disposal_percentage = landfill_percentage + incineration_percentage;

  // Buscar logs de resíduos para breakdown detalhado
  const { data: wasteLogsData, error } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('collection_date', `${year}-01-01`)
    .lte('collection_date', `${year}-12-31`)
    .order('quantity', { ascending: false });

  if (error) throw error;

  // Filtrar apenas resíduos que vão para aterro ou incineração
  const disposalLogs = wasteLogsData?.filter(log => {
    const treatment = (log.final_treatment_type || '').toLowerCase();
    return treatment.includes('aterro') || treatment.includes('incinera') || treatment.includes('queima');
  }) || [];

  // Criar breakdown por tipo de resíduo
  const disposalByTypeMap: Record<string, any> = {};
  
  disposalLogs.forEach(log => {
    const description = log.waste_description || 'Sem descrição';
    const treatment = (log.final_treatment_type || '').toLowerCase();
    const quantity = convertToTonnes(log.quantity || 0, log.unit || 't');
    
    if (!disposalByTypeMap[description]) {
      disposalByTypeMap[description] = {
        waste_description: description,
        waste_class: log.waste_class || 'Não classificado',
        landfill_tonnes: 0,
        incineration_tonnes: 0,
        total_disposal_tonnes: 0,
        percentage_of_total_disposal: 0
      };
    }
    
    if (treatment.includes('aterro')) {
      disposalByTypeMap[description].landfill_tonnes += quantity;
    } else if (treatment.includes('incinera') || treatment.includes('queima')) {
      disposalByTypeMap[description].incineration_tonnes += quantity;
    }
    
    disposalByTypeMap[description].total_disposal_tonnes += quantity;
  });

  // Converter para array e calcular percentuais
  const disposal_by_waste_type = Object.values(disposalByTypeMap)
    .map((item: any) => ({
      ...item,
      landfill_tonnes: Math.round(item.landfill_tonnes * 1000) / 1000,
      incineration_tonnes: Math.round(item.incineration_tonnes * 1000) / 1000,
      total_disposal_tonnes: Math.round(item.total_disposal_tonnes * 1000) / 1000,
      percentage_of_total_disposal: disposal_volume_tonnes > 0 
        ? Math.round((item.total_disposal_tonnes / disposal_volume_tonnes) * 100 * 100) / 100 
        : 0
    }))
    .sort((a, b) => b.total_disposal_tonnes - a.total_disposal_tonnes)
    .slice(0, 10); // Top 10

  // Breakdown por perigosidade
  const hazardous_disposal_tonnes = disposal_by_waste_type
    .filter(item => item.waste_class.toLowerCase().includes('classe i') || 
                    item.waste_class.toLowerCase().includes('perigoso'))
    .reduce((sum, item) => sum + item.total_disposal_tonnes, 0);
  
  const non_hazardous_disposal_tonnes = disposal_volume_tonnes - hazardous_disposal_tonnes;
  
  const hazardous_percentage = disposal_volume_tonnes > 0 
    ? (hazardous_disposal_tonnes / disposal_volume_tonnes) * 100 
    : 0;

  // Zero Waste Compliance
  const ZERO_WASTE_TARGET = 10; // 10% máximo para certificação
  const gap_to_target = disposal_percentage - ZERO_WASTE_TARGET;
  const is_compliant = disposal_percentage <= ZERO_WASTE_TARGET;

  // Classificação de performance (quanto MENOR disposal, melhor)
  let performance_classification: WasteDisposalResult['performance_classification'];
  
  if (disposal_percentage <= 10) {
    performance_classification = 'Zero Waste';        // 🏆 Elite
  } else if (disposal_percentage <= 25) {
    performance_classification = 'Excelente';         // 🟢 Classe mundial
  } else if (disposal_percentage <= 40) {
    performance_classification = 'Bom';               // 🟡 Acima da média
  } else if (disposal_percentage <= 60) {
    performance_classification = 'Regular';           // 🟠 Necessita melhoria
  } else {
    performance_classification = 'Crítico';           // 🔴 Urgente
  }

  // Impacto ambiental (emissões de CO2)
  const LANDFILL_EMISSION_FACTOR = 500;      // kg CO2e/ton
  const INCINERATION_EMISSION_FACTOR = 700;  // kg CO2e/ton
  
  const landfill_co2_emissions_kg = landfill_volume_tonnes * LANDFILL_EMISSION_FACTOR;
  const incineration_co2_emissions_kg = incineration_volume_tonnes * INCINERATION_EMISSION_FACTOR;
  const total_disposal_emissions_kg = landfill_co2_emissions_kg + incineration_co2_emissions_kg;

  // Custos estimados (valores médios Brasil 2025)
  const LANDFILL_COST_PER_TON = 200;         // R$/ton
  const INCINERATION_COST_PER_TON = 600;     // R$/ton
  
  const landfill_cost_brl = landfill_volume_tonnes * LANDFILL_COST_PER_TON;
  const incineration_cost_brl = incineration_volume_tonnes * INCINERATION_COST_PER_TON;
  const total_disposal_cost_brl = landfill_cost_brl + incineration_cost_brl;

  // Comparação com ano anterior
  let baseline_disposal_percentage: number | undefined;
  let is_improving: boolean | undefined;
  let improvement_percent: number | undefined;

  try {
    const previousYearData = await calculateWasteDisposalPercentage(year - 1);
    baseline_disposal_percentage = previousYearData.disposal_percentage;
    
    // Melhoria = REDUÇÃO de disposal (indicador inverso)
    is_improving = disposal_percentage < baseline_disposal_percentage;
    improvement_percent = baseline_disposal_percentage > 0 
      ? ((baseline_disposal_percentage - disposal_percentage) / baseline_disposal_percentage) * 100 
      : 0;
  } catch (error) {
    console.warn('Dados do ano anterior não disponíveis para comparação de disposal');
  }

  return {
    disposal_percentage: Math.round(disposal_percentage * 100) / 100,
    landfill_percentage: Math.round(landfill_percentage * 100) / 100,
    incineration_percentage: Math.round(incineration_percentage * 100) / 100,
    disposal_volume_tonnes: Math.round(disposal_volume_tonnes * 1000) / 1000,
    landfill_volume_tonnes: Math.round(landfill_volume_tonnes * 1000) / 1000,
    incineration_volume_tonnes: Math.round(incineration_volume_tonnes * 1000) / 1000,
    total_generated_tonnes: Math.round(total_generated_tonnes * 1000) / 1000,
    baseline_disposal_percentage,
    is_improving,
    improvement_percent: improvement_percent ? Math.round(improvement_percent * 100) / 100 : undefined,
    disposal_by_waste_type,
    disposal_breakdown: {
      hazardous_disposal_tonnes: Math.round(hazardous_disposal_tonnes * 1000) / 1000,
      non_hazardous_disposal_tonnes: Math.round(non_hazardous_disposal_tonnes * 1000) / 1000,
      hazardous_percentage: Math.round(hazardous_percentage * 100) / 100
    },
    zero_waste_compliance: {
      current_disposal_rate: Math.round(disposal_percentage * 100) / 100,
      zero_waste_target: ZERO_WASTE_TARGET,
      gap_to_target: Math.round(gap_to_target * 100) / 100,
      is_compliant
    },
    performance_classification,
    environmental_impact: {
      landfill_co2_emissions_kg: Math.round(landfill_co2_emissions_kg * 100) / 100,
      incineration_co2_emissions_kg: Math.round(incineration_co2_emissions_kg * 100) / 100,
      total_disposal_emissions_kg: Math.round(total_disposal_emissions_kg * 100) / 100
    },
    disposal_cost_estimate: {
      landfill_cost_brl: Math.round(landfill_cost_brl * 100) / 100,
      incineration_cost_brl: Math.round(incineration_cost_brl * 100) / 100,
      total_disposal_cost_brl: Math.round(total_disposal_cost_brl * 100) / 100
    },
    calculation_date: new Date().toISOString()
  };
}

/**
 * Converte diferentes unidades para toneladas
 */
function convertToTonnes(quantity: number, unit: string): number {
  const unitLower = unit.toLowerCase().trim();
  
  switch (unitLower) {
    case 'kg':
    case 'quilograma':
    case 'quilogramas':
      return quantity / 1000;
    
    case 'ton':
    case 't':
    case 'tonelada':
    case 'toneladas':
      return quantity;
    
    case 'l':
    case 'litro':
    case 'litros':
      return quantity / 1000;
    
    case 'm³':
    case 'm3':
    case 'metro cúbico':
    case 'metros cúbicos':
      return quantity * 1;
    
    default:
      console.warn(`Unidade não reconhecida: ${unit}. Assumindo toneladas.`);
      return quantity;
  }
}
