import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  AlertCircle,
  Shield,
  Settings,
  FileBarChart,
  BookOpen,
  Sparkles,
  Activity,
  MoreHorizontal,
  Copy,
  Trash2,
  Loader2,
  Leaf
} from "lucide-react";
import { getIntegratedReports } from "@/services/integratedReports";
import { getESGDashboard } from "@/services/esg";
import { ComplianceFrameworkSelector } from "@/components/ComplianceFrameworkSelector";
import { NormsComplianceTracker } from "@/components/NormsComplianceTracker";
import { FrameworkReportingTemplates } from "@/components/FrameworkReportingTemplates";
import { CreateGRIReportModal } from "@/components/CreateGRIReportModal";
import { GRIReportBuilderModal } from "@/components/GRIReportBuilderModal";
import SGQReportsModal from "@/components/SGQReportsModal";
import { IntelligentReportingDashboard } from "@/components/reports/IntelligentReportingDashboard";
import { ReportGeneratorConfiguration } from "@/components/reports/ReportGeneratorConfiguration";
import { ReportGenerationMonitor } from "@/components/reports/ReportGenerationMonitor";
import { SmartTemplateSelector } from "@/components/reports/SmartTemplateSelector";
import { getGRIReports, type GRIReport } from "@/services/griReports";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Mock data for traditional reports (migrated from Relatorios.tsx)
const mockReports = [
  {
    id: 1,
    titulo: "Relatório Anual de Sustentabilidade 2024",
    tipo: "Padrão GRI",
    periodo: "01/01/2024 - 31/12/2024",
    dataGeracao: "15/02/2025",
    status: "Concluído" as const,
  },
  {
    id: 2,
    titulo: "Inventário GEE Completo - 2025",
    tipo: "Protocolo GHG",
    periodo: "01/01/2025 - 31/01/2025",
    dataGeracao: "10/02/2025",
    status: "Rascunho" as const,
  },
  {
    id: 3,
    titulo: "Performance de Metas - S1 2025",
    tipo: "Relatório de Metas ESG",
    periodo: "01/01/2025 - 30/06/2025",
    dataGeracao: "08/02/2025",
    status: "Gerando..." as const,
  },
  {
    id: 4,
    titulo: "Análise de Resíduos 2024",
    tipo: "Relatório Customizado",
    periodo: "01/01/2024 - 31/12/2024",
    dataGeracao: "12/02/2025",
    status: "Concluído" as const,
  },
];

// Template data (migrated from RelatoriosSustentabilidade.tsx)
const templates = [
  { name: 'GRI Standards', description: 'Template completo baseado nos padrões GRI', sectors: ['Todos'] },
  { name: 'SASB', description: 'Template focado em materialidade financeira', sectors: ['Financeiro', 'Tecnologia'] },
  { name: 'TCFD', description: 'Template para divulgações relacionadas ao clima', sectors: ['Todos'] },
  { name: 'UN Global Compact', description: 'Comunicação de Progresso do Pacto Global', sectors: ['Todos'] },
  { name: 'Integrated Reporting', description: 'Relatório integrado <IR>', sectors: ['Corporativo'] },
  { name: 'B Corp Assessment', description: 'Template para certificação B Corp', sectors: ['Impacto Social'] }
];

