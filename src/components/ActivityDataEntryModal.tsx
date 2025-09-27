import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataCollectionTask, dataCollectionService } from '@/services/dataCollection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ActivityDataEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DataCollectionTask | null;
  onComplete: () => void;
}

export function ActivityDataEntryModal({ open, onOpenChange, task, onComplete }: ActivityDataEntryModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    quantity: 0,
    unit: '',
    emission_source_id: '',
    emission_factor_id: '',
    source_document: '',
    notes: '',
  });

  // Fetch emission sources
  const { data: emissionSources = [] } = useQuery({
    queryKey: ['emission-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emission_sources')
        .select('*')
        .eq('status', 'Ativo')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch emission factors
  const { data: emissionFactors = [] } = useQuery({
    queryKey: ['emission-factors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emission_factors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Submit activity data mutation
  const submitDataMutation = useMutation({
    mutationFn: async (activityData: any) => {
      // Insert activity data
      const { error: activityError } = await supabase
        .from('activity_data')
        .insert([{
          ...activityData,
          period_start_date: task?.period_start,
          period_end_date: task?.period_end,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (activityError) throw activityError;

      // Mark task as complete
      if (task?.id) {
        await dataCollectionService.completeTask(task.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-collection-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-data'] });
      toast({
        title: "Dados registrados com sucesso!",
        description: "Os dados de atividade foram registrados e a tarefa foi concluída.",
      });
      onComplete();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error submitting activity data:', error);
      toast({
        title: "Erro ao registrar dados",
        description: "Não foi possível registrar os dados. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      quantity: 0,
      unit: '',
      emission_source_id: '',
      emission_factor_id: '',
      source_document: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity || !formData.unit || !formData.emission_source_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos obrigatórios para continuar.",
        variant: "destructive",
      });
      return;
    }

    submitDataMutation.mutate(formData);
  };

  // Get default units based on task type
  const getUnitsForTaskType = (taskType: string) => {
    const unitMap = {
      'activity_data': ['L', 'kWh', 'km', 'ton', 'kg', 'm³'],
      'energy_invoice': ['kWh', 'MWh'],
      'water_invoice': ['m³', 'L'],
      'waste_log': ['kg', 'ton'],
    };
    return unitMap[taskType as keyof typeof unitMap] || ['L', 'kWh', 'km', 'ton', 'kg', 'm³'];
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const filteredEmissionSources = emissionSources.filter(source => {
    if (!task) return true;
    
    // Filter sources based on task type
    const taskTypeMap = {
      'energy_invoice': ['Eletricidade', 'Combustível'],
      'water_invoice': ['Água'],
      'waste_log': ['Resíduos'],
      'activity_data': null, // Show all sources
    };
    
    const allowedCategories = taskTypeMap[task.task_type as keyof typeof taskTypeMap];
    return allowedCategories ? allowedCategories.some(cat => 
      source.category.toLowerCase().includes(cat.toLowerCase())
    ) : true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Dados de Atividade</DialogTitle>
          <DialogDescription>
            {task && `Registrando dados para: ${task.name}`}
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="p-3 bg-muted/50 rounded-lg mb-4">
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Período:</span> {task.period_start} até {task.period_end}</p>
              {task.assets && (
                <p><span className="font-medium">Ativo:</span> {task.assets.name}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {getUnitsForTaskType(task?.task_type || 'activity_data').map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Emission Source */}
          <div className="space-y-2">
            <Label>Fonte de Emissão *</Label>
            <Select
              value={formData.emission_source_id}
              onValueChange={(value) => setFormData({ ...formData, emission_source_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fonte de emissão" />
              </SelectTrigger>
              <SelectContent>
                {filteredEmissionSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name} - {source.category} (Escopo {source.scope})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emission Factor */}
          <div className="space-y-2">
            <Label>Fator de Emissão</Label>
            <Select
              value={formData.emission_factor_id}
              onValueChange={(value) => setFormData({ ...formData, emission_factor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fator de emissão (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Deixar em branco</SelectItem>
                {emissionFactors.map((factor) => (
                  <SelectItem key={factor.id} value={factor.id}>
                    {factor.name} - {factor.category} ({factor.activity_unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se não selecionado, será usado o fator padrão do sistema
            </p>
          </div>

          {/* Source Document */}
          <div className="space-y-2">
            <Label htmlFor="source_document">Documento Fonte</Label>
            <Input
              id="source_document"
              value={formData.source_document}
              onChange={(e) => setFormData({ ...formData, source_document: e.target.value })}
              placeholder="Ex: Fatura 123456, Relatório mensal, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre os dados registrados..."
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
              disabled={submitDataMutation.isPending}
              className="flex-1"
            >
              {submitDataMutation.isPending ? 'Registrando...' : 'Registrar e Concluir Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}