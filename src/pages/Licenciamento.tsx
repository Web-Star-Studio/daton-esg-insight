import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Shield, 
  FileText, 
  Brain, 
  Workflow,
  Plus,
  Upload,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import { AIExtractionDashboard } from '@/components/AIExtractionDashboard'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getLicenses, getLicenseStats, type LicenseListItem } from '@/services/licenses'
import { toast } from 'sonner'

export default function Licenciamento() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Fetch real license data
  const { data: licenses, isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => getLicenses(),
    retry: 3
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['license-stats'],
    queryFn: getLicenseStats,
    retry: 3
  })

  // Calculate real stats from data
  const realStats = {
    totalLicenses: stats?.total || 0,
    activeCount: stats?.active || 0,
    expiringSoon: stats?.upcoming || 0,
    pendingRenewal: stats?.expired || 0,
    complianceRate: stats?.total ? Math.round((stats.active / stats.total) * 100) : 0,
    avgProcessingTime: 45 // This would need a different query to calculate
  }

  const workflows = [
    {
      id: 1,
      title: "Análise Automática de Documentos",
      description: "Upload e processamento inteligente de licenças ambientais com IA",
      icon: Brain,
      action: () => navigate('/licenciamento/processar'),
      color: "bg-blue-500",
      stats: { processed: licenses?.length || 0, pending: 0 }
    },
    {
      id: 2,
      title: "Reconciliação de Dados",
      description: "Validação e aprovação de informações extraídas automaticamente",
      icon: CheckCircle,
      action: () => navigate('/licenciamento/reconciliacao'),
      color: "bg-green-500",
      stats: { approved: stats?.active || 0, pending: 0 }
    },
    {
      id: 3,
      title: "Nova Licença Manual",
      description: "Cadastro manual de licenças e documentos relacionados",
      icon: FileText,
      action: () => navigate('/licenciamento/novo'),
      color: "bg-purple-500",
      stats: { created: stats?.total || 0, thisMonth: 0 }
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Ativa": { variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
      "Vencida": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Em Renovação": { variant: "secondary" as const, className: "bg-accent/10 text-accent border-accent/20" },
      "Suspensa": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap["Ativa"];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Licenciamento Ambiental</h1>
            <p className="text-muted-foreground">
              Gestão completa de licenças ambientais com análise inteligente
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/licenciamento/processar')}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Processar Licença
            </Button>
            <Button 
              onClick={() => navigate('/licenciamento/novo')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Licença
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <Shield className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-2">
              <FileText className="w-4 h-4" />
              Licenças
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-2">
              <Brain className="w-4 h-4" />
              Análise IA
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Workflow className="w-4 h-4" />
              Workflow
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <div className="text-2xl font-bold">{realStats.totalLicenses}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {realStats.activeCount} ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <div className="text-2xl font-bold text-yellow-600">{realStats.expiringSoon}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Próximos 60 dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">{realStats.complianceRate}%</div>
                      <Progress value={realStats.complianceRate} className="mt-2" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vencidas/Renovação</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <div className="text-2xl font-bold text-red-600">{realStats.pendingRenewal}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Requerem atenção
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${workflow.color} text-white`}>
                        <workflow.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{workflow.title}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        {Object.entries(workflow.stats).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}:
                            </span>
                            <Badge variant="secondary">{value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={workflow.action} className="w-full">
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Licenças</CardTitle>
                <CardDescription>
                  Gerencie todas as licenças ambientais da organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {licensesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : licenses && licenses.length > 0 ? (
                  <div className="space-y-4">
                    {licenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{license.name}</h4>
                            {getStatusBadge(license.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {license.type} • {license.issuing_body} • Vencimento: {new Date(license.expiration_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/licenciamento/${license.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhuma licença cadastrada</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/licenciamento/novo')}
                    >
                      Adicionar Primeira Licença
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-4">
            <AIExtractionDashboard />
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Trabalho</CardTitle>
                <CardDescription>
                  Acompanhe o progresso dos processos de licenciamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium">Upload de Documento</h3>
                        <p className="text-sm text-muted-foreground">Faça upload da licença para análise</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => navigate('/licenciamento/processar')}
                    >
                      Iniciar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium">Análise Automática</h3>
                        <p className="text-sm text-muted-foreground">IA extrai informações automaticamente</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Automático</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium">Reconciliação</h3>
                        <p className="text-sm text-muted-foreground">Revisar e aprovar dados extraídos</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/licenciamento/reconciliacao')}
                    >
                      Revisar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}