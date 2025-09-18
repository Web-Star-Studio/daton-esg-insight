import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Eye,
  Settings,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RelatoriosSustentabilidade() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Dados de exemplo para demonstrar a funcionalidade
  const reports = [
    {
      id: '1',
      title: 'Relatório de Sustentabilidade 2024',
      type: 'GRI Standards',
      status: 'draft',
      year: 2024,
      lastModified: '2024-01-15',
      completionPercentage: 75,
      sections: ['Perfil Organizacional', 'Estratégia', 'Ética e Integridade', 'Governança'],
      nextDeadline: '2024-03-31'
    },
    {
      id: '2',
      title: 'Relatório ESG 2023',
      type: 'SASB',
      status: 'published',
      year: 2023,
      lastModified: '2023-12-01',
      completionPercentage: 100,
      sections: ['Ambiental', 'Social', 'Governança'],
      publishedUrl: '/reports/esg-2023.pdf'
    },
    {
      id: '3',
      title: 'Comunicação de Progresso 2024',
      type: 'UN Global Compact',
      status: 'review',
      year: 2024,
      lastModified: '2024-01-10',
      completionPercentage: 90,
      sections: ['Direitos Humanos', 'Trabalho', 'Meio Ambiente', 'Anticorrupção'],
      nextDeadline: '2024-02-15'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">Publicado</Badge>;
      case 'review':
        return <Badge variant="secondary">Em Revisão</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateReport = () => {
    toast({
      title: "Novo Relatório",
      description: "Funcionalidade será implementada em breve",
    });
  };

  const handleExportReport = (reportId: string) => {
    toast({
      title: "Exportando Relatório",
      description: "O relatório será exportado em PDF",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Sustentabilidade</h1>
          <p className="text-muted-foreground">
            Crie, gerencie e publique relatórios de sustentabilidade completos
          </p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Relatórios</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Publicados</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'published').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Em Progresso</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status !== 'published').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Ano Atual</p>
                <p className="text-2xl font-bold">2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="relatorios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="relatorios">Meus Relatórios</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>
                          {report.type} • Última modificação: {new Date(report.lastModified).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Barra de Progresso */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{report.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${report.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Seções */}
                    <div>
                      <p className="text-sm font-medium mb-2">Seções incluídas:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.sections.map((section, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Próximo prazo */}
                    {report.nextDeadline && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Calendar className="h-4 w-4" />
                        <span>Próximo prazo: {new Date(report.nextDeadline).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                      {report.status === 'published' && (
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'GRI Standards', description: 'Template completo baseado nos padrões GRI', sectors: ['Todos'] },
              { name: 'SASB', description: 'Template focado em materialidade financeira', sectors: ['Financeiro', 'Tecnologia'] },
              { name: 'TCFD', description: 'Template para divulgações relacionadas ao clima', sectors: ['Todos'] },
              { name: 'UN Global Compact', description: 'Comunicação de Progresso do Pacto Global', sectors: ['Todos'] },
              { name: 'Integrated Reporting', description: 'Relatório integrado <IR>', sectors: ['Corporativo'] },
              { name: 'B Corp Assessment', description: 'Template para certificação B Corp', sectors: ['Impacto Social'] }
            ].map((template, index) => (
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
        </TabsContent>

        <TabsContent value="biblioteca" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Biblioteca de Recursos</h3>
              <p className="text-muted-foreground mb-4">
                Acesse guias, exemplos e melhores práticas para relatórios de sustentabilidade
              </p>
              <Button variant="outline">
                Explorar Recursos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}