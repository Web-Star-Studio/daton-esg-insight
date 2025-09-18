import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GovernanceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  governanceMetrics?: any;
}

export function GovernanceReportsModal({ isOpen, onClose, governanceMetrics }: GovernanceReportsModalProps) {
  const [activeTab, setActiveTab] = useState("board");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (reportType: string) => {
    setIsGenerating(true);
    
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Relatório Gerado",
      description: `Relatório de ${reportType} gerado com sucesso!`,
    });
    
    setIsGenerating(false);
  };

  const boardReportData = {
    totalMembers: governanceMetrics?.board?.totalMembers || 0,
    independentMembers: governanceMetrics?.board?.independentMembers || 0,
    independenceRate: governanceMetrics?.board?.independenceRate || 0,
    genderDiversity: governanceMetrics?.board?.genderDiversity || {},
    meetingsThisYear: 12,
    attendanceRate: 94,
    committees: ['Auditoria', 'Sustentabilidade', 'Remuneração', 'Estratégia']
  };

  const policiesReportData = {
    totalPolicies: governanceMetrics?.policies?.totalPolicies || 0,
    activePolicies: governanceMetrics?.policies?.activePolicies || 0,
    policiesNeedingReview: governanceMetrics?.policies?.policiesNeedingReview || 0,
    reviewComplianceRate: governanceMetrics?.policies?.reviewComplianceRate || 0,
    categoriesCount: {
      'Sustentabilidade': 3,
      'Código de Conduta': 2,
      'Anticorrupção': 1,
      'Diversidade': 2,
    }
  };

  const ethicsReportData = {
    totalReports: governanceMetrics?.ethics?.totalReports || 0,
    openReports: governanceMetrics?.ethics?.openReports || 0,
    currentYearReports: governanceMetrics?.ethics?.currentYearReports || 0,
    resolutionRate: governanceMetrics?.ethics?.resolutionRate || 0,
    averageResolutionTime: 15,
    categoriesBreakdown: {
      'Assédio': 2,
      'Discriminação': 1,
      'Corrupção': 1,
      'Conflito de Interesses': 1,
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Governança
          </DialogTitle>
          <DialogDescription>
            Gere relatórios detalhados sobre os aspectos de governança corporativa
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="board">Conselho</TabsTrigger>
            <TabsTrigger value="policies">Políticas</TabsTrigger>
            <TabsTrigger value="ethics">Ética</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Relatório do Conselho */}
          <TabsContent value="board" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Relatório do Conselho de Administração
                </CardTitle>
                <CardDescription>
                  Análise detalhada da composição e performance do conselho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{boardReportData.totalMembers}</p>
                    <p className="text-sm text-muted-foreground">Total de Membros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{boardReportData.independentMembers}</p>
                    <p className="text-sm text-muted-foreground">Independentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{boardReportData.independenceRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Taxa Independência</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{boardReportData.attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Presença Reuniões</p>
                  </div>
                </div>

                {/* Diversidade de Gênero */}
                <div>
                  <h4 className="font-medium mb-3">Diversidade de Gênero</h4>
                  <div className="space-y-2">
                    {Object.entries(boardReportData.genderDiversity).map(([gender, count]) => {
                      const percentage = boardReportData.totalMembers > 0 
                        ? ((count as number) / boardReportData.totalMembers) * 100 
                        : 0;
                      return (
                        <div key={gender} className="flex items-center justify-between">
                          <span className="text-sm">{gender}</span>
                          <div className="flex items-center gap-2 flex-1 ml-4">
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm w-16 text-right">{count as number} ({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comitês */}
                <div>
                  <h4 className="font-medium mb-3">Comitês Ativos</h4>
                  <div className="flex flex-wrap gap-2">
                    {boardReportData.committees.map((committee) => (
                      <Badge key={committee} variant="secondary">
                        {committee}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport('Conselho')}
                    disabled={isGenerating}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório Completo
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Políticas */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório de Políticas Corporativas
                </CardTitle>
                <CardDescription>
                  Status e compliance das políticas organizacionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{policiesReportData.totalPolicies}</p>
                    <p className="text-sm text-muted-foreground">Total Políticas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{policiesReportData.activePolicies}</p>
                    <p className="text-sm text-muted-foreground">Ativas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{policiesReportData.policiesNeedingReview}</p>
                    <p className="text-sm text-muted-foreground">Precisam Revisão</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{policiesReportData.reviewComplianceRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Compliance Revisão</p>
                  </div>
                </div>

                {/* Distribuição por Categoria */}
                <div>
                  <h4 className="font-medium mb-3">Distribuição por Categoria</h4>
                  <div className="space-y-2">
                    {Object.entries(policiesReportData.categoriesCount).map(([category, count]) => {
                      const percentage = policiesReportData.totalPolicies > 0 
                        ? ((count as number) / policiesReportData.totalPolicies) * 100 
                        : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{category}</span>
                          <div className="flex items-center gap-2 flex-1 ml-4">
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm w-16 text-right">{count as number} ({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status de Compliance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-600">Em Dia</p>
                      <p className="text-sm text-muted-foreground">
                        {policiesReportData.totalPolicies - policiesReportData.policiesNeedingReview} políticas
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="font-medium text-yellow-600">Revisão Próxima</p>
                      <p className="text-sm text-muted-foreground">2 políticas em 30 dias</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-red-600">Atrasadas</p>
                      <p className="text-sm text-muted-foreground">
                        {policiesReportData.policiesNeedingReview} políticas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport('Políticas')}
                    disabled={isGenerating}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório Completo
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Ética */}
          <TabsContent value="ethics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Relatório de Ética e Integridade
                </CardTitle>
                <CardDescription>
                  Análise do canal de denúncias e questões éticas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{ethicsReportData.totalReports}</p>
                    <p className="text-sm text-muted-foreground">Total Denúncias</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{ethicsReportData.currentYearReports}</p>
                    <p className="text-sm text-muted-foreground">Este Ano</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{ethicsReportData.resolutionRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Taxa Resolução</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{ethicsReportData.averageResolutionTime}</p>
                    <p className="text-sm text-muted-foreground">Dias Médios</p>
                  </div>
                </div>

                {/* Distribuição por Categoria */}
                <div>
                  <h4 className="font-medium mb-3">Distribuição por Categoria</h4>
                  <div className="space-y-2">
                    {Object.entries(ethicsReportData.categoriesBreakdown).map(([category, count]) => {
                      const percentage = ethicsReportData.totalReports > 0 
                        ? ((count as number) / ethicsReportData.totalReports) * 100 
                        : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{category}</span>
                          <div className="flex items-center gap-2 flex-1 ml-4">
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm w-16 text-right">{count as number} ({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status das Denúncias */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-blue-600">Em Andamento</p>
                      <p className="text-sm text-muted-foreground">{ethicsReportData.openReports} denúncias</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-600">Resolvidas</p>
                      <p className="text-sm text-muted-foreground">
                        {ethicsReportData.totalReports - ethicsReportData.openReports} denúncias
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-medium text-purple-600">Tendência</p>
                      <p className="text-sm text-muted-foreground">↓ 15% vs mês anterior</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport('Ética')}
                    disabled={isGenerating}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório Completo
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Compliance */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Relatório de Compliance Geral
                </CardTitle>
                <CardDescription>
                  Visão consolidada do status de compliance organizacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score de Compliance Geral */}
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-4xl font-bold text-primary">87%</p>
                    <p className="text-lg text-muted-foreground">Score de Compliance Geral</p>
                  </div>
                  <Progress value={87} className="w-full h-3" />
                </div>

                {/* Breakdown por Área */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Governança Corporativa</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Estrutura do Conselho</span>
                        <span className="text-green-600">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Políticas Corporativas</span>
                        <span className="text-yellow-600">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Transparência</span>
                        <span className="text-green-600">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Gestão de Riscos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Identificação de Riscos</span>
                        <span className="text-green-600">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Controles Internos</span>
                        <span className="text-blue-600">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monitoramento</span>
                        <span className="text-yellow-600">76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Recomendações */}
                <div>
                  <h4 className="font-medium mb-3">Principais Recomendações</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Atualização de Políticas</p>
                        <p className="text-sm text-yellow-700">3 políticas precisam de revisão urgente</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Melhoria no Monitoramento</p>
                        <p className="text-sm text-blue-700">Implementar controles automatizados</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport('Compliance Geral')}
                    disabled={isGenerating}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório Executivo
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}