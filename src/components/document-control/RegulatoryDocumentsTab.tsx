import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/services/branches";
import { syncRegulatoryReviewAlerts } from "@/services/documentCompliance";
import { downloadDocument } from "@/services/documents";
import {
  createRegulatoryDocument,
  getRegulatoryDocumentVersions,
  getRegulatoryDocuments,
  getRegulatorySettings,
  getRenewalStatusLabel,
  getResponsibleUsers,
  REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS,
  updateRegulatoryDocument,
  updateRegulatorySettings,
  uploadRegulatoryDocumentAttachment,
  upsertRenewalData,
  type DocumentStatus,
  type RegulatoryDocumentItem,
  type RenewalStatus,
} from "@/services/regulatoryDocuments";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import {
  Calendar,
  Download,
  FileText,
  History,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Upload,
} from "lucide-react";

const RENEWAL_STATUS_OPTIONS: Array<{ value: RenewalStatus; label: string }> = [
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "protocolado", label: "Protocolado" },
  { value: "renovado", label: "Renovado" },
  { value: "indeferido", label: "Indeferido" },
];

type FormState = {
  id?: string;
  document_identifier_type: string;
  document_identifier_other: string;
  document_number: string;
  issuing_body: string;
  process_number: string;
  external_source_provider: string;
  external_source_reference: string;
  external_source_url: string;
  branch_id: string;
  responsible_user_id: string;
  issue_date: string;
  expiration_date: string;
  renewal_required: boolean;
  renewal_alert_days: string;
  notes: string;
  renewal_status: RenewalStatus;
  renewal_start_date: string;
  renewal_protocol_number: string;
  renewed_expiration_date: string;
  new_attachment: File | null;
};

const DEFAULT_FORM: FormState = {
  document_identifier_type: REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS[0],
  document_identifier_other: "",
  document_number: "",
  issuing_body: "",
  process_number: "",
  external_source_provider: "",
  external_source_reference: "",
  external_source_url: "",
  branch_id: "",
  responsible_user_id: "",
  issue_date: "",
  expiration_date: "",
  renewal_required: true,
  renewal_alert_days: "",
  notes: "",
  renewal_status: "nao_iniciado",
  renewal_start_date: "",
  renewal_protocol_number: "",
  renewed_expiration_date: "",
  new_attachment: null,
};

