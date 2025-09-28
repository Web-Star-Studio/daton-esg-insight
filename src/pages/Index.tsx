
import React from "react"
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
import UnifiedDashboardWidget from "@/components/UnifiedDashboardWidget"
import AdvancedNotificationPanel from "@/components/AdvancedNotificationPanel"
import SystemPerformanceMonitor from "@/components/SystemPerformanceMonitor"
import { OnboardingDashboardWidget } from "@/components/onboarding/OnboardingDashboardWidget"
import { FirstStepsSection } from "@/components/dashboard/FirstStepsSection"
import { useAuth } from "@/contexts/AuthContext"
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
  Zap,
  Settings,
  Bell,
  Factory,
  Recycle
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getESGDashboard } from "@/services/esg"
import { getEmissionStats } from "@/services/emissions"
import { getDashboardStats } from "@/services/goals"
import { getLicenseStats } from "@/services/licenses"
import { getWasteDashboard } from "@/services/waste"
import { useSystemOptimization } from "@/hooks/useSystemOptimization"
import SettingsModal from "@/components/SettingsModal"

const Index = () => {
  const { metrics, isOptimized } = useSystemOptimization();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { shouldShowOnboarding } = useAuth();
  
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Cabeçalho da página */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">Centro de Comando ESG</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            Dashboard inteligente com insights em tempo real e alertas preditivos para monitoramento ESG
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-8">
            <div></div>
            <div className="flex items-center space-x-2">
              <Badge variant={isOptimized ? 'default' : 'secondary'} className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Sistema {metrics.system_health.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs para diferentes visões do dashboard */}
        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="grid w-full grid-cols-5 mb-10">
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
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-10">

            {/* Onboarding Widget - Always visible at top for quick access */}
            {shouldShowOnboarding && (
              <OnboardingDashboardWidget showWidget={true} />
            )}

        {/* Primeira Linha - Cards de Resumo Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Card Próximas Metas */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Metas Ativas</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                  ) : (
                    goalStats?.activeGoals || 0
                  )}
                </p>
              </div>
              <Flag className="h-8 md:h-10 w-8 md:w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Médio</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="text-foreground font-medium">{goalStats?.averageProgress || 0}%</span>
                )}
              </div>
              <Progress value={goalStats?.averageProgress || 0} className="h-3" />
            </div>
          </Card>

          {/* Card Alertas Ativos */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Licenças Vencendo</p>
                <p className="text-2xl md:text-3xl font-bold text-warning">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                  ) : (
                    licenseStats?.upcoming || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Próximos 90 dias
                </p>
              </div>
              <AlertTriangle className="h-8 md:h-10 w-8 md:w-10 text-warning" />
            </div>
          </Card>

          {/* Card Status ESG */}
          <Card className="p-6 md:p-8 sm:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Score ESG</p>
                <p className="text-3xl md:text-4xl font-bold text-success">
                  {isLoading ? (
                    <Skeleton className="h-8 md:h-12 w-16 md:w-20" />
                  ) : (
                    `${esgData?.overall_esg_score || 0}/100`
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pontuação geral
                </p>
              </div>
              <Sparkles className="h-8 md:h-10 w-8 md:w-10 text-success" />
            </div>
          </Card>
        </div>

        {/* Segunda Linha - KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Emissões Totais */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Emissões Totais</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
                  ) : (
                    `${emissionStats?.total.toFixed(1) || 0} tCO₂e`
                  )}
                </p>
              </div>
              <Zap className="h-8 md:h-10 w-8 md:w-10 text-destructive" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Dados atualizados
            </div>
          </Card>

          {/* Escopo 1 */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Emissões Escopo 1</p>
                <p className="text-2xl md:text-3xl font-bold text-warning">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
                  ) : (
                    `${emissionStats?.escopo1.toFixed(1) || 0} tCO₂e`
                  )}
                </p>
              </div>
              <Factory className="h-8 md:h-10 w-8 md:w-10 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">
              Emissões diretas
            </p>
          </Card>

          {/* Escopo 2 */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Emissões Escopo 2</p>
                <p className="text-2xl md:text-3xl font-bold text-warning">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
                  ) : (
                    `${emissionStats?.escopo2.toFixed(1) || 0} tCO₂e`
                  )}
                </p>
              </div>
              <Zap className="h-8 md:h-10 w-8 md:w-10 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">
              Energia adquirida
            </p>
          </Card>

          {/* Taxa de Reciclagem */}
          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Taxa de Reciclagem</p>
                <p className="text-2xl md:text-3xl font-bold text-success">
                  {isLoading ? (
                    <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                  ) : (
                    `${wasteStats?.recycling_rate_percent !== undefined 
                      ? wasteStats.recycling_rate_percent 
                      : 0}%`
                  )}
                </p>
              </div>
              <Recycle className="h-8 md:h-10 w-8 md:w-10 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              Resíduos reciclados
            </p>
          </Card>
        </div>

        {/* Terceira Linha - Conteúdo Dinâmico */}
        <div className="space-y-8">
          {/* First Steps Section - Show for users who completed onboarding but need guidance */}
          {!shouldShowOnboarding && (
            <FirstStepsSection completedModules={[]} />
          )}
          
          <div className="w-full">
            <AIProcessingStatusWidget />
          </div>
          <div className="w-full">
            <SGQDashboardWidget />
          </div>
          <div className="w-full">
            <UnifiedDashboardWidget />
          </div>
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
          
          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SystemPerformanceMonitor />
              <AdvancedNotificationPanel />
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Modal */}
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
};

export default Index;
