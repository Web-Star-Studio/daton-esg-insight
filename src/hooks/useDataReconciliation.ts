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

      // Call intelligent-data-processor to insert
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'intelligent-data-processor',
        {
          body: {
            company_id: profile.company_id,
            operations: [{
              table: preview.target_table,
              action: 'INSERT',
              data: finalData,
              deduplication: {
                check_fields: Object.keys(finalData).slice(0, 2),
                merge_strategy: 'skip_if_exists'
              },
              validation: {
                required_fields: Object.keys(finalData).filter(k => finalData[k])
              }
            }],
            execution_options: {
              auto_rollback: true,
              validate_before_insert: true,
              create_audit_log: true
            }
          }
        }
      );

      if (processError) throw processError;

      // Update preview status
      await supabase
        .from('extracted_data_preview')
        .update({ validation_status: 'Aprovado' })
        .eq('id', previewId);

      // Create approval audit log
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      const highConfidenceCount = Object.values(preview.confidence_scores || {})
        .filter((score: any) => score >= 0.8).length;

      await supabase
        .from('data_approval_audit')
        .insert({
          company_id: profile.company_id,
          preview_id: previewId,
          document_id: preview.extraction_job?.document_id,
          approved_by_user_id: user.id,
          action: editedFields.length > 0 ? 'edited' : 'approved',
          original_data: originalData,
          edited_data: editedData || null,
          confidence_scores: preview.confidence_scores,
          target_table: preview.target_table,
          records_affected: processResult?.records_inserted || 0,
          approval_notes: approvalNotes,
          processing_time_seconds: processingTime
        });

      // Create field changes audit
      if (editedFields.length > 0) {
        const fieldAudits = editedFields.map(edit => ({
          company_id: profile.company_id,
          table_name: preview.target_table,
          record_id: previewId, // Using preview_id as proxy
          field_name: edit.field,
          old_value: edit.old_value,
          new_value: edit.new_value,
          changed_by_user_id: user.id,
          change_source: 'manual',
          confidence_score: preview.confidence_scores?.[edit.field] || 0
        }));

        await supabase
          .from('field_changes_audit')
          .insert(fieldAudits);
      }

      return {
        success: true,
        records_affected: processResult?.records_inserted || 0
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
