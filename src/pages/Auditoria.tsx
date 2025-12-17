import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditReportsTab } from "@/components/AuditReportsTab";
import { AuditProgramDashboard } from "@/components/audit/AuditProgramDashboard";
import { AuditCalendar } from "@/components/audit/AuditCalendar";
import { AuditAreasManagement } from "@/components/audit/AuditAreasManagement";
import { ISORequirementsLibrary } from "@/components/audit/ISORequirementsLibrary";
import { AuditorsManagement } from "@/components/audit/AuditorsManagement";
import { ISOTemplatesLibrary } from "@/components/audit/ISOTemplatesLibrary";
import { AuditConfigurationTab } from "@/components/audit/tabs/AuditConfigurationTab";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Users, AlertTriangle, Activity, Plus, Calendar, Filter, BarChart3, Search, Clock, CheckCircle } from "lucide-react";
import { auditService, type Audit, type ActivityLog } from "@/services/audit";
import { AuditModal } from "@/components/AuditModal";
import { AuditDetailsModal } from "@/components/AuditDetailsModal";
import { AuditReportsModal } from "@/components/AuditReportsModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

// Interface for SGQ Audits (migrated from AuditoriaInternas.tsx)
interface SGQAudit {
  id: string;
  title: string;
  audit_type: string;
  status: string;
  auditor: string | null;
  scope: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function Auditoria() {
  const { toast } = useToast();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isTemplatesLibraryOpen, setIsTemplatesLibraryOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // SGQ Audits state (migrated from AuditoriaInternas.tsx)
  const [sgqAudits, setSgqAudits] = useState<SGQAudit[]>([]);
  const [loadingSgq, setLoadingSgq] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateSgqModalOpen, setIsCreateSgqModalOpen] = useState(false);
  const [newSgqAudit, setNewSgqAudit] = useState({
    title: '',
    audit_type: 'Interna',
    status: 'Planejada',
    auditor: '',
    scope: '',
    start_date: '',
    end_date: ''
  });

