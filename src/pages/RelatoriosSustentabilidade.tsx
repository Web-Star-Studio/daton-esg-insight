import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/MainLayout";
import { toast } from "sonner";
import { 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Leaf,
  Users,
  Building2,
  BookOpen,
  Sparkles
} from "lucide-react";
import { 
  getGRIReports, 
  createGRIReport, 
  deleteGRIReport,
  initializeGRIReport,
  GRIReport 
} from "@/services/griReports";
import { CreateGRIReportModal } from "@/components/CreateGRIReportModal";
import { GRIReportBuilderModal } from "@/components/GRIReportBuilderModal";

interface ReportStats {
  totalReports: number;
  draftReports: number;
  publishedReports: number;
  avgCompletion: number;
}

export default function RelatoriosSustentabilidade() {
  const [reports, setReports] = useState<GRIReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    draftReports: 0,
    publishedReports: 0,
    avgCompletion: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<GRIReport | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await getGRIReports();
      setReports(data);
      calculateStats(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error("Erro ao carregar relatórios de sustentabilidade");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reportData: GRIReport[]) => {
    const totalReports = reportData.length;
    const draftReports = reportData.filter(r => r.status === 'Rascunho' || r.status === 'Em Andamento').length;
    const publishedReports = reportData.filter(r => r.status === 'Publicado').length;
    const avgCompletion = totalReports > 0 
      ? Math.round(reportData.reduce((sum, r) => sum + r.completion_percentage, 0) / totalReports)
      : 0;

    setStats({
      totalReports,
      draftReports,
      publishedReports,
      avgCompletion,
    });
  };

  const handleCreateReport = async (reportData: Partial<GRIReport>) => {
    try {
      const newReport = await createGRIReport(reportData);
      
      // Initialize the report with mandatory indicators and default sections
      await initializeGRIReport(newReport.id);
      
      toast.success("Relatório GRI criado com sucesso!");
      setIsCreateModalOpen(false);
      loadReports();
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast.error("Erro ao criar relatório de sustentabilidade");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return;
    
    try {
      await deleteGRIReport(id);
      toast.success("Relatório excluído com sucesso!");
      loadReports();
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast.error("Erro ao excluir relatório");
    }
  };

  const handleEditReport = (report: GRIReport) => {
    setSelectedReport(report);
    setIsBuilderModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <Edit className="h-4 w-4" />;
      case 'Em Andamento':
        return <Clock className="h-4 w-4" />;
      case 'Em Revisão':
        return <AlertCircle className="h-4 w-4" />;
      case 'Finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Publicado':
        return <Eye className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return 'secondary';
      case 'Em Andamento':
        return 'default';
      case 'Em Revisão':
        return 'outline';
      case 'Finalizado':
        return 'default';
      case 'Publicado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios GRI criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Desenvolvimento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftReports}</div>
            <p className="text-xs text-muted-foreground">
              Rascunhos e em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedReports}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conclusão Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Dos relatórios ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Novo Relatório</span>
            </Button>

            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Biblioteca GRI</span>
            </Button>

            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Stakeholders</span>
            </Button>

            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Download className="h-6 w-6" />
              <span className="text-sm">Exportar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getStatusIcon(report.status)}
                    </div>
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Ano: {report.year}</span>
                        <span>•</span>
                        <Badge variant={getStatusColor(report.status) as any}>
                          {report.status}
                        </Badge>
                        <span>•</span>
                        <span>{report.completion_percentage}% completo</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={report.completion_percentage} 
                      className="w-24"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReport(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum relatório encontrado</p>
              <p className="text-sm mb-4">Crie seu primeiro relatório de sustentabilidade</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Relatório
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Todos os Relatórios</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-muted rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ano: {report.year} • GRI {report.gri_standard_version}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(report.status) as any}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progresso</span>
                      <span>{report.completion_percentage}%</span>
                    </div>
                    <Progress value={report.completion_percentage} />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    {report.published_at && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Publicado
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditReport(report)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-6 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhum relatório encontrado</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando seu primeiro relatório de sustentabilidade GRI
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Criar Relatório GRI
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios de Sustentabilidade</h1>
            <p className="text-muted-foreground">
              Crie e gerencie relatórios GRI completos com inteligência artificial
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Novo Relatório GRI
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {renderReports()}
          </TabsContent>

          <TabsContent value="indicators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Indicadores GRI</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Explore os indicadores disponíveis organizados por categoria
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6 text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">Universais</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Divulgações obrigatórias para todas as organizações
                      </p>
                      <Badge>12 indicadores</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-500/20">
                    <CardContent className="p-6 text-center">
                      <Leaf className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">Ambientais</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Impactos ambientais e gestão de recursos
                      </p>
                      <Badge variant="secondary">8 indicadores</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-500/20">
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Sociais</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Práticas trabalhistas e impactos sociais
                      </p>
                      <Badge variant="outline">6 indicadores</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-orange-500/20">
                    <CardContent className="p-6 text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                      <h3 className="font-semibold mb-2">Econômicos</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Performance econômica e impactos
                      </p>
                      <Badge variant="outline">4 indicadores</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Relatório</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Modelos prontos para diferentes tipos de organizações
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Templates em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreateGRIReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateReport}
        />

        {selectedReport && (
          <GRIReportBuilderModal
            isOpen={isBuilderModalOpen}
            onClose={() => {
              setIsBuilderModalOpen(false);
              setSelectedReport(null);
            }}
            report={selectedReport}
            onUpdate={loadReports}
          />
        )}
      </div>
    </MainLayout>
  );
}