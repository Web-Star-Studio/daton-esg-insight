import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DataReconciliationPanel } from './DataReconciliationPanel';
import { useDataReconciliation } from '@/hooks/useDataReconciliation';

interface ExtractedPreview {
  id: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  target_table: string;
  validation_status: string;
  created_at: string;
  extraction_job: {
    document: {
      file_name: string;
    };
  };
}

export function ExtractedDataManager() {
  const [selectedPreview, setSelectedPreview] = useState<ExtractedPreview | null>(null);
  const queryClient = useQueryClient();
  const { isProcessing, approveExtraction, rejectExtraction } = useDataReconciliation();

  const { data: extractions, isLoading } = useQuery({
    queryKey: ['extracted-data-previews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracted_data_preview')
        .select(`
          *,
          extraction_job:document_extraction_jobs(
            document:documents(file_name)
          )
        `)
        .eq('validation_status', 'Pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExtractedPreview[];
    }
  });

  const handleViewReconciliation = (extraction: ExtractedPreview) => {
    setSelectedPreview(extraction);
  };

  const handleApprove = async (editedData: Record<string, any>, notes?: string) => {
    if (!selectedPreview) return;

    const result = await approveExtraction(selectedPreview.id, editedData, notes);
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
      setSelectedPreview(null);
    } else {
      toast.error(result.error || 'Erro ao aprovar dados');
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedPreview) return;

    const result = await rejectExtraction(selectedPreview.id, reason);
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
      setSelectedPreview(null);
    } else {
      toast.error(result.error || 'Erro ao rejeitar dados');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show reconciliation panel if a preview is selected
  if (selectedPreview) {
    // Transform preview data into reconciliation format
    const reconciliationData = {
      id: selectedPreview.id,
      document_name: selectedPreview.extraction_job.document.file_name,
      target_table: selectedPreview.target_table,
      fields: Object.entries(selectedPreview.extracted_fields).map(([name, value]) => ({
        name,
        extracted_value: value,
        confidence: selectedPreview.confidence_scores[name] || 0,
        change_type: 'new' as const // Could be enhanced with actual comparison
      })),
      overall_confidence: Object.values(selectedPreview.confidence_scores).reduce((a: number, b: any) => a + b, 0) / 
                         Object.values(selectedPreview.confidence_scores).length || 0,
      has_conflicts: Object.values(selectedPreview.confidence_scores).some((score: any) => score < 0.6)
    };

    return (
      <DataReconciliationPanel
        data={reconciliationData}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={() => setSelectedPreview(null)}
      />
    );
  }

  if (!extractions || extractions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado pendente</h3>
          <p className="text-muted-foreground">
            Faça upload de documentos para extrair dados automaticamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Dados Extraídos Pendentes</h3>
          <p className="text-sm text-muted-foreground">
            {extractions.length} documento(s) aguardando aprovação
          </p>
        </div>
      </div>

      {extractions.map((extraction) => {
        const avgConfidence = Object.values(extraction.confidence_scores).reduce((a: number, b: any) => a + b, 0) / 
                             Object.values(extraction.confidence_scores).length || 0;
        const fieldsCount = Object.keys(extraction.extracted_fields).length;
        const lowConfidenceCount = Object.values(extraction.confidence_scores).filter((score: any) => score < 0.6).length;

        return (
          <Card key={extraction.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">
                      {extraction.extraction_job.document.file_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{extraction.target_table}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {fieldsCount} campo(s)
                      </span>
                      {lowConfidenceCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {lowConfidenceCount} baixa confiança
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confiança</p>
                    <p className="text-lg font-bold">
                      {(avgConfidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handleViewReconciliation(extraction)}
                    disabled={isProcessing}
                  >
                    Revisar Dados
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
