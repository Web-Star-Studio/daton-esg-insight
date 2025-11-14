import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp, Edit, Eye, Zap, AlertCircle, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DocumentExtractionEditor } from './DocumentExtractionEditor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DocumentViewer } from './DocumentViewer';
import { useExtractionRealtime } from '@/hooks/useExtractionRealtime';
import { createDocumentApprovalLog } from '@/services/documentApprovalLog';
import { useDataReconciliation } from '@/hooks/useDataReconciliation';

interface ExtractedPreview {
  id: string;
  extraction_job_id: string;
  target_table: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  suggested_mappings: Record<string, any>;
  validation_status: string;
  created_at: string;
  document_extraction_jobs?: {
    documents?: {
      file_name: string;
      file_path: string;
    };
  };
}

export function DocumentExtractionApproval() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set());
  const [viewingDocuments, setViewingDocuments] = useState<Set<string>>(new Set());
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { approveExtraction, rejectExtraction, isProcessing } = useDataReconciliation();

  // Enable realtime updates
  useExtractionRealtime({
    enabled: true,
    onApprovalLog: (log) => {
      console.log('Approval log received:', log);
    },
  });

  // Fetch pending extractions
  const { data: previews, isLoading } = useQuery({
    queryKey: ['extraction-previews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracted_data_preview')
        .select(`
          *,
          document_extraction_jobs (
            documents (
              file_name,
              file_path
            )
          )
        `)
        .eq('validation_status', 'Pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExtractedPreview[];
    }
  });

  // Batch approve high confidence items
  const batchApproveMutation = useMutation({
    mutationFn: async (previewIds: string[]) => {
      const startTime = Date.now();
      
      for (const previewId of previewIds) {
        const result = await approveExtraction(previewId);
        if (!result.success) {
          throw new Error(result.error || 'Falha ao aprovar extração');
        }

        // Log the approval
        const preview = previews?.find(p => p.id === previewId);
        if (preview) {
          await createDocumentApprovalLog({
            preview_id: previewId,
            job_id: preview.extraction_job_id,
            action: 'batch_approved',
            items_count: Object.keys(preview.extracted_fields).length,
            high_confidence_count: Object.values(preview.confidence_scores).filter(s => (s > 1 ? s/100 : s) >= 0.85).length,
            processing_time_seconds: (Date.now() - startTime) / 1000,
          });
        }
      }

      return { success: true, processingTime: (Date.now() - startTime) / 1000 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      setSelectedForBatch(new Set());
      toast({
        title: 'Aprovação em lote concluída',
        description: `${selectedForBatch.size} extrações aprovadas com sucesso em ${data.processingTime.toFixed(1)}s!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na aprovação em lote',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve mutation with edited fields
  const approveMutation = useMutation({
    mutationFn: async ({ previewId, editedFields }: { previewId: string; editedFields?: Record<string, any> }) => {
      const startTime = Date.now();

      const result = await approveExtraction(previewId, editedFields);

      if (!result.success) throw new Error(result.error || 'Falha ao aprovar');

      // Log the approval
      const preview = previews?.find(p => p.id === previewId);
      if (preview) {
        await createDocumentApprovalLog({
          preview_id: previewId,
          job_id: preview.extraction_job_id,
          action: editedFields ? 'edited' : 'approved',
          items_count: Object.keys(preview.extracted_fields).length,
          edited_fields: editedFields ? Object.entries(editedFields).map(([field, value]) => ({
            field,
            old_value: String(preview.extracted_fields[field] || ''),
            new_value: String(value)
          })) : undefined,
          processing_time_seconds: (Date.now() - startTime) / 1000,
        });
      }

      return { processingTime: (Date.now() - startTime) / 1000 };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      setEditingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.previewId);
        return newSet;
      });
      toast({
        title: 'Dados Aprovados',
        description: `Os dados foram inseridos no sistema com sucesso em ${result.processingTime.toFixed(1)}s.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Aprovar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (previewId: string) => {
      const result = await rejectExtraction(previewId, '');
      if (!result.success) throw new Error(result.error || 'Falha ao rejeitar');

      // Log the rejection
      const preview = previews?.find(p => p.id === previewId);
      if (preview) {
        await createDocumentApprovalLog({
          preview_id: previewId,
          job_id: preview.extraction_job_id,
          action: 'rejected',
          items_count: Object.keys(preview.extracted_fields).length,
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      toast({
        title: 'Dados Rejeitados',
        description: 'A extração foi marcada como rejeitada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const getAverageConfidence = (scores: Record<string, number>) => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Normalizar se estiver em escala 0-100 (dados antigos)
    return avg > 1 ? avg / 100 : avg;
  };

  const getConfidenceBadge = (scores: Record<string, number>) => {
    const avg = getAverageConfidence(scores);
    if (avg >= 0.8) return <Badge className="bg-success">Alta ({Math.round(avg * 100)}%)</Badge>;
    if (avg >= 0.6) return <Badge className="bg-warning">Média ({Math.round(avg * 100)}%)</Badge>;
    return <Badge variant="destructive">Baixa ({Math.round(avg * 100)}%)</Badge>;
  };

  const formatTableName = (table: string) => {
    const names: Record<string, string> = {
      licenses: 'Licenças',
      emission_sources: 'Fontes de Emissão',
      activity_data: 'Dados de Atividade',
      waste_logs: 'Gestão de Resíduos',
      energy_consumption: 'Consumo de Energia',
      water_consumption: 'Consumo de Água',
      suppliers: 'Fornecedores'
    };
    return names[table] || table;
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleEditing = (id: string) => {
    setEditingItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleViewDocument = (id: string) => {
    setViewingDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleBatchSelection = (id: string) => {
    setSelectedForBatch(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBatchApprove = () => {
    if (selectedForBatch.size === 0) {
      toast({
        title: 'Nenhuma extração selecionada',
        description: 'Selecione pelo menos uma extração para aprovar em lote.',
        variant: 'destructive',
      });
      return;
    }

    batchApproveMutation.mutate(Array.from(selectedForBatch));
  };

  // Get high confidence extractions (>= 85%)
  const highConfidenceExtractions = previews?.filter(
    preview => getAverageConfidence(preview.confidence_scores) >= 0.85
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!previews || previews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma extração pendente de aprovação no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Batch approval section
  const batchApprovalSection = highConfidenceExtractions.length > 0 && (
    <Card className="mb-6 border-primary/20 bg-primary/5 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Aprovação Rápida</CardTitle>
              <CardDescription>
                {highConfidenceExtractions.length} extrações com alta confiança (≥85%) disponíveis
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleBatchApprove}
            disabled={selectedForBatch.size === 0 || batchApproveMutation.isPending}
            className="gap-2"
          >
            {batchApproveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle className="h-4 w-4" />
            Aprovar {selectedForBatch.size > 0 ? `(${selectedForBatch.size})` : 'Selecionadas'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {highConfidenceExtractions.map((preview) => (
            <div
              key={preview.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedForBatch.has(preview.id)}
                onCheckedChange={() => toggleBatchSelection(preview.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{preview.document_extraction_jobs?.documents?.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTableName(preview.target_table)} • {Object.keys(preview.extracted_fields).length} campos
                </p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                {Math.round(getAverageConfidence(preview.confidence_scores) * 100)}% confiança
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {batchApprovalSection}
      
      {previews.map((preview) => {
        const isEditing = editingItems.has(preview.id);
        const isViewingDoc = viewingDocuments.has(preview.id);
        const avgConfidence = getAverageConfidence(preview.confidence_scores);

        // Get document URL
        const filePath = preview.document_extraction_jobs?.documents?.file_path;
        const fileUrl = filePath ? supabase.storage.from('uploads').getPublicUrl(filePath).data.publicUrl : null;

        return (
          <Card key={preview.id} className="border-l-4 border-l-primary animate-fade-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {preview.document_extraction_jobs?.documents?.file_name || 'Documento'}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Tabela de destino: <strong>{formatTableName(preview.target_table)}</strong>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getConfidenceBadge(preview.confidence_scores)}
                  {fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleViewDocument(preview.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {isViewingDoc ? 'Ocultar' : 'Ver'} Documento
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEditing(preview.id)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {isEditing ? 'Cancelar Edição' : 'Editar Campos'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {isViewingDoc && fileUrl && (
                <div className="mb-6">
                  <DocumentViewer
                    fileUrl={fileUrl}
                    fileName={preview.document_extraction_jobs?.documents?.file_name}
                  />
                </div>
              )}
              
              {isEditing ? (
                <DocumentExtractionEditor
                  preview={preview}
                  onApprove={(editedFields) => 
                    approveMutation.mutate({ previewId: preview.id, editedFields })
                  }
                  onReject={() => {
                    toggleEditing(preview.id);
                    rejectMutation.mutate(preview.id);
                  }}
                  isLoading={approveMutation.isPending || rejectMutation.isPending}
                />
              ) : (
                <Tabs defaultValue="review" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="review">Revisão</TabsTrigger>
                    <TabsTrigger value="fields">Campos</TabsTrigger>
                    <TabsTrigger value="confidence">Confiança</TabsTrigger>
                  </TabsList>

                  <TabsContent value="review" className="space-y-4">
                    {/* Suggested Mappings */}
                    {preview.suggested_mappings && typeof preview.suggested_mappings === 'object' && (
                      <div className="space-y-3">
                        {/* Normalized Fields */}
                        {preview.suggested_mappings.normalized_fields && (
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Campos Normalizados:</h4>
                            <div className="space-y-1 text-sm">
                              {Object.entries(preview.suggested_mappings.normalized_fields).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Applied Corrections */}
                        {preview.suggested_mappings.applied_corrections?.length > 0 && (
                          <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2 text-success">✓ Correções Aplicadas:</h4>
                            <ul className="list-disc list-inside text-sm text-success space-y-1">
                              {preview.suggested_mappings.applied_corrections.map((correction: string, i: number) => (
                                <li key={i}>{correction}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Data Quality Issues */}
                        {preview.suggested_mappings.data_quality_issues?.length > 0 && (
                          <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2 text-warning">⚠ Problemas de Qualidade:</h4>
                            <ul className="list-disc list-inside text-sm text-warning space-y-1">
                              {preview.suggested_mappings.data_quality_issues.map((issue: string, i: number) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => toggleEditing(preview.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar Campos
                      </Button>
                      {avgConfidence >= 0.95 && (
                        <Button
                          onClick={() => approveMutation.mutate({ previewId: preview.id })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="flex-1"
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Aprovar Direto (Alta Confiança)
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === preview.id ? null : preview.id)}
                        className="mb-2"
                      >
                        {expandedId === preview.id ? 'Ocultar' : 'Ver'} JSON Completo
                        <AlertCircle className="h-4 w-4 ml-2" />
                      </Button>

                      {expandedId === preview.id ? (
                        <pre className="text-xs overflow-auto max-h-64">
                          {JSON.stringify(preview.extracted_fields, null, 2)}
                        </pre>
                      ) : (
                        <div className="space-y-1 text-sm">
                          {Object.entries(preview.extracted_fields).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(preview.extracted_fields).length > 5 && (
                            <p className="text-xs text-muted-foreground italic mt-2">
                              + {Object.keys(preview.extracted_fields).length - 5} campos adicionais
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="confidence" className="space-y-4">
                    {Object.keys(preview.confidence_scores).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Confiança por Campo:</h4>
                        <div className="space-y-2">
                          {Object.entries(preview.confidence_scores)
                            .sort(([, a], [, b]) => a - b)
                            .map(([field, score]) => (
                              <div key={field} className="flex items-center justify-between p-2 rounded bg-muted">
                                <span className="text-sm font-medium">{field}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-2 bg-background rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        score >= 0.8 ? 'bg-success' : 
                                        score >= 0.6 ? 'bg-warning' : 
                                        'bg-destructive'
                                      }`}
                                      style={{ width: `${score * 100}%` }}
                                    />
                                  </div>
                                  <Badge variant="outline" className="min-w-[60px] justify-center">
                                    {Math.round(score * 100)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
