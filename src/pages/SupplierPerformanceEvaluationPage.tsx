import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Star, Package, Wrench, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSupplierById,
  getSupplierProductsServices,
  getSupplierPerformanceEvaluations,
  createSupplierPerformanceEvaluation,
  SupplierProductService,
} from "@/services/supplierManagementService";

interface EvaluationScores {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  compliance: number;
}

const scoreLabels: Record<number, string> = {
  1: "Muito Ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value}/5 - ${scoreLabels[value]}` : "Não avaliado"}
      </span>
    </div>
  );
}

export default function SupplierPerformanceEvaluationPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [scores, setScores] = useState<EvaluationScores>({
    quality: 0,
    delivery: 0,
    price: 0,
    communication: 0,
    compliance: 0,
  });
  const [observation, setObservation] = useState("");

  const { data: supplier } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => getManagedSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["supplier-products-services", supplierId],
    queryFn: () => getSupplierProductsServices(supplierId!),
    enabled: !!supplierId,
  });

  const { data: evaluations, isLoading: evalLoading } = useQuery({
    queryKey: ["performance-evaluations", supplierId],
    queryFn: () => getSupplierPerformanceEvaluations(supplierId!),
    enabled: !!supplierId,
  });

  const overallScore = useMemo(() => {
    const validScores = Object.values(scores).filter(s => s > 0);
    if (validScores.length === 0) return 0;
    return (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2);
  }, [scores]);

  const createMutation = useMutation({
    mutationFn: createSupplierPerformanceEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations", supplierId] });
      toast({ title: "Avaliação salva com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao salvar avaliação", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedItemId("");
    setScores({ quality: 0, delivery: 0, price: 0, communication: 0, compliance: 0 });
    setObservation("");
  };

  const handleSubmit = () => {
    if (!selectedItemId) {
      toast({ title: "Selecione um produto/serviço", variant: "destructive" });
      return;
    }

    const allScoresFilled = Object.values(scores).every(s => s > 0);
    if (!allScoresFilled) {
      toast({ title: "Preencha todas as notas", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      supplier_id: supplierId!,
      product_service_id: selectedItemId,
      quality_score: scores.quality,
      delivery_score: scores.delivery,
      price_score: scores.price,
      communication_score: scores.communication,
      compliance_score: scores.compliance,
      overall_score: parseFloat(overallScore as string),
      observation: observation || null,
    });
  };

  // Get latest evaluation for each item
  const itemsWithLatestEval = useMemo(() => {
    if (!items) return [];
    
    return items.map(item => {
      const itemEvals = evaluations?.filter(e => e.product_service_id === item.id) || [];
      const latest = itemEvals.sort((a, b) => 
        new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
      )[0];
      
      return { ...item, latestEvaluation: latest };
    });
  }, [items, evaluations]);

  const supplierName = supplier?.person_type === "PJ" ? supplier.company_name : supplier?.full_name;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/cadastro")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avaliação de Desempenho [AVA2]</h1>
            <p className="text-muted-foreground mt-1">
              {supplierName ? `Fornecedor: ${supplierName}` : "Carregando..."}
            </p>
          </div>
        </div>

        {/* Items Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos/Serviços Cadastrados
            </CardTitle>
            <CardDescription>
              Selecione um item para avaliar ou visualize avaliações anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={itemsLoading}
              empty={!itemsWithLatestEval.length}
              emptyMessage="Nenhum produto ou serviço cadastrado. Cadastre primeiro na página de Produtos/Serviços."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Última Avaliação</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsWithLatestEval.map((item) => (
                    <TableRow key={item.id} className={selectedItemId === item.id ? "bg-muted/50" : ""}>
                      <TableCell>
                        {item.item_type === "produto" ? (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span>Produto</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-green-500" />
                            <span>Serviço</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>
                        {item.latestEvaluation 
                          ? format(new Date(item.latestEvaluation.evaluation_date), "dd/MM/yyyy", { locale: ptBR })
                          : "Nunca"
                        }
                      </TableCell>
                      <TableCell>
                        {item.latestEvaluation ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{item.latestEvaluation.overall_score}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={selectedItemId === item.id ? "default" : "outline"}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          Avaliar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Evaluation Form */}
        {selectedItemId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Nova Avaliação
              </CardTitle>
              <CardDescription>
                {items?.find(i => i.id === selectedItemId)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Qualidade do Produto/Serviço</Label>
                  <StarRating value={scores.quality} onChange={(v) => setScores({ ...scores, quality: v })} />
                </div>

                <div className="space-y-2">
                  <Label>Prazo de Entrega</Label>
                  <StarRating value={scores.delivery} onChange={(v) => setScores({ ...scores, delivery: v })} />
                </div>

                <div className="space-y-2">
                  <Label>Preço/Custo-Benefício</Label>
                  <StarRating value={scores.price} onChange={(v) => setScores({ ...scores, price: v })} />
                </div>

                <div className="space-y-2">
                  <Label>Comunicação</Label>
                  <StarRating value={scores.communication} onChange={(v) => setScores({ ...scores, communication: v })} />
                </div>

                <div className="space-y-2">
                  <Label>Conformidade com Requisitos</Label>
                  <StarRating value={scores.compliance} onChange={(v) => setScores({ ...scores, compliance: v })} />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-3xl font-bold">{overallScore}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Nota Geral (média das avaliações)
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Adicione observações sobre esta avaliação..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Avaliação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={evalLoading}
              empty={!evaluations?.length}
              emptyMessage="Nenhuma avaliação anterior"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qualidade</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Comunicação</TableHead>
                    <TableHead>Conformidade</TableHead>
                    <TableHead>Nota Geral</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations?.map((eval_) => {
                    const item = items?.find(i => i.id === eval_.product_service_id);
                    return (
                      <TableRow key={eval_.id}>
                        <TableCell>
                          {format(new Date(eval_.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{item?.name || "-"}</TableCell>
                        <TableCell>{eval_.quality_score}</TableCell>
                        <TableCell>{eval_.delivery_score}</TableCell>
                        <TableCell>{eval_.price_score}</TableCell>
                        <TableCell>{eval_.communication_score}</TableCell>
                        <TableCell>{eval_.compliance_score}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{eval_.overall_score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{eval_.observation || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
