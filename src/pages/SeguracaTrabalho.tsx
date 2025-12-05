import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, Heart, FileText, Calendar, TrendingUp, Users, Clock, Target, Plus, Search, Filter, Download, Eye, Edit, Trash2, ClipboardCheck, GraduationCap } from "lucide-react";
import { useSafetyIncidents, useSafetyMetrics, useDeleteSafetyIncident } from "@/hooks/useSafetyIncidents";
import { useSafetyInspections, useSafetyInspectionMetrics, useDeleteSafetyInspection } from "@/hooks/useSafetyInspections";
import { useSafetyTrainingMetrics } from "@/hooks/useSafetyTrainingMetrics";
import SafetyIncidentModal from "@/components/SafetyIncidentModal";
import SafetyInspectionModal from "@/components/SafetyInspectionModal";
import { SafetyIncident } from "@/services/safetyIncidents";
import { SafetyInspection } from "@/services/safetyInspections";
import { toast } from "sonner";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToCSV } from "@/services/reportService";
import { LTIFRDashboard } from "@/components/safety/LTIFRDashboard";
import { INSPECTION_TYPES, getInspectionTypeLabel } from "@/constants/safetyInspectionTypes";

export default function SeguracaTrabalho() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<SafetyIncident | null>(null);
  const [newInspectionOpen, setNewInspectionOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<SafetyInspection | null>(null);
  
  // Estados para filtros de incidentes
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Estados para filtros de inspeções
  const [inspectionSearch, setInspectionSearch] = useState("");
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState("all");
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState("all");

  // Real data from API
  const { data: incidents = [], isLoading: incidentsLoading } = useSafetyIncidents();
  const { data: safetyMetrics, isLoading: metricsLoading } = useSafetyMetrics();
  const { data: inspections = [], isLoading: inspectionsLoading } = useSafetyInspections();
  const { data: inspectionMetrics } = useSafetyInspectionMetrics();
  const { data: safetyTrainingMetrics, isLoading: trainingMetricsLoading } = useSafetyTrainingMetrics();
  
  const deleteMutation = useDeleteSafetyIncident();
  const deleteInspectionMutation = useDeleteSafetyInspection();

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
    safetyTrainingCompliance: safetyTrainingMetrics?.overallCompliance || 0,
    activeInspections: inspectionMetrics?.pending || 0,
    resolvedIncidents,
    avgResolutionTime: 5.2, // Could be calculated from incident resolution times
    safetyScore: safetyMetrics?.ltifr ? Math.max(0, 100 - safetyMetrics.ltifr * 10) : 87
  };
  
  // Filter inspections
  const filteredInspections = inspections.filter(inspection => {
    if (inspectionSearch) {
      const searchLower = inspectionSearch.toLowerCase();
      const matchesSearch = 
        inspection.title.toLowerCase().includes(searchLower) ||
        inspection.inspector_name.toLowerCase().includes(searchLower) ||
        (inspection.area_location && inspection.area_location.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }
    
    if (inspectionTypeFilter !== "all" && inspection.inspection_type !== inspectionTypeFilter) {
      return false;
    }
    
    if (inspectionStatusFilter !== "all" && inspection.status !== inspectionStatusFilter) {
      return false;
    }
    
    return true;
  });

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

  const handleDeleteInspection = (inspection: SafetyInspection) => {
    if (confirm('Tem certeza que deseja excluir esta inspeção?')) {
      deleteInspectionMutation.mutate(inspection.id);
    }
  };

  const getInspectionResultColor = (result: string | undefined) => {
    switch (result) {
      case "Conforme": return "bg-success text-success-foreground";
      case "Não Conforme": return "bg-destructive text-destructive-foreground";
      case "Parcialmente Conforme": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Funções para geração de relatórios
  const handleGenerateIncidentsReport = () => {
    if (incidents.length === 0) {
      toast.error("Nenhum incidente disponível para gerar relatório");
      return;
    }

    const reportData = incidents.map(incident => ({
      Data: format(new Date(incident.incident_date), "dd/MM/yyyy", { locale: ptBR }),
      Tipo: incident.incident_type || "N/A",
      Gravidade: incident.severity || "N/A",
      Status: incident.status || "N/A",
      Local: incident.location || "N/A",
      Descrição: incident.description || "",
      "Causa Imediata": incident.immediate_cause || "N/A",
      "Causa Raiz": incident.root_cause || "N/A",
      "Ações Corretivas": incident.corrective_actions || "N/A",
      "Dias Perdidos": incident.days_lost || 0,
      "Tratamento Médico": incident.medical_treatment_required ? "Sim" : "Não"
    }));

    exportToCSV(reportData, "relatorio_incidentes");
    toast.success("Relatório de Incidentes exportado com sucesso!");
  };

  const handleGenerateInspectionsReport = () => {
    if (inspections.length === 0) {
      toast.error("Nenhuma inspeção disponível para gerar relatório");
      return;
    }

    const reportData = inspections.map(inspection => ({
      Título: inspection.title,
      Tipo: getInspectionTypeLabel(inspection.inspection_type),
      Status: inspection.status || "N/A",
      Inspetor: inspection.inspector_name || "N/A",
      "Área/Local": inspection.area_location || "N/A",
      "Data Inspeção": inspection.inspection_date ? format(new Date(inspection.inspection_date), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
      Resultado: inspection.result || "N/A",
      Score: inspection.score || "N/A",
      "Criado em": format(new Date(inspection.created_at), "dd/MM/yyyy", { locale: ptBR })
    }));

    exportToCSV(reportData, "relatorio_inspecoes");
    toast.success("Relatório de Inspeções exportado com sucesso!");
  };

  const handleGenerateMetricsReport = () => {
    // Calcular métricas a partir dos incidentes
    const totalIncidents = incidents.length;
    const incidentsByType = incidents.reduce((acc: any, inc) => {
      acc[inc.incident_type || "Outro"] = (acc[inc.incident_type || "Outro"] || 0) + 1;
      return acc;
    }, {});

    const incidentsBySeverity = incidents.reduce((acc: any, inc) => {
      acc[inc.severity || "N/A"] = (acc[inc.severity || "N/A"] || 0) + 1;
      return acc;
    }, {});

    const reportData = [
      {
        Indicador: "Total de Incidentes",
        Valor: totalIncidents,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Total de Inspeções",
        Valor: inspections.length,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Taxa de Frequência (LTIFR)",
        Valor: safetyMetrics?.ltifr || 0,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Dias Perdidos",
        Valor: safetyMetrics?.daysLostTotal || 0,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Incidentes com Tratamento Médico",
        Valor: safetyMetrics?.withMedicalTreatment || 0,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      ...Object.entries(incidentsByType).map(([type, count]) => ({
        Indicador: `Incidentes: ${type}`,
        Valor: count,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      })),
      ...Object.entries(incidentsBySeverity).map(([severity, count]) => ({
        Indicador: `Gravidade: ${severity}`,
        Valor: count,
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      }))
    ];

    exportToCSV(reportData, "indicadores_seguranca");
    toast.success("Indicadores de Segurança exportados com sucesso!");
  };

  const handleGenerateTrainingComplianceReport = () => {
    if (!safetyTrainingMetrics) {
      toast.error("Dados de treinamento não disponíveis");
      return;
    }

    const reportData = [
      {
        Indicador: "Horas de Treinamento",
        Valor: `${safetyTrainingMetrics.totalHours}h`,
        Status: "Concluído",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Treinamentos Pendentes",
        Valor: safetyTrainingMetrics.pendingTrainings,
        Status: "Em Andamento",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Treinamentos Vencidos",
        Valor: safetyTrainingMetrics.expiredTrainings,
        Status: safetyTrainingMetrics.expiredTrainings > 0 ? "Atenção" : "Adequado",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Taxa de Compliance",
        Valor: `${safetyTrainingMetrics.overallCompliance}%`,
        Status: safetyTrainingMetrics.overallCompliance >= 90 ? "Adequado" : "Atenção",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      {
        Indicador: "Colaboradores Treinados",
        Valor: safetyTrainingMetrics.totalEmployeesTrained,
        Status: "Concluído",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      },
      ...safetyTrainingMetrics.programs.map(p => ({
        Indicador: `Programa: ${p.programName}`,
        Valor: `${p.completionRate}%`,
        Status: p.completionRate >= 90 ? "Adequado" : p.expired > 0 ? "Vencidos: " + p.expired : "Atenção",
        Período: format(new Date(), "MMMM yyyy", { locale: ptBR })
      }))
    ];

    exportToCSV(reportData, "compliance_treinamentos_seguranca");
    toast.success("Relatório de Compliance exportado com sucesso!");
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

      {/* LTIFR Dashboard */}
      {safetyMetrics?.ltifr_metadata && (
        <LTIFRDashboard 
          ltifr={safetyMetrics.ltifr}
          metadata={safetyMetrics.ltifr_metadata}
          accidentsWithLostTime={safetyMetrics.accidentsWithLostTime}
          sectorBenchmark={2.5}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="inspections">Inspeções</TabsTrigger>
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
                <CardTitle>Inspeções Recentes</CardTitle>
                <CardDescription>Status das últimas inspeções realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspectionsLoading && <p className="text-center py-4">Carregando inspeções...</p>}
                  {!inspectionsLoading && inspections.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma inspeção encontrada
                    </p>
                  )}
                  {inspections.slice(0, 3).map((inspection) => (
                    <div key={inspection.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{inspection.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {inspection.inspector_name} • {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString('pt-BR') : 'Agendada'}
                        </div>
                      </div>
                      <Badge className={getStatusColor(inspection.status)}>
                        {inspection.status}
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingIncident(incident)}
                            title="Visualizar detalhes do incidente"
                          >
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

        <TabsContent value="inspections" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar inspeções..." 
                  className="pl-8 w-64"
                  value={inspectionSearch}
                  onChange={(e) => setInspectionSearch(e.target.value)}
                />
              </div>
              <Select value={inspectionTypeFilter} onValueChange={setInspectionTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {INSPECTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={inspectionStatusFilter} onValueChange={setInspectionStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setNewInspectionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Inspeção
            </Button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{inspectionMetrics?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total de Inspeções</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{inspectionMetrics?.pending || 0}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{inspectionMetrics?.completed || 0}</p>
                    <p className="text-xs text-muted-foreground">Concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(inspectionMetrics?.conformeRate || 0)}%</p>
                    <p className="text-xs text-muted-foreground">Taxa de Conformidade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Título</th>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Área/Local</th>
                      <th className="text-left p-4">Inspetor</th>
                      <th className="text-left p-4">Data</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Resultado</th>
                      <th className="text-left p-4">Score</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionsLoading ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-muted-foreground">
                          Carregando inspeções...
                        </td>
                      </tr>
                    ) : filteredInspections.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-muted-foreground">
                          Nenhuma inspeção encontrada
                        </td>
                      </tr>
                    ) : (
                      filteredInspections.map((inspection) => (
                        <tr key={inspection.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{inspection.title}</td>
                          <td className="p-4">{getInspectionTypeLabel(inspection.inspection_type)}</td>
                          <td className="p-4">{inspection.area_location || '-'}</td>
                          <td className="p-4">{inspection.inspector_name}</td>
                          <td className="p-4">
                            {inspection.inspection_date 
                              ? new Date(inspection.inspection_date).toLocaleDateString('pt-BR')
                              : inspection.scheduled_date 
                                ? new Date(inspection.scheduled_date).toLocaleDateString('pt-BR')
                                : '-'}
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(inspection.status)}>
                              {inspection.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {inspection.result ? (
                              <Badge className={getInspectionResultColor(inspection.result)}>
                                {inspection.result}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="p-4">
                            {inspection.score !== null && inspection.score !== undefined 
                              ? `${inspection.score}%` 
                              : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingInspection(inspection)}
                                title="Ver/Editar inspeção"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteInspection(inspection)}
                                title="Excluir inspeção"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        <TabsContent value="training" className="space-y-4">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{safetyTrainingMetrics?.overallCompliance || 0}%</p>
                    <p className="text-xs text-muted-foreground">Compliance Geral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{safetyTrainingMetrics?.totalHours || 0}h</p>
                    <p className="text-xs text-muted-foreground">Total de Horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{safetyTrainingMetrics?.totalEmployeesTrained || 0}</p>
                    <p className="text-xs text-muted-foreground">Colaboradores Treinados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{safetyTrainingMetrics?.pendingTrainings || 0}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Programs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Programas de Treinamento de Segurança
              </CardTitle>
              <CardDescription>
                Treinamentos com categorias de Segurança, EPI, SST ou NRs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingMetricsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando dados de treinamento...
                </div>
              ) : !safetyTrainingMetrics?.programs || safetyTrainingMetrics.programs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum treinamento de segurança cadastrado.</p>
                  <p className="text-sm mt-2">
                    Cadastre treinamentos com categoria "Segurança", "EPI" ou "SST" na página de Gestão de Treinamentos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safetyTrainingMetrics.programs.map(program => (
                    <div key={program.programId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{program.programName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{program.category}</Badge>
                          <span>{program.completed}/{program.totalEnrolled} concluídos</span>
                          {program.durationHours > 0 && (
                            <span>• {program.durationHours}h</span>
                          )}
                          {program.expired > 0 && (
                            <span className="text-destructive font-medium">
                              • {program.expired} vencido{program.expired > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <Progress 
                            value={program.completionRate} 
                            className="h-2"
                          />
                        </div>
                        <span className={`font-bold w-12 text-right ${
                          program.completionRate >= 90 ? 'text-success' : 
                          program.completionRate >= 70 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {program.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expired Trainings Alert */}
          {safetyTrainingMetrics?.expiredTrainings && safetyTrainingMetrics.expiredTrainings > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">
                      {safetyTrainingMetrics.expiredTrainings} treinamento{safetyTrainingMetrics.expiredTrainings > 1 ? 's' : ''} vencido{safetyTrainingMetrics.expiredTrainings > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Providencie a reciclagem dos treinamentos vencidos para manter a conformidade.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
                <CardDescription>Gere relatórios detalhados de segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateIncidentsReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Incidentes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateInspectionsReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Inspeções
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateMetricsReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Indicadores de Segurança
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateTrainingComplianceReport}
                >
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

      <SafetyInspectionModal
        isOpen={newInspectionOpen || editingInspection !== null}
        onClose={() => {
          setNewInspectionOpen(false);
          setEditingInspection(null);
        }}
        inspection={editingInspection || undefined}
      />
    </div>
  );
}