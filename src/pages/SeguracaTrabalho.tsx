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
import { AlertTriangle, Shield, Heart, FileText, Calendar, TrendingUp, Users, Clock, Target, Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { useSafetyIncidents, useSafetyMetrics, useDeleteSafetyIncident } from "@/hooks/useSafetyIncidents";
import { auditService } from "@/services/audit";
import { useQuery } from "@tanstack/react-query";
import SafetyIncidentModal from "@/components/SafetyIncidentModal";
import { AuditModal } from "@/components/AuditModal";
import { SafetyIncident } from "@/services/safetyIncidents";
import { toast } from "sonner";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear } from "date-fns";

export default function SeguracaTrabalho() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<SafetyIncident | null>(null);
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  
  // Estados para filtros de incidentes
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Real data from API
  const { data: incidents = [], isLoading: incidentsLoading } = useSafetyIncidents();
  const { data: safetyMetrics, isLoading: metricsLoading } = useSafetyMetrics();
  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: auditService.getAudits,
  });
  
  const deleteMutation = useDeleteSafetyIncident();

  // Filter incidents by selected date range and all filters
  const filteredIncidents = incidents.filter(incident => {
    // Filtro por data range
    if (dateRange?.from) {
      const incidentDate = new Date(incident.incident_date);
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;
      
      if (incidentDate < fromDate || incidentDate > toDate) {
        return false;
      }
    }
    
    // Filtro por busca de texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        incident.id.toLowerCase().includes(searchLower) ||
        incident.incident_type.toLowerCase().includes(searchLower) ||
        incident.description.toLowerCase().includes(searchLower) ||
        (incident.location && incident.location.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Filtro por tipo
    if (typeFilter !== "all") {
      const typeMap: Record<string, string> = {
        "accident": "Acidente",
        "near-miss": "Quase Acidente",
        "unsafe": "Condição Insegura",
      };
      if (incident.incident_type !== typeMap[typeFilter]) return false;
    }
    
    // Filtro por severidade
    if (severityFilter !== "all" && incident.severity !== severityFilter) {
      return false;
    }
    
    // Filtro por status
    if (statusFilter !== "all" && incident.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Calculate real-time stats
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const thisMonthIncidents = filteredIncidents.filter(incident => {
    const incidentDate = new Date(incident.incident_date);
    return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear;
  }).length;

  const lastMonthIncidents = filteredIncidents.filter(incident => {
    const incidentDate = new Date(incident.incident_date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return incidentDate.getMonth() === lastMonth && incidentDate.getFullYear() === lastMonthYear;
  }).length;

  const resolvedIncidents = filteredIncidents.filter(incident => incident.status === 'Resolvido').length;
  
  // Calculate days without incidents
  const sortedFilteredIncidents = filteredIncidents
    .filter(incident => incident.status !== 'Resolvido')
    .sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime());
  
  const daysSinceLastIncident = sortedFilteredIncidents.length > 0 
    ? Math.floor((currentDate.getTime() - new Date(sortedFilteredIncidents[0].incident_date).getTime()) / (1000 * 60 * 60 * 24))
    : 365; // Default if no incidents

  const safetyStats = {
    incidentsThisMonth: thisMonthIncidents,
    incidentsLastMonth: lastMonthIncidents,
    daysWithoutIncidents: daysSinceLastIncident,
    safetyTrainingCompliance: 92, // This could come from training system
    activeAudits: audits.filter(audit => audit.status === 'Em Andamento' || audit.status === 'Agendada').length,
    resolvedIncidents,
    avgResolutionTime: 5.2, // Could be calculated from incident resolution times
    safetyScore: safetyMetrics?.ltifr ? Math.max(0, 100 - safetyMetrics.ltifr * 10) : 87
  };

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

  const handleDeleteIncident = (incident: SafetyIncident) => {
    if (confirm('Tem certeza que deseja excluir este incidente?')) {
      deleteMutation.mutate(incident.id);
    }
  };

  const handleEditIncident = (incident: SafetyIncident) => {
    setEditingIncident(incident);
  };

  const handleAuditSuccess = () => {
    setNewAuditOpen(false);
  };

  const handleCreateAudit = () => {
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
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-auto"
          />
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
            <div className="text-2xl font-bold">
              {incidentsLoading ? "..." : safetyStats.incidentsThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              {safetyStats.incidentsThisMonth < safetyStats.incidentsLastMonth 
                ? `${Math.round(((safetyStats.incidentsLastMonth - safetyStats.incidentsThisMonth) / safetyStats.incidentsLastMonth) * 100)}% menos que o mês anterior`
                : `${Math.round(((safetyStats.incidentsThisMonth - safetyStats.incidentsLastMonth) / Math.max(safetyStats.incidentsLastMonth, 1)) * 100)}% mais que o mês anterior`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Sem Incidentes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidentsLoading ? "..." : safetyStats.daysWithoutIncidents}
            </div>
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
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : Math.round(safetyStats.safetyScore)}
            </div>
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
                  {safetyMetrics?.severityDistribution && Object.entries(safetyMetrics.severityDistribution).map(([severity, count]) => {
                    const total = Object.values(safetyMetrics.severityDistribution).reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    const widthPercentage = Math.round((count / Math.max(total, 1)) * 16);
                    
                    return (
                      <div key={severity} className="flex justify-between items-center">
                        <span>{severity}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div 
                              className={`h-2 rounded-full ${
                                severity === 'Alta' ? 'bg-destructive' :
                                severity === 'Média' ? 'bg-warning' : 'bg-secondary'
                              }`}
                              style={{ width: `${widthPercentage * 4}px` }}
                            ></div>
                          </div>
                          <span className="text-sm">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!safetyMetrics?.severityDistribution || Object.keys(safetyMetrics.severityDistribution).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum incidente registrado ainda
                    </p>
                  )}
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
                  {auditsLoading && <p className="text-center py-4">Carregando auditorias...</p>}
                  {!auditsLoading && audits.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma auditoria encontrada
                    </p>
                  )}
                  {audits.slice(0, 3).map((audit) => (
                    <div key={audit.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{audit.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {audit.auditor} • {new Date(audit.start_date || '').toLocaleDateString('pt-BR')}
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
                <Input 
                  placeholder="Buscar incidentes..." 
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="accident">Acidente</SelectItem>
                  <SelectItem value="near-miss">Quase Acidente</SelectItem>
                  <SelectItem value="unsafe">Condição Insegura</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {showFilters ? <span className="ml-2">▲</span> : <span className="ml-2">▼</span>}
              </Button>
            </div>
            <Button onClick={() => setNewIncidentOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Incidente
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>Severidade</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as severidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Aberto">Aberto</SelectItem>
                      <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                      <SelectItem value="Resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setSeverityFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </Card>
          )}

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredIncidents.length} de {incidents.length} incidentes
            {(searchTerm || typeFilter !== "all" || severityFilter !== "all" || statusFilter !== "all") && (
              <span className="ml-2 text-primary font-medium">
                (filtros ativos)
              </span>
            )}
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
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          {incidents.length === 0 
                            ? "Nenhum incidente registrado ainda"
                            : "Nenhum incidente encontrado com os filtros aplicados"
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="border-b">
                        <td className="p-4 font-mono text-sm">{incident.id}</td>
                         <td className="p-4">{incident.incident_type}</td>
                        <td className="p-4">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </td>
                         <td className="p-4">
                          {incident.employee_id ? `Funcionário ID: ${incident.employee_id}` : 'N/A'}
                         </td>
                         <td className="p-4">
                          {incident.location || 'N/A'}
                         </td>
                        <td className="p-4">{new Date(incident.incident_date).toLocaleDateString('pt-BR')}</td>
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
                      ))
                    )}
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
                        <td className="p-4">{audit.audit_type}</td>
                        <td className="p-4">{audit.auditor}</td>
                        <td className="p-4">{new Date(audit.start_date || '').toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                        </td>
                        <td className="p-4">-</td>
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

      {/* Modals */}
      <SafetyIncidentModal
        isOpen={newIncidentOpen || editingIncident !== null}
        onClose={() => {
          setNewIncidentOpen(false);
          setEditingIncident(null);
        }}
        incident={editingIncident || undefined}
      />

      <AuditModal
        isOpen={newAuditOpen}
        onClose={() => setNewAuditOpen(false)}
        onSuccess={handleAuditSuccess}
      />
    </div>
  );
}