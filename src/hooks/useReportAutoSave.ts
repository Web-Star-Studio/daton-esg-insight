import { useEffect, useRef, useCallback } from 'react';
import { updateIntegratedReport, type IntegratedReport } from '@/services/integratedReports';
import { toast } from 'sonner';

interface UseReportAutoSaveOptions {
  reportId: string;
  data: Partial<IntegratedReport>;
  enabled?: boolean;
  interval?: number; // milliseconds
}

export function useReportAutoSave({
  reportId,
  data,
  enabled = true,
  interval = 30000, // 30 seconds
}: UseReportAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;
    
    const currentData = JSON.stringify(data);
    if (currentData === lastSaveRef.current) return;

    try {
      isSavingRef.current = true;
      await updateIntegratedReport(reportId, data);
      lastSaveRef.current = currentData;
      console.log('Auto-save realizado:', new Date().toLocaleTimeString());
    } catch (error: any) {
      console.error('Erro no auto-save:', error);
      toast.error('Erro ao salvar automaticamente');
    } finally {
      isSavingRef.current = false;
    }
  }, [reportId, data, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule next auto-save
    timeoutRef.current = setTimeout(() => {
      save();
    }, interval);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [save, interval, enabled]);

  // Manual save function
  const forceSave = useCallback(async () => {
    await save();
    toast.success('Salvo!');
  }, [save]);

  return { forceSave, isSaving: isSavingRef.current };
}
