import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimated_impact: number;
  implementation_time: string;
  status: 'pending' | 'in_progress' | 'completed';
  actionUrl?: string;
  relatedData?: any;
}

export const useIntelligentRecommendations = () => {
  return useQuery({
    queryKey: ['intelligent-recommendations'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company not found');
      }

      const recommendations: AIRecommendation[] = [];

      // 1. Check for overdue tasks
      const { data: overdueTasks } = await supabase
        .from('data_collection_tasks')
        .select('id, name, due_date')
        .eq('company_id', userAndCompany.company_id)
        .eq('status', 'Em Atraso')
        .order('due_date', { ascending: true })
        .limit(5);

      if (overdueTasks && overdueTasks.length > 0) {
        recommendations.push({
          id: 'overdue-tasks',
          title: `${overdueTasks.length} Tarefas em Atraso`,
          description: `Existem tarefas pendentes que requerem atenção imediata. A tarefa mais antiga venceu em ${new Date(overdueTasks[0].due_date).toLocaleDateString('pt-BR')}.`,
          priority: 'high',
          category: 'Tarefas',
          estimated_impact: 15,
          implementation_time: 'Imediato',
          status: 'pending',
          actionUrl: '/gestao-tarefas',
          relatedData: overdueTasks
        });
      }

      // 2. Check for expiring licenses (next 30 days)
      const { data: expiringLicenses } = await supabase
        .from('licenses')
        .select('id, license_name, expiration_date')
        .eq('company_id', userAndCompany.company_id)
        .gte('expiration_date', new Date().toISOString())
        .lte('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('expiration_date', { ascending: true })
        .limit(5);

      if (expiringLicenses && expiringLicenses.length > 0) {
        recommendations.push({
          id: 'expiring-licenses',
          title: `${expiringLicenses.length} Licenças Próximas do Vencimento`,
          description: `Licenças que vencerão nos próximos 30 dias. Inicie o processo de renovação para evitar não conformidades.`,
          priority: 'high',
          category: 'Compliance',
          estimated_impact: 20,
          implementation_time: '2-4 semanas',
          status: 'pending',
          actionUrl: '/licenciamento',
          relatedData: expiringLicenses
        });
      }

      // 3. Check for goals at risk (< 50% progress and < 30 days to target)
      const { data: atRiskGoals } = await supabase
        .from('goals')
        .select('id, goal_name, target_date, progress_percentage')
        .eq('company_id', userAndCompany.company_id)
        .in('status', ['No Caminho Certo', 'Atenção Necessária', 'Atrasada'])
        .lt('progress_percentage', 50)
        .gte('target_date', new Date().toISOString())
        .lte('target_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      if (atRiskGoals && atRiskGoals.length > 0) {
        recommendations.push({
          id: 'at-risk-goals',
          title: `${atRiskGoals.length} Metas em Risco`,
          description: `Metas com menos de 50% de progresso e prazo inferior a 30 dias. Ações imediatas são necessárias para cumprir os objetivos.`,
          priority: 'high',
          category: 'Metas',
          estimated_impact: 25,
          implementation_time: 'Imediato',
          status: 'pending',
          actionUrl: '/metas',
          relatedData: atRiskGoals
        });
      }

      // 4. Check for pending non-conformities
      const { data: pendingNCs } = await supabase
        .from('non_conformities')
        .select('id, title, severity')
        .eq('company_id', userAndCompany.company_id)
        .in('status', ['Aberta', 'Em Análise'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (pendingNCs && pendingNCs.length > 0) {
        const criticalCount = pendingNCs.filter(nc => nc.severity === 'Crítica').length;
        
        if (criticalCount > 0) {
          recommendations.push({
            id: 'critical-ncs',
            title: `${criticalCount} Não Conformidades Críticas`,
            description: `Não conformidades críticas abertas que requerem tratamento prioritário para evitar impactos operacionais e regulatórios.`,
            priority: 'high',
            category: 'Qualidade',
            estimated_impact: 30,
            implementation_time: '1-2 semanas',
            status: 'pending',
            actionUrl: '/nao-conformidades',
            relatedData: pendingNCs.filter(nc => nc.severity === 'Crítica')
          });
        } else {
          recommendations.push({
            id: 'pending-ncs',
            title: `${pendingNCs.length} Não Conformidades Pendentes`,
            description: `Não conformidades abertas aguardando análise ou tratamento. Revisar e implementar planos de ação.`,
            priority: 'medium',
            category: 'Qualidade',
            estimated_impact: 15,
            implementation_time: '2-3 semanas',
            status: 'pending',
            actionUrl: '/nao-conformidades',
            relatedData: pendingNCs
          });
        }
      }

      // 5. Check for data quality issues (missing emission data in last 30 days)
      const { data: recentEmissions, error: emissionsError } = await supabase
        .from('activity_data')
        .select('id, period_start_date, emission_source_id')
        .gte('period_start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!emissionsError && (!recentEmissions || recentEmissions.length === 0)) {
        recommendations.push({
          id: 'data-quality-emissions',
          title: 'Atualizar Dados de Emissões',
          description: 'Não há registros de emissões nos últimos 30 dias. Manter dados atualizados é essencial para reportes precisos e conformidade.',
          priority: 'medium',
          category: 'Dados',
          estimated_impact: 18,
          implementation_time: '1 semana',
          status: 'pending',
          actionUrl: '/inventario-gee'
        });
      }

      // Sort by priority and impact
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.estimated_impact - a.estimated_impact;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};
