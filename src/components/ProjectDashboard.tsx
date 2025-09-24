import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Target, 
  Users, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus
} from 'lucide-react';
import { 
  getProject, 
  getProjectTasks, 
  getProjectMilestones, 
  getProjectResources 
} from '@/services/projectManagement';
import { TaskModal } from '@/components/TaskModal';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => getProjectTasks(projectId),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => getProjectMilestones(projectId),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: () => getProjectResources(projectId),
  });

  if (!project) {
    return <div>Carregando...</div>;
  }

  const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
  const overdueTasks = tasks.filter(task => 
    task.end_date && new Date(task.end_date) < new Date() && task.status !== 'Concluída'
  ).length;

  const upcomingMilestones = milestones.filter(milestone => 
    milestone.status === 'Pendente' && 
    new Date(milestone.target_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const totalBudgetUsage = project.spent_budget / project.budget * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
              <CardDescription className="text-base">
                {project.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge variant="outline">{project.project_type}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold">{Math.round(project.progress_percentage)}%</p>
                <Progress value={project.progress_percentage} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tarefas</p>
                <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orçamento</p>
                <p className="text-2xl font-bold">{Math.round(totalBudgetUsage)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Utilizado</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recursos</p>
                <p className="text-2xl font-bold">{resources.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Alocados</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fase Atual</p>
                <p className="font-semibold">{project.phase}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Metodologia</p>
                <p className="font-semibold">{project.methodology}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Início Planejado</p>
                <p className="font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {project.planned_start_date ? formatDate(project.planned_start_date) : 'Não definido'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fim Planejado</p>
                <p className="font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {project.planned_end_date ? formatDate(project.planned_end_date) : 'Não definido'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Orçamento</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Planejado:</span>
                  <span className="font-semibold">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gasto:</span>
                  <span className="font-semibold">{formatCurrency(project.spent_budget)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Disponível:</span>
                  <span>{formatCurrency(project.budget - project.spent_budget)}</span>
                </div>
                <Progress value={totalBudgetUsage} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts and Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas e Problemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueTasks > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="font-medium text-red-800">
                    {overdueTasks} tarefa(s) em atraso
                  </p>
                  <p className="text-sm text-red-600">
                    Verifique as tarefas que passaram do prazo
                  </p>
                </div>
              </div>
            )}

            {totalBudgetUsage > 80 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Orçamento próximo do limite
                  </p>
                  <p className="text-sm text-yellow-600">
                    {Math.round(totalBudgetUsage)}% do orçamento já foi utilizado
                  </p>
                </div>
              </div>
            )}

            {upcomingMilestones.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Próximos Marcos</p>
                {upcomingMilestones.slice(0, 3).map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">{milestone.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(milestone.target_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {overdueTasks === 0 && totalBudgetUsage <= 80 && upcomingMilestones.length === 0 && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-green-800">Projeto em dia</p>
                  <p className="text-sm text-green-600">
                    Nenhum problema identificado
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tarefas Recentes</CardTitle>
              <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma tarefa criada</p>
              <p className="text-sm">Comece adicionando tarefas ao projeto</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={task.status === 'Concluída' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                    <div className="text-right text-sm">
                      <p className="font-medium">{Math.round(task.progress_percentage)}%</p>
                      <Progress value={task.progress_percentage} className="w-16 h-1 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskModal 
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        projectId={projectId}
        onSuccess={() => {
          refetchTasks();
          setIsTaskModalOpen(false);
        }}
      />
    </div>
  );
}