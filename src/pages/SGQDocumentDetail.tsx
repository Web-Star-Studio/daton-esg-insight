import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  CalendarRange,
  Download,
  Eye,
  FilePenLine,
  FileText,
  FolderGit2,
  GitPullRequest,
  Link2,
  Loader2,
  Milestone,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CollaboratorMultiSelect } from "@/components/document-center/CollaboratorMultiSelect";
import { useBranches } from "@/services/branches";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import {
  confirmReadRecipient,
  createDocumentRelation,
  createDocumentRequest,
  createReadCampaign,
  deleteDocumentRecord,
  deleteDocumentRelation,
  fulfillDocumentRequest,
  getCompanyUsers,
  getDocumentDownload,
  getDocumentRecord,
  listDocumentRecords,
  markDocumentViewed,
  replaceDocumentFile,
  updateDocumentMetadata,
  type DocumentDetail,
} from "@/services/documentCenter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "in_review", label: "Em revisao" },
  { value: "rejected", label: "Rejeitado" },
  { value: "archived", label: "Arquivado" },
];

const DOMAIN_OPTIONS = [
  { value: "quality", label: "Qualidade" },
  { value: "regulatory", label: "Regulatorio" },
  { value: "waste", label: "Residuos" },
  { value: "training", label: "Treinamentos" },
  { value: "people", label: "Pessoas" },
  { value: "general", label: "Geral" },
];

const RELATION_OPTIONS = [
  { value: "references", label: "Referencia" },
  { value: "complements", label: "Complementa" },
  { value: "replaces", label: "Substitui" },
  { value: "depends_on", label: "Depende de" },
];

const REQUEST_OPTIONS = [
  { value: "new_document", label: "Novo documento" },
  { value: "new_version", label: "Nova versao" },
  { value: "complement", label: "Complemento" },
];

