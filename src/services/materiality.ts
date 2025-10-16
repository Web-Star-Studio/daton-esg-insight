import { supabase } from "@/integrations/supabase/client";

export interface MaterialityTheme {
  id: string;
  code: string;
  title: string;
  description?: string;
  gri_indicators: string[];
  category: 'environmental' | 'social' | 'governance' | 'economic';
  subcategory?: string;
  sector_relevance: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialityAssessment {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  assessment_year: number;
  status: 'draft' | 'survey_open' | 'survey_closed' | 'analysis' | 'completed';
  methodology?: string;
  selected_themes: string[];
  stakeholder_participation: number;
  internal_score: Record<string, number>;
  external_score: Record<string, number>;
  final_matrix: Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>;
  report_summary?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface StakeholderSurvey {
  id: string;
  assessment_id: string;
  company_id: string;
  title: string;
  description?: string;
  instructions?: string;
  survey_config: {
    themes: string[];
    scale: 'likert_5' | 'likert_7' | 'scale_10';
    questions: Array<{
      theme_id: string;
      question: string;
      type: 'importance' | 'impact';
    }>;
  };
  target_stakeholder_categories: string[];
  is_anonymous: boolean;
  response_deadline?: string;
  status: 'draft' | 'active' | 'closed';
  total_invitations: number;
  total_responses: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  stakeholder_id?: string;
  company_id: string;
  response_data: Record<string, number>;
  stakeholder_category?: string;
  stakeholder_organization?: string;
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Temas de Materialidade
export const getMaterialityThemes = async (category?: string, sector?: string) => {
  let query = supabase
    .from('materiality_themes')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Filtrar por setor se especificado
  if (sector && data) {
    return data.filter(theme => 
      theme.sector_relevance.includes('all') || theme.sector_relevance.includes(sector)
    ) as MaterialityTheme[];
  }
  
  return data as MaterialityTheme[];
};

export const getThemesByCategory = async () => {
  const themes = await getMaterialityThemes();
  
  const grouped = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, MaterialityTheme[]>);
  
  return grouped;
};

// Avaliações de Materialidade
export const getMaterialityAssessments = async (companyId?: string) => {
  try {
    const query = supabase
      .from('materiality_assessments')
      .select('*')
      .order('assessment_year', { ascending: false });
    
    if (companyId) {
      // Validar UUID antes de usar
      if (!companyId || companyId.trim() === '') {
        console.error('Invalid company ID provided to getMaterialityAssessments');
        throw new Error('ID da empresa inválido');
      }
      query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching materiality assessments:', error);
      throw new Error(`Erro ao buscar avaliações: ${error.message}`);
    }
    
    return data as MaterialityAssessment[];
  } catch (error) {
    console.error('getMaterialityAssessments error:', error);
    throw error;
  }
};

export const createMaterialityAssessment = async (assessment: Omit<MaterialityAssessment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('materiality_assessments')
    .insert(assessment)
    .select()
    .single();
  
  if (error) throw error;
  return data as MaterialityAssessment;
};

export const updateMaterialityAssessment = async (id: string, updates: Partial<MaterialityAssessment>) => {
  const { data, error } = await supabase
    .from('materiality_assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as MaterialityAssessment;
};

// Surveys de Stakeholders
export const getStakeholderSurveys = async (assessmentId?: string, companyId?: string) => {
  let query = supabase
    .from('stakeholder_surveys')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (assessmentId) {
    query = query.eq('assessment_id', assessmentId);
  }
  
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as StakeholderSurvey[];
};

export const createStakeholderSurvey = async (survey: Omit<StakeholderSurvey, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('stakeholder_surveys')
    .insert(survey)
    .select()
    .single();
  
  if (error) throw error;
  return data as StakeholderSurvey;
};

export const updateStakeholderSurvey = async (id: string, updates: Partial<StakeholderSurvey>) => {
  const { data, error } = await supabase
    .from('stakeholder_surveys')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as StakeholderSurvey;
};

// Respostas de Survey
export const getSurveyResponses = async (surveyId: string) => {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as SurveyResponse[];
};

export const createSurveyResponse = async (response: Omit<SurveyResponse, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('survey_responses')
    .insert(response)
    .select()
    .single();
  
  if (error) throw error;
  return data as SurveyResponse;
};

// Análises e Cálculos
export const calculateMaterialityMatrix = (
  internalScores: Record<string, number>,
  externalScores: Record<string, number>
) => {
  const matrix: Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }> = {};
  
  // Normalizar scores para escala 0-100
  const normalizeScores = (scores: Record<string, number>) => {
    const values = Object.values(scores);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    
    return Object.entries(scores).reduce((acc, [key, value]) => {
      acc[key] = range > 0 ? ((value - min) / range) * 100 : 50;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const normalizedInternal = normalizeScores(internalScores);
  const normalizedExternal = normalizeScores(externalScores);
  
  Object.keys(normalizedInternal).forEach(themeId => {
    const x = normalizedExternal[themeId] || 0; // Importância para stakeholders (eixo X)
    const y = normalizedInternal[themeId] || 0;  // Impacto para empresa (eixo Y)
    
    // Determinar prioridade baseada na posição na matriz
    let priority: 'low' | 'medium' | 'high' = 'low';
    
    if (x >= 70 && y >= 70) {
      priority = 'high';    // Quadrante superior direito
    } else if (x >= 50 && y >= 50) {
      priority = 'medium';  // Quadrantes centrais
    }
    
    matrix[themeId] = { x, y, priority };
  });
  
  return matrix;
};

export const getMaterialityInsights = (assessment: MaterialityAssessment, themes: MaterialityTheme[]) => {
  const matrix = assessment.final_matrix;
  const themesMap = themes.reduce((acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  }, {} as Record<string, MaterialityTheme>);
  
  const insights = {
    totalThemes: Object.keys(matrix).length,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    byCategory: {} as Record<string, { high: number; medium: number; low: number }>,
    topThemes: [] as Array<{ theme: MaterialityTheme; score: number; priority: string }>,
    recommendations: [] as string[],
  };
  
  // Calcular estatísticas
  Object.entries(matrix).forEach(([themeId, data]) => {
    const theme = themesMap[themeId];
    if (!theme) return;
    
    // Contadores por prioridade
    insights[`${data.priority}Priority` as keyof typeof insights]++;
    
    // Por categoria
    if (!insights.byCategory[theme.category]) {
      insights.byCategory[theme.category] = { high: 0, medium: 0, low: 0 };
    }
    insights.byCategory[theme.category][data.priority]++;
    
    // Top temas (ordenar por distância do canto superior direito)
    const score = Math.sqrt(Math.pow(data.x, 2) + Math.pow(data.y, 2));
    insights.topThemes.push({ theme, score, priority: data.priority });
  });
  
  // Ordenar top temas
  insights.topThemes.sort((a, b) => b.score - a.score);
  insights.topThemes = insights.topThemes.slice(0, 10);
  
  // Gerar recomendações
  if (insights.highPriority > 0) {
    insights.recommendations.push(
      `Focar em ${insights.highPriority} tema(s) de alta prioridade para maximizar impacto na sustentabilidade.`
    );
  }
  
  if (insights.topThemes.length > 0) {
    const topCategory = insights.topThemes[0].theme.category;
    insights.recommendations.push(
      `Priorizar iniciativas na área ${topCategory} devido à alta materialidade identificada.`
    );
  }
  
  return insights;
};

export const MATERIALITY_CATEGORIES = [
  { value: 'environmental', label: 'Ambiental', color: 'green' },
  { value: 'social', label: 'Social', color: 'blue' },
  { value: 'governance', label: 'Governança', color: 'purple' },
  { value: 'economic', label: 'Econômico', color: 'orange' },
] as const;