import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { importFactorsFromFile } from "@/services/factorImport";

interface ImportFactorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  details: Array<{
    row: number;
    status: "success" | "error" | "warning";
    message: string;
  }>;
}

export function ImportFactorsModal({ open, onOpenChange, onImportComplete }: ImportFactorsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await importFactorsFromFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setImportResult(result);

      toast({
        title: "Importação Concluída",
        description: `${result.success} fatores importados com sucesso. ${result.errors} erros encontrados.`,
        variant: result.errors > 0 ? "destructive" : "default",
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na Importação",
        description: "Falha ao processar o arquivo. Verifique o formato e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onImportComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isUploading
  });

  const handleClose = () => {
    if (!isUploading) {
      setImportResult(null);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `nome,categoria,unidade,co2_factor,ch4_factor,n2o_factor,fonte,ano_validade
Diesel S10 - Combustão Móvel,Combustão Móvel,Litro,2.671,0.0001,0.000045,Exemplo - Substitua pelos seus dados,2025
Gasolina Comum - Combustão Móvel,Combustão Móvel,Litro,2.292,0.0002,0.000032,Exemplo - Substitua pelos seus dados,2025`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_fatores_emissao.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Importar Fatores de Emissão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Template de Importação</h3>
                  <p className="text-sm text-muted-foreground">
                    Baixe o template CSV com o formato correto e exemplos
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Baixar Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Zone */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                  ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV/Excel aqui'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: .csv, .xls, .xlsx (máx. 10MB)
                  </p>
                </div>
              </div>

              {/* Progress */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando arquivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Resultado da Importação</h3>
                    <div className="flex gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {importResult.success} Sucessos
                      </Badge>
                      {importResult.errors > 0 && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          {importResult.errors} Erros
                        </Badge>
                      )}
                      {importResult.warnings > 0 && (
                        <Badge variant="secondary">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {importResult.warnings} Avisos
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.details.map((detail, index) => (
                      <div
                        key={index}
                        className={`text-xs p-2 rounded flex items-start gap-2 ${
                          detail.status === 'success' ? 'bg-green-50 text-green-800' :
                          detail.status === 'error' ? 'bg-red-50 text-red-800' :
                          'bg-yellow-50 text-yellow-800'
                        }`}
                      >
                        {detail.status === 'success' && <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                        {detail.status === 'error' && <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                        {detail.status === 'warning' && <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                        <span>
                          <span className="font-medium">Linha {detail.row}:</span> {detail.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {importResult ? 'Fechar' : 'Cancelar'}
            </Button>
            {importResult && importResult.success > 0 && (
              <Button onClick={handleClose}>
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}