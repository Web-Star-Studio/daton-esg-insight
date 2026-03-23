import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/services/branches";
import { downloadDocument } from "@/services/documents";
import { CollaboratorMultiSelect } from "@/components/document-center/CollaboratorMultiSelect";
import { getDepartments } from "@/services/organizationalStructure";
import {
  createSgqDocument, approveInitialDocument, approveCriticalReview, deleteSgqDocument, updateSgqDocument,
  getSgqDocuments, getSgqDocumentVersions, getSgqReadCampaigns,
  getSgqResponsibleUsers, getSgqElaboratedByUsers, getSystemDocumentsForReference,
  confirmSgqRead, getCurrentUserId,
  createReviewRequest, getPendingReviewRequests,
  approveReviewRequest, rejectReviewRequest,
  getSgqSubDocuments, uploadSgqSubDocument, deleteSgqSubDocument,
  SGQ_DOCUMENT_IDENTIFIER_OPTIONS,
  type DocumentStatus, type SgqDocumentItem,
} from "@/services/sgqIsoDocuments";
import { authService } from "@/services/auth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import { cn } from "@/lib/utils";
import {
  BookOpen, Check, CheckCircle, ChevronDown, Clock, Download, Eye, FileText, History,
  Link2, Paperclip, Pencil, Plus, Save, Search, Send, Trash2, Upload, Users, XCircle, ClipboardCheck, Edit,
} from "lucide-react";

// ── Helpers ──

const getStatusBadgeClass = (status: DocumentStatus) => {
  switch (status) {
    case "Vigente": return "bg-green-100 text-green-700 border-green-200";
    case "A Vencer": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Vencido": return "bg-red-100 text-red-700 border-red-200";
    case "Em Aprovação": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(`${value.split("T")[0]}T00:00:00`).toLocaleDateString("pt-BR");
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const recipientStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "Pendente";
    case "viewed": return "Visualizado";
    case "confirmed": return "Confirmado";
    default: return status;
  }
};

const recipientStatusBadge = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "viewed": return "bg-blue-100 text-blue-700 border-blue-200";
    case "confirmed": return "bg-green-100 text-green-700 border-green-200";
    default: return "";
  }
};

const reviewStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "Pendente";
    case "approved": return "Aprovada";
    case "rejected": return "Rejeitada";
    default: return status;
  }
};

const reviewStatusBadge = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "approved": return "bg-green-100 text-green-700 border-green-200";
    case "rejected": return "bg-red-100 text-red-700 border-red-200";
    default: return "";
  }
};

const ISO_OPTIONS = [
  "ISO 9001:2015",
  "ISO 14001:2015",
  "ISO 45001:2018",
  "ISO 27001:2022",
  "ISO 39001:2012",
  "ISO 50001:2018",
];

// ── Types ──

type CreateFormState = {
  title: string;
  document_identifier_type: string;
  document_identifier_other: string;
  branch_ids: string[];
  elaborated_by_user_id: string;
  critical_reviewer_user_id: string;
  approved_by_user_id: string;
  expiration_date: string;
  norm_references: string[];
  notes: string;
  responsible_department: string;
  initial_attachment: File | null;
  recipient_user_ids: string[];
  referenced_document_ids: string[];
};

const DEFAULT_CREATE_FORM: CreateFormState = {
  title: "",
  document_identifier_type: SGQ_DOCUMENT_IDENTIFIER_OPTIONS[0],
  document_identifier_other: "",
  branch_ids: [],
  elaborated_by_user_id: "",
  critical_reviewer_user_id: "",
  approved_by_user_id: "",
  expiration_date: "",
  norm_references: [],
  notes: "",
  responsible_department: "",
  initial_attachment: null,
  recipient_user_ids: [],
  referenced_document_ids: [],
};

type ReviewFormState = {
  changes_summary: string;
  reviewer_user_id: string;
  attachment: File | null;
};

const DEFAULT_REVIEW_FORM: ReviewFormState = {
  changes_summary: "",
  reviewer_user_id: "",
  attachment: null,
};

// ── Component ──

