import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { dataCollectionService, DataCollectionTask, DataImportJob } from '@/services/dataCollection';
import { TaskKanbanBoard } from '@/components/TaskKanbanBoard';
import { DataImportZone } from '@/components/DataImportZone';
import { ImportHistoryTable } from '@/components/ImportHistoryTable';
import { RecurringTaskModal } from '@/components/RecurringTaskModal';
import { ChatAssistant } from '@/components/tools/ChatAssistant';

import { 
  ClipboardList, 
  Upload, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download,
  Bell,
  Filter,
  Search,
  BarChart3,
  Calendar,
  Users,
  CheckSquare,
  XSquare,
  Eye
} from 'lucide-react';

export default function ColetaDados() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskFilter, setTaskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    dueTasks: true,
    overdueTasks: true,
    completedTasks: false,
    importResults: true
  });

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

  // Enhanced metrics
  const totalProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const dueSoon = tasks.filter((task: DataCollectionTask) => {
    const dueDate = new Date(task.due_date);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return dueDate <= threeDaysFromNow && task.status === 'Pendente';
  }).length;

  // Filter tasks based on search and filter
  const filteredTasks = tasks.filter((task: DataCollectionTask) => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
    return matchesSearch && matchesFilter;
  });

  // Bulk operations
  const approveMutations = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const promises = taskIds.map(id => dataCollectionService.completeTask(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Tarefas aprovadas",
        description: `${selectedTasks.length} tarefas foram aprovadas com sucesso.`,
      });
      setSelectedTasks([]);
      refetchTasks();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao aprovar tarefas.",
        variant: "destructive",
      });
    }
  });

  const rejectMutations = useMutation({
    mutationFn: async (taskIds: string[]) => {
      // For now, we'll mark them as pending with a note
      const promises = taskIds.map(async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          return dataCollectionService.createTask({
            ...task,
            status: 'Pendente',
            name: `${task.name} - Revisão Necessária`
          });
        }
      });
      return Promise.all(promises.filter(Boolean));
    },
    onSuccess: () => {
      toast({
        title: "Tarefas rejeitadas",
        description: `${selectedTasks.length} tarefas foram marcadas para revisão.`,
      });
      setSelectedTasks([]);
      refetchTasks();
    }
  });

  // Notification check effect
  useEffect(() => {
    if (notificationSettings.dueTasks && dueSoon > 0) {
      toast({
        title: "Tarefas vencendo em breve",
        description: `Você tem ${dueSoon} tarefas vencendo nos próximos 3 dias.`,
        variant: "default",
      });
    }
    if (notificationSettings.overdueTasks && overdueTasks.length > 0) {
      toast({
        title: "Tarefas em atraso",
        description: `Você tem ${overdueTasks.length} tarefas em atraso.`,
        variant: "destructive",
      });
    }
  }, [tasks, notificationSettings, dueSoon, overdueTasks.length]);

  const handleBulkApproval = () => {
    if (selectedTasks.length === 0) return;
    approveMutations.mutate(selectedTasks);
  };

  const handleBulkRejection = () => {
    if (selectedTasks.length === 0) return;
    rejectMutations.mutate(selectedTasks);
  };

  const downloadTemplate = (type: string) => {
    // Mock template download
    const templates = {
      emissions: 'template_emissoes.xlsx',
      waste: 'template_residuos.xlsx',
      energy: 'template_energia.xlsx',
      water: 'template_agua.xlsx'
    };
    
    toast({
      title: "Template baixado",
      description: `Template ${templates[type as keyof typeof templates]} foi baixado com sucesso.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Central de Coleta de Dados</h1>
        <p className="text-muted-foreground">
          Gerencie tarefas de coleta e importação de dados em massa
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
                {overdueTasks.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-destructive mt-1" />
                )}
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vence em Breve</p>
                <p className="text-2xl font-bold text-warning">{dueSoon}</p>
                {dueSoon > 0 && (
                  <Bell className="h-4 w-4 text-warning mt-1" />
                )}
              </div>
              <Calendar className="h-8 w-8 text-warning" />
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
                <p className="text-sm font-medium text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(totalProgress)}%</p>
                <Progress value={totalProgress} className="mt-2" />
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Minhas Tarefas
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importação
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Aprovação
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6">
            {/* Progress Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dashboard de Progresso
                </CardTitle>
                <CardDescription>
                  Visão geral do progresso das tarefas de coleta de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progresso Geral</span>
                        <span className="text-sm text-muted-foreground">{Math.round(totalProgress)}%</span>
                      </div>
                      <Progress value={totalProgress} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Tarefas Concluídas</span>
                        <span className="text-sm text-muted-foreground">{completedTasks.length}/{tasks.length}</span>
                      </div>
                      <Progress value={tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-success">{completedToday}</p>
                        <p className="text-sm text-muted-foreground">Hoje</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-primary">{pendingTasks.length}</p>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Panel */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertas e Notificações
                  </CardTitle>
                  <CardDescription>
                    Acompanhe prazos e status importantes
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotificationSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueTasks.length > 0 && (
                    <div className="flex items-center gap-3 p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Tarefas em Atraso</p>
                        <p className="text-sm text-muted-foreground">
                          {overdueTasks.length} tarefas precisam de atenção imediata
                        </p>
                      </div>
                      <Badge variant="destructive">{overdueTasks.length}</Badge>
                    </div>
                  )}
                  
                  {dueSoon > 0 && (
                    <div className="flex items-center gap-3 p-3 border border-warning/20 bg-warning/5 rounded-lg">
                      <Calendar className="h-5 w-5 text-warning" />
                      <div className="flex-1">
                        <p className="font-medium text-warning">Vencimento Próximo</p>
                        <p className="text-sm text-muted-foreground">
                          {dueSoon} tarefas vencem nos próximos 3 dias
                        </p>
                      </div>
                      <Badge variant="secondary">{dueSoon}</Badge>
                    </div>
                  )}
                  
                  {completedToday > 0 && (
                    <div className="flex items-center gap-3 p-3 border border-success/20 bg-success/5 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div className="flex-1">
                        <p className="font-medium text-success">Progresso de Hoje</p>
                        <p className="text-sm text-muted-foreground">
                          {completedToday} tarefas foram concluídas hoje
                        </p>
                      </div>
                      <Badge variant="secondary">{completedToday}</Badge>
                    </div>
                  )}
                  
                  {overdueTasks.length === 0 && dueSoon === 0 && completedToday === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Tudo em dia!</p>
                      <p className="text-muted-foreground">Não há alertas no momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tarefas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={taskFilter} onValueChange={setTaskFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Tarefas</SelectItem>
                    <SelectItem value="Pendente">Pendentes</SelectItem>
                    <SelectItem value="Em Atraso">Em Atraso</SelectItem>
                    <SelectItem value="Concluído">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setTaskFilter('all');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <TaskKanbanBoard 
            tasks={filteredTasks}
            isLoading={tasksLoading}
            onTaskComplete={refetchTasks}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid gap-6">
            {/* Templates Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Templates de Importação
                  </CardTitle>
                  <CardDescription>
                    Baixe templates personalizáveis para diferentes tipos de dados
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTemplateModal(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Templates
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => downloadTemplate('emissions')}
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm font-medium">Emissões GEE</span>
                    <span className="text-xs text-muted-foreground">Dados de emissões</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => downloadTemplate('waste')}
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm font-medium">Resíduos</span>
                    <span className="text-xs text-muted-foreground">Logs de resíduos</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => downloadTemplate('energy')}
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm font-medium">Energia</span>
                    <span className="text-xs text-muted-foreground">Consumo energético</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => downloadTemplate('water')}
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm font-medium">Água</span>
                    <span className="text-xs text-muted-foreground">Consumo hídrico</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DataImportZone onUploadComplete={refetchJobs} />
            <ImportHistoryTable jobs={importJobs} />
          </div>
        </TabsContent>

        <TabsContent value="approval" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Aprovação de Dados
                </CardTitle>
                <CardDescription>
                  Revise e aprove dados coletados antes da consolidação
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedTasks.length > 0 && (
                  <>
                    <Button 
                      onClick={handleBulkApproval}
                      className="bg-success hover:bg-success/90"
                      disabled={approveMutations.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar ({selectedTasks.length})
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleBulkRejection}
                      disabled={rejectMutations.isPending}
                    >
                      <XSquare className="h-4 w-4 mr-2" />
                      Rejeitar ({selectedTasks.length})
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tasks pending approval */}
                {filteredTasks.filter(task => task.status === 'Pendente').map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{task.name}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {task.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Vence em: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-success hover:bg-success/90"
                        onClick={() => approveMutations.mutate([task.id])}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => rejectMutations.mutate([task.id])}
                      >
                        <XSquare className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredTasks.filter(task => task.status === 'Pendente').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />
                    <p className="text-lg font-medium">Tudo aprovado!</p>
                    <p className="text-muted-foreground">Não há dados pendentes de aprovação</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6">
            {/* Recurring Tasks */}
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

            {/* Data Validation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Configurações de Validação
                </CardTitle>
                <CardDescription>
                  Configure regras de validação para dados importados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Validação Automática</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-validation" defaultChecked />
                      <Label htmlFor="auto-validation" className="text-sm">
                        Executar validação automática em importações
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rejeição Automática</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-rejection" />
                      <Label htmlFor="auto-rejection" className="text-sm">
                        Rejeitar automaticamente dados inválidos
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Equipe
                </CardTitle>
                <CardDescription>
                  Configure responsáveis e permissões para coleta de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Coletores de Dados</p>
                      <p className="text-sm text-muted-foreground">
                        Usuários que podem inserir e coletar dados
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Aprovadores</p>
                      <p className="text-sm text-muted-foreground">
                        Usuários que podem aprovar dados coletados
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RecurringTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        onTaskCreated={() => {
          refetchTasks();
          setShowCreateTaskModal(false);
        }}
      />

      {/* Template Management Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Templates</DialogTitle>
            <DialogDescription>
              Personalize templates de importação para diferentes tipos de dados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Template</Label>
                <Select defaultValue="emissions">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emissions">Emissões GEE</SelectItem>
                    <SelectItem value="waste">Resíduos</SelectItem>
                    <SelectItem value="energy">Energia</SelectItem>
                    <SelectItem value="water">Água</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campos Obrigatórios</Label>
                <Input placeholder="Ex: data, quantidade, tipo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Regras de Validação</Label>
              <Textarea placeholder="Defina regras específicas de validação para este template" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowTemplateModal(false)}>
                Salvar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Modal */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Notificação</DialogTitle>
            <DialogDescription>
              Configure quando e como receber notificações sobre suas tarefas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tarefas Próximas do Vencimento</p>
                <p className="text-sm text-muted-foreground">3 dias antes do vencimento</p>
              </div>
              <Checkbox
                checked={notificationSettings.dueTasks}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, dueTasks: !!checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tarefas em Atraso</p>
                <p className="text-sm text-muted-foreground">Notificação diária</p>
              </div>
              <Checkbox
                checked={notificationSettings.overdueTasks}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, overdueTasks: !!checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tarefas Concluídas</p>
                <p className="text-sm text-muted-foreground">Confirmação de conclusão</p>
              </div>
              <Checkbox
                checked={notificationSettings.completedTasks}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, completedTasks: !!checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resultados de Importação</p>
                <p className="text-sm text-muted-foreground">Status de processamento</p>
              </div>
              <Checkbox
                checked={notificationSettings.importResults}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, importResults: !!checked }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNotificationSettings(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowNotificationSettings(false)}>
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat IA Assistant - Contexto de Coleta de Dados */}
      <ChatAssistant embedded={false} />
      </div>
  );
}