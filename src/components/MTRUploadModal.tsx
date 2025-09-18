import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle, XCircle, Eye, AlertCircle } from "lucide-react";
import { 
  uploadMTRFile, 
  createMTRDocument, 
  processMTRDocument, 
  ExtractedMTRData 
} from "@/services/mtrDocuments";

interface MTRUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteLogId: string;
  onSuccess?: () => void;
}

interface ProcessingState {
  stage: 'uploading' | 'processing' | 'validating' | 'completed' | 'error';
  progress: number;
  message: string;
}

export function MTRUploadModal({ open, onOpenChange, wasteLogId, onSuccess }: MTRUploadModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'uploading',
    progress: 0,
    message: ''
  });
  const [extractedData, setExtractedData] = useState<ExtractedMTRData | null>(null);
  const [validationData, setValidationData] = useState<ExtractedMTRData>({});
  const [showValidation, setShowValidation] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF ou imagens são aceitos",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Tamanho máximo: 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingState({
      stage: 'uploading',
      progress: 10,
      message: 'Fazendo upload do arquivo...'
    });

    try {
      // Step 1: Upload file
      const filePath = await uploadMTRFile(file, wasteLogId);
      
      setProcessingState({
        stage: 'uploading',
        progress: 30,
        message: 'Upload concluído. Criando registro...'
      });

      // Step 2: Create MTR document record
      const document = await createMTRDocument(wasteLogId, filePath, file.name);

      setProcessingState({
        stage: 'processing',
        progress: 50,
        message: 'Processando documento com IA...'
      });

      // Step 3: Process with OCR/AI
      const processingResult = await processMTRDocument(document.id);

      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Erro no processamento');
      }

      setProcessingState({
        stage: 'validating',
        progress: 80,
        message: 'Extraindo dados do MTR...'
      });

      // Step 4: Set extracted data for validation
      if (processingResult.extracted_data) {
        setExtractedData(processingResult.extracted_data);
        setValidationData(processingResult.extracted_data);
        setShowValidation(true);
      }

      setProcessingState({
        stage: 'completed',
        progress: 100,
        message: 'Processamento concluído!'
      });

      toast({
        title: "Sucesso",
        description: "MTR processado com sucesso!",
        variant: "default"
      });

    } catch (error) {
      setProcessingState({
        stage: 'error',
        progress: 0,
        message: `Erro: ${error}`
      });
      
      toast({
        title: "Erro",
        description: `Erro ao processar MTR: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [wasteLogId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    disabled: isProcessing
  });

  const handleValidationSubmit = () => {
    // Here you would update the MTR document with validated data
    // For now, we'll just close the modal and call onSuccess
    onSuccess?.();
    onOpenChange(false);
    
    // Reset state
    setExtractedData(null);
    setValidationData({});
    setShowValidation(false);
    setProcessingState({
      stage: 'uploading',
      progress: 0,
      message: ''
    });
  };

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'error':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload de MTR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showValidation ? (
            <>
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selecionar Arquivo MTR</CardTitle>
                  <CardDescription>
                    Faça upload do MTR em PDF ou imagem para extração automática dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                      ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">
                          {isDragActive ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo MTR'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Suporte para PDF e imagens (PNG, JPG) até 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Status */}
              {isProcessing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(processingState.stage)}
                      Status do Processamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progresso</span>
                        <Badge variant="secondary" className={getStatusColor(processingState.stage)}>
                          {processingState.stage === 'uploading' && 'Enviando'}
                          {processingState.stage === 'processing' && 'Processando'}
                          {processingState.stage === 'validating' && 'Validando'}
                          {processingState.stage === 'completed' && 'Concluído'}
                          {processingState.stage === 'error' && 'Erro'}
                        </Badge>
                      </div>
                      <Progress value={processingState.progress} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {processingState.message}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Processing Completed */}
              {processingState.stage === 'completed' && extractedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Dados Extraídos
                    </CardTitle>
                    <CardDescription>
                      Verifique os dados extraídos automaticamente do MTR
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Número MTR</Label>
                        <p>{extractedData.mtr_number || 'Não identificado'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                        <p>{extractedData.issue_date || 'Não identificada'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Descrição do Resíduo</Label>
                        <p>{extractedData.waste_description || 'Não identificada'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantidade</Label>
                        <p>{extractedData.quantity ? `${extractedData.quantity} ${extractedData.unit || ''}` : 'Não identificada'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Transportador</Label>
                        <p>{extractedData.transporter_name || 'Não identificado'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Destinador</Label>
                        <p>{extractedData.destination_name || 'Não identificado'}</p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowValidation(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Validar Dados
                      </Button>
                      <Button onClick={handleValidationSubmit}>
                        Confirmar e Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Validation Form */
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Validação dos Dados Extraídos
                </CardTitle>
                <CardDescription>
                  Confira e corrija os dados extraídos automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mtr_number">Número MTR</Label>
                    <Input
                      id="mtr_number"
                      value={validationData.mtr_number || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, mtr_number: e.target.value }))}
                      placeholder="Número do MTR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Data de Emissão</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={validationData.issue_date || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waste_description">Descrição do Resíduo</Label>
                  <Input
                    id="waste_description"
                    value={validationData.waste_description || ''}
                    onChange={(e) => setValidationData(prev => ({ ...prev, waste_description: e.target.value }))}
                    placeholder="Descrição do resíduo"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={validationData.quantity || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={validationData.unit || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="kg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waste_class">Classe</Label>
                    <Input
                      id="waste_class"
                      value={validationData.waste_class || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, waste_class: e.target.value }))}
                      placeholder="Classe do resíduo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transporter_name">Transportador</Label>
                    <Input
                      id="transporter_name"
                      value={validationData.transporter_name || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, transporter_name: e.target.value }))}
                      placeholder="Nome do transportador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination_name">Destinador</Label>
                    <Input
                      id="destination_name"
                      value={validationData.destination_name || ''}
                      onChange={(e) => setValidationData(prev => ({ ...prev, destination_name: e.target.value }))}
                      placeholder="Nome do destinador"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowValidation(false)}
                  >
                    Voltar
                  </Button>
                  <Button onClick={handleValidationSubmit}>
                    Confirmar e Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}