import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserCheck, UserX, Building2, LogIn, LogOut, AlertCircle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useSystemStats, useLoginTrend } from '@/hooks/admin/useSystemStats';
import { StatsCard } from './StatsCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(24, 95%, 53%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 72%, 51%)',
];

export const SystemStatsModule = () => {
  const { data: stats, isLoading, error } = useSystemStats();
  const { data: loginTrend, isLoading: trendLoading } = useLoginTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        Erro ao carregar estatísticas
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={stats.users.total}
          icon={Users}
          description="Cadastrados na plataforma"
        />
        <StatsCard
          title="Usuários Ativos"
          value={stats.users.active}
          icon={UserCheck}
          variant="success"
          description={`${((stats.users.active / stats.users.total) * 100).toFixed(1)}% do total`}
        />
        <StatsCard
          title="Usuários Inativos"
          value={stats.users.inactive}
          icon={UserX}
          variant={stats.users.inactive > 0 ? 'warning' : 'default'}
        />
        <StatsCard
          title="Empresas"
          value={stats.companies.total}
          icon={Building2}
        />
      </div>

      {/* Second Row - Last 7 Days */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Novos Usuários (7 dias)"
          value={stats.last7Days.newUsers}
          icon={TrendingUp}
          description="Últimos 7 dias"
        />
        <StatsCard
          title="Logins Bem-sucedidos"
          value={stats.last7Days.successfulLogins}
          icon={LogIn}
          variant="success"
          description="Últimos 7 dias"
        />
        <StatsCard
          title="Falhas de Login"
          value={stats.last7Days.failedLogins}
          icon={LogOut}
          variant={stats.last7Days.failedLogins > 10 ? 'danger' : 'default'}
          description="Últimos 7 dias"
        />
        <StatsCard
          title="Taxa de Erro"
          value={`${stats.last7Days.errorRate}%`}
          icon={AlertCircle}
          variant={stats.last7Days.errorRate > 10 ? 'danger' : stats.last7Days.errorRate > 5 ? 'warning' : 'success'}
          description="Falhas / Total de logins"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Role</CardTitle>
            <CardDescription>Usuários por tipo de permissão</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.roleDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.roleDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, count }) => `${label}: ${count}`}
                    labelLine={false}
                  >
                    {stats.roleDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Login Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Logins (30 dias)</CardTitle>
            <CardDescription>Logins bem-sucedidos vs falhas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !loginTrend || loginTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={loginTrend}>
                  <XAxis 
                    dataKey="date" 
                    fontSize={10}
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Legend />
                  <Bar dataKey="success" name="Sucesso" fill="hsl(142, 76%, 36%)" />
                  <Bar dataKey="failed" name="Falha" fill="hsl(0, 72%, 51%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
