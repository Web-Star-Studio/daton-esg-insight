import { supabase } from "@/integrations/supabase/client";

export interface SatisfactionSurvey {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  survey_type: string;
  target_audience: string;
  questions: any;
  settings?: any;
  status: string;
  start_date?: string;
  end_date?: string;
  anonymous: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'scale';
  question: string;
  required: boolean;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  company_id: string;
  stakeholder_id?: string;
  stakeholder_category?: string;
  response_data: any;
  completion_percentage: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  ip_address?: unknown;
  user_agent?: unknown;
}

export interface CreateSurveyData {
  title: string;
  description?: string;
  survey_type: string;
  target_audience: string;
  questions: any;
  settings?: any;
  start_date?: string;
  end_date?: string;
  anonymous?: boolean;
}

export const getSatisfactionSurveys = async (): Promise<SatisfactionSurvey[]> => {
  try {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching satisfaction surveys:', error);
    throw error;
  }
};

export const getSatisfactionSurveyById = async (id: string): Promise<SatisfactionSurvey | null> => {
  try {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching satisfaction survey:', error);
    throw error;
  }
};

export const createSatisfactionSurvey = async (surveyData: CreateSurveyData): Promise<SatisfactionSurvey> => {
  try {
    // Get user's company_id and user_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .insert({
        ...surveyData,
        company_id: profile?.company_id,
        created_by_user_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating satisfaction survey:', error);
    throw error;
  }
};

export const updateSatisfactionSurvey = async (id: string, updates: Partial<SatisfactionSurvey>): Promise<SatisfactionSurvey> => {
  try {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating satisfaction survey:', error);
    throw error;
  }
};

export const deleteSatisfactionSurvey = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('satisfaction_surveys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting satisfaction survey:', error);
    throw error;
  }
};

export const publishSurvey = async (id: string): Promise<SatisfactionSurvey> => {
  try {
    return await updateSatisfactionSurvey(id, { status: 'Ativa' });
  } catch (error) {
    console.error('Error publishing survey:', error);
    throw error;
  }
};

export const closeSurvey = async (id: string): Promise<SatisfactionSurvey> => {
  try {
    return await updateSatisfactionSurvey(id, { status: 'Finalizada' });
  } catch (error) {
    console.error('Error closing survey:', error);
    throw error;
  }
};

export const getSurveyResponses = async (surveyId: string): Promise<SurveyResponse[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    throw error;
  }
};

export const submitSurveyResponse = async (
  surveyId: string,
  responses: Record<string, any>,
  respondentInfo?: {
    stakeholder_id?: string;
    stakeholder_category?: string;
  }
): Promise<SurveyResponse> => {
  try {
    // Get user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    const responseData = {
      survey_id: surveyId,
      company_id: profile?.company_id,
      response_data: responses,
      completion_percentage: 100,
      completed_at: new Date().toISOString(),
      ...respondentInfo
    };

    const { data, error } = await supabase
      .from('survey_responses')
      .insert([responseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting survey response:', error);
    throw error;
  }
};

export const getSurveyAnalytics = async (surveyId: string) => {
  try {
    const responses = await getSurveyResponses(surveyId);
    const survey = await getSatisfactionSurveyById(surveyId);

    if (!survey) throw new Error('Survey not found');

    const analytics = {
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.completed_at).length,
      averageCompletion: responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.completion_percentage, 0) / responses.length 
        : 0,
      questionAnalytics: {} as Record<string, any>
    };

    // Analyze each question
    survey.questions.forEach(question => {
      const questionResponses = responses
        .filter(r => r.response_data && r.response_data[question.id] !== undefined)
        .map(r => r.response_data[question.id]);

      analytics.questionAnalytics[question.id] = analyzeQuestionResponses(question, questionResponses);
    });

    return analytics;
  } catch (error) {
    console.error('Error getting survey analytics:', error);
    throw error;
  }
};

const analyzeQuestionResponses = (question: SurveyQuestion, responses: any[]) => {
  switch (question.type) {
    case 'rating':
    case 'scale':
      const numbers = responses.filter(r => typeof r === 'number');
      return {
        average: numbers.length > 0 ? numbers.reduce((sum, r) => sum + r, 0) / numbers.length : 0,
        count: numbers.length,
        distribution: getDistribution(numbers)
      };
    
    case 'multiple_choice':
    case 'yes_no':
      return {
        count: responses.length,
        distribution: getDistribution(responses)
      };
    
    case 'text':
      return {
        count: responses.length,
        responses: responses.slice(0, 10) // Sample responses
      };
    
    default:
      return { count: responses.length };
  }
};

const getDistribution = (values: any[]): Record<string, number> => {
  return values.reduce((dist, value) => {
    const key = String(value);
    dist[key] = (dist[key] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
};

export const getSurveysStats = async () => {
  try {
    const { data: surveys, error } = await supabase
      .from('satisfaction_surveys')
      .select('*');

    if (error) throw error;

    const stats = {
      total: surveys?.length || 0,
      draft: surveys?.filter(s => s.status === 'Rascunho').length || 0,
      active: surveys?.filter(s => s.status === 'Ativa').length || 0,
      completed: surveys?.filter(s => s.status === 'Finalizada').length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error calculating surveys stats:', error);
    throw error;
  }
};