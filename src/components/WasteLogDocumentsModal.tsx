import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWasteLogDocuments, uploadWasteDocument, deleteWasteDocument } from "@/services/waste";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Upload, Loader2, Eye, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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

interface WasteLogDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteLogId: string;
}

export function WasteLogDocumentsModal({ open, onOpenChange, wasteLogId }: WasteLogDocumentsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['waste-logs', 'documents', wasteLogId],
    queryFn: () => getWasteLogDocuments(wasteLogId),
    enabled: open && !!wasteLogId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingFile(true);
      return uploadWasteDocument(wasteLogId, file);
    },
    onSuccess: () => {
      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['waste-logs', 'documents', wasteLogId] });
      setUploadingFile(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWasteDocument,
    onSuccess: () => {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['waste-logs', 'documents', wasteLogId] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao baixar documento",
        description: "Não foi possível baixar o documento.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (filePath: string, fileName: string, fileType?: string) => {
    // For unsupported formats (DOC/DOCX), open via download instead
    const isViewable = !fileType || 
      fileType.includes('pdf') || 
      fileType.includes('image');

    if (!isViewable) {
      // Download and open in new tab
      handleDownload(filePath, fileName);
      return;
    }

    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      setPreviewDoc({ url: data.signedUrl, name: fileName });
    } catch (error) {
      toast({
        title: "Erro ao visualizar",
        description: "Não foi possível gerar o link de visualização.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmDelete = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPreviewDoc(null);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${previewDoc ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <DialogHeader>
            <DialogTitle>
              {previewDoc ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewDoc(null)}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="truncate">{previewDoc.name}</span>
                </div>
              ) : (
                "Documentos (CDF/MTR)"
              )}
            </DialogTitle>
          </DialogHeader>

          {previewDoc ? (
            <div className="min-h-[500px]">
              <DocumentViewer fileUrl={previewDoc.url} fileName={previewDoc.name} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Area */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <label htmlFor="file-upload" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploadingFile}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Documento
                          </>
                        )}
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                  </p>
                </CardContent>
              </Card>

              {/* Documents List */}
              <div className="space-y-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : documents && documents.length > 0 ? (
                  documents.map((doc: any) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handlePreview(doc.file_path, doc.file_name, doc.file_type)}
                              title="Visualizar documento"
                              disabled={loadingPreview}
                            >
                              {loadingPreview ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(doc.file_path, doc.file_name)}
                              title="Baixar documento"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => confirmDelete(doc.id)}
                              title="Excluir documento"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Nenhum documento anexado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Faça upload de MTR, CDF ou outros documentos relacionados
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
