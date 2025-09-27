import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Trash2, User, Calendar } from 'lucide-react';
import { useCompliance } from '@/contexts/ComplianceContext';
import { toast } from 'sonner';

export function TaskBulkActions() {
  const { filteredTasks, updateTask, users } = useCompliance();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkResponsible, setBulkResponsible] = useState<string>('');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTasks.length === 0) {
      toast.error('Selecione uma ação e pelo menos uma tarefa');
      return;
    }

    try {
      const promises = selectedTasks.map(taskId => {
        let updateData: any = {};

        switch (bulkAction) {
          case 'mark-completed':
            updateData = { status: 'Concluído' };
            break;
          case 'mark-in-progress':
            updateData = { status: 'Em Andamento' };
            break;
          case 'assign-responsible':
            if (!bulkResponsible) {
              toast.error('Selecione um responsável');
              return;
            }
            updateData = { responsible_user_id: bulkResponsible };
            break;
          case 'extend-deadline':
            const task = filteredTasks.find(t => t.id === taskId);
            if (task) {
              const newDate = new Date(task.due_date);
              newDate.setDate(newDate.getDate() + 7);
              updateData = { due_date: newDate.toISOString().split('T')[0] };
            }
            break;
        }

        return updateTask(taskId, updateData);
      });

      await Promise.all(promises);
      toast.success(`${selectedTasks.length} tarefas atualizadas com sucesso`);
      setSelectedTasks([]);
      setBulkAction('');
      setBulkResponsible('');
    } catch (error) {
      toast.error('Erro ao executar ação em lote');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Em Andamento':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Em Atraso':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Ações em Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de ação em lote */}
        <div className="flex flex-wrap gap-3">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mark-completed">Marcar como Concluído</SelectItem>
              <SelectItem value="mark-in-progress">Marcar Em Andamento</SelectItem>
              <SelectItem value="assign-responsible">Atribuir Responsável</SelectItem>
              <SelectItem value="extend-deadline">Prorrogar Prazo (+7 dias)</SelectItem>
            </SelectContent>
          </Select>

          {bulkAction === 'assign-responsible' && (
            <Select value={bulkResponsible} onValueChange={setBulkResponsible}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button 
            onClick={handleBulkAction}
            disabled={!bulkAction || selectedTasks.length === 0}
          >
            Executar ({selectedTasks.length})
          </Button>
        </div>

        {/* Lista de tarefas com seleção */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
            <Checkbox 
              checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              Selecionar todas ({filteredTasks.length} tarefas)
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50">
                <Checkbox 
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={(checked) => handleSelectTask(task.id, !!checked)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="font-medium truncate">{task.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {task.responsible?.full_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.responsible.full_name}
                      </div>
                    )}
                  </div>
                </div>

                <Badge variant={
                  task.status === 'Concluído' ? 'default' :
                  task.status === 'Em Atraso' ? 'destructive' : 'secondary'
                }>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}