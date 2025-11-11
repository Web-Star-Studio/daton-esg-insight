/**
 * Waste Management Service
 * Cálculo de Total de Resíduos Gerados seguindo GRI 306
 */

import { supabase } from "@/integrations/supabase/client";

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
      // Densidade aproximada 1 kg/L para líquidos
      return quantity / 1000;
    
    case 'm³':
    case 'm3':
    case 'metro cúbico':
    case 'metros cúbicos':
      // Densidade média 1 ton/m³
      return quantity * 1;
    
    default:
      console.warn(`Unidade não reconhecida: ${unit}. Assumindo toneladas.`);
      return quantity;
  }
}

export interface WasteBreakdownItem {
  waste_description: string;
  waste_class: string;
  quantity_tonnes: number;
  treatment_type: string;
  collection_date: string;
  mtr_number: string;
}

export interface WasteGenerationResult {
  total_generated_tonnes: number;
  hazardous_tonnes: number;
  non_hazardous_tonnes: number;
  
  by_treatment: {
    recycling: number;
    landfill: number;
    incineration: number;
    composting: number;
    other: number;
  };
  
  recycling_percentage: number;
  landfill_percentage: number;
  incineration_percentage: number;
  composting_percentage: number;
  
  // Comparação ano anterior
  baseline_total?: number;
  is_improving?: boolean; // Reduzindo resíduos?
  improvement_percent?: number;
  
  // Breakdown detalhado
  breakdown: WasteBreakdownItem[];
  
  calculation_date: string;
}

/**
 * Calcula total de resíduos gerados no ano (GRI 306-3)
 */
export async function calculateTotalWasteGeneration(year: number): Promise<WasteGenerationResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  // Buscar todos os resíduos do ano
  const { data: wasteData, error } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('collection_date', `${year}-01-01`)
    .lte('collection_date', `${year}-12-31`)
    .order('collection_date', { ascending: false });

  if (error) throw error;

  if (!wasteData || wasteData.length === 0) {
    return {
      total_generated_tonnes: 0,
      hazardous_tonnes: 0,
      non_hazardous_tonnes: 0,
      by_treatment: {
        recycling: 0,
        landfill: 0,
        incineration: 0,
        composting: 0,
        other: 0
      },
      recycling_percentage: 0,
      landfill_percentage: 0,
      incineration_percentage: 0,
      composting_percentage: 0,
      breakdown: [],
      calculation_date: new Date().toISOString()
    };
  }

  // Converter todas as quantidades para toneladas
  const breakdown: WasteBreakdownItem[] = wasteData.map(waste => {
    const quantityInTonnes = convertToTonnes(waste.quantity || 0, waste.unit || 't');
    
    return {
      waste_description: waste.waste_description || 'Sem descrição',
      waste_class: waste.waste_class || 'Não classificado',
      quantity_tonnes: quantityInTonnes,
      treatment_type: waste.final_treatment_type || 'Não especificado',
      collection_date: waste.collection_date || '',
      mtr_number: waste.mtr_number || ''
    };
  });

  // Calcular totais
  const total_generated_tonnes = breakdown.reduce((sum, item) => sum + item.quantity_tonnes, 0);

  // Classificar por perigosos vs não perigosos
  const hazardous_tonnes = breakdown
    .filter(item => item.waste_class.toLowerCase().includes('classe i') || 
                    item.waste_class.toLowerCase().includes('perigoso'))
    .reduce((sum, item) => sum + item.quantity_tonnes, 0);

  const non_hazardous_tonnes = total_generated_tonnes - hazardous_tonnes;

  // Classificar por tipo de tratamento
  const by_treatment = {
    recycling: 0,
    landfill: 0,
    incineration: 0,
    composting: 0,
    other: 0
  };

  breakdown.forEach(item => {
    const treatment = item.treatment_type.toLowerCase();
    const quantity = item.quantity_tonnes;

    if (treatment.includes('recicla') || treatment.includes('reuso') || treatment.includes('reutiliza')) {
      by_treatment.recycling += quantity;
    } else if (treatment.includes('aterro')) {
      by_treatment.landfill += quantity;
    } else if (treatment.includes('incinera') || treatment.includes('queima')) {
      by_treatment.incineration += quantity;
    } else if (treatment.includes('compost') || treatment.includes('orgânico')) {
      by_treatment.composting += quantity;
    } else {
      by_treatment.other += quantity;
    }
  });

  // Calcular percentuais
  const recycling_percentage = total_generated_tonnes > 0 
    ? (by_treatment.recycling / total_generated_tonnes) * 100 
    : 0;
  
  const landfill_percentage = total_generated_tonnes > 0 
    ? (by_treatment.landfill / total_generated_tonnes) * 100 
    : 0;
  
  const incineration_percentage = total_generated_tonnes > 0 
    ? (by_treatment.incineration / total_generated_tonnes) * 100 
    : 0;
  
  const composting_percentage = total_generated_tonnes > 0 
    ? (by_treatment.composting / total_generated_tonnes) * 100 
    : 0;

  // Comparar com ano anterior
  let baseline_total: number | undefined;
  let is_improving: boolean | undefined;
  let improvement_percent: number | undefined;

  try {
    const previousYearData = await calculateTotalWasteGeneration(year - 1);
    baseline_total = previousYearData.total_generated_tonnes;
    
    // Melhoria = REDUÇÃO de resíduos
    is_improving = total_generated_tonnes < baseline_total;
    improvement_percent = baseline_total > 0 
      ? ((baseline_total - total_generated_tonnes) / baseline_total) * 100 
      : 0;
  } catch (error) {
    console.log('Dados do ano anterior não disponíveis para comparação');
  }

  return {
    total_generated_tonnes: Math.round(total_generated_tonnes * 1000) / 1000,
    hazardous_tonnes: Math.round(hazardous_tonnes * 1000) / 1000,
    non_hazardous_tonnes: Math.round(non_hazardous_tonnes * 1000) / 1000,
    by_treatment: {
      recycling: Math.round(by_treatment.recycling * 1000) / 1000,
      landfill: Math.round(by_treatment.landfill * 1000) / 1000,
      incineration: Math.round(by_treatment.incineration * 1000) / 1000,
      composting: Math.round(by_treatment.composting * 1000) / 1000,
      other: Math.round(by_treatment.other * 1000) / 1000
    },
    recycling_percentage: Math.round(recycling_percentage * 100) / 100,
    landfill_percentage: Math.round(landfill_percentage * 100) / 100,
    incineration_percentage: Math.round(incineration_percentage * 100) / 100,
    composting_percentage: Math.round(composting_percentage * 100) / 100,
    baseline_total,
    is_improving,
    improvement_percent: improvement_percent ? Math.round(improvement_percent * 100) / 100 : undefined,
    breakdown,
    calculation_date: new Date().toISOString()
  };
}

