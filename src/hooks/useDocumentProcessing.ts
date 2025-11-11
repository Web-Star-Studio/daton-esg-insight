import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadDocument } from '@/services/documents';
import { toast } from 'sonner';

export interface ProcessingResult {
  fileName: string;
  status: 'success' | 'error' | 'processing';
  documentType?: string;
  entitiesExtracted?: number;
  autoInserted?: boolean;
  error?: string;
  documentId?: string;
}

export interface ProcessingOptions {
  autoInsert?: boolean;
  generateInsights?: boolean;
  onProgress?: (current: number, total: number, fileName: string) => void;
}

export function useDocumentProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  const processFiles = useCallback(async (
    files: File[],
    options: ProcessingOptions = {}
  ) => {
    const { autoInsert = true, generateInsights = true, onProgress } = options;
    
    setIsProcessing(true);
    setResults([]);
    setInsights([]);
    
    const processingResults: ProcessingResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i + 1, files.length, file.name);
        
        try {
          // Upload usando serviço unificado
          const uploadedDoc = await uploadDocument(file, {
            skipAutoProcessing: true,
            tags: ['batch-processing']
          });
          
          // Process through intelligent pipeline com document_id
          const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke(
            'intelligent-pipeline-orchestrator',
            {
              body: {
                document_id: uploadedDoc.id,
                options: {
                  auto_insert: autoInsert,
                  generate_insights: generateInsights,
                  auto_insert_threshold: 0.85
                }
              }
            }
          );

          if (pipelineError) {
            // Tratamento específico de erros
            if (pipelineError.message?.includes('429')) {
              throw new Error('Limite de taxa atingido. Aguarde alguns instantes.');
            }
            if (pipelineError.message?.includes('402')) {
              throw new Error('Créditos de IA esgotados. Adicione créditos em Configurações.');
            }
            throw pipelineError;
          }

          processingResults.push({
            fileName: file.name,
            status: 'success',
            documentType: pipelineResult?.classification?.document_type,
            entitiesExtracted: pipelineResult?.extraction?.entities_count,
            autoInserted: pipelineResult?.inserted_count > 0,
            documentId: uploadedDoc.id
          });

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
      
      const successCount = processingResults.filter(r => r.status === 'success').length;
      const errorCount = processingResults.filter(r => r.status === 'error').length;
      
      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) processado(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} arquivo(s) com erro`);
      }
      
      return processingResults;
    } catch (err) {
      console.error('Processing error:', err);
      toast.error('Erro ao processar documentos');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setInsights([]);
  }, []);

  return {
    isProcessing,
    results,
    insights,
    processFiles,
    clearResults
  };
}
