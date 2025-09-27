import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wand2, Clock, CheckCircle, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAIProcessingStats, getPendingExtractions } from '@/services/documentAI';
import { useNavigate } from 'react-router-dom';

export const AIProcessingStatusWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['ai-processing-stats'],
    queryFn: getAIProcessingStats,
    refetchInterval: 30000,
    retry: 3,
  });

  const { data: pendingExtractions, isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ['pending-extractions'],
    queryFn: getPendingExtractions,
    refetchInterval: 30000,
    retry: 3,
  });

  const isLoading = statsLoading || pendingLoading;
  const hasError = statsError || pendingError;

  const handleViewPending = () => {
    navigate('/reconciliacao-documentos');
  };

  const getPriorityColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 text-green-700 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  if (hasError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Análise IA - Erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Erro ao carregar dados da IA. Verifique a conectividade.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Análise IA de Documentos</h3>
        <Wand2 className="h-6 w-6 text-primary" />
      </div>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center space-y-1 p-2 bg-blue-50 rounded-md">
                <p className="text-lg font-bold text-blue-700">
                  {stats?.totalProcessed || 0}
                </p>
                <p className="text-xs text-blue-600">Processados</p>
              </div>
              <div className="text-center space-y-1 p-2 bg-orange-50 rounded-md">
                <p className="text-lg font-bold text-orange-700">
                  {stats?.pendingApproval || 0}
                </p>
                <p className="text-xs text-orange-600">Pendentes</p>
              </div>
              <div className="text-center space-y-1 p-2 bg-green-50 rounded-md">
                <p className="text-lg font-bold text-green-700">
                  {stats?.approved || 0}
                </p>
                <p className="text-xs text-green-600">Aprovados</p>
              </div>
            </div>

            {/* Confidence Score */}
            {stats?.averageConfidence && (
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-700">Confiança Média</span>
                </div>
                <Badge variant="outline" className="bg-white">
                  {Math.round(stats.averageConfidence * 100)}%
                </Badge>
              </div>
            )}

            {/* Enhanced Pending Items */}
            {pendingExtractions && pendingExtractions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Aguardando Revisão:
                  </span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {pendingExtractions.length} item{pendingExtractions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pendingExtractions.slice(0, 4).map((item, index) => {
                    // Calcular confiança média
                    const confidenceScores = item.confidence_scores as Record<string, number>;
                    const avgConfidence = Object.values(confidenceScores || {}).length > 0
                      ? Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length
                      : 0.7;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs truncate" title={`Documento ${item.id}`}>
                            Doc #{item.id.slice(0, 8)}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                            {item.target_table === 'activity_data' ? 'Atividade' : item.target_table}
                          </Badge>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={`text-xs ml-2 flex-shrink-0 ${getPriorityColor(avgConfidence)}`}
                        >
                          {Math.round(avgConfidence * 100)}%
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {pendingExtractions.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{pendingExtractions.length - 4} documento(s) adiciona(is)
                    </p>
                  )}
                </div>

                {/* Priority Alert */}
                {pendingExtractions.some(item => {
                  const scores = Object.values(item.confidence_scores as Record<string, number> || {});
                  return scores.length > 0 && scores.some(score => score < 0.6);
                }) && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Alguns documentos têm baixa confiança e precisam de atenção especial
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-3 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Todos os documentos foram processados</p>
              </div>
            )}

            {/* Enhanced Action Button */}
            <Button
              onClick={handleViewPending}
              variant={pendingExtractions?.length ? "default" : "outline"}
              size="sm"
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {pendingExtractions?.length 
                ? `Revisar ${pendingExtractions.length} Documento${pendingExtractions.length !== 1 ? 's' : ''}` 
                : 'Ver Dashboard IA'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};