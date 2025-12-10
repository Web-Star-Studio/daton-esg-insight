import { supabase } from "@/integrations/supabase/client";

export interface ComplianceProfile {
  id: string;
  branch_id: string;
  company_id: string;
  activity_sectors: string[];
  has_fleet: boolean;
  has_hazardous_materials: boolean;
  has_environmental_license: boolean;
  has_wastewater_treatment: boolean;
  has_air_emissions: boolean;
  has_solid_waste: boolean;
  activities: string[];
  waste_types: string[];
  operating_states: string[];
  operating_municipalities: string[];
  employee_count_range: string | null;
  certifications: string[];
  industry_type: string | null;
  risk_level: string | null;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

// Opções para o questionário
export const ACTIVITY_SECTORS = [
  { id: 'meio_ambiente', label: 'Meio Ambiente', icon: '🌿' },
  { id: 'recursos_humanos', label: 'Recursos Humanos', icon: '👥' },
  { id: 'seguranca_trabalho', label: 'Segurança do Trabalho', icon: '⚠️' },
  { id: 'qualidade', label: 'Qualidade', icon: '✅' },
  { id: 'transporte', label: 'Transporte e Logística', icon: '🚚' },
  { id: 'saude', label: 'Saúde', icon: '🏥' },
  { id: 'fiscal_tributario', label: 'Fiscal/Tributário', icon: '📊' },
  { id: 'juridico', label: 'Jurídico', icon: '⚖️' },
];

export const ACTIVITIES = [
  { id: 'producao_industrial', label: 'Produção Industrial', tags: ['licenciamento_ambiental', 'residuos', 'emissoes'] },
  { id: 'transporte_rodoviario', label: 'Transporte Rodoviário', tags: ['frota', 'transporte'] },
  { id: 'armazenamento', label: 'Armazenamento', tags: ['armazenamento', 'residuos'] },
  { id: 'comercio', label: 'Comércio/Varejo', tags: ['comercio'] },
  { id: 'servicos', label: 'Prestação de Serviços', tags: ['servicos'] },
  { id: 'construcao', label: 'Construção Civil', tags: ['construcao', 'residuos'] },
  { id: 'mineracao', label: 'Mineração', tags: ['mineracao', 'licenciamento_ambiental', 'residuos'] },
  { id: 'agropecuaria', label: 'Agropecuária', tags: ['agropecuaria', 'licenciamento_ambiental'] },
  { id: 'alimenticio', label: 'Setor Alimentício', tags: ['alimenticio', 'anvisa'] },
  { id: 'farmaceutico', label: 'Setor Farmacêutico', tags: ['farmaceutico', 'anvisa'] },
  { id: 'quimico', label: 'Indústria Química', tags: ['quimico', 'residuos_perigosos', 'licenciamento_ambiental'] },
  { id: 'metalurgica', label: 'Metalurgia/Siderurgia', tags: ['metalurgia', 'emissoes', 'residuos'] },
];

export const WASTE_TYPES = [
  { id: 'residuos_domesticos', label: 'Resíduos Domésticos/Comuns', tags: ['residuos'] },
  { id: 'residuos_reciclaveis', label: 'Resíduos Recicláveis', tags: ['residuos', 'reciclagem'] },
  { id: 'residuos_perigosos', label: 'Resíduos Perigosos (Classe I)', tags: ['residuos_perigosos', 'licenciamento_ambiental'] },
  { id: 'residuos_saude', label: 'Resíduos de Serviços de Saúde', tags: ['residuos_saude', 'anvisa'] },
  { id: 'efluentes_liquidos', label: 'Efluentes Líquidos', tags: ['efluentes', 'licenciamento_ambiental'] },
  { id: 'emissoes_atmosfericas', label: 'Emissões Atmosféricas', tags: ['emissoes', 'licenciamento_ambiental'] },
  { id: 'oleos_lubrificantes', label: 'Óleos Lubrificantes Usados', tags: ['oleos', 'residuos_perigosos'] },
  { id: 'pilhas_baterias', label: 'Pilhas e Baterias', tags: ['pilhas_baterias', 'residuos_perigosos'] },
  { id: 'residuos_eletronicos', label: 'Resíduos Eletroeletrônicos', tags: ['residuos_eletronicos'] },
  { id: 'residuos_construcao', label: 'Resíduos da Construção Civil', tags: ['residuos_construcao'] },
];

export const CERTIFICATIONS = [
  { id: 'iso_9001', label: 'ISO 9001 (Qualidade)' },
  { id: 'iso_14001', label: 'ISO 14001 (Meio Ambiente)' },
  { id: 'iso_45001', label: 'ISO 45001 (Saúde e Segurança)' },
  { id: 'iso_50001', label: 'ISO 50001 (Energia)' },
  { id: 'fssc_22000', label: 'FSSC 22000 (Segurança Alimentar)' },
  { id: 'ohsas', label: 'OHSAS 18001' },
  { id: 'sassmaq', label: 'SASSMAQ' },
  { id: 'oea', label: 'OEA (Operador Econômico Autorizado)' },
];

export const EMPLOYEE_RANGES = [
  { id: 'micro', label: 'Até 19 funcionários (Micro)' },
  { id: 'pequena', label: '20 a 99 funcionários (Pequena)' },
  { id: 'media', label: '100 a 499 funcionários (Média)' },
  { id: 'grande', label: '500 ou mais funcionários (Grande)' },
];

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// CRUD Functions
export const fetchComplianceProfile = async (branchId: string): Promise<ComplianceProfile | null> => {
  const { data, error } = await supabase
    .from('legislation_compliance_profiles')
    .select('*')
    .eq('branch_id', branchId)
    .maybeSingle();

  if (error) throw error;
  
  if (data) {
    return {
      ...data,
      activity_sectors: data.activity_sectors || [],
      activities: data.activities || [],
      waste_types: data.waste_types || [],
      operating_states: data.operating_states || [],
      operating_municipalities: data.operating_municipalities || [],
      certifications: data.certifications || [],
    } as ComplianceProfile;
  }
  
  return null;
};

export const fetchAllComplianceProfiles = async (companyId: string): Promise<ComplianceProfile[]> => {
  const { data, error } = await supabase
    .from('legislation_compliance_profiles')
    .select('*')
    .eq('company_id', companyId);

  if (error) throw error;
  
  return (data || []).map(profile => ({
    ...profile,
    activity_sectors: profile.activity_sectors || [],
    activities: profile.activities || [],
    waste_types: profile.waste_types || [],
    operating_states: profile.operating_states || [],
    operating_municipalities: profile.operating_municipalities || [],
    certifications: profile.certifications || [],
  })) as ComplianceProfile[];
};

export const upsertComplianceProfile = async (
  profile: Partial<ComplianceProfile> & { branch_id: string; company_id: string }
): Promise<ComplianceProfile> => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('legislation_compliance_profiles')
    .upsert({
      ...profile,
      completed_at: new Date().toISOString(),
      completed_by: userData?.user?.id,
    }, { onConflict: 'branch_id' })
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceProfile;
};

