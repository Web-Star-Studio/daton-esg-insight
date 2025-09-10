import { DataCollectionTask, dataCollectionService } from '@/services/dataCollection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: DataCollectionTask;
  onComplete: () => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const queryClient = useQueryClient();

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => dataCollectionService.completeTask(taskId),
    onSuccess: () => {
      toast.success('Tarefa concluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['data-collection-tasks'] });
      onComplete();
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast.error('Erro ao concluir tarefa');
    },
  });

  const handleCompleteTask = () => {
    completeTaskMutation.mutate(task.id);
  };

  const getTaskTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'activity_data': 'Dados de Atividade',
      'waste_log': 'Registro de Resíduos', 
      'license_renewal': 'Renovação de Licença',
      'energy_invoice': 'Fatura de Energia',
      'water_invoice': 'Fatura de Água',
    };
    return types[type] || type;
  };

  const isOverdue = isAfter(new Date(), parseISO(task.due_date));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium leading-tight">
              {task.name}
            </CardTitle>
            <Badge variant="outline" className="mt-2 text-xs">
              {getTaskTypeLabel(task.task_type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <CardDescription className="text-xs">
            {task.description}
          </CardDescription>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Vencimento: {format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          
          {task.assets && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              <span>{task.assets.name}</span>
            </div>
          )}
          
          {task.profiles && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.profiles.full_name}</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <span>Período: </span>
            <span>
              {format(parseISO(task.period_start), 'dd/MM', { locale: ptBR })} - {' '}
              {format(parseISO(task.period_end), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>

        {task.status !== 'Concluído' && (
          <Button 
            onClick={handleCompleteTask}
            disabled={completeTaskMutation.isPending}
            size="sm" 
            className="w-full"
          >
            {completeTaskMutation.isPending ? 'Registrando...' : 'Registrar Dados'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}