import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface CustomIndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingIndicator?: any;
}

export function CustomIndicatorModal({ isOpen, onClose, onSuccess, editingIndicator }: CustomIndicatorModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    indicator_name: editingIndicator?.indicator_name || '',
    indicator_code: editingIndicator?.indicator_code || '',
    category: editingIndicator?.category || 'environmental',
    unit: editingIndicator?.unit || '',
    calculation_method: editingIndicator?.calculation_method || '',
    target_value: editingIndicator?.target_value || '',
    current_value: editingIndicator?.current_value || '',
    measurement_frequency: editingIndicator?.measurement_frequency || 'monthly',
    is_active: editingIndicator?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const dataToSave = {
        ...formData,
        company_id: profile.company_id,
        responsible_user_id: user.id,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
      };

      if (editingIndicator) {
        await supabase
          .from('custom_esg_indicators')
          .update(dataToSave)
          .eq('id', editingIndicator.id);
        
        toast({
          title: 'Indicador atualizado!',
          description: 'O indicador ESG customizado foi atualizado com sucesso.',
        });
      } else {
        await supabase
          .from('custom_esg_indicators')
          .insert(dataToSave);
        
        toast({
          title: 'Indicador criado!',
          description: 'O novo indicador ESG foi adicionado com sucesso.',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar indicador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o indicador. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {editingIndicator ? 'Editar Indicador ESG' : 'Novo Indicador ESG Customizado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="indicator_name" className="flex items-center gap-2">
                  Nome do Indicador *
                  <InfoTooltip
                    title="Nome do Indicador"
                    content="Nome descritivo para identificar facilmente o indicador na plataforma."
                  />
                </Label>
                <Input
                  id="indicator_name"
                  value={formData.indicator_name}
                  onChange={(e) => setFormData({ ...formData, indicator_name: e.target.value })}
                  required
                  placeholder="Ex: Consumo de Água per Capita"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="indicator_code" className="flex items-center gap-2">
                  Código do Indicador *
                  <InfoTooltip
                    title="Código do Indicador"
                    content="Código único para referência técnica. Use letras maiúsculas e underscores."
                  />
                </Label>
                <Input
                  id="indicator_code"
                  value={formData.indicator_code}
                  onChange={(e) => setFormData({ ...formData, indicator_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="Ex: AGUA_PER_CAPITA"
                  disabled={!!editingIndicator}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria ESG *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environmental">🌱 Ambiental (E)</SelectItem>
                    <SelectItem value="social">👥 Social (S)</SelectItem>
                    <SelectItem value="governance">⚖️ Governança (G)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Medida *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  placeholder="Ex: m³/colaborador, %, tCO₂e"
                />
              </div>
            </div>
          </div>

          {/* Measurement Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Configuração de Medição</h3>
            
            <div className="space-y-2">
              <Label htmlFor="calculation_method">Método de Cálculo</Label>
              <Textarea
                id="calculation_method"
                value={formData.calculation_method}
                onChange={(e) => setFormData({ ...formData, calculation_method: e.target.value })}
                rows={3}
                placeholder="Descreva como o indicador deve ser calculado..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_value">Valor Atual</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_value">Meta</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurement_frequency">Frequência</Label>
                <Select value={formData.measurement_frequency} onValueChange={(value) => setFormData({ ...formData, measurement_frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Indicador ativo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingIndicator ? 'Atualizar' : 'Criar Indicador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
