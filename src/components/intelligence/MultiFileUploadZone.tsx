import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface MultiFileUploadZoneProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  showPreview?: boolean;
}

export function MultiFileUploadZone({
  onFilesSelected,
  maxFiles = 10,
  acceptedTypes = ['pdf', 'xlsx', 'docx', 'csv', 'jpg', 'png', 'xls'],
  showPreview = true,
}: MultiFileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return Image;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadedFile[] = [];
      const fileArray = Array.from(files).slice(0, maxFiles - uploadedFiles.length);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      // Normalizar acceptedTypes removendo pontos e convertendo para minúsculas
      const normalizedTypes = acceptedTypes.map(type => 
        type.startsWith('.') ? type.slice(1).toLowerCase() : type.toLowerCase()
      );

      let rejectedFiles: { name: string; reason: string }[] = [];

      for (const file of fileArray) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        // Validação de tipo
        if (!fileExtension || !normalizedTypes.includes(fileExtension)) {
          rejectedFiles.push({ 
            name: file.name, 
            reason: `Formato não aceito (apenas ${normalizedTypes.join(', ').toUpperCase()})` 
          });
          continue;
        }

        // Validação de tamanho
        if (file.size > MAX_FILE_SIZE) {
          rejectedFiles.push({ 
            name: file.name, 
            reason: `Tamanho excede 10MB (${formatFileSize(file.size)})` 
          });
          continue;
        }

        const fileId = crypto.randomUUID();
        let preview: string | undefined;

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        newFiles.push({
          file,
          id: fileId,
          preview,
          status: 'pending',
          progress: 0,
        });
      }

      // Feedback visual para arquivos rejeitados
      if (rejectedFiles.length > 0) {
        toast({
          title: `${rejectedFiles.length} arquivo(s) rejeitado(s)`,
          description: rejectedFiles.map(f => `• ${f.name}: ${f.reason}`).join('\n'),
          variant: 'destructive',
        });
      }

      if (newFiles.length > 0) {
        const updated = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updated);
        onFilesSelected(updated);
      }
    },
    [uploadedFiles, maxFiles, acceptedTypes, showPreview, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback(
    (id: string) => {
      const updated = uploadedFiles.filter((f) => f.id !== id);
      setUploadedFiles(updated);
      onFilesSelected(updated);
    },
    [uploadedFiles, onFilesSelected]
  );

  const clearAll = useCallback(() => {
    uploadedFiles.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setUploadedFiles([]);
    onFilesSelected([]);
  }, [uploadedFiles, onFilesSelected]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Máximo {maxFiles} arquivos • Formatos: {acceptedTypes.map(t => t.startsWith('.') ? t.slice(1) : t).join(', ').toUpperCase()} • Até 10MB por arquivo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = acceptedTypes.map((t) => `.${t}`).join(',');
                input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files);
                input.click();
              }}
            >
              Selecionar Arquivos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Arquivos Selecionados ({uploadedFiles.length}/{maxFiles})
              </h3>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Limpar Todos
              </Button>
            </div>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => {
                const Icon = getFileIcon(uploadedFile.file.type);
                return (
                  <div
                    key={uploadedFile.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    {/* Preview or Icon */}
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => removeFile(uploadedFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-2">
                        <Badge
                          variant={
                            uploadedFile.status === 'completed'
                              ? 'default'
                              : uploadedFile.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {uploadedFile.status === 'pending' && 'Pendente'}
                          {uploadedFile.status === 'uploading' && 'Enviando...'}
                          {uploadedFile.status === 'completed' && 'Completo'}
                          {uploadedFile.status === 'error' && 'Erro'}
                        </Badge>
                      </div>

                      {/* Progress */}
                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="mt-2" />
                      )}

                      {/* Error Message */}
                      {uploadedFile.error && (
                        <p className="text-xs text-destructive mt-1">{uploadedFile.error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
