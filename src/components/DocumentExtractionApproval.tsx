import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentExtractionEditor } from './DocumentExtractionEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Approve mutation with edited fields
  const approveMutation = useMutation({
    mutationFn: async ({ previewId, editedFields }: { previewId: string; editedFields?: Record<string, any> }) => {
      const { data, error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'approve',
          preview_id: previewId,
          edited_fields: editedFields
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      setEditingId(null);
      toast({
        title: 'Dados Aprovados',
        description: 'Os dados foram inseridos no sistema com sucesso.',
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
      const { data, error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'reject',
          preview_id: previewId
        }
      });

      if (error) throw error;
      return data;
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
    return values.reduce((a, b) => a + b, 0) / values.length;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!previews || previews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma extração pendente de aprovação.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {previews.map((preview) => {
        const isEditing = editingId === preview.id;
        const avgConfidence = getAverageConfidence(preview.confidence_scores);

        return (
          <Card key={preview.id} className="border-l-4 border-l-primary">
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
                {getConfidenceBadge(preview.confidence_scores)}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <DocumentExtractionEditor
                  preview={preview}
                  onApprove={(editedFields) => 
                    approveMutation.mutate({ previewId: preview.id, editedFields })
                  }
                  onReject={() => {
                    setEditingId(null);
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
                        onClick={() => setEditingId(preview.id)}
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
                            .sort(([, a], [, b]) => a - b) // Ordenar por confiança (menor primeiro)
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