/**
 * Calcula intensidade de resíduos
 */
export async function calculateWasteIntensity(year: number): Promise<{
  intensity_per_production?: number;
  intensity_per_revenue?: number;
  production_unit?: string;
}> {
  const wasteData = await calculateTotalWasteGeneration(year);
  
  // Buscar métricas operacionais
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const { data: metrics } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('year', year)
    .single();

  if (!metrics) {
    return {};
  }

  const result: any = {};

  // Intensidade por produção
  if (metrics.production_volume && metrics.production_volume > 0) {
    result.intensity_per_production = wasteData.total_generated_tonnes / metrics.production_volume;
    result.production_unit = metrics.production_unit || 'unidade';
  }

  // Intensidade por receita (remover se não houver campo revenue na tabela)
  // if (metrics.revenue && metrics.revenue > 0) {
  //   // toneladas por R$ 1.000
  //   result.intensity_per_revenue = (wasteData.total_generated_tonnes / metrics.revenue) * 1000;
  // }

  return result;
}

/**
 * Estatísticas detalhadas por classe de resíduo
 */
export async function getWasteStatsByClass(year: number): Promise<{
  by_class: Record<string, number>;
  by_description: Array<{ description: string; quantity: number }>;
}> {
  const wasteData = await calculateTotalWasteGeneration(year);

  const by_class: Record<string, number> = {};
  const by_description_map: Record<string, number> = {};

  wasteData.breakdown.forEach(item => {
    // Agrupar por classe
    const wasteClass = item.waste_class || 'Não classificado';
    by_class[wasteClass] = (by_class[wasteClass] || 0) + item.quantity_tonnes;

    // Agrupar por descrição
    const description = item.waste_description || 'Sem descrição';
    by_description_map[description] = (by_description_map[description] || 0) + item.quantity_tonnes;
  });

  // Converter para array e ordenar
  const by_description = Object.entries(by_description_map)
    .map(([description, quantity]) => ({ description, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10); // Top 10

  return {
    by_class,
    by_description
  };
}

/**
 * Interface para análise de reciclagem por material
 */
export interface RecyclingByMaterialResult {
  total_recycled_tonnes: number;
  recycling_percentage: number;
  by_material: Array<{
    material: string;
    quantity_tonnes: number;
    percentage_of_recycling: number;
    icon: string;
  }>;
  classification: {
    level: 'excellent' | 'good' | 'regular' | 'low';
    label: string;
    color: string;
  };
  zero_waste_progress: number; // % para certificação Zero Waste (70% = mínimo)
  comparison_previous_year?: {
    previous_recycling_percentage: number;
    change_percentage: number;
    is_improving: boolean;
  };
}

/**
 * Calcula reciclagem por tipo de material com classificação automática
 */
export async function calculateRecyclingByMaterial(year: number): Promise<RecyclingByMaterialResult> {
  const wasteData = await calculateTotalWasteGeneration(year);
  
  const total_recycled_tonnes = wasteData.by_treatment.recycling + wasteData.by_treatment.composting;
  const recycling_percentage = wasteData.recycling_percentage + wasteData.composting_percentage;
  
  // Classificação automática por palavras-chave
  const materialKeywords = {
    'Papel/Papelão': ['papel', 'papelão', 'cartão', 'caixa', 'embalagem papel'],
    'Plástico': ['plástico', 'pet', 'pvc', 'polietileno', 'embalagem plástica', 'filme'],
    'Metal': ['metal', 'alumínio', 'ferro', 'aço', 'lata', 'sucata'],
    'Vidro': ['vidro', 'garrafa'],
    'Orgânico': ['orgânico', 'compostável', 'alimento', 'restos', 'bagaço'],
    'Madeira': ['madeira', 'pallet', 'compensado'],
    'Eletrônico': ['eletrônico', 'eletroeletrônico', 'e-lixo', 'equipamento'],
    'Têxtil': ['têxtil', 'tecido', 'roupa', 'fibra'],
    'Outros': []
  };
  
  const materialIcons = {
    'Papel/Papelão': '📄',
    'Plástico': '♻️',
    'Metal': '🔩',
    'Vidro': '🍾',
    'Orgânico': '🌱',
    'Madeira': '🪵',
    'Eletrônico': '💻',
    'Têxtil': '👕',
    'Outros': '📦'
  };
  
  const materialQuantities: Record<string, number> = {
    'Papel/Papelão': 0,
    'Plástico': 0,
    'Metal': 0,
    'Vidro': 0,
    'Orgânico': 0,
    'Madeira': 0,
    'Eletrônico': 0,
    'Têxtil': 0,
    'Outros': 0
  };
  
  // Classificar resíduos recicláveis por material
  wasteData.breakdown.forEach(item => {
    const treatment = item.treatment_type.toLowerCase();
    const description = item.waste_description.toLowerCase();
    
    // Só considerar resíduos reciclados/compostados
    if (treatment.includes('recicla') || treatment.includes('reuso') || 
        treatment.includes('compost') || treatment.includes('orgânico')) {
      
      let classified = false;
      
      // Tentar classificar por descrição
      for (const [material, keywords] of Object.entries(materialKeywords)) {
        if (material === 'Outros') continue;
        
        for (const keyword of keywords) {
          if (description.includes(keyword)) {
            materialQuantities[material] += item.quantity_tonnes;
            classified = true;
            break;
          }
        }
        
        if (classified) break;
      }
      
      // Se não classificou, vai para "Outros"
      if (!classified) {
        materialQuantities['Outros'] += item.quantity_tonnes;
      }
    }
  });
  
  // Criar array ordenado
  const by_material = Object.entries(materialQuantities)
    .map(([material, quantity]) => ({
      material,
      quantity_tonnes: Math.round(quantity * 1000) / 1000,
      percentage_of_recycling: total_recycled_tonnes > 0 
        ? Math.round((quantity / total_recycled_tonnes) * 100 * 100) / 100 
        : 0,
      icon: materialIcons[material as keyof typeof materialIcons] || '📦'
    }))
    .filter(item => item.quantity_tonnes > 0)
    .sort((a, b) => b.quantity_tonnes - a.quantity_tonnes);
  
  // Classificação de desempenho
  let classification: RecyclingByMaterialResult['classification'];
  
  if (recycling_percentage >= 70) {
    classification = {
      level: 'excellent',
      label: 'Excelente',
      color: 'text-green-600'
    };
  } else if (recycling_percentage >= 50) {
    classification = {
      level: 'good',
      label: 'Bom',
      color: 'text-blue-600'
    };
  } else if (recycling_percentage >= 30) {
    classification = {
      level: 'regular',
      label: 'Regular',
      color: 'text-yellow-600'
    };
  } else {
    classification = {
      level: 'low',
      label: 'Baixo',
      color: 'text-red-600'
    };
  }
  
  // Progresso para Zero Waste (mínimo 70% de desvio de aterro)
  const zero_waste_progress = Math.min(100, (recycling_percentage / 70) * 100);
  
  // Comparação com ano anterior
  let comparison_previous_year;
  try {
    const previousYearData = await calculateRecyclingByMaterial(year - 1);
    const change_percentage = recycling_percentage - previousYearData.recycling_percentage;
    
    comparison_previous_year = {
      previous_recycling_percentage: Math.round(previousYearData.recycling_percentage * 100) / 100,
      change_percentage: Math.round(change_percentage * 100) / 100,
      is_improving: change_percentage > 0
    };
  } catch (error) {
    console.log('Dados do ano anterior não disponíveis para comparação de reciclagem');
  }
  
  return {
    total_recycled_tonnes: Math.round(total_recycled_tonnes * 1000) / 1000,
    recycling_percentage: Math.round(recycling_percentage * 100) / 100,
    by_material,
    classification,
    zero_waste_progress: Math.round(zero_waste_progress * 100) / 100,
    comparison_previous_year
  };
}
