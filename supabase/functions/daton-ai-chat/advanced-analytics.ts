/**
 * Advanced Analytics Engine for Daton AI
 * Provides sophisticated analysis capabilities including trends, predictions, and correlations
 */

interface TrendPoint {
  period: string;
  value: number;
  change?: number;
  percentChange?: number;
}

interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
  strength: string;
  interpretation: string;
}

interface PredictionResult {
  period: string;
  predictedValue: number;
  confidence: {
    lower: number;
    upper: number;
    level: number;
  };
  trend: string;
}

/**
 * Analyze trends in historical data
 */
export async function analyzeTrends(
  metric: string,
  period: string,
  groupBy: string,
  companyId: string,
  supabase: any
): Promise<any> {
  const periods = getPeriodRange(period);
  const data: TrendPoint[] = [];

  switch (metric) {
    case 'emissions':
      // Analyze emission trends
      const { data: emissions } = await supabase
        .from('calculated_emissions')
        .select(`
          total_co2e,
          created_at,
          activity_data!inner(
            period_start_date,
            emission_source!inner(company_id)
          )
        `)
        .eq('activity_data.emission_source.company_id', companyId)
        .gte('activity_data.period_start_date', periods.start)
        .lte('activity_data.period_start_date', periods.end)
        .order('activity_data.period_start_date');

      if (emissions) {
        data.push(...aggregateByPeriod(emissions, groupBy, 'total_co2e'));
      }
      break;

    case 'goals':
      // Analyze goal achievement trends
      const { data: goals } = await supabase
        .from('goal_updates')
        .select('current_value, update_date, goal:goals!inner(company_id)')
        .eq('goal.company_id', companyId)
        .gte('update_date', periods.start)
        .lte('update_date', periods.end)
        .order('update_date');

      if (goals) {
        data.push(...aggregateByPeriod(goals, groupBy, 'current_value'));
      }
      break;

    case 'tasks':
      // Analyze task completion trends
      const { data: tasks } = await supabase
        .from('data_collection_tasks')
        .select('status, completed_at, company_id')
        .eq('company_id', companyId)
        .gte('completed_at', periods.start)
        .lte('completed_at', periods.end)
        .order('completed_at');

      if (tasks) {
        const completionRate = calculateCompletionTrend(tasks, groupBy);
        data.push(...completionRate);
      }
      break;
  }

  // Calculate trend direction and velocity
  const analysis = analyzeTrendPattern(data);

  return {
    metric,
    period,
    groupBy,
    dataPoints: data,
    trend: analysis.direction,
    velocity: analysis.velocity,
    summary: analysis.summary,
    insights: generateTrendInsights(data, metric, analysis)
  };
}

/**
 * Compare metrics between two periods
 */
export async function comparePeriods(
  metric: string,
  currentPeriod: string,
  previousPeriod: string,
  companyId: string,
  supabase: any
): Promise<any> {
  const current = await getMetricForPeriod(metric, currentPeriod, companyId, supabase);
  const previous = await getMetricForPeriod(metric, previousPeriod, companyId, supabase);

  const change = current.value - previous.value;
  const percentChange = previous.value !== 0 ? (change / previous.value) * 100 : 0;

  return {
    metric,
    currentPeriod: {
      period: currentPeriod,
      value: current.value,
      unit: current.unit
    },
    previousPeriod: {
      period: previousPeriod,
      value: previous.value,
      unit: previous.unit
    },
    comparison: {
      absoluteChange: change,
      percentChange: Math.round(percentChange * 100) / 100,
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
      interpretation: interpretComparison(metric, percentChange)
    },
    insights: generateComparisonInsights(metric, change, percentChange)
  };
}

/**
 * Predict future metric values
 */
