import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Upload,
  Eye,
  Save,
  Calendar,
  File,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
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
  SupplierDocumentEvaluation,
  SupplierDocumentEvaluationSnapshotItem,
} from "@/services/supplierManagementService";

const COMPLIANCE_THRESHOLD = 90;

type EvaluationStatus =
  | "ISENTO"
  | "ATENDE_COMPLETAMENTE"
  | "ATENDE_PARCIALMENTE"
  | "NAO_ATENDE";

interface DocumentState {
  isExempt: boolean;
  isInAdequation: boolean;
  exemptReason: string;
  expiryDate: string;
}

interface DocumentWithStatus extends RequiredDocument {
  submission?: DocumentSubmission;
  state: DocumentState;
}

interface EvaluatedDocument {
  document: DocumentWithStatus;
  status: EvaluationStatus;
  achievedWeight: number;
}

const getDefaultDocumentState = (submission?: DocumentSubmission): DocumentState => ({
  isExempt: submission?.is_exempt || false,
  isInAdequation: submission?.is_in_adequation || false,
  exemptReason: submission?.exempt_reason || "",
  expiryDate: submission?.expiry_date || "",
});

const isDateValidAndNotExpired = (dateValue?: string) => {
  if (!dateValue) return false;
  const parsed = parseISO(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed >= today;
};

const evaluateDocument = (document: DocumentWithStatus): EvaluatedDocument => {
  const weight = document.weight || 1;
  const hasFile = Boolean(document.submission?.file_path);
  const hasValidDate = isDateValidAndNotExpired(document.state.expiryDate);

  if (document.state.isExempt) {
    return { document, status: "ISENTO", achievedWeight: 0 };
  }

  if (!hasFile || !hasValidDate) {
    return { document, status: "NAO_ATENDE", achievedWeight: 0 };
  }

  if (document.state.isInAdequation) {
    return { document, status: "ATENDE_PARCIALMENTE", achievedWeight: weight * 0.5 };
  }

  return { document, status: "ATENDE_COMPLETAMENTE", achievedWeight: weight };
};

const getEvaluationStatusLabel = (status: EvaluationStatus) => {
  switch (status) {
    case "ISENTO":
      return "ISENTO";
    case "ATENDE_COMPLETAMENTE":
      return "ATENDE COMPLETAMENTE";
    case "ATENDE_PARCIALMENTE":
      return "ATENDE PARCIALMENTE";
    default:
      return "NÃO ATENDE";
  }
};

const getEvaluationBadge = (status: EvaluationStatus) => {
  if (status === "ISENTO") return <Badge variant="outline">ISENTO</Badge>;
  if (status === "ATENDE_COMPLETAMENTE") return <Badge className="bg-green-100 text-green-800">ATENDE</Badge>;
  if (status === "ATENDE_PARCIALMENTE") return <Badge className="bg-yellow-100 text-yellow-800">EM ADEQUAÇÃO</Badge>;
  return <Badge className="bg-red-100 text-red-800">NÃO ATENDE</Badge>;
};

const isEvaluationCompliant = (evaluation: SupplierDocumentEvaluation) => {
  if (typeof evaluation.is_compliant === "boolean") return evaluation.is_compliant;
  return (evaluation.total_weight_achieved || 0) > (evaluation.total_weight_required || 0) * 0.9;
};

const hasEvaluationAdequation = (evaluation: SupplierDocumentEvaluation) => {
  if (typeof evaluation.has_adequation === "boolean") return evaluation.has_adequation;
  return Array.isArray(evaluation.criteria_snapshot)
    ? evaluation.criteria_snapshot.some((item) => item.is_in_adequation)
    : false;
};

export default function SupplierDocumentEvaluationPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [supplierStatus, setSupplierStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [nextEvaluationDate, setNextEvaluationDate] = useState("");
  const [observation, setObservation] = useState("");
  const [documentsState, setDocumentsState] = useState<Map<string, DocumentState>>(new Map());

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [historyDetailsOpen, setHistoryDetailsOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<SupplierDocumentEvaluation | null>(null);

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

  const typeIds = assignments?.types.map((type) => type.supplier_type_id) || [];

  const { data: requiredDocuments, isLoading: docsLoading } = useQuery({
    queryKey: ["required-docs-for-types", typeIds],
    queryFn: async () => {
      const allDocs: RequiredDocument[] = [];
      const seen = new Set<string>();

      for (const typeId of typeIds) {
        const docs = await getDocumentsForType(typeId);
        docs.forEach((doc) => {
          if (doc.required_document && !seen.has(doc.required_document.id)) {
            seen.add(doc.required_document.id);
            allDocs.push(doc.required_document);
          }
        });
      }
      return allDocs;
    },
    enabled: typeIds.length > 0,
  });

  useEffect(() => {
    if (evaluationHistory?.length && !nextEvaluationDate) {
      const latest = evaluationHistory[0];
      if (latest.next_evaluation_date) {
        setNextEvaluationDate(latest.next_evaluation_date);
      }
      if (latest.supplier_status) {
        setSupplierStatus(latest.supplier_status);
      }
    }
  }, [evaluationHistory, nextEvaluationDate]);

  const documentsWithStatus = useMemo<DocumentWithStatus[]>(() => {
    if (!requiredDocuments) return [];

    return requiredDocuments.map((doc) => {
      const submission = submissions?.find((item) => item.required_document_id === doc.id);
      const localState = documentsState.get(doc.id) || getDefaultDocumentState(submission);

      return {
        ...doc,
        submission,
        state: localState,
      };
    });
  }, [requiredDocuments, submissions, documentsState]);

  const complianceStats = useMemo(() => {
    const evaluatedDocuments = documentsWithStatus.map(evaluateDocument);

    const totalWeight = evaluatedDocuments.reduce((sum, item) => {
      if (item.status === "ISENTO") return sum;
      return sum + (item.document.weight || 1);
    }, 0);

    const achievedWeight = evaluatedDocuments.reduce((sum, item) => sum + item.achievedWeight, 0);
    const percentage = totalWeight > 0 ? Number(((achievedWeight / totalWeight) * 100).toFixed(2)) : 100;
    const isCompliant = totalWeight === 0 ? true : achievedWeight > totalWeight * (COMPLIANCE_THRESHOLD / 100);
    const hasAdequation = evaluatedDocuments.some((item) => item.status === "ATENDE_PARCIALMENTE");

    return { totalWeight, achievedWeight, percentage, isCompliant, hasAdequation, evaluatedDocuments };
  }, [documentsWithStatus]);

  const handleUploadDocument = useCallback(
    async (file: File) => {
      if (!selectedDocId || !supplierId || !supplier) return;

      setUploadingFile(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error("Usuário não autenticado");

        const companyId = supplier.company_id;
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `supplier-documents/${companyId}/${supplierId}/${selectedDocId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const existingSubmission = submissions?.find((item) => item.required_document_id === selectedDocId);

        if (existingSubmission) {
          const { error: updateError } = await supabase
            .from("supplier_document_submissions")
            .update({
              file_path: filePath,
              file_name: file.name,
              status: "Pendente",
              submitted_at: new Date().toISOString(),
              is_exempt: false,
              exempt_reason: null,
              is_in_adequation: false,
            })
            .eq("id", existingSubmission.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("supplier_document_submissions")
            .insert({
              company_id: companyId,
              supplier_id: supplierId,
              required_document_id: selectedDocId,
              file_path: filePath,
              file_name: file.name,
              status: "Pendente",
              submitted_at: new Date().toISOString(),
              is_exempt: false,
              is_in_adequation: false,
            });

          if (insertError) throw insertError;
        }

        queryClient.invalidateQueries({ queryKey: ["document-submissions", supplierId] });
        toast({ title: "Documento anexado com sucesso!" });
        setUploadDialogOpen(false);
        setSelectedDocId(null);
      } catch (error: any) {
        toast({
          title: "Erro ao anexar documento",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setUploadingFile(false);
      }
    },
    [selectedDocId, supplierId, supplier, submissions, queryClient, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleUploadDocument(acceptedFiles[0]);
      }
    },
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const openUploadDialog = (docId: string) => {
    setSelectedDocId(docId);
    setUploadDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId || !supplier) {
        throw new Error("Fornecedor não encontrado");
      }

      if (!nextEvaluationDate) {
        throw new Error("A próxima avaliação é obrigatória");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(`${nextEvaluationDate}T00:00:00`);
      if (Number.isNaN(nextDate.getTime()) || nextDate < today) {
        throw new Error("A data da próxima avaliação deve ser hoje ou futura");
      }

      for (const document of documentsWithStatus) {
        const hasRelevantState =
          document.state.isExempt ||
          document.state.isInAdequation ||
          Boolean(document.state.expiryDate);

        if (document.submission) {
          await updateDocumentSubmission(document.submission.id, {
            is_exempt: document.state.isExempt,
            is_in_adequation: document.state.isInAdequation,
            exempt_reason: document.state.isExempt ? document.state.exemptReason || null : null,
            expiry_date: document.state.expiryDate || null,
          });
        } else if (hasRelevantState) {
          const { error } = await supabase.from("supplier_document_submissions").insert({
            company_id: supplier.company_id,
            supplier_id: supplierId,
            required_document_id: document.id,
            status: "Pendente",
            submitted_at: new Date().toISOString(),
            is_exempt: document.state.isExempt,
            is_in_adequation: document.state.isInAdequation,
            exempt_reason: document.state.isExempt ? document.state.exemptReason || null : null,
            expiry_date: document.state.expiryDate || null,
          });

          if (error) throw error;
        }
      }

      const snapshot: SupplierDocumentEvaluationSnapshotItem[] = complianceStats.evaluatedDocuments.map((item) => ({
        required_document_id: item.document.id,
        document_name: item.document.document_name,
        weight: item.document.weight || 1,
        is_exempt: item.document.state.isExempt,
        is_in_adequation: item.document.state.isInAdequation,
        status_label: item.status,
        achieved_weight: Number(item.achievedWeight.toFixed(2)),
        file_name: item.document.submission?.file_name || null,
        expiry_date: item.document.state.expiryDate || null,
      }));

      await createSupplierDocumentEvaluation({
        supplier_id: supplierId,
        total_weight_required: Number(complianceStats.totalWeight.toFixed(2)),
        total_weight_achieved: Number(complianceStats.achievedWeight.toFixed(2)),
        compliance_percentage: complianceStats.percentage,
        next_evaluation_date: nextEvaluationDate,
        compliance_threshold: COMPLIANCE_THRESHOLD,
        is_compliant: complianceStats.isCompliant,
        has_adequation: complianceStats.hasAdequation,
        criteria_snapshot: snapshot,
        observation: observation || null,
        supplier_status: supplierStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-evaluations", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["document-submissions", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["latest-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["managed-suppliers"] });
      toast({ title: "Avaliação salva com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar avaliação",
        description: error?.message || "Não foi possível salvar a avaliação",
        variant: "destructive",
      });
    },
  });

  const handleDocumentStateChange = (docId: string, field: keyof DocumentState, value: string | boolean) => {
    setDocumentsState((previous) => {
      const updated = new Map(previous);
      const fallbackSubmission = submissions?.find((item) => item.required_document_id === docId);
      const current = updated.get(docId) || getDefaultDocumentState(fallbackSubmission);
      const nextState: DocumentState = { ...current, [field]: value } as DocumentState;

      if (field === "isExempt" && value === true) {
        nextState.isInAdequation = false;
      }
      if (field === "isInAdequation" && value === true) {
        nextState.isExempt = false;
        nextState.exemptReason = "";
      }
      if (field === "isExempt" && value === false) {
        nextState.exemptReason = "";
      }

      updated.set(docId, nextState);
      return updated;
    });
  };

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null;

    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-800">{days} dias</Badge>;
    return <Badge variant="outline">{days} dias</Badge>;
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
    } catch (error: any) {
      toast({
        title: "Erro ao visualizar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openHistoryDetails = (evaluation: SupplierDocumentEvaluation) => {
    setSelectedHistory(evaluation);
    setHistoryDetailsOpen(true);
  };

  const supplierName = supplier?.person_type === "PJ" ? supplier.company_name : supplier?.full_name;
  const selectedHistorySnapshot = selectedHistory?.criteria_snapshot || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/avaliacoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avaliação Documental [AVA1]</h1>
            <p className="text-muted-foreground mt-1">
              {supplierName ? `Fornecedor: ${supplierName}` : "Carregando..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Switch
            checked={supplierStatus === "Ativo"}
            onCheckedChange={(checked) => setSupplierStatus(checked ? "Ativo" : "Inativo")}
          />
          <Badge variant={supplierStatus === "Ativo" ? "default" : "secondary"}>{supplierStatus}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Obrigatórios
          </CardTitle>
          <CardDescription>Baseados nas tipagens [TIP] vinculadas ao fornecedor</CardDescription>
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
                  <TableHead>Em Adequação</TableHead>
                  <TableHead>Isento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceStats.evaluatedDocuments.map((item) => {
                  const document = item.document;
                  const state = document.state;

                  return (
                    <TableRow key={document.id} className={state.isExempt ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{document.document_name}</TableCell>
                      <TableCell>{document.weight || 1}</TableCell>
                      <TableCell>{getEvaluationBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={state.expiryDate}
                            onChange={(event) =>
                              handleDocumentStateChange(document.id, "expiryDate", event.target.value)
                            }
                            className="h-8 w-36"
                            disabled={state.isExempt}
                          />
                          {getExpiryBadge(state.expiryDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.submission?.file_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document.submission!.file_path!)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={state.isExempt}
                            onClick={() => openUploadDialog(document.id)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Anexar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={state.isInAdequation}
                            onCheckedChange={(checked) =>
                              handleDocumentStateChange(document.id, "isInAdequation", checked === true)
                            }
                            disabled={state.isExempt}
                          />
                          <span className="text-xs text-muted-foreground">Parcial</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={state.isExempt}
                            onCheckedChange={(checked) =>
                              handleDocumentStateChange(document.id, "isExempt", checked === true)
                            }
                          />
                          {state.isExempt && (
                            <Input
                              placeholder="Motivo"
                              value={state.exemptReason}
                              onChange={(event) =>
                                handleDocumentStateChange(document.id, "exemptReason", event.target.value)
                              }
                              className="h-8 w-32"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </LoadingState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações da Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Adicione observações sobre esta avaliação..."
            rows={3}
          />
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Avaliação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Resumo da Avaliação
          </CardTitle>
          <CardDescription>Regra de conformidade: peso atingido deve ser maior que 90% do peso considerado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{complianceStats.totalWeight.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Peso Total Considerado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {complianceStats.achievedWeight.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Peso Atingido</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{complianceStats.percentage.toFixed(2)}%</div>
                <Progress value={complianceStats.percentage} className="mt-2" />
                <div className="mt-2">
                  <Badge className={complianceStats.isCompliant ? "bg-green-600" : "bg-red-600"}>
                    {complianceStats.isCompliant ? "CONFORME" : "NÃO CONFORME"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={nextEvaluationDate}
                    onChange={(event) => setNextEvaluationDate(event.target.value)}
                    className="h-8"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Próxima Avaliação (obrigatória)</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Adequação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próx. Avaliação</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluationHistory?.map((evaluation) => {
                  const compliant = isEvaluationCompliant(evaluation);
                  const adequation = hasEvaluationAdequation(evaluation);

                  return (
                    <TableRow key={evaluation.id}>
                      <TableCell>{format(new Date(evaluation.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={evaluation.compliance_percentage || 0} className="w-20" />
                          <Badge className={compliant ? "bg-green-600" : "bg-red-600"}>
                            {compliant ? "CONFORME" : "NÃO CONFORME"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={adequation ? "secondary" : "outline"}>
                          {adequation ? "Em adequação" : "Sem adequação"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={evaluation.supplier_status === "Ativo" ? "default" : "secondary"}>
                          {evaluation.supplier_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {evaluation.next_evaluation_date
                          ? format(new Date(evaluation.next_evaluation_date), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{evaluation.observation || "-"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openHistoryDetails(evaluation)}>
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </LoadingState>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Documento</DialogTitle>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            {uploadingFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <>
                <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-primary">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG (máx. 10MB)</p>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDetailsOpen} onOpenChange={setHistoryDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
          </DialogHeader>
          {selectedHistory ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedHistory.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peso</p>
                  <p className="font-medium">
                    {selectedHistory.total_weight_achieved?.toFixed(2)} / {selectedHistory.total_weight_required?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conformidade</p>
                  <p className="font-medium">{selectedHistory.compliance_percentage?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={isEvaluationCompliant(selectedHistory) ? "bg-green-600" : "bg-red-600"}>
                    {isEvaluationCompliant(selectedHistory) ? "CONFORME" : "NÃO CONFORME"}
                  </Badge>
                </div>
              </div>

              {selectedHistorySnapshot.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Peso Atingido</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Arquivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedHistorySnapshot.map((item, index) => (
                      <TableRow key={`${item.required_document_id}-${index}`}>
                        <TableCell className="font-medium">{item.document_name}</TableCell>
                        <TableCell>{getEvaluationStatusLabel(item.status_label)}</TableCell>
                        <TableCell>{item.weight}</TableCell>
                        <TableCell>{item.achieved_weight.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.expiry_date
                            ? format(new Date(item.expiry_date), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>{item.file_name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta avaliação não possui snapshot dos critérios (registro legado).
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

