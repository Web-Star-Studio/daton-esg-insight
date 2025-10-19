import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/**
 * Predicts goal achievement probability based on historical progress
 */
export async function predictGoalAchievement(
  goalId: string, 
  supabase: SupabaseClient
): Promise<{
  probability: number;
  expectedCompletion: string;
  trend: 'positive' | 'negative' | 'stable';
  recommendation: string;
}> {
  try {
    // Get goal details
    const { data: goal } = await supabase
      .from('goals')
      .select('*, goal_progress_updates(*)')
      .eq('id', goalId)
      .single();

    if (!goal || !goal.goal_progress_updates || goal.goal_progress_updates.length < 2) {
      return {
        probability: 50,
        expectedCompletion: 'Dados insuficientes',
        trend: 'stable',
        recommendation: 'Adicione mais atualizações de progresso para análise preditiva'
      };
    }

    // Sort updates by date
    const updates = goal.goal_progress_updates.sort(
      (a: any, b: any) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime()
    );

    // Calculate linear regression
    const n = updates.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    updates.forEach((update: any, index: number) => {
      const x = index;
      const y = update.progress_percentage;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Current progress
    const currentProgress = updates[updates.length - 1].progress_percentage;
    const targetValue = goal.target_value;
    const currentValue = updates[updates.length - 1].current_value;

    // Calculate days to deadline
    const deadline = new Date(goal.deadline_date);
    const now = new Date();
    const daysToDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Predict completion based on trend
    const daysPerUpdate = Math.ceil(
      (new Date(updates[updates.length - 1].update_date).getTime() - 
       new Date(updates[0].update_date).getTime()) / 
      (1000 * 60 * 60 * 24 * (updates.length - 1))
    );

    const progressPerDay = slope / daysPerUpdate;
    const expectedProgress = currentProgress + (progressPerDay * daysToDeadline);
    const probability = Math.min(Math.max(expectedProgress, 0), 100);

    // Determine trend
    let trend: 'positive' | 'negative' | 'stable';
    if (slope > 5) trend = 'positive';
    else if (slope < -5) trend = 'negative';
    else trend = 'stable';

    // Generate recommendation
    let recommendation = '';
    if (probability >= 80) {
      recommendation = '✅ Meta no caminho certo! Mantenha o ritmo atual.';
    } else if (probability >= 50) {
      recommendation = '⚠️ Atenção: acelere as ações para garantir o cumprimento da meta.';
    } else {
      recommendation = '🚨 Risco alto de não atingir a meta. Revise a estratégia urgentemente.';
    }

    const expectedDays = Math.ceil((100 - currentProgress) / progressPerDay);
    const expectedDate = new Date(now.getTime() + expectedDays * 24 * 60 * 60 * 1000);

    return {
      probability: Math.round(probability),
      expectedCompletion: expectedDate > deadline 
        ? `${Math.ceil((expectedDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))} dias após o prazo`
        : expectedDate.toLocaleDateString('pt-BR'),
      trend,
      recommendation
    };
  } catch (error) {
    console.error('Error predicting goal achievement:', error);
    return {
      probability: 50,
      expectedCompletion: 'Erro ao calcular',
      trend: 'stable',
      recommendation: 'Não foi possível realizar análise preditiva'
    };
  }
}

/**
 * Forecasts emissions for future periods based on historical data
 */
export async function forecastEmissions(
  companyId: string,
  scope: number,
  months: number,
  supabase: SupabaseClient
): Promise<{
  forecast: Array<{ month: string; value: number }>;
  trend: string;
  insight: string;
}> {
  try {
    // Get historical emissions
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select(`
        total_co2e,
        activity_data!inner(
          period_start_date,
          emission_source_id,
          emission_sources!inner(scope, company_id)
        )
      `)
      .eq('activity_data.emission_sources.company_id', companyId)
      .eq('activity_data.emission_sources.scope', scope)
      .gte('activity_data.period_start_date', oneYearAgo.toISOString())
      .order('activity_data(period_start_date)', { ascending: true });

    if (!emissions || emissions.length < 3) {
      return {
        forecast: [],
        trend: 'Dados insuficientes',
        insight: 'São necessários pelo menos 3 meses de dados históricos para previsão'
      };
    }

    // Group by month and sum emissions
    const monthlyData: { [key: string]: number } = {};
    emissions.forEach((e: any) => {
      const month = e.activity_data.period_start_date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + e.total_co2e;
    });

    const months_data = Object.entries(monthlyData).map(([month, value]) => ({
      month,
      value
    }));

    // Simple moving average for forecast
    const n = months_data.length;
    const lastThreeAvg = months_data.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
    
    // Calculate trend
    const firstHalf = months_data.slice(0, Math.floor(n / 2)).reduce((sum, d) => sum + d.value, 0) / Math.floor(n / 2);
    const secondHalf = months_data.slice(Math.floor(n / 2)).reduce((sum, d) => sum + d.value, 0) / Math.ceil(n / 2);
    const trendPercent = ((secondHalf - firstHalf) / firstHalf) * 100;

    let trend = 'estável';
    if (trendPercent > 10) trend = 'crescente';
    else if (trendPercent < -10) trend = 'decrescente';

    // Generate forecast
    const forecast: Array<{ month: string; value: number }> = [];
    const now = new Date();
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = futureDate.toISOString().substring(0, 7);
      forecast.push({
        month: monthStr,
        value: Math.round(lastThreeAvg * (1 + (trendPercent / 100) * i) * 100) / 100
      });
    }

    let insight = '';
    if (trendPercent > 10) {
      insight = `⚠️ Emissões em tendência crescente (+${trendPercent.toFixed(1)}%). Recomenda-se revisar ações de mitigação.`;
    } else if (trendPercent < -10) {
      insight = `✅ Emissões em tendência decrescente (${trendPercent.toFixed(1)}%). Continue com as boas práticas!`;
    } else {
      insight = `📊 Emissões estáveis. Considere novas iniciativas de redução.`;
    }

    return { forecast, trend, insight };
  } catch (error) {
    console.error('Error forecasting emissions:', error);
    return {
      forecast: [],
      trend: 'Erro ao calcular',
      insight: 'Não foi possível realizar previsão de emissões'
    };
  }
}

/**
 * Calculates risk score for a license based on various factors
 */
export function calculateLicenseRiskScore(license: any): {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  const now = new Date();
  const expiryDate = new Date(license.expiry_date);
  const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Days to expiry factor (40 points max)
  if (daysToExpiry < 0) {
    score += 40;
    factors.push('Licença vencida');
  } else if (daysToExpiry <= 30) {
    score += 35;
    factors.push('Vencimento em menos de 30 dias');
  } else if (daysToExpiry <= 60) {
    score += 25;
    factors.push('Vencimento em menos de 60 dias');
  } else if (daysToExpiry <= 90) {
    score += 15;
    factors.push('Vencimento em menos de 90 dias');
  }

  // Status factor (30 points max)
  if (license.status === 'Vencida') {
    score += 30;
    factors.push('Status: Vencida');
  } else if (license.status === 'Suspensa') {
    score += 25;
    factors.push('Status: Suspensa');
  } else if (license.status === 'Em Renovação') {
    score += 10;
    factors.push('Status: Em Renovação');
  }

  // Criticality factor (30 points max)
  const criticalTypes = ['LO', 'LP', 'AAF', 'LAU'];
  if (criticalTypes.includes(license.license_type)) {
    score += 20;
    factors.push('Tipo de licença crítico');
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 60) level = 'critical';
  else if (score >= 40) level = 'high';
  else if (score >= 20) level = 'medium';
  else level = 'low';

  return { score, level, factors };
}
