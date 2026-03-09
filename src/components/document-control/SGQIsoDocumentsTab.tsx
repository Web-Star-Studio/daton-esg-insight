import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Download, FileText, Calendar, Brain, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { uploadDocument, downloadDocument } from "@/services/documents";
import { confirmDocumentRead, getCurrentUserReadConfirmationMap } from "@/services/documentCompliance";
import { processDocumentWithAI } from "@/services/documentAI";
import { linkDocumentToBranches, getDocumentsBranchesMap } from "@/services/documentBranches";
import { useBranches } from "@/services/branches";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
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
import { Progress } from "@/components/ui/progress";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  related_model: string;
  document_type: string;
  ai_extracted_category: string | null;
  upload_date: string;
  uploader_user_id: string;
  company_id: string;
  tags: string[] | null;
  ai_processing_status: string | null;
  ai_confidence_score: number | null;
  controlled_copy: boolean;
  requires_approval: boolean;
  approval_status: string;
  master_list_included: boolean;
  code: string | null;
  responsible_department: string | null;
}

export const SGQIsoDocumentsTab = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [readConfirmationMap, setReadConfirmationMap] = useState<Record<string, boolean>>({});
  const [confirmingReadId, setConfirmingReadId] = useState<string | null>(null);
  const [branchesMap, setBranchesMap] = useState<Record<string, Array<{ branch_id: string; name: string; code: string | null }>>>({});
  const { toast } = useToast();

  const [uploadData, setUploadData] = useState({
    document_type: 'Manual',
    tags: [] as string[],
    controlled_copy: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiProcessingStatus, setAiProcessingStatus] = useState<string | null>(null);

  const { data: branches = [] } = useBranches();

  const documentCategories = [
    'Manual',
    'Procedimento',
    'Instrução de Trabalho',
    'Formulário',
    'MSG',
    'FPLAN',
    'Política',
    'Plano',
    'Relatório',
    'Certificado',
    'Outros'
  ];

  const normalizeDocumentCategory = (doc: Document): string => {
    const rawType = (doc.document_type || "").trim();
    if (rawType && rawType !== "interno" && documentCategories.includes(rawType)) {
      return rawType;
    }

    const extracted = (doc.ai_extracted_category || "").trim().toLowerCase();
    if (!extracted) return "Outros";

    const normalized = documentCategories.find((category) =>
      extracted.includes(category.toLowerCase()),
    );

    return normalized || "Outros";
  };

  const loadDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_path,
          file_size,
          related_model,
          document_type,
          ai_extracted_category,
          upload_date,
          uploader_user_id,
          company_id,
          tags,
          ai_processing_status,
          ai_confidence_score,
          controlled_copy,
          requires_approval,
          approval_status,
          master_list_included,
          code,
          responsible_department
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      const nonRegulatoryDocs = (data || []).filter(
        (doc) => doc.related_model !== 'licenses' && doc.related_model !== 'license',
      );
      setDocuments(nonRegulatoryDocs as Document[]);

      // Load branches map
      const docIds = nonRegulatoryDocs.map((d) => d.id);
      if (docIds.length > 0) {
        const bMap = await getDocumentsBranchesMap(docIds);
        setBranchesMap(bMap);
      }

      try {
        const confirmationMap = await getCurrentUserReadConfirmationMap(
          nonRegulatoryDocs.map((doc) => doc.id),
        );
        setReadConfirmationMap(confirmationMap);
      } catch (confirmationError) {
        console.error("Erro ao carregar confirmações de leitura:", confirmationError);
        setReadConfirmationMap({});
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos SGQ/ISO.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Erro", description: "Selecione um arquivo para upload.", variant: "destructive" });
      return;
    }

    if (selectedBranchIds.length === 0) {
      toast({ title: "Erro", description: "Selecione ao menos uma filial.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setAiProcessingStatus(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      if (!currentUserId) throw new Error("Usuário não autenticado.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUserId)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);
      if (!profile?.company_id) throw new Error("Empresa do usuário não encontrada.");

      // Upload document
      const uploadedDoc = await uploadDocument(selectedFile, {
        tags: uploadData.tags,
        related_model: 'quality_document',
        related_id: profile.company_id,
      });

      // Update document metadata
      await supabase
        .from('documents')
        .update({
          controlled_copy: uploadData.controlled_copy,
          requires_approval: true,
          approval_status: 'em_aprovacao' as const,
          master_list_included: uploadData.controlled_copy,
          document_type: 'interno',
          ai_extracted_category: uploadData.document_type,
        })
        .eq('id', uploadedDoc.id);

      // Link branches
      await linkDocumentToBranches(uploadedDoc.id, selectedBranchIds);

      toast({
        title: "Upload concluído!",
        description: `"${selectedFile.name}" enviado. Iniciando análise IA...`,
      });

      // Start AI processing
      setAiProcessingStatus("Processando com IA...");
      const aiResult = await processDocumentWithAI(uploadedDoc.id);

      if (aiResult.success) {
        setAiProcessingStatus("Extração concluída!");
        toast({
          title: "IA concluiu a análise",
          description: "Os dados extraídos estão disponíveis na página do documento.",
        });
        // Navigate to detail page
        setTimeout(() => {
          setIsUploadModalOpen(false);
          navigate(`/controle-documentos/${uploadedDoc.id}`);
        }, 1500);
      } else {
        setAiProcessingStatus("Erro na extração IA");
        toast({
          title: "Atenção",
          description: "Upload concluído, mas a extração IA falhou. Você pode reprocessar depois.",
          variant: "destructive",
        });
      }

      setSelectedFile(null);
      setSelectedBranchIds([]);
      setUploadData({ document_type: 'Manual', tags: [], controlled_copy: false });
      await loadDocuments();
    } catch (error: unknown) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível fazer upload do documento.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { url, fileName } = await downloadDocument(doc.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: error instanceof Error ? error.message : "Não foi possível baixar o documento.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmRead = async (documentId: string) => {
    try {
      setConfirmingReadId(documentId);
      await confirmDocumentRead(documentId);
      setReadConfirmationMap((prev) => ({ ...prev, [documentId]: true }));
      toast({ title: "Leitura confirmada", description: "A confirmação de leitura foi registrada." });
    } catch (error: unknown) {
      toast({
        title: "Erro ao confirmar leitura",
        description: error instanceof Error ? error.message : "Não foi possível registrar a confirmação.",
        variant: "destructive",
      });
    } finally {
      setConfirmingReadId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Manual': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'Procedimento': 'bg-green-100 text-green-800 hover:bg-green-100',
      'Instrução de Trabalho': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'Formulário': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'MSG': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      'FPLAN': 'bg-rose-100 text-rose-800 hover:bg-rose-100',
      'Política': 'bg-red-100 text-red-800 hover:bg-red-100',
      'Plano': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'Relatório': 'bg-teal-100 text-teal-800 hover:bg-teal-100',
      'Certificado': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      'Outros': 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    };
    return colors[category] || colors['Outros'];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ai_extracted_category?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = categoryFilter === 'all' || normalizeDocumentCategory(doc) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando documentos SGQ/ISO..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Documentos SGQ/ISO</h2>
          <p className="text-muted-foreground">Instruções de Trabalho, Procedimentos e documentos de qualidade</p>
        </div>

        <Dialog
          open={isUploadModalOpen}
          onOpenChange={(open) => {
            setIsUploadModalOpen(open);
            if (!open) {
              setSelectedFile(null);
              setSelectedBranchIds([]);
              setAiProcessingStatus(null);
              setUploadData({ document_type: 'Manual', tags: [], controlled_copy: false });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Documento SGQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Upload de Documento SGQ/ISO com IA
              </DialogTitle>
              <DialogDescription>
                O documento será processado automaticamente pela IA para extração de dados.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md mt-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-6 w-6 p-0">
                      ×
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Select
                  value={uploadData.document_type}
                  onValueChange={(value) => setUploadData({ ...uploadData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-branch selector */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Filiais vinculadas <span className="text-destructive">*</span>
                </Label>
                <div className="border border-border rounded-md p-3 max-h-[160px] overflow-y-auto space-y-2">
                  {branches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma filial cadastrada.</p>
                  ) : (
                    branches.map((branch) => (
                      <div key={branch.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`branch-${branch.id}`}
                          checked={selectedBranchIds.includes(branch.id)}
                          onCheckedChange={() => handleBranchToggle(branch.id)}
                        />
                        <label
                          htmlFor={`branch-${branch.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {getBranchDisplayLabel(branch)}
                          {branch.is_headquarters && (
                            <Badge variant="outline" className="ml-2 text-xs">Matriz</Badge>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedBranchIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedBranchIds.length} filial(is) selecionada(s)
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="controlled_copy"
                  checked={uploadData.controlled_copy}
                  onCheckedChange={(checked) =>
                    setUploadData({ ...uploadData, controlled_copy: checked === true })
                  }
                />
                <Label htmlFor="controlled_copy">Cópia controlada</Label>
              </div>

              {/* AI Processing Status */}
              {aiProcessingStatus && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{aiProcessingStatus}</p>
                    {aiProcessingStatus === "Processando com IA..." && (
                      <Progress value={60} className="mt-2 h-1" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || selectedBranchIds.length === 0}
              >
                {isUploading ? (
                  <>
                    <EnhancedLoading size="sm" className="mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Upload + Análise IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {documentCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Biblioteca SGQ/ISO
          </CardTitle>
          <CardDescription>
            Controle de versão e gestão de documentos do sistema de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Tente uma pesquisa diferente ou altere os filtros.'
                  : 'Comece fazendo upload do seu primeiro documento SGQ/ISO.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Filiais</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/controle-documentos/${doc.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          {doc.ai_extracted_category && (
                            <p className="text-sm text-muted-foreground">{doc.ai_extracted_category}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {doc.controlled_copy && (
                              <Badge variant="outline" className="text-xs">Controlado</Badge>
                            )}
                            {readConfirmationMap[doc.id] && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                Leitura Confirmada
                              </Badge>
                            )}
                            {doc.ai_processing_status === 'completed' && (
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                <Brain className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(normalizeDocumentCategory(doc))}>
                        {normalizeDocumentCategory(doc)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(branchesMap[doc.id] || []).map((b) => (
                          <Badge key={b.branch_id} variant="secondary" className="text-xs">
                            {getBranchDisplayLabel({ code: b.code, name: b.name })}
                          </Badge>
                        ))}
                        {(!branchesMap[doc.id] || branchesMap[doc.id].length === 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} title="Baixar documento">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/controle-documentos/${doc.id}`)}
                          title="Ver detalhes"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirmRead(doc.id)}
                          disabled={readConfirmationMap[doc.id] || confirmingReadId === doc.id}
                          title="Registrar confirmação de leitura"
                        >
                          {readConfirmationMap[doc.id]
                            ? "Lido"
                            : confirmingReadId === doc.id
                              ? "..."
                              : "Confirmar leitura"}
                        </Button>
                      </div>
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
};
