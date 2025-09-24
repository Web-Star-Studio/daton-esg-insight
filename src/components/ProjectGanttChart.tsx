import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar, Clock } from 'lucide-react';
import { getProjectTasks, getProjectMilestones } from '@/services/projectManagement';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectGanttChartProps {
  projectId: string;
}

export function ProjectGanttChart({ projectId }: ProjectGanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => getProjectTasks(projectId),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => getProjectMilestones(projectId),
  });

  // Generate calendar days for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTaskPosition = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return null;

    const taskStart = new Date(startDate);
    const taskEnd = new Date(endDate);
    
    // Calculate position relative to current month
    const startDay = Math.max(0, differenceInDays(taskStart, monthStart));
    const endDay = Math.min(calendarDays.length - 1, differenceInDays(taskEnd, monthStart));
    const duration = endDay - startDay + 1;

    if (startDay >= calendarDays.length || endDay < 0) return null;

    return {
      left: `${(startDay / calendarDays.length) * 100}%`,
      width: `${(duration / calendarDays.length) * 100}%`,
      duration
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-green-500';
      case 'Em Andamento': return 'bg-blue-500';
      case 'Em Atraso': return 'bg-red-500';
      case 'Pausada': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (tasksLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            ←
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            →
          </Button>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione tarefas para visualizar o cronograma do projeto
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Tarefa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cronograma - Gráfico de Gantt</CardTitle>
            <CardDescription>
              Visualização das tarefas e dependências do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                {/* Calendar Header */}
                <div className="flex border-b mb-4">
                  <div className="w-80 p-2 font-semibold">Tarefa</div>
                  <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${calendarDays.length}, 1fr)` }}>
                    {calendarDays.map((day, index) => (
                      <div 
                        key={index}
                        className="p-1 text-center text-xs border-l first:border-l-0"
                      >
                        <div className="font-medium">{format(day, 'd')}</div>
                        <div className="text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const position = getTaskPosition(task.planned_start_date, task.planned_end_date);
                    
                    return (
                      <div key={task.id} className="flex items-center min-h-[3rem] border-b border-border/50 last:border-0">
                        {/* Task Info */}
                        <div className="w-80 p-2 pr-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{task.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(task.status)}`}
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(task.progress_percentage)}% concluído
                          </p>
                          {task.estimated_hours > 0 && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimated_hours}h estimadas
                            </div>
                          )}
                        </div>

                        {/* Gantt Bar */}
                        <div className="flex-1 relative h-8 px-2">
                          <div className="relative h-full bg-muted/20 rounded">
                            {position && (
                              <div
                                className={`absolute top-1 bottom-1 ${getStatusColor(task.status)} rounded opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                                style={{
                                  left: position.left,
                                  width: position.width
                                }}
                                title={`${task.name} - ${task.progress_percentage}%`}
                              >
                                <div className="h-full relative">
                                  {/* Progress indicator */}
                                  <div 
                                    className="h-full bg-white/20 rounded-l"
                                    style={{ width: `${task.progress_percentage}%` }}
                                  />
                                  {/* Duration label */}
                                  {position.duration >= 3 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                      {position.duration}d
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {!position && task.planned_start_date && (
                              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                Fora do período exibido
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Milestones */}
                  {milestones.map((milestone) => {
                    const milestoneDate = new Date(milestone.target_date);
                    const dayIndex = differenceInDays(milestoneDate, monthStart);
                    
                    if (dayIndex >= 0 && dayIndex < calendarDays.length) {
                      return (
                        <div key={`milestone-${milestone.id}`} className="flex items-center min-h-[2rem] border-b border-border/30">
                          <div className="w-80 p-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rotate-45"></div>
                              <p className="font-medium text-sm text-orange-700">{milestone.name}</p>
                            </div>
                          </div>
                          <div className="flex-1 relative h-6 px-2">
                            <div 
                              className="absolute w-3 h-3 bg-orange-500 rotate-45 transform -translate-x-1/2"
                              style={{ left: `${((dayIndex + 0.5) / calendarDays.length) * 100}%` }}
                              title={`Marco: ${milestone.name}`}
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Legenda:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-green-500 rounded"></div>
                  <span>Concluída</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-blue-500 rounded"></div>
                  <span>Em Andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-red-500 rounded"></div>
                  <span>Em Atraso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-gray-400 rounded"></div>
                  <span>Não Iniciada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rotate-45"></div>
                  <span>Marco</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}