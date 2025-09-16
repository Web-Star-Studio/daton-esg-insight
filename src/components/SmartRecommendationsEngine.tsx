import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Target, 
  Zap, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Star,
  Users,
  Leaf
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartRecommendation {
  id: string;
  type: 'efficiency' | 'cost_saving' | 'risk_mitigation' | 'opportunity' | 'automation';
  title: string;
  description: string;
  category: 'environmental' | 'social' | 'governance' | 'operational';
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    financial: number; // Expected savings/revenue in currency
    environmental: number; // CO2e reduction or similar
    social: number; // Employee satisfaction, etc.
    operational: number; // Efficiency improvement %
  };
  effort: 'low' | 'medium' | 'high';
  timeframe: string; // "1-3 months", "3-6 months", etc.
  prerequisites: string[];
  actionSteps: string[];
  expectedROI: number; // Return on Investment %
  confidenceScore: number; // 0-1
  aiGenerated: boolean;
  implementationTips: string[];
  relatedGoals?: string[];
  createdAt: Date;
}

export const SmartRecommendationsEngine: React.FC = () => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'environmental' | 'social' | 'governance' | 'operational'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  // Fetch contextual data for recommendations
  const { data: contextData, isLoading } = useQuery({
    queryKey: ['recommendations-context'],
    queryFn: async () => {
      const [
        goalsResult,
        emissionsResult,
        licensesResult,
        assetsResult,
        esgMetricsResult
      ] = await Promise.all([
        supabase.from('goals').select('*').limit(20),
        supabase.from('calculated_emissions').select('*').limit(100),
        supabase.from('licenses').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('esg_metrics').select('*').limit(50)
      ]);

      return {
        goals: goalsResult.data || [],
        emissions: emissionsResult.data || [],
        licenses: licensesResult.data || [],
        assets: assetsResult.data || [],
        metrics: esgMetricsResult.data || []
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Generate smart recommendations based on context
  const generateRecommendations = async () => {
    if (!contextData || isGenerating) return;

    setIsGenerating(true);
    
    try {
      const newRecommendations: SmartRecommendation[] = [];

      // 1. Energy Efficiency Recommendations
      if (contextData.emissions.length > 0) {
        const avgEmissions = contextData.emissions.reduce((sum, e) => sum + (e.total_co2e || 0), 0) / contextData.emissions.length;
        
        if (avgEmissions > 100) { // Threshold for energy efficiency recommendation
          newRecommendations.push({
            id: 'energy-efficiency-led',
            type: 'efficiency',
            title: 'Migração para Iluminação LED',
            description: 'Substitua toda iluminação convencional por LED para reduzir consumo energético em até 60%',
            category: 'environmental',
            priority: 'high',
            impact: {
              financial: 25000, // R$ savings per year
              environmental: avgEmissions * 0.15, // 15% emissions reduction
              social: 0,
              operational: 20 // 20% efficiency improvement
            },
            effort: 'medium',
            timeframe: '2-4 meses',
            prerequisites: [
              'Auditoria energética',
              'Orçamento aprovado',
              'Fornecedor qualificado'
            ],
            actionSteps: [
              'Realizar levantamento do parque de iluminação atual',
              'Calcular ROI por área/setor',
              'Solicitar orçamentos de fornecedores',
              'Implementar em fases priorizando áreas de maior uso',
              'Monitorar economia energética mensalmente'
            ],
            expectedROI: 180, // 180% over 3 years
            confidenceScore: 0.9,
            aiGenerated: true,
            implementationTips: [
              'Comece pelas áreas de maior uso para maximizar impacto inicial',
              'Considere sensores de presença para maximizar economia',
              'Negocie desconto por volume com fornecedores'
            ],
            relatedGoals: contextData.goals.filter(g => g.name.toLowerCase().includes('energia')).map(g => g.id),
            createdAt: new Date()
          });
        }
      }

      // 2. Digital Transformation Recommendations
      if (contextData.assets.length > 10) {
        newRecommendations.push({
          id: 'iot-monitoring',
          type: 'automation',
          title: 'Sistema IoT para Monitoramento de Ativos',
          description: 'Implemente sensores IoT para monitoramento em tempo real de equipamentos críticos',
          category: 'operational',
          priority: 'medium',
          impact: {
            financial: 50000, // Savings from preventive maintenance
            environmental: 0,
            social: 15, // Employee satisfaction with better tools
            operational: 40 // 40% improvement in asset monitoring
          },
          effort: 'high',
          timeframe: '4-8 meses',
          prerequisites: [
            'Infraestrutura de rede adequada',
            'Equipe técnica treinada',
            'Budget para sensores e plataforma'
          ],
          actionSteps: [
            'Identificar ativos críticos para monitoramento',
            'Selecionar tecnologia IoT apropriada',
            'Implementar projeto piloto',
            'Expandir gradualmente para todos os ativos',
            'Integrar com sistema de manutenção existente'
          ],
          expectedROI: 250,
          confidenceScore: 0.8,
          aiGenerated: true,
          implementationTips: [
            'Comece com um piloto em 3-5 equipamentos críticos',
            'Integre alertas ao sistema de notificações existente',
            'Treine equipe de manutenção antes da implementação'
          ],
          createdAt: new Date()
        });
      }

      // 3. Compliance Automation
      if (contextData.licenses.length > 5) {
        newRecommendations.push({
          id: 'compliance-automation',
          type: 'automation',
          title: 'Automatização do Controle de Licenças',
          description: 'Sistema automatizado para alertas e renovação de licenças ambientais',
          category: 'governance',
          priority: 'high',
          impact: {
            financial: 15000, // Avoid fines and operational disruptions
            environmental: 0,
            social: 0,
            operational: 60 // 60% reduction in compliance management time
          },
          effort: 'low',
          timeframe: '1-2 meses',
          prerequisites: [
            'Cadastro completo de todas as licenças',
            'Integração com calendário corporativo'
          ],
          actionSteps: [
            'Catalogar todas as licenças e prazos',
            'Configurar alertas automáticos (90, 60, 30 dias)',
            'Criar workflow de renovação',
            'Integrar com sistema de documentos',
            'Treinar equipe responsável'
          ],
          expectedROI: 300,
          confidenceScore: 0.95,
          aiGenerated: true,
          implementationTips: [
            'Configure múltiplos lembretes para garantir ação',
            'Inclua responsáveis e backup em cada alerta',
            'Mantenha documentos digitalizados e acessíveis'
          ],
          relatedGoals: contextData.goals.filter(g => g.name.toLowerCase().includes('compliance')).map(g => g.id),
          createdAt: new Date()
        });
      }

      // 4. Data Analytics Enhancement
      if (contextData.metrics.length > 0) {
        newRecommendations.push({
          id: 'advanced-analytics',
          type: 'opportunity',
          title: 'Dashboard Analítico Avançado ESG',
          description: 'Implemente dashboards com IA para identificar padrões e oportunidades nos dados ESG',
          category: 'governance',
          priority: 'medium',
          impact: {
            financial: 30000, // Better decision making value
            environmental: 0,
            social: 20, // Better data-driven decisions
            operational: 35 // Improved decision making speed
          },
          effort: 'medium',
          timeframe: '2-3 meses',
          prerequisites: [
            'Dados ESG estruturados',
            'Equipe de analytics ou consultoria',
            'Ferramenta de BI definida'
          ],
          actionSteps: [
            'Definir KPIs e métricas prioritárias',
            'Estruturar fontes de dados',
            'Desenvolver dashboards interativos',
            'Implementar alertas automáticos',
            'Treinar usuários finais'
          ],
          expectedROI: 200,
          confidenceScore: 0.75,
          aiGenerated: true,
          implementationTips: [
            'Priorize visualizações que facilitem tomada de decisão',
            'Implemente filtros por período, departamento e meta',
            'Configure relatórios automáticos mensais'
          ],
          createdAt: new Date()
        });
      }

      // 5. Waste Reduction Program
      newRecommendations.push({
        id: 'waste-reduction',
        type: 'cost_saving',
        title: 'Programa de Redução de Resíduos',
        description: 'Implemente programa estruturado de redução, reutilização e reciclagem',
        category: 'environmental',
        priority: 'medium',
        impact: {
          financial: 20000, // Cost savings from waste reduction
          environmental: 50, // Waste reduction in tons
          social: 25, // Employee engagement in sustainability
          operational: 15 // Process efficiency improvement
        },
        effort: 'medium',
        timeframe: '3-6 meses',
        prerequisites: [
          'Auditoria de resíduos atual',
          'Parcerias com cooperativas/recicladores',
          'Engajamento da equipe'
        ],
        actionSteps: [
          'Realizar diagnóstico completo dos resíduos',
          'Estabelecer metas de redução por tipo',
          'Implementar pontos de coleta seletiva',
          'Treinar colaboradores',
          'Monitorar e reportar resultados mensalmente'
        ],
        expectedROI: 150,
        confidenceScore: 0.85,
        aiGenerated: true,
        implementationTips: [
          'Envolva colaboradores na definição das metas',
          'Crie campanhas de conscientização regulares',
          'Estabeleça incentivos para departamentos'
        ],
        createdAt: new Date()
      });

      setRecommendations(newRecommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedROI - a.expectedROI;
      }));

      toast.success('Recomendações Atualizadas', {
        description: `${newRecommendations.length} recomendações inteligentes geradas`,
        duration: 4000,
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Erro ao gerar recomendações');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on data load
  React.useEffect(() => {
    if (contextData && !isLoading && recommendations.length === 0) {
      generateRecommendations();
    }
  }, [contextData, isLoading]);

  // Filter recommendations
  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  // Get icon for recommendation type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'efficiency':
        return <Zap className="h-4 w-4 text-primary" />;
      case 'cost_saving':
        return <DollarSign className="h-4 w-4 text-success" />;
      case 'risk_mitigation':
        return <Target className="h-4 w-4 text-warning" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-info" />;
      case 'automation':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental':
        return <Leaf className="h-4 w-4 text-green-500" />;
      case 'social':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'governance':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'operational':
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-muted-foreground" />;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando contexto para recomendações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recomendações Inteligentes</CardTitle>
            {isGenerating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex space-x-2 mt-3">
          {[
            { key: 'all', label: 'Todas', count: recommendations.length },
            { key: 'environmental', label: 'Ambiental', count: recommendations.filter(r => r.category === 'environmental').length },
            { key: 'operational', label: 'Operacional', count: recommendations.filter(r => r.category === 'operational').length },
            { key: 'governance', label: 'Governança', count: recommendations.filter(r => r.category === 'governance').length },
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key as any)}
              className="text-xs"
            >
              {label} ({count})
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {filteredRecommendations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {isGenerating ? (
                <p>Gerando recomendações personalizadas...</p>
              ) : (
                <div>
                  <p className="mb-2">Nenhuma recomendação encontrada</p>
                  <p className="text-xs">As recomendações são baseadas nos dados da sua empresa</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(rec.type)}
                      {getCategoryIcon(rec.category)}
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(rec.priority) as any} className="text-xs">
                        {rec.priority}
                      </Badge>
                      {rec.aiGenerated && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>

                  {/* Impact summary */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ROI Esperado:</span>
                      <span className="font-medium text-success">{rec.expectedROI}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Economia:</span>
                      <span className="font-medium">{formatCurrency(rec.impact.financial)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-medium">{rec.timeframe}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Esforço:</span>
                      <Badge variant="outline" className="text-xs">
                        {rec.effort}
                      </Badge>
                    </div>
                  </div>

                  {/* Confidence score */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs text-muted-foreground">Confiança:</span>
                    <Progress value={rec.confidenceScore * 100} className="h-1 flex-1 max-w-20" />
                    <span className="text-xs font-medium">{Math.round(rec.confidenceScore * 100)}%</span>
                  </div>

                  {/* Expandable details */}
                  {expandedRec === rec.id && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-3">
                      {/* Prerequisites */}
                      {rec.prerequisites.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Pré-requisitos:</h5>
                          <ul className="space-y-1">
                            {rec.prerequisites.map((prereq, index) => (
                              <li key={index} className="flex items-start space-x-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{prereq}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action steps */}
                      <div>
                        <h5 className="text-xs font-medium mb-1">Passos de Implementação:</h5>
                        <ol className="space-y-1">
                          {rec.actionSteps.slice(0, 3).map((step, index) => (
                            <li key={index} className="flex items-start space-x-2 text-xs">
                              <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium mt-0.5 flex-shrink-0">
                                {index + 1}
                              </div>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                          {rec.actionSteps.length > 3 && (
                            <li className="text-xs text-muted-foreground ml-6">
                              +{rec.actionSteps.length - 3} passos adicionais...
                            </li>
                          )}
                        </ol>
                      </div>

                      {/* Implementation tips */}
                      {rec.implementationTips.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Dicas de Implementação:</h5>
                          <ul className="space-y-1">
                            {rec.implementationTips.slice(0, 2).map((tip, index) => (
                              <li key={index} className="flex items-start space-x-2 text-xs">
                                <Lightbulb className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
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
                      onClick={() => setExpandedRec(
                        expandedRec === rec.id ? null : rec.id
                      )}
                      className="text-xs h-7"
                    >
                      {expandedRec === rec.id ? 'Menos detalhes' : 'Ver detalhes'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success('Recomendação Aceita', {
                          description: `Iniciando implementação: ${rec.title}`,
                          duration: 4000,
                        });
                      }}
                      className="text-xs h-7"
                    >
                      Implementar
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
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