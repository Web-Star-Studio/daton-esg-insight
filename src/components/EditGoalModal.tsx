import { useState, useEffect } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGoalById, getCompanyUsers, type GoalDetail } from '@/services/goals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EditGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
}

export function EditGoalModal({ open, onOpenChange, goalId }: EditGoalModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric_key: '',
    baseline_value: 0,
    baseline_period: '',
    target_value: 0,
    deadline_date: '',
    responsible_user_id: '',
    status: '',
  });

  // Fetch goal details
  const { data: goalDetail } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalId ? getGoalById(goalId) : null,
    enabled: !!goalId && open,
  });

  // Fetch company users
  const { data: companyUsers = [] } = useQuery({
    queryKey: ['company-users'],
    queryFn: getCompanyUsers,
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async (updateData: typeof formData) => {
      const { error } = await supabase
        .from('goals')
        .update({
          name: updateData.name,
          description: updateData.description,
          metric_key: updateData.metric_key,
          baseline_value: updateData.baseline_value,
          baseline_period: updateData.baseline_period,
          target_value: updateData.target_value,
          deadline_date: updateData.deadline_date,
          responsible_user_id: updateData.responsible_user_id,
          status: updateData.status as any,
        })
        .eq('id', goalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Meta atualizada!",
        description: "A meta foi atualizada com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Load goal data into form when modal opens
  useEffect(() => {
    if (goalDetail) {
      setFormData({
        name: goalDetail.name,
        description: goalDetail.description || '',
        metric_key: goalDetail.metric_key,
        baseline_value: goalDetail.baseline_value || 0,
        baseline_period: goalDetail.baseline_period || '',
        target_value: goalDetail.target_value,
        deadline_date: goalDetail.deadline_date,
        responsible_user_id: goalDetail.responsible_user_id || '',
        status: goalDetail.status,
      });
    }
  }, [goalDetail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.metric_key || !formData.target_value || !formData.deadline_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para continuar.",
        variant: "destructive",
      });
      return;
    }

    updateGoalMutation.mutate(formData);
  };

  const statusOptions = [
    { value: 'No Caminho Certo', label: 'No Caminho Certo' },
    { value: 'Atenção Necessária', label: 'Atenção Necessária' },
    { value: 'Atrasada', label: 'Atrasada' },
    { value: 'Atingida', label: 'Atingida' },
  ];

  const metricOptions = [
    { value: 'emissoes-totais', label: 'Emissões Totais (tCO₂e)' },
    { value: 'emissoes-escopo1', label: 'Emissões Escopo 1 (tCO₂e)' },
    { value: 'emissoes-escopo2', label: 'Emissões Escopo 2 (tCO₂e)' },
    { value: 'taxa-reciclagem', label: 'Taxa de Reciclagem (%)' },
    { value: 'geracao-residuos', label: 'Geração Total de Resíduos (ton)' },
    { value: 'consumo-eletricidade', label: 'Consumo de Eletricidade (kWh)' },
    { value: 'consumo-agua', label: 'Consumo de Água (m³)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meta</DialogTitle>
          <DialogDescription>
            Atualize as informações da meta de sustentabilidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Meta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Reduzir as emissões de GEE da frota em 15%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada da meta..."
                rows={3}
              />
            </div>
          </div>

          {/* Metrics and Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Métrica *</Label>
              <Select
                value={formData.metric_key}
                onValueChange={(value) => setFormData({ ...formData, metric_key: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baseline Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseline_value">Valor Base</Label>
              <Input
                id="baseline_value"
                type="number"
                step="0.01"
                value={formData.baseline_value}
                onChange={(e) => setFormData({ ...formData, baseline_value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseline_period">Período Base</Label>
              <Input
                id="baseline_period"
                value={formData.baseline_period}
                onChange={(e) => setFormData({ ...formData, baseline_period: e.target.value })}
                placeholder="Ex: Ano de 2024"
              />
            </div>
          </div>

          {/* Target and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">Valor Alvo *</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Prazo Final *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.deadline_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline_date ? (
                      format(new Date(formData.deadline_date), 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline_date ? new Date(formData.deadline_date) : undefined}
                    onSelect={(date) => 
                      setFormData({ 
                        ...formData, 
                        deadline_date: date ? date.toISOString().split('T')[0] : '' 
                      })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Responsible User */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.responsible_user_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {companyUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} {user.job_title ? `(${user.job_title})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={updateGoalMutation.isPending}
              className="flex-1"
            >
              {updateGoalMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}