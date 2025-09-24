import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Share, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { getIntegratedReports } from "@/services/integratedReports";
import { getESGDashboard } from "@/services/esg";


export default function RelatoriosIntegrados() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: reports } = useQuery({
    queryKey: ['integrated-reports'],
    queryFn: getIntegratedReports
  });

  const { data: esgData } = useQuery({
    queryKey: ['esg-dashboard'],
    queryFn: getESGDashboard
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Publicado':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Publicado</Badge>;
      case 'Em Revisão':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Em Revisão</Badge>;
      case 'Rascunho':
        return <Badge variant="outline"><Edit className="mr-1 h-3 w-3" />Rascunho</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios ESG Integrados</h1>
        <p className="text-muted-foreground">
          Relatórios consolidados de sustentabilidade e performance ESG
        </p>
      </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard ESG</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score ESG Geral</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(esgData?.overall_esg_score || 0)}`}>
                  {esgData?.overall_esg_score || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Score consolidado ESG
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Environmental</CardTitle>
                <div className="h-4 w-4 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(esgData?.environmental?.score || 0)}`}>
                  {esgData?.environmental?.score || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aspectos ambientais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Social</CardTitle>
                <div className="h-4 w-4 bg-blue-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(esgData?.social?.score || 0)}`}>
                  {esgData?.social?.score || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aspectos sociais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Governance</CardTitle>
                <div className="h-4 w-4 bg-purple-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(esgData?.governance?.score || 0)}`}>
                  {esgData?.governance?.score || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Governança corporativa
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Ambiental</CardTitle>
                <CardDescription>Principais KPIs ambientais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {esgData?.environmental?.kpis?.slice(0, 4).map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{kpi.value} {kpi.unit}</span>
                      {kpi.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum KPI ambiental disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Social</CardTitle>
                <CardDescription>Principais KPIs sociais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {esgData?.social?.kpis?.slice(0, 4).map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{kpi.value} {kpi.unit}</span>
                      {kpi.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum KPI social disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Governança</CardTitle>
                <CardDescription>Principais KPIs de governança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {esgData?.governance?.kpis?.slice(0, 4).map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{kpi.value} {kpi.unit}</span>
                      {kpi.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum KPI de governança disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Score ESG Consolidado</CardTitle>
              <CardDescription>Visualização detalhada do desempenho por pilar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Environmental</span>
                  <div className="flex items-center gap-2">
                    <Progress value={esgData?.environmental?.score || 0} className="w-32" />
                    <span className={`text-sm font-bold ${getScoreColor(esgData?.environmental?.score || 0)}`}>
                      {esgData?.environmental?.score || 0}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Social</span>
                  <div className="flex items-center gap-2">
                    <Progress value={esgData?.social?.score || 0} className="w-32" />
                    <span className={`text-sm font-bold ${getScoreColor(esgData?.social?.score || 0)}`}>
                      {esgData?.social?.score || 0}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Governance</span>
                  <div className="flex items-center gap-2">
                    <Progress value={esgData?.governance?.score || 0} className="w-32" />
                    <span className={`text-sm font-bold ${getScoreColor(esgData?.governance?.score || 0)}`}>
                      {esgData?.governance?.score || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Score Geral ESG</span>
                  <div className="flex items-center gap-2">
                    <Progress value={esgData?.overall_esg_score || 0} className="w-40" />
                    <span className={`text-xl font-bold ${getScoreColor(esgData?.overall_esg_score || 0)}`}>
                      {esgData?.overall_esg_score || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Relatórios Publicados</CardTitle>
                  <CardDescription>Histórico de relatórios de sustentabilidade</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Relatório
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{report.report_title}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.framework} • {report.report_type} • 
                          {new Date(report.reporting_period_start).toLocaleDateString()} - 
                          {new Date(report.reporting_period_end).toLocaleDateString()}
                        </p>
                        {report.overall_esg_score && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Score ESG:</span>
                            <Badge variant="outline" className={getScoreColor(report.overall_esg_score)}>
                              {report.overall_esg_score}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="mr-2 h-4 w-4" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum relatório encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro relatório ESG integrado
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Relatório
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Relatórios</CardTitle>
              <CardDescription>Modelos padronizados para relatórios ESG</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para templates de relatórios
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá templates GRI, SASB, TCFD e Relatório Integrado
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Avançados</CardTitle>
              <CardDescription>Análises detalhadas e insights ESG</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para analytics avançados
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá benchmarking, projeções, correlações e insights preditivos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
    }
  );
}