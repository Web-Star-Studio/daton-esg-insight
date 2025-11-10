import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Etapa3Props {
  reportId?: string;
}

export function Etapa3AnaliseDocumentos({ reportId }: Etapa3Props) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['gri-documents', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gri_document_uploads')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando análise...</div>;
  }

  const completedDocs = documents?.filter(d => d.processing_status === 'completed').length || 0;
  const totalDocs = documents?.length || 0;
  const averageConfidence = documents?.reduce((acc, d) => acc + (d.confidence_score || 0), 0) / totalDocs || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documentos Processados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedDocs}/{totalDocs}</div>
            <Progress value={(completedDocs / totalDocs) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confiança Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageConfidence.toFixed(0)}%</div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Qualidade dos dados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Indicadores Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.reduce((acc, d) => acc + (Array.isArray(d.suggested_indicators) ? d.suggested_indicators.length : 0), 0)}
            </div>
            <div className="flex items-center mt-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Mapeamento automático
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gaps Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <div className="flex items-center mt-2 text-xs text-yellow-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dados faltantes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Documentos Analisados</h3>
        {documents?.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <CardTitle className="text-base">{doc.file_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {doc.file_size_kb} KB • {doc.file_type?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={doc.confidence_score && doc.confidence_score >= 80 ? 'default' : 'secondary'}>
                    {doc.confidence_score}% confiança
                  </Badge>
                  <Badge variant="outline">{doc.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {doc.suggested_indicators && Array.isArray(doc.suggested_indicators) && doc.suggested_indicators.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Indicadores GRI Sugeridos:</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.suggested_indicators.map((indicator: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {indicator.indicator_code || 'N/A'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
