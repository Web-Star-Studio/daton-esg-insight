import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Edit2, Save, Database, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

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

  const handleEdit = (extraction: ExtractedPreview) => {
    setEditingId(extraction.id);
    setEditedFields(extraction.extracted_fields);
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (extractionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'approve',
          preview_id: extractionId,
          edited_fields: editedFields
        }
      });

      if (error) throw error;

      toast.success('Dados salvos com sucesso!');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Erro ao salvar dados');
    }
  };

  const handleApprove = async (extractionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'approve',
          preview_id: extractionId
        }
      });

      if (error) throw error;

      toast.success('Dados aprovados e inseridos!');
      queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
    } catch (error) {
      console.error('Error approving data:', error);
      toast.error('Erro ao aprovar dados');
    }
  };

  const handleReject = async (extractionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('document-ai-processor', {
        body: {
          action: 'reject',
          preview_id: extractionId
        }
      });

      if (error) throw error;

      toast.success('Extração rejeitada');
      queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
    } catch (error) {
      console.error('Error rejecting data:', error);
      toast.error('Erro ao rejeitar dados');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!extractions || extractions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado pendente</h3>
          <p className="text-muted-foreground">
            Analise documentos na aba anterior para extrair dados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {extractions.map((extraction) => {
        const isEditing = editingId === extraction.id;
        const fields = isEditing ? editedFields : extraction.extracted_fields;

        return (
          <Card key={extraction.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">
                      {extraction.extraction_job.document.file_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Destino: <Badge variant="outline">{extraction.target_table}</Badge>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(extraction.id)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(extraction)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(extraction.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(extraction.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(fields).map(([field, value]) => {
                  const confidence = extraction.confidence_scores[field] || 0;
                  
                  return (
                    <div key={field} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{field}</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getConfidenceColor(confidence)}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {isEditing ? (
                        <Input
                          value={String(value || '')}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                        />
                      ) : (
                        <p className="text-sm bg-muted p-2 rounded">
                          {String(value || '-')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
