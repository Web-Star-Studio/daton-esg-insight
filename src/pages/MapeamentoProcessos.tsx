import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Map, FileText, Users, Target, GitBranch, Eye, CheckCircle, Clock, AlertCircle, Network, Settings, BarChart3, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ProcessMapEditor from '@/components/ProcessMapEditor';
import { getProcessMaps, createProcessMap, ProcessMap } from '@/services/processMapping';
import { ProcessTemplateLibraryModal } from '@/components/ProcessTemplateLibraryModal';
import { ProcessMappingGuideModal } from '@/components/ProcessMappingGuideModal';

const MapeamentoProcessos = () => {
  const navigate = useNavigate();
  const [isCreateProcessOpen, setIsCreateProcessOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isMappingGuideOpen, setIsMappingGuideOpen] = useState(false);
  const [newProcessData, setNewProcessData] = useState({
    name: '',
    description: '',
    process_type: 'Operacional',
  });
  const queryClient = useQueryClient();

  // Query para buscar mapas de processo
  const { data: processMaps, isLoading } = useQuery({
    queryKey: ['processMaps'],
    queryFn: getProcessMaps,
  });

  // Mutação para criar um novo mapa de processo
  const createProcessMutation = useMutation({
    mutationFn: async (processData: typeof newProcessData) => {
      return createProcessMap({
        name: processData.name,
        description: processData.description,
        process_type: processData.process_type,
        status: 'Draft',
        version: '1.0',
        canvas_data: {},
        is_current_version: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processMaps'] });
      setIsCreateProcessOpen(false);
      setNewProcessData({
        name: '',
        description: '',
        process_type: 'Operacional',
      });
      toast.success('Mapa de processo criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar mapa de processo: ${error.message}`);
    },
  });

  const handleCreateProcess = () => {
    if (!newProcessData.name.trim()) {
      toast.error('Nome do processo é obrigatório');
      return;
    }
    createProcessMutation.mutate(newProcessData);
  };

  // Função para obter cor do badge do tipo de processo
  const getProcessTypeColor = (type: string) => {
    switch (type) {
      case 'Estratégico': return 'default';
      case 'Operacional': return 'secondary';
      case 'Apoio': return 'outline';
      default: return 'outline';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Review': return 'destructive';
      case 'Approved': return 'default';
      case 'Archived': return 'outline';
      default: return 'outline';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return Edit;
      case 'Review': return Clock;
      case 'Approved': return CheckCircle;
      case 'Archived': return AlertCircle;
      default: return Edit;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Se um processo está selecionado para edição, mostra o editor
  if (selectedProcessId) {
    return (
      <div className="container mx-auto p-6">
        <ProcessMapEditor 
          processMapId={selectedProcessId} 
          onClose={() => setSelectedProcessId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mapeamento de Processos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie todos os processos da sua organização de forma integrada
          </p>
        </div>
        
        <Dialog open={isCreateProcessOpen} onOpenChange={setIsCreateProcessOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Processo</Label>
                <Input
                  id="name"
                  value={newProcessData.name}
                  onChange={(e) => setNewProcessData({ ...newProcessData, name: e.target.value })}
                  placeholder="Ex: Atendimento ao Cliente, Processo de Vendas"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Processo</Label>
                <Select
                  value={newProcessData.process_type}
                  onValueChange={(value) => setNewProcessData({ ...newProcessData, process_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estratégico">Estratégico</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Apoio">Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newProcessData.description}
                  onChange={(e) => setNewProcessData({ ...newProcessData, description: e.target.value })}
                  placeholder="Descrição detalhada do processo e seus objetivos"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateProcessOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateProcess} 
                  disabled={createProcessMutation.isPending}
                >
                  {createProcessMutation.isPending ? 'Criando...' : 'Criar Processo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {processMaps && processMaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Map className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{processMaps.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Processos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {processMaps.filter(p => p.status === 'Approved').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Edit className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {processMaps.filter(p => p.status === 'Draft').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Elaboração</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {processMaps.filter(p => p.status === 'Review').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Revisão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="processes" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="processes" className="min-w-fit gap-2">
            <Map className="h-4 w-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="min-w-fit gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="methodology" className="min-w-fit gap-2">
            <Target className="h-4 w-4" />
            Metodologia
          </TabsTrigger>
          <TabsTrigger value="integration" className="min-w-fit gap-2">
            <Network className="h-4 w-4" />
            Integração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4 mt-6">
          {processMaps && processMaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processMaps.map((processMap) => {
                const StatusIcon = getStatusIcon(processMap.status);
                
                return (
                  <Card key={processMap.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        {processMap.name}
                      </CardTitle>
                      <CardDescription>
                        {processMap.description || 'Sem descrição'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getProcessTypeColor(processMap.process_type)}>
                            {processMap.process_type}
                          </Badge>
                          <Badge variant={getStatusColor(processMap.status)} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {processMap.status}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <GitBranch className="h-3 w-3" />
                            v{processMap.version}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Criado em {new Date(processMap.created_at).toLocaleDateString()}</p>
                          {processMap.approved_at && (
                            <p>Aprovado em {new Date(processMap.approved_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProcessId(processMap.id)}
                            className="gap-1 flex-1"
                          >
                            {processMap.status === 'Approved' || processMap.status === 'Archived' ? (
                              <>
                                <Eye className="h-4 w-4" />
                                Visualizar
                              </>
                            ) : (
                              <>
                                <Edit className="h-4 w-4" />
                                Editar
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProcessId(processMap.id)}
                            className="gap-1 flex-1"
                          >
                            <Network className="h-4 w-4" />
                            Mapear
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum mapa de processo encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando seu primeiro mapa de processo para mapear os fluxos da sua organização.
                </p>
                <Button onClick={() => setIsCreateProcessOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Processo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribuição por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processMaps && processMaps.length > 0 ? (
                  <div className="space-y-4">
                    {['Estratégico', 'Operacional', 'Apoio'].map(type => {
                      const count = processMaps.filter(p => p.process_type === type).length;
                      const percentage = processMaps.length > 0 ? (count / processMaps.length) * 100 : 0;
                      
                      return (
                        <div key={type}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{type}</span>
                            <span className="text-sm text-muted-foreground">{count} processos</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum dado disponível para análise
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Status dos Processos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processMaps && processMaps.length > 0 ? (
                  <div className="space-y-4">
                    {['Draft', 'Review', 'Approved', 'Archived'].map(status => {
                      const count = processMaps.filter(p => p.status === status).length;
                      const percentage = processMaps.length > 0 ? (count / processMaps.length) * 100 : 0;
                      
                      return (
                        <div key={status}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{status}</span>
                            <span className="text-sm text-muted-foreground">{count} processos</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum dado disponível para análise
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methodology" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metodologia SIPOC
                </CardTitle>
                <CardDescription>
                  Suppliers, Inputs, Process, Outputs, Customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  O SIPOC é uma ferramenta de mapeamento que identifica todos os elementos relevantes 
                  de um processo antes de começar o trabalho de melhoria.
                </p>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-primary/10 p-2 rounded">Fornecedores</div>
                  <div className="bg-secondary/10 p-2 rounded">Entradas</div>
                  <div className="bg-accent/10 p-2 rounded">Processo</div>
                  <div className="bg-primary/10 p-2 rounded">Saídas</div>
                  <div className="bg-secondary/10 p-2 rounded">Clientes</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Diagrama de Tartaruga
                </CardTitle>
                <CardDescription>
                  Análise completa dos elementos do processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  O Diagrama de Tartaruga oferece uma visão holística do processo, 
                  incluindo recursos, métodos, medições e riscos.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <div className="bg-primary/10 p-1 px-2 rounded">Entradas</div>
                    <div className="bg-secondary/10 p-1 px-2 rounded">Saídas</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-accent/10 p-1 px-2 rounded">Recursos</div>
                    <div className="bg-primary/10 p-1 px-2 rounded">Métodos</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-secondary/10 p-1 px-2 rounded">Medições</div>
                    <div className="bg-accent/10 p-1 px-2 rounded">Riscos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Integração com Outros Módulos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/gestao-stakeholders')}
                  >
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Gestão de Stakeholders</p>
                      <p className="text-sm text-muted-foreground">
                        Vincule partes interessadas aos processos
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div 
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/gestao-riscos')}
                  >
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Gestão de Riscos</p>
                      <p className="text-sm text-muted-foreground">
                        Identifique e monitore riscos por processo
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div 
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/quality-dashboard')}
                  >
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Indicadores de Performance</p>
                      <p className="text-sm text-muted-foreground">
                        Monitore KPIs específicos por processo
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recursos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => setIsTemplateLibraryOpen(true)}
                  >
                    <Map className="h-4 w-4" />
                    Biblioteca de Templates
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => setIsMappingGuideOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Guia de Mapeamento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      toast.info('Relatórios de processo em desenvolvimento');
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Relatórios de Processo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      toast.info('Configurações avançadas em desenvolvimento');
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Configurações Avançadas
                  </Button>
                </div>
              </CardContent>
             </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProcessTemplateLibraryModal 
        open={isTemplateLibraryOpen}
        onOpenChange={setIsTemplateLibraryOpen}
        onSelectTemplate={(templateId) => {
          toast.success(`Template ${templateId} selecionado!`);
          setIsTemplateLibraryOpen(false);
        }}
      />
      
      <ProcessMappingGuideModal 
        open={isMappingGuideOpen}
        onOpenChange={setIsMappingGuideOpen}
      />
    </div>
  );
};

export default MapeamentoProcessos;