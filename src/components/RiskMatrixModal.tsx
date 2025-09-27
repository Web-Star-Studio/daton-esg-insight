import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { getESGRisks } from "@/services/esgRisks";
import { X, Eye, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface RiskMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrixId?: string;
  matrixName?: string;
  onViewRisk?: (risk: any) => void;
}

export function RiskMatrixModal({ isOpen, onClose, matrixId, matrixName, onViewRisk }: RiskMatrixModalProps) {
  const [selectedCell, setSelectedCell] = useState<{probability: string, impact: string} | null>(null);

  const { data: risks = [] } = useOptimizedQuery({
    queryKey: ['esg-risks'],
    queryFn: getESGRisks,
    enabled: isOpen
  });

  const probabilityLevels = ['Alta', 'Média', 'Baixa'];
  const impactLevels = ['Baixo', 'Médio', 'Alto'];

  const getRiskLevel = (probability: string, impact: string) => {
    const probIndex = probabilityLevels.indexOf(probability);
    const impactIndex = impactLevels.indexOf(impact);
    
    if (probIndex === 0 && impactIndex === 2) return 'Crítico';
    if ((probIndex === 0 && impactIndex === 1) || (probIndex === 1 && impactIndex === 2)) return 'Alto';
    if ((probIndex === 0 && impactIndex === 0) || (probIndex === 1 && impactIndex === 1) || (probIndex === 2 && impactIndex === 2)) return 'Médio';
    if ((probIndex === 1 && impactIndex === 0) || (probIndex === 2 && impactIndex === 1)) return 'Baixo';
    return 'Muito Baixo';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'bg-red-500 text-white hover:bg-red-600';
      case 'Alto': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'Médio': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'Baixo': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'Muito Baixo': return 'bg-green-500 text-white hover:bg-green-600';
      default: return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    }
  };

  const getCellRisks = (probability: string, impact: string) => {
    return risks.filter(risk => 
      risk.probability === probability && 
      risk.impact === impact &&
      risk.status === 'Ativo'
    );
  };

  const getCellStats = () => {
    const stats = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      veryLow: 0
    };

    probabilityLevels.forEach(probability => {
      impactLevels.forEach(impact => {
        const cellRisks = getCellRisks(probability, impact);
        const level = getRiskLevel(probability, impact);
        stats.total += cellRisks.length;
        
        switch (level) {
          case 'Crítico': stats.critical += cellRisks.length; break;
          case 'Alto': stats.high += cellRisks.length; break;
          case 'Médio': stats.medium += cellRisks.length; break;
          case 'Baixo': stats.low += cellRisks.length; break;
          case 'Muito Baixo': stats.veryLow += cellRisks.length; break;
        }
      });
    });

    return stats;
  };

  const stats = getCellStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Matriz de Riscos - {matrixName || 'Matriz ESG'}
            </DialogTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-muted-foreground">Críticos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                <div className="text-sm text-muted-foreground">Altos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                <div className="text-sm text-muted-foreground">Médios</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
                <div className="text-sm text-muted-foreground">Baixos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.veryLow}</div>
                <div className="text-sm text-muted-foreground">Muito Baixos</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matriz de Risco */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Matriz de Probabilidade vs Impacto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 text-center font-medium text-sm">Prob. \ Impacto</div>
                      {impactLevels.map(impact => (
                        <div key={impact} className="p-2 text-center font-medium text-sm bg-muted rounded">
                          {impact}
                        </div>
                      ))}
                    </div>

                    {/* Matrix Rows */}
                    {probabilityLevels.map(probability => (
                      <div key={probability} className="grid grid-cols-4 gap-2">
                        <div className="p-2 text-center font-medium text-sm bg-muted rounded">
                          {probability}
                        </div>
                        {impactLevels.map(impact => {
                          const cellRisks = getCellRisks(probability, impact);
                          const riskLevel = getRiskLevel(probability, impact);
                          
                          return (
                            <Button
                              key={`${probability}-${impact}`}
                              variant="outline"
                              className={`h-20 ${getRiskLevelColor(riskLevel)} border-2`}
                              onClick={() => setSelectedCell({ probability, impact })}
                            >
                              <div className="text-center">
                                <div className="text-xs font-medium">{riskLevel}</div>
                                <div className="text-2xl font-bold">{cellRisks.length}</div>
                                <div className="text-xs">riscos</div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhes da Célula Selecionada */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedCell 
                      ? `${selectedCell.probability} Probabilidade / ${selectedCell.impact} Impacto`
                      : 'Selecione uma célula'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCell ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge className={getRiskLevelColor(getRiskLevel(selectedCell.probability, selectedCell.impact)).replace('hover:', '')}>
                          {getRiskLevel(selectedCell.probability, selectedCell.impact)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getCellRisks(selectedCell.probability, selectedCell.impact).map(risk => (
                          <div key={risk.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{risk.risk_title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {risk.esg_category}
                                </p>
                              </div>
                              {onViewRisk && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewRisk(risk)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {risk.risk_description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {risk.risk_description}
                              </p>
                            )}
                          </div>
                        ))}
                        
                        {getCellRisks(selectedCell.probability, selectedCell.impact).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum risco nesta categoria</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Clique em uma célula da matriz para ver os riscos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}