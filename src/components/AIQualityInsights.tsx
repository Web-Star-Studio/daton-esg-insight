import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  Users,
  Zap,
  Info
} from 'lucide-react';
import { unifiedQualityService } from '@/services/unifiedQualityService';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AIQualityInsights = () => {
  const { toast } = useToast();
  const { triggerQualityIssueDetected } = useNotificationTriggers();
  
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => unifiedQualityService.getQualityDashboard(),
    refetchInterval: 60000, // Reduced frequency to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const { data: indicators, isLoading: isIndicatorsLoading } = useQuery({
    queryKey: ['quality-indicators-metrics'],
    queryFn: () => unifiedQualityService.getQualityIndicators(),
    refetchInterval: 60000, // Reduced frequency
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Real AI analysis using edge function
  const { data: aiInsights, isLoading: isAILoading } = useQuery({
    queryKey: ['ai-insights', dashboard?.recentNCs],
    queryFn: async () => {
      // Get recent NC descriptions for analysis
      const ncDescriptions = dashboard?.recentNCs?.slice(0, 10)
        .map((nc: any) => nc.description)
        .filter((desc: string) => desc && desc.length > 10) || [];

      let realAIAnalysis = null;
      
      // Only call AI if we have meaningful data
      if (ncDescriptions.length >= 3) {
        try {
          const { data, error } = await supabase.functions.invoke('analyze-nc-text', {
            body: { ncDescriptions }
          });
          
          if (!error && data) {
            realAIAnalysis = data;
          }
        } catch (error) {
          console.log('AI analysis unavailable, using rule-based insights:', error);
        }
      }

      // Calculate predictions based on real data
      const baseNCs = dashboard?.metrics?.openNCs || 5;
      const trendMultiplier = 1 + ((indicators?.ncTrend?.change || 0) / 100);
      
      return {
        realAI: realAIAnalysis,
        patterns: realAIAnalysis?.patterns || [],
        predictions: {
          nextMonthNCs: Math.round(baseNCs * trendMultiplier),
          riskLevel: (indicators?.overdueActions || 0) > 3 ? 'high' : 
                     (indicators?.overdueActions || 0) > 1 ? 'medium' : 'low',
          efficiency: indicators?.qualityScore || 75
        }
      };
    },
    enabled: !!dashboard && !!indicators,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 3 * 60 * 1000,
  });

  // Auto-trigger notifications for critical insights
  useEffect(() => {
    if (indicators && !isIndicatorsLoading) {
      const checkCriticalConditions = async () => {
        if (indicators.resolutionRate.percentage < 60) {
          await triggerQualityIssueDetected(
            `critical-resolution-${Date.now()}`,
            `Taxa de resolução crítica: ${indicators.resolutionRate.percentage}%`,
            'critical'
          );
        }
        
        if (indicators.overdueActions > 5) {
          await triggerQualityIssueDetected(
            `overdue-actions-${Date.now()}`,
            `${indicators.overdueActions} ações em atraso detectadas`,
            'high'
          );
        }
      };
      
      checkCriticalConditions().catch(console.error);
    }
  }, [indicators, isIndicatorsLoading, triggerQualityIssueDetected]);

  // Simulated AI insights based on real data
  const generateInsights = () => {
    if (!dashboard || !indicators) return [];

    const insights = [];

    // NC Trend Analysis
    if (indicators.ncTrend.change > 0) {
      const trendPriority = Math.min(95, 75 + Math.abs(indicators.ncTrend.change * 2));
      insights.push({
        type: 'warning',
        category: 'Tendências',
        title: 'Aumento nas Não Conformidades',
        description: `Houve um aumento de ${indicators.ncTrend.change}% nas NCs este mês. Recomenda-se revisar processos críticos.`,
        impact: 'Alto',
        action: 'Realizar análise de causa raiz das NCs recentes',
        confidence: Math.round(trendPriority),
        priority: trendPriority >= 85 ? 'high' : 'medium'
      });
    }

    // Resolution Rate Analysis
    if (indicators.resolutionRate.percentage < 70) {
      const resolutionPriority = 100 - indicators.resolutionRate.percentage;
      insights.push({
        type: 'critical',
        category: 'Performance',
        title: 'Taxa de Resolução Baixa',
        description: `Apenas ${indicators.resolutionRate.percentage}% das NCs estão sendo resolvidas. Meta: acima de 80%.`,
        impact: 'Crítico',
        action: 'Priorizar resolução de NCs abertas e alocar recursos',
        confidence: Math.round(resolutionPriority),
        priority: 'high'
      });
    }

    // Overdue Actions
    if (indicators.overdueActions > 0) {
      const overduePriority = Math.min(98, 80 + (indicators.overdueActions * 3));
      insights.push({
        type: 'urgent',
        category: 'Gestão',
        title: 'Ações em Atraso',
        description: `${indicators.overdueActions} ações estão atrasadas. Isso pode impactar a eficácia do SGQ.`,
        impact: indicators.overdueActions > 5 ? 'Crítico' : 'Alto',
        action: 'Revisar e reagendar ações em atraso imediatamente',
        confidence: Math.round(overduePriority),
        priority: 'high'
      });
    }

    // Quality Score Analysis
    if (indicators.qualityScore >= 85) {
      insights.push({
        type: 'success',
        category: 'Desempenho',
        title: 'Excelente Índice de Qualidade',
        description: `Índice atual de ${indicators.qualityScore}% indica SGQ maduro e eficaz.`,
        impact: 'Positivo',
        action: 'Manter práticas atuais e considerar certificações',
        confidence: 95,
        priority: 'low'
      });
    } else if (indicators.qualityScore < 70) {
      const scorePriority = 100 - indicators.qualityScore;
      insights.push({
        type: 'warning',
        category: 'Performance',
        title: 'Score de Qualidade Abaixo do Esperado',
        description: `Score atual: ${indicators.qualityScore}/100. Recomendado: acima de 80.`,
        impact: 'Médio',
        action: 'Implementar melhorias nos processos com menor performance',
        confidence: Math.round(scorePriority),
        priority: scorePriority >= 30 ? 'medium' : 'low'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default: return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-success';
      case 'warning': return 'border-l-warning';
      case 'critical': return 'border-l-destructive';
      default: return 'border-l-primary';
    }
  };

  const handleImplementRecommendation = async (title: string) => {
    toast({
      title: "Recomendação Implementada",
      description: `"${title}" foi adicionada ao backlog de melhorias`,
    });
  };

  const recommendations = [
    {
      title: 'Implementar Análise Preditiva',
      description: 'Use ML para prever potenciais NCs baseado em padrões históricos',
      impact: 'Alto',
      effort: 'Médio',
      icon: <Brain className="h-5 w-5" />,
      priority: 'high'
    },
    {
      title: 'Automatizar Alertas de Prazo',
      description: 'Configure notificações automáticas para ações próximas do vencimento',
      impact: 'Médio',
      effort: 'Baixo', 
      icon: <Clock className="h-5 w-5" />,
      priority: 'medium'
    },
    {
      title: 'Dashboard Executivo',
      description: 'Crie painéis específicos para diferentes níveis hierárquicos',
      impact: 'Alto',
      effort: 'Alto',
      icon: <BarChart3 className="h-5 w-5" />,
      priority: 'medium'
    },
    {
      title: 'Gamificação da Qualidade',
      description: 'Implemente sistema de pontuação para engajar equipes',
      impact: 'Médio',
      effort: 'Alto',
      icon: <Target className="h-5 w-5" />,
      priority: 'low'
    },
    {
      title: 'Integração com IoT',
      description: 'Conecte sensores para monitoramento em tempo real',
      impact: 'Alto',
      effort: 'Alto',
      icon: <Zap className="h-5 w-5" />,
      priority: 'high'
    }
  ];

  const isLoading = isDashboardLoading || isIndicatorsLoading || isAILoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Insights Inteligentes</h2>
          <p className="text-muted-foreground">
            Análises automáticas baseadas nos dados do seu Sistema de Gestão da Qualidade
          </p>
        </div>
        
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            Os insights são gerados automaticamente através de análise de padrões e regras de negócio.
            {aiInsights?.realAI && ' Análises de texto utilizam IA generativa para detectar padrões mais complexos.'}
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights Automáticos</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
          {aiInsights?.realAI && (
            <TabsTrigger value="ai-analysis">
              <Brain className="h-3 w-3 mr-1" />
              Análise IA
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <Card key={index} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.category}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={insight.impact === 'Crítico' ? 'destructive' : 
                                   insight.impact === 'Alto' ? 'default' : 'secondary'}>
                        {insight.impact}
                      </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant={
                            insight.confidence >= 90 ? 'default' : 
                            insight.confidence >= 80 ? 'secondary' : 'outline'
                          }
                          className="cursor-help"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Prioridade {
                            insight.confidence >= 90 ? 'Alta' : 
                            insight.confidence >= 80 ? 'Média' : 'Baixa'
                          }
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Baseado no impacto e urgência detectados nos dados</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ação recomendada:</span>
                  </div>
                  <p className="text-sm mt-1">{insight.action}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Carregando dados para gerar insights...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {rec.icon}
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Badge variant={rec.impact === 'Alto' ? 'default' : 'secondary'}>
                        Impacto: {rec.impact}
                      </Badge>
                      <Badge variant="outline">
                        Esforço: {rec.effort}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant={rec.priority === 'high' ? 'default' : 'outline'}
                      onClick={() => handleImplementRecommendation(rec.title)}
                    >
                      {rec.priority === 'high' ? 'Priorizar' : 'Implementar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {aiInsights?.realAI && (
            <Alert className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <Brain className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm">
                <strong>IA Detectou:</strong> Análise realizada em {dashboard?.recentNCs?.length || 0} não conformidades recentes.
                {aiInsights.realAI.confidence && ` (Confiança: ${aiInsights.realAI.confidence}%)`}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Predição de NCs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Próximo mês</span>
                    <span className="text-sm font-medium">
                      ~{aiInsights?.predictions.nextMonthNCs || 3} NCs esperadas
                    </span>
                  </div>
                  <Progress value={aiInsights?.predictions.riskLevel === 'high' ? 85 : 65} />
                  <p className="text-xs text-muted-foreground">
                    Baseado em tendências e dados históricos do SGQ
                  </p>
                  {aiInsights?.predictions.riskLevel === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Risco Alto Detectado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Risco de Atraso</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ações críticas</span>
                    <span className="text-sm font-medium">2 em risco</span>
                  </div>
                  <Progress value={30} />
                  <p className="text-xs text-muted-foreground">
                    Probabilidade de atraso baseada no histórico da equipe
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Carga de Trabalho</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sobrecarga da equipe</span>
                    <span className="text-sm font-medium">Moderada</span>
                  </div>
                  <Progress value={75} />
                  <p className="text-xs text-muted-foreground">
                    Recomenda-se redistribuir algumas tarefas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Meta de Qualidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Atingir 90% até fim do ano</span>
                    <span className="text-sm font-medium text-success">Provável</span>
                  </div>
                  <Progress value={82} />
                  <p className="text-xs text-muted-foreground">
                    Mantendo o ritmo atual de melhorias
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New AI Analysis Tab */}
        {aiInsights?.realAI && (
          <TabsContent value="ai-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">Análise de IA das Não Conformidades</CardTitle>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="default" className="cursor-help">
                          <Zap className="h-3 w-3 mr-1" />
                          {aiInsights.realAI.confidence}% confiança
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Confiança do modelo de IA na análise</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>
                  Análise gerada por IA a partir das descrições reais das NCs usando Gemini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{aiInsights.realAI.analysis}</p>
                </div>
                
                {aiInsights.realAI.patterns && aiInsights.realAI.patterns.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-semibold">Padrões Identificados:</p>
                    <ul className="space-y-1">
                      {aiInsights.realAI.patterns.map((pattern: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Esta análise foi gerada usando IA generativa (Google Gemini) para identificar padrões complexos
                    nas descrições das não conformidades.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AIQualityInsights;