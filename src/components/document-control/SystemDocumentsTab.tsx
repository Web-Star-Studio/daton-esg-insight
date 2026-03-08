import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Download, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { uploadDocument, downloadDocument } from "@/services/documents";
import { DocumentLevelBadge, LEVEL_OPTIONS, type DocumentLevel } from "./DocumentLevelBadge";
import { generateDocumentCode } from "./DocumentCodeGenerator";
import { gedDocumentsService } from "@/services/gedDocuments";

interface SystemDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  code: string | null;
  document_level: DocumentLevel | null;
  document_type: string | null;
  approval_status: string | null;
  effective_date: string | null;
  next_review_date: string | null;
  responsible_department: string | null;
  controlled_copy: boolean | null;
  upload_date: string;
  company_id: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "outline" },
  em_aprovacao: { label: "Em Aprovação", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
  obsoleto: { label: "Obsoleto", variant: "destructive" },
};

export const SystemDocumentsTab = () => {
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    document_level: "" as DocumentLevel | "",
    responsible_department: "",
  });
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("documents")
        .select("id, file_name, file_path, file_size, code, document_level, document_type, approval_status, effective_date, next_review_date, responsible_department, controlled_copy, upload_date, company_id")
        .not("document_level", "is", null)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleCreate = async () => {
    if (!selectedFile || !newDoc.document_level) {
      toast({ title: "Erro", description: "Selecione um arquivo e o nível do documento.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Get existing codes for auto-generation
      const existingCodes = documents.map((d) => d.code).filter(Boolean) as string[];
      const autoCode = generateDocumentCode(newDoc.document_level as DocumentLevel, existingCodes);

      const uploadedDoc = await uploadDocument(selectedFile, {
        tags: [],
        related_model: "quality_document",
        related_id: profile.company_id,
      });

      await (supabase as any)
        .from("documents")
        .update({
          document_level: newDoc.document_level,
          code: autoCode,
          approval_status: "rascunho",
          document_type: "interno",
          responsible_department: newDoc.responsible_department || null,
          controlled_copy: true,
          requires_approval: true,
          next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .eq("id", uploadedDoc.id);

      toast({ title: "Documento criado", description: `Código gerado: ${autoCode}` });
      setIsCreateOpen(false);
      setSelectedFile(null);
      setNewDoc({ document_level: "", responsible_department: "" });
      await loadDocuments();
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: SystemDocument) => {
    try {
      const { url, fileName } = await downloadDocument(doc.id);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast({ title: "Erro", description: "Não foi possível baixar o documento.", variant: "destructive" });
    }
  };

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.code || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = levelFilter === "all" || doc.document_level === levelFilter;
    const matchStatus = statusFilter === "all" || doc.approval_status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando documentos do sistema..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[260px]"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Níveis</SelectItem>
              {LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Documento do Sistema</DialogTitle>
              <DialogDescription>
                Selecione o nível hierárquico. O código será gerado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nível do Documento *</Label>
                <Select value={newDoc.document_level} onValueChange={(v) => setNewDoc({ ...newDoc, document_level: v as DocumentLevel })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Departamento Responsável</Label>
                <Input
                  value={newDoc.responsible_department}
                  onChange={(e) => setNewDoc({ ...newDoc, responsible_department: e.target.value })}
                  placeholder="Ex: Qualidade, Produção..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Arquivo *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={isUploading}>
                {isUploading ? "Criando..." : "Criar Documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Próx. Revisão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc) => {
                    const status = STATUS_LABELS[doc.approval_status || "rascunho"] || STATUS_LABELS.rascunho;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono font-medium">{doc.code || "—"}</TableCell>
                        <TableCell><DocumentLevelBadge level={doc.document_level} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{doc.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                        <TableCell>{doc.responsible_department || "—"}</TableCell>
                        <TableCell>
                          {doc.next_review_date
                            ? new Date(`${doc.next_review_date}T00:00:00`).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
