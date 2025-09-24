import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createProjectTask, ProjectTask } from '@/services/projectManagement';
import { toast } from 'sonner';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  task?: Partial<ProjectTask>;
}

export function TaskModal({ open, onOpenChange, onSuccess, projectId, task }: TaskModalProps) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    priority: task?.priority || 'Média',
    status: task?.status || 'Não Iniciada',
    estimated_hours: task?.estimated_hours || 0,
    parent_task_id: task?.parent_task_id || '',
  });

  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.planned_start_date ? new Date(task.planned_start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    task?.planned_end_date ? new Date(task.planned_end_date) : undefined
  );

  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies || []);
  const [newDependency, setNewDependency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDependency = () => {
    if (newDependency.trim()) {
      setDependencies(prev => [...prev, newDependency.trim()]);
      setNewDependency('');
    }
  };

  const removeDependency = (index: number) => {
    setDependencies(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da tarefa é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      await createProjectTask({
        ...formData,
        project_id: projectId,
        planned_start_date: startDate?.toISOString().split('T')[0],
        planned_end_date: endDate?.toISOString().split('T')[0],
        dependencies,
        progress_percentage: 0,
        actual_hours: 0,
        assigned_to_user_id: undefined
      });

      toast.success('Tarefa criada com sucesso!');
      onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        priority: 'Média',
        status: 'Não Iniciada',
        estimated_hours: 0,
        parent_task_id: '',
      });
      setStartDate(undefined);
      setEndDate(undefined);
      setDependencies([]);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Edite as informações da tarefa'
              : 'Crie uma nova tarefa para o projeto'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tarefa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome da tarefa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva a tarefa em detalhes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não Iniciada">Não Iniciada</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Pausada">Pausada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início Planejada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim Planejada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_hours">Horas Estimadas</Label>
            <Input
              id="estimated_hours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => handleInputChange('estimated_hours', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Dependências</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newDependency}
                  onChange={(e) => setNewDependency(e.target.value)}
                  placeholder="ID da tarefa dependente"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
                />
                <Button type="button" onClick={addDependency} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {dependencies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                      <span>{dep}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDependency(index)}
                        className="h-auto p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : task ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}