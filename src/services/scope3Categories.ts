import { supabase } from "@/integrations/supabase/client";

// Definições das categorias completas de Escopo 3 segundo GHG Protocol
export const SCOPE_3_CATEGORIES = {
  1: "Bens e Serviços Adquiridos",
  2: "Bens de Capital", 
  3: "Atividades Relacionadas a Combustíveis e Energia (não incluídas no Escopo 1 ou 2)",
  4: "Transporte e Distribuição Upstream",
  5: "Resíduos Gerados nas Operações",
  6: "Viagens de Negócios",
  7: "Deslocamento de Funcionários",
  8: "Ativos Arrendados Upstream",
  9: "Transporte e Distribuição Downstream", 
  10: "Processamento de Produtos Vendidos",
  11: "Uso de Produtos Vendidos",
  12: "Tratamento de Fim de Vida de Produtos Vendidos",
  13: "Ativos Arrendados Downstream",
  14: "Franquias",
  15: "Investimentos"
};

export interface TransportDistributionData {
  direction: 'upstream' | 'downstream';
  transport_mode: string;
  distance_km?: number;
  weight_tonnes?: number;
  fuel_type?: string;
  fuel_consumption?: number;
  emission_source_id?: string;
}

export interface LandUseChangeData {
  area_hectares: number;
  previous_use: string;
  current_use: string;
  vegetation_type?: string;
  carbon_stock_before?: number;
  carbon_stock_after?: number;
  change_year: number;
  location_state?: string;
  climate_zone?: string;
}

export interface WastewaterTreatmentData {
  treatment_type: string;
  organic_load_bod?: number;
  nitrogen_content?: number;
  volume_treated: number;
  temperature?: number;
  sludge_removed?: boolean;
  methane_recovered?: boolean;
  discharge_pathway?: string;
}

// Função para obter categorias de Escopo 3 implementadas
export async function getImplementedScope3Categories() {
  const { data, error } = await supabase
    .from('emission_sources')
    .select('category, subcategory, scope_3_category_number')
    .eq('scope', 3)
    .not('scope_3_category_number', 'is', null);

  if (error) throw error;
  return data;
}

// Função para criar transporte e distribuição
export async function createTransportDistribution(data: TransportDistributionData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data: result, error } = await supabase
    .from('transport_distribution')
    .insert({
      ...data,
      company_id: profile.company_id
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Função para criar mudança no uso do solo
export async function createLandUseChange(data: LandUseChangeData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  // Calcular emissões usando metodologia IPCC Tier 1
  const co2_emissions = calculateLandUseEmissions(data);

  const { data: result, error } = await supabase
    .from('land_use_change')
    .insert({
      ...data,
      company_id: profile.company_id,
      co2_emissions
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Função para criar tratamento de efluentes
export async function createWastewaterTreatment(data: WastewaterTreatmentData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  // Calcular emissões CH4 e N2O usando metodologia IPCC 2019
  const emissions = calculateWastewaterEmissions(data);

  const { data: result, error } = await supabase
    .from('wastewater_treatment')
    .insert({
      ...data,
      company_id: profile.company_id,
      ch4_emissions: emissions.ch4,
      n2o_emissions: emissions.n2o
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Cálculo de emissões de mudança no uso do solo (metodologia IPCC)
function calculateLandUseEmissions(data: LandUseChangeData): number {
  // Fatores de carbono por tipo de uso (tC/ha) - valores médios brasileiros
  const carbonFactors: Record<string, number> = {
    'floresta_primaria': 150,
    'floresta_secundaria': 100,
    'pastagem': 35,
    'agricultura_anual': 25,
    'agricultura_perene': 45,
    'urbano': 10,
    'agua': 0
  };

  const carbonBefore = data.carbon_stock_before ?? carbonFactors[data.previous_use] ?? 50;
  const carbonAfter = data.carbon_stock_after ?? carbonFactors[data.current_use] ?? 25;
  
  // Fator de conversão: C para CO2 = 44/12 = 3.67
  const co2ConversionFactor = 3.67;
  
  // Emissões = (C_final - C_inicial) × área × fator_conversão
  const emissionsTCO2 = (carbonAfter - carbonBefore) * data.area_hectares * co2ConversionFactor;
  
  return emissionsTCO2 * 1000; // converter para kg CO2
}

// Cálculo de emissões de tratamento de efluentes (metodologia IPCC 2019)
function calculateWastewaterEmissions(data: WastewaterTreatmentData) {
  // Fatores de emissão por tipo de tratamento (kg CH4/kg DBO)
  const ch4Factors: Record<string, number> = {
    'anaerobico': 0.25,
    'aerobico': 0.0,
    'lodo_ativado': 0.0,
    'lagoa_anaerobica': 0.25,
    'lagoa_facultativa': 0.1,
    'reator_uasb': 0.2,
    'fossa_septica': 0.5
  };

  // Fatores de emissão N2O (kg N2O/kg N) 
  const n2oFactor = 0.005; // IPCC 2019 default

  const ch4Factor = ch4Factors[data.treatment_type] ?? 0.1;
  const organicLoad = data.organic_load_bod ?? 0;
  const nitrogenContent = data.nitrogen_content ?? 0;

  // Correção por recuperação de metano
  const methaneRecoveryFactor = data.methane_recovered ? 0.8 : 0.0;
  
  const ch4Emissions = organicLoad * ch4Factor * (1 - methaneRecoveryFactor);
  const n2oEmissions = nitrogenContent * n2oFactor;

  return {
    ch4: ch4Emissions,
    n2o: n2oEmissions
  };
}

// Obter dados de transporte e distribuição
export async function getTransportDistributionData() {
  const { data, error } = await supabase
    .from('transport_distribution')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Obter dados de mudança no uso do solo
export async function getLandUseChangeData() {
  const { data, error } = await supabase
    .from('land_use_change')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Obter dados de tratamento de efluentes
export async function getWastewaterTreatmentData() {
  const { data, error } = await supabase
    .from('wastewater_treatment')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}