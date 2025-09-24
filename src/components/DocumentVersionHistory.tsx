import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { documentVersionsService } from '@/services/gedDocuments';
import { History, Download, Eye, FileText, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DocumentVersionHistoryProps {
  documentId: string;
  documentName: string;
}

export const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  documentId,
  documentName
}) => {
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isVersionViewOpen, setIsVersionViewOpen] = useState(false);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => documentVersionsService.getVersions(documentId),
  });

  const handleViewVersion = (version: any) => {
    setSelectedVersion(version);
    setIsVersionViewOpen(true);
  };

  const handleDownloadVersion = async (version: any) => {
    if (!version.file_path) {
      toast.error('Arquivo não disponível para download');
      return;
    }
    
    try {
      // Implementar download da versão específica
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const getVersionBadgeVariant = (version: any) => {
    if (version.is_current) return 'default';
    return 'secondary';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Versões - {documentName}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando versões...</div>
              </div>
            ) : !versions?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma versão encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <Card key={version.id} className="transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={getVersionBadgeVariant(version)}>
                            v{version.version_number}
                            {version.is_current && ' (Atual)'}
                          </Badge>
                          <CardTitle className="text-lg">{version.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewVersion(version)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Button>
                          {version.file_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadVersion(version)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(version.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Por: {version.created_by_user_id}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tamanho: {formatFileSize(version.file_size)}
                        </div>
                      </div>

                      {version.changes_summary && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Resumo das Alterações:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {version.changes_summary}
                          </p>
                        </div>
                      )}

                      {version.metadata && Object.keys(version.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-foreground mb-2">
                            Metadados:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(version.metadata).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-muted-foreground">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version View Modal */}
      <Dialog open={isVersionViewOpen} onOpenChange={setIsVersionViewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Versão {selectedVersion?.version_number} - {selectedVersion?.title}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {selectedVersion && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações da Versão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Número da Versão:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedVersion.version_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Data de Criação:</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedVersion.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tamanho do Arquivo:</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedVersion.file_size)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status:</p>
                        <Badge variant={selectedVersion.is_current ? 'default' : 'secondary'}>
                          {selectedVersion.is_current ? 'Versão Atual' : 'Versão Anterior'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {selectedVersion.changes_summary && (
                      <div>
                        <p className="text-sm font-medium mb-2">Resumo das Alterações:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {selectedVersion.changes_summary}
                        </p>
                      </div>
                    )}

                    {selectedVersion.content_hash && (
                      <div>
                        <p className="text-sm font-medium">Hash do Conteúdo:</p>
                        <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded-md">
                          {selectedVersion.content_hash}
                        </p>
                      </div>
                    )}

                    {selectedVersion.metadata && Object.keys(selectedVersion.metadata).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Metadados Adicionais:</p>
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs text-muted-foreground">
                            {JSON.stringify(selectedVersion.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4">
            {selectedVersion?.file_path && (
              <Button
                onClick={() => handleDownloadVersion(selectedVersion)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download desta Versão
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};