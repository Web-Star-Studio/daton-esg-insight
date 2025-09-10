import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileBarChart, Plus, FileText, FileSpreadsheet, MoreHorizontal, Edit, Copy, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

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
      default:
        return mockReports;
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Gerar Novo Relatório
          </Button>
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
                <TabsTrigger value="rascunhos">Rascunhos</TabsTrigger>
                <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* Tabela de Relatórios */}
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
                      <TableRow key={report.id}>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Relatorios;