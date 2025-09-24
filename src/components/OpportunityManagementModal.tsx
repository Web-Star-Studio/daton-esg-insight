import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { opportunitiesService, CreateOpportunityData, Opportunity } from "@/services/opportunities";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, Target, TrendingUp } from "lucide-react";

interface OpportunityManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity;
  mode: 'create' | 'edit' | 'view';
}

const categories = [
  'Mercado',
  'Tecnológico',
  'Regulatório',
  'Ambiental',
  'Social',
  'Operacional',
  'Financeiro'
];

const getOpportunityLevelColor = (level: string) => {
  switch (level) {
    case 'Crítica': return 'bg-destructive text-destructive-foreground';
    case 'Alta': return 'bg-warning text-warning-foreground';
    case 'Média': return 'bg-primary text-primary-foreground';
    case 'Baixa': return 'bg-muted text-muted-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function OpportunityManagementModal({
  isOpen,
  onClose,
  opportunity,
  mode
}: OpportunityManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateOpportunityData>({
    title: opportunity?.title || '',
    description: opportunity?.description || '',
    category: opportunity?.category || '',
    probability: (opportunity?.probability as any) || 'Média',
    impact: (opportunity?.impact as any) || 'Médio',
    potential_value: opportunity?.potential_value,
    implementation_cost: opportunity?.implementation_cost,
    roi_estimate: opportunity?.roi_estimate,
    target_date: opportunity?.target_date,
    mitigation_actions: opportunity?.mitigation_actions || '',
    monitoring_indicators: opportunity?.monitoring_indicators || ''
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOpportunityData) => opportunitiesService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-metrics'] });
      toast({ title: "Oportunidade criada com sucesso!" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar oportunidade", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateOpportunityData) => 
      opportunitiesService.updateOpportunity(opportunity!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-metrics'] });
      toast({ title: "Oportunidade atualizada com sucesso!" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar oportunidade", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (mode === 'edit') {
      updateMutation.mutate(formData);
    }
  };

  const calculateROI = () => {
    if (formData.potential_value && formData.implementation_cost) {
      const roi = ((formData.potential_value - formData.implementation_cost) / formData.implementation_cost) * 100;
      setFormData({ ...formData, roi_estimate: Math.round(roi) });
    }
  };

  const isReadonly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {mode === 'create' && 'Nova Oportunidade'}
            {mode === 'edit' && 'Editar Oportunidade'}
            {mode === 'view' && 'Detalhes da Oportunidade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da oportunidade"
                  required
                  disabled={isReadonly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={isReadonly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a oportunidade em detalhes"
                rows={3}
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Avaliação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Avaliação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probability">Probabilidade *</Label>
                <Select
                  value={formData.probability}
                  onValueChange={(value: any) => setFormData({ ...formData, probability: value })}
                  disabled={isReadonly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impacto *</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                  disabled={isReadonly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {opportunity && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Nível da Oportunidade:</span>
                <Badge className={getOpportunityLevelColor(opportunity.opportunity_level)}>
                  {opportunity.opportunity_level}
                </Badge>
              </div>
            )}
          </div>

          {/* Informações financeiras */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análise Financeira
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potential_value">Valor Potencial (R$)</Label>
                <Input
                  id="potential_value"
                  type="number"
                  value={formData.potential_value || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    potential_value: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="0.00"
                  disabled={isReadonly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementation_cost">Custo de Implementação (R$)</Label>
                <Input
                  id="implementation_cost"
                  type="number"
                  value={formData.implementation_cost || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    implementation_cost: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="0.00"
                  disabled={isReadonly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roi_estimate">ROI Estimado (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="roi_estimate"
                    type="number"
                    value={formData.roi_estimate || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      roi_estimate: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="0"
                    disabled={isReadonly}
                  />
                  {!isReadonly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateROI}
                      disabled={!formData.potential_value || !formData.implementation_cost}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prazo e implementação */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_date">Data Alvo</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date || ''}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  disabled={isReadonly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mitigation_actions">Plano de Implementação</Label>
              <Textarea
                id="mitigation_actions"
                value={formData.mitigation_actions}
                onChange={(e) => setFormData({ ...formData, mitigation_actions: e.target.value })}
                placeholder="Descreva as ações necessárias para implementar a oportunidade"
                rows={3}
                disabled={isReadonly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monitoring_indicators">Indicadores de Monitoramento</Label>
              <Textarea
                id="monitoring_indicators"
                value={formData.monitoring_indicators}
                onChange={(e) => setFormData({ ...formData, monitoring_indicators: e.target.value })}
                placeholder="Defina os indicadores para acompanhar o progresso"
                rows={2}
                disabled={isReadonly}
              />
            </div>
          </div>

          {!isReadonly && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === 'create' ? 'Criar Oportunidade' : 'Atualizar Oportunidade'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}