import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, AlertTriangle, Activity, Plus, Calendar, Filter, BarChart3 } from "lucide-react";
import { auditService, type Audit, type ActivityLog } from "@/services/audit";
import { AuditModal } from "@/components/AuditModal";
import { AuditDetailsModal } from "@/components/AuditDetailsModal";
import { AuditReportsModal } from "@/components/AuditReportsModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Auditoria() {
  const { toast } = useToast();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  const { data: audits = [], isLoading: loadingAudits, refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: auditService.getAudits,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: auditService.getActivityLogs,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  const filteredAudits = audits.filter(audit => {
    if (filters.type !== 'all' && audit.audit_type !== filters.type) return false;
    if (filters.status !== 'all' && audit.status !== filters.status) return false;
    if (filters.search && !audit.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      'Planejada': { variant: "outline", className: "bg-slate-50 text-slate-700 border-slate-200" },
      'Agendada': { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      'Em Andamento': { variant: "default", className: "bg-amber-100 text-amber-800 border-amber-300" },
      'Concluída': { variant: "secondary", className: "bg-green-100 text-green-800 border-green-300" },
      'Cancelada': { variant: "destructive", className: "bg-red-100 text-red-800 border-red-300" }
    };
    
    const config = statusConfig[status] || { variant: "outline" as const, className: "" };
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const handleAuditClick = (audit: Audit) => {
    setSelectedAudit(audit);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <>
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
              <div className="text-2xl font-bold">{audits.length}</div>
              <p className="text-xs text-muted-foreground">auditorias registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits.filter(a => a.status === 'Em Andamento').length}
              </div>
              <p className="text-xs text-muted-foreground">auditorias ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits.filter(a => a.status === 'Concluída').length}
              </div>
              <p className="text-xs text-muted-foreground">este ano</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações de Sistema</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityLogs.length}</div>
              <p className="text-xs text-muted-foreground">últimas 24h</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="auditorias" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auditorias">Auditorias Formais</TabsTrigger>
            <TabsTrigger value="atividades">Log de Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="auditorias" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Auditorias Formais</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsReportsModalOpen(true)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Relatórios
                    </Button>
                    <Button onClick={() => setIsAuditModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Auditoria
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Input
                      placeholder="Buscar auditorias..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="w-64"
                    />
                  </div>
                  <Select 
                    value={filters.type} 
                    onValueChange={(value) => setFilters({...filters, type: value})}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="Interna">Interna</SelectItem>
                      <SelectItem value="Externa">Externa</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters({...filters, status: value})}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="Agendada">Agendada</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de Auditorias */}
                <div className="space-y-4">
                  {loadingAudits ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Carregando auditorias...</div>
                    </div>
                  ) : filteredAudits.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhuma auditoria encontrada</h3>
                      <p className="text-muted-foreground mb-4">
                        Crie sua primeira auditoria para começar
                      </p>
                      <Button onClick={() => setIsAuditModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Auditoria
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                      {filteredAudits.map((audit) => (
                        <Card key={audit.id} className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-primary/20"
                          onClick={() => handleAuditClick(audit)}>
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <h3 className="font-semibold text-lg">{audit.title}</h3>
                                  {getStatusBadge(audit.status)}
                                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    {audit.audit_type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {audit.scope || "Escopo não definido"}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    <span>Início: {audit.start_date ? formatDate(audit.start_date) : 'N/A'}</span>
                                  </div>
                                  {audit.end_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-primary" />
                                      <span>Fim: {formatDate(audit.end_date)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-primary" />
                                    <span>Auditor: {audit.auditor || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex lg:flex-col gap-2">
                                <Button size="sm" variant="outline" className="flex-1 lg:flex-none">
                                  Ver Detalhes
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Log de Atividades do Sistema</CardTitle>
                <CardDescription>
                  Registro automático de todas as ações realizadas na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Carregando log de atividades...</div>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma atividade registrada</h3>
                    <p className="text-muted-foreground">
                      As atividades do sistema aparecerão aqui automaticamente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{log.action_type}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.description}
                          </p>
                          {log.details_json && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeof log.details_json === 'string' ? log.details_json : JSON.stringify(log.details_json)}
                            </p>
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

        <AuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          onSuccess={() => {
            console.log('Audit creation success callback triggered');
            setIsAuditModalOpen(false);
            refetchAudits(); // Refresh the audit list
            toast({
              title: "Lista atualizada",
              description: "A lista de auditorias foi atualizada com sucesso."
            });
          }}
        />

        {selectedAudit && (
          <AuditDetailsModal
            audit={selectedAudit}
            isOpen={!!selectedAudit}
            onClose={() => setSelectedAudit(null)}
          />
        )}

        <AuditReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
        />
      </div>
    </>
  );
}