export default function RelatoriosIntegrados() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [griReports, setGriReports] = useState<GRIReport[]>([]);
  const [isCreateGRIModalOpen, setIsCreateGRIModalOpen] = useState(false);
  const [selectedGRIReport, setSelectedGRIReport] = useState<GRIReport | null>(null);
  const [isGRIBuilderOpen, setIsGRIBuilderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reports } = useQuery({
    queryKey: ['integrated-reports'],
    queryFn: getIntegratedReports
  });

  const { data: esgData } = useQuery({
    queryKey: ['esg-dashboard'],
    queryFn: getESGDashboard
  });

  // Load GRI reports (migrated from Relatorios.tsx)
  useEffect(() => {
    loadGRIReports();
  }, []);

  const loadGRIReports = async () => {
    try {
      setLoading(true);
      const griReportsData = await getGRIReports();
      setGriReports(griReportsData);
    } catch (error) {
      console.error('Error loading GRI reports:', error);
      toast.error('Erro ao carregar relatórios GRI');
    } finally {
      setLoading(false);
    }
  };

  const handleGRIReportCreated = (report: GRIReport) => {
    setGriReports(prev => [report, ...prev]);
    setIsCreateGRIModalOpen(false);
    setSelectedGRIReport(report);
    setIsGRIBuilderOpen(true);
  };

  const handleGRIReportUpdated = (updatedReport: GRIReport) => {
    setGriReports(prev => prev.map(report => 
      report.id === updatedReport.id ? updatedReport : report
    ));
    setSelectedGRIReport(updatedReport);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Publicado':
      case 'Concluído':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Publicado</Badge>;
      case 'Em Revisão':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Em Revisão</Badge>;
      case 'Rascunho':
        return <Badge variant="outline"><Edit className="mr-1 h-3 w-3" />Rascunho</Badge>;
      case 'Gerando...':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Gerando...
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGRIStatusBadge = (report: GRIReport) => {
    if (report.completion_percentage >= 100) {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Concluído</Badge>;
    } else if (report.completion_percentage >= 50) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Em Progresso</Badge>;
    } else {
      return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const canDownload = (status: string) => status === "Concluído" || status === "Publicado";

  const handleCreateReport = () => {
    toast.success("Novo Relatório", {
      description: "Funcionalidade será implementada em breve",
    });
  };

  const handleExportReport = (reportId: string) => {
    toast.success("Exportando Relatório", {
      description: "O relatório será exportado em PDF",
    });
  };

  const handleGenerateReport = async (config: any) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-intelligent-report', {
        body: { templateId: config.templateId, parameters: config }
      });

      if (error) throw error;

      toast.success("Relatório em Geração", {
        description: "Seu relatório está sendo processado. Você será notificado quando estiver pronto.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Central de Relatórios ESG Integrados</h1>
          <p className="text-muted-foreground">
            Sistema unificado de relatórios de sustentabilidade e performance ESG
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setIsCreateGRIModalOpen(true)}>
            <Leaf className="h-4 w-4" />
            Novo Relatório GRI
          </Button>
          <SGQReportsModal>
            <Button variant="outline" className="gap-2">
              <Activity className="h-4 w-4" />
              Relatórios SGQ
            </Button>
          </SGQReportsModal>
          <Button onClick={handleCreateReport}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Relatórios</p>
                <p className="text-2xl font-bold">{reports?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Relatórios GRI</p>
                <p className="text-2xl font-bold">{griReports?.length || 0}</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score ESG Médio</p>
                <p className={`text-2xl font-bold ${getScoreColor(85)}`}>
                  85
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conformidade</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard ESG</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="gri" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Relatórios GRI
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Gerador
          </TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* ESG Dashboard Metrics - Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score ESG</p>
                    <p className={`text-3xl font-bold ${getScoreColor(esgData?.overall_esg_score || 0)}`}>
                      {esgData?.overall_esg_score || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score Ambiental</p>
                    <p className={`text-3xl font-bold ${getScoreColor(esgData?.environmental?.score || 0)}`}>
                      {esgData?.environmental?.score || 0}
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score Social</p>
                    <p className={`text-3xl font-bold ${getScoreColor(esgData?.social?.score || 0)}`}>
                      {esgData?.social?.score || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Tradicionais</CardTitle>
              <CardDescription>
                Relatórios gerados automaticamente do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título do Relatório</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período dos Dados</TableHead>
                    <TableHead>Data de Geração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReports.map((report) => (
                    <TableRow key={`traditional-report-${report.id}`}>
                      <TableCell className="font-medium">{report.titulo}</TableCell>
                      <TableCell>{report.tipo}</TableCell>
                      <TableCell>{report.periodo}</TableCell>
                      <TableCell>{report.dataGeracao}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canDownload(report.status)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gri" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Sustentabilidade GRI</CardTitle>
              <CardDescription>
                Relatórios de sustentabilidade baseados nos padrões GRI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : griReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum relatório GRI encontrado</p>
                  <p className="text-sm">Crie seu primeiro relatório de sustentabilidade</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Versão GRI</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {griReports.map((report) => (
                      <TableRow key={`gri-report-${report.id}`}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.year}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.gri_standard_version}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${report.completion_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {report.completion_percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getGRIStatusBadge(report)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGRIReport(report);
                                setIsGRIBuilderOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Relatórios</CardTitle>
              <CardDescription>
                Templates profissionais para diferentes frameworks de sustentabilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Setores:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.sectors.map((sector, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleCreateReport}>
                          Usar Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerador de Relatórios Inteligente</CardTitle>
              <CardDescription>
                Crie relatórios personalizados usando IA e dados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Gerador Inteligente</h3>
                <p className="text-muted-foreground mb-4">
                  Sistema de geração automática de relatórios será implementado em breve
                </p>
                <Button variant="outline" onClick={handleCreateReport}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Gerador
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceFrameworkSelector 
            selectedFrameworks={selectedFrameworks}
            onFrameworksSelect={setSelectedFrameworks}
          />
          <NormsComplianceTracker selectedFrameworks={selectedFrameworks} />
          <FrameworkReportingTemplates />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateGRIReportModal
        isOpen={isCreateGRIModalOpen}
        onClose={() => setIsCreateGRIModalOpen(false)}
        onSubmit={handleGRIReportCreated}
      />

      {selectedGRIReport && (
        <GRIReportBuilderModal
          isOpen={isGRIBuilderOpen}
          onClose={() => {
            setIsGRIBuilderOpen(false);
            setSelectedGRIReport(null);
          }}
          report={selectedGRIReport}
          onUpdate={() => loadGRIReports()}
        />
      )}
    </div>
  );
}
