import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface StakeholderAnalytics {
  summary: {
    totalStakeholders: number;
    activeEngagement: number;
    averageScore: number;
    totalInteractions: number;
    scheduledMeetings: number;
    overdueFollowups: number;
    trending: {
      stakeholders: number;
      engagement: number;
      interactions: number;
    };
  };
  engagementByCategory: Array<{
    category: string;
    count: number;
    avgScore: number;
    interactions: number;
  }>;
  engagementTrend?: Array<{
    month: string;
    score: number;
    interactions: number;
  }>;
  influenceDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  interestDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  maturityRadar?: Array<{
    subject: string;
    score: number;
  }>;
  riskMetrics?: Array<{
    risk: string;
    stakeholders: number;
    trend: string;
  }>;
  upcomingActions?: Array<{
    stakeholder: string;
    action: string;
    date: string;
    priority: string;
  }>;
}

export const useStakeholderAnalytics = (period: string = '3months') => {
  return useQuery({
    queryKey: ['stakeholder-analytics', period],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company not found');
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch all stakeholders for the company
      const { data: stakeholders, error } = await supabase
        .from('stakeholders')
        .select('*')
        .eq('company_id', userAndCompany.company_id);

      if (error) throw error;

      if (!stakeholders || stakeholders.length === 0) {
        // Return empty analytics structure
        return {
          summary: {
            totalStakeholders: 0,
            activeEngagement: 0,
            averageScore: 0,
            totalInteractions: 0,
            scheduledMeetings: 0,
            overdueFollowups: 0,
            trending: { stakeholders: 0, engagement: 0, interactions: 0 }
          },
          engagementByCategory: [],
          engagementTrend: [],
          influenceDistribution: [
            { name: 'Alta', value: 0, color: '#EF4444' },
            { name: 'Média', value: 0, color: '#F59E0B' },
            { name: 'Baixa', value: 0, color: '#10B981' }
          ],
          interestDistribution: [
            { name: 'Alto', value: 0, color: '#3B82F6' },
            { name: 'Médio', value: 0, color: '#8B5CF6' },
            { name: 'Baixo', value: 0, color: '#6B7280' }
          ],
          maturityRadar: [],
          riskMetrics: [],
          upcomingActions: []
        } as StakeholderAnalytics;
      }

      // Calculate engagement by category
      const categoryMap = new Map<string, { count: number; totalScore: number }>();
      
      stakeholders.forEach(sh => {
        const category = sh.category || 'Outros';
        const current = categoryMap.get(category) || { count: 0, totalScore: 0 };
        
        // Use engagement_frequency as a proxy for score (values like: Semanal, Mensal, Trimestral)
        const scoreMap: { [key: string]: number } = {
          'Diária': 90,
          'Semanal': 75,
          'Mensal': 60,
          'Trimestral': 45,
          'Anual': 30
        };
        const score = sh.engagement_frequency ? scoreMap[sh.engagement_frequency] || 50 : 50;
        
        categoryMap.set(category, {
          count: current.count + 1,
          totalScore: current.totalScore + score
        });
      });

      const engagementByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
        interactions: data.count * 5 // Estimate 5 interactions per stakeholder
      }));

      // Calculate influence distribution
      const influenceDistribution = [
        { 
          name: 'Alta', 
          value: stakeholders.filter(sh => sh.influence_level === 'Alta').length, 
          color: '#EF4444' 
        },
        { 
          name: 'Média', 
          value: stakeholders.filter(sh => sh.influence_level === 'Média').length, 
          color: '#F59E0B' 
        },
        { 
          name: 'Baixa', 
          value: stakeholders.filter(sh => sh.influence_level === 'Baixa').length, 
          color: '#10B981' 
        }
      ];

      // Calculate interest distribution
      const interestDistribution = [
        { 
          name: 'Alto', 
          value: stakeholders.filter(sh => sh.interest_level === 'Alto').length, 
          color: '#3B82F6' 
        },
        { 
          name: 'Médio', 
          value: stakeholders.filter(sh => sh.interest_level === 'Médio').length, 
          color: '#8B5CF6' 
        },
        { 
          name: 'Baixo', 
          value: stakeholders.filter(sh => sh.interest_level === 'Baixo').length, 
          color: '#6B7280' 
        }
      ];

      // Calculate summary metrics
      const scoreMap: { [key: string]: number } = {
        'Diária': 90,
        'Semanal': 75,
        'Mensal': 60,
        'Trimestral': 45,
        'Anual': 30
      };
      
      const totalScore = stakeholders.reduce((sum, sh) => {
        const score = sh.engagement_frequency ? scoreMap[sh.engagement_frequency] || 50 : 50;
        return sum + score;
      }, 0);
      
      const averageScore = stakeholders.length > 0 ? Math.round(totalScore / stakeholders.length) : 0;
      
      const activeEngagement = stakeholders.filter(sh => 
        sh.engagement_frequency && ['Diária', 'Semanal', 'Mensal'].includes(sh.engagement_frequency)
      ).length;

      const totalInteractions = stakeholders.length * 5; // Estimate 5 interactions per stakeholder

      // For trending, we'd need historical data. For now, showing 0
      // In production, you'd compare with previous period
      const trending = {
        stakeholders: 0,
        engagement: 0,
        interactions: 0
      };

      return {
        summary: {
          totalStakeholders: stakeholders.length,
          activeEngagement,
          averageScore,
          totalInteractions,
          scheduledMeetings: 0, // Would come from a meetings table
          overdueFollowups: 0, // Would come from followup tracking
          trending
        },
        engagementByCategory,
        engagementTrend: [],
        influenceDistribution,
        interestDistribution,
        maturityRadar: [
          { subject: 'Identificação', score: 75 },
          { subject: 'Engajamento', score: averageScore },
          { subject: 'Comunicação', score: activeEngagement > 0 ? 80 : 40 },
          { subject: 'Monitoramento', score: 60 },
          { subject: 'Resposta', score: 70 }
        ],
        riskMetrics: [
          { risk: 'Baixo engajamento', stakeholders: stakeholders.length - activeEngagement, trend: 'stable' },
          { risk: 'Falta de comunicação recente', stakeholders: 0, trend: 'down' }
        ],
        upcomingActions: []
      } as StakeholderAnalytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
