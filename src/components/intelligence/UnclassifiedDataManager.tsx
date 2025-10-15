import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, XCircle, Lightbulb, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UnclassifiedData {
  id: string;
  document_id: string;
  extracted_data: any;
  ai_suggestions: {
    category?: string;
    potential_uses?: Array<{
      table: string;
      confidence: number;
      reason: string;
    }>;
    relevance_score?: number;
    recommendations?: string[];
  };
  ai_confidence: number;
  data_category: string;
  potential_tables: string[];
  user_decision: string | null;
  created_at: string;
  documents?: {
    file_name: string;
  };
}

export function UnclassifiedDataManager() {
  const [selectedData, setSelectedData] = useState<UnclassifiedData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unclassifiedData, isLoading } = useQuery({
    queryKey: ['unclassified-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unclassified_data')
        .select(`
          *,
          documents (
            file_name
          )
        `)
        .is('user_decision', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UnclassifiedData[];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: string }) => {
      const { error } = await supabase
        .from('unclassified_data')
        .update({
          user_decision: decision,
          decided_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          decided_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unclassified-data'] });
      toast.success('Decisão registrada com sucesso');
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error deciding data:', error);
      toast.error('Erro ao registrar decisão');
    },
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const viewDetails = (data: UnclassifiedData) => {
    setSelectedData(data);
    setDialogOpen(true);
  };

  const handleDecision = (decision: string) => {
    if (!selectedData) return;
    decideMutation.mutate({ id: selectedData.id, decision });
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados não classificados...</span>
        </div>
      </Card>
    );
  }

  if (!unclassifiedData || unclassifiedData.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum dado não classificado</p>
          <p className="text-sm mt-2">
            Quando documentos contiverem dados que não se encaixam nas tabelas existentes,
            eles aparecerão aqui para você decidir como utilizá-los.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Dados Não Classificados</h3>
            <p className="text-sm text-muted-foreground">
              {unclassifiedData.length} {unclassifiedData.length === 1 ? 'registro' : 'registros'} aguardando classificação
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {unclassifiedData.map((data) => (
            <Card key={data.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{data.data_category || 'Não categorizado'}</Badge>
                    <Badge className={getConfidenceColor(data.ai_confidence)}>
                      {data.ai_confidence}% confiança
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Documento:</span>{' '}
                    {data.documents?.file_name || 'Não especificado'}
                  </div>

                  {data.ai_suggestions?.recommendations && data.ai_suggestions.recommendations.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <span className="font-medium">Sugestões da IA:</span>
                        <ul className="list-disc list-inside mt-1 text-muted-foreground">
                          {data.ai_suggestions.recommendations.slice(0, 2).map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {data.potential_tables && data.potential_tables.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tabelas sugeridas:</span>
                      <div className="flex gap-1">
                        {data.potential_tables.slice(0, 3).map((table, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={() => viewDetails(data)} size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Revisar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados Extraídos - Classificação Necessária</DialogTitle>
            <DialogDescription>
              Revise os dados extraídos e decida como deseja utilizá-los no sistema
            </DialogDescription>
          </DialogHeader>

          {selectedData && (
            <div className="space-y-6">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="data">Dados Extraídos</TabsTrigger>
                  <TabsTrigger value="suggestions">Sugestões da IA</TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="space-y-4 mt-4">
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedData.extracted_data, null, 2)}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4 mt-4">
                  {selectedData.ai_suggestions?.potential_uses && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Possíveis Usos dos Dados:</h4>
                      {selectedData.ai_suggestions.potential_uses.map((use, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge>{use.table}</Badge>
                                <Badge variant="outline">{use.confidence}% confiança</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{use.reason}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {selectedData.ai_suggestions?.recommendations && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Recomendações:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedData.ai_suggestions.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleDecision('approved_auto_insert')}
                  className="flex-1"
                  disabled={decideMutation.isPending}
                >
                  {decideMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Inserir Automaticamente
                </Button>

                <Button
                  onClick={() => handleDecision('approved_manual_review')}
                  variant="secondary"
                  className="flex-1"
                  disabled={decideMutation.isPending}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Revisar Manualmente
                </Button>

                <Button
                  onClick={() => handleDecision('create_new_metric')}
                  variant="outline"
                  className="flex-1"
                  disabled={decideMutation.isPending}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Criar Novo Indicador
                </Button>

                <Button
                  onClick={() => handleDecision('rejected')}
                  variant="destructive"
                  disabled={decideMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
