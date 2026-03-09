import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/services/branches";
import { downloadDocument } from "@/services/documents";
import { CollaboratorMultiSelect } from "@/components/document-center/CollaboratorMultiSelect";
import {
  createSgqDocument, createSgqDocumentVersion,
  getSgqDocuments, getSgqDocumentVersions, getSgqReadCampaigns,
  getSgqResponsibleUsers, getSgqSettings, getSystemDocumentsForReference,
  confirmSgqRead,
  SGQ_DOCUMENT_IDENTIFIER_OPTIONS,
  type DocumentStatus, type SgqDocumentItem,
} from "@/services/sgqIsoDocuments";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import {
  BookOpen, Check, Clock, Download, Eye, FileText, History,
  Link2, Pencil, Plus, Save, Search, Upload, Users,
} from "lucide-react";

// ── Helpers ──

const getStatusBadgeClass = (status: DocumentStatus) => {
  switch (status) {
    case "Vigente": return "bg-green-100 text-green-700 border-green-200";
    case "A Vencer": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Vencido": return "bg-red-100 text-red-700 border-red-200";
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

// ── Types ──

type CreateFormState = {
  title: string;
  document_identifier_type: string;
  document_identifier_other: string;
  branch_id: string;
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  expiration_date: string;
  notes: string;
  initial_attachment: File | null;
  recipient_user_ids: string[];
  referenced_document_ids: string[];
};

const DEFAULT_CREATE_FORM: CreateFormState = {
  title: "",
  document_identifier_type: SGQ_DOCUMENT_IDENTIFIER_OPTIONS[0],
  document_identifier_other: "",
  branch_id: "",
  elaborated_by_user_id: "",
  approved_by_user_id: "",
  expiration_date: "",
  notes: "",
  initial_attachment: null,
  recipient_user_ids: [],
  referenced_document_ids: [],
};

type NewVersionFormState = {
  changes_summary: string;
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  attachment: File | null;
  recipient_user_ids: string[];
};

const DEFAULT_VERSION_FORM: NewVersionFormState = {
  changes_summary: "",
  elaborated_by_user_id: "",
  approved_by_user_id: "",
  attachment: null,
  recipient_user_ids: [],
};

// ── Component ──

export const SGQIsoDocumentsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: branches = [] } = useBranches();

  const [filters, setFilters] = useState({ search: "", branch_id: "all", document_identifier_type: "all", status: "all" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(DEFAULT_CREATE_FORM);

  const [versionsDocId, setVersionsDocId] = useState<string | null>(null);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  const [newVersionDocId, setNewVersionDocId] = useState<string | null>(null);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [versionForm, setVersionForm] = useState<NewVersionFormState>(DEFAULT_VERSION_FORM);

  const [recipientsDocId, setRecipientsDocId] = useState<string | null>(null);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["sgq-documents", "responsibles"],
    queryFn: getSgqResponsibleUsers,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sgq-documents", filters],
    queryFn: () => getSgqDocuments({
      search: filters.search || undefined,
      branch_id: filters.branch_id === "all" ? undefined : filters.branch_id,
      document_identifier_type: filters.document_identifier_type === "all" ? undefined : filters.document_identifier_type,
      status: filters.status === "all" ? undefined : (filters.status as DocumentStatus),
    }),
  });

  const { data: systemDocs = [] } = useQuery({
    queryKey: ["sgq-documents", "system-docs"],
    queryFn: getSystemDocumentsForReference,
    enabled: isCreateOpen,
  });

  const { data: versions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ["sgq-documents", "versions", versionsDocId],
    queryFn: () => getSgqDocumentVersions(versionsDocId!),
    enabled: isVersionsOpen && !!versionsDocId,
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["sgq-documents", "campaigns", recipientsDocId],
    queryFn: () => getSgqReadCampaigns(recipientsDocId!),
    enabled: isRecipientsOpen && !!recipientsDocId,
  });

  const collaborators = useMemo(() => users.map((u) => ({ id: u.id, full_name: u.full_name })), [users]);

  const branchLabelById = useMemo(
    () => new Map(branches.map((b) => [b.id, getBranchDisplayLabel(b)])),
    [branches],
  );

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: async (form: CreateFormState) => {
      if (!form.initial_attachment) throw new Error("Anexo inicial é obrigatório");
      return createSgqDocument({
        title: form.title,
        document_identifier_type: form.document_identifier_type,
        document_identifier_other: form.document_identifier_other,
        branch_id: form.branch_id || undefined,
        elaborated_by_user_id: form.elaborated_by_user_id,
        approved_by_user_id: form.approved_by_user_id,
        expiration_date: form.expiration_date,
        notes: form.notes,
        initial_attachment: form.initial_attachment,
        recipient_user_ids: form.recipient_user_ids,
        referenced_document_ids: form.referenced_document_ids.length > 0 ? form.referenced_document_ids : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Documento SGQ criado com sucesso." });
      setIsCreateOpen(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: async ({ docId, form }: { docId: string; form: NewVersionFormState }) => {
      if (!form.attachment) throw new Error("Anexo é obrigatório");
      return createSgqDocumentVersion({
        sgq_document_id: docId,
        changes_summary: form.changes_summary,
        elaborated_by_user_id: form.elaborated_by_user_id,
        approved_by_user_id: form.approved_by_user_id,
        attachment: form.attachment,
        recipient_user_ids: form.recipient_user_ids.length > 0 ? form.recipient_user_ids : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Nova versão criada com sucesso." });
      setIsNewVersionOpen(false);
      setVersionForm(DEFAULT_VERSION_FORM);
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar versão", description: error.message, variant: "destructive" });
    },
  });

  const confirmReadMutation = useMutation({
    mutationFn: (recipientId: string) => confirmSgqRead(recipientId),
    onSuccess: () => {
      toast({ title: "Leitura confirmada" });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents", "campaigns", recipientsDocId] });
      queryClient.invalidateQueries({ queryKey: ["sgq-documents"] });
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

  const openVersions = (docId: string) => { setVersionsDocId(docId); setIsVersionsOpen(true); };
  const openNewVersion = (docId: string) => { setNewVersionDocId(docId); setVersionForm(DEFAULT_VERSION_FORM); setIsNewVersionOpen(true); };
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

              <div className="space-y-2">
                <Label>Filial</Label>
                <Select value={createForm.branch_id} onValueChange={(v) => setCreateForm((c) => ({ ...c, branch_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{getBranchDisplayLabel(b)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Elaborado por *</Label>
                <Select value={createForm.elaborated_by_user_id} onValueChange={(v) => setCreateForm((c) => ({ ...c, elaborated_by_user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aprovado por *</Label>
                <Select value={createForm.approved_by_user_id} onValueChange={(v) => setCreateForm((c) => ({ ...c, approved_by_user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Validade *</Label>
                <Input type="date" value={createForm.expiration_date} onChange={(e) => setCreateForm((c) => ({ ...c, expiration_date: e.target.value }))} />
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
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Recebimentos Pendentes</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={item.title}>{item.title || "-"}</TableCell>
                      <TableCell>
                        {item.document_identifier_type}
                        {item.document_identifier_type === "Outro" && item.document_identifier_other ? ` (${item.document_identifier_other})` : ""}
                      </TableCell>
                      <TableCell>{item.branch_id ? branchLabelById.get(item.branch_id) || item.branch_name || "-" : "-"}</TableCell>
                      <TableCell>{item.elaborated_by_name || "-"}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => openRecipients(item.id)} className="gap-1">
                          <Users className="h-4 w-4" />
                          {item.pending_recipients > 0 ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">{item.pending_recipients}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">OK</Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openNewVersion(item.id)} title="Nova versão">
                            <Upload className="h-4 w-4" />
                          </Button>
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

      {/* New Version Dialog */}
      <Dialog open={isNewVersionOpen} onOpenChange={setIsNewVersionOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Nova Versão</DialogTitle>
            <DialogDescription>Anexe o novo arquivo e descreva as alterações realizadas.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>O que mudou nesta versão? *</Label>
              <Textarea value={versionForm.changes_summary} onChange={(e) => setVersionForm((c) => ({ ...c, changes_summary: e.target.value }))} rows={3} placeholder="Descreva as alterações..." />
            </div>

            <div className="space-y-2">
              <Label>Elaborado por *</Label>
              <Select value={versionForm.elaborated_by_user_id} onValueChange={(v) => setVersionForm((c) => ({ ...c, elaborated_by_user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aprovado por *</Label>
              <Select value={versionForm.approved_by_user_id} onValueChange={(v) => setVersionForm((c) => ({ ...c, approved_by_user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Novo Anexo *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(e) => setVersionForm((c) => ({ ...c, attachment: e.target.files?.[0] || null }))} />
            </div>

            <div className="space-y-2">
              <Label>Destinatários da nova versão (opcional)</Label>
              <CollaboratorMultiSelect
                collaborators={collaborators}
                selectedIds={versionForm.recipient_user_ids}
                onChange={(ids) => setVersionForm((c) => ({ ...c, recipient_user_ids: ids }))}
                placeholder="Selecionar destinatários"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewVersionOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => newVersionDocId && newVersionMutation.mutate({ docId: newVersionDocId, form: versionForm })}
              disabled={newVersionMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {newVersionMutation.isPending ? "Salvando..." : "Criar Versão"}
            </Button>
          </DialogFooter>
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
                      {campaign.recipients.map((r) => (
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
                            {r.status === "pending" && (
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
    </div>
  );
};
