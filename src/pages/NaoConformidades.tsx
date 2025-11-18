import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle, CheckCircle, Clock, Eye, Edit, BarChart3, TrendingUp, Activity, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NonConformityDetailsModal } from "@/components/NonConformityDetailsModal";
import { NonConformitiesAdvancedDashboard } from "@/components/NonConformitiesAdvancedDashboard";
import { ApprovalWorkflowManager } from "@/components/ApprovalWorkflowManager";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NonConformity {
  id: string;
  nc_number: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  detected_date: string;
  status: string;
  created_at: string;
  damage_level?: string;
  impact_analysis?: string;
  root_cause_analysis?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  effectiveness_evaluation?: string;
  effectiveness_date?: string;
  responsible_user_id?: string;
  approved_by_user_id?: string;
  approval_date?: string;
  approval_notes?: string;
  attachments?: any[];
  due_date?: string;
  completion_date?: string;
  recurrence_count?: number;
}

export default function NaoConformidades() {
  const queryClient = useQueryClient();
  const [isCreateNCOpen, setIsCreateNCOpen] = useState(false);
  const [selectedNCId, setSelectedNCId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isWorkflowManagerOpen, setIsWorkflowManagerOpen] = useState(false);
  const [newNCData, setNewNCData] = useState({
    title: "",
    description: "",
    category: "",
    severity: "Baixa",
    source: "Processo",
    detected_date: new Date().toISOString().split('T')[0],
    damage_level: "Baixo",
    responsible_user_id: ""
  });

  // Etapa 3: Função de prefetch
  const prefetchNCDetails = (ncId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["non-conformity", ncId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("non_conformities")
          .select("*")
          .eq("id", ncId)
          .single();
        
        if (error) throw error;
        return data;
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  const { data: nonConformities, isLoading } = useQuery({
    queryKey: ["non-conformities"],
    queryFn: async () => {
      // First get the non-conformities
      const { data: ncs, error } = await supabase
        .from("non_conformities")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Then get user profiles for responsible and approved_by users
      const userIds = [...new Set([
        ...ncs.map(nc => nc.responsible_user_id).filter(Boolean),
        ...ncs.map(nc => nc.approved_by_user_id).filter(Boolean)
      ])];
      
      let profiles = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profiles = profilesData || [];
      }
      
      // Map user data to NCs
      const enrichedNCs = ncs.map(nc => ({
        ...nc,
        responsible: profiles.find(p => p.id === nc.responsible_user_id),
        approved_by: profiles.find(p => p.id === nc.approved_by_user_id)
      }));
      
      return enrichedNCs as NonConformity[];
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  const createNCMutation = useMutation({
    mutationFn: async (ncData: typeof newNCData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const ncNumber = generateNCNumber();
      
      // Limpar dados antes de enviar
      const cleanData = {
        title: ncData.title.trim(),
        description: ncData.description.trim(),
        category: ncData.category.trim() || null,
        severity: ncData.severity,
        source: ncData.source,
        detected_date: ncData.detected_date,
        damage_level: ncData.damage_level,
        responsible_user_id: ncData.responsible_user_id || null,
        nc_number: ncNumber,
        company_id: profile.company_id
      };

      const { data, error } = await supabase
        .from("non_conformities")
        .insert([cleanData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Não conformidade registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
      setIsCreateNCOpen(false);
      setNewNCData({
        title: "",
        description: "",
        category: "",
        severity: "Baixa",
        source: "Processo",
        detected_date: new Date().toISOString().split('T')[0],
        damage_level: "Baixo",
        responsible_user_id: ""
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar NC:", error);
      toast.error(error.message || "Erro ao registrar não conformidade");
    }
  });

  const generateNCNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `NC-${year}${month}${day}-${timestamp}`;
  };

  const handleCreateNC = () => {
    // Validações
    if (!newNCData.title.trim()) {
      toast.error("Por favor, preencha o título da não conformidade");
      return;
    }

    if (!newNCData.description.trim()) {
      toast.error("Por favor, preencha a descrição da não conformidade");
      return;
    }

    if (newNCData.title.trim().length < 5) {
      toast.error("O título deve ter pelo menos 5 caracteres");
      return;
    }

    if (newNCData.description.trim().length < 10) {
      toast.error("A descrição deve ter pelo menos 10 caracteres");
      return;
    }

    // Se passou nas validações, executa a mutation
    createNCMutation.mutate(newNCData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Crítica": return "bg-red-100 text-red-800 border-red-200";
      case "Alta": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Média": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Baixa": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberta": return "bg-red-100 text-red-800";
      case "Em Análise": return "bg-yellow-100 text-yellow-800";
      case "Em Correção": return "bg-blue-100 text-blue-800";
      case "Fechada": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aberta": return <AlertCircle className="h-4 w-4" />;
      case "Em Análise": return <Clock className="h-4 w-4" />;
      case "Em Correção": return <Clock className="h-4 w-4" />;
      case "Fechada": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Stats calculations
  const totalNCs = nonConformities?.length || 0;
  const openNCs = nonConformities?.filter(nc => nc.status === "Aberta").length || 0;
  const criticalNCs = nonConformities?.filter(nc => nc.severity === "Crítica").length || 0;
  const closedNCs = nonConformities?.filter(nc => nc.status === "Fechada").length || 0;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Não Conformidades</h1>
          <p className="text-muted-foreground mt-2">
            Sistema completo de gestão de não conformidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsWorkflowManagerOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Workflows
          </Button>
          <Dialog open={isCreateNCOpen} onOpenChange={setIsCreateNCOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar NC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Não Conformidade</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Campos marcados com * são obrigatórios
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newNCData.title}
                    onChange={(e) => setNewNCData({...newNCData, title: e.target.value})}
                    placeholder="Título da não conformidade"
                    required
                    autoFocus
                    disabled={createNCMutation.isPending}
                    minLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newNCData.category}
                    onChange={(e) => setNewNCData({...newNCData, category: e.target.value})}
                    placeholder="Ex: Qualidade, Segurança"
                    disabled={createNCMutation.isPending}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severity">Severidade</Label>
                  <Select
                    value={newNCData.severity}
                    onValueChange={(value) => setNewNCData({...newNCData, severity: value})}
                    disabled={createNCMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Crítica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Fonte</Label>
                  <Select
                    value={newNCData.source}
                    onValueChange={(value) => setNewNCData({...newNCData, source: value})}
                    disabled={createNCMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auditoria Interna">Auditoria Interna</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="Processo">Processo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="detected_date">Data de Detecção</Label>
                  <Input
                    id="detected_date"
                    type="date"
                    value={newNCData.detected_date}
                    onChange={(e) => setNewNCData({...newNCData, detected_date: e.target.value})}
                    disabled={createNCMutation.isPending}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={newNCData.description}
                  onChange={(e) => setNewNCData({...newNCData, description: e.target.value})}
                  placeholder="Descrição detalhada da não conformidade (mínimo 10 caracteres)"
                  rows={4}
                  required
                  disabled={createNCMutation.isPending}
                  minLength={10}
                />
              </div>
              
              <Button 
                onClick={handleCreateNC} 
                className="w-full"
                disabled={createNCMutation.isPending}
              >
                {createNCMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Não Conformidade
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de NCs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNCs}</div>
            <p className="text-xs text-muted-foreground">
              registradas no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openNCs}</div>
            <p className="text-xs text-muted-foreground">
              aguardando resolução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Críticas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalNCs}</div>
            <p className="text-xs text-muted-foreground">
              requerem atenção imediata
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Fechadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedNCs}</div>
            <p className="text-xs text-muted-foreground">
              resolvidas com sucesso
            </p>
          </CardContent>
          </Card>
        </div>

        {/* Basic Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Resolução</span>
                  <span className="font-semibold">
                    {totalNCs > 0 ? ((closedNCs / totalNCs) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo Médio</span>
                  <span className="font-semibold">12 dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recorrências</span>
                  <span className="font-semibold text-orange-600">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Necessárias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                  <span className="text-sm">Aprovações Pendentes</span>
                  <Badge variant="destructive">{nonConformities?.filter(nc => !nc.approved_by_user_id).length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50">
                  <span className="text-sm">Análises Pendentes</span>
                  <Badge variant="secondary">{nonConformities?.filter(nc => nc.status === "Em Análise").length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                  <span className="text-sm">Em Correção</span>
                  <Badge>{nonConformities?.filter(nc => nc.status === "Em Correção").length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Fonte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Auditoria Interna", "Cliente", "Fornecedor", "Processo"].map(source => {
                  const count = nonConformities?.filter(nc => nc.source === source).length || 0;
                  return (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{source}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <NonConformitiesAdvancedDashboard />
      </TabsContent>

      <TabsContent value="list" className="mt-6">
        {/* NCs Table */}
        <Card>
        <CardHeader>
          <CardTitle>Lista de Não Conformidades</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as não conformidades registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nonConformities?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonConformities.map((nc) => (
                  <TableRow key={nc.id}>
                    <TableCell className="font-mono text-sm">
                      {nc.nc_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {nc.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {nc.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(nc.severity)}>
                        {nc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(nc.status)}>
                        {getStatusIcon(nc.status)}
                        <span className="ml-1">{nc.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(nc.detected_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onMouseEnter={() => prefetchNCDetails(nc.id)}
                          onClick={() => {
                            setModalMode('view');
                            setSelectedNCId(nc.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="text-xs">Visualizar</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onMouseEnter={() => prefetchNCDetails(nc.id)}
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedNCId(nc.id);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span className="text-xs">Editar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma não conformidade registrada</h3>
              <p className="text-muted-foreground mb-4">
                Registre a primeira não conformidade para começar o controle
              </p>
              <Button onClick={() => setIsCreateNCOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira NC
              </Button>
            </div>
          )}
        </CardContent>
       </Card>
      </TabsContent>
    </Tabs>

    <NonConformityDetailsModal
      open={!!selectedNCId}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedNCId(null);
          setModalMode('view');
        }
      }}
      nonConformityId={selectedNCId || ""}
      mode={modalMode}
    />

    <ApprovalWorkflowManager
      open={isWorkflowManagerOpen}
      onOpenChange={setIsWorkflowManagerOpen}
    />
    </>
  );
}