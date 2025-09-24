import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, AlertTriangle, Activity, Plus, Calendar, Filter } from "lucide-react";
import { auditService, type Audit, type ActivityLog } from "@/services/audit";
import { AuditModal } from "@/components/AuditModal";
import { AuditDetailsModal } from "@/components/AuditDetailsModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Auditoria() {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    actionType: "all",
    startDate: "",
    endDate: ""
  });

  const { data: audits, isLoading: auditsLoading, refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: () => auditService.getAudits()
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-trail', filters],
    queryFn: () => auditService.getAuditTrail({
      action_type: filters.actionType || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined
    })
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Planejada": "outline",
      "Em Andamento": "default",
      "Concluída": "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Crítica": "destructive",
      "Maior": "default",
      "Menor": "secondary",
      "Oportunidade": "outline"
    };
    return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>;
  };

  const getActionTypeIcon = (actionType: string) => {
    const icons: Record<string, JSX.Element> = {
      "CREATE_AUDIT": <FileText className="h-4 w-4" />,
      "CREATE_FINDING": <AlertTriangle className="h-4 w-4" />,
      "UPDATE_FINDING": <Activity className="h-4 w-4" />
    };
    return icons[actionType] || <Activity className="h-4 w-4" />;
  };

  const stats = {
    totalAudits: audits?.length || 0,
    activeAudits: audits?.filter(a => a.status === 'Em Andamento').length || 0,
    completedAudits: audits?.filter(a => a.status === 'Concluída').length || 0,
    plannedAudits: audits?.filter(a => a.status === 'Planejada').length || 0
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Auditoria</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie auditorias formais e acompanhe o log de atividades do sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Auditorias</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAudits}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.plannedAudits}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audits">Gestão de Auditorias</TabsTrigger>
            <TabsTrigger value="activity-log">Log de Atividades do Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="audits" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Auditorias</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas auditorias formais e achados
                </p>
              </div>
              <Button onClick={() => setIsAuditModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Planejar Auditoria
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Auditorias</CardTitle>
                <CardDescription>
                  Clique em uma auditoria para ver seus detalhes e achados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : audits?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Nenhuma auditoria encontrada</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Comece criando sua primeira auditoria.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setIsAuditModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Planejar Auditoria
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {audits?.map((audit) => (
                      <div
                        key={audit.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedAudit(audit)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{audit.title}</h4>
                            {getStatusBadge(audit.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Tipo: {audit.audit_type}</span>
                            {audit.auditor && <span>Auditor: {audit.auditor}</span>}
                            {audit.end_date && (
                              <span>
                                Prazo: {format(new Date(audit.end_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity-log" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Log de Atividades</h3>
                <p className="text-sm text-muted-foreground">
                  Histórico completo de ações no sistema
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Ação</label>
                    <Select value={filters.actionType} onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="CREATE_AUDIT">Criar Auditoria</SelectItem>
                        <SelectItem value="CREATE_FINDING">Criar Achado</SelectItem>
                        <SelectItem value="UPDATE_FINDING">Atualizar Achado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Inicial</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Final</label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ search: "", actionType: "all", startDate: "", endDate: "" })}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline de Atividades</CardTitle>
                <CardDescription>
                  Registro cronológico de todas as ações importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityLogs?.data?.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Nenhuma atividade encontrada</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      As atividades aparecerão aqui conforme você usar o sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs?.data?.map((log: ActivityLog) => (
                      <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {getActionTypeIcon(log.action_type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{log.profiles?.full_name || 'Usuário'}</span>{' '}
                            {log.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {log.details_json && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer">Ver detalhes</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(log.details_json, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSuccess={() => {
          refetchAudits();
          setIsAuditModalOpen(false);
        }}
      />

      {selectedAudit && (
        <AuditDetailsModal
          audit={selectedAudit}
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}
    </div>
  );
}