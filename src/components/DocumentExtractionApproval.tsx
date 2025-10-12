import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    };
  };
}

export function DocumentExtractionApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
              file_name
            )
          )
        `)
        .eq('validation_status', 'Pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExtractedPreview[];
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (previewId: string) => {
      const { data, error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'approve',
          preview_id: previewId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
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
      {previews.map((preview) => (
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
          <CardContent className="space-y-4">
            {/* Suggested Mappings */}
            {preview.suggested_mappings && Object.keys(preview.suggested_mappings).length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Mapeamentos Sugeridos:</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(preview.suggested_mappings).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Fields */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(expandedId === preview.id ? null : preview.id)}
                className="mb-2"
              >
                {expandedId === preview.id ? 'Ocultar' : 'Ver'} Campos Extraídos
                <AlertCircle className="h-4 w-4 ml-2" />
              </Button>

              {expandedId === preview.id && (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-64">
                    {JSON.stringify(preview.extracted_fields, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Confidence Scores */}
            {Object.keys(preview.confidence_scores).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Confiança por Campo:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.confidence_scores).map(([field, score]) => (
                    <Badge key={field} variant="outline">
                      {field}: {Math.round(score * 100)}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => approveMutation.mutate(preview.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprovar e Inserir
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate(preview.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
