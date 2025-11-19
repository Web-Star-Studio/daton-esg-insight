import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUserAndCompany } from "@/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  Target,
  AlertCircle
} from "lucide-react";

export function NonConformitiesAdvancedDashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["nc-advanced-dashboard"],
    queryFn: async () => {
      // Get user's company
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company ID not found');
      }

      // Fetch non-conformities with all related data
      const { data: nonConformities, error } = await supabase
        .from("non_conformities")
        .select(`
          *,
          responsible:responsible_user_id(full_name)
        `)
        .eq('company_id', userAndCompany.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate dashboard metrics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Current month stats
      const currentMonthNCs = nonConformities.filter(nc => {
        const ncDate = new Date(nc.created_at);
        return ncDate.getMonth() === currentMonth && ncDate.getFullYear() === currentYear;
      });

      // Last month stats
      const lastMonthNCs = nonConformities.filter(nc => {
        const ncDate = new Date(nc.created_at);
        return ncDate.getMonth() === lastMonth && ncDate.getFullYear() === lastMonthYear;
      });

      // Calculate trends
      const currentMonthCount = currentMonthNCs.length;
      const lastMonthCount = lastMonthNCs.length;
      const trend = lastMonthCount === 0 
        ? (currentMonthCount > 0 ? 100 : 0)
        : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;

      // Stats by severity
      const bySeverity = nonConformities.reduce((acc, nc) => {
        acc[nc.severity] = (acc[nc.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Stats by status
      const byStatus = nonConformities.reduce((acc, nc) => {
        acc[nc.status] = (acc[nc.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Stats by source
      const bySource = nonConformities.reduce((acc, nc) => {
        acc[nc.source] = (acc[nc.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Monthly trend data (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonth = (currentMonth - i + 12) % 12;
        const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;
        const monthName = new Date(targetYear, targetMonth).toLocaleDateString('pt-BR', { month: 'short' });
        
        const monthNCs = nonConformities.filter(nc => {
          const ncDate = new Date(nc.created_at);
          return ncDate.getMonth() === targetMonth && ncDate.getFullYear() === targetYear;
        });

        monthlyData.push({
          month: monthName,
          total: monthNCs.length,
          criticas: monthNCs.filter(nc => nc.severity === 'Crítica').length,
          fechadas: monthNCs.filter(nc => nc.status === 'Fechada').length,
        });
      }

      // Resolution rate
      const totalNCs = nonConformities.length;
      const resolvedNCs = nonConformities.filter(nc => nc.status === 'Fechada').length;
      const resolutionRate = totalNCs > 0 ? (resolvedNCs / totalNCs) * 100 : 0;

      // Overdue NCs
      const overdueNCs = nonConformities.filter(nc => {
        if (!nc.due_date || nc.status === 'Fechada') return false;
        return new Date(nc.due_date) < now;
      });

      // Average resolution time (in days)
      const resolvedNCsWithDates = nonConformities.filter(nc => 
        nc.status === 'Fechada' && nc.completion_date
      );
      const avgResolutionTime = resolvedNCsWithDates.length > 0
        ? resolvedNCsWithDates.reduce((sum, nc) => {
            const created = new Date(nc.created_at);
            const completed = new Date(nc.completion_date);
            return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedNCsWithDates.length
        : 0;

      return {
        metrics: {
          total: totalNCs,
          currentMonth: currentMonthCount,
          lastMonth: lastMonthCount,
          trend,
          resolutionRate,
          overdue: overdueNCs.length,
          avgResolutionTime: Math.round(avgResolutionTime),
          critical: nonConformities.filter(nc => nc.severity === 'Crítica' && nc.status !== 'Fechada').length
        },
        charts: {
          severity: Object.entries(bySeverity).map(([key, value]) => ({ name: key, value })),
          status: Object.entries(byStatus).map(([key, value]) => ({ name: key, value })),
          source: Object.entries(bySource).map(([key, value]) => ({ name: key, value })),
          monthly: monthlyData
        },
        recentNCs: nonConformities.slice(0, 5)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const COLORS = {
    severity: {
      'Crítica': '#ef4444',
      'Alta': '#f97316', 
      'Média': '#eab308',
      'Baixa': '#22c55e'
    },
    status: {
      'Aberta': '#ef4444',
      'Em Análise': '#eab308',
      'Em Correção': '#3b82f6',
      'Fechada': '#22c55e',
      'Aprovada': '#8b5cf6'
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    const errorMessage = error?.message || 'Erro desconhecido';
    const isCompanyError = errorMessage.includes('Company ID');
    
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {isCompanyError ? 'Acesso Negado' : 'Dados Indisponíveis'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isCompanyError 
                ? 'Você precisa estar associado a uma empresa para visualizar os dados.'
                : 'Não foi possível carregar os dados das não conformidades.'
              }
            </p>
            <Badge variant="outline">{errorMessage}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, charts } = dashboardData || { 
    metrics: {
      total: 0,
      currentMonth: 0,
      lastMonth: 0,
      trend: 0,
      resolutionRate: 0,
      overdue: 0,
      avgResolutionTime: 0,
      critical: 0
    },
    charts: {
      severity: [],
      status: [],
      source: [],
      monthly: []
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de NCs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.currentMonth} {metrics.currentMonth === 1 ? 'nova' : 'novas'} em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              {metrics.total > 0 && metrics.currentMonth === 0 && (
                <span className="block text-muted-foreground/70">
                  ({metrics.total} histórico)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência Mensal</CardTitle>
            {metrics.trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.trend >= 0 ? '+' : ''}{metrics.trend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs. mês anterior ({metrics.lastMonth || 0} NCs)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.resolutionRate.toFixed(1)}%</div>
            <Progress value={metrics.resolutionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Críticas Abertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.critical}</div>
            <p className="text-xs text-muted-foreground">
              requerem ação imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs em Atraso</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              passaram do prazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground">
              dias em média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Eficiência do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resolução no prazo</span>
                <span>{Math.max(0, 100 - (metrics.overdue / metrics.total * 100)).toFixed(0)}%</span>
              </div>
              <Progress value={Math.max(0, 100 - (metrics.overdue / metrics.total * 100))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Severidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.severity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {charts.severity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS.severity[entry.name] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.status}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total"
                />
                <Area
                  type="monotone"
                  dataKey="criticas"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.8}
                  name="Críticas"
                />
                <Line
                  type="monotone"
                  dataKey="fechadas"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Fechadas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Source Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Fonte</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.source} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar 
                dataKey="value" 
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}