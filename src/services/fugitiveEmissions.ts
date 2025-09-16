import { supabase } from '@/integrations/supabase/client';

// GHG Protocol Brasil 2025.0.1 - Refrigerant data
export interface RefrigerantFactor {
  id?: string;
  chemical_name: string;
  chemical_formula: string | null;
  refrigerant_code: string;
  gwp_ar4: number | null;
  gwp_ar5: number | null;
  gwp_ar6: number;
  is_kyoto_gas: boolean;
  category: string;
  source: string;
  // Additional properties for calculation
  molecular_weight?: number;
  boiling_point?: number;
  critical_temperature?: number;
  application_type?: string;
  ozone_depletion_potential?: number;
}

// Refrigerants from GHG Protocol Brasil 2025.0.1
export const REFRIGERANT_FACTORS: Omit<RefrigerantFactor, 'id'>[] = [
  // CFCs (Ozone Depleting)
  {
    chemical_name: 'CFC-11',
    chemical_formula: 'CCl3F',
    refrigerant_code: 'R-11',
    gwp_ar4: 4750,
    gwp_ar5: 4660,
    gwp_ar6: 4660,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 137.4,
    boiling_point: 23.8,
    critical_temperature: 198.0,
    application_type: 'Refrigerante/Espuma',
    ozone_depletion_potential: 1.0
  },
  {
    chemical_name: 'CFC-12',
    chemical_formula: 'CCl2F2',
    refrigerant_code: 'R-12',
    gwp_ar4: 10900,
    gwp_ar5: 10200,
    gwp_ar6: 10200,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 120.9,
    boiling_point: -29.8,
    critical_temperature: 112.0,
    application_type: 'Refrigerante',
    ozone_depletion_potential: 1.0
  },
  // HCFCs (Ozone Depleting)
  {
    chemical_name: 'HCFC-22',
    chemical_formula: 'CHClF2',
    refrigerant_code: 'R-22',
    gwp_ar4: 1810,
    gwp_ar5: 1760,
    gwp_ar6: 1760,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 86.5,
    boiling_point: -40.8,
    critical_temperature: 96.1,
    application_type: 'Refrigerante/Ar Condicionado',
    ozone_depletion_potential: 0.055
  },
  {
    chemical_name: 'HCFC-141b',
    chemical_formula: 'CH3CCl2F',
    refrigerant_code: 'R-141b',
    gwp_ar4: 725,
    gwp_ar5: 782,
    gwp_ar6: 782,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 116.9,
    boiling_point: 32.1,
    critical_temperature: 204.2,
    application_type: 'Espuma/Solvente',
    ozone_depletion_potential: 0.11
  },
  // HFCs (Não destrói ozônio)
  {
    chemical_name: 'HFC-134a',
    chemical_formula: 'CH2FCF3',
    refrigerant_code: 'R-134a',
    gwp_ar4: 1430,
    gwp_ar5: 1300,
    gwp_ar6: 1300,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 102.0,
    boiling_point: -26.1,
    critical_temperature: 101.1,
    application_type: 'Refrigerante/Ar Condicionado Automotivo',
    ozone_depletion_potential: 0
  },
  {
    chemical_name: 'HFC-410A',
    chemical_formula: 'R-32/R-125 (50/50)',
    refrigerant_code: 'R-410A',
    gwp_ar4: 2088,
    gwp_ar5: 1924,
    gwp_ar6: 1924,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 72.6,
    boiling_point: -48.5,
    critical_temperature: 70.2,
    application_type: 'Ar Condicionado Residencial/Comercial',
    ozone_depletion_potential: 0
  },
  {
    chemical_name: 'HFC-32',
    chemical_formula: 'CH2F2',
    refrigerant_code: 'R-32',
    gwp_ar4: 675,
    gwp_ar5: 677,
    gwp_ar6: 677,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 52.0,
    boiling_point: -51.7,
    critical_temperature: 78.1,
    application_type: 'Ar Condicionado/Mistura de Refrigerantes',
    ozone_depletion_potential: 0
  },
  {
    chemical_name: 'HFC-125',
    chemical_formula: 'CHF2CF3',
    refrigerant_code: 'R-125',
    gwp_ar4: 3500,
    gwp_ar5: 3170,
    gwp_ar6: 3170,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 120.0,
    boiling_point: -48.1,
    critical_temperature: 66.0,
    application_type: 'Componente de Misturas/Extintor',
    ozone_depletion_potential: 0
  },
  // Natural Refrigerants
  {
    chemical_name: 'Amônia',
    chemical_formula: 'NH3',
    refrigerant_code: 'R-717',
    gwp_ar4: 0,
    gwp_ar5: 0,
    gwp_ar6: 0,
    is_kyoto_gas: false,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 17.0,
    boiling_point: -33.3,
    critical_temperature: 132.3,
    application_type: 'Refrigeração Industrial',
    ozone_depletion_potential: 0
  },
  {
    chemical_name: 'Dióxido de Carbono',
    chemical_formula: 'CO2',
    refrigerant_code: 'R-744',
    gwp_ar4: 1,
    gwp_ar5: 1,
    gwp_ar6: 1,
    is_kyoto_gas: true,
    category: 'Emissões Fugitivas',
    source: 'GHG Protocol Brasil 2025.0.1',
    molecular_weight: 44.0,
    boiling_point: -78.5, // Sublimation point
    critical_temperature: 31.0,
    application_type: 'Refrigeração/Ar Condicionado',
    ozone_depletion_potential: 0
  }
];

