import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roleDistribution: Array<{
    role: string;
    count: number;
    label: string;
  }>;
  last7Days: {
    newUsers: number;
    successfulLogins: number;
    failedLogins: number;
    errorRate: number;
  };
  companies: {
    total: number;
    active: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Gerente',
  analyst: 'Analista',
  operator: 'Operador',
  auditor: 'Auditor',
  viewer: 'Visualizador',
};

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      // Fetch all data in parallel
      const [
        usersResult,
        rolesResult,
        newUsersResult,
        loginsResult,
        companiesResult,
      ] = await Promise.all([
        // Total users and active/inactive
        supabase
          .from('profiles')
          .select('id, is_active', { count: 'exact' }),
        
        // Role distribution
        supabase
          .from('user_roles')
          .select('role'),
        
        // New users in last 7 days
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgoISO),
        
        // Login history last 7 days
        supabase
          .from('login_history')
          .select('login_success')
          .gte('created_at', sevenDaysAgoISO),
        
        // Companies
        supabase
          .from('companies')
          .select('id', { count: 'exact' }),
      ]);

      // Process users
      const users = usersResult.data || [];
      const activeUsers = users.filter(u => u.is_active !== false).length;
      const inactiveUsers = users.filter(u => u.is_active === false).length;

      // Process role distribution
      const roleCounts: Record<string, number> = {};
      (rolesResult.data || []).forEach(r => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      
      const roleDistribution = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count,
        label: ROLE_LABELS[role] || role,
      })).sort((a, b) => b.count - a.count);

      // Process login stats
      const logins = loginsResult.data || [];
      const successfulLogins = logins.filter(l => l.login_success === true).length;
      const failedLogins = logins.filter(l => l.login_success === false).length;
      const totalLogins = successfulLogins + failedLogins;
      const errorRate = totalLogins > 0 ? (failedLogins / totalLogins) * 100 : 0;

      // Process companies
      const companies = companiesResult.data || [];

      return {
        users: {
          total: users.length,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        roleDistribution,
        last7Days: {
          newUsers: newUsersResult.count || 0,
          successfulLogins,
          failedLogins,
          errorRate: Number(errorRate.toFixed(1)),
        },
        companies: {
          total: companies.length,
          active: companies.length,
        },
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLoginTrend = () => {
  return useQuery({
    queryKey: ['login-trend'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('login_history')
        .select('created_at, login_success')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyData: Record<string, { success: number; failed: number }> = {};
      
      (data || []).forEach(login => {
        const date = new Date(login.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { success: 0, failed: 0 };
        }
        if (login.login_success) {
          dailyData[date].success++;
        } else {
          dailyData[date].failed++;
        }
      });

      return Object.entries(dailyData).map(([date, counts]) => ({
        date,
        success: counts.success,
        failed: counts.failed,
        total: counts.success + counts.failed,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
};