// Função para gerar tags baseadas no perfil
export const generateProfileTags = (profile: Partial<ComplianceProfile>): string[] => {
  const tags: Set<string> = new Set();
  
  // Tags baseadas em características
  if (profile.has_fleet) tags.add('frota');
  if (profile.has_hazardous_materials) tags.add('residuos_perigosos');
  if (profile.has_environmental_license) tags.add('licenciamento_ambiental');
  if (profile.has_wastewater_treatment) tags.add('efluentes');
  if (profile.has_air_emissions) tags.add('emissoes');
  if (profile.has_solid_waste) tags.add('residuos');
  
  // Tags das atividades
  profile.activities?.forEach(activityId => {
    const activity = ACTIVITIES.find(a => a.id === activityId);
    activity?.tags.forEach(tag => tags.add(tag));
  });
  
  // Tags dos tipos de resíduos
  profile.waste_types?.forEach(wasteId => {
    const waste = WASTE_TYPES.find(w => w.id === wasteId);
    waste?.tags.forEach(tag => tags.add(tag));
  });
  
  // Tags dos setores
  profile.activity_sectors?.forEach(sector => tags.add(sector));
  
  return Array.from(tags);
};

// Função para verificar se uma legislação é aplicável a um perfil
export const isLegislationApplicableToProfile = (
  legislationTags: string[],
  profileTags: string[]
): { applicable: boolean; matchedTags: string[] } => {
  if (!legislationTags || legislationTags.length === 0) {
    // Se a legislação não tem tags, é potencialmente aplicável a todos
    return { applicable: true, matchedTags: [] };
  }
  
  const matchedTags = legislationTags.filter(tag => profileTags.includes(tag));
  
  return {
    applicable: matchedTags.length > 0,
    matchedTags,
  };
};

// Função para filtrar legislações baseado no perfil
export const filterLegislationsByProfile = <T extends { applicability_tags?: string[] }>(
  legislations: T[],
  profileTags: string[],
  mode: 'include' | 'exclude' = 'include'
): T[] => {
  if (profileTags.length === 0) return legislations;
  
  return legislations.filter(leg => {
    const result = isLegislationApplicableToProfile(leg.applicability_tags || [], profileTags);
    return mode === 'include' ? result.applicable : !result.applicable;
  });
};
