import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Printer, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { auditService, type Audit } from "@/services/audit";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditReportsModal({ isOpen, onClose }: AuditReportsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("quarter");

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits-reports'],
    queryFn: auditService.getAudits,
    enabled: isOpen
  });

  const auditStats = {
    total: audits.length,
    completed: audits.filter(a => a.status === 'Concluída').length,
    inProgress: audits.filter(a => a.status === 'Em Andamento').length,
    planned: audits.filter(a => a.status === 'Planejada').length,
    internal: audits.filter(a => a.audit_type === 'Interna').length,
    external: audits.filter(a => a.audit_type === 'Externa').length,
    compliance: audits.filter(a => a.audit_type === 'Compliance').length
  };

  const generateReport = (type: string) => {
    // Here you would implement actual report generation
    console.log(`Generating ${type} report...`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Auditoria
          </DialogTitle>
          <DialogDescription>
            Visualize estatísticas e gere relatórios detalhados das auditorias
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Auditorias</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditStats.total}</div>
                  <p className="text-xs text-muted-foreground">registradas no sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{auditStats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {auditStats.total > 0 ? Math.round((auditStats.completed / auditStats.total) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{auditStats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">auditorias ativas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{auditStats.planned}</div>
                  <p className="text-xs text-muted-foreground">aguardando execução</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Auditorias por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Internas</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${auditStats.total > 0 ? (auditStats.internal / auditStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <Badge variant="outline">{auditStats.internal}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Externas</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${auditStats.total > 0 ? (auditStats.external / auditStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <Badge variant="outline">{auditStats.external}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div 
                          className="h-2 bg-purple-500 rounded-full" 
                          style={{ width: `${auditStats.total > 0 ? (auditStats.compliance / auditStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <Badge variant="outline">{auditStats.compliance}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Auditorias Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {audits.slice(0, 5).map((audit) => (
                      <div key={audit.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{audit.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {audit.audit_type} • {format(new Date(audit.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {audit.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Relatório Executivo",
                  description: "Visão geral das auditorias com principais métricas e indicadores",
                  type: "executive"
                },
                {
                  title: "Relatório Detalhado de Achados",
                  description: "Lista completa de todos os achados com status e responsáveis",
                  type: "findings"
                },
                {
                  title: "Relatório de Conformidade",
                  description: "Análise de conformidade com normas e regulamentações",
                  type: "compliance"
                },
                {
                  title: "Relatório de Tendências",
                  description: "Análise temporal das auditorias e evolução dos indicadores",
                  type: "trends"
                }
              ].map((report) => (
                <Card key={report.type}>
                  <CardHeader>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => generateReport(report.type)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(`${report.type}-print`)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Insights Automatizados</CardTitle>
                  <CardDescription>
                    Análises inteligentes baseadas nos dados das auditorias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auditStats.total === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4" />
                      <p>Execute algumas auditorias para ver insights automatizados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {auditStats.completed > auditStats.inProgress && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">Boa Performance de Conclusão</p>
                            <p className="text-sm text-green-700">
                              Você tem mais auditorias concluídas ({auditStats.completed}) do que em andamento ({auditStats.inProgress}).
                              Continue mantendo esse ritmo!
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {auditStats.internal > auditStats.external && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800">Foco em Auditorias Internas</p>
                            <p className="text-sm text-blue-700">
                              Você realiza mais auditorias internas ({auditStats.internal}) que externas ({auditStats.external}).
                              Considere balancear com auditorias externas para uma visão mais ampla.
                            </p>
                          </div>
                        </div>
                      )}

                      {auditStats.planned > 3 && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800">Muitas Auditorias Planejadas</p>
                            <p className="text-sm text-amber-700">
                              Você tem {auditStats.planned} auditorias planejadas. 
                              Considere priorizar e executar algumas para manter o fluxo.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}