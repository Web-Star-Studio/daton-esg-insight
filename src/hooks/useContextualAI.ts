import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContextualInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  relatedData: any;
  suggestedActions?: string[];
  estimatedImpact?: string;
  deadline?: Date;
}

interface BusinessContext {
  industryType: string;
  companySize: 'small' | 'medium' | 'large';
  locations: string[];
  currentGoals: any[];
  recentActivity: any;
  complianceStatus: string;
  riskLevel: string;
}

export const useContextualAI = () => {
  const [insights, setInsights] = useState<ContextualInsight[]>([]);
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Gather business context data
  const { data: contextData, isLoading: contextLoading } = useQuery({
    queryKey: ['business-context'],
    queryFn: async () => {
      const [
        companyResult,
        goalsResult,
        emissionsResult,
        licensesResult,
        assetsResult
      ] = await Promise.all([
        supabase.from('companies').select('*').single(),
        supabase.from('goals').select('*').limit(10),
        supabase.from('calculated_emissions').select('*').limit(100),
        supabase.from('licenses').select('*').limit(50),
        supabase.from('assets').select('*').limit(50)
      ]);

      return {
        company: companyResult.data,
        goals: goalsResult.data || [],
        emissions: emissionsResult.data || [],
        licenses: licensesResult.data || [],
        assets: assetsResult.data || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Build business context
  const businessContext = useMemo(() => {
    if (!contextData) return null;

    const { company, goals, emissions, licenses, assets } = contextData;
    
    return {
      industryType: company?.sector || 'Industrial',
      companySize: assets.length > 50 ? 'large' : assets.length > 10 ? 'medium' : 'small',
      locations: [...new Set(assets.map(a => a.location).filter(Boolean))],
      currentGoals: goals,
      recentActivity: {
        emissionsCount: emissions.length,
        licensesExpiring: licenses.filter(l => {
          const expDate = new Date(l.expiration_date);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expDate <= thirtyDaysFromNow;
        }).length,
        activeAssets: assets.filter(a => a.operational_status === 'Operacional').length
      },
      complianceStatus: licenses.every(l => l.status === 'Ativa') ? 'compliant' : 'at-risk',
      riskLevel: licenses.filter(l => l.status === 'Vencida').length > 0 ? 'high' : 'medium'
    } as BusinessContext;
  }, [contextData]);

  // Generate contextual insights
  const generateInsights = async (forceRefresh = false) => {
    if (!businessContext || (insights.length > 0 && !forceRefresh)) return;

    setIsAnalyzing(true);
    
    try {
      const newInsights: ContextualInsight[] = [];

      // 1. Compliance Risk Analysis
      if (businessContext.riskLevel === 'high') {
        newInsights.push({
          id: 'compliance-risk',
          type: 'warning',
          title: 'Risco de Não Conformidade Detectado',
          description: 'Identificamos licenças vencidas que podem impactar suas operações',
          confidence: 0.95,
          priority: 'critical',
          actionable: true,
          relatedData: businessContext.recentActivity,
          suggestedActions: [
            'Renovar licenças vencidas imediatamente',
            'Implementar sistema de alertas automáticos',
            'Agendar reunião com órgãos reguladores'
          ],
          estimatedImpact: 'Alto risco de multas e paralisação',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }

      // 2. Emissions Trend Analysis
      if (businessContext.recentActivity.emissionsCount > 0) {
        const emissionsTrend = await analyzeEmissionsTrend(contextData?.emissions || []);
        if (emissionsTrend.isIncreasing) {
          newInsights.push({
            id: 'emissions-trend',
            type: 'warning',
            title: 'Tendência de Aumento nas Emissões',
            description: `Suas emissões aumentaram ${emissionsTrend.percentage}% nos últimos meses`,
            confidence: emissionsTrend.confidence,
            priority: emissionsTrend.percentage > 20 ? 'high' : 'medium',
            actionable: true,
            relatedData: emissionsTrend,
            suggestedActions: [
              'Revisar processos operacionais',
              'Implementar medidas de eficiência energética',
              'Considerar fontes de energia renovável'
            ],
            estimatedImpact: 'Impacto negativo nas metas de sustentabilidade'
          });
        }
      }

      // 3. Goal Achievement Predictions
      for (const goal of businessContext.currentGoals) {
        const prediction = predictGoalAchievement(goal);
        if (prediction.risk === 'high') {
          newInsights.push({
            id: `goal-risk-${goal.id}`,
            type: 'warning',
            title: `Meta "${goal.title}" em Risco`,
            description: `Probabilidade de ${prediction.probability}% de não atingir a meta`,
            confidence: prediction.confidence,
            priority: 'high',
            actionable: true,
            relatedData: goal,
            suggestedActions: prediction.suggestedActions,
            estimatedImpact: 'Não cumprimento de objetivos ESG',
            deadline: new Date(goal.deadline)
          });
        }
      }

      // 4. Opportunity Detection
      const opportunities = detectOpportunities(businessContext);
      newInsights.push(...opportunities);

      // 5. Industry Benchmarking
      const benchmarkInsight = await generateBenchmarkInsight(businessContext);
      if (benchmarkInsight) {
        newInsights.push(benchmarkInsight);
      }

      setInsights(newInsights.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }));

    } catch (error) {
      console.error('Error generating contextual insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions
  const analyzeEmissionsTrend = async (emissions: any[]) => {
    // Simple trend analysis - in production, this would use more sophisticated ML
    if (emissions.length < 2) return { isIncreasing: false, percentage: 0, confidence: 0 };

    const recent = emissions.slice(-30); // Last 30 records
    const older = emissions.slice(-60, -30); // Previous 30 records

    const recentAvg = recent.reduce((sum, e) => sum + (e.total_co2e || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + (e.total_co2e || 0), 0) / (older.length || 1);

    const percentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      isIncreasing: percentage > 5,
      percentage: Math.abs(percentage),
      confidence: Math.min(recent.length / 30, 1), // Confidence based on data availability
      recentAvg,
      olderAvg
    };
  };

  const predictGoalAchievement = (goal: any) => {
    // Simple prediction model - in production, this would use ML algorithms
    const timeRemaining = new Date(goal.deadline).getTime() - Date.now();
    const timeElapsed = Date.now() - new Date(goal.created_at).getTime();
    const totalTime = new Date(goal.deadline).getTime() - new Date(goal.created_at).getTime();
    
    const progressRate = (goal.current_progress || 0) / (timeElapsed / totalTime);
    const projectedProgress = progressRate * (totalTime / (totalTime - timeRemaining));
    
    const probability = Math.min(Math.max(projectedProgress, 0), 100);
    
    return {
      risk: probability < 70 ? 'high' : probability < 85 ? 'medium' : 'low',
      probability: Math.round(probability),
      confidence: 0.8,
      suggestedActions: [
        'Acelerar implementação de ações',
        'Revisar estratégia da meta',
        'Alocar recursos adicionais'
      ]
    };
  };

  const detectOpportunities = (context: BusinessContext): ContextualInsight[] => {
    const opportunities: ContextualInsight[] = [];

    // Energy efficiency opportunity
    if (context.companySize === 'large' && context.industryType === 'Industrial') {
      opportunities.push({
        id: 'energy-efficiency',
        type: 'opportunity',
        title: 'Oportunidade de Eficiência Energética',
        description: 'Empresas similares reduziram 15-25% do consumo energético com otimizações',
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        relatedData: context,
        suggestedActions: [
          'Realizar auditoria energética',
          'Implementar sistema de gestão energética ISO 50001',
          'Considerar cogeração de energia'
        ],
        estimatedImpact: 'Redução de 15-25% nos custos energéticos'
      });
    }

    // Carbon credits opportunity
    if (context.currentGoals.some(g => g.title.toLowerCase().includes('carbono'))) {
      opportunities.push({
        id: 'carbon-credits',
        type: 'opportunity',
        title: 'Oportunidade de Créditos de Carbono',
        description: 'Suas ações de sustentabilidade podem gerar créditos de carbono monetizáveis',
        confidence: 0.7,
        priority: 'medium',
        actionable: true,
        relatedData: context,
        suggestedActions: [
          'Avaliar projetos elegíveis para créditos',
          'Conectar com certificadoras reconhecidas',
          'Desenvolver metodologia de monitoramento'
        ],
        estimatedImpact: 'Potencial receita adicional e melhoria da imagem'
      });
    }

    return opportunities;
  };

  const generateBenchmarkInsight = async (context: BusinessContext): Promise<ContextualInsight | null> => {
    // In production, this would query industry benchmarks from external APIs
    return {
      id: 'benchmark-insight',
      type: 'trend',
      title: 'Comparação com o Setor',
      description: `Empresas do setor ${context.industryType} estão investindo 23% mais em ESG`,
      confidence: 0.75,
      priority: 'medium',
      actionable: true,
      relatedData: context,
      suggestedActions: [
        'Aumentar investimentos em ESG',
        'Participar de iniciativas setoriais',
        'Benchmarking com líderes do setor'
      ],
      estimatedImpact: 'Melhoria da competitividade e reputação'
    };
  };

  // Effects
  useEffect(() => {
    if (businessContext && !contextLoading) {
      setContext(businessContext);
      generateInsights();
    }
  }, [businessContext, contextLoading]);

  const refreshInsights = () => generateInsights(true);

  const dismissInsight = (insightId: string) => {
    setInsights(prev => prev.filter(i => i.id !== insightId));
  };

  const getPriorityInsights = (priority: ContextualInsight['priority']) => {
    return insights.filter(i => i.priority === priority);
  };

  const getActionableInsights = () => {
    return insights.filter(i => i.actionable);
  };

  return {
    insights,
    context,
    isAnalyzing: isAnalyzing || contextLoading,
    refreshInsights,
    dismissInsight,
    getPriorityInsights,
    getActionableInsights,
    stats: {
      total: insights.length,
      critical: insights.filter(i => i.priority === 'critical').length,
      high: insights.filter(i => i.priority === 'high').length,
      opportunities: insights.filter(i => i.type === 'opportunity').length,
      actionable: insights.filter(i => i.actionable).length
    }
  };
};