import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Lightbulb,
  X,
  RefreshCw,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useContextualAI } from '@/hooks/useContextualAI';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const ContextualInsightsPanel: React.FC = () => {
  const {
    insights,
    context,
    isAnalyzing,
    refreshInsights,
    dismissInsight,
    getPriorityInsights,
    getActionableInsights,
    stats
  } = useContextualAI();

  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'actionable'>('all');

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-success" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'recommendation':
        return <Target className="h-4 w-4 text-info" />;
      default:
        return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getFilteredInsights = () => {
    switch (filter) {
      case 'critical':
        return getPriorityInsights('critical');
      case 'actionable':
        return getActionableInsights();
      default:
        return insights;
    }
  };

  const handleActionClick = (insight: any) => {
    toast.success('Ação iniciada', {
      description: `Iniciando implementação das ações sugeridas para: ${insight.title}`,
      duration: 4000,
    });
  };

  if (!context && !isAnalyzing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Carregando contexto da empresa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Insights Contextuais</CardTitle>
            {isAnalyzing && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span>Analisando...</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshInsights}
            disabled={isAnalyzing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-destructive">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-success">{stats.opportunities}</div>
            <div className="text-xs text-muted-foreground">Oportunidades</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">{stats.actionable}</div>
            <div className="text-xs text-muted-foreground">Acionáveis</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('critical')}
            className="text-xs"
          >
            Críticos
          </Button>
          <Button
            variant={filter === 'actionable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('actionable')}
            className="text-xs"
          >
            Acionáveis
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {getFilteredInsights().length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {isAnalyzing ? (
                <p>Gerando insights personalizados...</p>
              ) : (
                <div>
                  <p className="mb-2">Nenhum insight encontrado</p>
                  <p className="text-xs">Os insights são gerados com base nos dados da sua empresa</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {getFilteredInsights().map((insight) => (
                <div key={insight.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(insight.priority) as any} className="text-xs">
                        {insight.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissInsight(insight.id)}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                  {/* Confidence Score */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs text-muted-foreground">Confiança:</span>
                    <Progress value={insight.confidence * 100} className="h-1 flex-1 max-w-20" />
                    <span className="text-xs font-medium">{Math.round(insight.confidence * 100)}%</span>
                  </div>

                  {/* Deadline */}
                  {insight.deadline && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <span>
                        Prazo: {formatDistanceToNow(insight.deadline, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  )}

                  {/* Expandable Details */}
                  {expandedInsight === insight.id && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-3">
                      {insight.estimatedImpact && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Impacto Estimado:</h5>
                          <p className="text-xs text-muted-foreground">{insight.estimatedImpact}</p>
                        </div>
                      )}

                      {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Ações Sugeridas:</h5>
                          <ul className="space-y-1">
                            {insight.suggestedActions.map((action, index) => (
                              <li key={index} className="flex items-start space-x-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedInsight(
                        expandedInsight === insight.id ? null : insight.id
                      )}
                      className="text-xs h-7"
                    >
                      {expandedInsight === insight.id ? 'Menos detalhes' : 'Mais detalhes'}
                    </Button>

                    {insight.actionable && (
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(insight)}
                        className="text-xs h-7"
                      >
                        Implementar
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};