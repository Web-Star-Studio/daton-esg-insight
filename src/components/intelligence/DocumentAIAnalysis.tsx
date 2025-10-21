import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Sparkles, CheckCircle, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { MultiFileUploadZone } from './MultiFileUploadZone';
import { SmartInsightsPanel } from './SmartInsightsPanel';
import { documentExtractionService } from '@/services/documentExtraction';
import { supabase } from '@/integrations/supabase/client';

interface ProcessingResult {
  fileName: string;
  status: 'success' | 'error' | 'processing';
  documentType?: string;
  entitiesExtracted?: number;
  autoInserted?: boolean;
  error?: string;
}

export function DocumentAIAnalysis() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResults([]);
    setInsights([]);
    setShowInsights(false);
    
    try {
      const totalFiles = uploadedFiles.length;
      const processingResults: ProcessingResult[] = [];
      
      for (let i = 0; i < totalFiles; i++) {
        const file = uploadedFiles[i].file;
        setCurrentStep(`Analisando ${i+1}/${totalFiles}: ${file.name}`);
        setProgress(Math.floor((i / totalFiles) * 90));
        
        try {
          // Upload file
          const fileRecord = await documentExtractionService.uploadFile(file);
          
          // Call intelligent pipeline orchestrator
          const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke(
            'intelligent-pipeline-orchestrator',
            {
              body: {
                file_id: fileRecord.id,
                file_path: fileRecord.storage_path,
                options: {
                  auto_insert: true,
                  generate_insights: true
                }
              }
            }
          );

          if (pipelineError) throw pipelineError;

          processingResults.push({
            fileName: file.name,
            status: 'success',
            documentType: pipelineResult?.classification?.document_type,
            entitiesExtracted: pipelineResult?.extraction?.entities_count,
            autoInserted: pipelineResult?.inserted_count > 0
          });

          // Collect insights
          if (pipelineResult?.insights) {
            setInsights(prev => [...prev, ...pipelineResult.insights]);
          }
        } catch (err) {
          processingResults.push({
            fileName: file.name,
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido'
          });
        }
      }
      
      setResults(processingResults);
      setProgress(100);
      setCurrentStep('Processamento concluído!');
      
      const successCount = processingResults.filter(r => r.status === 'success').length;
      const errorCount = processingResults.filter(r => r.status === 'error').length;
      
      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) processado(s) com sucesso!`);
        setShowInsights(true);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} arquivo(s) com erro`);
      }
      
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Análise Inteligente com IA
          </CardTitle>
          <CardDescription>
            Suporte para PDF, Excel, CSV, imagens e mais. O sistema classifica automaticamente e insere dados validados.
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
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-4 w-4 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  {currentStep || 'Processando...'}
                </p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Resultados do Processamento:</h4>
              {results.map((result, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.fileName}</p>
                    {result.status === 'success' ? (
                      <p className="text-muted-foreground">
                        Tipo: {result.documentType || 'Desconhecido'} • 
                        {result.entitiesExtracted} entidades • 
                        {result.autoInserted ? 'Inserido automaticamente' : 'Aguardando revisão'}
                      </p>
                    ) : (
                      <p className="text-destructive">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
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
                Processando com IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {uploadedFiles.length > 0 
                  ? `Processar ${uploadedFiles.length} Arquivo(s) com IA` 
                  : 'Processar Documentos'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {showInsights && insights.length > 0 && (
        <SmartInsightsPanel insights={insights} isLoading={false} />
      )}
    </div>
  );
}
