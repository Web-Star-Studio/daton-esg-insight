import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, RefreshCw, FileText, Brain, Building2, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { downloadDocument } from "@/services/documents";
import { processDocumentWithAI } from "@/services/documentAI";
import { getDocumentBranches } from "@/services/documentBranches";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";

interface DocumentDetail {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  ai_extracted_category: string | null;
  ai_processing_status: string | null;
  ai_confidence_score: number | null;
  upload_date: string;
  tags: string[] | null;
  controlled_copy: boolean;
  company_id: string;
}

interface BranchInfo {
  id: string;
  branch_id: string;
  branch_name: string;
  branch_code: string | null;
}

interface ExtractionData {
  id: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  target_table: string;
  validation_status: string;
  created_at: string;
}

const SGQDocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [extractions, setExtractions] = useState<ExtractionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, file_path, file_size, file_type, document_type, ai_extracted_category, ai_processing_status, ai_confidence_score, upload_date, tags, controlled_copy, company_id")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDocument(data as DocumentDetail);

      // Load branches
      const branchData = await getDocumentBranches(id);
      setBranches(branchData);

      // Load extractions
      const { data: extractionData } = await supabase
        .from("extracted_data_preview")
        .select("id, extracted_fields, confidence_scores, target_table, validation_status, created_at")
        .eq("company_id", data.company_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setExtractions((extractionData || []) as ExtractionData[]);

      // Generate preview URL for PDFs/images
      if (data.file_path) {
        const { data: urlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(data.file_path, 3600);
        if (urlData?.signedUrl) setPreviewUrl(urlData.signedUrl);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar documento:", error);
      toast({
        title: "Erro",
        description: "Documento não encontrado.",
        variant: "destructive",
      });
      navigate("/controle-documentos");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  const handleDownload = async () => {
    if (!document) return;
    try {
      const { url, fileName } = await downloadDocument(document.id);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast({
        title: "Erro no download",
        description: error instanceof Error ? error.message : "Falha ao baixar.",
        variant: "destructive",
      });
    }
  };

  const handleReprocess = async () => {
    if (!document) return;
    setReprocessing(true);
    try {
      const result = await processDocumentWithAI(document.id);
      if (result.success) {
        toast({ title: "Reprocessamento iniciado", description: "A IA está analisando o documento novamente." });
        // Reload after a delay
        setTimeout(() => void loadDocument(), 3000);
      } else {
        toast({ title: "Erro", description: result.error || "Falha ao reprocessar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao reprocessar documento.", variant: "destructive" });
    } finally {
      setReprocessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
      case "Concluído":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Processado</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case "failed":
      case "Erro":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando documento..." />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/controle-documentos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{document.file_name}</h1>
          <p className="text-muted-foreground">
            Enviado em {new Date(document.upload_date).toLocaleDateString("pt-BR")} · {formatFileSize(document.file_size)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleReprocess} disabled={reprocessing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? "animate-spin" : ""}`} />
            {reprocessing ? "Processando..." : "Reprocessar IA"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document Info + Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Visualização do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl && document.file_type?.includes("pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[500px] rounded-md border border-border"
                  title="Preview do documento"
                />
              ) : previewUrl && document.file_type?.startsWith("image") ? (
                <img
                  src={previewUrl}
                  alt={document.file_name}
                  className="max-w-full max-h-[500px] rounded-md border border-border object-contain mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4" />
                  <p>Preview não disponível para este tipo de arquivo.</p>
                  <Button variant="outline" className="mt-4" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar para visualizar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Extraction Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Resultados da Extração IA
              </CardTitle>
              <CardDescription>Dados extraídos automaticamente do documento</CardDescription>
            </CardHeader>
            <CardContent>
              {extractions.length > 0 ? (
                <div className="space-y-4">
                  {extractions.map((extraction) => (
                    <Card key={extraction.id} className="border border-border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline">{extraction.target_table}</Badge>
                          <Badge className={
                            extraction.validation_status === "Aprovado"
                              ? "bg-green-100 text-green-800"
                              : extraction.validation_status === "Rejeitado"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }>
                            {extraction.validation_status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(extraction.extracted_fields || {}).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                              <p className="text-sm">{String(value ?? "-")}</p>
                              {extraction.confidence_scores?.[key] != null && (
                                <div className="flex items-center gap-2">
                                  <Progress value={(extraction.confidence_scores[key] || 0) * 100} className="h-1 flex-1" />
                                  <span className="text-xs text-muted-foreground">
                                    {((extraction.confidence_scores[key] || 0) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-medium">Nenhum dado extraído ainda</p>
                  <p className="text-sm mt-1">Clique em "Reprocessar IA" para iniciar a extração.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-6">
          {/* Status IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(document.ai_processing_status)}
              </div>
              {document.ai_confidence_score != null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Confiança</span>
                    <span className="text-sm font-medium">{(document.ai_confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={document.ai_confidence_score * 100} />
                </div>
              )}
              {document.ai_extracted_category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Categoria IA</span>
                  <Badge variant="outline">{document.ai_extracted_category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Filiais Vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {branches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <Badge key={branch.id} variant="secondary">
                      {getBranchDisplayLabel({ code: branch.branch_code, name: branch.branch_name })}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma filial vinculada.</p>
              )}
            </CardContent>
          </Card>

          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <span className="text-sm">{document.document_type || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tamanho</span>
                <span className="text-sm">{formatFileSize(document.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cópia Controlada</span>
                <span className="text-sm">{document.controlled_copy ? "Sim" : "Não"}</span>
              </div>
              {document.tags && document.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SGQDocumentDetail;
