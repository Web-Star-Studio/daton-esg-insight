import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Heart, FileText, Calendar, TrendingUp, Users, Clock, Target, Plus, Search, Filter, Download, Eye } from "lucide-react";
import { toast } from "sonner";

export default function SeguracaTrabalho() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const [newAuditOpen, setNewAuditOpen] = useState(false);

  // Mock data for safety metrics
  const safetyStats = {
    incidentsThisMonth: 3,
    incidentsLastMonth: 5,
    daysWithoutIncidents: 127,
    safetyTrainingCompliance: 92,
    activeAudits: 8,
    resolvedIncidents: 45,
    avgResolutionTime: 5.2,
    safetyScore: 87
  };

  // Mock data for incidents
  const incidents = [
    {
      id: "INC-001",
      type: "Acidente de Trabalho",
      severity: "Média",
      description: "Corte na mão durante operação de máquina",
      employee: "João Silva",
      department: "Produção",
      date: "2024-01-15",
      status: "Em Investigação",
      investigator: "Maria Santos"
    },
    {
      id: "INC-002",
      type: "Quase Acidente",
      severity: "Baixa",
      description: "Escorregão próximo à área de produção",
      employee: "Ana Costa",
      department: "Qualidade",
      date: "2024-01-14",
      status: "Resolvido",
      investigator: "Carlos Lima"
    },
    {
      id: "INC-003",
      type: "Condição Insegura",
      severity: "Alta",
      description: "Vazamento de produto químico no setor B",
      employee: "Pedro Oliveira",
      department: "Manutenção",
      date: "2024-01-13",
      status: "Aberto",
      investigator: "-"
    }
  ];

  // Mock data for safety audits
  const audits = [
    {
      id: "AUD-001",
      title: "Auditoria de EPIs - Setor Produção",
      type: "EPI",
      auditor: "Maria Santos",
      scheduled: "2024-01-20",
      status: "Agendada",
      score: null,
      findings: 0
    },
    {
      id: "AUD-002",
      title: "Inspeção de Segurança - Laboratório",
      type: "Segurança",
      auditor: "Carlos Lima",
      scheduled: "2024-01-18",
      status: "Concluída",
      score: 8.5,
      findings: 3
    },
    {
      id: "AUD-003",
      title: "Avaliação de Riscos - Almoxarifado",
      type: "Riscos",
      auditor: "Ana Costa",
      scheduled: "2024-01-22",
      status: "Em Andamento",
      score: null,
      findings: 2
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Alta": return "bg-destructive text-destructive-foreground";
      case "Média": return "bg-warning text-warning-foreground";
      case "Baixa": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolvido": return "bg-success text-success-foreground";
      case "Em Investigação": return "bg-warning text-warning-foreground";
      case "Aberto": return "bg-destructive text-destructive-foreground";
      case "Concluída": return "bg-success text-success-foreground";
      case "Agendada": return "bg-secondary text-secondary-foreground";
      case "Em Andamento": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCreateIncident = () => {
    toast.success("Incidente registrado com sucesso!");
    setNewIncidentOpen(false);
  };

  const handleCreateAudit = () => {
    toast.success("Auditoria agendada com sucesso!");
    setNewAuditOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Segurança do Trabalho</h1>
          <p className="text-muted-foreground">
            Gestão de incidentes, auditorias e segurança ocupacional
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes Este Mês</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyStats.incidentsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {safetyStats.incidentsThisMonth < safetyStats.incidentsLastMonth ? "-40%" : "+20%"} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Sem Incidentes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyStats.daysWithoutIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Record atual da empresa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Treinamentos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyStats.safetyTrainingCompliance}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Segurança</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyStats.safetyScore}</div>
            <p className="text-xs text-muted-foreground">
              +5 pontos este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="audits">Auditorias</TabsTrigger>
          <TabsTrigger value="training">Treinamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incidentes por Tipo</CardTitle>
                <CardDescription>Distribuição dos incidentes registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Acidentes de Trabalho</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-8 h-2 bg-destructive rounded-full"></div>
                      </div>
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quase Acidentes</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-10 h-2 bg-warning rounded-full"></div>
                      </div>
                      <span className="text-sm">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Condições Inseguras</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-6 h-2 bg-secondary rounded-full"></div>
                      </div>
                      <span className="text-sm">20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auditorias Recentes</CardTitle>
                <CardDescription>Status das últimas auditorias realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audits.slice(0, 3).map((audit) => (
                    <div key={audit.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{audit.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {audit.auditor} • {audit.scheduled}
                        </div>
                      </div>
                      <Badge className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar incidentes..." className="pl-8 w-64" />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="accident">Acidente</SelectItem>
                  <SelectItem value="near-miss">Quase Acidente</SelectItem>
                  <SelectItem value="unsafe">Condição Insegura</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            <Dialog open={newIncidentOpen} onOpenChange={setNewIncidentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Incidente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Novo Incidente</DialogTitle>
                  <DialogDescription>
                    Registre um novo incidente de segurança do trabalho
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Incidente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accident">Acidente de Trabalho</SelectItem>
                        <SelectItem value="near-miss">Quase Acidente</SelectItem>
                        <SelectItem value="unsafe">Condição Insegura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severidade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a severidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Funcionário Envolvido</Label>
                    <Input placeholder="Nome do funcionário" />
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Produção</SelectItem>
                        <SelectItem value="quality">Qualidade</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="logistics">Logística</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descrição do Incidente</Label>
                    <Textarea placeholder="Descreva detalhadamente o que aconteceu..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Incidente</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Investigador Responsável</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o investigador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maria">Maria Santos</SelectItem>
                        <SelectItem value="carlos">Carlos Lima</SelectItem>
                        <SelectItem value="ana">Ana Costa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewIncidentOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateIncident}>
                    Registrar Incidente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Severidade</th>
                      <th className="text-left p-4">Funcionário</th>
                      <th className="text-left p-4">Departamento</th>
                      <th className="text-left p-4">Data</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => (
                      <tr key={incident.id} className="border-b">
                        <td className="p-4 font-mono text-sm">{incident.id}</td>
                        <td className="p-4">{incident.type}</td>
                        <td className="p-4">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </td>
                        <td className="p-4">{incident.employee}</td>
                        <td className="p-4">{incident.department}</td>
                        <td className="p-4">{new Date(incident.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar auditorias..." className="pl-8 w-64" />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={newAuditOpen} onOpenChange={setNewAuditOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Auditoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agendar Nova Auditoria</DialogTitle>
                  <DialogDescription>
                    Agende uma nova auditoria de segurança
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título da Auditoria</Label>
                    <Input placeholder="Ex: Auditoria de EPIs - Setor A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Auditoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="epi">EPI</SelectItem>
                        <SelectItem value="safety">Segurança</SelectItem>
                        <SelectItem value="risks">Avaliação de Riscos</SelectItem>
                        <SelectItem value="procedures">Procedimentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auditor Responsável</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o auditor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maria">Maria Santos</SelectItem>
                        <SelectItem value="carlos">Carlos Lima</SelectItem>
                        <SelectItem value="ana">Ana Costa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Agendada</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewAuditOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAudit}>
                    Agendar Auditoria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Título</th>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Auditor</th>
                      <th className="text-left p-4">Data</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Score</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id} className="border-b">
                        <td className="p-4 font-mono text-sm">{audit.id}</td>
                        <td className="p-4">{audit.title}</td>
                        <td className="p-4">{audit.type}</td>
                        <td className="p-4">{audit.auditor}</td>
                        <td className="p-4">{new Date(audit.scheduled).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {audit.score ? `${audit.score}/10` : "-"}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treinamentos de Segurança</CardTitle>
              <CardDescription>
                Acompanhe o progresso dos treinamentos obrigatórios de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">92%</div>
                        <div className="text-sm text-muted-foreground">NR-10 Elétrica</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
                        <div className="text-2xl font-bold">87%</div>
                        <div className="text-sm text-muted-foreground">NR-12 Máquinas</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Heart className="h-8 w-8 mx-auto mb-2 text-success" />
                        <div className="text-2xl font-bold">95%</div>
                        <div className="text-sm text-muted-foreground">Primeiros Socorros</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
                <CardDescription>Gere relatórios detalhados de segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Incidentes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Auditorias
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Indicadores de Segurança
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Compliance de Treinamentos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores Principais</CardTitle>
                <CardDescription>KPIs de segurança do trabalho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Taxa de Frequência</span>
                  <span className="font-bold">2.1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxa de Gravidade</span>
                  <span className="font-bold">15.4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Dias Perdidos</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Horas Treinamento</span>
                  <span className="font-bold">1,245h</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}