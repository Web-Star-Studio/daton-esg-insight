import { supabase } from '@/integrations/supabase/client';
import handleServiceError from '@/utils/errorHandler';

export interface AnalyticsData {
  metrics: Record<string, number>;
  trends: Array<{
    date: string;
    value: number;
    change: number;
  }>;
  insights: string[];
  predictions?: Array<{
    date: string;
    predicted: number;
    confidence: number;
  }>;
}

export interface UserActivityData {
  totalUsers: number;
  activeUsers: number;
  sessionDuration: number;
  topActions: Array<{ action: string; count: number }>;
  userEngagement: number;
}

export interface SystemPerformanceData {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

class AnalyticsService {
  async getEmissionsAnalytics(companyId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<AnalyticsData> {
    try {
      const startDate = this.getPeriodStart(period);
      
      const { data: emissions, error } = await supabase
        .from('calculated_emissions')
        .select(`
          *,
          activity_data (
            period_start_date,
            emission_sources (scope, category)
          )
        `)
        .gte('calculation_date', startDate.toISOString())
        .order('calculation_date');

      if (error) throw error;

      const totalEmissions = emissions?.reduce((sum, e) => sum + e.total_co2e, 0) || 0;
      const scope1 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 1)
        .reduce((sum, e) => sum + e.total_co2e, 0) || 0;
      const scope2 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 2)
        .reduce((sum, e) => sum + e.total_co2e, 0) || 0;
      const scope3 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 3)
        .reduce((sum, e) => sum + e.total_co2e, 0) || 0;

      // Calculate trends
      const trends = this.calculateTrends(emissions, 'total_co2e', 'calculation_date');

      // Generate insights
      const insights = this.generateEmissionsInsights(totalEmissions, scope1, scope2, scope3, trends);

