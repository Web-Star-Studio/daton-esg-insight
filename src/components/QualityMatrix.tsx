import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Activity, Shield, TrendingUp } from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';

interface QualityMatrixProps {
  matrixId?: string;
}

const QualityMatrix: React.FC<QualityMatrixProps> = ({ matrixId }) => {
  const [selectedMatrixId, setSelectedMatrixId] = useState(matrixId || '');
  
  const { data: matrices } = useQuery({
    queryKey: ['risk-matrices'],
    queryFn: () => qualityManagementService.getRiskMatrices(),
  });

  const { data: riskMatrix, isLoading } = useQuery({
    queryKey: ['risk-matrix', selectedMatrixId],
    queryFn: () => qualityManagementService.getRiskMatrix(selectedMatrixId),
    enabled: !!selectedMatrixId,
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Matrix Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Riscos</h3>
          <p className="text-sm text-muted-foreground">
            Visualize e analise os riscos por probabilidade e impacto
          </p>
        </div>
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

      {riskMatrix && (
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
                                className={`h-20 ${getRiskColor(probability, impact)} hover:opacity-80 transition-opacity`}
                              >
                                <div className="text-center">
                                  <div className="text-xs font-medium">
                                    {getRiskLevelText(probability, impact)}
                                  </div>
                                  <div className="text-lg font-bold mt-1">
                                    {cellRisks.length}
                                  </div>
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
    </div>
  );
};

export default QualityMatrix;