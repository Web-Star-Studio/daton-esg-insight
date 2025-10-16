import { useEffect, useCallback, useRef } from 'react';
import { updateGRIReport, type GRIReport } from '@/services/griReports';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UseGRIAutoSaveOptions {
  report: GRIReport;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  debounceMs?: number;
}

export function useGRIAutoSave({ 
  report, 
  onSaveSuccess, 
  onSaveError,
  debounceMs = 5000 
}: UseGRIAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);

  const save = useCallback(async (updates: Partial<GRIReport>) => {
    if (isSavingRef.current) {
      logger.info('Save already in progress, skipping...');
      return;
    }

    try {
      isSavingRef.current = true;
      
      const currentState = JSON.stringify(updates);
      if (currentState === lastSavedRef.current) {
        logger.info('No changes detected, skipping save');
        return;
      }

      logger.info('Auto-saving GRI report...', { reportId: report.id });
      
      await updateGRIReport(report.id, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      lastSavedRef.current = currentState;
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      logger.info('GRI report auto-saved successfully');
    } catch (error) {
      logger.error('Failed to auto-save GRI report', error);
      
      if (onSaveError) {
        onSaveError(error as Error);
      } else {
        toast.error('Falha ao salvar automaticamente. Suas alterações podem ser perdidas.');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [report.id, onSaveSuccess, onSaveError]);

  const scheduleAutoSave = useCallback((updates: Partial<GRIReport>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save(updates);
    }, debounceMs);
  }, [save, debounceMs]);

  const forceSave = useCallback(async (updates: Partial<GRIReport>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save(updates);
  }, [save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleAutoSave,
    forceSave,
    isSaving: isSavingRef.current
  };
}
