import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCreateInternalEvaluation, useInternalRelationships } from "@/services/valueChainMapping";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, TrendingUp } from "lucide-react";

interface InternalClientEvaluationModalProps {
  open: boolean;
  onClose: () => void;
}

export function InternalClientEvaluationModal({ open, onClose }: InternalClientEvaluationModalProps) {
  const [formData, setFormData] = useState({
    relationship_id: "",
    evaluation_period_start: "",
    evaluation_period_end: "",
    overall_satisfaction_score: [8],
    service_quality_score: [8],
    response_time_score: [8],
    communication_score: [8],
    problem_resolution_score: [8],
    feedback_text: "",
    improvement_suggestions: "",
    nps_score: [8]
  });

  const { data: relationships } = useInternalRelationships();
  const { mutate: createEvaluation, isPending } = useCreateInternalEvaluation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.relationship_id || !formData.evaluation_period_start || !formData.evaluation_period_end) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    createEvaluation({
      relationship_id: formData.relationship_id,
      evaluation_period_start: formData.evaluation_period_start,
      evaluation_period_end: formData.evaluation_period_end,
      overall_satisfaction_score: formData.overall_satisfaction_score[0],
      service_quality_score: formData.service_quality_score[0],
      response_time_score: formData.response_time_score[0],
      communication_score: formData.communication_score[0],
      problem_resolution_score: formData.problem_resolution_score[0],
      feedback_text: formData.feedback_text || undefined,
      improvement_suggestions: formData.improvement_suggestions || undefined,
      nps_score: formData.nps_score[0]
    }, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Avaliação de cliente interno criada com sucesso"
        });
        onClose();
        setFormData({
          relationship_id: "",
          evaluation_period_start: "",
          evaluation_period_end: "",
          overall_satisfaction_score: [8],
          service_quality_score: [8],
          response_time_score: [8],
          communication_score: [8],
          problem_resolution_score: [8],
          feedback_text: "",
          improvement_suggestions: "",
          nps_score: [8]
        });
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excelente";
    if (score >= 7) return "Bom";
    if (score >= 5) return "Regular";
    return "Ruim";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Avaliar Cliente Interno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="relationship_id">Relacionamento Cliente-Fornecedor *</Label>
            <Select value={formData.relationship_id} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o relacionamento" />
              </SelectTrigger>
              <SelectContent>
                {relationships?.map((relationship) => (
                  <SelectItem key={relationship.id} value={relationship.id}>
                    {relationship.client_department} ← {relationship.supplier_department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evaluation_period_start">Início do Período *</Label>
              <Input
                id="evaluation_period_start"
                type="date"
                value={formData.evaluation_period_start}
                onChange={(e) => setFormData(prev => ({ ...prev, evaluation_period_start: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluation_period_end">Fim do Período *</Label>
              <Input
                id="evaluation_period_end"
                type="date"
                value={formData.evaluation_period_end}
                onChange={(e) => setFormData(prev => ({ ...prev, evaluation_period_end: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Avaliação por Critérios</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Satisfação Geral</Label>
                  <span className={`font-semibold ${getScoreColor(formData.overall_satisfaction_score[0])}`}>
                    {formData.overall_satisfaction_score[0]} - {getScoreLabel(formData.overall_satisfaction_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.overall_satisfaction_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, overall_satisfaction_score: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Qualidade do Serviço</Label>
                  <span className={`font-semibold ${getScoreColor(formData.service_quality_score[0])}`}>
                    {formData.service_quality_score[0]} - {getScoreLabel(formData.service_quality_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.service_quality_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_quality_score: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Tempo de Resposta</Label>
                  <span className={`font-semibold ${getScoreColor(formData.response_time_score[0])}`}>
                    {formData.response_time_score[0]} - {getScoreLabel(formData.response_time_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.response_time_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, response_time_score: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Comunicação</Label>
                  <span className={`font-semibold ${getScoreColor(formData.communication_score[0])}`}>
                    {formData.communication_score[0]} - {getScoreLabel(formData.communication_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.communication_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, communication_score: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Resolução de Problemas</Label>
                  <span className={`font-semibold ${getScoreColor(formData.problem_resolution_score[0])}`}>
                    {formData.problem_resolution_score[0]} - {getScoreLabel(formData.problem_resolution_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.problem_resolution_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, problem_resolution_score: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    NPS - Recomendaria?
                  </Label>
                  <span className={`font-semibold ${getScoreColor(formData.nps_score[0])}`}>
                    {formData.nps_score[0]} - {getScoreLabel(formData.nps_score[0])}
                  </span>
                </div>
                <Slider
                  value={formData.nps_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, nps_score: value }))}
                  min={0}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback_text" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback Geral
              </Label>
              <Textarea
                id="feedback_text"
                value={formData.feedback_text}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback_text: e.target.value }))}
                placeholder="Compartilhe seu feedback sobre o serviço recebido..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvement_suggestions">Sugestões de Melhoria</Label>
              <Textarea
                id="improvement_suggestions"
                value={formData.improvement_suggestions}
                onChange={(e) => setFormData(prev => ({ ...prev, improvement_suggestions: e.target.value }))}
                placeholder="Como o serviço poderia ser melhorado?"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}