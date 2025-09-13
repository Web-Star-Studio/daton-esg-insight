import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAIProcessingStats, getPendingExtractions } from '@/services/documentAI';
import { useNavigate } from 'react-router-dom';

export const AIProcessingStatusWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['ai-processing-stats'],
    queryFn: getAIProcessingStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: pendingExtractions, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-extractions'],
    queryFn: getPendingExtractions,
    refetchInterval: 30000,
  });

  const isLoading = statsLoading || pendingLoading;

  const handleViewPending = () => {
    navigate('/reconciliacao-documentos');
  };

  const getPriorityColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success/10 text-success';
    if (confidence >= 0.6) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Análise IA de Documentos</CardTitle>
        <Wand2 className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  {stats?.totalProcessed || 0}
                </p>
                <p className="text-xs text-muted-foreground">Processados</p>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-warning">
                  {stats?.pendingApproval || 0}
                </p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-success">
                  {stats?.approved || 0}
                </p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>

            {/* Pending Items */}
            {pendingExtractions && pendingExtractions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Requer Revisão:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {pendingExtractions.length}
                  </Badge>
                </div>
                
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {pendingExtractions.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs truncate max-w-32" title={`Documento ${item.id}`}>
                          Documento {item.id.slice(0, 8)}...
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(0.7)}`}
                      >
                        Revisar
                      </Badge>
                    </div>
                  ))}
                  {pendingExtractions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{pendingExtractions.length - 3} mais...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleViewPending}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!stats?.pendingApproval}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {stats?.pendingApproval ? 'Revisar Dados' : 'Nenhum Pendente'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};