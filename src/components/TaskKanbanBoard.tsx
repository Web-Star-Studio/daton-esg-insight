import { DataCollectionTask } from '@/services/dataCollection';
import { TaskCard } from '@/components/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskKanbanBoardProps {
  tasks: DataCollectionTask[];
  isLoading: boolean;
  onTaskComplete: () => void;
}

export function TaskKanbanBoard({ tasks, isLoading, onTaskComplete }: TaskKanbanBoardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'Pendente');
  const overdueTasks = tasks.filter(task => task.status === 'Em Atraso');
  const completedTasks = tasks.filter(task => task.status === 'Concluído');

  const columns = [
    {
      title: 'Pendente',
      tasks: pendingTasks,
      badge: 'secondary' as const,
      count: pendingTasks.length
    },
    {
      title: 'Em Atraso',
      tasks: overdueTasks,
      badge: 'destructive' as const,
      count: overdueTasks.length
    },
    {
      title: 'Concluído',
      tasks: completedTasks,
      badge: 'default' as const,
      count: completedTasks.length
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {columns.map((column) => (
        <Card key={column.title} className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {column.title}
              </CardTitle>
              <Badge variant={column.badge}>
                {column.count}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tarefa {column.title.toLowerCase()}</p>
              </div>
            ) : (
              column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onTaskComplete}
                />
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}