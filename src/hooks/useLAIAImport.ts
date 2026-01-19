import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  parseLAIAExcel, 
  validateLAIAImport, 
  importLAIAAssessments,
  type ParsedLAIARow,
  type ValidationResult,
  type ImportResult,
} from '@/services/laiaImport';

interface ImportProgress {
  current: number;
  total: number;
  message: string;
}

export function useLAIAImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const companyId = user?.company?.id;
  
  const [parsedRows, setParsedRows] = useState<ParsedLAIARow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  
  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await parseLAIAExcel(file);
      return result;
    },
    onSuccess: (data) => {
      setParsedRows(data.rows);
      toast({
        title: 'Arquivo processado',
        description: `${data.rows.length} registros encontrados`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const validateMutation = useMutation({
    mutationFn: async (rows: ParsedLAIARow[]) => {
      if (!companyId) throw new Error('Empresa não encontrada');
      const result = await validateLAIAImport(rows, companyId);
      return result;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.isValid) {
        toast({
          title: 'Validação concluída',
          description: `${data.validRows.length} registros prontos para importação`,
        });
      } else {
        toast({
          title: 'Validação com erros',
          description: `${data.invalidRows.length} registros com problemas`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na validação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const importMutation = useMutation({
    mutationFn: async (rows: ParsedLAIARow[]) => {
      if (!companyId) throw new Error('Empresa não encontrada');
      
      const result = await importLAIAAssessments(rows, companyId, {
        createMissingSectors: true,
        onProgress: (current, total, message) => {
          setProgress({ current, total, message });
        },
      });
      
      return result;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setProgress(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['laia-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['laia-sectors'] });
      queryClient.invalidateQueries({ queryKey: ['laia-dashboard-stats'] });
      
      if (data.success) {
        toast({
          title: 'Importação concluída',
          description: `${data.imported} avaliações importadas com sucesso`,
        });
      } else {
        toast({
          title: 'Importação parcial',
          description: `${data.imported} importados, ${data.failed} com erro`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      setProgress(null);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const reset = useCallback(() => {
    setParsedRows([]);
    setValidationResult(null);
    setImportResult(null);
    setProgress(null);
  }, []);
  
  return {
    // State
    parsedRows,
    validationResult,
    importResult,
    progress,
    
    // Loading states
    isParsing: parseMutation.isPending,
    isValidating: validateMutation.isPending,
    isImporting: importMutation.isPending,
    
    // Actions
    parseFile: parseMutation.mutate,
    validate: validateMutation.mutate,
    importAssessments: importMutation.mutate,
    reset,
  };
}
