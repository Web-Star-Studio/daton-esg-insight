import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Star, AlertCircle } from "lucide-react";
import { ManagedSupplierWithTypeCount } from "@/services/supplierManagementService";
import { createSupplierEvaluation } from "@/services/supplierService";

interface SupplierEvaluationModalProps {
  suppliers: ManagedSupplierWithTypeCount[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper para obter nome do fornecedor baseado no tipo (PF/PJ)
function getSupplierDisplayName(supplier: ManagedSupplierWithTypeCount): string {
  return supplier.person_type === 'PJ' 
    ? supplier.company_name || 'Empresa sem nome' 
    : supplier.full_name || 'Pessoa sem nome';
}

export function SupplierEvaluationModal({ 
  suppliers, 
  isOpen, 
  onClose, 
  onSuccess 
}: SupplierEvaluationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [evaluationData, setEvaluationData] = useState({
    quality_score: 0,
    delivery_score: 0,
    service_score: 0,
    comments: ""
  });

  const overallScore = (evaluationData.quality_score + evaluationData.delivery_score + evaluationData.service_score) / 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      toast.error("Selecione um fornecedor");
      return;
    }

    if (evaluationData.quality_score === 0 || evaluationData.delivery_score === 0 || evaluationData.service_score === 0) {
      toast.error("Preencha todas as notas de avaliação");
      return;
    }

    // Validar valores dentro do range
    if (evaluationData.quality_score < 0 || evaluationData.quality_score > 5 ||
        evaluationData.delivery_score < 0 || evaluationData.delivery_score > 5 ||
        evaluationData.service_score < 0 || evaluationData.service_score > 5) {
      toast.error("As notas devem estar entre 0 e 5");
      return;
    }

    setIsLoading(true);

    try {
      await createSupplierEvaluation({
        supplier_id: selectedSupplier,
        ...evaluationData
      });
      
      toast.success("Avaliação registrada com sucesso!");
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao registrar avaliação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setEvaluationData({
      quality_score: 0,
      delivery_score: 0,
      service_score: 0,
      comments: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getStarDisplay = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
        ))}
      </div>
    );
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return "Excelente";
    if (score >= 4.0) return "Muito Bom";
    if (score >= 3.5) return "Bom";
    if (score >= 3.0) return "Regular";
    if (score >= 2.0) return "Ruim";
    return "Muito Ruim";
  };

  // Filtrar apenas fornecedores ativos
  const activeSuppliers = suppliers.filter(s => s.status === 'Ativo');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Avaliar Fornecedor
          </DialogTitle>
        </DialogHeader>

        {activeSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor disponível</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre um fornecedor primeiro para poder realizar avaliações.
            </p>
            <Button asChild>
              <Link to="/fornecedores/cadastro" onClick={handleClose}>
                Cadastrar Fornecedor
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="supplier-select">Fornecedor</Label>
              <Select
                value={selectedSupplier}
                onValueChange={setSelectedSupplier}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {getSupplierDisplayName(supplier)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Evaluation Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Qualidade</span>
                    <span className={`text-lg font-bold ${getScoreColor(evaluationData.quality_score)}`}>
                      {evaluationData.quality_score.toFixed(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      {getStarDisplay(evaluationData.quality_score)}
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={[evaluationData.quality_score]}
                        onValueChange={(value) => setEvaluationData({
                          ...evaluationData,
                          quality_score: value[0]
                        })}
                        min={0}
                        max={5}
                        step={0.1}
                        className="cursor-pointer"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>2.5</span>
                        <span>5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(evaluationData.quality_score / 5) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {getScoreLabel(evaluationData.quality_score)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Entrega</span>
                    <span className={`text-lg font-bold ${getScoreColor(evaluationData.delivery_score)}`}>
                      {evaluationData.delivery_score.toFixed(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      {getStarDisplay(evaluationData.delivery_score)}
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={[evaluationData.delivery_score]}
                        onValueChange={(value) => setEvaluationData({
                          ...evaluationData,
                          delivery_score: value[0]
                        })}
                        min={0}
                        max={5}
                        step={0.1}
                        className="cursor-pointer"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>2.5</span>
                        <span>5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(evaluationData.delivery_score / 5) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {getScoreLabel(evaluationData.delivery_score)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Atendimento</span>
                    <span className={`text-lg font-bold ${getScoreColor(evaluationData.service_score)}`}>
                      {evaluationData.service_score.toFixed(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      {getStarDisplay(evaluationData.service_score)}
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={[evaluationData.service_score]}
                        onValueChange={(value) => setEvaluationData({
                          ...evaluationData,
                          service_score: value[0]
                        })}
                        min={0}
                        max={5}
                        step={0.1}
                        className="cursor-pointer"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>2.5</span>
                        <span>5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(evaluationData.service_score / 5) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {getScoreLabel(evaluationData.service_score)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Avaliação Geral</span>
                  <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore.toFixed(1)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    {getStarDisplay(overallScore)}
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={(overallScore / 5) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Baseado em 3 critérios
                      </span>
                      <span className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
                        {getScoreLabel(overallScore)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <div>
              <Label htmlFor="comments">Comentários e Observações</Label>
              <Textarea
                id="comments"
                value={evaluationData.comments}
                onChange={(e) => setEvaluationData({
                  ...evaluationData, 
                  comments: e.target.value
                })}
                placeholder="Descreva pontos específicos da avaliação, melhorias sugeridas, etc."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar Avaliação"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
