import { useEffect, useCallback, useRef, useState } from 'react';
import { updateGRIReport, type GRIReport } from '@/services/griReports';
import { toast } from 'sonner';

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
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = useCallback(async (updates: Partial<GRIReport>) => {
    if (isSavingRef.current) {
      console.log('Save already in progress, skipping...');
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');
      
      const currentState = JSON.stringify(updates);
      if (currentState === lastSavedRef.current) {
        console.log('No changes detected, skipping save');
        setSaveStatus('saved');
        return;
      }

      console.log('Auto-saving GRI report...', { reportId: report.id });
      
      await updateGRIReport(report.id, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      lastSavedRef.current = currentState;
      setLastSaveTime(new Date());
      setSaveStatus('saved');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      console.log('GRI report auto-saved successfully');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to auto-save GRI report', error);
      setSaveStatus('error');
      
      if (onSaveError) {
        onSaveError(error as Error);
      } else {
        toast.error('Falha ao salvar automaticamente. Suas alterações podem ser perdidas.');
      }
      
      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
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
    isSaving: isSavingRef.current,
    lastSaveTime,
    saveStatus,
  };
}
