import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Calendar, 
  Users, 
  DollarSign, 
  Target, 
  TrendingUp,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { getProjects } from '@/services/projectManagement';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { ProjectGanttChart } from '@/components/ProjectGanttChart';
import { BurndownChart } from '@/components/BurndownChart';
import { ProjectResourcesWidget } from '@/components/ProjectResourcesWidget';

export function GerenciamentoProjetos() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejamento': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'Em Execução': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'Em Pausa': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'Concluído': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      case 'Cancelado': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'Média': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'Baixa': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (selectedProject) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedProject(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Voltar aos Projetos
            </Button>
            <h1 className="text-3xl font-bold">Detalhes do Projeto</h1>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gantt">Cronograma</TabsTrigger>
            <TabsTrigger value="burndown">Burndown</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="scope">Escopo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProjectDashboard projectId={selectedProject} />
          </TabsContent>

          <TabsContent value="gantt">
            <Card>
              <CardHeader>
                <CardTitle>Cronograma do Projeto</CardTitle>
                <CardDescription>
                  Visualização em Gantt das tarefas e dependências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectGanttChart projectId={selectedProject} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="burndown">
            <Card>
              <CardHeader>
                <CardTitle>Gráfico Burndown</CardTitle>
                <CardDescription>
                  Acompanhamento do progresso vs. tempo planejado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BurndownChart projectId={selectedProject} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <ProjectResourcesWidget projectId={selectedProject} />
          </TabsContent>

          <TabsContent value="scope">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Escopo</CardTitle>
                <CardDescription>
                  Controle de mudanças e aprovações de escopo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>Gestão de escopo em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Projetos</h1>
          <p className="text-muted-foreground mt-2">
            Gestão completa de projetos estratégicos e operacionais
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Execução</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'Em Execução').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(projects.reduce((acc, p) => acc + (p.budget || 0), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">
                  {projects.filter(p => 
                    p.end_date && new Date(p.end_date) < new Date() && p.status !== 'Concluído'
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-2 bg-muted rounded mb-2"></div>
                <div className="h-2 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro projeto estratégico
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProject(project.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="font-medium">{Math.round(project.progress_percentage)}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Início
                    </div>
                    <p className="font-medium">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fim
                    </div>
                    <p className="font-medium">{formatDate(project.end_date)}</p>
                  </div>
                </div>

                {project.budget > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Orçamento
                      </div>
                      <span className="font-medium">{formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}