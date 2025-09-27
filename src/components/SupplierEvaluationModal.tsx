import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Supplier, createSupplierEvaluation } from "@/services/supplierService";

interface SupplierEvaluationModalProps {
  suppliers: Supplier[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

  const getProgressColor = (score: number) => {
    if (score >= 4.5) return "bg-green-500";
    if (score >= 3.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Avaliar Fornecedor
          </DialogTitle>
        </DialogHeader>

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
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evaluation Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={evaluationData.quality_score}
                    onChange={(e) => setEvaluationData({
                      ...evaluationData, 
                      quality_score: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0.0"
                  />
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(evaluationData.quality_score / 5) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-sm font-medium ${getScoreColor(evaluationData.quality_score)}`}>
                      {evaluationData.quality_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={evaluationData.delivery_score}
                    onChange={(e) => setEvaluationData({
                      ...evaluationData, 
                      delivery_score: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0.0"
                  />
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(evaluationData.delivery_score / 5) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-sm font-medium ${getScoreColor(evaluationData.delivery_score)}`}>
                      {evaluationData.delivery_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={evaluationData.service_score}
                    onChange={(e) => setEvaluationData({
                      ...evaluationData, 
                      service_score: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0.0"
                  />
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(evaluationData.service_score / 5) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-sm font-medium ${getScoreColor(evaluationData.service_score)}`}>
                      {evaluationData.service_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avaliação Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress 
                    value={(overallScore / 5) * 100} 
                    className="h-4"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore.toFixed(1)}
                  </span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(overallScore) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`}
                      />
                    ))}
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
      </DialogContent>
    </Dialog>
  );
}