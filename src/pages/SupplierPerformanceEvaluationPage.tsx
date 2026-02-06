import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ClipboardList, Save, CheckCircle, XCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateDisplay } from "@/utils/dateUtils";
import { getManagedSupplierById, getSupplierAssignments } from "@/services/supplierManagementService";
import {
  getActiveEvaluationCriteria,
  getEvaluationConfig,
  getCriteriaEvaluations,
  getCriteriaEvaluationItems,
  createCriteriaEvaluation,
  initializeDefaultCriteria,
  SupplierEvaluationCriteria,
  SupplierCriteriaEvaluation,
} from "@/services/supplierCriteriaService";

type CriteriaStatus = 'ATENDE' | 'NAO_ATENDE' | null;

export default function SupplierPerformanceEvaluationPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [criteriaStatuses, setCriteriaStatuses] = useState<Map<string, CriteriaStatus>>(new Map());
  const [observation, setObservation] = useState("");

  const { data: supplier } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => getManagedSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  const { data: assignments } = useQuery({
    queryKey: ["supplier-assignments", supplierId],
    queryFn: () => getSupplierAssignments(supplierId!),
    enabled: !!supplierId,
  });

  const { data: criteria, isLoading: criteriaLoading } = useQuery({
    queryKey: ["active-evaluation-criteria"],
    queryFn: getActiveEvaluationCriteria,
  });

  const { data: config } = useQuery({
    queryKey: ["evaluation-config"],
    queryFn: getEvaluationConfig,
  });

  const { data: evaluations, isLoading: evalsLoading } = useQuery({
    queryKey: ["criteria-evaluations", supplierId],
    queryFn: () => getCriteriaEvaluations(supplierId!),
    enabled: !!supplierId,
  });

  // Initialize default criteria if none exist
  useEffect(() => {
    if (criteria && criteria.length === 0) {
      initializeDefaultCriteria().then(() => {
        queryClient.invalidateQueries({ queryKey: ["active-evaluation-criteria"] });
      });
    }
  }, [criteria, queryClient]);

  // Calculate totals
  const { totalWeight, achievedWeight, allFilled } = useMemo(() => {
    if (!criteria) return { totalWeight: 0, achievedWeight: 0, allFilled: false };
    
    const total = criteria.reduce((sum, c) => sum + c.weight, 0);
    const achieved = criteria.reduce((sum, c) => {
      const status = criteriaStatuses.get(c.id);
      return status === 'ATENDE' ? sum + c.weight : sum;
    }, 0);
    const filled = criteria.every(c => criteriaStatuses.get(c.id) !== undefined && criteriaStatuses.get(c.id) !== null);
    
    return { totalWeight: total, achievedWeight: achieved, allFilled: filled };
  }, [criteria, criteriaStatuses]);

  const minimumRequired = config?.minimum_approval_points || 0;
  const isApproved = achievedWeight >= minimumRequired;
  const percentage = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

  const saveMutation = useMutation({
    mutationFn: createCriteriaEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criteria-evaluations", supplierId] });
      toast({ title: "Avaliação salva com sucesso!" });
      setCriteriaStatuses(new Map());
      setObservation("");
    },
    onError: () => {
      toast({ title: "Erro ao salvar avaliação", variant: "destructive" });
    },
  });

  const handleStatusChange = (criteriaId: string, status: CriteriaStatus) => {
    setCriteriaStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(criteriaId, status);
      return newMap;
    });
  };

  const handleSubmit = () => {
    if (!allFilled) {
      toast({ title: "Preencha todos os critérios", variant: "destructive" });
      return;
    }

    const items = criteria!.map(c => ({
      criteria_id: c.id,
      criteria_name: c.name,
      weight: c.weight,
      status: criteriaStatuses.get(c.id) as 'ATENDE' | 'NAO_ATENDE',
    }));

    saveMutation.mutate({
      supplier_id: supplierId!,
      total_weight: totalWeight,
      achieved_weight: achievedWeight,
      minimum_required: minimumRequired,
      is_approved: isApproved,
      observation: observation || undefined,
      items,
    });
  };

  const supplierName = supplier?.person_type === "PJ" ? supplier.company_name : supplier?.full_name;
  const supplierTypes = assignments?.types?.map(t => t.supplier_type?.name).filter(Boolean).join(", ") || "-";
  const supplierCategories = assignments?.categories?.map(c => c.category?.name).filter(Boolean).join(", ") || "-";

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/avaliacoes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Avaliação de Critérios [AVA2]</h1>
              <p className="text-muted-foreground mt-1">
                {supplierName ? `Fornecedor: ${supplierName}` : "Carregando..."}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/fornecedores/criterios-avaliacao")}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Critérios
          </Button>
        </div>

        {/* Supplier Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Fornecedor</Label>
                <p className="font-medium">{supplierName || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo(s)</Label>
                <p className="font-medium">{supplierTypes}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria(s)</Label>
                <p className="font-medium">{supplierCategories}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p className="font-medium">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Critérios a Serem Avaliados
            </CardTitle>
            <CardDescription>
              Marque ATENDE ou NÃO ATENDE para cada critério
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={criteriaLoading}
              empty={!criteria?.length}
              emptyMessage="Nenhum critério configurado. Configure os critérios primeiro."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Critério</TableHead>
                    <TableHead className="w-72">Status</TableHead>
                    <TableHead className="w-24 text-center">Peso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <RadioGroup
                          value={criteriaStatuses.get(c.id) || ""}
                          onValueChange={(value) => handleStatusChange(c.id, value as CriteriaStatus)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ATENDE" id={`${c.id}-atende`} />
                            <Label 
                              htmlFor={`${c.id}-atende`} 
                              className="flex items-center gap-1 cursor-pointer text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                              ATENDE
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NAO_ATENDE" id={`${c.id}-nao-atende`} />
                            <Label 
                              htmlFor={`${c.id}-nao-atende`} 
                              className="flex items-center gap-1 cursor-pointer text-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                              NÃO ATENDE
                            </Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">{c.weight}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Result Summary */}
        <Card className={isApproved && allFilled ? "border-green-200 bg-green-50/50" : allFilled ? "border-red-200 bg-red-50/50" : ""}>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Peso Atingido</Label>
                <p className="text-2xl font-bold">{achievedWeight} / {totalWeight}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Mínimo para Aprovação</Label>
                <p className="text-2xl font-bold">{minimumRequired} pontos</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                {allFilled ? (
                  <Badge 
                    className={isApproved ? "bg-green-600 text-white text-lg px-4 py-1" : "bg-red-600 text-white text-lg px-4 py-1"}
                  >
                    {isApproved ? "✓ APROVADO" : "✗ REPROVADO"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-lg px-4 py-1">Pendente</Badge>
                )}
              </div>
            </div>
            <Progress value={percentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Aprovação depende da soma dos pesos dos itens ATENDE
            </p>
          </CardContent>
        </Card>

        {/* Observation and Save */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Adicione observações sobre esta avaliação..."
              rows={3}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!allFilled || saveMutation.isPending}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Avaliação
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={evalsLoading}
              empty={!evaluations?.length}
              emptyMessage="Nenhuma avaliação anterior"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Peso Atingido</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations?.map((eval_) => (
                    <TableRow key={eval_.id}>
                      <TableCell>
                        {formatDateDisplay(eval_.evaluation_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(eval_.achieved_weight / eval_.total_weight) * 100} className="w-20" />
                          <span>{eval_.achieved_weight} / {eval_.total_weight}</span>
                        </div>
                      </TableCell>
                      <TableCell>{eval_.minimum_required || "-"}</TableCell>
                      <TableCell>
                        <Badge className={eval_.is_approved ? "bg-green-600" : "bg-red-600"}>
                          {eval_.is_approved ? "Aprovado" : "Reprovado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{eval_.observation || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>
    </div>
  );
}
