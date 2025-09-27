import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useCompliance } from '@/contexts/ComplianceContext';
import { format, isBefore, isAfter, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskDetailsModal } from '../TaskDetailsModal';

export function TaskManagement() {
  const {
    filteredTasks,
    tasksLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    setShowTaskModal,
    selectedTask,
    setSelectedTask
  } = useCompliance();

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = isBefore(due, today) && status !== 'Concluído';
    const isDueSoon = isAfter(due, today) && isBefore(due, addDays(today, 7)) && status !== 'Concluído';

    if (status === 'Concluído') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Em Atraso</Badge>;
    }
    if (isDueSoon) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" />Vencendo</Badge>;
    }
    if (status === 'Em Andamento') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Circle className="w-3 h-3 mr-1" />Em Andamento</Badge>;
    }
    return <Badge variant="secondary"><Circle className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  const getPriorityFromDueDate = (dueDate: string, status: string) => {
    if (status === 'Concluído') return 'Concluída';
    
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'Em Atraso';
    if (daysDiff <= 3) return 'Crítica';
    if (daysDiff <= 7) return 'Alta';
    if (daysDiff <= 30) return 'Média';
    return 'Baixa';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Em Atraso': return 'text-red-600 bg-red-50 border-red-200';
      case 'Crítica': return 'text-red-600 bg-red-50 border-red-200';
      case 'Alta': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Média': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Baixa': return 'text-green-600 bg-green-50 border-green-200';
      case 'Concluída': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  if (tasksLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando tarefas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestão de Tarefas</h2>
          <p className="text-sm text-muted-foreground">
            Monitore e gerencie todas as tarefas de compliance com análise de prioridade
          </p>
        </div>
        <Button onClick={() => setShowTaskModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, descrição, responsável ou requisito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Em Atraso">Em Atraso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando sua primeira tarefa de compliance."
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
                <Button onClick={() => setShowTaskModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Tarefa
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tarefa
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Prioridade
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Vencimento
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Responsável
                    </div>
                  </TableHead>
                  <TableHead>Requisito Associado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const priority = getPriorityFromDueDate(task.due_date, task.status);
                  
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status, task.due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.frequency}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.responsible?.full_name ? (
                          <div className="text-sm">
                            <div className="font-medium">{task.responsible.full_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não atribuído</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.requirement ? (
                          <div className="text-sm">
                            {task.requirement.reference_code && (
                              <div className="font-medium">{task.requirement.reference_code}</div>
                            )}
                            <div className="text-muted-foreground line-clamp-1">
                              {task.requirement.title}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(task)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                            title="Editar tarefa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        task={selectedTask}
      />
    </div>
  );
}