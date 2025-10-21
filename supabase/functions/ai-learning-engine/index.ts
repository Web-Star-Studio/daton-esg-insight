import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackAnalysis {
  pattern_identified: boolean;
  pattern_name?: string;
  field_mappings?: Record<string, any>;
  confidence_adjustment?: number;
  recommendations?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, analysis_type = 'feedback' } = await req.json();

    if (!company_id) {
      throw new Error('company_id is required');
    }

    let result: any = {};

    switch (analysis_type) {
      case 'feedback':
        result = await analyzeFeedback(supabaseClient, company_id);
        break;
      case 'patterns':
        result = await analyzePatterns(supabaseClient, company_id);
        break;
      case 'confidence':
        result = await updateConfidenceThresholds(supabaseClient, company_id);
        break;
      default:
        throw new Error(`Unknown analysis_type: ${analysis_type}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Learning Engine error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeFeedback(supabaseClient: any, company_id: string): Promise<FeedbackAnalysis> {
  console.log('Analyzing feedback for company:', company_id);

  // Get recent feedback logs
  const { data: feedbackLogs, error: feedbackError } = await supabaseClient
    .from('ai_feedback_logs')
    .select('*')
    .eq('company_id', company_id)
    .eq('learning_applied', false)
    .order('created_at', { ascending: false })
    .limit(100);

  if (feedbackError) throw feedbackError;

  if (!feedbackLogs || feedbackLogs.length === 0) {
    return { pattern_identified: false };
  }

  // Analyze corrections
  const corrections = feedbackLogs.filter(log => log.feedback_type === 'correction');
  const correctionsByField: Record<string, number> = {};

  corrections.forEach(log => {
    if (log.correction_details?.fields_corrected) {
      log.correction_details.fields_corrected.forEach((field: string) => {
        correctionsByField[field] = (correctionsByField[field] || 0) + 1;
      });
    }
  });

  // Identify patterns
  const frequentlyCorrrected = Object.entries(correctionsByField)
    .filter(([_, count]) => count >= 3)
    .map(([field, count]) => ({ field, count }));

  if (frequentlyCorrrected.length > 0) {
    console.log('Pattern identified - frequently corrected fields:', frequentlyCorrrected);

    // Mark feedback as applied
    const feedbackIds = corrections.map(log => log.id);
    await supabaseClient
      .from('ai_feedback_logs')
      .update({ learning_applied: true })
      .in('id', feedbackIds);

    return {
      pattern_identified: true,
      recommendations: frequentlyCorrrected.map(
        item => `Campo "${item.field}" foi corrigido ${item.count} vezes - revisar extração`
      )
    };
  }

  return { pattern_identified: false };
}

async function analyzePatterns(supabaseClient: any, company_id: string) {
  console.log('Analyzing document patterns for company:', company_id);

  // Get successful insertions
  const { data: successfulData, error: dataError } = await supabaseClient
    .from('unclassified_data')
    .select('extracted_data, classification, document_id')
    .eq('company_id', company_id)
    .eq('user_decision', 'inserted')
    .order('created_at', { ascending: false })
    .limit(50);

  if (dataError) throw dataError;

  if (!successfulData || successfulData.length === 0) {
    return { patterns_found: 0 };
  }

  // Group by classification
  const patternsByType: Record<string, any[]> = {};
  successfulData.forEach(item => {
    const type = item.classification?.document_type || 'unknown';
    if (!patternsByType[type]) {
      patternsByType[type] = [];
    }
    patternsByType[type].push(item);
  });

  // Create or update patterns
  let patternsCreated = 0;
  for (const [docType, items] of Object.entries(patternsByType)) {
    if (items.length < 3) continue; // Need at least 3 examples

    // Extract common field structure
    const fieldMappings: Record<string, any> = {};
    items.forEach(item => {
      if (item.extracted_data) {
        Object.keys(item.extracted_data).forEach(key => {
          fieldMappings[key] = (fieldMappings[key] || 0) + 1;
        });
      }
    });

    // Create pattern if doesn't exist
    const { data: existingPattern } = await supabaseClient
      .from('document_patterns')
      .select('id')
      .eq('company_id', company_id)
      .eq('document_type', docType)
      .single();

    if (!existingPattern) {
      await supabaseClient
        .from('document_patterns')
        .insert({
          company_id,
          pattern_name: `Auto-detected: ${docType}`,
          document_type: docType,
          field_mappings: fieldMappings,
          success_rate: 100,
          usage_count: items.length
        });
      patternsCreated++;
    } else {
      // Update existing pattern
      await supabaseClient
        .from('document_patterns')
        .update({
          usage_count: items.length,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id);
    }
  }

  return {
    patterns_found: Object.keys(patternsByType).length,
    patterns_created: patternsCreated
  };
}

async function updateConfidenceThresholds(supabaseClient: any, company_id: string) {
  console.log('Updating confidence thresholds for company:', company_id);

  // Get metrics from last 30 days
  const { data: metrics, error: metricsError } = await supabaseClient
    .from('ai_performance_metrics')
    .select('*')
    .eq('company_id', company_id)
    .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('metric_date', { ascending: false });

  if (metricsError) throw metricsError;

  if (!metrics || metrics.length === 0) {
    return { threshold_updated: false, reason: 'No metrics available' };
  }

  // Calculate success rate
  const totalProcessed = metrics.reduce((sum, m) => sum + m.documents_processed, 0);
  const totalAutoApproved = metrics.reduce((sum, m) => sum + m.auto_approved_count, 0);
  const totalRejected = metrics.reduce((sum, m) => sum + m.rejected_count, 0);

  const successRate = totalProcessed > 0 ? (totalAutoApproved / totalProcessed) * 100 : 0;
  const rejectionRate = totalProcessed > 0 ? (totalRejected / totalProcessed) * 100 : 0;

  let recommendation = 'maintain';
  let adjustmentMessage = '';

  // If success rate is very high and rejection rate is low, can lower threshold
  if (successRate > 90 && rejectionRate < 3) {
    recommendation = 'lower';
    adjustmentMessage = 'Alta taxa de sucesso - considere reduzir threshold para 75%';
  }
  // If rejection rate is high, should increase threshold
  else if (rejectionRate > 10) {
    recommendation = 'increase';
    adjustmentMessage = 'Alta taxa de rejeição - considere aumentar threshold para 85%';
  }

  return {
    threshold_updated: true,
    current_success_rate: Math.round(successRate),
    current_rejection_rate: Math.round(rejectionRate),
    recommendation,
    message: adjustmentMessage
  };
}