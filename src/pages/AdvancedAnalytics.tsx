import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService, AnalyticsData, UserActivityData, SystemPerformanceData } from '@/services/analyticsService';
import { toast } from 'sonner';

const AdvancedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [emissionsData, setEmissionsData] = useState<AnalyticsData | null>(null);
  const [qualityData, setQualityData] = useState<AnalyticsData | null>(null);
  const [complianceData, setComplianceData] = useState<AnalyticsData | null>(null);
  const [userActivityData, setUserActivityData] = useState<UserActivityData | null>(null);
  const [systemPerformanceData, setSystemPerformanceData] = useState<SystemPerformanceData | null>(null);

  const companyId = 'mock-company-id'; // This would come from auth context

  useEffect(() => {
    loadAnalyticsData();
  }, [refreshKey]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [emissions, quality, compliance, userActivity, systemPerformance] = await Promise.all([
        analyticsService.getEmissionsAnalytics(companyId, 'quarter'),
        analyticsService.getQualityAnalytics(companyId),
        analyticsService.getComplianceAnalytics(companyId),
        analyticsService.getUserActivityAnalytics(),
        analyticsService.getSystemPerformanceAnalytics()
      ]);

      setEmissionsData(emissions);
      setQualityData(quality);
      setComplianceData(compliance);
      setUserActivityData(userActivity);
      setSystemPerformanceData(systemPerformance);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatValue = (value: number, decimals: number = 2) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Avançados</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e insights inteligentes do sistema
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emissões Totais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(emissionsData?.metrics.total || 0)} tCO2e
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getChangeIcon(emissionsData?.metrics.change || 0)}
              <span>
                {Math.abs(emissionsData?.metrics.change || 0).toFixed(1)}% vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Qualidade</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(qualityData?.metrics.qualityScore || 0, 0)}%
            </div>
            <Progress 
              value={qualityData?.metrics.qualityScore || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(complianceData?.metrics.complianceScore || 0, 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceData?.metrics.overdueTasks || 0} tarefas em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userActivityData?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Engajamento: {formatValue(userActivityData?.userEngagement || 0, 1)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emissions">Emissões</TabsTrigger>
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências Principais</CardTitle>
                <CardDescription>Evolução dos principais indicadores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emissionsData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Emissões (tCO2e)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade dos Usuários</CardTitle>
                <CardDescription>Top ações no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userActivityData?.topActions.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Insights Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {emissionsData?.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceData?.metrics.overdueTasks ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <p className="text-sm">
                      {complianceData.metrics.overdueTasks} tarefas em atraso
                    </p>
                  </div>
                ) : null}
                {qualityData?.metrics.criticalNonConformities ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <p className="text-sm">
                      {qualityData.metrics.criticalNonConformities} NCs críticas
                    </p>
                  </div>
                ) : null}
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-sm">Sistema funcionando normalmente</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tempo de Resposta</span>
                  <Badge variant="outline">
                    {formatValue(systemPerformanceData?.responseTime || 0, 0)}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Uptime</span>
                  <Badge variant="outline">
                    {formatValue(systemPerformanceData?.uptime || 0, 2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Erro</span>
                  <Badge variant="outline">
                    {formatValue(systemPerformanceData?.errorRate || 0, 3)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Escopo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Escopo 1', value: emissionsData?.metrics.scope1 || 0 },
                        { name: 'Escopo 2', value: emissionsData?.metrics.scope2 || 0 },
                        { name: 'Escopo 3', value: emissionsData?.metrics.scope3 || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendência de Emissões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={emissionsData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights de Emissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emissionsData?.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NCs Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {qualityData?.metrics.openNonConformities || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NCs Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {qualityData?.metrics.criticalNonConformities || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(qualityData?.metrics.resolutionRate || 0, 1)}%
                </div>
                <Progress value={qualityData?.metrics.resolutionRate || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendência de Não Conformidades</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={qualityData?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    name="Não Conformidades"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Score Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(complianceData?.metrics.complianceScore || 0, 0)}%
                </div>
                <Progress value={complianceData?.metrics.complianceScore || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tarefas Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {complianceData?.metrics.completedTasks || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Em Atraso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {complianceData?.metrics.overdueTasks || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Licenças Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {complianceData?.metrics.expiredLicenses || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights de Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {complianceData?.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(systemPerformanceData?.responseTime || 0, 0)}ms
                </div>
                <Progress 
                  value={Math.min(100, (300 - (systemPerformanceData?.responseTime || 0)) / 3)} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatValue(systemPerformanceData?.uptime || 0, 2)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(systemPerformanceData?.throughput || 0, 0)}
                </div>
                <p className="text-xs text-muted-foreground">req/min</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">CPU</span>
                  <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.cpu || 0, 1)}%</span>
                </div>
                <Progress value={systemPerformanceData?.resourceUsage.cpu || 0} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Memória</span>
                  <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.memory || 0, 1)}%</span>
                </div>
                <Progress value={systemPerformanceData?.resourceUsage.memory || 0} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Armazenamento</span>
                  <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.storage || 0, 1)}%</span>
                </div>
                <Progress value={systemPerformanceData?.resourceUsage.storage || 0} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;