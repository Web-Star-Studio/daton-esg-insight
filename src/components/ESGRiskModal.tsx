import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createESGRisk, updateESGRisk, ESGRisk } from "@/services/esgRisks";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ESGRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk?: ESGRisk | null;
  mode: 'create' | 'edit' | 'view';
}

export function ESGRiskModal({ isOpen, onClose, risk, mode }: ESGRiskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    risk_title: '',
    risk_description: '',
    esg_category: '',
    probability: '',
    impact: '',
    risk_owner: '',
    control_measures: '',
    mitigation_actions: '',
    review_frequency: '',
    next_review_date: '',
    status: 'Ativo',
    risk_appetite: '',
    risk_tolerance: '',
    business_impact: '',
    regulatory_impact: '',
    reputation_impact: '',
    treatment_plan: '',
    residual_probability: '',
    residual_impact: ''
  });

  const [nextReviewDate, setNextReviewDate] = useState<Date | undefined>();

  useEffect(() => {
    if (risk && (mode === 'edit' || mode === 'view')) {
      setFormData({
        risk_title: risk.risk_title || '',
        risk_description: risk.risk_description || '',
        esg_category: risk.esg_category || '',
        probability: risk.probability || '',
        impact: risk.impact || '',
        risk_owner: risk.risk_owner || '',
        control_measures: risk.control_measures || '',
        mitigation_actions: risk.mitigation_actions || '',
        review_frequency: risk.review_frequency || '',
        next_review_date: risk.next_review_date || '',
        status: risk.status || 'Ativo',
        risk_appetite: risk.risk_appetite || '',
        risk_tolerance: risk.risk_tolerance || '',
        business_impact: risk.business_impact || '',
        regulatory_impact: risk.regulatory_impact || '',
        reputation_impact: risk.reputation_impact || '',
        treatment_plan: risk.treatment_plan || '',
        residual_probability: risk.residual_probability || '',
        residual_impact: risk.residual_impact || ''
      });
      
      if (risk.next_review_date) {
        setNextReviewDate(new Date(risk.next_review_date));
      }
    } else {
      // Reset form for create mode
      setFormData({
        risk_title: '',
        risk_description: '',
        esg_category: '',
        probability: '',
        impact: '',
        risk_owner: '',
        control_measures: '',
        mitigation_actions: '',
        review_frequency: '',
        next_review_date: '',
        status: 'Ativo',
        risk_appetite: '',
        risk_tolerance: '',
        business_impact: '',
        regulatory_impact: '',
        reputation_impact: '',
        treatment_plan: '',
        residual_probability: '',
        residual_impact: ''
      });
      setNextReviewDate(undefined);
    }
  }, [risk, mode, isOpen]);

  const createRiskMutation = useMutation({
    mutationFn: createESGRisk,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Risco ESG criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['esg-risks'] });
      queryClient.invalidateQueries({ queryKey: ['risk-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['risk-matrix'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar risco ESG: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ESGRisk> }) =>
      updateESGRisk(id, updates),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Risco ESG atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['esg-risks'] });
      queryClient.invalidateQueries({ queryKey: ['risk-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['risk-matrix'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar risco ESG: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.risk_title || !formData.esg_category || !formData.probability || !formData.impact) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      esg_category: formData.esg_category as 'Environmental' | 'Social' | 'Governance',
      next_review_date: nextReviewDate ? format(nextReviewDate, 'yyyy-MM-dd') : ''
    } as any;

    if (mode === 'create') {
      createRiskMutation.mutate(submitData);
    } else if (mode === 'edit' && risk) {
      updateRiskMutation.mutate({ id: risk.id, updates: submitData });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isReadOnly = mode === 'view';
  const isLoading = createRiskMutation.isPending || updateRiskMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' && "Novo Risco ESG"}
            {mode === 'edit' && "Editar Risco ESG"}
            {mode === 'view' && "Detalhes do Risco ESG"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="risk_title">Título do Risco *</Label>
                <Input
                  id="risk_title"
                  value={formData.risk_title}
                  onChange={(e) => handleInputChange('risk_title', e.target.value)}
                  readOnly={isReadOnly}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="esg_category">Categoria ESG *</Label>
                <Select
                  value={formData.esg_category}
                  onValueChange={(value) => handleInputChange('esg_category', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Environmental">Ambiental (Environmental)</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Governance">Governança (Governance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="risk_description">Descrição do Risco</Label>
              <Textarea
                id="risk_description"
                value={formData.risk_description}
                onChange={(e) => handleInputChange('risk_description', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          {/* Avaliação de Risco */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Avaliação de Risco</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="probability">Probabilidade *</Label>
                <Select
                  value={formData.probability}
                  onValueChange={(value) => handleInputChange('probability', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="impact">Impacto *</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value) => handleInputChange('impact', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Em Monitoramento">Em Monitoramento</SelectItem>
                    <SelectItem value="Mitigado">Mitigado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Impactos Específicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Impactos Específicos</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="business_impact">Impacto nos Negócios</Label>
                <Textarea
                  id="business_impact"
                  value={formData.business_impact}
                  onChange={(e) => handleInputChange('business_impact', e.target.value)}
                  readOnly={isReadOnly}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="regulatory_impact">Impacto Regulatório</Label>
                <Textarea
                  id="regulatory_impact"
                  value={formData.regulatory_impact}
                  onChange={(e) => handleInputChange('regulatory_impact', e.target.value)}
                  readOnly={isReadOnly}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="reputation_impact">Impacto Reputacional</Label>
                <Textarea
                  id="reputation_impact"
                  value={formData.reputation_impact}
                  onChange={(e) => handleInputChange('reputation_impact', e.target.value)}
                  readOnly={isReadOnly}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Gestão e Controles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Gestão e Controles</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="risk_owner">Proprietário do Risco</Label>
                <Input
                  id="risk_owner"
                  value={formData.risk_owner}
                  onChange={(e) => handleInputChange('risk_owner', e.target.value)}
                  readOnly={isReadOnly}
                />
              </div>
              
              <div>
                <Label htmlFor="review_frequency">Frequência de Revisão</Label>
                <Select
                  value={formData.review_frequency}
                  onValueChange={(value) => handleInputChange('review_frequency', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Próxima Revisão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextReviewDate ? format(nextReviewDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextReviewDate}
                    onSelect={setNextReviewDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="control_measures">Medidas de Controle</Label>
              <Textarea
                id="control_measures"
                value={formData.control_measures}
                onChange={(e) => handleInputChange('control_measures', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="mitigation_actions">Ações de Mitigação</Label>
              <Textarea
                id="mitigation_actions"
                value={formData.mitigation_actions}
                onChange={(e) => handleInputChange('mitigation_actions', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="treatment_plan">Plano de Tratamento</Label>
              <Textarea
                id="treatment_plan"
                value={formData.treatment_plan}
                onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          {/* Risco Residual */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Risco Residual (Após Controles)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="residual_probability">Probabilidade Residual</Label>
                <Select
                  value={formData.residual_probability}
                  onValueChange={(value) => handleInputChange('residual_probability', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="residual_impact">Impacto Residual</Label>
                <Select
                  value={formData.residual_impact}
                  onValueChange={(value) => handleInputChange('residual_impact', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}