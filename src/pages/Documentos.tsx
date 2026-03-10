import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Building2,
  CalendarRange,
  Eye,
  FilePlus2,
  FileText,
  FolderGit2,
  GitPullRequest,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useBranches } from "@/services/branches";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import {
  createDocumentRecord,
  listDocumentRecords,
  type DocumentListFilters,
  type DocumentRecord,
} from "@/services/documentCenter";
import { formatFileSize } from "@/services/documents";

const DOCUMENT_KIND_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "general", label: "Gerais" },
  { value: "controlled", label: "Controlados" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "in_review", label: "Em revisao" },
  { value: "rejected", label: "Rejeitado" },
  { value: "archived", label: "Arquivado" },
];

const DOMAIN_LABELS: Record<string, string> = {
  quality: "Qualidade",
  regulatory: "Regulatorio",
  waste: "Residuos",
  training: "Treinamentos",
  people: "Pessoas",
  document: "Documental",
  general: "Geral",
};

const CONFIDENTIALITY_OPTIONS = [
  { value: "public", label: "Publico" },
  { value: "internal", label: "Interno" },
  { value: "restricted", label: "Restrito" },
  { value: "confidential", label: "Confidencial" },
];

const CONTROL_TYPE_OPTIONS = [
  "Procedimento",
  "Instrucao de Trabalho",
  "Formulario",
  "Politica",
  "Plano",
  "Manual",
  "Relatorio",
];

