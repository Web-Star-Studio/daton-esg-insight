import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface EmissionPrediction {
  date: string;
  predicted_value: number;
  confidence_interval: { lower: number; upper: number };
}

export interface PredictionResult {
  predictions: EmissionPrediction[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_percentage: number;
  anomalies: Array<{
    date: string;
    value: number;
    expected_value: number;
    deviation_percentage: number;
  }>;
  forecast_accuracy: number;
}

export interface ComplianceRiskScore {
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    expiring_licenses: number;
    overdue_tasks: number;
    goals_at_risk: number;
    emission_trends: number;
  };
  recommendations: string[];
}

export interface FullAnalysis {
  predictions: PredictionResult;
  risk: ComplianceRiskScore;
}

export const getPredictiveAnalysis = async (
  analysisType: 'emission_prediction' | 'compliance_risk' | 'full_analysis',
  months: number = 3
): Promise<PredictionResult | ComplianceRiskScore | FullAnalysis> => {
  try {
    console.log('🔐 [PredictiveAnalytics] Starting authentication check...');
    
    // Try to get current session
    let { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔐 [PredictiveAnalytics] Session status:', {
      hasSession: !!session,
      hasToken: !!session?.access_token,
      expiresAt: session?.expires_at
    });
    
    // If no session, try to refresh
    if (!session) {
      console.log('🔄 [PredictiveAnalytics] No session found, attempting refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ [PredictiveAnalytics] Session refresh failed:', refreshError);
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      session = refreshData.session;
      console.log('✅ [PredictiveAnalytics] Session refreshed successfully');
    }
    
    if (!session?.access_token) {
      console.error('❌ [PredictiveAnalytics] No access token available');
      throw new Error('Token de autenticação não disponível');
    }

    console.log('📡 [PredictiveAnalytics] Invoking edge function:', {
      analysisType,
      months,
      tokenLength: session.access_token.length
    });

    const { data, error } = await supabase.functions.invoke('predictive-analytics', {
      body: {
        analysis_type: analysisType,
        months
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('❌ [PredictiveAnalytics] Edge function error:', error);
      logger.error('Error fetching predictive analysis', error);
      throw new Error(`Erro na análise preditiva: ${error.message || 'Erro desconhecido'}`);
    }

    console.log('✅ [PredictiveAnalytics] Data received successfully');
    return data;
  } catch (error: any) {
    console.error('❌ [PredictiveAnalytics] Fatal error:', error);
    logger.error('Failed to get predictive analysis', error);
    
    // Rethrow with more context
    if (error.message?.includes('sessão') || error.message?.includes('login')) {
      throw error;
    }
    
    throw new Error(error.message || 'Erro ao buscar análise preditiva');
  }
};

export const getEmissionPredictions = async (months: number = 3): Promise<PredictionResult> => {
  return getPredictiveAnalysis('emission_prediction', months) as Promise<PredictionResult>;
};

export const getComplianceRiskScore = async (): Promise<ComplianceRiskScore> => {
  return getPredictiveAnalysis('compliance_risk') as Promise<ComplianceRiskScore>;
};

export const getFullAnalysis = async (months: number = 3): Promise<FullAnalysis> => {
  return getPredictiveAnalysis('full_analysis', months) as Promise<FullAnalysis>;
};