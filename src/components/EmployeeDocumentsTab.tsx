import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { FileText, Upload, Download, Trash2, Search, File, Image, Sheet } from 'lucide-react';
import { getEmployeeDocuments, downloadEmployeeDocument, deleteEmployeeDocument, formatFileSize, getDocumentStats } from '@/services/employeeDocuments';
import { EmployeeDocumentUploadModal } from './EmployeeDocumentUploadModal';
import { unifiedToast } from '@/utils/unifiedToast';

interface EmployeeDocumentsTabProps {
  employeeId: string;
  employeeName: string;
}

export function EmployeeDocumentsTab({ employeeId, employeeName }: EmployeeDocumentsTabProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => getEmployeeDocuments(employeeId),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['employee-document-stats', employeeId],
    queryFn: () => getDocumentStats(employeeId),
    enabled: documents.length > 0,
  });

  const filteredDocuments = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const url = await downloadEmployeeDocument(documentId);
      
      // Criar link temporário e fazer download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      unifiedToast.success('Download iniciado!');
    } catch (error) {
      console.error('Download error:', error);
      unifiedToast.error('Erro ao fazer download do documento');
    }
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteEmployeeDocument(documentToDelete);
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-document-stats', employeeId] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5" />;
    }
    if (fileType.includes('image')) {
      return <Image className="h-5 w-5" />;
    }
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <Sheet className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando documentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive">Erro ao carregar documentos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
                {documents.length > 0 && (
                  <Badge variant="secondary">{documents.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Documentos e arquivos relacionados ao funcionário
                {stats && (
                  <span className="ml-2">• {stats.totalSizeFormatted} total</span>
                )}
              </CardDescription>
            </div>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Documentos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Documents List */}
              {filteredDocuments.length > 0 ? (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-muted-foreground">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.file_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {doc.tags && doc.tags.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {doc.tags[0]}
                              </Badge>
                            )}
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.upload_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum documento encontrado</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum documento</h3>
              <p className="text-muted-foreground mb-4">
                Este funcionário ainda não possui documentos anexados
              </p>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Primeiro Documento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <EmployeeDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
          queryClient.invalidateQueries({ queryKey: ['employee-document-stats', employeeId] });
        }}
        employeeId={employeeId}
        employeeName={employeeName}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