      return {
        metrics: {
          total: totalEmissions,
          scope1,
          scope2,
          scope3,
          change: trends.length > 1 ? trends[trends.length - 1].change : 0
        },
        trends,
        insights
      };
    } catch (error) {
      return handleServiceError(error, 'getEmissionsAnalytics');
    }
  }

  async getQualityAnalytics(companyId: string): Promise<AnalyticsData> {
    try {
      // Non-conformities trend
      const { data: nonConformities } = await supabase
        .from('non_conformities')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', this.getPeriodStart('year').toISOString())
        .order('created_at');

      // Quality indicators
      const { data: indicators } = await supabase
        .from('quality_indicators')
        .select('*')
        .eq('company_id', companyId);

      const openNCs = nonConformities?.filter(nc => nc.status !== 'Fechada').length || 0;
      const criticalNCs = nonConformities?.filter(nc => nc.severity === 'Crítica').length || 0;
      const resolvedRate = nonConformities?.length > 0 ? 
        (nonConformities.filter(nc => nc.status === 'Fechada').length / nonConformities.length) * 100 : 0;

      const trends = this.calculateTrends(nonConformities, 'id', 'created_at', 'count');

      const insights = [
        `${openNCs} não conformidades abertas`,
        `${criticalNCs} não conformidades críticas`,
        `Taxa de resolução: ${resolvedRate.toFixed(1)}%`,
        `${indicators?.length || 0} indicadores de qualidade ativos`
      ];

      return {
        metrics: {
          openNonConformities: openNCs,
          criticalNonConformities: criticalNCs,
          resolutionRate: resolvedRate,
          qualityScore: this.calculateQualityScore(openNCs, criticalNCs, resolvedRate)
        },
        trends,
        insights
      };
    } catch (error) {
      return handleServiceError(error, 'getQualityAnalytics');
    }
  }

  async getComplianceAnalytics(companyId: string): Promise<AnalyticsData> {
    try {
      const { data: tasks } = await supabase
        .from('compliance_tasks')
        .select('*')
        .eq('company_id', companyId);

      const { data: licenses } = await supabase
        .from('licenses')
        .select('*')
        .eq('company_id', companyId);

      const completedTasks = tasks?.filter(t => t.status === 'Concluído').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.status !== 'Concluído' && new Date(t.due_date) < new Date()
      ).length || 0;
      
      const expiredLicenses = licenses?.filter(l => 
        new Date(l.expiration_date) < new Date()
      ).length || 0;
      
      const expiringLicenses = licenses?.filter(l => {
        const expDate = new Date(l.expiration_date);
        const now = new Date();
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diffDays > 0 && diffDays <= 30;
      }).length || 0;

      const complianceScore = this.calculateComplianceScore(
        completedTasks, 
        tasks?.length || 0, 
        overdueTasks, 
        expiredLicenses
      );

      const trends = this.calculateTrends(tasks, 'id', 'created_at', 'count');

      const insights = [
        `Score de compliance: ${complianceScore.toFixed(1)}%`,
        `${overdueTasks} tarefas em atraso`,
        `${expiredLicenses} licenças vencidas`,
        `${expiringLicenses} licenças vencendo em 30 dias`
      ];

      return {
        metrics: {
          complianceScore,
          completedTasks,
          overdueTasks,
          expiredLicenses,
          expiringLicenses
        },
        trends,
        insights
      };
    } catch (error) {
      return handleServiceError(error, 'getComplianceAnalytics');
    }
  }

  async getUserActivityAnalytics(): Promise<UserActivityData> {
    try {
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', this.getPeriodStart('month').toISOString())
        .order('created_at', { ascending: false });

      const uniqueUsers = new Set(activities?.map(a => a.user_id)).size;
      const totalActivities = activities?.length || 0;

      // Calculate top actions
      const actionCounts = activities?.reduce((acc, activity) => {
        acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalUsers: uniqueUsers,
        activeUsers: uniqueUsers, // Simplified - could be more sophisticated
        sessionDuration: 0, // Would need session tracking
        topActions,
        userEngagement: totalActivities / Math.max(uniqueUsers, 1)
      };
    } catch (error) {
      console.error('Error getting user activity analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        sessionDuration: 0,
        topActions: [],
        userEngagement: 0
      };
    }
  }

  async getSystemPerformanceAnalytics(): Promise<SystemPerformanceData> {
    // Mock data - in production, this would come from monitoring services
    return {
      responseTime: Math.random() * 200 + 100, // 100-300ms
      uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
      errorRate: Math.random() * 0.5, // 0-0.5%
      throughput: Math.random() * 1000 + 500, // 500-1500 req/min
      resourceUsage: {
        cpu: Math.random() * 50 + 20, // 20-70%
        memory: Math.random() * 40 + 30, // 30-70%
        storage: Math.random() * 30 + 40 // 40-70%
      }
    };
  }

  async generatePredictions(
    historicalData: any[], 
    valueField: string, 
    dateField: string,
    periods: number = 12
  ): Promise<Array<{ date: string; predicted: number; confidence: number }>> {
    // Simplified linear regression prediction
    // In production, use more sophisticated ML algorithms
    
    if (historicalData.length < 3) return [];

    const values = historicalData.map(d => d[valueField]).filter(v => v != null);
    const n = values.length;
    
    // Calculate linear trend
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const predictions = [];
    const lastDate = new Date(historicalData[historicalData.length - 1][dateField]);
    
    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      const predicted = intercept + slope * (n + i - 1);
      const confidence = Math.max(0.5, 0.9 - (i * 0.05)); // Decreasing confidence over time
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidence
      });
    }
    
    return predictions;
  }

  private getPeriodStart(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    const start = new Date(now);
    
    switch (period) {
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return start;
  }

  private calculateTrends(data: any[] = [], valueField: string, dateField: string, aggregation: 'sum' | 'count' = 'sum') {
    if (!data || data.length === 0) return [];

    const monthlyData = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { date: monthKey, value: 0, count: 0 };
      }
      
      if (aggregation === 'sum') {
        acc[monthKey].value += item[valueField] || 0;
      } else {
        acc[monthKey].count += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const sortedData = Object.values(monthlyData)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    return sortedData.map((item: any, index) => {
      const value = aggregation === 'count' ? item.count : item.value;
      const previousValue = index > 0 ? 
        (aggregation === 'count' ? sortedData[index - 1].count : sortedData[index - 1].value) : 0;
      
      const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
      
      return {
        date: item.date,
        value,
        change
      };
    });
  }

  private generateEmissionsInsights(total: number, scope1: number, scope2: number, scope3: number, trends: any[]): string[] {
    const insights = [];
    
    insights.push(`Total de ${total.toFixed(2)} tCO2e registradas`);
    
    if (scope1 > 0) insights.push(`Escopo 1: ${scope1.toFixed(2)} tCO2e (${((scope1/total)*100).toFixed(1)}%)`);
    if (scope2 > 0) insights.push(`Escopo 2: ${scope2.toFixed(2)} tCO2e (${((scope2/total)*100).toFixed(1)}%)`);
    if (scope3 > 0) insights.push(`Escopo 3: ${scope3.toFixed(2)} tCO2e (${((scope3/total)*100).toFixed(1)}%)`);
    
    if (trends.length > 1) {
      const lastTrend = trends[trends.length - 1];
      if (lastTrend.change > 0) {
        insights.push(`Aumento de ${lastTrend.change.toFixed(1)}% no último período`);
      } else if (lastTrend.change < 0) {
        insights.push(`Redução de ${Math.abs(lastTrend.change).toFixed(1)}% no último período`);
      }
    }
    
    return insights;
  }

  private calculateQualityScore(openNCs: number, criticalNCs: number, resolutionRate: number): number {
    let score = 100;
    
    // Penalize for open non-conformities
    score -= openNCs * 2;
    
    // Heavy penalty for critical non-conformities
    score -= criticalNCs * 10;
    
    // Bonus for good resolution rate
    score += (resolutionRate - 50) * 0.5;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateComplianceScore(completed: number, total: number, overdue: number, expired: number): number {
    if (total === 0) return 100;
    
    let score = (completed / total) * 100;
    
    // Penalties
    score -= overdue * 5;
    score -= expired * 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

export const analyticsService = new AnalyticsService();