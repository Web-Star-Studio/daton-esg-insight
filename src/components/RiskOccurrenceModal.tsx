import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { riskOccurrencesService, CreateRiskOccurrenceData, RiskOccurrence } from "@/services/riskOccurrences";
import { getESGRisks } from "@/services/esgRisks";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";

interface RiskOccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence?: RiskOccurrence;
  riskId?: string;
  mode: 'create' | 'edit' | 'view';
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'Alto': return 'bg-destructive text-destructive-foreground';
    case 'Médio': return 'bg-warning text-warning-foreground';
    case 'Baixo': return 'bg-success text-success-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Fechada': return 'bg-success text-success-foreground';
    case 'Resolvida': return 'bg-primary text-primary-foreground';
    case 'Em Tratamento': return 'bg-warning text-warning-foreground';
    case 'Aberta': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function RiskOccurrenceModal({
  isOpen,
  onClose,
  occurrence,
  riskId,
  mode
}: RiskOccurrenceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateRiskOccurrenceData>({
    risk_id: occurrence?.risk_id || riskId || '',
    occurrence_date: occurrence?.occurrence_date || new Date().toISOString().split('T')[0],
    title: occurrence?.title || '',
    description: occurrence?.description || '',
    actual_impact: (occurrence?.actual_impact as any) || 'Médio',
    financial_impact: occurrence?.financial_impact,
    operational_impact: occurrence?.operational_impact || '',
    response_actions: occurrence?.response_actions || '',
    lessons_learned: occurrence?.lessons_learned || '',
    responsible_user_id: occurrence?.responsible_user_id,
    prevention_measures: occurrence?.prevention_measures || ''
  });

  // Buscar riscos disponíveis
  const { data: risks } = useQuery({
    queryKey: ['esg-risks'],
    queryFn: () => getESGRisks()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRiskOccurrenceData) => riskOccurrencesService.createOccurrence(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-occurrences'] });
      queryClient.invalidateQueries({ queryKey: ['occurrence-metrics'] });
      toast({ title: "Ocorrência registrada com sucesso!" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao registrar ocorrência", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateRiskOccurrenceData) => 
      riskOccurrencesService.updateOccurrence(occurrence!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-occurrences'] });
      queryClient.invalidateQueries({ queryKey: ['occurrence-metrics'] });
      toast({ title: "Ocorrência atualizada com sucesso!" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar ocorrência", 
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

  const isReadonly = mode === 'view';
  const selectedRisk = risks?.find(r => r.id === formData.risk_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {mode === 'create' && 'Registrar Ocorrência de Risco'}
            {mode === 'edit' && 'Editar Ocorrência'}
            {mode === 'view' && 'Detalhes da Ocorrência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk_id">Risco Relacionado *</Label>
                <Select
                  value={formData.risk_id}
                  onValueChange={(value) => setFormData({ ...formData, risk_id: value })}
                  disabled={isReadonly || !!riskId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o risco" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks?.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.risk_title} ({risk.inherent_risk_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRisk && (
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{selectedRisk.esg_category}</Badge>
                    <Badge className={
                      selectedRisk.inherent_risk_level === 'Crítico' ? 'bg-destructive' :
                      selectedRisk.inherent_risk_level === 'Alto' ? 'bg-warning' :
                      selectedRisk.inherent_risk_level === 'Médio' ? 'bg-primary' :
                      'bg-success'
                    }>
                      {selectedRisk.inherent_risk_level}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occurrence_date">Data da Ocorrência *</Label>
                <Input
                  id="occurrence_date"
                  type="date"
                  value={formData.occurrence_date}
                  onChange={(e) => setFormData({ ...formData, occurrence_date: e.target.value })}
                  required
                  disabled={isReadonly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título da Ocorrência *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Descreva brevemente o que aconteceu"
                required
                disabled={isReadonly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva em detalhes o que aconteceu, quando, onde e como"
                rows={3}
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Avaliação do impacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Avaliação do Impacto Real</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_impact">Impacto Real *</Label>
                <Select
                  value={formData.actual_impact}
                  onValueChange={(value: any) => setFormData({ ...formData, actual_impact: value })}
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

              <div className="space-y-2">
                <Label htmlFor="financial_impact">Impacto Financeiro (R$)</Label>
                <Input
                  id="financial_impact"
                  type="number"
                  value={formData.financial_impact || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    financial_impact: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="0.00"
                  disabled={isReadonly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operational_impact">Impacto Operacional</Label>
              <Textarea
                id="operational_impact"
                value={formData.operational_impact}
                onChange={(e) => setFormData({ ...formData, operational_impact: e.target.value })}
                placeholder="Descreva os impactos nas operações, processos, pessoas, etc."
                rows={2}
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Ações e aprendizados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resposta e Lições Aprendidas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="response_actions">Ações de Resposta Tomadas</Label>
              <Textarea
                id="response_actions"
                value={formData.response_actions}
                onChange={(e) => setFormData({ ...formData, response_actions: e.target.value })}
                placeholder="Descreva as ações imediatas tomadas para lidar com a ocorrência"
                rows={3}
                disabled={isReadonly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessons_learned">Lições Aprendidas</Label>
              <Textarea
                id="lessons_learned"
                value={formData.lessons_learned}
                onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                placeholder="O que foi aprendido com esta ocorrência?"
                rows={2}
                disabled={isReadonly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prevention_measures">Medidas Preventivas</Label>
              <Textarea
                id="prevention_measures"
                value={formData.prevention_measures}
                onChange={(e) => setFormData({ ...formData, prevention_measures: e.target.value })}
                placeholder="Que medidas serão implementadas para prevenir futuras ocorrências?"
                rows={2}
                disabled={isReadonly}
              />
            </div>
          </div>

          {occurrence && mode === 'view' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status da Ocorrência</h3>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(occurrence.status)}>
                  {occurrence.status}
                </Badge>
                <Badge className={getImpactColor(occurrence.actual_impact)}>
                  Impacto: {occurrence.actual_impact}
                </Badge>
                {occurrence.financial_impact && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {occurrence.financial_impact.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!isReadonly && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === 'create' ? 'Registrar Ocorrência' : 'Atualizar Ocorrência'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}