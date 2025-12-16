import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import { 
  ArrowLeft, FileText, Upload, Eye, CheckCircle, XCircle, 
  Clock, AlertTriangle, Save, Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSupplierById,
  getSupplierAssignments,
  getDocumentsForType,
  getDocumentSubmissions,
  getSupplierDocumentEvaluations,
  createSupplierDocumentEvaluation,
  updateDocumentSubmission,
  RequiredDocument,
  DocumentSubmission,
} from "@/services/supplierManagementService";

interface DocumentWithStatus extends RequiredDocument {
  submission?: DocumentSubmission;
  isExempt: boolean;
  exemptReason?: string;
  expiryDate?: string;
}

export default function SupplierDocumentEvaluationPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [supplierStatus, setSupplierStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [nextEvaluationDate, setNextEvaluationDate] = useState("");
  const [observation, setObservation] = useState("");
  const [documentsState, setDocumentsState] = useState<Map<string, { isExempt: boolean; exemptReason: string; expiryDate: string }>>(new Map());

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

  const { data: submissions } = useQuery({
    queryKey: ["document-submissions", supplierId],
    queryFn: () => getDocumentSubmissions(supplierId!),
    enabled: !!supplierId,
  });

  const { data: evaluationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["document-evaluations", supplierId],
    queryFn: () => getSupplierDocumentEvaluations(supplierId!),
    enabled: !!supplierId,
  });

  // Fetch required documents for each type
  const typeIds = assignments?.types.map(t => t.supplier_type_id) || [];
  
  const { data: requiredDocuments, isLoading: docsLoading } = useQuery({
    queryKey: ["required-docs-for-types", typeIds],
    queryFn: async () => {
      const allDocs: RequiredDocument[] = [];
      const seen = new Set<string>();
      
      for (const typeId of typeIds) {
        const docs = await getDocumentsForType(typeId);
        docs.forEach(d => {
          if (d.required_document && !seen.has(d.required_document.id)) {
            seen.add(d.required_document.id);
            allDocs.push(d.required_document);
          }
        });
      }
      return allDocs;
    },
    enabled: typeIds.length > 0,
  });

  // Merge documents with submissions
  const documentsWithStatus = useMemo<DocumentWithStatus[]>(() => {
    if (!requiredDocuments) return [];
    
    return requiredDocuments.map(doc => {
      const submission = submissions?.find(s => s.required_document_id === doc.id);
      const state = documentsState.get(doc.id);
      
      return {
        ...doc,
        submission,
        isExempt: state?.isExempt || submission?.is_exempt || false,
        exemptReason: state?.exemptReason || submission?.exempt_reason || "",
        expiryDate: state?.expiryDate || submission?.expiry_date || "",
      };
    });
  }, [requiredDocuments, submissions, documentsState]);

  // Calculate compliance
  const complianceStats = useMemo(() => {
    const totalWeight = documentsWithStatus.reduce((sum, d) => {
      if (d.isExempt) return sum;
      return sum + (d.weight || 1);
    }, 0);

    const achievedWeight = documentsWithStatus.reduce((sum, d) => {
      if (d.isExempt) return sum;
      if (d.submission?.status === "Aprovado") {
        return sum + (d.weight || 1);
      }
      return sum;
    }, 0);

    const percentage = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

    return { totalWeight, achievedWeight, percentage };
  }, [documentsWithStatus]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save document exemptions and expiry dates
      for (const doc of documentsWithStatus) {
        const state = documentsState.get(doc.id);
        if (state && doc.submission) {
          await updateDocumentSubmission(doc.submission.id, {
            is_exempt: state.isExempt,
            exempt_reason: state.exemptReason || null,
            expiry_date: state.expiryDate || null,
          });
        }
      }

      // Create evaluation record
      await createSupplierDocumentEvaluation({
        supplier_id: supplierId!,
        total_weight_required: complianceStats.totalWeight,
        total_weight_achieved: complianceStats.achievedWeight,
        compliance_percentage: complianceStats.percentage,
        next_evaluation_date: nextEvaluationDate || null,
        observation: observation || null,
        supplier_status: supplierStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-evaluations", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["document-submissions", supplierId] });
      toast({ title: "Avaliação salva com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar avaliação", variant: "destructive" });
    },
  });

  const handleDocumentStateChange = (docId: string, field: string, value: any) => {
    setDocumentsState(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(docId) || { isExempt: false, exemptReason: "", expiryDate: "" };
      newMap.set(docId, { ...current, [field]: value });
      return newMap;
    });
  };

  const getStatusBadge = (submission?: DocumentSubmission, isExempt?: boolean) => {
    if (isExempt) return <Badge variant="outline">Isento</Badge>;
    if (!submission) return <Badge variant="secondary">Pendente</Badge>;
    switch (submission.status) {
      case "Aprovado": return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "Rejeitado": return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Em análise</Badge>;
    }
  };

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-800">{days} dias</Badge>;
    return <Badge variant="outline">{days} dias</Badge>;
  };

  const supplierName = supplier?.person_type === "PJ" ? supplier.company_name : supplier?.full_name;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/cadastro")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Avaliação Documental [AVA1]</h1>
              <p className="text-muted-foreground mt-1">
                {supplierName ? `Fornecedor: ${supplierName}` : "Carregando..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Switch
                checked={supplierStatus === "Ativo"}
                onCheckedChange={(checked) => setSupplierStatus(checked ? "Ativo" : "Inativo")}
              />
              <Badge variant={supplierStatus === "Ativo" ? "default" : "secondary"}>
                {supplierStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{complianceStats.totalWeight}</div>
              <p className="text-sm text-muted-foreground">Peso Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{complianceStats.achievedWeight}</div>
              <p className="text-sm text-muted-foreground">Peso Atingido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{complianceStats.percentage}%</div>
              <Progress value={complianceStats.percentage} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">Conformidade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={nextEvaluationDate}
                  onChange={(e) => setNextEvaluationDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Próxima Avaliação</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Obrigatórios
            </CardTitle>
            <CardDescription>
              Baseados nas tipagens [TIP] vinculadas ao fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={docsLoading}
              empty={!documentsWithStatus.length}
              emptyMessage="Nenhuma tipagem vinculada ou documentos configurados"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead className="w-20">Peso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Isento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsWithStatus.map((doc) => (
                    <TableRow key={doc.id} className={doc.isExempt ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{doc.document_name}</TableCell>
                      <TableCell>{doc.weight || 1}</TableCell>
                      <TableCell>{getStatusBadge(doc.submission, doc.isExempt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={documentsState.get(doc.id)?.expiryDate || doc.expiryDate || ""}
                            onChange={(e) => handleDocumentStateChange(doc.id, "expiryDate", e.target.value)}
                            className="h-8 w-36"
                            disabled={doc.isExempt}
                          />
                          {getExpiryBadge(documentsState.get(doc.id)?.expiryDate || doc.expiryDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.submission?.file_path ? (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled={doc.isExempt}>
                            <Upload className="h-4 w-4 mr-1" />
                            Anexar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={documentsState.get(doc.id)?.isExempt ?? doc.isExempt}
                            onCheckedChange={(checked) => handleDocumentStateChange(doc.id, "isExempt", checked)}
                          />
                          {(documentsState.get(doc.id)?.isExempt ?? doc.isExempt) && (
                            <Input
                              placeholder="Motivo"
                              value={documentsState.get(doc.id)?.exemptReason || doc.exemptReason || ""}
                              onChange={(e) => handleDocumentStateChange(doc.id, "exemptReason", e.target.value)}
                              className="h-8 w-32"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Observation and Save */}
        <Card>
          <CardHeader>
            <CardTitle>Observações da Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Adicione observações sobre esta avaliação..."
              rows={3}
            />
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
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
              loading={historyLoading}
              empty={!evaluationHistory?.length}
              emptyMessage="Nenhuma avaliação anterior"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Conformidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationHistory?.map((eval_) => (
                    <TableRow key={eval_.id}>
                      <TableCell>
                        {format(new Date(eval_.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={eval_.compliance_percentage} className="w-20" />
                          <span>{eval_.compliance_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={eval_.supplier_status === "Ativo" ? "default" : "secondary"}>
                          {eval_.supplier_status}
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
    </MainLayout>
  );
}
