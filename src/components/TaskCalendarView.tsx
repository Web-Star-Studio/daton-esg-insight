import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isBefore, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Edit, Clock, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { complianceService, type ComplianceTask } from "@/services/compliance";
import { ComplianceTaskModal } from "./ComplianceTaskModal";
import { TaskDetailsModal } from "./TaskDetailsModal";

export function TaskCalendarView() {
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['compliance-tasks', statusFilter],
    queryFn: () => complianceService.getTasks(statusFilter ? { status: statusFilter } : {}),
  });

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

  const handleEditTask = (task: ComplianceTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleViewDetails = (task: ComplianceTask) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.requirement?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.responsible?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando tarefas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tarefas de Compliance</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {tasks?.length === 0 
                  ? "Nenhuma tarefa de compliance cadastrada ainda." 
                  : "Nenhuma tarefa encontrada com os filtros aplicados."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Prazo Final</TableHead>
                    <TableHead>Requisito Associado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status, task.due_date)}
                      </TableCell>
                      <TableCell>
                        {task.responsible?.full_name || (
                          <span className="text-muted-foreground">Não atribuído</span>
                        )}
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
                        {task.requirement ? (
                          <div className="text-sm">
                            {task.requirement.reference_code && (
                              <div className="font-medium">{task.requirement.reference_code}</div>
                            )}
                            <div className="text-muted-foreground truncate max-w-xs">
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
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ComplianceTaskModal 
        open={showTaskModal} 
        onOpenChange={setShowTaskModal}
        task={selectedTask}
      />

      <TaskDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        task={selectedTask}
      />
    </>
  );
}