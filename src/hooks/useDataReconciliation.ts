import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReconciliationResult {
  success: boolean;
  records_affected?: number;
  error?: string;
}

export function useDataReconciliation() {
  const [isProcessing, setIsProcessing] = useState(false);

  const approveExtraction = useCallback(async (
    previewId: string,
    editedData?: Record<string, any>,
    approvalNotes?: string
  ): Promise<ReconciliationResult> => {
    setIsProcessing(true);
    
    try {
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Record start time for audit
      const startTime = Date.now();

      // Get preview data
      const { data: preview, error: previewError } = await supabase
        .from('extracted_data_preview')
        .select('*, extraction_job:document_extraction_jobs(document_id)')
        .eq('id', previewId)
        .single();

      if (previewError || !preview) {
        throw new Error('Preview not found');
      }

      const originalData = preview.extracted_fields;
      const finalData = editedData || originalData;

      // Count edited fields
      const editedFields: Array<{ field: string; old_value: string; new_value: string }> = [];
      if (editedData) {
        Object.keys(editedData).forEach(field => {
          if (originalData[field] !== editedData[field]) {
            editedFields.push({
              field,
              old_value: String(originalData[field]),
              new_value: String(editedData[field])
            });
          }
        });
      }

      // Call approve-extracted-data to process and insert
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'approve-extracted-data',
        {
          body: {
            preview_id: previewId,
            edited_data: editedData,
            approval_notes: approvalNotes
          }
        }
      );

      if (processError) {
        console.error('❌ Approval function error:', processError);
        throw new Error(`Erro ao processar aprovação: ${processError.message}`);
      }

      if (!processResult?.success) {
        throw new Error(processResult?.error || 'Falha ao aprovar dados');
      }

      console.log('✅ Approval successful:', processResult);

      // Show success message with details
      const recordsCount = processResult?.records_inserted || 0;
      const targetTable = processResult?.target_table || preview.target_table;
      
      toast.success(
        `✅ Aprovação concluída!`,
        {
          description: `${recordsCount} registro(s) importado(s) em ${targetTable}`
        }
      );

      return {
        success: true,
        records_affected: recordsCount
      };

    } catch (error) {
      console.error('Error approving extraction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const rejectExtraction = useCallback(async (
    previewId: string,
    reason: string
  ): Promise<ReconciliationResult> => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get preview data
      const { data: preview } = await supabase
        .from('extracted_data_preview')
        .select('*, extraction_job:document_extraction_jobs(document_id)')
        .eq('id', previewId)
        .single();

      // Update preview status
      await supabase
        .from('extracted_data_preview')
        .update({ validation_status: 'Rejeitado' })
        .eq('id', previewId);

      // Create rejection audit log
      await supabase
        .from('data_approval_audit')
        .insert({
          company_id: profile.company_id,
          preview_id: previewId,
          document_id: preview?.extraction_job?.document_id,
          approved_by_user_id: user.id,
          action: 'rejected',
          original_data: preview?.extracted_fields || {},
          approval_notes: reason,
          records_affected: 0
        });

      return { success: true };

    } catch (error) {
      console.error('Error rejecting extraction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    approveExtraction,
    rejectExtraction
  };
}
