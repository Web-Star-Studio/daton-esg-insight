import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileBarChart, Plus, FileText, FileSpreadsheet, MoreHorizontal, Edit, Copy, Trash2, Loader2, Leaf, Activity, Brain, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateGRIReportModal } from "@/components/CreateGRIReportModal";
import { GRIReportBuilderModal } from "@/components/GRIReportBuilderModal";
import SGQReportsModal from "@/components/SGQReportsModal";
import { IntelligentReportingDashboard } from "@/components/IntelligentReportingDashboard";
import { getGRIReports, type GRIReport } from "@/services/griReports";
import { toast } from "sonner";

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

const Relatorios = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [griReports, setGriReports] = useState<GRIReport[]>([]);
  const [isCreateGRIModalOpen, setIsCreateGRIModalOpen] = useState(false);
  const [selectedGRIReport, setSelectedGRIReport] = useState<GRIReport | null>(null);
  const [isGRIBuilderOpen, setIsGRIBuilderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGRIReports();
  }, []);

  const loadGRIReports = async () => {
    try {
      setLoading(true);
      const reports = await getGRIReports();
      setGriReports(reports);
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
      case "Concluído":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Concluído</Badge>;
      case "Rascunho":
        return <Badge variant="secondary">Rascunho</Badge>;
      case "Gerando...":
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

  const getFilteredReports = () => {
    switch (activeTab) {
      case "rascunhos":
        return mockReports.filter(report => report.status === "Rascunho");
      case "concluidos":
        return mockReports.filter(report => report.status === "Concluído");
      case "gri":
        return [];
      default:
        return mockReports;
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

  const canDownload = (status: string) => status === "Concluído";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Central de Relatórios</h1>
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
            <Button variant="outline" className="gap-2">
              <Brain className="h-4 w-4" />
              IA Reports
            </Button>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Outros Relatórios
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Abas de Filtragem */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="ia" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  IA Reports
                </TabsTrigger>
                <TabsTrigger value="gri">Relatórios GRI</TabsTrigger>
                <TabsTrigger value="sgq">Sistema de Qualidade</TabsTrigger>
                <TabsTrigger value="rascunhos">Rascunhos</TabsTrigger>
                <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
              </TabsList>

              <TabsContent value="ia" className="mt-6">
                <IntelligentReportingDashboard />
              </TabsContent>

              <TabsContent value="gri" className="mt-6">
                {/* Tabela de Relatórios GRI */}
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Relatórios de Sustentabilidade GRI</h3>
                  <Button onClick={() => setIsCreateGRIModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Relatório GRI
                  </Button>
                </div>
                
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
                        <TableHead>Última Atualização</TableHead>
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
                            {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                          </TableCell>
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Exportar PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="sgq" className="mt-6">
                {/* SGQ Reports Section */}
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Relatórios de Sistema de Gestão da Qualidade</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gere relatórios especializados do SGQ com análises de qualidade, não conformidades e riscos
                  </p>
                  <SGQReportsModal>
                    <Button className="gap-2">
                      <Activity className="h-4 w-4" />
                      Gerar Relatório SGQ
                    </Button>
                  </SGQReportsModal>
                </div>
              </TabsContent>

              <TabsContent value={activeTab} className="mt-6">
                {activeTab !== "gri" && (
                  <>
                    {/* Tabela de Relatórios Tradicionais */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título do Relatório</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Período dos Dados</TableHead>
                          <TableHead>Data de Geração</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Formatos</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredReports().map((report) => (
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
                                  className="gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!canDownload(report.status)}
                                  className="gap-1"
                                >
                                  <FileSpreadsheet className="h-3 w-3" />
                                  XLSX
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {report.status === "Rascunho" && (
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar Rascunho
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
            onUpdate={async () => {
              await loadGRIReports();
              // Find the updated report and set it as selected
              const updatedReports = await getGRIReports();
              const updatedReport = updatedReports.find(r => r.id === selectedGRIReport?.id);
              if (updatedReport) {
                setSelectedGRIReport(updatedReport);
              }
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Relatorios;