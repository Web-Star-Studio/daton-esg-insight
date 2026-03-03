import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWasteDocument,
  getWasteLogById,
  getWasteLogDocuments,
  uploadWasteDocument,
} from "@/services/waste";
import { useBranches } from "@/services/branches";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentViewer } from "@/components/DocumentViewer";
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
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "Coletado") return "default";
  if (status === "Em Trânsito" || status === "Em Transporte") return "secondary";
  if (status === "Destinação Finalizada" || status === "Destinado") return "outline";
  return "secondary";
};

const getClassBadgeClass = (wasteClass?: string) => {
  if (wasteClass?.includes("Classe I")) return "bg-red-100 text-red-800 border-red-300";
  if (wasteClass?.includes("Classe II A")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (wasteClass?.includes("Classe II B")) return "bg-green-100 text-green-800 border-green-300";
  return "bg-muted text-muted-foreground border-border";
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  return format(new Date(`${value}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const fieldValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export default function WasteLogDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const documentsSectionRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingPreviewDocId, setLoadingPreviewDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: wasteLog, isLoading: isLoadingWasteLog } = useQuery({
    queryKey: ["waste-logs", "detail", id],
    queryFn: () => getWasteLogById(id as string),
    enabled: !!id,
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["waste-logs", "documents", id],
    queryFn: () => getWasteLogDocuments(id as string),
    enabled: !!id,
  });

  const { data: branches = [] } = useBranches();

  const branchLabel = useMemo(() => {
    if (!wasteLog?.branch_id) return "-";
    const branch = branches.find((item) => item.id === wasteLog.branch_id);
    return branch ? getBranchDisplayLabel(branch) : wasteLog.branch_id;
  }, [branches, wasteLog?.branch_id]);

  useEffect(() => {
    if (searchParams.get("tab") === "documents" && documentsSectionRef.current) {
      documentsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams, wasteLog?.id]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!id) throw new Error("Registro não encontrado");
      const results = await Promise.allSettled(files.map((file) => uploadWasteDocument(id, file)));
      return results;
    },
    onMutate: () => setUploading(true),
    onSuccess: (results) => {
      const successCount = results.filter((item) => item.status === "fulfilled").length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Upload concluído",
          description:
            failedCount > 0
              ? `${successCount} documento(s) enviado(s), ${failedCount} falharam.`
              : `${successCount} documento(s) enviado(s) com sucesso.`,
          variant: failedCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Erro ao enviar documentos",
          description: "Nenhum arquivo foi enviado.",
          variant: "destructive",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["waste-logs", "documents", id] });
      queryClient.invalidateQueries({ queryKey: ["waste-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar documentos",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWasteDocument,
    onSuccess: () => {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["waste-logs", "documents", id] });
      queryClient.invalidateQueries({ queryKey: ["waste-logs"] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      setPreviewDoc(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Alguns arquivos foram ignorados",
        description: "Apenas arquivos de até 10MB são aceitos.",
        variant: "destructive",
      });
    }
    if (validFiles.length > 0) {
      uploadMutation.mutate(validFiles);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Erro ao baixar documento",
        description: "Não foi possível baixar o documento.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (doc: { id: string; file_path: string; file_name: string; file_type?: string }) => {
    const isViewable = !doc.file_type || doc.file_type.includes("pdf") || doc.file_type.includes("image");
    if (!isViewable) {
      await handleDownload(doc.file_path, doc.file_name);
      return;
    }

    setLoadingPreviewDocId(doc.id);
    try {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setPreviewDoc({ url: data.signedUrl, name: doc.file_name });
    } catch {
      toast({
        title: "Erro ao visualizar",
        description: "Não foi possível abrir o documento.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreviewDocId(null);
    }
  };

  if (!id) {
    return <p className="text-muted-foreground">Registro não encontrado.</p>;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-28">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/residuos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalhes do Registro de Resíduo</h1>
            <p className="text-muted-foreground">
              {wasteLog ? `MTR ${wasteLog.mtr_number}` : "Carregando registro..."}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/residuos/registrar-destinacao?edit=${id}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Registro
        </Button>
      </div>

      {isLoadingWasteLog ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !wasteLog ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Registro não encontrado.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nº MTR/Controle</p>
                <p className="font-semibold">{fieldValue(wasteLog.mtr_number)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(wasteLog.status)}>{fieldValue(wasteLog.status)}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filial</p>
                <p className="font-semibold">{branchLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data da Coleta</p>
                <p className="font-semibold">{formatDateOnly(wasteLog.collection_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p>{formatDateTime(wasteLog.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atualizado em</p>
                <p>{formatDateTime(wasteLog.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caracterização do Resíduo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Descrição do Resíduo</p>
                <p className="font-semibold">{fieldValue(wasteLog.waste_description)}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <Badge className={getClassBadgeClass(wasteLog.waste_class)}>
                    {fieldValue(wasteLog.waste_class)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="font-semibold">
                    {fieldValue(wasteLog.quantity)} {fieldValue(wasteLog.unit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agentes Envolvidos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Transportador</p>
                <p className="font-semibold">{fieldValue(wasteLog.transporter_name)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ Transportador</p>
                <p>{fieldValue(wasteLog.transporter_cnpj)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destinador</p>
                <p className="font-semibold">{fieldValue(wasteLog.destination_name)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ Destinador</p>
                <p>{fieldValue(wasteLog.destination_cnpj)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destinação e Custos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Destinação Final</p>
                <p className="font-semibold">{fieldValue(wasteLog.final_treatment_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total da Destinação</p>
                <p className="font-semibold">{formatCurrency(wasteLog.cost)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Financeiros Detalhados</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Custo Unitário de Destinação</p>
                <p>{formatCurrency(wasteLog.destination_cost_per_unit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total de Destinação</p>
                <p>{formatCurrency(wasteLog.destination_cost_total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo de Transporte</p>
                <p>{formatCurrency(wasteLog.transport_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Unitária</p>
                <p>{formatCurrency(wasteLog.revenue_per_unit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p>{formatCurrency(wasteLog.revenue_total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                <p>{formatCurrency(wasteLog.total_payable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p>{formatCurrency(wasteLog.amount_paid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status de Pagamento</p>
                <p>{fieldValue(wasteLog.payment_status)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                <p>{fieldValue(wasteLog.payment_date)}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Observações de Pagamento</p>
                <p>{fieldValue(wasteLog.payment_notes)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Logísticos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Motorista</p>
                <p>{fieldValue(wasteLog.driver_name)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa do Veículo</p>
                <p>{fieldValue(wasteLog.vehicle_plate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Armazenamento</p>
                <p>{fieldValue(wasteLog.storage_type)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentação Fiscal e de Destinação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nº NF do Gerador</p>
                <p>{fieldValue(wasteLog.invoice_generator)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nº NF de Pagamento</p>
                <p>{fieldValue(wasteLog.invoice_payment)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nº CDF Principal</p>
                <p>{fieldValue(wasteLog.cdf_number)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nº CDF Adicional 1</p>
                <p>{fieldValue(wasteLog.cdf_additional_1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nº CDF Adicional 2</p>
                <p>{fieldValue(wasteLog.cdf_additional_2)}</p>
              </div>
            </CardContent>
          </Card>

          <div ref={documentsSectionRef}>
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Faça upload de múltiplos documentos (MTR, CDF e anexos relacionados).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label htmlFor="waste-documents-upload" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploading}
                    onClick={() => document.getElementById("waste-documents-upload")?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando documentos...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Documentos
                      </>
                    )}
                  </Button>
                  <input
                    id="waste-documents-upload"
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleUploadFiles}
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB por arquivo).
                </p>

                {previewDoc && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{previewDoc.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[500px]">
                      <DocumentViewer fileUrl={previewDoc.url} fileName={previewDoc.name} />
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {isLoadingDocuments ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : documents.length > 0 ? (
                    documents.map((doc: any) => (
                      <Card key={doc.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(doc.upload_date || doc.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handlePreview(doc)}
                              title="Visualizar"
                              disabled={loadingPreviewDocId === doc.id}
                            >
                              {loadingPreviewDocId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(doc.file_path, doc.file_name)}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setDocumentToDelete({ id: doc.id, name: doc.file_name });
                                setDeleteDialogOpen(true);
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-6 text-center text-muted-foreground">
                        Nenhum documento anexado para esta movimentação.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento "{documentToDelete?.name}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) deleteMutation.mutate(documentToDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
