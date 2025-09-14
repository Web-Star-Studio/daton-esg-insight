import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { documentExtractionService, FileRecord, ExtractionStatus } from "@/services/documentExtraction";

const DocumentAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileId = searchParams.get('file_id');

  const [currentState, setCurrentState] = useState<'waiting' | 'processing' | 'completed' | 'error'>('waiting');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileRecord, setFileRecord] = useState<FileRecord | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load existing file if file_id in URL
  useEffect(() => {
    if (fileId) {
      loadExistingFile(fileId);
    }
  }, [fileId]);

  // Polling for extraction status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (currentState === 'processing' && (fileId || extractionId)) {
      intervalId = setInterval(async () => {
        try {
          const status = await documentExtractionService.getExtractionStatus(
            fileId || '', 
            extractionId || undefined
          );
          
          setExtractionStatus(status);
          
          if (status.status === 'completed') {
            setCurrentState('completed');
            setExtractionId(status.extraction_id || null);
            toast.success(`Extração concluída! ${status.items_count || 0} itens extraídos.`);
          } else if (status.status === 'failed' || status.status === 'error') {
            setCurrentState('error');
            setError(status.message);
            toast.error(`Erro na extração: ${status.message}`);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentState, fileId, extractionId]);

  const loadExistingFile = async (fileId: string) => {
    try {
      const file = await documentExtractionService.getFile(fileId);
      setFileRecord(file);
      
      if (file.status === 'extracted') {
        setCurrentState('completed');
        // Get extraction ID
        const status = await documentExtractionService.getExtractionStatus(fileId);
        setExtractionId(status.extraction_id || null);
        setExtractionStatus(status);
      } else if (file.status === 'failed') {
        setCurrentState('error');
        setError(file.error || 'Extraction failed');
      } else if (file.status === 'parsed') {
        setCurrentState('processing');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setError('Arquivo não encontrado');
      setCurrentState('error');
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/csv', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, CSV, Excel ou TXT.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.');
      return;
    }

    setUploadedFile(file);
    setCurrentState('processing');
    setError(null);
    setRetryCount(0);

    try {
      // Upload file and create record
      const fileRecord = await documentExtractionService.uploadFile(file);
      setFileRecord(fileRecord);
      
      // Update URL with file_id
      setSearchParams({ file_id: fileRecord.id });
      
      toast.success('Arquivo enviado com sucesso!');
      
      // Start extraction
      const result = await documentExtractionService.startExtraction(fileRecord.id);
      
      if (result.ok && result.extraction_id) {
        setExtractionId(result.extraction_id);
        toast.info('Iniciando análise do documento...');
      } else {
        throw new Error(result.error || 'Falha ao iniciar extração');
      }
    } catch (error) {
      console.error('Upload/extraction error:', error);
      setCurrentState('error');
      setError(error instanceof Error ? error.message : 'Erro no upload');
      toast.error('Erro no upload ou extração do documento');
    }
  };

  const handleRetry = async () => {
    if (!fileRecord) return;
    
    const delays = [5000, 15000, 45000]; // 5s, 15s, 45s
    const delay = delays[Math.min(retryCount, delays.length - 1)];
    
    setRetryCount(prev => prev + 1);
    setError(null);
    setCurrentState('processing');
    
    toast.info(`Tentando novamente em ${delay/1000}s...`);
    
    setTimeout(async () => {
      try {
        const result = await documentExtractionService.startExtraction(fileRecord.id);
        
        if (result.ok && result.extraction_id) {
          setExtractionId(result.extraction_id);
        } else {
          throw new Error(result.error || 'Falha ao reiniciar extração');
        }
      } catch (error) {
        console.error('Retry error:', error);
        setCurrentState('error');
        setError(error instanceof Error ? error.message : 'Erro na nova tentativa');
      }
    }, delay);
  };

  const handleNext = () => {
    if (extractionId && fileId) {
      navigate(`/licenciamento/reconciliacao?file_id=${fileId}&extraction_id=${extractionId}`);
    }
  };

  const handleViewFile = async () => {
    if (fileRecord) {
      try {
        const url = await documentExtractionService.getFileUrl(fileRecord.storage_path);
        window.open(url, '_blank');
      } catch (error) {
        toast.error('Erro ao abrir arquivo');
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const renderWaitingState = () => (
    <Card>
      <CardHeader>
        <CardTitle>Análise Inteligente do Documento</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
            isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-primary/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-all duration-200",
            isDragOver ? "text-primary scale-110" : "text-muted-foreground"
          )} />
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? "Solte o arquivo aqui" : "Envie seu documento"}
          </h3>
          <p className="text-muted-foreground mb-4">
            Arraste e solte ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, CSV, Excel até 20MB
          </p>
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".pdf,.csv,.xlsx,.xls,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingState = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Processando Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fileRecord && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{fileRecord.original_name}</p>
                <p className="text-sm text-blue-600">
                  {(fileRecord.size_bytes / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleViewFile}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progresso da Análise</span>
            <span>{extractionStatus?.progress || 0}%</span>
          </div>
          <Progress value={extractionStatus?.progress || 0} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {extractionStatus?.message || 'Iniciando processamento...'}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Preparando arquivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              (extractionStatus?.progress || 0) > 20 ? "bg-green-500" : "bg-gray-300"
            )}></div>
            <span>Extraindo texto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              (extractionStatus?.progress || 0) > 50 ? "bg-green-500" : "bg-gray-300"
            )}></div>
            <span>Extraindo tabelas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              (extractionStatus?.progress || 0) > 70 ? "bg-green-500" : "bg-gray-300"
            )}></div>
            <span>Chamando IA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              (extractionStatus?.progress || 0) > 90 ? "bg-green-500" : "bg-gray-300"
            )}></div>
            <span>Normalizando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              (extractionStatus?.progress || 0) >= 100 ? "bg-green-500" : "bg-gray-300"
            )}></div>
            <span>Salvando resultados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletedState = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          Análise Concluída
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fileRecord && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{fileRecord.original_name}</p>
                <p className="text-sm text-green-600">
                  Processado com sucesso
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleViewFile}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}

        {extractionStatus && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Itens extraídos:</span>
              <p className="font-semibold">{extractionStatus.items_count || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Qualidade:</span>
              <p className="font-semibold">
                {extractionStatus.quality_score ? 
                  `${Math.round(extractionStatus.quality_score * 100)}%` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleNext} className="w-full" size="lg">
          Revisar Dados Extraídos
        </Button>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Erro na Análise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Erro desconhecido durante a análise'}
          </AlertDescription>
        </Alert>

        {fileRecord && (
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">{fileRecord.original_name}</p>
                <p className="text-sm text-red-600">Falha no processamento</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" className="flex-1">
            Tentar Novamente ({retryCount}/3)
          </Button>
          <Button 
            onClick={() => {
              setCurrentState('waiting');
              setError(null);
              setFileRecord(null);
              setUploadedFile(null);
              setSearchParams({});
            }}
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise Inteligente do Documento</h1>
          <p className="text-muted-foreground">
            Etapa 2 de 6: Extração automática de dados usando IA
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {currentState === 'waiting' && renderWaitingState()}
          {currentState === 'processing' && renderProcessingState()}
          {currentState === 'completed' && renderCompletedState()}
          {currentState === 'error' && renderErrorState()}
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentAnalysis;