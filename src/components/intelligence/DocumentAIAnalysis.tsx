import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentInsights } from './DocumentInsights';

interface AnalysisResult {
  insights: {
    summary: string;
    key_findings: string[];
    recommendations: string[];
    data_quality: {
      score: number;
      issues: string[];
    };
  };
  visualizations: Array<{
    type: 'bar' | 'line' | 'pie' | 'table';
    title: string;
    data: any;
  }>;
  extracted_data: {
    fields: Record<string, any>;
    confidence: Record<string, number>;
    target_tables: string[];
  };
}

export function DocumentAIAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Tipo de arquivo não suportado', {
          description: 'Use PDF, Excel ou imagens (PNG/JPG)'
        });
        return;
      }

      setFile(selectedFile);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Upload file to storage
      setProgress(20);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const fileName = `analysis/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Create document record
      setProgress(40);
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: profile.company_id,
          uploader_user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          related_model: 'analysis',
          related_id: crypto.randomUUID()
        })
        .select()
        .single();

      if (docError) throw docError;

      // 3. Call AI analysis function
      setProgress(60);
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('document-insights-generator', {
          body: {
            document_id: document.id,
            generate_visualizations: true
          }
        });

      if (analysisError) throw analysisError;

      setProgress(100);
      setAnalysisResult(analysisData);
      toast.success('Análise concluída!', {
        description: 'Insights e visualizações gerados com sucesso'
      });

    } catch (err) {
      console.error('Analysis error:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro na análise', { description: message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {file ? file.name : 'Clique para selecionar um arquivo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, Excel ou Imagens (máx. 20MB)
                </p>
              </div>
            </label>
          </div>

          {file && !analysisResult && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
              size="lg"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                {progress < 40 ? 'Processando arquivo...' :
                 progress < 80 ? 'Analisando conteúdo...' :
                 'Gerando insights...'}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <DocumentInsights
          insights={analysisResult.insights}
          visualizations={analysisResult.visualizations}
          extractedData={analysisResult.extracted_data}
          onInsertData={() => {
            // Navigate to extracted data tab
            toast.info('Dados prontos para inserção', {
              description: 'Vá para a aba "Dados Extraídos" para revisar e inserir'
            });
          }}
        />
      )}
    </div>
  );
}
