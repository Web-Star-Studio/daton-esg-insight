import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

import type { Json } from "@/integrations/supabase/types";

// AI Insight interface for structured analysis results
interface AIInsight {
  category: string;
  finding: string;
  confidence: number;
  recommendation?: string;
}

// Alert metadata interface - compatible with Supabase Json type
type AlertMetadata = Json;

export interface LicenseAIAnalysis {
  id: string;
  license_id: string;
  analysis_type: string;
  ai_insights: Json;
  confidence_score: number;
  status: string;
  processing_time_ms?: number;
  ai_model_used?: string;
  created_at: string;
}

export interface LicenseCondition {
  id: string;
  license_id: string;
  condition_text: string;
  condition_category?: string;
  due_date?: string;
  frequency?: string;
  status: string;
  priority: string;
  responsible_user_id?: string;
  ai_extracted: boolean;
  ai_confidence?: number;
  created_at: string;
}

export interface LicenseAlert {
  id: string;
  license_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_resolved: boolean;
  resolved_at?: string;
  action_required: boolean;
  due_date?: string;
  metadata: AlertMetadata;
  created_at: string;
}

export interface LicenseAIStats {
  totalAnalyzed: number;
  avgConfidenceScore: number;
  totalConditions: number;
  totalAlerts: number;
  criticalAlerts: number;
  pendingConditions: number;
  complianceScore: number;
}

// Análise de licença com IA
export async function analyzeLicenseWithAI(
  licenseId: string, 
  analysisType: 'full_analysis' | 'renewal_prediction' | 'compliance_check' = 'full_analysis'
): Promise<{ success: boolean; analysisId?: string; error?: string }> {
  try {
    const response = await supabase.functions.invoke('license-ai-analyzer', {
      body: { licenseId, analysisType }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      success: response.data.success,
      analysisId: response.data.analysisId
    };
  } catch (error: unknown) {
    logger.error('Error analyzing license', error, 'compliance');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Buscar análises de uma licença
export async function getLicenseAnalyses(licenseId: string): Promise<LicenseAIAnalysis[]> {
  const { data, error } = await supabase
    .from('license_ai_analysis')
    .select('*')
    .eq('license_id', licenseId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching license analyses', error, 'compliance');
    throw error;
  }

  return data || [];
}

// Buscar condicionantes de uma licença
export async function getLicenseConditions(licenseId: string): Promise<LicenseCondition[]> {
  const { data, error } = await supabase
    .from('license_conditions')
    .select('*')
    .eq('license_id', licenseId)
    .order('due_date', { ascending: true });

  if (error) {
    logger.error('Error fetching license conditions', error, 'compliance');
    throw error;
  }

  return data || [];
}

// Buscar alertas de uma licença
export async function getLicenseAlerts(licenseId: string): Promise<LicenseAlert[]> {
  const { data, error } = await supabase
    .from('license_alerts')
    .select('*')
    .eq('license_id', licenseId)
    .eq('is_resolved', false)
    .order('severity', { ascending: false });

  if (error) {
    logger.error('Error fetching license alerts', error, 'compliance');
    throw error;
  }

  return data || [];
}

// Atualizar status de condicionante
export async function updateConditionStatus(
  conditionId: string, 
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('license_conditions')
    .update({ status })
    .eq('id', conditionId);

  if (error) {
    logger.error('Error updating condition status', error, 'compliance');
    throw error;
  }
}

// Resolver alerta
export async function resolveAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('license_alerts')
    .update({ 
      is_resolved: true, 
      resolved_at: new Date().toISOString() 
    })
    .eq('id', alertId);

  if (error) {
    logger.error('Error resolving alert', error, 'compliance');
    throw error;
  }
}

// Buscar estatísticas de IA das licenças
export async function getLicenseAIStats(): Promise<LicenseAIStats> {
  const [
    { data: analyses },
    { data: conditions },
    { data: alerts },
    { data: licenses }
  ] = await Promise.all([
    supabase.from('license_ai_analysis').select('confidence_score'),
    supabase.from('license_conditions').select('status'),
    supabase.from('license_alerts').select('severity, is_resolved'),
    supabase.from('licenses').select('compliance_score')
  ]);

  const totalAnalyzed = analyses?.length || 0;
  const avgConfidenceScore = analyses?.length 
    ? analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length 
    : 0;

  const totalConditions = conditions?.length || 0;
  const pendingConditions = conditions?.filter(c => c.status === 'pending').length || 0;

  const totalAlerts = alerts?.length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && !a.is_resolved).length || 0;

  const complianceScore = licenses?.length
    ? licenses.reduce((sum, l) => sum + (l.compliance_score || 0), 0) / licenses.length
    : 0;

  return {
    totalAnalyzed,
    avgConfidenceScore: Math.round(avgConfidenceScore * 100) / 100,
    totalConditions,
    totalAlerts,
    criticalAlerts,
    pendingConditions,
    complianceScore: Math.round(complianceScore)
  };
}

// Buscar alertas críticos de todas as licenças
export async function getCriticalAlerts(): Promise<LicenseAlert[]> {
  const { data, error } = await supabase
    .from('license_alerts')
    .select(`
      *,
      licenses!inner(name)
    `)
    .eq('severity', 'critical')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching critical alerts', error, 'compliance');
    throw error;
  }

  return data || [];
}

// Buscar condicionantes vencendo em breve
export async function getUpcomingConditions(days: number = 30): Promise<LicenseCondition[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('license_conditions')
    .select(`
      *,
      licenses!inner(name)
    `)
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .gte('due_date', new Date().toISOString().split('T')[0])
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    logger.error('Error fetching upcoming conditions', error, 'compliance');
    throw error;
  }

  return data || [];
}