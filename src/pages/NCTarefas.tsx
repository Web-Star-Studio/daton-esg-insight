import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Zap, 
  Search, 
  ClipboardList, 
  Play, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Check,
  Filter,
  Loader2
} from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMyNCTasks, useCompleteNCTask } from "@/hooks/useNonConformity";
import { NCTask } from "@/services/nonConformityService";
import { cn } from "@/lib/utils";

type TaskType = 'registration' | 'immediate_action' | 'cause_analysis' | 'planning' | 'implementation' | 'effectiveness';

const taskTypeConfig: Record<TaskType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  registration: { label: "Registros", icon: FileText, color: "text-blue-500" },
  immediate_action: { label: "Ações Imediatas", icon: Zap, color: "text-amber-500" },
  cause_analysis: { label: "Causa e Planejamento", icon: Search, color: "text-purple-500" },
  planning: { label: "Planejamento", icon: ClipboardList, color: "text-indigo-500" },
  implementation: { label: "Implementação", icon: Play, color: "text-green-500" },
  effectiveness: { label: "Eficácia", icon: CheckCircle2, color: "text-teal-500" },
};

const priorityConfig: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  Urgente: { label: "Urgente", variant: "destructive" },
  Alta: { label: "Alta", variant: "destructive" },
  Normal: { label: "Normal", variant: "default" },
  Baixa: { label: "Baixa", variant: "secondary" },
};

export default function NCTarefas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const { data: tasks = [], isLoading } = useMyNCTasks();
  const completeTaskMutation = useCompleteNCTask();

  // Filter and group tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.non_conformity as any)?.nc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.non_conformity as any)?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesTab = activeTab === "all" || task.task_type === activeTab;
      
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [tasks, searchTerm, statusFilter, activeTab]);

  // Count tasks by type
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    tasks.forEach(task => {
      if (task.status !== 'Concluída' && task.status !== 'Cancelada') {
        counts.all = (counts.all || 0) + 1;
        counts[task.task_type] = (counts[task.task_type] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const getDeadlineStatus = (dueDate: string, status: string) => {
    if (status === 'Concluída' || status === 'Cancelada') {
      return { label: "OK", variant: "secondary" as const };
    }
    
    const date = new Date(dueDate);
    const daysUntil = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) {
      return { label: "Atrasada", variant: "destructive" as const };
    }
    if (isToday(date)) {
      return { label: "Hoje", variant: "destructive" as const };
    }
    if (daysUntil <= 3) {
      return { label: `${daysUntil}d`, variant: "default" as const };
    }
    return { label: `${daysUntil}d`, variant: "secondary" as const };
  };

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate(taskId);
  };

  const handleOpenNC = (ncId: string) => {
    navigate(`/nao-conformidades/${ncId}`);
  };

  const renderTaskRow = (task: NCTask) => {
    const config = taskTypeConfig[task.task_type as TaskType];
    const priority = priorityConfig[task.priority] || { label: task.priority, variant: "default" as const };
    const deadline = getDeadlineStatus(task.due_date, task.status);
    const Icon = config?.icon || FileText;
    const nc = task.non_conformity as any;

    return (
      <TableRow key={task.id} className={cn(
        task.status === 'Concluída' && "opacity-60",
        deadline.variant === 'destructive' && task.status !== 'Concluída' && "bg-red-50"
      )}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", config?.color)} />
            <div>
              <p className="font-medium text-sm">{task.title}</p>
              {nc && (
                <p className="text-xs text-muted-foreground">
                  {nc.nc_number} - {nc.title}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={priority.variant} className="text-xs">
            {priority.label}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={deadline.variant} className="text-xs">
            {deadline.label === "Atrasada" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {deadline.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge 
            variant={task.status === 'Concluída' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {task.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {task.status !== 'Concluída' && task.status !== 'Cancelada' && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleCompleteTask(task.id)}
                disabled={completeTaskMutation.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => nc && handleOpenNC(nc.id)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Minhas Tarefas de NC</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas pendentes de não conformidades
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Total Pendente</p>
                  <p className="text-2xl font-bold">{taskCounts.all || 0}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Atrasadas</p>
                  <p className="text-2xl font-bold text-destructive">
                    {tasks.filter(t => 
                      t.status !== 'Concluída' && 
                      t.status !== 'Cancelada' && 
                      isPast(new Date(t.due_date)) && 
                      !isToday(new Date(t.due_date))
                    ).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Para Hoje</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {tasks.filter(t => 
                      t.status !== 'Concluída' && 
                      t.status !== 'Cancelada' && 
                      isToday(new Date(t.due_date))
                    ).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => t.status === 'Concluída').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por título ou número da NC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Atrasada">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                <TabsTrigger value="all" className="relative">
                  Todas
                  {taskCounts.all > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {taskCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                {Object.entries(taskTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const count = taskCounts[key] || 0;
                  return (
                    <TabsTrigger key={key} value={key} className="relative hidden lg:flex">
                      <Icon className={cn("h-4 w-4 mr-1", config.color)} />
                      <span className="hidden xl:inline">{config.label}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma tarefa encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map(renderTaskRow)}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
