import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Activity, Shield, TrendingUp, Bell } from 'lucide-react';
import { unifiedQualityService } from '@/services/unifiedQualityService';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { useToast } from '@/hooks/use-toast';

interface QualityMatrixProps {
  matrixId?: string;
}

const QualityMatrix: React.FC<QualityMatrixProps> = ({ matrixId }) => {
  const [selectedMatrixId, setSelectedMatrixId] = useState(matrixId || '');
  const { toast } = useToast();
  const { triggerQualityIssueDetected } = useNotificationTriggers();
  
  const { data: matrices, error: matricesError } = useQuery({
    queryKey: ['risk-matrices'],
    queryFn: () => unifiedQualityService.getRiskMatrices(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: riskMatrix, isLoading, error: matrixError } = useQuery({
    queryKey: ['risk-matrix', selectedMatrixId],
    queryFn: () => unifiedQualityService.getRiskMatrix(selectedMatrixId),
    enabled: !!selectedMatrixId,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!selectedMatrixId && matrices && matrices.length > 0) {
      setSelectedMatrixId(matrices[0].id);
    }
  }, [matrices, selectedMatrixId]);

  const probabilityLevels = ['Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'];
  const impactLevels = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

  const getRiskColor = (probability: string, impact: string) => {
    const probIndex = probabilityLevels.indexOf(probability);
    const impactIndex = impactLevels.indexOf(impact);
    const riskLevel = probIndex + impactIndex;

    if (riskLevel >= 7) return 'bg-destructive text-destructive-foreground';
    if (riskLevel >= 5) return 'bg-warning text-warning-foreground';
    if (riskLevel >= 3) return 'bg-yellow-500 text-yellow-50';
    if (riskLevel >= 2) return 'bg-success text-success-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getRiskLevelText = (probability: string, impact: string) => {
    const probIndex = probabilityLevels.indexOf(probability);
    const impactIndex = impactLevels.indexOf(impact);
    const riskLevel = probIndex + impactIndex;

    if (riskLevel >= 7) return 'Crítico';
    if (riskLevel >= 5) return 'Alto';
    if (riskLevel >= 3) return 'Médio';
    if (riskLevel >= 2) return 'Baixo';
    return 'Muito Baixo';
  };

  const handleRiskClick = async (probability: string, impact: string, risksCount: number) => {
    if (risksCount > 0) {
      const riskLevel = getRiskLevelText(probability, impact);
      if (riskLevel === 'Crítico' || riskLevel === 'Alto') {
        try {
          await triggerQualityIssueDetected(
            `risk-${Date.now()}`,
            `${risksCount} riscos identificados: ${probability} probabilidade, ${impact} impacto`,
            riskLevel.toLowerCase()
          );
          toast({
            title: "Alerta de Qualidade",
            description: `Notificação enviada sobre riscos ${riskLevel.toLowerCase()}s detectados`,
          });
        } catch (error) {
          console.error('Error triggering quality notification:', error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Matrix Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Riscos</h3>
          <p className="text-sm text-muted-foreground">
            Visualize e analise os riscos por probabilidade e impacto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(matricesError || matrixError) && (
            <Badge variant="outline" className="text-xs">
              Modo Demonstração
            </Badge>
          )}
          <Select value={selectedMatrixId} onValueChange={setSelectedMatrixId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione uma matriz" />
            </SelectTrigger>
            <SelectContent>
              {matrices?.map((matrix) => (
                <SelectItem key={matrix.id} value={matrix.id}>
                  {matrix.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {riskMatrix && (
        <>
          {riskMatrix.riskCounts.total === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum risco cadastrado</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Adicione riscos a esta matriz para visualizar a análise de probabilidade e impacto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Risk Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{riskMatrix.riskCounts.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{riskMatrix.riskCounts.critical}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Altos</CardTitle>
                <TrendingUp className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{riskMatrix.riskCounts.high}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Médios</CardTitle>
                <Shield className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{riskMatrix.riskCounts.medium}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Baixos</CardTitle>
                <Shield className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{riskMatrix.riskCounts.low}</div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Matrix Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Probabilidade x Impacto</CardTitle>
              <CardDescription>
                Clique em uma célula para ver os riscos correspondentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    <div className="p-2 text-center font-medium">Probabilidade \ Impacto</div>
                    {impactLevels.map((impact) => (
                      <div key={impact} className="p-2 text-center font-medium text-xs">
                        {impact}
                      </div>
                    ))}
                  </div>

                  {/* Matrix Rows */}
                  {probabilityLevels.reverse().map((probability) => (
                    <div key={probability} className="grid grid-cols-6 gap-1 mb-1">
                      <div className="p-2 text-center font-medium text-xs bg-muted rounded">
                        {probability}
                      </div>
                      {impactLevels.map((impact) => {
                        const cellRisks = riskMatrix.matrix
                          .flat()
                          .find(cell => cell.probability === probability && cell.impact === impact)?.risks || [];
                        
                        return (
                          <Dialog key={`${probability}-${impact}`}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className={`h-20 ${getRiskColor(probability, impact)} hover:opacity-80 transition-opacity relative`}
                                onClick={() => handleRiskClick(probability, impact, cellRisks.length)}
                              >
                                <div className="text-center">
                                  <div className="text-xs font-medium">
                                    {getRiskLevelText(probability, impact)}
                                  </div>
                                  <div className="text-lg font-bold mt-1">
                                    {cellRisks.length}
                                  </div>
                                  {cellRisks.length > 0 && (getRiskLevelText(probability, impact) === 'Crítico' || getRiskLevelText(probability, impact) === 'Alto') && (
                                    <Bell className="h-3 w-3 absolute top-1 right-1 text-destructive animate-pulse" />
                                  )}
                                </div>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Riscos - {probability} / {impact}
                                </DialogTitle>
                                <DialogDescription>
                                  Nível de risco: {getRiskLevelText(probability, impact)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {cellRisks.length > 0 ? (
                                  cellRisks.map((risk: any) => (
                                    <div key={risk.id} className="p-3 border rounded-lg">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-medium">{risk.description}</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Categoria: {risk.category}
                                          </p>
                                        </div>
                                        <Badge variant={
                                          getRiskLevelText(probability, impact) === 'Crítico' ? 'destructive' :
                                          getRiskLevelText(probability, impact) === 'Alto' ? 'default' : 'secondary'
                                        }>
                                          {getRiskLevelText(probability, impact)}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-center text-muted-foreground py-4">
                                    Nenhum risco identificado nesta combinação
                                  </p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QualityMatrix;