function getStatusBadgeVariant(status: DocumentRecord["status"]) {
  switch (status) {
    case "active":
      return "default";
    case "in_review":
      return "secondary";
    case "rejected":
      return "destructive";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
}

function formatDateLabel(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function Documentos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: branches = [] } = useBranches();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    summary: "",
    tagsText: "",
    documentKind: (searchParams.get("document_kind") as "general" | "controlled" | null) || "general",
    documentDomain: "quality",
    branchIds: [] as string[],
    code: "",
    documentTypeLabel: "Procedimento",
    normReference: "",
    issuerName: "",
    confidentialityLevel: "public",
    validityStartDate: "",
    validityEndDate: "",
    reviewDueDate: "",
    responsibleDepartment: "",
    controlledCopy: false,
  });

  const filters = useMemo<DocumentListFilters>(
    () => ({
      search: searchParams.get("search") || "",
      documentKind: (searchParams.get("document_kind") as DocumentListFilters["documentKind"]) || "all",
      documentDomain: searchParams.get("document_domain") || "all",
      status: searchParams.get("status") || "all",
      branchId: searchParams.get("branch_id") || "all",
      validityState: (searchParams.get("validity") as DocumentListFilters["validityState"]) || undefined,
      reviewState: (searchParams.get("review") as DocumentListFilters["reviewState"]) || undefined,
      readState: (searchParams.get("reads") as DocumentListFilters["readState"]) || undefined,
      requestState: (searchParams.get("requests") as DocumentListFilters["requestState"]) || undefined,
    }),
    [searchParams],
  );

  const { data: rawDocuments = [], isLoading } = useQuery({
    queryKey: ["document-center", filters],
    queryFn: () => listDocumentRecords(filters),
  });
  const documents = Array.isArray(rawDocuments) ? rawDocuments : [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Selecione um arquivo para upload.");
      }

      return createDocumentRecord({
        file: selectedFile,
        title: uploadForm.title,
        summary: uploadForm.summary,
        tags: uploadForm.tagsText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        documentKind: uploadForm.documentKind,
        documentDomain: uploadForm.documentDomain,
        branchIds: uploadForm.branchIds,
        controlProfile:
          uploadForm.documentKind === "controlled"
            ? {
                code: uploadForm.code || null,
                document_type_label: uploadForm.documentTypeLabel,
                norm_reference: uploadForm.normReference || null,
                issuer_name: uploadForm.issuerName || null,
                confidentiality_level: uploadForm.confidentialityLevel,
                validity_start_date: uploadForm.validityStartDate || null,
                validity_end_date: uploadForm.validityEndDate || null,
                review_due_date: uploadForm.reviewDueDate || null,
                responsible_department: uploadForm.responsibleDepartment || null,
                controlled_copy: uploadForm.controlledCopy,
              }
            : undefined,
      });
    },
    onSuccess: (document) => {
      toast.success("Documento criado com sucesso.");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({
        title: "",
        summary: "",
        tagsText: "",
        documentKind: "general",
        documentDomain: "quality",
        branchIds: [],
        code: "",
        documentTypeLabel: "Procedimento",
        normReference: "",
        issuerName: "",
        confidentialityLevel: "public",
        validityStartDate: "",
        validityEndDate: "",
        reviewDueDate: "",
        responsibleDepartment: "",
        controlledCopy: false,
      });
      queryClient.invalidateQueries({ queryKey: ["document-center"] });
      navigate(`/documentos/${document.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const documentDomains = useMemo(() => {
    const values = Array.from(new Set(documents.map((document) => document.document_domain))).sort();
    return values;
  }, [documents]);

  const stats = useMemo(
    () => ({
      total: documents.length,
      controlled: documents.filter((document) => document.document_kind === "controlled").length,
      pendingReads: documents.filter((document) => document.pending_read_count > 0).length,
      openRequests: documents.filter((document) => document.open_request_count > 0).length,
    }),
    [documents],
  );

  const setFilterValue = (key: string, value: string | undefined) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const toggleBranch = (branchId: string) => {
    setUploadForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Central hibrida de documentos
          </Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central Documental</h1>
            <p className="text-muted-foreground">
              Gestao unificada de documentos, revisoes, leituras obrigatorias, relacoes e solicitacoes internas.
            </p>
          </div>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus2 className="h-4 w-4" />
              Novo documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo documento na central</DialogTitle>
              <DialogDescription>
                Documentos controlados exigem filiais e cabecalho SGQ. A IA sera disparada automaticamente apos o upload.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Titulo</Label>
                  <Input
                    value={uploadForm.title}
                    onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex.: Procedimento de frota"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dominio</Label>
                  <Select
                    value={uploadForm.documentDomain}
                    onValueChange={(value) => setUploadForm((current) => ({ ...current, documentDomain: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">Qualidade</SelectItem>
                      <SelectItem value="regulatory">Regulatorio</SelectItem>
                      <SelectItem value="waste">Residuos</SelectItem>
                      <SelectItem value="training">Treinamentos</SelectItem>
                      <SelectItem value="people">Pessoas</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tipo documental</Label>
                  <Select
                    value={uploadForm.documentKind}
                    onValueChange={(value: "general" | "controlled") =>
                      setUploadForm((current) => ({ ...current, documentKind: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Documento geral</SelectItem>
                      <SelectItem value="controlled">Documento controlado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <Input
                    value={uploadForm.tagsText}
                    onChange={(event) => setUploadForm((current) => ({ ...current, tagsText: event.target.value }))}
                    placeholder="frota, pneus, combustivel"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Resumo</Label>
                <Textarea
                  value={uploadForm.summary}
                  onChange={(event) => setUploadForm((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="Contexto do documento, uso e observacoes."
                />
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Filiais vinculadas
                </Label>
                <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3">
                  {branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={uploadForm.branchIds.includes(branch.id)}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <span>{getBranchDisplayLabel(branch)}</span>
                    </label>
                  ))}
                </div>
                {uploadForm.documentKind === "controlled" && (
                  <p className="text-xs text-muted-foreground">
                    Para documentos controlados, ao menos uma filial e obrigatoria.
                  </p>
                )}
              </div>

              {uploadForm.documentKind === "controlled" && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Cabecalho SGQ</CardTitle>
                    <CardDescription>
                      Esses campos ficam restritos aos documentos controlados e aparecem na pagina dedicada do documento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Codigo</Label>
                      <Input
                        value={uploadForm.code}
                        onChange={(event) => setUploadForm((current) => ({ ...current, code: event.target.value }))}
                        placeholder="PSG-001"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tipo controlado</Label>
                      <Select
                        value={uploadForm.documentTypeLabel}
                        onValueChange={(value) => setUploadForm((current) => ({ ...current, documentTypeLabel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTROL_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Norma</Label>
                      <Input
                        value={uploadForm.normReference}
                        onChange={(event) => setUploadForm((current) => ({ ...current, normReference: event.target.value }))}
                        placeholder="ISO 9001 / ISO 14001"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Emitente</Label>
                      <Input
                        value={uploadForm.issuerName}
                        onChange={(event) => setUploadForm((current) => ({ ...current, issuerName: event.target.value }))}
                        placeholder="Area emissora"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Confidencialidade</Label>
                      <Select
                        value={uploadForm.confidentialityLevel}
                        onValueChange={(value) => setUploadForm((current) => ({ ...current, confidentialityLevel: value }))}
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
                        value={uploadForm.responsibleDepartment}
                        onChange={(event) =>
                          setUploadForm((current) => ({ ...current, responsibleDepartment: event.target.value }))
                        }
                        placeholder="Qualidade / RH / Frota"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Vigencia inicial</Label>
                      <Input
                        type="date"
                        value={uploadForm.validityStartDate}
                        onChange={(event) =>
                          setUploadForm((current) => ({ ...current, validityStartDate: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Vigencia final</Label>
                      <Input
                        type="date"
                        value={uploadForm.validityEndDate}
                        onChange={(event) =>
                          setUploadForm((current) => ({ ...current, validityEndDate: event.target.value }))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Revisao prevista</Label>
                      <Input
                        type="date"
                        value={uploadForm.reviewDueDate}
                        onChange={(event) =>
                          setUploadForm((current) => ({ ...current, reviewDueDate: event.target.value }))
                        }
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-md border p-3 text-sm md:col-span-2">
                      <Checkbox
                        checked={uploadForm.controlledCopy}
                        onCheckedChange={(checked) =>
                          setUploadForm((current) => ({ ...current, controlledCopy: checked === true }))
                        }
                      />
                      Copia controlada
                    </label>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploadMutation.isPending}>
                Cancelar
              </Button>
              <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !selectedFile}>
                {uploadMutation.isPending ? "Criando..." : "Criar documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total visivel</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Controlados</CardDescription>
            <CardTitle className="text-3xl">{stats.controlled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Leituras pendentes</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingReads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Solicitacoes abertas</CardDescription>
            <CardTitle className="text-3xl">{stats.openRequests}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros operacionais</CardTitle>
          <CardDescription>
            Consulte documentos por tipo, dominio, filial, validade, leitura pendente e solicitacoes internas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          <div className="grid gap-2 lg:col-span-2">
            <Label>Busca</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search || ""}
                onChange={(event) => setFilterValue("search", event.target.value || undefined)}
                className="pl-9"
                placeholder="Titulo, codigo, tags ou resumo"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={filters.documentKind || "all"} onValueChange={(value) => setFilterValue("document_kind", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={filters.status || "all"} onValueChange={(value) => setFilterValue("status", value)}>
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

          <div className="grid gap-2">
            <Label>Dominio</Label>
            <Select value={filters.documentDomain || "all"} onValueChange={(value) => setFilterValue("document_domain", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dominios</SelectItem>
                {documentDomains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {DOMAIN_LABELS[domain] || domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Filial</Label>
            <Select value={filters.branchId || "all"} onValueChange={(value) => setFilterValue("branch_id", value)}>
              <SelectTrigger>
                <SelectValue />
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
          </div>

          <div className="grid gap-2">
            <Label>Validade</Label>
            <Select value={filters.validityState || "all"} onValueChange={(value) => setFilterValue("validity", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Vigentes</SelectItem>
                <SelectItem value="expired">Vencidas</SelectItem>
                <SelectItem value="missing">Sem vigencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Revisao</Label>
            <Select value={filters.reviewState || "all"} onValueChange={(value) => setFilterValue("review", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="ok">Em dia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Leitura</Label>
            <Select value={filters.readState || "all"} onValueChange={(value) => setFilterValue("reads", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Com pendencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Solicitacoes</Label>
            <Select value={filters.requestState || "all"} onValueChange={(value) => setFilterValue("requests", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="open">Com abertas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            {isLoading ? "Carregando central..." : `${documents.length} documento(s) retornado(s) para os filtros atuais.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 && !isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhum documento encontrado.</p>
                <p className="text-sm text-muted-foreground">
                  Revise os filtros ou crie um novo documento na central.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Filiais</TableHead>
                  <TableHead>Revisao</TableHead>
                  <TableHead>Atencao</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Abrir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/documentos/${document.id}`)}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{document.title}</p>
                          <Badge variant={getStatusBadgeVariant(document.status)}>{document.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{document.file_name}</span>
                          <span>{formatFileSize(document.file_size || 0)}</span>
                          {document.control_profile?.code && <span>{document.control_profile.code}</span>}
                        </div>
                        {document.summary && (
                          <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">{document.summary}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant="outline">{DOMAIN_LABELS[document.document_domain] || document.document_domain}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {document.document_kind === "controlled" ? "Controlado" : "Geral"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-48 flex-wrap gap-1">
                        {!document.branches?.length ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          document.branches.map((branch) => (
                            <Badge key={branch.branch_id} variant="secondary">
                              {getBranchDisplayLabel({ code: branch.code, name: branch.name })}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                          Rev. {document.current_version_number}
                        </div>
                        {document.control_profile?.review_due_date && (
                          <p className="text-xs text-muted-foreground">
                            Revisao: {formatDateLabel(document.control_profile.review_due_date)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          {document.ai_processing_status || "Pendente"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {document.pending_read_count > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Eye className="h-3 w-3" />
                              {document.pending_read_count} leitura(s)
                            </Badge>
                          )}
                          {document.open_request_count > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <GitPullRequest className="h-3 w-3" />
                              {document.open_request_count} solicitacao(oes)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.document_kind === "controlled" ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                            {formatDateLabel(document.control_profile?.validity_start_date)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ate {formatDateLabel(document.control_profile?.validity_end_date)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nao se aplica</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/documentos/${document.id}`)}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