// Equipment emission factors (kg refrigerant per equipment per year)
export const EQUIPMENT_EMISSION_FACTORS = {
  'ar_condicionado_janela': { factor: 0.05, unit: 'kg/equip/ano' },
  'ar_condicionado_split': { factor: 0.08, unit: 'kg/equip/ano' },
  'ar_condicionado_central': { factor: 0.15, unit: 'kg/equip/ano' },
  'refrigerador_domestico': { factor: 0.01, unit: 'kg/equip/ano' },
  'freezer': { factor: 0.02, unit: 'kg/equip/ano' },
  'camara_fria': { factor: 0.25, unit: 'kg/equip/ano' },
  'chiller': { factor: 2.5, unit: 'kg/equip/ano' },
  'equipamento_transporte': { factor: 0.5, unit: 'kg/equip/ano' },
} as const;

// Get refrigerant by name with fuzzy matching
export function getRefrigerantByName(name: string): Omit<RefrigerantFactor, 'id'> | undefined {
  // Exact match first
  let refrigerant = REFRIGERANT_FACTORS.find(r => r.chemical_name === name);
  if (refrigerant) return refrigerant;
  
  // Case insensitive match
  refrigerant = REFRIGERANT_FACTORS.find(r => r.chemical_name.toLowerCase() === name.toLowerCase());
  if (refrigerant) return refrigerant;
  
  // Partial match
  refrigerant = REFRIGERANT_FACTORS.find(r => 
    r.chemical_name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(r.chemical_name.toLowerCase()) ||
    r.refrigerant_code.toLowerCase().includes(name.toLowerCase()) ||
    (r.chemical_formula && r.chemical_formula.toLowerCase().includes(name.toLowerCase()))
  );
  
  return refrigerant;
}

