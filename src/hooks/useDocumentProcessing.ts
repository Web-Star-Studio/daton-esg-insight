import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { parseFileClientSide } from '@/utils/clientSideParsers';

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
    const { onProgress } = options;
    
    setIsProcessing(true);
    setResults([]);
    setInsights([]);
    
    const processingResults: ProcessingResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i + 1, files.length, file.name);
        
        try {
          // Process client-side
          const parsed = await parseFileClientSide(file);
          
          if (parsed.success) {
            processingResults.push({
              fileName: file.name,
              status: 'success',
              documentType: file.type,
              entitiesExtracted: parsed.structured?.totalRows || 0
            });
          } else {
            processingResults.push({
              fileName: file.name,
              status: 'error',
              error: parsed.error || 'Erro ao processar arquivo'
            });
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
