import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Activity, Users, FileText, Target } from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';
import QualityTooltip from '@/components/QualityTooltip';

const QualityDashboard = () => {
  // Real data from quality dashboard with enhanced loading and error handling
  const { data: dashboard, isLoading, error: dashboardError } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityManagementService.getQualityDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const { data: ncStats, isLoading: ncStatsLoading, error: ncStatsError } = useQuery({
    queryKey: ['nc-stats'],
    queryFn: () => qualityManagementService.getNonConformityStats(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: actionPlansProgress, isLoading: actionPlansLoading } = useQuery({
    queryKey: ['action-plans-progress'],
    queryFn: () => qualityManagementService.getActionPlansProgress(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: qualityIndicators, isLoading: qualityIndicatorsLoading } = useQuery({
    queryKey: ['quality-indicators'],
    queryFn: () => qualityManagementService.getQualityIndicators(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Aggregated loading state
  const isAnyLoading = isLoading || ncStatsLoading || actionPlansLoading || qualityIndicatorsLoading;

  // Loading skeleton
  if (isAnyLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if ((dashboardError || ncStatsError) && !dashboard && !ncStats) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Modo Offline:</strong> Exibindo dados de demonstração. 
          Algumas funcionalidades podem estar limitadas. 
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="ml-2 p-0 h-auto"
          >
            Tentar reconectar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Process data with fallbacks for better UX
  const pieData = ncStats?.bySeverity ? Object.entries(ncStats.bySeverity).map(([key, value]) => ({
    name: key,
    value: value as number
  })) : [
    { name: 'Baixa', value: 0 },
    { name: 'Média', value: 0 },
    { name: 'Alta', value: 0 },
    { name: 'Crítica', value: 0 }
  ];

  const trendData = ncStats?.monthly ? Object.entries(ncStats.monthly).map(([month, count]) => ({
    month,
    count: count as number
  })) : [];

  // Dashboard metrics with fallback values
  const metrics = {
    totalNonConformities: dashboard?.metrics?.totalNCs || 0,
    openNonConformities: dashboard?.metrics?.openNCs || 0,
    criticalRisks: dashboard?.metrics?.criticalRisks || 0,
    totalRisks: dashboard?.metrics?.totalRisks || 0,
    activeActionPlans: dashboard?.metrics?.actionPlans || 0,
    overdueActions: dashboard?.metrics?.overdueActions || 0,
    qualityScore: qualityIndicators?.qualityScore || 85
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <QualityTooltip 
              title="Não Conformidades"
              description="Total de não conformidades registradas no sistema. Inclui todas as NCs abertas, em andamento e fechadas."
            >
              <CardTitle className="text-sm font-medium">Não Conformidades</CardTitle>
            </QualityTooltip>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom-2 duration-500">
              {metrics.totalNonConformities}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.openNonConformities > 0 ? `${metrics.openNonConformities} em aberto` : 'Nenhuma em aberto'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <QualityTooltip 
              title="Riscos Críticos"
              description="Riscos classificados como críticos ou altos que requerem atenção imediata da gestão."
            >
              <CardTitle className="text-sm font-medium">Riscos Críticos</CardTitle>
            </QualityTooltip>
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive animate-in slide-in-from-bottom-2 duration-700">
              {metrics.criticalRisks}
            </div>
            <p className="text-xs text-muted-foreground">
              de {metrics.totalRisks} riscos totais
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <QualityTooltip 
              title="Planos de Ação"
              description="Planos de ação ativos para tratamento de não conformidades e implementação de melhorias."
              variant="help"
            >
              <CardTitle className="text-sm font-medium">Planos de Ação</CardTitle>
            </QualityTooltip>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom-2 duration-900">
              {metrics.activeActionPlans}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.overdueActions > 0 ? `${metrics.overdueActions} em atraso` : 'Todos em dia'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <QualityTooltip 
              title="Pontuação da Qualidade"
              description="Índice geral de qualidade baseado na performance de NCs, planos de ação e indicadores do SGQ."
            >
              <CardTitle className="text-sm font-medium">Pontuação da Qualidade</CardTitle>
            </QualityTooltip>
            {metrics.qualityScore >= 80 ? (
              <TrendingUp className="h-4 w-4 text-success animate-bounce" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive animate-pulse" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom-2 duration-1000">
              {metrics.qualityScore}%
            </div>
            <Progress 
              value={metrics.qualityScore} 
              className="mt-2 transition-all duration-1000" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.qualityScore >= 90 ? 'Excelente' : 
               metrics.qualityScore >= 80 ? 'Muito Bom' :
               metrics.qualityScore >= 70 ? 'Bom' : 
               metrics.qualityScore >= 60 ? 'Regular' : 'Precisa melhorar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for overdue actions */}
      {metrics.overdueActions > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {metrics.overdueActions} ações em atraso que precisam de atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>NCs por Severidade</CardTitle>
              <CardDescription>Distribuição das não conformidades</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData && pieData.some(item => item.value > 0) ? (
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
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Excelente!</p>
                    <p className="text-sm">Nenhuma não conformidade registrada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progresso dos Planos de Ação</CardTitle>
              <CardDescription>Status dos planos em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionPlansProgress && actionPlansProgress.length > 0 ? (
                  actionPlansProgress.slice(0, 5).map((plan, index) => (
                    <div key={plan.id || index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate">{plan.title}</span>
                        <Badge variant={plan.status === 'Concluído' ? 'default' : 'secondary'}>
                          {plan.avgProgress || 0}%
                        </Badge>
                      </div>
                      <Progress value={plan.avgProgress || 0} />
                      <div className="text-xs text-muted-foreground">
                        Status: {plan.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum plano ativo</p>
                    <p className="text-sm">Crie planos de ação para melhorar a qualidade</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de NCs por Mês</CardTitle>
              <CardDescription>Evolução histórica das não conformidades</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Dados históricos insuficientes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Não Conformidades Recentes</CardTitle>
              <CardDescription>Últimas ocorrências registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard?.recentNCs && dashboard.recentNCs.length > 0 ? (
                  dashboard.recentNCs.map((nc, index) => (
                    <div key={nc.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{nc.title}</p>
                        <p className="text-sm text-muted-foreground">{nc.nc_number}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          nc.severity === 'Alta' ? 'destructive' : 
                          nc.severity === 'Média' ? 'default' : 
                          'secondary'
                        }>
                          {nc.severity}
                        </Badge>
                        <Badge variant="outline">{nc.status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma não conformidade recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityDashboard;