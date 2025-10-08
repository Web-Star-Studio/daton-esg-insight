import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  priority: string;
  responsible: string;
  category: string;
  created_at: string;
}

export interface ComplianceStats {
  totalRequirements: number;
  pendingTasks: number;
  duingSoon: number;
  overdueTasks: number;
  totalTasks: number;
  completionRate: number;
}

export const useCompliance = () => {
  // Fetch compliance tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['compliance-tasks'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) return [];

      const { data, error } = await supabase
        .from('data_collection_tasks')
        .select('*')
        .eq('company_id', userAndCompany.company_id)
        .eq('task_type', 'Compliance')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data.map(task => {
        const metadata = (task.metadata || {}) as {
          priority?: string;
          responsible?: string;
          category?: string;
        };
        return {
          id: task.id,
          title: task.name,
          description: task.description || '',
          due_date: task.due_date,
          status: task.status.toLowerCase().replace(' ', '_'),
          priority: metadata?.priority || 'medium',
          responsible: metadata?.responsible || 'Não atribuído',
          category: metadata?.category || 'Geral',
          created_at: task.created_at,
        };
      }) as ComplianceTask[];
    },
  });

  // Fetch licenses (requirements)
  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) return [];

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('company_id', userAndCompany.company_id);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const stats: ComplianceStats = {
    totalRequirements: licenses.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    duingSoon: tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return dueDate <= thirtyDaysFromNow && t.status !== 'completed';
    }).length,
    overdueTasks: tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      return dueDate < new Date() && t.status !== 'completed';
    }).length,
    totalTasks: tasks.length,
    completionRate: tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
  };

  // Trend data (last 5 months)
  const trendData = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (4 - i));
    const monthTasks = tasks.filter(t => {
      const taskDate = new Date(t.created_at);
      return taskDate.getMonth() === date.getMonth() && 
             taskDate.getFullYear() === date.getFullYear();
    });

    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      completed: monthTasks.filter(t => t.status === 'completed').length,
      pending: monthTasks.filter(t => t.status === 'pending').length,
      overdue: monthTasks.filter(t => {
        const dueDate = new Date(t.due_date);
        return dueDate < new Date() && t.status !== 'completed';
      }).length,
    };
  });

  // Risk distribution
  const riskData = [
    { 
      name: 'Baixo Risco', 
      value: tasks.filter(t => t.priority === 'low').length,
      color: '#10b981'
    },
    { 
      name: 'Médio Risco', 
      value: tasks.filter(t => t.priority === 'medium').length,
      color: '#f59e0b'
    },
    { 
      name: 'Alto Risco', 
      value: tasks.filter(t => t.priority === 'high').length,
      color: '#ef4444'
    },
    { 
      name: 'Crítico', 
      value: tasks.filter(t => t.priority === 'critical').length,
      color: '#dc2626'
    },
  ];

  return {
    tasks,
    stats,
    trendData,
    riskData,
    isLoading: tasksLoading || licensesLoading,
  };
};
