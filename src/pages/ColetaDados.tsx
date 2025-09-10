import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { dataCollectionService, DataCollectionTask, DataImportJob } from '@/services/dataCollection';
import { TaskKanbanBoard } from '@/components/TaskKanbanBoard';
import { DataImportZone } from '@/components/DataImportZone';
import { ImportHistoryTable } from '@/components/ImportHistoryTable';
import { RecurringTaskModal } from '@/components/RecurringTaskModal';
import { ClipboardList, Upload, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function ColetaDados() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['data-collection-tasks'],
    queryFn: () => dataCollectionService.getTasks(),
    enabled: !!user,
  });

  const { data: importJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: () => dataCollectionService.getImportJobs(),
    enabled: !!user,
  });

  const pendingTasks = tasks.filter((task: DataCollectionTask) => task.status === 'Pendente');
  const overdueTasks = tasks.filter((task: DataCollectionTask) => task.status === 'Em Atraso');
  const completedTasks = tasks.filter((task: DataCollectionTask) => task.status === 'Concluído');

  const completedToday = completedTasks.filter((task: DataCollectionTask) => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = new Date(task.updated_at).toISOString().split('T')[0];
    return taskDate === today;
  }).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Central de Coleta de Dados</h1>
        <p className="text-muted-foreground">
          Gerencie tarefas de coleta e importação de dados em massa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-destructive">{overdueTasks.length}</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluído Hoje</p>
                <p className="text-2xl font-bold text-success">{completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Concluído</p>
                <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Minhas Tarefas
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importação em Massa
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar Tarefas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <TaskKanbanBoard 
            tasks={tasks}
            isLoading={tasksLoading}
            onTaskComplete={refetchTasks}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid gap-6">
            <DataImportZone onUploadComplete={refetchJobs} />
            <ImportHistoryTable jobs={importJobs} />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tarefas Recorrentes</CardTitle>
                <CardDescription>
                  Configure tarefas automáticas de coleta de dados
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateTaskModal(true)}>
                Nova Tarefa Recorrente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-8 text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Configuração de Tarefas Recorrentes
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Configure tarefas automáticas para coleta regular de dados como faturas de energia, 
                    registros de resíduos e renovações de licenças.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateTaskModal(true)}
                  >
                    Criar Primeira Tarefa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal for Creating Recurring Tasks */}
      <RecurringTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        onTaskCreated={() => {
          refetchTasks();
          setShowCreateTaskModal(false);
        }}
      />
    </div>
  );
}