import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { ConditionCard } from "./ConditionCard";
import { AlertCard } from "./AlertCard";
import { ObservationCard } from "./ObservationCard";
import { LicenseActivityTimeline } from "./LicenseActivityTimeline";
import { Button } from "@/components/ui/button";
import { ObservationManager } from "./ObservationManager";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LicenseMonitoringHubProps {
  licenseId: string;
  conditions: any[];
  alerts: any[];
  observations?: any[];
  onRefresh: () => void;
  className?: string;
}

export function LicenseMonitoringHub({
  licenseId,
  conditions = [],
  alerts = [],
  observations = [],
  onRefresh,
  className = "",
}: LicenseMonitoringHubProps) {
  const [activeTab, setActiveTab] = useState("conditions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);

  // Calcular KPIs
  const totalConditions = conditions.length;
  const pendingConditions = conditions.filter(c => c.status === "pending").length;
  const completedConditions = conditions.filter(c => c.status === "completed").length;
  const overdueConditions = conditions.filter(c => 
    c.status !== "completed" && c.due_date && new Date(c.due_date) < new Date()
  ).length;

  const criticalAlerts = alerts.filter(a => a.severity === "critical" && a.status !== "resolved").length;
  const totalActiveAlerts = alerts.filter(a => a.status !== "resolved").length;

  const activeObservations = observations.filter(o => o.status === "active").length;
  const followupObservations = observations.filter(o => o.requires_followup).length;

  const complianceRate = totalConditions > 0 
    ? Math.round((completedConditions / totalConditions) * 100) 
    : 0;

  // Filtrar condicionantes
  const filteredConditions = conditions.filter(condition => {
    const matchesSearch = searchQuery === "" || 
      condition.condition_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || condition.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || condition.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === "" || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = priorityFilter === "all" || alert.severity === priorityFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "resolved" ? alert.status === "resolved" : alert.status !== "resolved");
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Filtrar observações
  const filteredObservations = observations.filter(obs => {
    const matchesSearch = searchQuery === "" || 
      obs.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || obs.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || obs.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateObservationFromCondition = (condition: any) => {
    setSelectedCondition(condition);
    setShowObservationModal(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-blue-500" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Condicionantes</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{pendingConditions}</p>
                <p className="text-xs text-muted-foreground">de {totalConditions}</p>
              </div>
              {overdueConditions > 0 && (
                <Badge variant="destructive" className="mt-1">
                  {overdueConditions} atrasadas
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{criticalAlerts}</p>
                <p className="text-xs text-muted-foreground">críticos</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalActiveAlerts} total ativos
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Observações</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{activeObservations}</p>
                <p className="text-xs text-muted-foreground">ativas</p>
              </div>
              {followupObservations > 0 && (
                <Badge variant="outline" className="mt-1">
                  {followupObservations} followup
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compliance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{complianceRate}%</p>
              </div>
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros Unificados */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conditions" className="gap-2">
            <FileText className="h-4 w-4" />
            Condicionantes
            {pendingConditions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingConditions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="ml-1">
                {criticalAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="observations" className="gap-2">
            <FileText className="h-4 w-4" />
            Observações
            {activeObservations > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeObservations}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4 mt-6">
          {filteredConditions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhuma condicionante encontrada
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredConditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  onUpdate={onRefresh}
                  onCreateObservation={() => handleCreateObservationFromCondition(condition)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 mt-6">
          {filteredAlerts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Nenhum alerta ativo</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={() => {
                    // Implementar resolução
                    onRefresh();
                  }}
                  onSnooze={() => {
                    // Implementar adiamento
                  }}
                  onViewSource={() => {
                    // Navegar para origem
                    if (alert.source_condition_id) {
                      setActiveTab("conditions");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="observations" className="space-y-4 mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowObservationModal(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Nova Observação
            </Button>
          </div>

          {filteredObservations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhuma observação encontrada
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredObservations.map((observation) => (
                <ObservationCard
                  key={observation.id}
                  observation={observation}
                  onEdit={(id) => {
                    // Handle edit
                  }}
                  onArchive={(id) => {
                    // Handle archive
                    onRefresh();
                  }}
                  onComment={(id) => {
                    // Handle comment
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <LicenseActivityTimeline licenseId={licenseId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Observação */}
      <ObservationManager
        open={showObservationModal}
        onOpenChange={(open) => {
          setShowObservationModal(open);
          if (!open) setSelectedCondition(null);
        }}
        licenseId={licenseId}
      />
    </div>
  );
}
