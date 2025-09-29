import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGoalById, createGoal, type GoalDetail, type CreateGoalData } from '@/services/goals';
import { toast } from '@/hooks/use-toast';

interface DuplicateGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
}

export function DuplicateGoalModal({ open, onOpenChange, goalId }: DuplicateGoalModalProps) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDeadline, setNewDeadline] = useState<Date | undefined>();

  // Fetch original goal details
  const { data: originalGoal } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalId ? getGoalById(goalId) : null,
    enabled: !!goalId && open,
  });

  // Duplicate goal mutation
  const duplicateGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Meta duplicada!",
        description: "A nova meta foi criada com sucesso.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error duplicating goal:', error);
      toast({
        title: "Erro ao duplicar meta",
        description: "Não foi possível duplicar a meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Reset form when modal opens
  const resetForm = () => {
    setNewName('');
    setNewDeadline(undefined);
  };

  // Set default values when original goal loads
  useEffect(() => {
    if (originalGoal && open) {
      setNewName(`${originalGoal.name} (Cópia)`);
      // Set deadline to 1 year from now as default
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      setNewDeadline(futureDate);
    }
  }, [originalGoal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = newName.trim();
    
    if (!originalGoal || !trimmedName || !newDeadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e prazo da nova meta.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedName.length > 255) {
      toast({
        title: "Nome muito longo",
        description: "O nome da meta deve ter no máximo 255 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newDeadline <= new Date()) {
      toast({
        title: "Data inválida",
        description: "O prazo deve ser uma data futura.",
        variant: "destructive",
      });
      return;
    }

    const duplicateData: CreateGoalData = {
      name: trimmedName,
      description: originalGoal.description,
      metric_key: originalGoal.metric_key,
      baseline_value: originalGoal.baseline_value,
      baseline_period: originalGoal.baseline_period,
      target_value: originalGoal.target_value,
      deadline_date: newDeadline.toISOString().split('T')[0],
      responsible_user_id: originalGoal.responsible_user_id,
    };

    duplicateGoalMutation.mutate(duplicateData);
  };

  if (!originalGoal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Meta
          </DialogTitle>
          <DialogDescription>
            Criar uma nova meta baseada em: {originalGoal.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Original Goal Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Meta Original:</h4>
            <p className="text-sm text-muted-foreground">{originalGoal.name}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Métrica: {originalGoal.metric_key}</span>
              <span>Meta: {originalGoal.target_value}</span>
            </div>
          </div>

          {/* New Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="new_name">Nome da Nova Meta *</Label>
            <Input
              id="new_name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome para a meta duplicada"
            />
          </div>

          {/* New Goal Deadline */}
          <div className="space-y-2">
            <Label>Novo Prazo Final *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !newDeadline && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDeadline ? (
                    format(newDeadline, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDeadline}
                  onSelect={setNewDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Info Text */}
          <div className="text-sm text-muted-foreground bg-info/10 p-3 rounded-lg">
            <p><strong>Nota:</strong> A meta duplicada manterá todos os dados originais (métrica, valores, responsável, etc.), exceto o nome e prazo que podem ser alterados acima.</p>
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
              disabled={duplicateGoalMutation.isPending}
              className="flex-1"
            >
              {duplicateGoalMutation.isPending ? 'Duplicando...' : 'Duplicar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}