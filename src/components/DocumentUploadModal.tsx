import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, File, Plus, Bot, Zap, FileText, Brain, CheckCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { uploadDocument } from '@/services/documents';
import { processDocumentWithAI } from '@/services/documentAI';
import { logger } from '@/utils/logger';
import { useAutoAIProcessing } from '@/hooks/useAutoAIProcessing';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedFolderId?: string | null;
}

interface ProcessingResult {
  documentId: string;
  fileName: string;
  aiJobId?: string;
  category?: string;
  confidence?: number;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedFolderId
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processWithAI, setProcessWithAI] = useState(true);
  const [aiProcessingStatus, setAIProcessingStatus] = useState<string>('');
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  
  // Check if auto AI processing is enabled
  const { data: autoProcessing } = useAutoAIProcessing();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const detectFileCategory = (fileName: string, fileType: string): string => {
    const name = fileName.toLowerCase();
    
    if (name.includes('energia') || name.includes('eletrica') || name.includes('light') || name.includes('cemig')) {
      return 'Energia Elétrica';
    }
    
    if (name.includes('residuo') || name.includes('mtr') || name.includes('waste')) {
      return 'Resíduos';
    }
    
    if (name.includes('combustivel') || name.includes('gasolina') || name.includes('diesel')) {
      return 'Combustível';
    }
    
    if (name.includes('licenca') || name.includes('license') || name.includes('permit')) {
      return 'Licença';
    }

    if (fileType.includes('pdf')) {
      return 'PDF Documento';
    }

    if (fileType.includes('sheet') || fileType.includes('excel')) {
      return 'Planilha';
    }

    return 'Documento Geral';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingResults([]);

    try {
      const results: ProcessingResult[] = [];
      const isAutoProcessingEnabled = autoProcessing?.enabled || false;

      // Fase 1: Upload dos arquivos
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const document = await uploadDocument(file, {
          folder_id: selectedFolderId || undefined,
          tags: tags.length > 0 ? tags : undefined,
          // Skip auto processing if we want to do manual processing OR if auto is disabled
          skipAutoProcessing: !isAutoProcessingEnabled && !processWithAI,
          onProgress: (progress) => {
            const totalProgress = ((i / files.length) * 50) + (progress / files.length / 2);
            setUploadProgress(Math.round(totalProgress));
          }
        });

        results.push({
          documentId: document.id,
          fileName: file.name,
          category: detectFileCategory(file.name, file.type)
        });
      }

      setProcessingResults(results);
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso`);

      // Fase 2: Processamento manual com IA (apenas se auto-processing está DESATIVADO e toggle está ativado)
      if (!isAutoProcessingEnabled && processWithAI) {
        setAIProcessingStatus('Iniciando processamento com IA...');
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          
          try {
            setAIProcessingStatus(`Processando: ${result.fileName}`);
            
            const aiResult = await processDocumentWithAI(result.documentId);
            
            // Atualizar resultado com informações da IA
            results[i].aiJobId = aiResult.jobId;
            
            const aiProgress = 50 + ((i + 1) / results.length) * 50;
            setUploadProgress(Math.round(aiProgress));
            
            toast.success(`IA iniciou processamento: ${result.fileName}`);
            
          } catch (aiError) {
            logger.warn(`AI processing failed for ${result.fileName}`, aiError);
            toast.error(`Falha no processamento IA: ${result.fileName}`);
          }
        }
        
        setAIProcessingStatus('Processamento com IA concluído!');
        toast.success('Documentos enviados para processamento IA');
      } else if (isAutoProcessingEnabled) {
        // Informar que o processamento automático está em andamento
        toast.success('Documentos sendo processados automaticamente pela IA em segundo plano');
        setAIProcessingStatus('Processamento automático em andamento...');
      }

      setUploadProgress(100);
      onSuccess();
      
      // Delay para mostrar o progresso completo
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      logger.error('Error uploading files', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setTags([]);
      setNewTag('');
      setUploadProgress(0);
      setAIProcessingStatus('');
      setProcessingResults([]);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <File className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Inteligente de Documentos
          </DialogTitle>
        </DialogHeader>

        {/* Auto-Processing Status Badge */}
        {autoProcessing?.enabled && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300 flex items-center justify-between">
              <span>
                <strong>Processamento automático ativado</strong>
                <br />
                Os documentos serão processados automaticamente após o upload.
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.location.href = '/configuracao'}
                type="button"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configurar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IA Processing Toggle - Only shown when auto-processing is disabled */}
          {!autoProcessing?.enabled && (
            <>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Processar com IA</Label>
                    <p className="text-xs text-muted-foreground">
                      Extração automática de dados dos documentos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={processWithAI}
                  onCheckedChange={setProcessWithAI}
                  disabled={uploading}
                />
              </div>

              {processWithAI && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    A IA analisará automaticamente seus documentos e extrairá dados relevantes 
                    para facilitar a importação para o sistema ESG/GHG. 
                    Os dados extraídos serão disponibilizados para revisão manual.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* File Drop Zone */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/25"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  Arraste documentos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporte para PDF, Excel, CSV • Máximo 10MB por arquivo
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Selecionar Arquivos
              </Button>
            </div>
          </div>

          {/* Selected Files with AI Preview */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Arquivos Selecionados ({files.length})
              </Label>
              
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => {
                  const detectedCategory = detectFileCategory(file.name, file.type);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.name, file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                            {processWithAI && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {detectedCategory}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={uploading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeTag(tag)}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Processing Status */}
          {uploading && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-medium">
                    {aiProcessingStatus || 'Enviando arquivos...'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              
              <Progress value={uploadProgress} className="h-2" />
              
              {processingResults.length > 0 && (
                <div className="space-y-2">
                  {processingResults.map((result, index) => (
                    <div key={result.documentId} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="truncate">{result.fileName}</span>
                      {result.aiJobId && (
                        <Badge variant="outline" className="text-xs">
                          <Bot className="h-3 w-3 mr-1" />
                          IA Processando
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={files.length === 0 || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processando...
                </>
              ) : (
                <>
                  {processWithAI && <Bot className="h-4 w-4" />}
                  Enviar {files.length} arquivo(s)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};