// Calculate fugitive emissions according to GHG Protocol Brasil
export function calculateFugitiveEmissions(
  refrigerantName: string,
  calculationMethod: 'balance_mass' | 'screening' | 'emission_factor',
  data: {
    eun?: number; // Equipamentos Novos (kg)
    eue?: number; // Equipamentos Existentes (kg)  
    eud?: number; // Equipamentos Dispensados (kg)
    capacity?: number; // Capacidade de refrigeração
    capacityUnit?: string;
    equipmentCount?: number;
    equipmentType?: string;
    customEmissionFactor?: number;
  }
): {
  total_co2e: number;
  raw_refrigerant_kg: number;
  gwp_used: number;
  calculation_details: any;
} {
  const refrigerant = getRefrigerantByName(refrigerantName);
  if (!refrigerant) {
    throw new Error(`Refrigerante "${refrigerantName}" não encontrado na base de dados GHG Protocol Brasil 2025.0.1`);
  }

  let calculation_details: any = {
    refrigerant_used: refrigerant.chemical_name,
    chemical_formula: refrigerant.chemical_formula,
    calculation_method: calculationMethod,
    gwp_ar4: refrigerant.gwp_ar4,
    ozone_depletion_potential: refrigerant.ozone_depletion_potential,
  };

  let rawRefrigerantKg = 0;

  switch (calculationMethod) {
    case 'balance_mass':
      // E = (EUN + EUE + EUD) × GWP
      if (!data.eun || !data.eue || !data.eud) {
        throw new Error('Dados de EUN, EUE e EUD são obrigatórios para o método de balanço de massa');
      }
      
      rawRefrigerantKg = data.eun + data.eue + data.eud;
      calculation_details = {
        ...calculation_details,
        eun_kg: data.eun,
        eue_kg: data.eue,
        eud_kg: data.eud,
        total_refrigerant_kg: rawRefrigerantKg,
        formula: '(EUN + EUE + EUD) × GWP'
      };
      break;

    case 'screening':
      // Capacity-based calculation
      if (!data.capacity || !data.capacityUnit) {
        throw new Error('Capacidade e unidade são obrigatórios para o método de triagem');
      }
      
      // Convert capacity to standard unit (kW) if needed
      let capacityKw = data.capacity;
      if (data.capacityUnit === 'TR') {
        capacityKw = data.capacity * 3.517; // 1 TR = 3.517 kW
      } else if (data.capacityUnit === 'BTU/h') {
        capacityKw = data.capacity * 0.000293; // 1 BTU/h = 0.000293 kW
      }
      
      // Typical emission factor: 0.02 kg/kW/year for screening method
      const screeningFactor = 0.02;
      rawRefrigerantKg = capacityKw * screeningFactor;
      
      calculation_details = {
        ...calculation_details,
        capacity_original: data.capacity,
        capacity_unit: data.capacityUnit,
        capacity_kw: capacityKw,
        screening_factor: screeningFactor,
        formula: 'Capacidade (kW) × Fator de Triagem × GWP'
      };
      break;

    case 'emission_factor':
      // Equipment count × emission factor
      if (!data.equipmentCount || !data.customEmissionFactor) {
        throw new Error('Quantidade de equipamentos e fator de emissão são obrigatórios');
      }
      
      rawRefrigerantKg = data.equipmentCount * data.customEmissionFactor;
      
      calculation_details = {
        ...calculation_details,
        equipment_count: data.equipmentCount,
        emission_factor: data.customEmissionFactor,
        equipment_type: data.equipmentType,
        formula: 'Nº Equipamentos × Fator de Emissão × GWP'
      };
      break;

    default:
      throw new Error(`Método de cálculo "${calculationMethod}" não suportado`);
  }

  // Calculate CO2e using GWP AR4 (GHG Protocol standard)
  const gwpValue = refrigerant.gwp_ar4 || refrigerant.gwp_ar6;
  const total_co2e = rawRefrigerantKg * gwpValue / 1000; // Convert to tCO2e

  calculation_details.raw_refrigerant_kg = rawRefrigerantKg;
  calculation_details.total_co2e = total_co2e;

  return {
    total_co2e: Math.round(total_co2e * 1000) / 1000, // Round to 3 decimal places
    raw_refrigerant_kg: Math.round(rawRefrigerantKg * 1000) / 1000,
    gwp_used: gwpValue,
    calculation_details
  };
}

// Import refrigerant factors into database
export async function importRefrigerantFactors(): Promise<{success: number; errors: string[]}> {
  const errors: string[] = [];
  let success = 0;

  try {
    for (const refrigerant of REFRIGERANT_FACTORS) {
      const { error } = await supabase
        .from('refrigerant_factors')
        .upsert({
          chemical_name: refrigerant.chemical_name,
          chemical_formula: refrigerant.chemical_formula,
          refrigerant_code: refrigerant.refrigerant_code,
          gwp_ar4: refrigerant.gwp_ar4,
          gwp_ar5: refrigerant.gwp_ar5,
          gwp_ar6: refrigerant.gwp_ar6,
          is_kyoto_gas: refrigerant.is_kyoto_gas,
          category: refrigerant.category,
          source: refrigerant.source
        }, {
          onConflict: 'refrigerant_code,source'
        });

      if (error) {
        errors.push(`Erro ao importar ${refrigerant.chemical_name}: ${error.message}`);
      } else {
        success++;
      }
    }
  } catch (error: any) {
    errors.push(`Erro geral na importação: ${error.message}`);
  }

  return { success, errors };
}

// Get default emission factor for equipment type
export function getEmissionFactorForEquipment(equipmentType: string): { factor: number; unit: string } | undefined {
  return EQUIPMENT_EMISSION_FACTORS[equipmentType as keyof typeof EQUIPMENT_EMISSION_FACTORS];
}

// Validate refrigerant for application
export function validateRefrigerantForApplication(refrigerantName: string, applicationType: string): boolean {
  const refrigerant = getRefrigerantByName(refrigerantName);
  if (!refrigerant || !refrigerant.application_type) return false;
  
  return refrigerant.application_type.toLowerCase().includes(applicationType.toLowerCase()) ||
         applicationType.toLowerCase().includes('todos') ||
         applicationType.toLowerCase().includes('geral');
}

// Get refrigerants by application type
export function getRefrigerantsByApplication(applicationType: string): Omit<RefrigerantFactor, 'id'>[] {
  return REFRIGERANT_FACTORS.filter(r => 
    (r.application_type && r.application_type.toLowerCase().includes(applicationType.toLowerCase())) ||
    applicationType.toLowerCase().includes('todos')
  );
}