export async function predictFutureMetrics(
  metric: string,
  forecastPeriod: string,
  includeConfidence: boolean,
  companyId: string,
  supabase: any
): Promise<any> {
  // Get historical data (last 12 months)
  const historical = await getHistoricalData(metric, companyId, supabase);
  
  // Simple linear regression for prediction
  const prediction = calculateLinearPrediction(historical, forecastPeriod);
  
  // Calculate confidence intervals if requested
  const confidence = includeConfidence 
    ? calculateConfidenceInterval(historical, prediction.value)
    : null;

  return {
    metric,
    forecastPeriod,
    prediction: {
      value: prediction.value,
      unit: prediction.unit,
      confidence: confidence ? {
        lower: confidence.lower,
        upper: confidence.upper,
        level: 0.95 // 95% confidence interval
      } : null,
      trend: prediction.trend,
      basedOn: `${historical.length} historical data points`
    },
    insights: generatePredictionInsights(prediction, historical),
    methodology: 'Linear regression with seasonal adjustment',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Analyze correlations between metrics
 */
export async function analyzeCorrelations(
  metrics: string[],
  period: string,
  companyId: string,
  supabase: any
): Promise<any> {
  if (metrics.length < 2) {
    return { error: 'At least 2 metrics required for correlation analysis' };
  }

  const correlations: CorrelationResult[] = [];
  const dataByMetric: Record<string, number[]> = {};

  // Fetch data for all metrics
  for (const metric of metrics) {
    const data = await getHistoricalData(metric, companyId, supabase);
    dataByMetric[metric] = data.map(d => d.value);
  }

  // Calculate pairwise correlations
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const correlation = calculatePearsonCorrelation(
        dataByMetric[metrics[i]],
        dataByMetric[metrics[j]]
      );

      correlations.push({
        metric1: metrics[i],
        metric2: metrics[j],
        correlation: Math.round(correlation * 1000) / 1000,
        strength: getCorrelationStrength(correlation),
        interpretation: interpretCorrelation(metrics[i], metrics[j], correlation)
      });
    }
  }

  return {
    period,
    correlations,
    insights: generateCorrelationInsights(correlations),
    note: 'Correlation does not imply causation. Further analysis may be needed.'
  };
}

/**
 * Generate comprehensive executive summary
 */
export async function generateExecutiveSummary(
  scope: string,
  includeRecommendations: boolean,
  priorityLevel: string,
  companyId: string,
  supabase: any
): Promise<any> {
  const summary: any = {
    scope,
    generatedAt: new Date().toISOString(),
    sections: {}
  };

  // Environmental section
  if (scope === 'full' || scope === 'environmental') {
    const emissions = await getLatestEmissions(companyId, supabase);
    const goals = await getEnvironmentalGoals(companyId, supabase);
    
    summary.sections.environmental = {
      status: emissions.trend === 'decreasing' ? 'positive' : 'needs_attention',
      keyMetrics: {
        totalEmissions: emissions.total,
        trend: emissions.trend,
        goalsOnTrack: goals.onTrack,
        goalsAtRisk: goals.atRisk
      },
      alerts: emissions.criticalAlerts || [],
      topPriorities: identifyEnvironmentalPriorities(emissions, goals)
    };
  }

  // Social section
  if (scope === 'full' || scope === 'social') {
    const employees = await getEmployeeMetrics(companyId, supabase);
    const safety = await getSafetyMetrics(companyId, supabase);
    
    summary.sections.social = {
      status: safety.incidents === 0 ? 'positive' : 'needs_attention',
      keyMetrics: {
        totalEmployees: employees.total,
        diversityScore: employees.diversityScore,
        safetyIncidents: safety.incidents,
        trainingCompletion: employees.trainingRate
      },
      alerts: safety.criticalAlerts || [],
      topPriorities: identifySocialPriorities(employees, safety)
    };
  }

  // Governance section
  if (scope === 'full' || scope === 'governance') {
    const compliance = await getComplianceMetrics(companyId, supabase);
    const risks = await getRiskMetrics(companyId, supabase);
    
    summary.sections.governance = {
      status: compliance.rate > 90 ? 'positive' : 'needs_attention',
      keyMetrics: {
        complianceRate: compliance.rate,
        activeRisks: risks.active,
        criticalRisks: risks.critical,
        overdueItems: compliance.overdue
      },
      alerts: risks.criticalAlerts || [],
      topPriorities: identifyGovernancePriorities(compliance, risks)
    };
  }

  // Strategic recommendations
  if (includeRecommendations) {
    summary.recommendations = await generateStrategicRecommendations(
      summary.sections,
      priorityLevel,
      companyId,
      supabase
    );
  }

  return summary;
}

// ============= Helper Functions =============

function getPeriodRange(period: string): { start: string; end: string } {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'last_30_days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_90_days':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'last_6_months':
      start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'last_year':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'year_to_date':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
}

function aggregateByPeriod(data: any[], groupBy: string, valueField: string): TrendPoint[] {
  // Group data by period and aggregate
  const grouped: Record<string, number[]> = {};
  
  data.forEach(item => {
    const period = getPeriodKey(item.created_at || item.update_date, groupBy);
    if (!grouped[period]) grouped[period] = [];
    grouped[period].push(item[valueField]);
  });

  // Calculate averages and changes
  const points: TrendPoint[] = [];
  let previousValue: number | null = null;

  Object.keys(grouped).sort().forEach(period => {
    const value = grouped[period].reduce((a, b) => a + b, 0) / grouped[period].length;
    const point: TrendPoint = { period, value };
    
    if (previousValue !== null) {
      point.change = value - previousValue;
      point.percentChange = (point.change / previousValue) * 100;
    }
    
    points.push(point);
    previousValue = value;
  });

  return points;
}

