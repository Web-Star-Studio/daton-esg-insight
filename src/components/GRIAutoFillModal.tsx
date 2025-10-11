import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target,
  Loader2,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  autoFillMultipleIndicators,
  autoFillMandatoryIndicators,
  autoFillByCategory,
  getReportCompletenessStats,
  AutoFillSummary
} from "@/services/griAutoFill";

interface GRIAutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  companyId: string;
  onUpdate: () => void;
}

export function GRIAutoFillModal({ 
  isOpen, 
  onClose, 
  reportId, 
  companyId,
  onUpdate 
}: GRIAutoFillModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndicator, setCurrentIndicator] = useState('');
  const [results, setResults] = useState<AutoFillSummary | null>(null);
  const [completenessStats, setCompletenessStats] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'all' | 'mandatory' | 'category'>('mandatory');
  const [selectedCategory, setSelectedCategory] = useState('Universal');

  const categories = ['Universal', 'Ambiental', 'Social', 'Econômico', 'Governança'];

  useEffect(() => {
    if (isOpen) {
      loadCompletenessStats();
    }
  }, [isOpen, reportId]);

  const loadCompletenessStats = async () => {
    try {
      const stats = await getReportCompletenessStats(reportId);
      setCompletenessStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAutoFill = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentIndicator('');
    setResults(null);

    try {
      let summary: AutoFillSummary;

      const onProgress = (prog: number, current: string) => {
        setProgress(prog);
        setCurrentIndicator(current);
      };

      switch (selectedMode) {
        case 'mandatory':
          summary = await autoFillMandatoryIndicators(reportId, companyId, onProgress);
          break;
        case 'category':
          summary = await autoFillByCategory(reportId, companyId, selectedCategory, onProgress);
          break;
        default:
          summary = await autoFillMultipleIndicators(reportId, companyId, undefined, onProgress);
      }

      setResults(summary);
      
      toast({
        title: "Auto Preenchimento Concluído",
        description: `${summary.successful} indicadores preenchidos de ${summary.totalIndicators} processados. ${summary.skipped} já estavam completos. ⚠️ Revise e valide todos os valores sugeridos.`,
        variant: summary.successful > 0 ? "default" : "destructive",
      });

      // Recarregar estatísticas
      await loadCompletenessStats();
      onUpdate();

    } catch (error: any) {
      console.error('Erro no auto preenchimento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro durante o auto preenchimento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentIndicator('');
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Auto Preenchimento Inteligente
          </DialogTitle>
          <DialogDescription>
            Use dados existentes do sistema para preencher automaticamente os indicadores GRI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas de Completude */}
          {completenessStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Atual do Relatório</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{completenessStats.completed}</p>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{completenessStats.inProgress}</p>
                    <p className="text-sm text-muted-foreground">Em Progresso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{completenessStats.notStarted}</p>
                    <p className="text-sm text-muted-foreground">Não Iniciados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{completenessStats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Obrigatórios Completos</span>
                    <span>{completenessStats.mandatory.completed}/{completenessStats.mandatory.total}</span>
                  </div>
                  <Progress 
                    value={completenessStats.mandatory.total > 0 ? 
                      (completenessStats.mandatory.completed / completenessStats.mandatory.total) * 100 : 0
                    } 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opções de Preenchimento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opções de Preenchimento</CardTitle>
              <CardDescription>
                Escolha quais indicadores deseja preencher automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={selectedMode === 'mandatory' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedMode('mandatory')}
                  disabled={isProcessing}
                >
                  <Target className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Obrigatórios</p>
                    <p className="text-xs opacity-70">
                      Apenas indicadores obrigatórios
                    </p>
                  </div>
                </Button>

                <Button
                  variant={selectedMode === 'category' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedMode('category')}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Por Categoria</p>
                    <p className="text-xs opacity-70">
                      Selecionar categoria específica
                    </p>
                  </div>
                </Button>

                <Button
                  variant={selectedMode === 'all' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedMode('all')}
                  disabled={isProcessing}
                >
                  <Zap className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Todos</p>
                    <p className="text-xs opacity-70">
                      Todos os indicadores disponíveis
                    </p>
                  </div>
                </Button>
              </div>

              {/* Seleção de Categoria */}
              {selectedMode === 'category' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria:</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        disabled={isProcessing}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progresso */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando Auto Preenchimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                {currentIndicator && (
                  <p className="text-sm text-muted-foreground">
                    Processando: {currentIndicator}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resultados do Auto Preenchimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.successful}</p>
                    <p className="text-sm text-muted-foreground">Sucessos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.skipped}</p>
                    <p className="text-sm text-muted-foreground">Ignorados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                    <p className="text-sm text-muted-foreground">Falharam</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{results.processed}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>

                {/* Detalhes dos Resultados */}
                {results.results.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <h4 className="font-medium">Detalhes:</h4>
                    {results.results.slice(0, 10).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">{result.indicatorCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.confidence && (
                            <Badge className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                              {result.confidence}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {result.dataSource}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {results.results.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... e mais {results.results.length - 10} resultados
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : 'Cancelar'}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadCompletenessStats}
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={handleAutoFill}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? 'Processando...' : 'Iniciar Auto Preenchimento'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}