const getDocumentStatusBadgeClass = (status: DocumentStatus) => {
  switch (status) {
    case "Vigente":
      return "bg-green-100 text-green-700 border-green-200";
    case "A Vencer":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Vencido":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

export const RegulatoryDocumentsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: branches = [] } = useBranches();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAutoSyncedAlertsRef = useRef(false);

  const [filters, setFilters] = useState({
    search: "",
    branch_id: "all",
    document_identifier_type: "all",
    status: "all",
    renewal_status: "all",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [selectedVersionsLicenseId, setSelectedVersionsLicenseId] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const { data: settings } = useQuery({
    queryKey: ["regulatory-documents", "settings"],
    queryFn: getRegulatorySettings,
  });


  const { data: users = [] } = useQuery({
    queryKey: ["regulatory-documents", "responsibles"],
    queryFn: getResponsibleUsers,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["regulatory-documents", filters],
    queryFn: () =>
      getRegulatoryDocuments({
        search: filters.search || undefined,
        branch_id: filters.branch_id === "all" ? undefined : filters.branch_id,
        document_identifier_type:
          filters.document_identifier_type === "all" ? undefined : filters.document_identifier_type,
        status: filters.status === "all" ? undefined : (filters.status as DocumentStatus),
        renewal_status:
          filters.renewal_status === "all" ? undefined : (filters.renewal_status as RenewalStatus),
      }),
  });

  const { data: versions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ["regulatory-documents", "versions", selectedVersionsLicenseId],
    queryFn: () => getRegulatoryDocumentVersions(selectedVersionsLicenseId as string),
    enabled: isVersionsOpen && !!selectedVersionsLicenseId,
  });


  const persistMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const commonPayload = {
        document_identifier_type: payload.document_identifier_type,
        document_identifier_other: payload.document_identifier_type === "Outro" ? payload.document_identifier_other : "",
        document_number: payload.document_number,
        issuing_body: payload.issuing_body,
        process_number: payload.process_number,
        external_source_provider: payload.external_source_provider || null,
        external_source_reference: payload.external_source_reference || null,
        external_source_url: payload.external_source_url || null,
        branch_id: payload.branch_id,
        responsible_user_id: payload.responsible_user_id,
        issue_date: payload.issue_date || undefined,
        expiration_date: payload.expiration_date,
        renewal_required: payload.renewal_required,
        renewal_alert_days: payload.renewal_alert_days ? Number(payload.renewal_alert_days) : null,
        notes: payload.notes,
      };

      let id = payload.id;

      if (id) {
        await updateRegulatoryDocument(id, commonPayload);
      } else {
        const created = await createRegulatoryDocument({
          ...commonPayload,
          initial_attachment: payload.new_attachment,
        });
        id = created.id;
      }

      await upsertRenewalData(id as string, {
        status: payload.renewal_status,
        scheduled_start_date: payload.renewal_start_date || null,
        protocol_number: payload.renewal_protocol_number || null,
        renewed_expiration_date: payload.renewed_expiration_date || null,
      });

      if (payload.id && payload.new_attachment) {
        await uploadRegulatoryDocumentAttachment(payload.id, payload.new_attachment);
      }

      return id;
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Documento regulatório salvo com sucesso." });
      setIsFormOpen(false);
      setForm(DEFAULT_FORM);
      queryClient.invalidateQueries({ queryKey: ["regulatory-documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ licenseId, file }: { licenseId: string; file: File }) => {
      await uploadRegulatoryDocumentAttachment(licenseId, file);
    },
    onSuccess: () => {
      toast({ title: "Versão anexada", description: "Novo anexo enviado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["regulatory-documents"] });
      if (selectedVersionsLicenseId) {
        queryClient.invalidateQueries({
          queryKey: ["regulatory-documents", "versions", selectedVersionsLicenseId],
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const syncRegulatoryAlertsMutation = useMutation({
    mutationFn: syncRegulatoryReviewAlerts,
    onSuccess: (result) => {
      toast({
        title: "Alertas processados",
        description: `${result.alertsCreated} alerta(s) criado(s) em ${result.scanned} documento(s) analisado(s).`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const syncRegulatoryAlerts = syncRegulatoryAlertsMutation.mutate;

  useEffect(() => {
    if (!items.length || hasAutoSyncedAlertsRef.current) return;
    hasAutoSyncedAlertsRef.current = true;
    syncRegulatoryAlerts();
  }, [items.length, syncRegulatoryAlerts]);

  const branchLabelById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, getBranchDisplayLabel(branch)])),
    [branches],
  );

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (item: RegulatoryDocumentItem) => {
    setForm({
      id: item.id,
      document_identifier_type: item.document_identifier_type || REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS[0],
      document_identifier_other: item.document_identifier_other || "",
      document_number: item.document_number || "",
      issuing_body: item.issuing_body || "",
      process_number: item.process_number || "",
      external_source_provider: item.external_source_provider || "",
      external_source_reference: item.external_source_reference || "",
      external_source_url: item.external_source_url || "",
      branch_id: item.branch_id || "",
      responsible_user_id: item.responsible_user_id || "",
      issue_date: item.issue_date || "",
      expiration_date: item.expiration_date || "",
      renewal_required: item.renewal_required,
      renewal_alert_days: item.renewal_alert_days ? String(item.renewal_alert_days) : "",
      notes: item.notes || "",
      renewal_status: item.renewal_status,
      renewal_start_date: item.renewal_start_date || "",
      renewal_protocol_number: item.renewal_protocol_number || "",
      renewed_expiration_date: item.renewed_expiration_date || "",
      new_attachment: null,
    });
    setIsFormOpen(true);
  };

  const openVersions = (licenseId: string) => {
    setSelectedVersionsLicenseId(licenseId);
    setIsVersionsOpen(true);
  };

  const onFileUploadClick = (licenseId: string) => {
    setUploadTargetId(licenseId);
    fileInputRef.current?.click();
  };

  const handleDownloadVersion = async (documentId: string) => {
    try {
      const { url, fileName } = await downloadDocument(documentId);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao baixar versão",
        description: error?.message || "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Documentos Regulatórios</h2>
          <p className="text-muted-foreground">
            Controle de licenças, AVCB, alvarás e documentos regulatórios por filial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncRegulatoryAlertsMutation.mutate()}
            disabled={syncRegulatoryAlertsMutation.isPending}
          >
            {syncRegulatoryAlertsMutation.isPending ? "Processando alertas..." : "Processar alertas"}
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Documento Regulatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.id ? "Editar Documento Regulatório" : "Novo Documento Regulatório"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados legais, validade, renovação e anexos do documento.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div className="space-y-2">
                  <Label>Identificação do Documento</Label>
                  <Select
                    value={form.document_identifier_type}
                    onValueChange={(value) => setForm((current) => ({ ...current, document_identifier_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.document_identifier_type === "Outro" && (
                  <div className="space-y-2">
                    <Label>Outro tipo</Label>
                    <Input
                      value={form.document_identifier_other}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, document_identifier_other: e.target.value }))
                      }
                      placeholder="Ex.: Certificado Bombeiro"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Número do Documento</Label>
                  <Input
                    value={form.document_number}
                    onChange={(e) => setForm((current) => ({ ...current, document_number: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Órgão Emissor</Label>
                  <Input
                    value={form.issuing_body}
                    onChange={(e) => setForm((current) => ({ ...current, issuing_body: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nº do Processo</Label>
                  <Input
                    value={form.process_number}
                    onChange={(e) => setForm((current) => ({ ...current, process_number: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fonte Externa (SOGI/equivalente)</Label>
                  <Input
                    value={form.external_source_provider}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, external_source_provider: e.target.value }))
                    }
                    placeholder="Ex.: SOGI, sistema interno, consultoria externa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Referência Externa</Label>
                  <Input
                    value={form.external_source_reference}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, external_source_reference: e.target.value }))
                    }
                    placeholder="ID/código de referência externo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL Externa</Label>
                  <Input
                    value={form.external_source_url}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, external_source_url: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Filial</Label>
                  <Select
                    value={form.branch_id}
                    onValueChange={(value) => setForm((current) => ({ ...current, branch_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {getBranchDisplayLabel(branch)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável pelo Documento</Label>
                  <Select
                    value={form.responsible_user_id}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, responsible_user_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm((current) => ({ ...current, issue_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Validade</Label>
                  <Input
                    type="date"
                    value={form.expiration_date}
                    onChange={(e) => setForm((current) => ({ ...current, expiration_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Renovação</Label>
                  <Select
                    value={form.renewal_required ? "sim" : "nao"}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, renewal_required: value === "sim" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prazo de alerta (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.renewal_alert_days}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, renewal_alert_days: e.target.value }))
                    }
                    placeholder={`Padrão global: ${settings?.default_expiring_days ?? 30}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status da Renovação</Label>
                  <Select
                    value={form.renewal_status}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, renewal_status: value as RenewalStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENEWAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Início da Renovação</Label>
                  <Input
                    type="date"
                    value={form.renewal_start_date}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, renewal_start_date: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nº do Protocolo de Renovação</Label>
                  <Input
                    value={form.renewal_protocol_number}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, renewal_protocol_number: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nova data de validade (após renovação)</Label>
                  <Input
                    type="date"
                    value={form.renewed_expiration_date}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, renewed_expiration_date: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Documento (anexo)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={(e) =>
                      setForm((current) => ({ ...current, new_attachment: e.target.files?.[0] || null }))
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                    placeholder="Informações adicionais"
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => persistMutation.mutate(form)}
                  disabled={persistMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {persistMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por número, órgão, processo..."
              value={filters.search}
              onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))}
            />
          </div>

          <Select
            value={filters.branch_id}
            onValueChange={(value) => setFilters((current) => ({ ...current, branch_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {getBranchDisplayLabel(branch)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.document_identifier_type}
            onValueChange={(value) =>
              setFilters((current) => ({ ...current, document_identifier_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Identificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status do Documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
              <SelectItem value="A Vencer">A Vencer</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.renewal_status}
            onValueChange={(value) => setFilters((current) => ({ ...current, renewal_status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status da Renovação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RENEWAL_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros Regulatórios</CardTitle>
          <CardDescription>Controle de validade, renovação, versões e anexos.</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && uploadTargetId) {
                uploadVersionMutation.mutate({ licenseId: uploadTargetId, file });
              }
              e.currentTarget.value = "";
              setUploadTargetId(null);
            }}
          />

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Nenhum documento regulatório encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Nº Documento</TableHead>
                    <TableHead>Órgão Emissor</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status Documento</TableHead>
                    <TableHead>Status Renovação</TableHead>
                    <TableHead>Fonte Externa</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Versões</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.document_identifier_type}
                        {item.document_identifier_type === "Outro" && item.document_identifier_other
                          ? ` (${item.document_identifier_other})`
                          : ""}
                      </TableCell>
                      <TableCell>{item.document_number || "-"}</TableCell>
                      <TableCell>{item.issuing_body || "-"}</TableCell>
                      <TableCell>{item.process_number || "-"}</TableCell>
                      <TableCell>
                        {item.branch_id ? branchLabelById.get(item.branch_id) || item.branch_name || "-" : "-"}
                      </TableCell>
                      <TableCell>{item.responsible_name || "-"}</TableCell>
                      <TableCell>{formatDate(item.issue_date)}</TableCell>
                      <TableCell>{formatDate(item.expiration_date)}</TableCell>
                      <TableCell>{item.days_remaining}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDocumentStatusBadgeClass(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{getRenewalStatusLabel(item.renewal_status)}</TableCell>
                      <TableCell>{item.external_source_provider || "-"}</TableCell>
                      <TableCell>{item.renewal_protocol_number || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openVersions(item.id)} className="gap-1">
                          <History className="h-4 w-4" />
                          {item.versions_count}
                        </Button>
                      </TableCell>
                      <TableCell>{formatDateTime(item.latest_update)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFileUploadClick(item.id)}
                            title="Anexar nova versão"
                            disabled={uploadVersionMutation.isPending}
                          >
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

      <Dialog open={isVersionsOpen} onOpenChange={setIsVersionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de versões por anexo
            </DialogTitle>
            <DialogDescription>
              Cada novo upload gera uma nova versão lógica deste documento regulatório.
            </DialogDescription>
          </DialogHeader>

          {isLoadingVersions ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma versão encontrada.</div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{version.version_label} • {version.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 inline mr-1" />
                        {new Date(version.upload_date).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {version.is_current && <Badge className="bg-primary">Atual</Badge>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleDownloadVersion(version.id)}
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
