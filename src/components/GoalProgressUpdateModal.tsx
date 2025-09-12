import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProgressUpdate, type ProgressUpdateData } from '@/services/goals';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface GoalProgressUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
  goalName: string;
  currentProgress: number;
  targetValue: number;
}

export function GoalProgressUpdateModal({ 
  open, 
  onOpenChange, 
  goalId, 
  goalName, 
  currentProgress, 
  targetValue 
}: GoalProgressUpdateModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProgressUpdateData>({
    current_value: 0,
    update_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ goalId, updateData }: { goalId: string; updateData: ProgressUpdateData }) =>
      addProgressUpdate(goalId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Progresso atualizado!",
        description: "O progresso da meta foi atualizado com sucesso.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating progress:', error);
      toast({
        title: "Erro ao atualizar progresso",
        description: "Não foi possível atualizar o progresso. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      current_value: 0,
      update_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalId || !formData.current_value) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o valor atual para continuar.",
        variant: "destructive",
      });
      return;
    }

    updateProgressMutation.mutate({ goalId, updateData: formData });
  };

  const calculateNewProgress = () => {
    if (targetValue === 0) return 0;
    return Math.min(100, (formData.current_value / targetValue) * 100);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Progresso da Meta</DialogTitle>
          <DialogDescription>
            {goalName && `Atualizando progresso para: ${goalName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Progress Display */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Progresso Atual</Label>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={currentProgress} className="flex-1" />
              <span className="text-sm font-medium min-w-[3rem]">
                {Math.round(currentProgress)}%
              </span>
            </div>
          </div>

          {/* New Value Input */}
          <div className="space-y-2">
            <Label htmlFor="current_value">Novo Valor Atual *</Label>
            <Input
              id="current_value"
              type="number"
              step="0.01"
              value={formData.current_value}
              onChange={(e) => setFormData({ 
                ...formData, 
                current_value: parseFloat(e.target.value) || 0 
              })}
              placeholder="Digite o novo valor"
            />
            {formData.current_value > 0 && (
              <p className="text-sm text-muted-foreground">
                Novo progresso: {Math.round(calculateNewProgress())}%
              </p>
            )}
          </div>

          {/* Update Date */}
          <div className="space-y-2">
            <Label>Data da Atualização</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.update_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.update_date ? (
                    format(new Date(formData.update_date), 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.update_date ? new Date(formData.update_date) : undefined}
                  onSelect={(date) => 
                    setFormData({ 
                      ...formData, 
                      update_date: date ? date.toISOString().split('T')[0] : '' 
                    })
                  }
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione observações sobre esta atualização (opcional)..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              disabled={updateProgressMutation.isPending}
              className="flex-1"
            >
              {updateProgressMutation.isPending ? 'Atualizando...' : 'Atualizar Progresso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}