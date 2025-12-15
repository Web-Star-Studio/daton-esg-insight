import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';
import { calculateTrainingStatus, getTrainingStatusColor } from '@/utils/trainingStatusCalculator';
import { Badge } from './ui/badge';

interface AddEmployeeTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export function AddEmployeeTrainingDialog({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: AddEmployeeTrainingDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    training_program_id: '',
    completion_date: '',
    score: '',
    instructor: '',
    notes: '',
  });

  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Fetch training programs
  const { data: programs = [] } = useQuery({
    queryKey: ['training-programs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Update selected program when training_program_id changes
  useEffect(() => {
    if (formData.training_program_id) {
      const program = programs.find((p: any) => p.id === formData.training_program_id);
      setSelectedProgram(program || null);
    } else {
      setSelectedProgram(null);
    }
  }, [formData.training_program_id, programs]);

  // Calculate automatic status based on program dates
  const getCalculatedStatus = () => {
    if (!selectedProgram) return 'Planejado';
    return calculateTrainingStatus({
      start_date: selectedProgram.start_date,
      end_date: selectedProgram.end_date,
      efficacy_evaluation_deadline: selectedProgram.efficacy_evaluation_deadline,
      hasEfficacyEvaluation: false
    });
  };

  // Calculate expiration date
  const calculateExpirationDate = () => {
    if (!formData.completion_date || !selectedProgram?.valid_for_months) {
      return null;
    }
    const completionDate = new Date(formData.completion_date);
    const expirationDate = addMonths(completionDate, selectedProgram.valid_for_months);
    return format(expirationDate, 'yyyy-MM-dd');
  };

  const createTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const expirationDate = calculateExpirationDate();
      const calculatedStatus = getCalculatedStatus();

      const { error } = await supabase
        .from('employee_trainings')
        .insert({
          employee_id: employeeId,
          company_id: profile.company_id,
          training_program_id: data.training_program_id,
          status: calculatedStatus,
          completion_date: data.completion_date || null,
          expiration_date: expirationDate,
          score: data.score ? parseFloat(data.score) : null,
          trainer: data.instructor || null,
          notes: data.notes || null,
          // Marcar presença automaticamente ao cadastrar participante
          attended: true,
          attendance_marked_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-trainings', employeeId] });
      toast.success('Treinamento adicionado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar treinamento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.training_program_id) {
      toast.error('Selecione um programa de treinamento');
      return;
    }

    const calculatedStatus = getCalculatedStatus();
    if (calculatedStatus === 'Concluído' && !formData.completion_date) {
      toast.error('Data de conclusão é obrigatória para treinamentos concluídos');
      return;
    }

    if (formData.score && (parseFloat(formData.score) < 0 || parseFloat(formData.score) > 100)) {
      toast.error('A nota deve estar entre 0 e 100');
      return;
    }

    createTrainingMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      training_program_id: '',
      completion_date: '',
      score: '',
      instructor: '',
      notes: '',
    });
    setSelectedProgram(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Treinamento para {employeeName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="training_program_id">Programa de Treinamento*</Label>
            <Select
              value={formData.training_program_id}
              onValueChange={(value) => setFormData({ ...formData, training_program_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o programa" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program: any) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} - {program.category} ({program.duration_hours}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProgram && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProgram.is_mandatory ? '🔴 Obrigatório' : '⚪ Opcional'} • 
                {selectedProgram.valid_for_months ? ` Validade: ${selectedProgram.valid_for_months} meses` : ' Sem validade'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status (Automático)</Label>
              <div className="mt-2">
                {selectedProgram ? (
                  <Badge className={`${getTrainingStatusColor(getCalculatedStatus())} border`}>
                    {getCalculatedStatus()}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Selecione um programa</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automaticamente baseado nas datas do programa
              </p>
            </div>

            <div>
              <Label htmlFor="completion_date">
                Data de Conclusão{getCalculatedStatus() === 'Concluído' ? '*' : ''}
              </Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="score">Nota (0-100)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="Ex: 85.5"
              />
            </div>

            <div>
              <Label htmlFor="instructor">Instrutor/Treinador</Label>
              <Input
                id="instructor"
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="Nome do instrutor"
              />
            </div>
          </div>

          {formData.completion_date && selectedProgram?.valid_for_months && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Data de Validade:</strong>{' '}
                {calculateExpirationDate() 
                  ? format(new Date(calculateExpirationDate()!), 'dd/MM/yyyy')
                  : '-'}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais sobre o treinamento..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTrainingMutation.isPending}>
              {createTrainingMutation.isPending ? 'Salvando...' : 'Adicionar Treinamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