export const SGQIsoDocumentsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightDocId = searchParams.get("docId");
  const highlightRowRef = useRef<HTMLTableRowElement>(null);
  const { data: rawBranches = [] } = useBranches();
  const branches = Array.isArray(rawBranches) ? rawBranches : [];
  const { data: departments = [] } = useQuery({
    queryKey: ["sgq-documents", "departments"],
    queryFn: getDepartments,
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<CreateFormState>(DEFAULT_CREATE_FORM);
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false);
  const [editDepartmentSearch, setEditDepartmentSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", branch_id: "all", document_identifier_type: "all", status: "all" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [createForm, setCreateForm] = useState<CreateFormState>(DEFAULT_CREATE_FORM);

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
    authService.getCurrentUser().then((u) => setCurrentUserRole(u?.role ?? null));
  }, []);

  useEffect(() => {
    if (highlightDocId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightDocId, highlightRowRef.current]);

  useEffect(() => {
    if (!isDepartmentOpen) {
      setDepartmentSearch("");
    }
  }, [isDepartmentOpen]);

  const [versionsDocId, setVersionsDocId] = useState<string | null>(null);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  // Review request (replaces new version)
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(DEFAULT_REVIEW_FORM);

  // Pending reviews dialog
  const [reviewsDocId, setReviewsDocId] = useState<string | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [recipientsDocId, setRecipientsDocId] = useState<string | null>(null);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);

  const [subDocsDocId, setSubDocsDocId] = useState<string | null>(null);
  const [subDocsDocTitle, setSubDocsDocTitle] = useState<string>("");
  const [subDocsCreatorId, setSubDocsCreatorId] = useState<string | null>(null);
  const [isSubDocsOpen, setIsSubDocsOpen] = useState(false);
  const [subDocFiles, setSubDocFiles] = useState<File[]>([]);

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["sgq-documents", "responsibles"],
    queryFn: getSgqResponsibleUsers,
  });
  const users = Array.isArray(rawUsers) ? rawUsers : [];

  const { data: rawElaboratedByUsers = [] } = useQuery({
    queryKey: ["sgq-documents", "elaborated-by-users"],
    queryFn: getSgqElaboratedByUsers,
  });
  const elaboratedByUsers = Array.isArray(rawElaboratedByUsers) ? rawElaboratedByUsers : [];

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["sgq-documents", filters],
    queryFn: () => getSgqDocuments({
      search: filters.search || undefined,
      branch_id: filters.branch_id === "all" ? undefined : filters.branch_id,
      document_identifier_type: filters.document_identifier_type === "all" ? undefined : filters.document_identifier_type,
      status: filters.status === "all" ? undefined : (filters.status as DocumentStatus),
    }),
  });
  const items = Array.isArray(rawItems) ? rawItems : [];

  const { data: rawSystemDocs = [] } = useQuery({
    queryKey: ["sgq-documents", "system-docs"],
    queryFn: getSystemDocumentsForReference,
    enabled: isCreateOpen,
  });
  const systemDocs = Array.isArray(rawSystemDocs) ? rawSystemDocs : [];

  const { data: rawVersions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ["sgq-documents", "versions", versionsDocId],
    queryFn: () => getSgqDocumentVersions(versionsDocId!),
    enabled: isVersionsOpen && !!versionsDocId,
  });
  const versions = Array.isArray(rawVersions) ? rawVersions : [];

  const { data: rawCampaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["sgq-documents", "campaigns", recipientsDocId],
    queryFn: () => getSgqReadCampaigns(recipientsDocId!),
    enabled: isRecipientsOpen && !!recipientsDocId,
  });
  const campaigns = Array.isArray(rawCampaigns) ? rawCampaigns : [];

  const { data: rawPendingReviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["sgq-documents", "reviews", reviewsDocId],
    queryFn: () => getPendingReviewRequests(reviewsDocId || undefined),
    enabled: isReviewsOpen,
  });
  const pendingReviews = Array.isArray(rawPendingReviews) ? rawPendingReviews : [];

  const { data: rawSubDocs = [], isLoading: isLoadingSubDocs } = useQuery({
    queryKey: ["sgq-documents", "subdocs", subDocsDocId],
    queryFn: () => getSgqSubDocuments(subDocsDocId!),
    enabled: isSubDocsOpen && !!subDocsDocId,
  });
  const subDocs = Array.isArray(rawSubDocs) ? rawSubDocs : [];

  const { data: subDocsVersions = [] } = useQuery({
    queryKey: ["sgq-documents", "versions-for-attachments", subDocsDocId],
    queryFn: () => getSgqDocumentVersions(subDocsDocId!),
    enabled: isSubDocsOpen && !!subDocsDocId,
  });
  // sorted DESC: [0] = latest, [last] = v1 (original)
  const latestVersion = subDocsVersions[0] ?? null;
  const originalVersion = subDocsVersions.length > 1 ? subDocsVersions[subDocsVersions.length - 1] : null;

  const deleteSubDocMutation = useMutation({
    mutationFn: (id: string) => deleteSgqSubDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sgq-documents", "subdocs", subDocsDocId] });
      toast({ title: "Sub-documento removido." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const uploadSubDocMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        await uploadSgqSubDocument(subDocsDocId!, file);
      }
      return files.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["sgq-documents", "subdocs", subDocsDocId] });
      setSubDocFiles([]);
      toast({ title: `${count > 1 ? `${count} sub-documentos adicionados` : "Sub-documento adicionado"} com sucesso.` });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const collaborators = useMemo(() => users.map((u) => ({ id: u.id, full_name: u.full_name })), [users]);
  const departmentOptions = useMemo(
    () => departments.map((department) => department.name).filter(Boolean),
    [departments],
  );
  const filteredDepartmentOptions = useMemo(() => {
    const normalizedSearch = departmentSearch.trim().toLowerCase();
    if (!normalizedSearch) return departmentOptions;
    return departmentOptions.filter((option) => option.toLowerCase().includes(normalizedSearch));
  }, [departmentOptions, departmentSearch]);
  const filteredEditDepartmentOptions = useMemo(() => {
    const s = editDepartmentSearch.trim().toLowerCase();
    if (!s) return departmentOptions;
    return departmentOptions.filter((o) => o.toLowerCase().includes(s));
  }, [departmentOptions, editDepartmentSearch]);
  const allBranchIds = useMemo(() => branches.map((branch) => branch.id), [branches]);
  const isAdminUser = ["admin", "super_admin", "platform_admin"].includes(currentUserRole ?? "");
  const allBranchesSelected = allBranchIds.length > 0 && createForm.branch_ids.length === allBranchIds.length;
  const someBranchesSelected = createForm.branch_ids.length > 0 && !allBranchesSelected;

  const branchLabelById = useMemo(
    () => new Map(branches.map((b) => [b.id, getBranchDisplayLabel(b)])),
    [branches],
  );

  const toggleBranch = (branchId: string) => {
    setCreateForm((current) => ({
      ...current,
      branch_ids: current.branch_ids.includes(branchId)
        ? current.branch_ids.filter((id) => id !== branchId)
        : [...current.branch_ids, branchId],
    }));
  };

  const toggleAllBranches = () => {
    setCreateForm((current) => ({
      ...current,
      branch_ids: current.branch_ids.length === allBranchIds.length ? [] : allBranchIds,
    }));
  };

  const toggleNormReference = (normReference: string) => {
    setCreateForm((current) => ({
      ...current,
      norm_references: current.norm_references.includes(normReference)
        ? current.norm_references.filter((item) => item !== normReference)
        : [...current.norm_references, normReference],
    }));
  };

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: async (form: CreateFormState) => {
      if (!form.initial_attachment) throw new Error("Anexo inicial é obrigatório");
      return createSgqDocument({
        title: form.title,
        document_identifier_type: form.document_identifier_type,
        document_identifier_other: form.document_identifier_other,
        branch_ids: form.branch_ids,
        elaborated_by_user_id: form.elaborated_by_user_id,
        critical_reviewer_user_id: form.critical_reviewer_user_id || undefined,
        approved_by_user_id: form.approved_by_user_id,
        expiration_date: form.expiration_date,
        norm_reference: form.norm_references.length > 0 ? form.norm_references.join(", ") : null,
        notes: form.notes,
        responsible_department: form.responsible_department || null,
        initial_attachment: form.initial_attachment,
        recipient_user_ids: form.recipient_user_ids,
        referenced_document_ids: form.referenced_document_ids.length > 0 ? form.referenced_document_ids : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Documento SGQ criado com sucesso." });
      setIsCreateOpen(false);
      setDepartmentSearch("");
      setCreateForm(DEFAULT_CREATE_FORM);
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    },
  });

  const sendReviewMutation = useMutation({
    mutationFn: async ({ docId, form }: { docId: string; form: ReviewFormState }) => {
      if (!form.attachment) throw new Error("Anexo é obrigatório");
      if (!form.changes_summary.trim()) throw new Error("Descreva as alterações");
      if (!form.reviewer_user_id) throw new Error("Selecione o revisor/aprovador");
      return createReviewRequest({
        sgq_document_id: docId,
        reviewer_user_id: form.reviewer_user_id,
        changes_summary: form.changes_summary,
        attachment: form.attachment,
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Documento enviado para revisão." });
      setIsReviewOpen(false);
      setReviewForm(DEFAULT_REVIEW_FORM);
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
      approveReviewRequest(requestId, notes),
    onSuccess: () => {
      toast({ title: "Revisão aprovada", description: "Nova versão criada automaticamente." });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      clearHighlight();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    },
  });

  const approveCriticalMutation = useMutation({
    mutationFn: (docId: string) => approveCriticalReview(docId),
    onSuccess: () => {
      toast({ title: "Análise crítica aprovada", description: "O aprovador foi notificado para prosseguir." });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      clearHighlight();
    },
    onError: (error: Error) => {
      toast({ title: "Erro na análise crítica", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes: string }) =>
      rejectReviewRequest(requestId, notes),
    onSuccess: () => {
      toast({ title: "Revisão rejeitada" });
      setRejectingId(null);
      setRejectNotes("");
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    },
  });

  const clearHighlight = () => {
    setSearchParams((prev) => { prev.delete("docId"); return prev; }, { replace: true });
  };

  const approveInitialMutation = useMutation({
    mutationFn: (docId: string) => approveInitialDocument(docId),
    onSuccess: () => {
      toast({ title: "Documento aprovado", description: "O documento foi aprovado e os destinatários foram notificados." });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      clearHighlight();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteSgqDocument(docId),
    onSuccess: () => {
      toast({ title: "Documento excluído com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      setDeleteTargetId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      setDeleteTargetId(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: CreateFormState }) =>
      updateSgqDocument(id, {
        title: form.title,
        document_identifier_type: form.document_identifier_type,
        document_identifier_other: form.document_identifier_other,
        branch_ids: form.branch_ids,
        elaborated_by_user_id: form.elaborated_by_user_id,
        critical_reviewer_user_id: form.critical_reviewer_user_id || undefined,
        approved_by_user_id: form.approved_by_user_id,
        expiration_date: form.expiration_date,
        norm_reference: form.norm_references.length > 0 ? form.norm_references.join(", ") : null,
        notes: form.notes,
        responsible_department: form.responsible_department || null,
      }),
    onSuccess: () => {
      toast({ title: "Documento atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      setIsEditOpen(false);
      setEditTargetId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const confirmReadMutation = useMutation({
    mutationFn: (recipientId: string) => confirmSgqRead(recipientId),
    onSuccess: () => {
      toast({ title: "Leitura confirmada" });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents", "campaigns", recipientsDocId] });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
      clearHighlight();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleDownload = async (documentId: string) => {
    try {
      const { url, fileName } = await downloadDocument(documentId);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Erro ao baixar", description: error?.message, variant: "destructive" });
    }
  };

  const openEdit = (item: SgqDocumentItem) => {
    setEditTargetId(item.id);
    setEditForm({
      title: item.title,
      document_identifier_type: item.document_identifier_type || SGQ_DOCUMENT_IDENTIFIER_OPTIONS[0],
      document_identifier_other: item.document_identifier_other || "",
      branch_ids: item.branch_ids ?? [],
      elaborated_by_user_id: item.elaborated_by_user_id || "",
      critical_reviewer_user_id: item.critical_reviewer_user_id || "",
      approved_by_user_id: item.approved_by_user_id || "",
      expiration_date: item.expiration_date,
      norm_references: item.norm_reference ? item.norm_reference.split(", ").filter(Boolean) : [],
      notes: item.notes || "",
      responsible_department: item.responsible_department || "",
      initial_attachment: null,
      recipient_user_ids: [],
      referenced_document_ids: [],
    });
    setIsEditOpen(true);
  };

  const openVersions = (docId: string) => { setVersionsDocId(docId); setIsVersionsOpen(true); };
  const openSendReview = (docId: string) => { setReviewDocId(docId); setReviewForm(DEFAULT_REVIEW_FORM); setIsReviewOpen(true); };
  const openReviews = (docId: string) => { setReviewsDocId(docId); setIsReviewsOpen(true); };
  const openRecipients = (docId: string) => { setRecipientsDocId(docId); setIsRecipientsOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Documentos SGQ/ISO</h2>
          <p className="text-muted-foreground">
            Controle de versões, revisões, aprovações e protocolo de recebimento.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setReviewsDocId(null); setIsReviewsOpen(true); }} className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> Revisões Pendentes
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setCreateForm(DEFAULT_CREATE_FORM); setIsCreateOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Documento SGQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Documento SGQ</DialogTitle>
                <DialogDescription>Preencha os dados do documento, anexe o arquivo inicial e selecione os destinatários.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div className="md:col-span-2 space-y-2">
                  <Label>Título do Documento *</Label>
                  <Input value={createForm.title} onChange={(e) => setCreateForm((c) => ({ ...c, title: e.target.value }))} placeholder="Ex.: Manual da Qualidade" />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={createForm.document_identifier_type} onValueChange={(v) => setCreateForm((c) => ({ ...c, document_identifier_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SGQ_DOCUMENT_IDENTIFIER_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {createForm.document_identifier_type === "Outro" && (
                  <div className="space-y-2">
                    <Label>Outro tipo</Label>
                    <Input value={createForm.document_identifier_other} onChange={(e) => setCreateForm((c) => ({ ...c, document_identifier_other: e.target.value }))} />
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <Label>Filiais vinculadas</Label>
                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3">
                    {branches.length > 0 && (
                      <label className="flex items-center gap-3 border-b pb-2 text-sm font-medium">
                        <Checkbox
                          checked={allBranchesSelected ? true : someBranchesSelected ? "indeterminate" : false}
                          onCheckedChange={toggleAllBranches}
                        />
                        <span>Selecionar todas</span>
                      </label>
                    )}
                    {branches.map((branch) => (
                      <label key={branch.id} className="flex items-center gap-3 text-sm">
                        <Checkbox
                          checked={createForm.branch_ids.includes(branch.id)}
                          onCheckedChange={() => toggleBranch(branch.id)}
                        />
                        <span>{getBranchDisplayLabel(branch)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Elaborado por *</Label>
                  <SearchableUserSelect
                    users={elaboratedByUsers}
                    value={createForm.elaborated_by_user_id}
                    onChange={(v) => setCreateForm((c) => ({ ...c, elaborated_by_user_id: v }))}
                    placeholder="Selecione"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Análise Crítica por <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <SearchableUserSelect
                    users={users}
                    value={createForm.critical_reviewer_user_id}
                    onChange={(v) => setCreateForm((c) => ({ ...c, critical_reviewer_user_id: v }))}
                    placeholder="Selecione (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Aprovado por *</Label>
                  <SearchableUserSelect
                    users={users}
                    value={createForm.approved_by_user_id}
                    onChange={(v) => setCreateForm((c) => ({ ...c, approved_by_user_id: v }))}
                    placeholder="Selecione"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Validade *</Label>
                  <Input type="date" value={createForm.expiration_date} onChange={(e) => setCreateForm((c) => ({ ...c, expiration_date: e.target.value }))} />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Normas aplicáveis</Label>
                  <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                    {ISO_OPTIONS.map((isoOption) => (
                      <label key={isoOption} className="flex items-center gap-3 text-sm">
                        <Checkbox
                          checked={createForm.norm_references.includes(isoOption)}
                          onCheckedChange={() => toggleNormReference(isoOption)}
                        />
                        <span>{isoOption}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecione uma ou mais normas ISO que se aplicam a este documento SGQ.
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Departamento responsável</Label>
                  <Popover open={isDepartmentOpen} onOpenChange={setIsDepartmentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        <span className={cn("truncate", !createForm.responsible_department && "text-muted-foreground")}>
                          {createForm.responsible_department || "Selecione o departamento responsável"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom">
                      <div className="border-b p-3">
                        <Input
                          placeholder="Buscar departamento..."
                          value={departmentSearch}
                          onChange={(event) => setDepartmentSearch(event.target.value)}
                        />
                      </div>
                      <div className="h-[240px] overflow-y-auto overscroll-contain p-1" onWheel={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setCreateForm((current) => ({ ...current, responsible_department: "" }));
                            setIsDepartmentOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !createForm.responsible_department ? "opacity-100" : "opacity-0",
                            )}
                          />
                          Nenhum
                        </button>
                        {filteredDepartmentOptions.length === 0 ? (
                          <p className="py-6 text-center text-sm">Nenhum departamento encontrado.</p>
                        ) : (
                          filteredDepartmentOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setCreateForm((current) => ({ ...current, responsible_department: option }));
                                setIsDepartmentOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  createForm.responsible_department === option ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {option}
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {departmentOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum departamento cadastrado foi encontrado. Cadastre departamentos para habilitar esta lista.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Anexo Inicial *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setCreateForm((c) => ({ ...c, initial_attachment: e.target.files?.[0] || null }))}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Destinatários (protocolo de recebimento) *</Label>
                  <CollaboratorMultiSelect
                    collaborators={collaborators}
                    selectedIds={createForm.recipient_user_ids}
                    onChange={(ids) => setCreateForm((c) => ({ ...c, recipient_user_ids: ids }))}
                    placeholder="Selecionar destinatários"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Referências a outros documentos</Label>
                  <CollaboratorMultiSelect
                    collaborators={systemDocs.map((d) => ({ id: d.id, full_name: d.file_name }))}
                    selectedIds={createForm.referenced_document_ids}
                    onChange={(ids) => setCreateForm((c) => ({ ...c, referenced_document_ids: ids }))}
                    placeholder="Selecionar documentos referenciados"
                    searchPlaceholder="Buscar documento..."
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={createForm.notes} onChange={(e) => setCreateForm((c) => ({ ...c, notes: e.target.value }))} rows={3} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={() => createMutation.mutate(createForm)} disabled={createMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por título, tipo, filial..." value={filters.search} onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))} />
          </div>

          <Select value={filters.branch_id} onValueChange={(v) => setFilters((c) => ({ ...c, branch_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Filial" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{getBranchDisplayLabel(b)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => setFilters((c) => ({ ...c, status: v }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
              <SelectItem value="A Vencer">A Vencer</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros SGQ/ISO</CardTitle>
          <CardDescription>Controle de versões, aprovações e protocolo de recebimento.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Nenhum documento SGQ/ISO encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Elaborador</TableHead>
                    <TableHead>Análise Crítica</TableHead>
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Revisões</TableHead>
                    <TableHead>Recebimentos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      ref={item.id === highlightDocId ? highlightRowRef : undefined}
                      className={item.id === highlightDocId ? "ring-2 ring-primary ring-inset bg-primary/5" : undefined}
                    >
                      <TableCell className="max-w-[200px]">
                        <span className="font-medium break-words whitespace-normal">{item.title || "-"}</span>
                      </TableCell>
                      <TableCell>
                        {item.document_identifier_type}
                        {item.document_identifier_type === "Outro" && item.document_identifier_other ? ` (${item.document_identifier_other})` : ""}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const ids = item.branch_ids ?? [];
                          if (ids.length === 0) return "-";
                          if (ids.length === 1) return (
                            <Badge variant="secondary">
                              {branchLabelById.get(ids[0]) || "-"}
                            </Badge>
                          );
                          return (
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary">
                                {branchLabelById.get(ids[0]) || "-"}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{ids.length - 1}
                              </Badge>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{item.elaborated_by_name || "-"}</TableCell>
                      <TableCell>
                        {item.critical_reviewer_user_id ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{item.critical_reviewer_name || "-"}</span>
                            {item.critical_review_status === "approved" && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs w-fit">Aprovado</Badge>
                            )}
                            {item.critical_review_status === "pending" && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs w-fit">Pendente</Badge>
                            )}
                            {item.critical_review_status === "rejected" && (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs w-fit">Rejeitado</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{item.approved_by_name || "-"}</TableCell>
                      <TableCell>{formatDate(item.expiration_date)}</TableCell>
                      <TableCell>{item.days_remaining}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openVersions(item.id)} className="gap-1">
                          <History className="h-4 w-4" /> v{item.current_version_number}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openReviews(item.id)} className="gap-1">
                          <ClipboardCheck className="h-4 w-4" />
                          {item.pending_reviews > 0 ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">{item.pending_reviews}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openRecipients(item.id)} className="gap-1">
                          <Users className="h-4 w-4" />
                          {!item.is_approved ? (
                            <span className="text-muted-foreground text-xs">-</span>
                          ) : item.pending_recipients > 0 ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">{item.pending_recipients}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">OK</Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!item.is_approved && item.critical_reviewer_user_id === currentUserId && item.critical_review_status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveCriticalMutation.mutate(item.id)}
                              disabled={approveCriticalMutation.isPending}
                              title="Aprovar análise crítica"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {!item.is_approved && item.approved_by_user_id === currentUserId &&
                           (!item.critical_reviewer_user_id || item.critical_review_status === "approved") ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveInitialMutation.mutate(item.id)}
                              disabled={approveInitialMutation.isPending}
                              title="Aprovar documento"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : item.is_approved ? (
                            <Button variant="ghost" size="icon" onClick={() => openSendReview(item.id)} title="Enviar para Revisão">
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Anexos"
                            onClick={() => { setSubDocsDocId(item.id); setSubDocsDocTitle(item.title || ""); setSubDocsCreatorId(item.created_by_user_id); setIsSubDocsOpen(true); }}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          {(item.created_by_user_id === currentUserId || isAdminUser) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar documento"
                              onClick={() => openEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {(item.created_by_user_id === currentUserId || isAdminUser) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir documento"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTargetId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions Dialog */}
      <Dialog open={isVersionsOpen} onOpenChange={setIsVersionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico de Versões</DialogTitle>
            <DialogDescription>Todas as revisões do documento com detalhes de elaboração e aprovação.</DialogDescription>
          </DialogHeader>

          {isLoadingVersions ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma versão encontrada.</div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.version_number === versions[0]?.version_number ? "default" : "outline"}>
                        v{v.version_number}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{formatDateTime(v.created_at)}</span>
                    </div>
                    {v.attachment_document_id && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(v.attachment_document_id!)}>
                        <Download className="h-4 w-4" /> {v.attachment_file_name || "Baixar"}
                      </Button>
                    )}
                  </div>
                  {v.changes_summary && (
                    <p className="text-sm"><span className="font-medium">O que mudou:</span> {v.changes_summary}</p>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span><Pencil className="h-3.5 w-3.5 inline mr-1" />Elaborado por: {v.elaborated_by_name || "-"}</span>
                    <span><Check className="h-3.5 w-3.5 inline mr-1" />Aprovado por: {v.approved_by_name || "-"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={isSubDocsOpen} onOpenChange={(o) => { setIsSubDocsOpen(o); if (!o) { setSubDocFiles([]); setSubDocsCreatorId(null); } }}>
        <DialogContent className="w-full max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Anexos</DialogTitle>
            <DialogDescription>{subDocsDocTitle}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5 min-h-0">
            {/* Anexo principal — v1 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anexo Principal</p>
              {latestVersion === null ? (
                <p className="text-sm text-muted-foreground">Nenhum anexo encontrado.</p>
              ) : (() => {
                const v = originalVersion ?? latestVersion;
                return (
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm min-w-0 overflow-hidden">
                    <span className="truncate min-w-0 flex-1 text-sm" title={v.attachment_file_name || undefined}>
                      {v.attachment_file_name || `Versão ${v.version_number}`}
                    </span>
                    {v.attachment_document_id && (
                      <Button variant="ghost" size="sm" className="gap-1 shrink-0 text-xs" onClick={() => handleDownload(v.attachment_document_id!)}>
                        <Download className="h-3.5 w-3.5" /> Baixar
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Última versão — só quando há revisões após v1 */}
            {originalVersion && latestVersion && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Última Versão (v{latestVersion.version_number})
                </p>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm min-w-0 overflow-hidden">
                  <span className="truncate min-w-0 flex-1 text-sm" title={latestVersion.attachment_file_name || undefined}>
                    {latestVersion.attachment_file_name || `Versão ${latestVersion.version_number}`}
                  </span>
                  {latestVersion.attachment_document_id && (
                    <Button variant="ghost" size="sm" className="gap-1 shrink-0 text-xs" onClick={() => handleDownload(latestVersion.attachment_document_id!)}>
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Sub-documentos */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub-documentos</p>
              {isLoadingSubDocs ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : subDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum sub-documento adicionado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {subDocs.map((sd) => (
                    <div key={sd.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm min-w-0 overflow-hidden">
                      <span className="truncate min-w-0 flex-1 text-sm">{sd.file_name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleDownload(sd.id)}>
                          <Download className="h-3.5 w-3.5" /> Baixar
                        </Button>
                        {subDocsCreatorId === currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            disabled={deleteSubDocMutation.isPending}
                            onClick={() => deleteSubDocMutation.mutate(sd.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {subDocsCreatorId === currentUserId && (
                <div className="border-t pt-3 space-y-3">
                  <Label className="text-sm font-medium">Adicionar sub-documentos</Label>
                  <label className="flex items-center gap-3 w-full cursor-pointer rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload className="h-4 w-4 shrink-0" />
                    <span className="truncate min-w-0 flex-1">
                      {subDocFiles.length > 0
                        ? `${subDocFiles.length} arquivo(s) selecionado(s)`
                        : "Clique para escolher arquivos"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={(e) => {
                        const picked = Array.from(e.target.files ?? []);
                        setSubDocFiles((prev) => {
                          const existingNames = new Set(prev.map((f) => f.name));
                          return [...prev, ...picked.filter((f) => !existingNames.has(f.name))];
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {subDocFiles.length > 0 && (
                    <div className="space-y-1">
                      {subDocFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/40 min-w-0 overflow-hidden">
                          <span className="truncate min-w-0 flex-1 text-sm">{f.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive shrink-0 text-xs"
                            onClick={() => setSubDocFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    className="w-full gap-2"
                    disabled={subDocFiles.length === 0 || uploadSubDocMutation.isPending}
                    onClick={() => uploadSubDocMutation.mutate(subDocFiles)}
                  >
                    <Upload className="h-4 w-4" />
                    {uploadSubDocMutation.isPending
                      ? "Enviando..."
                      : subDocFiles.length > 1
                        ? `Enviar ${subDocFiles.length} arquivos`
                        : "Enviar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send for Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Enviar para Revisão</DialogTitle>
            <DialogDescription>Anexe o novo arquivo e selecione quem deve revisar e aprovar as alterações. A nova versão será criada automaticamente após a aprovação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>O que mudou? *</Label>
              <Textarea value={reviewForm.changes_summary} onChange={(e) => setReviewForm((c) => ({ ...c, changes_summary: e.target.value }))} rows={3} placeholder="Descreva as alterações realizadas..." />
            </div>

            <div className="space-y-2">
              <Label>Revisor / Aprovador *</Label>
              <Select value={reviewForm.reviewer_user_id} onValueChange={(v) => setReviewForm((c) => ({ ...c, reviewer_user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione quem vai revisar" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Novo Anexo *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(e) => setReviewForm((c) => ({ ...c, attachment: e.target.files?.[0] || null }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => reviewDocId && sendReviewMutation.mutate({ docId: reviewDocId, form: reviewForm })}
              disabled={sendReviewMutation.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sendReviewMutation.isPending ? "Enviando..." : "Enviar para Revisão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Reviews Dialog */}
      <Dialog open={isReviewsOpen} onOpenChange={(open) => { setIsReviewsOpen(open); if (!open) { setRejectingId(null); setRejectNotes(""); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Solicitações de Revisão</DialogTitle>
            <DialogDescription>
              {reviewsDocId ? "Revisões deste documento." : "Todas as solicitações de revisão."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingReviews ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma solicitação de revisão encontrada.</div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((r) => (
                <div key={r.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.document_title || "Documento"}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado por {r.requested_by_name} em {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className={reviewStatusBadge(r.status)}>
                      {reviewStatusLabel(r.status)}
                    </Badge>
                  </div>

                  <p className="text-sm"><span className="font-medium">Alterações:</span> {r.changes_summary}</p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Revisor: {r.reviewer_name}</span>
                    {r.attachment_document_id && (
                      <Button variant="outline" size="sm" className="gap-1 ml-2" onClick={() => handleDownload(r.attachment_document_id!)}>
                        <Download className="h-3.5 w-3.5" /> {r.attachment_file_name || "Anexo"}
                      </Button>
                    )}
                  </div>

                  {r.status === "pending" && r.reviewer_user_id === currentUserId && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {rejectingId === r.id ? (
                        <div className="flex-1 space-y-2">
                          <Textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder="Motivo da rejeição..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectMutation.mutate({ requestId: r.id, notes: rejectNotes })}
                              disabled={!rejectNotes.trim() || rejectMutation.isPending}
                            >
                              Confirmar Rejeição
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setRejectingId(null); setRejectNotes(""); }}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => approveMutation.mutate({ requestId: r.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" /> Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setRejectingId(r.id)}
                          >
                            <XCircle className="h-4 w-4" /> Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {r.status !== "pending" && r.reviewer_notes && (
                    <p className="text-sm border-t pt-2">
                      <span className="font-medium">Notas do revisor:</span> {r.reviewer_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recipients / Read Campaigns Dialog */}
      <Dialog open={isRecipientsOpen} onOpenChange={setIsRecipientsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Protocolo de Recebimento</DialogTitle>
            <DialogDescription>Acompanhe quem recebeu e confirmou a leitura do documento.</DialogDescription>
          </DialogHeader>

          {isLoadingCampaigns ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma campanha de leitura encontrada.</div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(campaign.created_at)}</p>
                    </div>
                    {campaign.version_number && (
                      <Badge variant="outline">v{campaign.version_number}</Badge>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Confirmado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(campaign.recipients ?? []).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.user_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={recipientStatusBadge(r.status)}>
                              {recipientStatusLabel(r.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(r.sent_at)}</TableCell>
                          <TableCell>{r.confirmed_at ? formatDateTime(r.confirmed_at) : "-"}</TableCell>
                          <TableCell>
                            {r.status === "pending" && r.user_id === currentUserId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => confirmReadMutation.mutate(r.id)}
                                disabled={confirmReadMutation.isPending}
                              >
                                <Eye className="h-3.5 w-3.5" /> Confirmar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setEditTargetId(null); setEditDepartmentSearch(""); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Documento SGQ</DialogTitle>
            <DialogDescription>Atualize os dados do documento. O anexo é gerenciado via novas versões.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-2">
              <Label>Título do Documento *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((c) => ({ ...c, title: e.target.value }))} placeholder="Ex.: Manual da Qualidade" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editForm.document_identifier_type} onValueChange={(v) => setEditForm((c) => ({ ...c, document_identifier_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SGQ_DOCUMENT_IDENTIFIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.document_identifier_type === "Outro" && (
              <div className="space-y-2">
                <Label>Outro tipo</Label>
                <Input value={editForm.document_identifier_other} onChange={(e) => setEditForm((c) => ({ ...c, document_identifier_other: e.target.value }))} />
              </div>
            )}
            <div className="md:col-span-2 space-y-2">
              <Label>Filiais vinculadas</Label>
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3">
                {branches.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={editForm.branch_ids.includes(branch.id)}
                      onCheckedChange={() => setEditForm((c) => ({
                        ...c,
                        branch_ids: c.branch_ids.includes(branch.id)
                          ? c.branch_ids.filter((id) => id !== branch.id)
                          : [...c.branch_ids, branch.id],
                      }))}
                    />
                    <span>{getBranchDisplayLabel(branch)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Elaborado por *</Label>
              <SearchableUserSelect users={elaboratedByUsers} value={editForm.elaborated_by_user_id} onChange={(v) => setEditForm((c) => ({ ...c, elaborated_by_user_id: v }))} placeholder="Selecione" />
            </div>
            <div className="space-y-2">
              <Label>Análise Crítica por <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <SearchableUserSelect users={users} value={editForm.critical_reviewer_user_id} onChange={(v) => setEditForm((c) => ({ ...c, critical_reviewer_user_id: v }))} placeholder="Selecione (opcional)" />
            </div>
            <div className="space-y-2">
              <Label>Aprovado por *</Label>
              <SearchableUserSelect users={users} value={editForm.approved_by_user_id} onChange={(v) => setEditForm((c) => ({ ...c, approved_by_user_id: v }))} placeholder="Selecione" />
            </div>
            <div className="space-y-2">
              <Label>Data de Validade *</Label>
              <Input type="date" value={editForm.expiration_date} onChange={(e) => setEditForm((c) => ({ ...c, expiration_date: e.target.value }))} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Normas aplicáveis</Label>
              <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                {ISO_OPTIONS.map((isoOption) => (
                  <label key={isoOption} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={editForm.norm_references.includes(isoOption)}
                      onCheckedChange={() => setEditForm((c) => ({
                        ...c,
                        norm_references: c.norm_references.includes(isoOption)
                          ? c.norm_references.filter((n) => n !== isoOption)
                          : [...c.norm_references, isoOption],
                      }))}
                    />
                    <span>{isoOption}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Departamento responsável</Label>
              <Popover open={isEditDepartmentOpen} onOpenChange={setIsEditDepartmentOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    <span className={cn("truncate", !editForm.responsible_department && "text-muted-foreground")}>
                      {editForm.responsible_department || "Selecione o departamento responsável"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom">
                  <div className="border-b p-3">
                    <Input placeholder="Buscar departamento..." value={editDepartmentSearch} onChange={(e) => setEditDepartmentSearch(e.target.value)} />
                  </div>
                  <div className="h-[240px] overflow-y-auto overscroll-contain p-1" onWheel={(e) => e.stopPropagation()}>
                    <button type="button" className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { setEditForm((c) => ({ ...c, responsible_department: "" })); setIsEditDepartmentOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", !editForm.responsible_department ? "opacity-100" : "opacity-0")} />
                      Nenhum
                    </button>
                    {filteredEditDepartmentOptions.map((option) => (
                      <button key={option} type="button" className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { setEditForm((c) => ({ ...c, responsible_department: option })); setIsEditDepartmentOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", editForm.responsible_department === option ? "opacity-100" : "opacity-0")} />
                        {option}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Observações</Label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm((c) => ({ ...c, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => { if (editTargetId) editMutation.mutate({ id: editTargetId, form: editForm }); }}
              disabled={editMutation.isPending || !editForm.title || !editForm.elaborated_by_user_id || !editForm.approved_by_user_id || !editForm.expiration_date}
            >
              {editMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTargetId) deleteMutation.mutate(deleteTargetId); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
