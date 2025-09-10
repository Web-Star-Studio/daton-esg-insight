import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { dataCollectionService } from '@/services/dataCollection';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RecurringTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function RecurringTaskModal({ open, onOpenChange, onTaskCreated }: RecurringTaskModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    task_type: '',
    frequency: '',
    due_date: undefined as Date | undefined,
    period_start: undefined as Date | undefined,
    period_end: undefined as Date | undefined,
    assigned_to_user_id: '',
    related_asset_id: '',
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => dataCollectionService.createTask(taskData),
    onSuccess: () => {
      toast.success('Tarefa recorrente criada com sucesso!');
      onTaskCreated();
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa recorrente');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      task_type: '',
      frequency: '',
      due_date: undefined,
      period_start: undefined,
      period_end: undefined,
      assigned_to_user_id: '',
      related_asset_id: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.task_type || !formData.frequency || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const taskData = {
      ...formData,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : '',
      period_start: formData.period_start ? format(formData.period_start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      period_end: formData.period_end ? format(formData.period_end, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      metadata: {}
    };

    createTaskMutation.mutate(taskData);
  };

  const taskTypes = [
    { value: 'activity_data', label: 'Dados de Atividade (GEE)' },
    { value: 'waste_log', label: 'Registro de Resíduos' },
    { value: 'license_renewal', label: 'Renovação de Licença' },
    { value: 'energy_invoice', label: 'Fatura de Energia' },
    { value: 'water_invoice', label: 'Fatura de Água' },
  ];

  const frequencies = [
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Anual', label: 'Anual' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa Recorrente</DialogTitle>
          <DialogDescription>
            Configure uma tarefa que será criada automaticamente com a frequência definida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tarefa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Fatura de Energia - Sede SP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Tarefa *</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData({ ...formData, task_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequência *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.due_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData({ ...formData, due_date: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.period_start && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_start ? (
                      format(formData.period_start, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Data início</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.period_start}
                    onSelect={(date) => setFormData({ ...formData, period_start: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fim do Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.period_end && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_end ? (
                      format(formData.period_end, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Data fim</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.period_end}
                    onSelect={(date) => setFormData({ ...formData, period_end: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="flex-1"
            >
              {createTaskMutation.isPending ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}