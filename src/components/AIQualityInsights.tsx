import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Zap
} from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';

const AIQualityInsights = () => {
  const { data: dashboard } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityManagementService.getQualityDashboard(),
  });

  const { data: indicators } = useQuery({
    queryKey: ['quality-indicators'],
    queryFn: () => qualityManagementService.getQualityIndicators(),
  });

  // Simulated AI insights based on real data
  const generateInsights = () => {
    if (!dashboard || !indicators) return [];

    const insights = [];

    // NC Trend Analysis
    if (indicators.ncTrend.change > 0) {
      insights.push({
        type: 'warning',
        category: 'Tendências',
        title: 'Aumento nas Não Conformidades',
        description: `Houve um aumento de ${indicators.ncTrend.change}% nas NCs este mês. Recomenda-se revisar processos críticos.`,
        impact: 'Alto',
        action: 'Realizar análise de causa raiz das NCs recentes',
        confidence: 85
      });
    }

    // Resolution Rate Analysis
    if (indicators.resolutionRate.percentage < 70) {
      insights.push({
        type: 'critical',
        category: 'Performance',
        title: 'Taxa de Resolução Baixa',
        description: `Apenas ${indicators.resolutionRate.percentage}% das NCs foram resolvidas. Meta ideal: 80%+`,
        impact: 'Crítico',
        action: 'Acelerar planos de ação corretiva',
        confidence: 92
      });
    }

    // Overdue Actions
    if (indicators.overdueActions > 0) {
      insights.push({
        type: 'warning',
        category: 'Prazos',
        title: 'Ações em Atraso',
        description: `${indicators.overdueActions} ações estão em atraso. Isso pode impactar a eficácia do SGQ.`,
        impact: 'Médio',
        action: 'Redistribuir responsabilidades e definir novos prazos',
        confidence: 90
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
        confidence: 95
      });
    } else if (indicators.qualityScore < 60) {
      insights.push({
        type: 'critical',
        category: 'Desempenho',
        title: 'Índice de Qualidade Crítico',
        description: `Índice atual de ${indicators.qualityScore}% requer atenção imediata.`,
        impact: 'Crítico',
        action: 'Revisar estratégia de qualidade e aumentar recursos',
        confidence: 88
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

  const recommendations = [
    {
      title: 'Implementar Análise Preditiva',
      description: 'Use ML para prever potenciais NCs baseado em padrões históricos',
      impact: 'Alto',
      effort: 'Médio',
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: 'Automatizar Alertas de Prazo',
      description: 'Configure notificações automáticas para ações próximas do vencimento',
      impact: 'Médio',
      effort: 'Baixo', 
      icon: <Clock className="h-5 w-5" />
    },
    {
      title: 'Dashboard Executivo',
      description: 'Crie painéis específicos para diferentes níveis hierárquicos',
      impact: 'Alto',
      effort: 'Alto',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      title: 'Gamificação da Qualidade',
      description: 'Implemente sistema de pontuação para engajar equipes',
      impact: 'Médio',
      effort: 'Alto',
      icon: <Target className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Insights de IA</h2>
          <p className="text-muted-foreground">Análises inteligentes do seu Sistema de Gestão da Qualidade</p>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights Automáticos</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
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
                      <Badge variant="outline">{insight.confidence}% confiança</Badge>
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
                    <Button size="sm" variant="outline">
                      Implementar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
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
                    <span className="text-sm font-medium">3-5 NCs esperadas</span>
                  </div>
                  <Progress value={65} />
                  <p className="text-xs text-muted-foreground">
                    Baseado em padrões históricos e sazonalidade
                  </p>
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
      </Tabs>
    </div>
  );
};

export default AIQualityInsights;