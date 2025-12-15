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

interface EditEmployeeTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  training: any;
  programId?: string; // Optional: for invalidating program participants query
}

export function EditEmployeeTrainingDialog({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  training,
  programId,
}: EditEmployeeTrainingDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    training_program_id: '',
    isCancelled: false,
    completion_date: '',
    score: '',
    instructor: '',
    notes: '',
  });

  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Initialize form data when training changes
  useEffect(() => {
    if (training && isOpen) {
      setFormData({
        training_program_id: training.training_program_id || '',
        isCancelled: training.status === 'Cancelado',
        completion_date: training.completion_date || '',
        score: training.score?.toString() || '',
        instructor: training.instructor || '',
        notes: training.notes || '',
      });
    }
  }, [training, isOpen]);

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
    if (formData.isCancelled) return 'Cancelado';
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

  const updateTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const expirationDate = calculateExpirationDate();
      const calculatedStatus = getCalculatedStatus();

      const { error } = await supabase
        .from('employee_trainings')
        .update({
          training_program_id: data.training_program_id,
          status: calculatedStatus,
          completion_date: data.completion_date || null,
          expiration_date: expirationDate,
          score: data.score ? parseFloat(data.score) : null,
          instructor: data.instructor || null,
          notes: data.notes || null,
        })
        .eq('id', training.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-trainings', employeeId] });
      // Also invalidate program participants if programId is provided
      if (programId) {
        queryClient.invalidateQueries({ queryKey: ['training-program-participants', programId] });
        queryClient.invalidateQueries({ queryKey: ['training-program-stats', programId] });
      }
      toast.success('Treinamento atualizado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar treinamento');
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

    updateTrainingMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      training_program_id: '',
      isCancelled: false,
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
          <DialogTitle>Editar Treinamento de {employeeName}</DialogTitle>
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
                <Badge className={`${getTrainingStatusColor(getCalculatedStatus())} border`}>
                  {getCalculatedStatus()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isCancelled"
                  checked={formData.isCancelled}
                  onChange={(e) => setFormData({ ...formData, isCancelled: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="isCancelled" className="text-sm text-muted-foreground">
                  Marcar como Cancelado
                </label>
              </div>
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
            <Button type="submit" disabled={updateTrainingMutation.isPending}>
              {updateTrainingMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