  const { data: audits = [], isLoading: loadingAudits, refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: auditService.getAudits,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: auditService.getActivityLogs,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  // Load SGQ audits
  const loadSgqAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSgqAudits(data || []);
    } catch (error) {
      console.error('Erro ao carregar auditorias SGQ:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as auditorias SGQ.",
        variant: "destructive",
      });
    } finally {
      setLoadingSgq(false);
    }
  };

  const handleCreateSgqAudit = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) {
        throw new Error('Company ID não encontrado');
      }

      const { error } = await supabase
        .from('audits')
        .insert([{
          ...newSgqAudit,
          company_id: profile.company_id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Auditoria SGQ criada com sucesso!",
      });

      setIsCreateSgqModalOpen(false);
      setNewSgqAudit({
        title: '',
        audit_type: 'Interna',
        status: 'Planejada',
        auditor: '',
        scope: '',
        start_date: '',
        end_date: ''
      });
      
      loadSgqAudits();
    } catch (error) {
      console.error('Erro ao criar auditoria SGQ:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a auditoria SGQ.",
        variant: "destructive",
      });
    }
  };

  const filteredAudits = audits.filter(audit => {
    if (filters.type !== 'all' && audit.audit_type !== filters.type) return false;
    if (filters.status !== 'all' && audit.status !== filters.status) return false;
    if (filters.search && !audit.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const filteredSgqAudits = sgqAudits.filter(audit =>
    audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.auditor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ''
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planejada':
        return <Clock className="h-4 w-4" />;
      case 'Em Andamento':
        return <Activity className="h-4 w-4" />;
      case 'Concluída':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejada':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Em Andamento':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Concluída':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const handleAuditCreated = () => {
    refetchAudits();
    setIsAuditModalOpen(false);
    setEditingAudit(null);
  };

  const handleAuditSelected = (audit: Audit) => {
    setSelectedAudit(audit);
  };

  // Initialize SGQ audits
  React.useEffect(() => {
    loadSgqAudits();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema Unificado de Auditoria</h1>
          <p className="text-muted-foreground">
            Gestão completa de auditorias gerais e do sistema de qualidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAuditModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Auditoria
          </Button>
          <Button variant="outline" onClick={() => setIsReportsModalOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Auditorias</p>
                <p className="text-2xl font-bold">{audits.length + sgqAudits.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auditorias Gerais</p>
                <p className="text-2xl font-bold">{audits.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auditorias SGQ</p>
                <p className="text-2xl font-bold">{sgqAudits.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {[...audits, ...sgqAudits].filter(a => a.status === 'Em Andamento').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="program" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="program">Programa</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos ISO</TabsTrigger>
          <TabsTrigger value="auditors">Auditores</TabsTrigger>
          <TabsTrigger value="audits">Auditorias</TabsTrigger>
          <TabsTrigger value="sgq">SGQ</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="config" className="gap-1">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="space-y-4">
          <AuditProgramDashboard />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AuditCalendar 
            audits={[...audits, ...sgqAudits].map(a => ({
              id: a.id,
              title: a.title,
              date: a.start_date || a.created_at,
              type: a.audit_type,
              status: a.status
            }))}
            onAuditClick={(audit) => {
              const foundAudit = audits.find(a => a.id === audit.id);
              if (foundAudit) setSelectedAudit(foundAudit);
            }}
          />
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <AuditAreasManagement />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Requisitos ISO</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os requisitos das normas ISO
              </p>
            </div>
            <Button onClick={() => setIsTemplatesLibraryOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Biblioteca de Templates
            </Button>
          </div>
          <ISORequirementsLibrary />
        </TabsContent>

        <TabsContent value="auditors" className="space-y-4">
          <AuditorsManagement />
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          {/* Filters */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar auditorias..." 
                  className="pl-8 w-64"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Interna">Interna</SelectItem>
                  <SelectItem value="Externa">Externa</SelectItem>
                  <SelectItem value="Certificação">Certificação</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
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
            <Button onClick={() => setIsAuditModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Auditoria
            </Button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Planejada">Planejada</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      type: 'all',
                      status: 'all',
                      search: ''
                    });
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </Card>
          )}

          {/* Contador de Resultados */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredAudits.length} de {audits.length} auditorias
            {(filters.search || filters.type !== "all" || filters.status !== "all") && (
              <span className="ml-2 text-primary font-medium">
                (filtros ativos)
              </span>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auditorias Gerais</CardTitle>
              <CardDescription>
                Auditorias de compliance, ESG e outras auditorias organizacionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAudits ? (
                <div className="flex justify-center py-8">
                  <EnhancedLoading size="lg" text="Carregando auditorias..." />
                </div>
              ) : filteredAudits.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma auditoria encontrada</h3>
                  <p className="text-muted-foreground">
                    {filters.search || filters.type !== 'all' || filters.status !== 'all' 
                      ? 'Tente ajustar os filtros.' 
                      : 'Comece criando sua primeira auditoria.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudits.map((audit) => (
                      <TableRow 
                        key={audit.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleAuditSelected(audit)}
                      >
                        <TableCell className="font-medium">{audit.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{audit.audit_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{audit.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(audit.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAudit(audit);
                            }}
                            title="Editar auditoria"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sgq" className="space-y-4">
          {/* SGQ Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar auditorias SGQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCreateSgqModalOpen} onOpenChange={setIsCreateSgqModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Auditoria SGQ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Auditoria SGQ</DialogTitle>
                  <DialogDescription>
                    Defina os detalhes da nova auditoria interna do sistema de qualidade.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título da Auditoria</Label>
                    <Input
                      id="title"
                      value={newSgqAudit.title}
                      onChange={(e) => setNewSgqAudit({ ...newSgqAudit, title: e.target.value })}
                      placeholder="Ex: Auditoria ISO 9001 - Processo de Vendas"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="auditor">Auditor Responsável</Label>
                    <Input
                      id="auditor"
                      value={newSgqAudit.auditor}
                      onChange={(e) => setNewSgqAudit({ ...newSgqAudit, auditor: e.target.value })}
                      placeholder="Nome do auditor"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="scope">Escopo da Auditoria</Label>
                    <Textarea
                      id="scope"
                      value={newSgqAudit.scope}
                      onChange={(e) => setNewSgqAudit({ ...newSgqAudit, scope: e.target.value })}
                      placeholder="Defina o escopo da auditoria..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Data de Início</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newSgqAudit.start_date}
                        onChange={(e) => setNewSgqAudit({ ...newSgqAudit, start_date: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">Data de Término</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newSgqAudit.end_date}
                        onChange={(e) => setNewSgqAudit({ ...newSgqAudit, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newSgqAudit.status} onValueChange={(value) => setNewSgqAudit({ ...newSgqAudit, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planejada">Planejada</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateSgqModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSgqAudit} disabled={!newSgqAudit.title}>
                    Criar Auditoria
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Auditorias do Sistema de Qualidade
              </CardTitle>
              <CardDescription>
                Gestão completa de auditorias internas do SGQ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSgq ? (
                <div className="flex justify-center py-8">
                  <EnhancedLoading size="lg" text="Carregando auditorias SGQ..." />
                </div>
              ) : filteredSgqAudits.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma auditoria SGQ encontrada</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Tente uma pesquisa diferente.' : 'Comece criando sua primeira auditoria SGQ.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSgqAudits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{audit.title}</p>
                            {audit.scope && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {audit.scope.substring(0, 80)}...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {audit.auditor || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${getStatusColor(audit.status)}`}>
                            {getStatusIcon(audit.status)}
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {audit.start_date && audit.end_date ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(audit.start_date).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-muted-foreground">
                                até {new Date(audit.end_date).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <AuditReportsTab />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <AuditConfigurationTab />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
              <CardDescription>
                Histórico de ações realizadas no sistema de auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex justify-center py-8">
                  <EnhancedLoading size="lg" text="Carregando logs..." />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma atividade registrada</h3>
                  <p className="text-muted-foreground">
                    As atividades aparecerão aqui conforme são executadas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{log.action_type}</h4>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AuditModal
        isOpen={isAuditModalOpen || editingAudit !== null}
        onClose={() => {
          setIsAuditModalOpen(false);
          setEditingAudit(null);
        }}
        onSuccess={handleAuditCreated}
        audit={editingAudit || undefined}
      />

      {selectedAudit && (
        <AuditDetailsModal
          audit={selectedAudit}
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      {/* ISO Templates Library */}
      <ISOTemplatesLibrary
        open={isTemplatesLibraryOpen}
        onOpenChange={setIsTemplatesLibraryOpen}
        companyId={userProfile?.company_id || ''}
        onTemplateImported={() => {
          toast({ title: "Template importado", description: "Checklist criado com sucesso" });
        }}
      />
    </div>
  );
}