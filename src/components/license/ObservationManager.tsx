import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { createObservation, updateObservation } from '@/services/licenseObservations';
import { logAction } from '@/services/licenseActivityHistory';
import { LicenseObservation, CreateObservationInput, UpdateObservationInput } from '@/types/licenseObservations';

interface ObservationManagerProps {
  licenseId: string;
  observation?: LicenseObservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObservationManager({ licenseId, observation, open, onOpenChange }: ObservationManagerProps) {
  const queryClient = useQueryClient();
  const isEditing = !!observation;

  const [formData, setFormData] = useState<CreateObservationInput | UpdateObservationInput>({
    license_id: licenseId,
    title: observation?.title || '',
    observation_text: observation?.observation_text || '',
    observation_type: observation?.observation_type || 'nota',
    category: observation?.category || 'operacional',
    priority: observation?.priority || 'média',
    visibility: observation?.visibility || 'interna',
    requires_followup: observation?.requires_followup || false,
    followup_date: observation?.followup_date || undefined,
    tags: observation?.tags || []
  });

  const [followupDate, setFollowupDate] = useState<Date | undefined>(
    formData.followup_date ? new Date(formData.followup_date) : undefined
  );
  const [tagInput, setTagInput] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateObservationInput) => createObservation(data),
    onSuccess: async (newObservation) => {
      await logAction({
        license_id: licenseId,
        action_type: 'observation_added',
        action_target_type: 'observation',
        action_target_id: newObservation.id,
        description: `Observação criada: ${newObservation.title}`,
        new_values: newObservation
      });
      queryClient.invalidateQueries({ queryKey: ['license-observations', licenseId] });
      queryClient.invalidateQueries({ queryKey: ['license-activity', licenseId] });
      toast.success('Observação criada com sucesso');
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar observação');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateObservationInput }) => 
      updateObservation(id, data),
    onSuccess: async () => {
      if (observation) {
        await logAction({
          license_id: licenseId,
          action_type: 'observation_updated',
          action_target_type: 'observation',
          action_target_id: observation.id,
          description: `Observação atualizada: ${formData.title}`,
          old_values: observation,
          new_values: formData
        });
      }
      queryClient.invalidateQueries({ queryKey: ['license-observations', licenseId] });
      queryClient.invalidateQueries({ queryKey: ['license-activity', licenseId] });
      toast.success('Observação atualizada com sucesso');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar observação');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      followup_date: followupDate ? format(followupDate, 'yyyy-MM-dd') : undefined
    };

    if (isEditing && observation) {
      updateMutation.mutate({ id: observation.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit as CreateObservationInput);
    }
  };

  const resetForm = () => {
    setFormData({
      license_id: licenseId,
      title: '',
      observation_text: '',
      observation_type: 'nota',
      category: 'operacional',
      priority: 'média',
      visibility: 'interna',
      requires_followup: false,
      tags: []
    });
    setFollowupDate(undefined);
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Observação' : 'Nova Observação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Inspeção de rotina realizada"
            />
          </div>

          {/* Observation Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.observation_type}
                onValueChange={(value: any) => setFormData({ ...formData, observation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota">Nota</SelectItem>
                  <SelectItem value="inspeção">Inspeção</SelectItem>
                  <SelectItem value="comunicação">Comunicação</SelectItem>
                  <SelectItem value="incidente">Incidente</SelectItem>
                  <SelectItem value="melhoria">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="técnica">Técnica</SelectItem>
                  <SelectItem value="jurídica">Jurídica</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="administrativa">Administrativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority and Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visibility">Visibilidade</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="pública">Pública</SelectItem>
                  <SelectItem value="restrita">Restrita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observation Text */}
          <div>
            <Label htmlFor="text">Observação *</Label>
            <Textarea
              id="text"
              value={formData.observation_text}
              onChange={(e) => setFormData({ ...formData, observation_text: e.target.value })}
              required
              rows={6}
              placeholder="Descreva a observação detalhadamente..."
            />
          </div>

          {/* Follow-up */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.requires_followup}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_followup: checked })}
              />
              <Label>Requer acompanhamento</Label>
            </div>

            {formData.requires_followup && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followupDate ? format(followupDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followupDate}
                    onSelect={setFollowupDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Adicionar tag..."
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Adicionar
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Atualizar' : 'Criar'} Observação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
