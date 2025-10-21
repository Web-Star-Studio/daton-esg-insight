import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { MultiFileUploadZone } from './MultiFileUploadZone';
import { documentExtractionService } from '@/services/documentExtraction';

export function DocumentAIAnalysis() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    
    try {
      const totalFiles = uploadedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = uploadedFiles[i].file;
        setCurrentStep(`Processando ${i+1}/${totalFiles}: ${file.name}`);
        setProgress(Math.floor((i / totalFiles) * 100));
        
        // Upload usando o serviço de extração
        const fileRecord = await documentExtractionService.uploadFile(file);
        
        // Start extraction/processing
        await documentExtractionService.startExtraction(fileRecord.id);
      }
      
      setProgress(100);
      setCurrentStep('Concluído!');
      toast.success(`${totalFiles} arquivo(s) processado(s) com sucesso!`);
      setUploadedFiles([]);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Erro no processamento');
      toast.error('Erro ao processar documentos');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Análise Inteligente com IA
        </CardTitle>
        <CardDescription>
          Suporte para PDF, Excel, CSV, imagens e mais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MultiFileUploadZone 
          onFilesSelected={setUploadedFiles} 
          maxFiles={10}
          acceptedTypes={['pdf', 'xlsx', 'xls', 'csv', 'jpg', 'png', 'json']}
          showPreview={true}
        />
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {currentStep || 'Processando...'}
            </p>
          </div>
        )}
        
        <Button 
          onClick={handleAnalyze} 
          disabled={uploadedFiles.length === 0 || isAnalyzing} 
          className="w-full" 
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {uploadedFiles.length > 0 
                ? `Processar ${uploadedFiles.length} Arquivo(s)` 
                : 'Processar Documentos'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
