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
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

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
      logger.error('Error fetching predictive analysis', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to get predictive analysis', error);
    throw error;
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