import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Activity, Users, FileText } from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';

const QualityDashboard = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityManagementService.getQualityDashboard(),
  });

  const { data: ncStats } = useQuery({
    queryKey: ['nc-stats'],
    queryFn: () => qualityManagementService.getNonConformityStats(),
  });

  const { data: actionPlansProgress } = useQuery({
    queryKey: ['action-plans-progress'],
    queryFn: () => qualityManagementService.getActionPlansProgress(),
  });

  const { data: qualityIndicators } = useQuery({
    queryKey: ['quality-indicators'],
    queryFn: () => qualityManagementService.getQualityIndicators(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const pieData = ncStats ? Object.entries(ncStats.bySeverity).map(([key, value]) => ({
    name: key,
    value: value as number
  })) : [];

  const trendData = ncStats ? Object.entries(ncStats.monthly).map(([month, count]) => ({
    month,
    count: count as number
  })) : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.metrics.totalNCs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.metrics.openNCs || 0} em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riscos Críticos</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.metrics.highRisks || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {dashboard?.metrics.totalRisks || 0} riscos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos de Ação</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.metrics.actionPlans || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.metrics.overdueActions || 0} em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Índice Qualidade</CardTitle>
            {qualityIndicators && qualityIndicators.qualityScore >= 80 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityIndicators?.qualityScore || 0}%</div>
            <Progress value={qualityIndicators?.qualityScore || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dashboard?.metrics.overdueActions > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {dashboard.metrics.overdueActions} ações em atraso que requerem atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>NCs por Severidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progresso dos Planos de Ação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionPlansProgress?.slice(0, 5).map((plan) => (
                  <div key={plan.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{plan.title}</span>
                      <Badge variant={plan.status === 'Concluído' ? 'default' : 'secondary'}>
                        {plan.avgProgress}%
                      </Badge>
                    </div>
                    <Progress value={plan.avgProgress} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de NCs por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Recent NCs */}
          <Card>
            <CardHeader>
              <CardTitle>Não Conformidades Recentes</CardTitle>
              <CardDescription>Últimas ocorrências registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard?.recentNCs?.map((nc) => (
                  <div key={nc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{nc.title}</p>
                      <p className="text-sm text-muted-foreground">{nc.nc_number}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={nc.severity === 'Alta' ? 'destructive' : nc.severity === 'Média' ? 'default' : 'secondary'}>
                        {nc.severity}
                      </Badge>
                      <Badge variant="outline">{nc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityDashboard;