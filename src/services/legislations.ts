import { supabase } from "@/integrations/supabase/client";

export interface LegislationTheme {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegislationSubtheme {
  id: string;
  theme_id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  theme?: LegislationTheme;
}

export interface Legislation {
  id: string;
  company_id: string;
  theme_id?: string;
  subtheme_id?: string;
  norm_type: string;
  issuing_body?: string;
  norm_number?: string;
  publication_date?: string;
  title: string;
  summary?: string;
  full_text_url?: string;
  jurisdiction: 'federal' | 'estadual' | 'municipal' | 'nbr' | 'internacional';
  state?: string;
  municipality?: string;
  overall_applicability: 'real' | 'potential' | 'revoked' | 'na' | 'pending';
  overall_status: 'conforme' | 'para_conhecimento' | 'adequacao' | 'plano_acao' | 'pending';
  has_alert: boolean;
  responsible_user_id?: string;
  revokes_legislation_id?: string;
  revoked_by_legislation_id?: string;
  related_legislation_ids?: string[];
  last_review_date?: string;
  next_review_date?: string;
  review_frequency_days: number;
  observations?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  theme?: LegislationTheme;
  subtheme?: LegislationSubtheme;
  responsible_user?: { id: string; full_name: string };
}

export interface LegislationUnitCompliance {
  id: string;
  legislation_id: string;
  branch_id: string;
  company_id: string;
  applicability: 'real' | 'potential' | 'na' | 'revoked' | 'pending';
  compliance_status: 'conforme' | 'para_conhecimento' | 'adequacao' | 'plano_acao' | 'pending';
  has_pending_requirements: boolean;
  pending_description?: string;
  action_plan?: string;
  action_plan_deadline?: string;
  evidence_notes?: string;
  unit_responsible_user_id?: string;
  evaluated_at?: string;
  evaluated_by?: string;
  created_at: string;
  updated_at: string;
  branch?: { id: string; name: string };
}

export interface LegislationEvidence {
  id: string;
  legislation_id: string;
  unit_compliance_id?: string;
  company_id: string;
  title: string;
  description?: string;
  evidence_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

// Themes CRUD
export const fetchLegislationThemes = async (companyId: string): Promise<LegislationTheme[]> => {
  const { data, error } = await supabase
    .from('legislation_themes')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createLegislationTheme = async (theme: Partial<LegislationTheme>): Promise<LegislationTheme> => {
  const { data, error } = await supabase
    .from('legislation_themes')
    .insert([theme] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLegislationTheme = async (id: string, theme: Partial<LegislationTheme>): Promise<LegislationTheme> => {
  const { data, error } = await supabase
    .from('legislation_themes')
    .update(theme)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Subthemes CRUD
export const fetchLegislationSubthemes = async (companyId: string, themeId?: string): Promise<LegislationSubtheme[]> => {
  let query = supabase
    .from('legislation_subthemes')
    .select('*, theme:legislation_themes(*)')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (themeId) {
    query = query.eq('theme_id', themeId);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data || [];
};

export const createLegislationSubtheme = async (subtheme: Partial<LegislationSubtheme>): Promise<LegislationSubtheme> => {
  const { data, error } = await supabase
    .from('legislation_subthemes')
    .insert([subtheme] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Legislations CRUD
export const fetchLegislations = async (
  companyId: string, 
  filters?: {
    jurisdiction?: string;
    themeId?: string;
    subthemeId?: string;
    applicability?: string;
    status?: string;
    search?: string;
  }
): Promise<Legislation[]> => {
  let query = supabase
    .from('legislations')
    .select(`
      *,
      theme:legislation_themes(*),
      subtheme:legislation_subthemes(*),
      responsible_user:profiles!legislations_responsible_user_id_fkey(id, full_name)
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (filters?.jurisdiction) {
    query = query.eq('jurisdiction', filters.jurisdiction);
  }
  if (filters?.themeId) {
    query = query.eq('theme_id', filters.themeId);
  }
  if (filters?.subthemeId) {
    query = query.eq('subtheme_id', filters.subthemeId);
  }
  if (filters?.applicability) {
    query = query.eq('overall_applicability', filters.applicability);
  }
  if (filters?.status) {
    query = query.eq('overall_status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,norm_number.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Legislation[];
};

export const fetchLegislationById = async (id: string): Promise<Legislation | null> => {
  const { data, error } = await supabase
    .from('legislations')
    .select(`
      *,
      theme:legislation_themes(*),
      subtheme:legislation_subthemes(*),
      responsible_user:profiles!legislations_responsible_user_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as Legislation;
};

export const createLegislation = async (legislation: Partial<Legislation>): Promise<Legislation> => {
  const { data, error } = await supabase
    .from('legislations')
    .insert([legislation] as any)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Legislation;
};

export const updateLegislation = async (id: string, legislation: Partial<Legislation>): Promise<Legislation> => {
  const { data, error } = await supabase
    .from('legislations')
    .update(legislation)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Legislation;
};

export const deleteLegislation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('legislations')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Unit Compliance CRUD
export const fetchUnitCompliances = async (legislationId: string): Promise<LegislationUnitCompliance[]> => {
  const { data, error } = await supabase
    .from('legislation_unit_compliance')
    .select(`
      *,
      branch:branches(id, name)
    `)
    .eq('legislation_id', legislationId);

  if (error) throw error;
  return (data || []) as unknown as LegislationUnitCompliance[];
};

export const upsertUnitCompliance = async (compliance: Partial<LegislationUnitCompliance>): Promise<LegislationUnitCompliance> => {
  const { data, error } = await supabase
    .from('legislation_unit_compliance')
    .upsert([compliance] as any, { onConflict: 'legislation_id,branch_id' })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LegislationUnitCompliance;
};

// Evidences CRUD
export const fetchLegislationEvidences = async (legislationId: string): Promise<LegislationEvidence[]> => {
  const { data, error } = await supabase
    .from('legislation_evidences')
    .select('*')
    .eq('legislation_id', legislationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createLegislationEvidence = async (evidence: Partial<LegislationEvidence>): Promise<LegislationEvidence> => {
  const { data, error } = await supabase
    .from('legislation_evidences')
    .insert([evidence] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLegislationEvidence = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('legislation_evidences')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Statistics
export const fetchLegislationStats = async (companyId: string) => {
  const { data, error } = await supabase
    .from('legislations')
    .select('overall_applicability, overall_status, has_alert, jurisdiction')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    byApplicability: {
      real: data?.filter(l => l.overall_applicability === 'real').length || 0,
      potential: data?.filter(l => l.overall_applicability === 'potential').length || 0,
      revoked: data?.filter(l => l.overall_applicability === 'revoked').length || 0,
      na: data?.filter(l => l.overall_applicability === 'na').length || 0,
      pending: data?.filter(l => l.overall_applicability === 'pending').length || 0,
    },
    byStatus: {
      conforme: data?.filter(l => l.overall_status === 'conforme').length || 0,
      para_conhecimento: data?.filter(l => l.overall_status === 'para_conhecimento').length || 0,
      adequacao: data?.filter(l => l.overall_status === 'adequacao').length || 0,
      plano_acao: data?.filter(l => l.overall_status === 'plano_acao').length || 0,
      pending: data?.filter(l => l.overall_status === 'pending').length || 0,
    },
    byJurisdiction: {
      federal: data?.filter(l => l.jurisdiction === 'federal').length || 0,
      estadual: data?.filter(l => l.jurisdiction === 'estadual').length || 0,
      municipal: data?.filter(l => l.jurisdiction === 'municipal').length || 0,
      nbr: data?.filter(l => l.jurisdiction === 'nbr').length || 0,
      internacional: data?.filter(l => l.jurisdiction === 'internacional').length || 0,
    },
    alerts: data?.filter(l => l.has_alert).length || 0,
  };

  return stats;
};

// Default themes for new companies
export const NORM_TYPES = [
  'Lei',
  'Lei Complementar',
  'Decreto',
  'Decreto-Lei',
  'Portaria',
  'Resolução',
  'Instrução Normativa',
  'NBR',
  'NR',
  'Deliberação',
  'Medida Provisória',
  'Convenção',
  'Tratado',
  'Outro'
];

export const ISSUING_BODIES = [
  'Presidência da República',
  'Congresso Nacional',
  'IBAMA',
  'MMA',
  'MTE',
  'CONAMA',
  'ANP',
  'ANEEL',
  'ANA',
  'ANVISA',
  'INMETRO',
  'CONTRAN',
  'Assembleia Legislativa',
  'CETESB',
  'FEAM',
  'IAT',
  'INEA',
  'Câmara Municipal',
  'Prefeitura',
  'ABNT',
  'ISO',
  'OIT',
  'ONU',
  'Outro'
];

export const DEFAULT_THEMES = [
  { name: 'Meio Ambiente', code: 'MA', color: '#22c55e' },
  { name: 'Recursos Humanos', code: 'RH', color: '#3b82f6' },
  { name: 'Qualidade', code: 'QA', color: '#8b5cf6' },
  { name: 'Segurança do Trabalho', code: 'SST', color: '#f59e0b' },
  { name: 'Transporte', code: 'TR', color: '#6366f1' },
  { name: 'Saúde', code: 'SA', color: '#ef4444' },
  { name: 'Fiscal/Tributário', code: 'FT', color: '#14b8a6' },
  { name: 'Societário', code: 'SO', color: '#ec4899' },
];
