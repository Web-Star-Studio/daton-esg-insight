import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  ExternalLink,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  X
} from 'lucide-react';
import { getDocumentPreview, downloadDocument } from '@/services/documents';
import type { Document } from '@/services/documents';
import { toast } from 'sonner';

interface DocumentPreviewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && isOpen) {
      loadPreview();
    }

    return () => {
      setPreviewUrl(null);
      setError(null);
    };
  }, [document, isOpen]);

  const loadPreview = async () => {
    if (!document) return;

    try {
      setLoading(true);
      setError(null);

      const preview = await getDocumentPreview(document.id);
      setPreviewUrl(preview.url);
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Não foi possível carregar a visualização');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const { url, fileName } = await downloadDocument(document.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf') || fileType.includes('text')) return FileText;
    if (fileType.includes('image')) return Image;
    if (fileType.includes('video')) return Video;
    if (fileType.includes('audio')) return Music;
    return Archive;
  };

  const canPreview = (fileType: string) => {
    return (
      fileType.includes('pdf') ||
      fileType.includes('image') ||
      fileType.includes('text')
    );
  };

  const renderPreview = () => {
    if (!document || loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPreview} variant="outline" size="sm">
            Tentar Novamente
          </Button>
        </div>
      );
    }

    if (!canPreview(document.file_type)) {
      const IconComponent = getFileIcon(document.file_type);
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <IconComponent className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Visualização não disponível para este tipo de arquivo
          </p>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar para Visualizar
          </Button>
        </div>
      );
    }

    if (document.file_type.includes('image') && previewUrl) {
      return (
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt={document.file_name}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onError={() => setError('Erro ao carregar imagem')}
          />
        </div>
      );
    }

    if (document.file_type.includes('pdf') && previewUrl) {
      return (
        <div className="w-full h-96">
          <iframe
            src={previewUrl}
            className="w-full h-full border rounded-lg"
            title={document.file_name}
          />
        </div>
      );
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <span className="truncate">{document.file_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Enviado em: {formatDate(document.upload_date)}</span>
            <span>Tamanho: {formatFileSize(document.file_size)}</span>
            <span>Tipo: {document.file_type}</span>
            {document.document_folders && (
              <span>Pasta: {document.document_folders.name}</span>
            )}
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Preview Area */}
          <div className="border rounded-lg p-4 min-h-[300px]">
            {renderPreview()}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {previewUrl && canPreview(document.file_type) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
            
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};