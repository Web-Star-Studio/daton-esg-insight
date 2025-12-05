import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  FileImage, 
  FileVideo,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  getTrainingDocuments,
  uploadTrainingDocument,
  deleteTrainingDocument,
  downloadTrainingDocument,
  TrainingDocument,
} from '@/services/trainingDocuments';

interface TrainingDocumentsTabProps {
  programId: string;
}

export function TrainingDocumentsTab({ programId }: TrainingDocumentsTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<TrainingDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['training-documents', programId],
    queryFn: () => getTrainingDocuments(programId),
    enabled: !!programId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadTrainingDocument(programId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-documents', programId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar documento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrainingDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-documents', programId] });
      toast.success('Documento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir documento');
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (document: TrainingDocument) => {
    try {
      await downloadTrainingDocument(document);
      toast.success('Download iniciado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao baixar documento');
    }
  };

  const confirmDelete = (document: TrainingDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-8 h-8 text-muted-foreground" />;
    
    if (fileType.includes('image')) {
      return <FileImage className="w-8 h-8 text-blue-500" />;
    }
    if (fileType.includes('video')) {
      return <FileVideo className="w-8 h-8 text-purple-500" />;
    }
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Upload Button */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Documentos do Treinamento</h3>
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Enviar Documento
            </Button>
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum documento anexado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Enviar Documento" para adicionar arquivos ao treinamento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.file_type)}
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.file_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
