import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmissionDataPoint {
  date: string;
  total_co2e: number;
  scope: number;
}

interface PredictionResult {
  predictions: Array<{
    date: string;
    predicted_value: number;
    confidence_interval: { lower: number; upper: number };
  }>;
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

interface ComplianceRiskScore {
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

// Simple Moving Average for trend analysis
function calculateMovingAverage(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

// Linear regression for prediction
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// Detect anomalies using standard deviation
function detectAnomalies(data: EmissionDataPoint[], threshold: number = 2): Array<{
  date: string;
  value: number;
  expected_value: number;
  deviation_percentage: number;
}> {
  const values = data.map(d => d.total_co2e);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const anomalies = [];
  
  for (let i = 0; i < data.length; i++) {
    const zScore = Math.abs((data[i].total_co2e - mean) / stdDev);
    if (zScore > threshold) {
      anomalies.push({
        date: data[i].date,
        value: data[i].total_co2e,
        expected_value: mean,
        deviation_percentage: ((data[i].total_co2e - mean) / mean) * 100
      });
    }
  }
  
  return anomalies;
}

// Predict future emissions
async function predictEmissions(supabase: any, companyId: string, months: number = 3): Promise<PredictionResult> {
  // Fetch historical emission data (last 12 months)
  const { data: emissionData, error } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      created_at,
      activity_data!inner(
        emission_sources!inner(scope, company_id)
      )
    `)
    .eq('activity_data.emission_sources.company_id', companyId)
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error || !emissionData || emissionData.length === 0) {
    throw new Error('Insufficient emission data for prediction');
  }

  // Aggregate by month
  const monthlyData: { [key: string]: { total: number; count: number } } = {};
  
  emissionData.forEach((item: any) => {
    const date = new Date(item.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, count: 0 };
    }
    monthlyData[monthKey].total += item.total_co2e;
    monthlyData[monthKey].count += 1;
  });

  // Convert to array and calculate averages
  const historicalData: EmissionDataPoint[] = Object.entries(monthlyData)
    .map(([date, data]) => ({
      date,
      total_co2e: data.total / data.count,
      scope: 1
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (historicalData.length < 3) {
    throw new Error('Need at least 3 months of data for prediction');
  }

  // Calculate trend
  const values = historicalData.map(d => d.total_co2e);
  const { slope, intercept } = linearRegression(values);
  
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const trendPercentage = ((lastValue - firstValue) / firstValue) * 100;
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(trendPercentage) < 5) {
    trend = 'stable';
  } else if (trendPercentage > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  // Generate predictions
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= months; i++) {
    const futureIndex = historicalData.length + i - 1;
    const predictedValue = slope * futureIndex + intercept;
    
    // Calculate confidence interval (simplified)
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / values.length);
    const margin = 1.96 * stdDev; // 95% confidence interval
    
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + i);
    
    predictions.push({
      date: `${predictionDate.getFullYear()}-${String(predictionDate.getMonth() + 1).padStart(2, '0')}`,
      predicted_value: Math.max(0, predictedValue),
      confidence_interval: {
        lower: Math.max(0, predictedValue - margin),
        upper: predictedValue + margin
      }
    });
  }

  // Detect anomalies
  const anomalies = detectAnomalies(historicalData);

  // Calculate forecast accuracy (R-squared)
  const predictedHistorical = values.map((_, i) => slope * i + intercept);
  const meanValue = values.reduce((a, b) => a + b, 0) / values.length;
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - predictedHistorical[i], 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanValue, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  return {
    predictions,
    trend,
    trend_percentage: Math.round(trendPercentage * 100) / 100,
    anomalies,
    forecast_accuracy: Math.round(Math.max(0, Math.min(1, rSquared)) * 100)
  };
}

// Calculate compliance risk score
async function calculateComplianceRisk(supabase: any, companyId: string): Promise<ComplianceRiskScore> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Count expiring licenses (within 30 days)
  const { count: expiringLicenses } = await supabase
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'Ativa')
    .lte('expiration_date', thirtyDaysFromNow.toISOString());

  // Count overdue tasks
  const { count: overdueTasks } = await supabase
    .from('data_collection_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'Pendente')
    .lt('due_date', now.toISOString());

  // Count goals at risk
  const { data: goals } = await supabase
    .from('goals')
    .select('progress_percentage, deadline')
    .eq('company_id', companyId)
    .eq('status', 'Em andamento');

  let goalsAtRisk = 0;
  if (goals) {
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    goalsAtRisk = goals.filter((g: any) => {
      const deadline = new Date(g.deadline);
      return g.progress_percentage < 50 && deadline <= ninetyDaysFromNow;
    }).length;
  }

  // Get emission trend score (from recent data)
  let emissionTrendScore = 0;
  try {
    const prediction = await predictEmissions(supabase, companyId, 1);
    if (prediction.trend === 'increasing') {
      emissionTrendScore = Math.min(30, Math.abs(prediction.trend_percentage));
    }
  } catch (e) {
    console.log('Could not calculate emission trend for risk score');
  }

  // Calculate individual factor scores (0-100)
  const licenseScore = Math.min(100, (expiringLicenses || 0) * 20);
  const taskScore = Math.min(100, (overdueTasks || 0) * 15);
  const goalScore = Math.min(100, goalsAtRisk * 25);
  const emissionScore = emissionTrendScore;

  // Weighted overall score
  const overallScore = Math.round(
    licenseScore * 0.3 +
    taskScore * 0.25 +
    goalScore * 0.25 +
    emissionScore * 0.2
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overallScore >= 75) riskLevel = 'critical';
  else if (overallScore >= 50) riskLevel = 'high';
  else if (overallScore >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  // Generate recommendations
  const recommendations: string[] = [];
  if (expiringLicenses && expiringLicenses > 0) {
    recommendations.push(`Renovar ${expiringLicenses} licença(s) que vencem em 30 dias`);
  }
  if (overdueTasks && overdueTasks > 0) {
    recommendations.push(`Concluir ${overdueTasks} tarefa(s) atrasada(s)`);
  }
  if (goalsAtRisk > 0) {
    recommendations.push(`Acelerar ${goalsAtRisk} meta(s) em risco de não cumprimento`);
  }
  if (emissionTrendScore > 10) {
    recommendations.push('Implementar ações de redução de emissões (tendência de aumento)');
  }

  return {
    overall_score: overallScore,
    risk_level: riskLevel,
    factors: {
      expiring_licenses: licenseScore,
      overdue_tasks: taskScore,
      goals_at_risk: goalScore,
      emission_trends: emissionScore
    },
    recommendations
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user's company
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Company not found');
    }

    const { analysis_type, months } = await req.json();

    let result;

    switch (analysis_type) {
      case 'emission_prediction':
        result = await predictEmissions(supabaseClient, profile.company_id, months || 3);
        break;
      
      case 'compliance_risk':
        result = await calculateComplianceRisk(supabaseClient, profile.company_id);
        break;
      
      case 'full_analysis':
        const [predictions, risk] = await Promise.all([
          predictEmissions(supabaseClient, profile.company_id, months || 3),
          calculateComplianceRisk(supabaseClient, profile.company_id)
        ]);
        result = { predictions, risk };
        break;
      
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predictive-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});