const CONFIDENTIALITY_OPTIONS = [
  { value: "public", label: "Publico" },
  { value: "internal", label: "Interno" },
  { value: "restricted", label: "Restrito" },
  { value: "confidential", label: "Confidencial" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function getTimelineBadge(kind: string) {
  switch (kind) {
    case "version":
      return "default";
    case "change":
      return "secondary";
    default:
      return "outline";
  }
}

export default function SGQDocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: branches = [] } = useBranches();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    message: "",
    dueAt: "",
  });
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    requestType: "new_version",
    requestedFromUserId: "",
    dueAt: "",
    priority: "medium",
  });
  const [relationForm, setRelationForm] = useState({
    relationType: "references",
    targetDocumentId: "",
    notes: "",
  });
  const [metadataForm, setMetadataForm] = useState({
    title: "",
    summary: "",
    tagsText: "",
    documentDomain: "general",
    status: "draft",
    branchIds: [] as string[],
    code: "",
    documentTypeLabel: "",
    normReference: "",
    issuerName: "",
    confidentialityLevel: "public",
    validityStartDate: "",
    validityEndDate: "",
    reviewDueDate: "",
    responsibleDepartment: "",
    controlledCopy: false,
  });

  const documentId = id || "";

  const { data: document, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ["document-center-detail", documentId],
    queryFn: () => getDocumentRecord(documentId),
    enabled: Boolean(documentId),
    retry: 1,
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ["document-center-collaborators"],
    queryFn: getCompanyUsers,
  });

  const { data: relationOptions = [] } = useQuery({
    queryKey: ["document-center-relations-options"],
    queryFn: () => listDocumentRecords({}),
  });

  useEffect(() => {
    if (!documentId || !document) return;
    markDocumentViewed(documentId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["document-center"] });
      })
      .catch((err) => console.warn("Falha ao registrar visualização:", err));
  }, [documentId, document, queryClient]);

  useEffect(() => {
    if (!document) return;
    setMetadataForm({
      title: document.title,
      summary: document.summary || "",
      tagsText: document.tags.join(", "),
      documentDomain: document.document_domain,
      status: document.status,
      branchIds: document.branch_ids,
      code: document.control_profile?.code || "",
      documentTypeLabel: document.control_profile?.document_type_label || "",
      normReference: document.control_profile?.norm_reference || "",
      issuerName: document.control_profile?.issuer_name || "",
      confidentialityLevel: document.control_profile?.confidentiality_level || "public",
      validityStartDate: document.control_profile?.validity_start_date || "",
      validityEndDate: document.control_profile?.validity_end_date || "",
      reviewDueDate: document.control_profile?.review_due_date || "",
      responsibleDepartment: document.control_profile?.responsible_department || "",
      controlledCopy: document.control_profile?.controlled_copy || false,
    });
  }, [document]);

  const sameDomainRelationOptions = useMemo(() => {
    if (!document) return [];
    return relationOptions
      .filter((option) => option.id !== document.id)
      .sort((left, right) => {
        const leftPriority = left.document_domain === document.document_domain ? 0 : 1;
        const rightPriority = right.document_domain === document.document_domain ? 0 : 1;
        return leftPriority - rightPriority || left.title.localeCompare(right.title);
      });
  }, [document, relationOptions]);

  const refreshDocument = () => {
    queryClient.invalidateQueries({ queryKey: ["document-center-detail", documentId] });
    queryClient.invalidateQueries({ queryKey: ["document-center"] });
  };

  const metadataMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      await updateDocumentMetadata(document.id, {
        title: metadataForm.title,
        summary: metadataForm.summary || null,
        tags: metadataForm.tagsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        documentDomain: metadataForm.documentDomain,
        status: metadataForm.status as DocumentDetail["status"],
        branchIds: metadataForm.branchIds,
        controlProfile:
          document.document_kind === "controlled"
            ? {
                code: metadataForm.code || null,
                document_type_label: metadataForm.documentTypeLabel,
                norm_reference: metadataForm.normReference || null,
                issuer_name: metadataForm.issuerName || null,
                confidentiality_level: metadataForm.confidentialityLevel,
                validity_start_date: metadataForm.validityStartDate || null,
                validity_end_date: metadataForm.validityEndDate || null,
                review_due_date: metadataForm.reviewDueDate || null,
                responsible_department: metadataForm.responsibleDepartment || null,
                controlled_copy: metadataForm.controlledCopy,
              }
            : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Metadados atualizados.");
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const replaceFileMutation = useMutation({
    mutationFn: async () => {
      if (!document || !replacementFile) {
        throw new Error("Selecione um arquivo para substituir.");
      }
      await replaceDocumentFile(document.id, replacementFile);
    },
    onSuccess: () => {
      toast.success("Nova revisao registrada.");
      setReplacementFile(null);
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const campaignMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      await createReadCampaign({
        documentId: document.id,
        title: campaignForm.title,
        message: campaignForm.message,
        dueAt: campaignForm.dueAt || null,
        recipientIds: selectedRecipientIds,
      });
    },
    onSuccess: () => {
      toast.success("Campanha de leitura criada.");
      setCampaignForm({ title: "", message: "", dueAt: "" });
      setSelectedRecipientIds([]);
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      await createDocumentRequest({
        documentId: document.id,
        title: requestForm.title,
        description: requestForm.description,
        requestType: requestForm.requestType as "new_document" | "new_version" | "complement",
        requestedFromUserId: requestForm.requestedFromUserId,
        dueAt: requestForm.dueAt || null,
        priority: requestForm.priority as "low" | "medium" | "high",
      });
    },
    onSuccess: () => {
      toast.success("Solicitacao registrada.");
      setRequestForm({
        title: "",
        description: "",
        requestType: "new_version",
        requestedFromUserId: "",
        dueAt: "",
        priority: "medium",
      });
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fulfillMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!document) return;
      const currentVersion = document.versions.find((version) => version.is_current);
      await fulfillDocumentRequest({
        requestId,
        fulfilledDocumentId: document.id,
        fulfilledVersionId: currentVersion?.id || null,
      });
    },
    onSuccess: () => {
      toast.success("Solicitacao concluida.");
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const relationMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      await createDocumentRelation({
        sourceDocumentId: document.id,
        targetDocumentId: relationForm.targetDocumentId,
        relationType: relationForm.relationType as "references" | "complements" | "replaces" | "depends_on",
        notes: relationForm.notes,
      });
    },
    onSuccess: () => {
      toast.success("Relacao criada.");
      setRelationForm({ relationType: "references", targetDocumentId: "", notes: "" });
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeRelationMutation = useMutation({
    mutationFn: deleteDocumentRelation,
    onSuccess: () => {
      toast.success("Relacao removida.");
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const confirmRecipientMutation = useMutation({
    mutationFn: ({ recipientId, note }: { recipientId: string; note?: string }) => confirmReadRecipient(recipientId, note),
    onSuccess: () => {
      toast.success("Leitura confirmada.");
      refreshDocument();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDownload = async () => {
    if (!document) return;
    try {
      const { url, fileName } = await getDocumentDownload(document.id);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar documento.");
    }
  };

  const toggleBranch = (branchId: string) => {
    setMetadataForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">
              {isError ? "Erro ao carregar documento" : "Documento não encontrado"}
            </CardTitle>
            <CardDescription>
              {isError
                ? (queryError instanceof Error ? queryError.message : "Ocorreu um erro inesperado.")
                : "O documento solicitado não foi encontrado."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 justify-center">
            {isError && (
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/documentos")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge variant="outline" className="gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagina dedicada do documento
          </Badge>
          <Badge variant={document.document_kind === "controlled" ? "default" : "secondary"}>
            {document.document_kind === "controlled" ? "Controlado" : "Geral"}
          </Badge>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">
              {document.file_name} · enviado em {formatDate(document.upload_date)} · Rev. {document.current_version_number}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={refreshDocument} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      {document.document_kind === "controlled" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="grid gap-4 p-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Titulo</p>
              <p className="font-semibold">{document.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-semibold">{document.control_profile?.document_type_label || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidencialidade</p>
              <p className="font-semibold">{document.control_profile?.confidentiality_level || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revisao</p>
              <p className="font-semibold">{document.current_version_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Norma</p>
              <p className="font-semibold">{document.control_profile?.norm_reference || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Codigo</p>
              <p className="font-semibold">{document.control_profile?.code || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Emitente</p>
              <p className="font-semibold">{document.control_profile?.issuer_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validade</p>
              <p className="font-semibold">
                {formatDate(document.control_profile?.validity_start_date)} ate {formatDate(document.control_profile?.validity_end_date)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visualizacao</CardTitle>
              <CardDescription>Preview do arquivo atual e acesso rapido ao download.</CardDescription>
            </CardHeader>
            <CardContent>
              {document.preview_url && document.file_type.includes("pdf") ? (
                <iframe src={document.preview_url} className="h-[620px] w-full rounded-lg border" title={document.file_name} />
              ) : document.preview_url && document.file_type.startsWith("image") ? (
                <img src={document.preview_url} alt={document.file_name} className="max-h-[620px] w-full rounded-lg border object-contain" />
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Preview nao disponivel para este formato.</p>
                    <p className="text-sm text-muted-foreground">Use o download para abrir o arquivo original.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Metadados e governanca</CardTitle>
                <CardDescription>Atualize cabecalho, status, vigencia, dominio e filiais vinculadas.</CardDescription>
              </div>
              <Button onClick={() => metadataMutation.mutate()} disabled={metadataMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Titulo</Label>
                  <Input
                    value={metadataForm.title}
                    onChange={(event) => setMetadataForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={metadataForm.status}
                    onValueChange={(value) => setMetadataForm((current) => ({ ...current, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Resumo</Label>
                <Textarea
                  value={metadataForm.summary}
                  onChange={(event) => setMetadataForm((current) => ({ ...current, summary: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Dominio</Label>
                  <Select
                    value={metadataForm.documentDomain}
                    onValueChange={(value) => setMetadataForm((current) => ({ ...current, documentDomain: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <Input
                    value={metadataForm.tagsText}
                    onChange={(event) => setMetadataForm((current) => ({ ...current, tagsText: event.target.value }))}
                    placeholder="frota, pneus, combustivel"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Filiais</Label>
                <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                  {branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-3 text-sm">
                      <Checkbox checked={metadataForm.branchIds.includes(branch.id)} onCheckedChange={() => toggleBranch(branch.id)} />
                      {getBranchDisplayLabel(branch)}
                    </label>
                  ))}
                </div>
              </div>

              {document.document_kind === "controlled" && (
                <>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Codigo</Label>
                      <Input
                        value={metadataForm.code}
                        onChange={(event) => setMetadataForm((current) => ({ ...current, code: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tipo controlado</Label>
                      <Input
                        value={metadataForm.documentTypeLabel}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, documentTypeLabel: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Norma</Label>
                      <Input
                        value={metadataForm.normReference}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, normReference: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Emitente</Label>
                      <Input
                        value={metadataForm.issuerName}
                        onChange={(event) => setMetadataForm((current) => ({ ...current, issuerName: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Confidencialidade</Label>
                      <Select
                        value={metadataForm.confidentialityLevel}
                        onValueChange={(value) =>
                          setMetadataForm((current) => ({ ...current, confidentialityLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONFIDENTIALITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Departamento responsavel</Label>
                      <Input
                        value={metadataForm.responsibleDepartment}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, responsibleDepartment: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Vigencia inicial</Label>
                      <Input
                        type="date"
                        value={metadataForm.validityStartDate}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, validityStartDate: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Vigencia final</Label>
                      <Input
                        type="date"
                        value={metadataForm.validityEndDate}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, validityEndDate: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Revisao prevista</Label>
                      <Input
                        type="date"
                        value={metadataForm.reviewDueDate}
                        onChange={(event) =>
                          setMetadataForm((current) => ({ ...current, reviewDueDate: event.target.value }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                      <Checkbox
                        checked={metadataForm.controlledCopy}
                        onCheckedChange={(checked) =>
                          setMetadataForm((current) => ({ ...current, controlledCopy: checked === true }))
                        }
                      />
                      Copia controlada
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Versionamento formal</CardTitle>
                <CardDescription>Troque o arquivo atual para gerar uma nova revisao major automaticamente.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-2">
                <FolderGit2 className="h-3.5 w-3.5" />
                Rev. {document.current_version_number}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input type="file" onChange={(event) => setReplacementFile(event.target.files?.[0] || null)} />
                <Button onClick={() => replaceFileMutation.mutate()} disabled={replaceFileMutation.isPending || !replacementFile}>
                  {replaceFileMutation.isPending ? "Substituindo..." : "Substituir arquivo"}
                </Button>
              </div>
              <div className="space-y-3">
                {document.versions.map((version) => (
                  <div key={version.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Revisao {version.version_number}</p>
                        <p className="text-sm text-muted-foreground">{version.changes_summary || "Sem resumo informado."}</p>
                      </div>
                      {version.is_current && <Badge>Atual</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(version.created_at)} · por {version.created_by_user_id}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline documental</CardTitle>
              <CardDescription>Revisoes formais, alteracoes de metadado e eventos legados em uma linha do tempo unica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {document.timeline.map((entry) => (
                <div key={entry.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getTimelineBadge(entry.kind)}>{entry.kind}</Badge>
                        <p className="font-medium">{entry.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Campanhas de leitura
              </CardTitle>
              <CardDescription>Envie o documento para leitura obrigatoria e acompanhe confirmacoes por colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border p-4">
                <Input
                  value={campaignForm.title}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Titulo da campanha"
                />
                <Textarea
                  value={campaignForm.message}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Mensagem e orientacoes para leitura."
                />
                <Input
                  type="datetime-local"
                  value={campaignForm.dueAt}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, dueAt: event.target.value }))}
                />
                <CollaboratorMultiSelect
                  collaborators={collaborators}
                  selectedIds={selectedRecipientIds}
                  onChange={setSelectedRecipientIds}
                  placeholder="Selecionar destinatarios"
                />
                <Button
                  className="w-full gap-2"
                  onClick={() => campaignMutation.mutate()}
                  disabled={campaignMutation.isPending || !campaignForm.title.trim() || selectedRecipientIds.length === 0}
                >
                  <Send className="h-4 w-4" />
                  Enviar campanha
                </Button>
              </div>

              <div className="space-y-3">
                {document.read_campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{campaign.title}</p>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.message || "Sem mensagem complementar."}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {campaign.recipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
                          <div>
                            <p>{recipient.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {recipient.status} · prazo {formatDate(recipient.due_at)}
                            </p>
                          </div>
                          {recipient.status !== "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmRecipientMutation.mutate({ recipientId: recipient.id })}
                            >
                              Confirmar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4" />
                Solicitacoes internas
              </CardTitle>
              <CardDescription>Peça nova versao, complemento ou novo documento para um colaborador da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border p-4">
                <Input
                  value={requestForm.title}
                  onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Titulo da solicitacao"
                />
                <Textarea
                  value={requestForm.description}
                  onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Descreva o que precisa ser entregue."
                />
                <Select
                  value={requestForm.requestType}
                  onValueChange={(value) => setRequestForm((current) => ({ ...current, requestType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={requestForm.requestedFromUserId}
                  onValueChange={(value) => setRequestForm((current) => ({ ...current, requestedFromUserId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Responsavel pela entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators.map((collaborator) => (
                      <SelectItem key={collaborator.id} value={collaborator.id}>
                        {collaborator.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="datetime-local"
                    value={requestForm.dueAt}
                    onChange={(event) => setRequestForm((current) => ({ ...current, dueAt: event.target.value }))}
                  />
                  <Select
                    value={requestForm.priority}
                    onValueChange={(value) => setRequestForm((current) => ({ ...current, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => requestMutation.mutate()}
                  disabled={requestMutation.isPending || !requestForm.title.trim() || !requestForm.requestedFromUserId}
                >
                  <Milestone className="h-4 w-4" />
                  Criar solicitacao
                </Button>
              </div>

              <div className="space-y-3">
                {document.requests.map((request) => (
                  <div key={request.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">{request.description || "Sem descricao complementar."}</p>
                      </div>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Tipo: {request.request_type}</span>
                      <span>Responsavel: {request.requested_from_name}</span>
                      <span>Prazo: {formatDate(request.due_at)}</span>
                    </div>
                    {request.status !== "fulfilled" && (
                      <Button className="mt-3" size="sm" variant="outline" onClick={() => fulfillMutation.mutate(request.id)}>
                        Marcar como atendida
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Relacoes documentais
              </CardTitle>
              <CardDescription>Vincule documentos relacionados por referencia, complemento, substituicao ou dependencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border p-4">
                <Select
                  value={relationForm.relationType}
                  onValueChange={(value) => setRelationForm((current) => ({ ...current, relationType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={relationForm.targetDocumentId}
                  onValueChange={(value) => setRelationForm((current) => ({ ...current, targetDocumentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar documento relacionado" />
                  </SelectTrigger>
                  <SelectContent>
                    {sameDomainRelationOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title} · {option.document_domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={relationForm.notes}
                  onChange={(event) => setRelationForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Observacao sobre a relacao."
                />
                <Button
                  className="w-full gap-2"
                  onClick={() => relationMutation.mutate()}
                  disabled={relationMutation.isPending || !relationForm.targetDocumentId}
                >
                  <Sparkles className="h-4 w-4" />
                  Criar relacao
                </Button>
              </div>

              <div className="space-y-3">
                {document.relations_outgoing.map((relation) => (
                  <div key={relation.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{relation.target_document?.title || relation.target_document_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {relation.relation_type} · {relation.notes || "Sem observacoes."}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeRelationMutation.mutate(relation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {document.relations_incoming.length > 0 && (
                  <>
                    <Separator />
                    {document.relations_incoming.map((relation) => (
                      <div key={relation.id} className="rounded-lg border p-4">
                        <p className="font-medium">{relation.target_document?.title || relation.source_document_id}</p>
                        <p className="text-sm text-muted-foreground">Relaciona este documento como {relation.relation_type}.</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
