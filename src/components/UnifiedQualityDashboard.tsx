import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  FileText, 
  Target, 
  Zap, 
  Brain,
  BarChart3,
  Grid3X3,
  Activity,
  ListTodo,
  ClipboardList,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { unifiedQualityService } from '@/services/unifiedQualityService';
import QualityMatrix from './QualityMatrix';
import AIQualityInsights from './AIQualityInsights';
import QualityIndicatorDashboard from './QualityIndicatorDashboard';
import { QualityPerformanceWidget } from './QualityPerformanceWidget';
import QualityTrendsAnalyzer from './QualityTrendsAnalyzer';
import { PredictiveQualityWidget } from './PredictiveQualityWidget';
import SGQDashboardWidget from './SGQDashboardWidget';

export const UnifiedQualityDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['unified-quality-dashboard'],
    queryFn: async () => {
      const data = await unifiedQualityService.getQualityDashboard();
      console.log('Dashboard data received:', {
        hasPlansProgress: !!data?.plansProgress,
        plansCount: data?.plansProgress?.length || 0,
        plans: data?.plansProgress
      });
      return data;
    }
  });

  const { data: indicators } = useQuery({
    queryKey: ['quality-indicators-metrics'],
    queryFn: () => unifiedQualityService.getQualityIndicators()
  });

  if (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sistema de Gestão da Qualidade</h1>
        <p className="text-muted-foreground">
          Visão unificada com análises preditivas e inteligência artificial
        </p>
      </div>

      {/* Predictive Widget */}
      <PredictiveQualityWidget className="w-full" />

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Visão Geral</span>
            <span className="lg:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="sgq" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="hidden lg:inline">SGQ Widget</span>
            <span className="lg:hidden">SGQ</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden lg:inline">Performance</span>
            <span className="lg:hidden">Perf</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Tendências</span>
            <span className="lg:hidden">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span className="hidden lg:inline">Indicadores</span>
            <span className="lg:hidden">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden lg:inline">Matriz</span>
            <span className="lg:hidden">Matriz</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden lg:inline">Insights</span>
            <span className="lg:hidden">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="hidden lg:inline">Ações</span>
            <span className="lg:hidden">Ações</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{metrics?.totalNCs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.openNCs || 0} em aberto
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
                <Target className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{metrics?.actionPlans || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.overdueActions || 0} em atraso
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Resolução</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {indicators?.resolutionRate?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Meta: 80%</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualidade Geral</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {indicators?.qualityScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Índice consolidado</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesso rápido às funcionalidades mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/relatorios-integrados')}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">Ver Relatórios</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/gestao-funcionarios')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-xs">Equipe</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setSelectedTab('insights')}
                >
                  <Brain className="h-6 w-6" />
                  <span className="text-xs">IA Insights</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setSelectedTab('indicators')}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-xs">Métricas</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/nao-conformidades')}
                >
                  <ListTodo className="h-6 w-6" />
                  <span className="text-xs">Não Conformidades</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/plano-acao-5w2h')}
                >
                  <ClipboardList className="h-6 w-6" />
                  <span className="text-xs">Planos de Ação</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          {dashboardData?.recentNCs && dashboardData.recentNCs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Não Conformidades Recentes</CardTitle>
                <CardDescription>Últimas NCs registradas no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentNCs.slice(0, 5).map((nc) => (
                    <div key={nc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{nc.title}</h4>
                        <p className="text-sm text-muted-foreground">NC: {nc.nc_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={nc.severity === 'Alta' ? 'destructive' : 'secondary'}>
                          {nc.severity}
                        </Badge>
                        <Badge variant="outline">{nc.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sgq" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SGQDashboardWidget inDashboardView={true} />
            <div className="space-y-6">
              <PredictiveQualityWidget className="h-auto" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <QualityPerformanceWidget />
        </TabsContent>

        <TabsContent value="trends">
          <QualityTrendsAnalyzer />
        </TabsContent>

        <TabsContent value="indicators">
          <QualityIndicatorDashboard />
        </TabsContent>

        <TabsContent value="matrix">
          <QualityMatrix />
        </TabsContent>

        <TabsContent value="insights">
          <AIQualityInsights />
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planos de Ação</CardTitle>
                  <CardDescription>Acompanhe o progresso dos planos de ação</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/acoes-corretivas')}
                >
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-2 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.plansProgress && dashboardData.plansProgress.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.plansProgress.map((plan: any) => (
                    <div key={plan.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{plan.title}</h4>
                        <Badge variant="outline">{plan.status}</Badge>
                      </div>
                      <Progress value={plan.avgProgress} className="mb-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <span>Progresso: {plan.avgProgress}%</span>
                        <div className="flex items-center gap-4">
                          <span>{plan.completedItems}/{plan.totalItems} itens</span>
                          {plan.overdueItems > 0 && (
                            <span className="text-destructive flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {plan.overdueItems} atrasado{plan.overdueItems > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum plano de ação encontrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Crie planos de ação para gerenciar não conformidades e ações corretivas
                  </p>
                  <Button onClick={() => navigate('/acoes-corretivas')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Plano de Ação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedQualityDashboard;