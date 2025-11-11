/**
 * Waste Reuse Service
 * Cálculo de Percentual de Reuso (2º nível da hierarquia de resíduos)
 * GRI 306-4: Preparation for reuse
 */

import { supabase } from "@/integrations/supabase/client";
import { calculateTotalWasteGeneration } from "./wasteManagement";

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

export interface WasteReuseResult {
  reuse_percentage: number;
  reuse_volume_tonnes: number;
  total_generated_tonnes: number;
  
  // Comparação com ano anterior
  baseline_reuse_percentage?: number;
  is_improving?: boolean;
  improvement_percent?: number;
  
  // Breakdown por tipo de reuso
  reuse_by_category: {
    packaging: number;          // Embalagens retornáveis
    pallets: number;            // Pallets reutilizados
    containers: number;         // Containers/tambores
    equipment_parts: number;    // Peças/componentes
    construction_materials: number; // Materiais de construção
    other: number;
  };
  
  // Breakdown detalhado
  breakdown: Array<{
    waste_description: string;
    quantity_tonnes: number;
    reuse_type: string;
    collection_date: string;
  }>;
  
  // Performance
  performance_classification: 'Excelente' | 'Bom' | 'Regular' | 'Baixo';
  
  calculation_date: string;
}

/**
 * Calcula percentual de reuso (2º nível da hierarquia de resíduos)
 * GRI 306-4: Preparation for reuse
 */
export async function calculateWasteReusePercentage(
  year: number
): Promise<WasteReuseResult> {
  // 1. Buscar dados totais de resíduos
  const wasteData = await calculateTotalWasteGeneration(year);
  
  // 2. Filtrar apenas resíduos com tratamento de reuso
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const { data: reuseData } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('collection_date', `${year}-01-01`)
    .lte('collection_date', `${year}-12-31`)
    .or('final_treatment_type.ilike.%reuso%,final_treatment_type.ilike.%reutiliz%');
  
  const reuseVolume = wasteData.by_treatment.reuse;
  const reusePercentage = wasteData.total_generated_tonnes > 0
    ? (reuseVolume / wasteData.total_generated_tonnes) * 100
    : 0;
  
  // 3. Classificar por tipo de material reutilizado
  const reuseByCategory = {
    packaging: 0,
    pallets: 0,
    containers: 0,
    equipment_parts: 0,
    construction_materials: 0,
    other: 0
  };
  
  const breakdown: Array<{
    waste_description: string;
    quantity_tonnes: number;
    reuse_type: string;
    collection_date: string;
  }> = [];
  
  reuseData?.forEach(waste => {
    const description = (waste.waste_description || '').toLowerCase();
    const quantity = convertToTonnes(waste.quantity || 0, waste.unit || 't');
    
    let reuseType = 'Outros';
    
    if (description.includes('embalagem') || description.includes('caixa') || description.includes('sacaria')) {
      reuseByCategory.packaging += quantity;
      reuseType = 'Embalagens Retornáveis';
    } else if (description.includes('pallet') || description.includes('palete')) {
      reuseByCategory.pallets += quantity;
      reuseType = 'Pallets Reutilizados';
    } else if (description.includes('tambor') || description.includes('container') || description.includes('ibc')) {
      reuseByCategory.containers += quantity;
      reuseType = 'Containers/Tambores';
    } else if (description.includes('peça') || description.includes('componente') || description.includes('equipamento')) {
      reuseByCategory.equipment_parts += quantity;
      reuseType = 'Peças/Componentes';
    } else if (description.includes('entulho') || description.includes('concreto') || description.includes('construção')) {
      reuseByCategory.construction_materials += quantity;
      reuseType = 'Materiais de Construção';
    } else {
      reuseByCategory.other += quantity;
    }
    
    breakdown.push({
      waste_description: waste.waste_description || 'Sem descrição',
      quantity_tonnes: quantity,
      reuse_type: reuseType,
      collection_date: waste.collection_date || ''
    });
  });
  
  // 4. Comparar com ano anterior
  let baselinePercentage: number | undefined;
  let isImproving: boolean | undefined;
  let improvementPercent: number | undefined;
  
  try {
    const previousYearData = await calculateWasteReusePercentage(year - 1);
    baselinePercentage = previousYearData.reuse_percentage;
    
    // Melhoria = AUMENTO do percentual de reuso
    isImproving = reusePercentage > baselinePercentage;
    improvementPercent = reusePercentage - baselinePercentage;
  } catch (error) {
    console.log('Dados do ano anterior não disponíveis para comparação');
  }
  
  // 5. Classificação de desempenho
  let performanceClassification: 'Excelente' | 'Bom' | 'Regular' | 'Baixo';
  
  if (reusePercentage >= 20) {
    performanceClassification = 'Excelente';
  } else if (reusePercentage >= 10) {
    performanceClassification = 'Bom';
  } else if (reusePercentage >= 5) {
    performanceClassification = 'Regular';
  } else {
    performanceClassification = 'Baixo';
  }
  
  return {
    reuse_percentage: Math.round(reusePercentage * 100) / 100,
    reuse_volume_tonnes: Math.round(reuseVolume * 1000) / 1000,
    total_generated_tonnes: Math.round(wasteData.total_generated_tonnes * 1000) / 1000,
    baseline_reuse_percentage: baselinePercentage ? Math.round(baselinePercentage * 100) / 100 : undefined,
    is_improving: isImproving,
    improvement_percent: improvementPercent ? Math.round(improvementPercent * 100) / 100 : undefined,
    reuse_by_category: reuseByCategory,
    breakdown: breakdown,
    performance_classification: performanceClassification,
    calculation_date: new Date().toISOString()
  };
}