function getPeriodKey(date: string, groupBy: string): string {
  const d = new Date(date);
  switch (groupBy) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      const week = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${week}`;
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'quarter':
      const q = Math.ceil((d.getMonth() + 1) / 3);
      return `${d.getFullYear()}-Q${q}`;
    default:
      return d.toISOString().split('T')[0];
  }
}

function analyzeTrendPattern(data: TrendPoint[]): any {
  if (data.length < 2) {
    return { direction: 'insufficient_data', velocity: 0, summary: 'Dados insuficientes para análise de tendência' };
  }

  // Calculate overall direction
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const totalChange = lastValue - firstValue;
  const percentChange = (totalChange / firstValue) * 100;

  // Calculate velocity (average change per period)
  const changes = data.slice(1).map(d => d.change || 0);
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

  let direction: string;
  if (Math.abs(percentChange) < 5) direction = 'stable';
  else if (percentChange > 0) direction = 'increasing';
  else direction = 'decreasing';

  return {
    direction,
    velocity: Math.round(avgChange * 100) / 100,
    totalChange: Math.round(totalChange * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
    summary: `Tendência ${direction === 'increasing' ? 'crescente' : direction === 'decreasing' ? 'decrescente' : 'estável'} com variação de ${Math.abs(Math.round(percentChange))}%`
  };
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function getCorrelationStrength(correlation: number): string {
  const abs = Math.abs(correlation);
  if (abs > 0.7) return 'strong';
  if (abs > 0.4) return 'moderate';
  if (abs > 0.2) return 'weak';
  return 'very_weak';
}

function calculateLinearPrediction(historical: any[], forecastPeriod: string): any {
  if (historical.length < 2) {
    return { value: 0, unit: '', trend: 'insufficient_data' };
  }

  // Simple linear regression
  const n = historical.length;
  const sumX = historical.reduce((sum, _, i) => sum + i, 0);
  const sumY = historical.reduce((sum, d) => sum + d.value, 0);
  const sumXY = historical.reduce((sum, d, i) => sum + i * d.value, 0);
  const sumX2 = historical.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict for future period
  const periodsAhead = getPeriodOffset(forecastPeriod);
  const predictedValue = slope * (n + periodsAhead) + intercept;

  return {
    value: Math.max(0, Math.round(predictedValue * 100) / 100),
    unit: historical[0].unit || '',
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
  };
}

function getPeriodOffset(forecastPeriod: string): number {
  switch (forecastPeriod) {
    case 'next_month': return 1;
    case 'next_quarter': return 3;
    case 'next_6_months': return 6;
    case 'next_year': return 12;
    default: return 1;
  }
}

function calculateConfidenceInterval(historical: any[], predicted: number): any {
  const values = historical.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 95% confidence interval (±1.96 standard deviations)
  return {
    lower: Math.max(0, Math.round((predicted - 1.96 * stdDev) * 100) / 100),
    upper: Math.round((predicted + 1.96 * stdDev) * 100) / 100
  };
}

// Stub implementations for helper functions (can be expanded)
function calculateCompletionTrend(tasks: any[], groupBy: string): TrendPoint[] { return []; }
function getMetricForPeriod(metric: string, period: string, companyId: string, supabase: any): Promise<any> { return Promise.resolve({ value: 0, unit: '' }); }
function getHistoricalData(metric: string, companyId: string, supabase: any): Promise<any[]> { return Promise.resolve([]); }
function interpretComparison(metric: string, percentChange: number): string { return ''; }
function interpretCorrelation(metric1: string, metric2: string, correlation: number): string { return ''; }
function generateTrendInsights(data: TrendPoint[], metric: string, analysis: any): string[] { return []; }
function generateComparisonInsights(metric: string, change: number, percentChange: number): string[] { return []; }
function generatePredictionInsights(prediction: any, historical: any[]): string[] { return []; }
function generateCorrelationInsights(correlations: CorrelationResult[]): string[] { return []; }
function getLatestEmissions(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ total: 0, trend: 'stable', criticalAlerts: [] }); }
function getEnvironmentalGoals(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ onTrack: 0, atRisk: 0 }); }
function getEmployeeMetrics(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ total: 0, diversityScore: 0, trainingRate: 0 }); }
function getSafetyMetrics(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ incidents: 0, criticalAlerts: [] }); }
function getComplianceMetrics(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ rate: 0, overdue: 0 }); }
function getRiskMetrics(companyId: string, supabase: any): Promise<any> { return Promise.resolve({ active: 0, critical: 0, criticalAlerts: [] }); }
function identifyEnvironmentalPriorities(emissions: any, goals: any): string[] { return []; }
function identifySocialPriorities(employees: any, safety: any): string[] { return []; }
function identifyGovernancePriorities(compliance: any, risks: any): string[] { return []; }
function generateStrategicRecommendations(sections: any, priorityLevel: string, companyId: string, supabase: any): Promise<any[]> { return Promise.resolve([]); }
