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
    type: 'all',
    status: 'all',
    search: ''
  });

  const { data: audits = [], isLoading: loadingAudits, refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: auditService.getAudits,
  });

  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: auditService.getActivityLogs,
  });

  const filteredAudits = audits.filter(audit => {
    if (filters.type !== 'all' && audit.type !== filters.type) return false;
    if (filters.status !== 'all' && audit.status !== filters.status) return false;
    if (filters.search && !audit.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Agendada':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendada</Badge>;
      case 'Em Andamento':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Em Andamento</Badge>;
      case 'Concluída':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluída</Badge>;
      case 'Cancelada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                  <Button onClick={() => setIsAuditModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Auditoria
                  </Button>
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
                    filteredAudits.map((audit) => (
                      <Card key={audit.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleAuditClick(audit)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{audit.title}</h3>
                                {getStatusBadge(audit.status)}
                                <Badge variant="outline">{audit.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {audit.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Início: {formatDate(audit.start_date)}</span>
                                </div>
                                {audit.end_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Fim: {formatDate(audit.end_date)}</span>
                                  </div>
                                )}
                                <span>Auditor: {audit.auditor}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
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
                            <p className="text-sm font-medium">{log.action}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Usuário: {log.user} • Módulo: {log.module}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.details}
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
    </>
  );
}