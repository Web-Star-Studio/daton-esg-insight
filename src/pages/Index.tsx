import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SGQDashboardWidget from "@/components/SGQDashboardWidget"
import { AIProcessingStatusWidget } from "@/components/AIProcessingStatusWidget"
import { SmartNotificationSystem } from "@/components/SmartNotificationSystem"
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem"
import { 
  Flag, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  CheckCircle,
  Clock,
  Circle,
  Brain,
  BarChart3,
  Users,
  Activity,
  Target,
  AlertCircle,
  Zap
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getESGDashboard } from "@/services/esg"
import { getEmissionStats } from "@/services/emissions"
import { getDashboardStats } from "@/services/goals"
import { getLicenseStats } from "@/services/licenses"
import { getWasteDashboard } from "@/services/waste"

const Index = () => {
  // Fetch real data from various services
  const { data: esgData, isLoading: esgLoading } = useQuery({
    queryKey: ['esg-dashboard'],
    queryFn: getESGDashboard,
  })

  const { data: emissionStats, isLoading: emissionsLoading } = useQuery({
    queryKey: ['emission-stats'],
    queryFn: getEmissionStats,
  })

  const { data: goalStats, isLoading: goalsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const { data: licenseStats, isLoading: licensesLoading } = useQuery({
    queryKey: ['license-stats'],
    queryFn: getLicenseStats,
  })

  const { data: wasteStats, isLoading: wasteLoading } = useQuery({
    queryKey: ['waste-dashboard'],
    queryFn: () => getWasteDashboard(),
  })

  const isLoading = esgLoading || emissionsLoading || goalsLoading || licensesLoading || wasteLoading

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Centro de Comando ESG</h1>
          <p className="text-muted-foreground">
            Dashboard inteligente com insights em tempo real e alertas preditivos
          </p>
        </div>

        {/* Tabs para diferentes visões do dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Alertas Inteligentes</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Insights de IA</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

        {/* Primeira Linha - Cards de Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Próximas Metas */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
              <Flag className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-4 w-3/4" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {goalStats?.activeGoals || 0} metas ativas em andamento
                </p>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso Médio</span>
                  {isLoading ? (
                    <Skeleton className="h-3 w-8" />
                  ) : (
                    <span className="text-foreground font-medium">{goalStats?.averageProgress || 0}%</span>
                  )}
                </div>
                <Progress value={goalStats?.averageProgress || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Card Alertas Ativos */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licenças Próximas ao Vencimento</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-4 w-3/4" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {licenseStats?.upcoming || 0} licenças vencendo em 90 dias
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card Status ESG */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score ESG</CardTitle>
              <Sparkles className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {esgData?.overall_esg_score || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Pontuação geral ESG da empresa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segunda Linha - KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Emissões Totais */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões Totais</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {emissionStats?.total.toFixed(1) || 0} tCO₂e
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Dados atualizados
              </div>
            </CardContent>
          </Card>

          {/* Escopo 1 */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões Escopo 1</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {emissionStats?.escopo1.toFixed(1) || 0} tCO₂e
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Emissões diretas
              </div>
            </CardContent>
          </Card>

          {/* Escopo 2 */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões Escopo 2</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {emissionStats?.escopo2.toFixed(1) || 0} tCO₂e
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Energia adquirida
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Reciclagem */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Reciclagem</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {(wasteStats as any)?.recycling_rate_percent || 0}%
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Resíduos reciclados
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terceira Linha - Conteúdo Dinâmico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* AI Processing Status Widget */}
          <AIProcessingStatusWidget />
          
          {/* SGQ Dashboard Widget */}
          <SGQDashboardWidget />

          {/* Card Próximas Tarefas */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Próximas Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Atualizar relatório trimestral de emissões</span>
                  <Badge variant="outline" className="ml-auto text-xs">Pendente</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm text-foreground">Revisar metas de redução de carbono 2024</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-warning/10 text-warning">Em Andamento</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Instalar sensores IoT de emissão</span>
                  <Badge variant="outline" className="ml-auto text-xs">Pendente</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm line-through text-muted-foreground">Enviar relatório de água</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-success/10 text-success">Concluído</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent" />
                    Métricas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Eficiência Energética</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Redução de Resíduos</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Compliance Regulatório</span>
                      <span className="text-sm text-muted-foreground">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Goal Tracking */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    Acompanhamento de Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Redução CO₂ 2024</p>
                        <p className="text-xs text-muted-foreground">Meta: -15%</p>
                      </div>
                      <Badge variant="secondary" className="bg-success/10 text-success">No prazo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Energia Renovável</p>
                        <p className="text-xs text-muted-foreground">Meta: 60%</p>
                      </div>
                      <Badge variant="secondary" className="bg-warning/10 text-warning">Atenção</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Diversidade</p>
                        <p className="text-xs text-muted-foreground">Meta: 40%</p>
                      </div>
                      <Badge variant="secondary" className="bg-success/10 text-success">Alcançado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <IntelligentAlertsSystem />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Processing Status */}
              <AIProcessingStatusWidget />
              
              {/* Smart Insights */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent" />
                    Insights Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
                      <p className="text-sm font-medium">Oportunidade Identificada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Implementação de painéis solares pode reduzir 23% das emissões Escopo 2
                      </p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg border-l-4 border-warning">
                      <p className="text-sm font-medium">Atenção Necessária</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        3 licenças ambientais precisam de renovação nos próximos 60 dias
                      </p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-lg border-l-4 border-success">
                      <p className="text-sm font-medium">Meta Superada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Taxa de reciclagem 12% acima da meta anual estabelecida
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Index;
