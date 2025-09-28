import { useState, useEffect, useCallback } from 'react';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, Brain } from 'lucide-react';

interface SmartTip {
  id: string;
  type: 'guidance' | 'warning' | 'optimization' | 'success';
  title: string;
  description: string;
  actionable: boolean;
  relevanceScore: number;
}

interface OnboardingInsight {
  type: 'time_optimization' | 'module_recommendation' | 'completion_prediction' | 'user_pattern';
  message: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface SmartOnboardingOrchestratorProps {
  companyData?: any;
  userBehavior?: {
    timeSpentPerStep: number[];
    clickPatterns: string[];
    hesitationPoints: number[];
  };
}

export function SmartOnboardingOrchestrator({ 
  companyData, 
  userBehavior 
}: SmartOnboardingOrchestratorProps) {
  const { state } = useOnboardingFlow();
  const [smartTips, setSmartTips] = useState<SmartTip[]>([]);
  const [insights, setInsights] = useState<OnboardingInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateSmartTips = useCallback(() => {
    const tips: SmartTip[] = [];
    
    // Step-specific guidance
    switch (state.currentStep) {
      case 0: // Welcome
        tips.push({
          id: 'welcome_tip',
          type: 'guidance',
          title: 'Configuração Inteligente',
          description: 'Responda algumas perguntas rápidas para receber recomendações personalizadas.',
          actionable: true,
          relevanceScore: 0.9
        });
        break;
        
      case 1: // Module Selection
        if (state.selectedModules.length === 0) {
          tips.push({
            id: 'no_modules_warning',
            type: 'warning',
            title: 'Nenhum Módulo Selecionado',
            description: 'Selecione pelo menos um módulo para continuar com a configuração.',
            actionable: true,
            relevanceScore: 1.0
          });
        } else if (state.selectedModules.length > 5) {
          tips.push({
            id: 'too_many_modules',
            type: 'optimization',
            title: 'Muitos Módulos Selecionados',
            description: 'Considere começar com 3-4 módulos principais para facilitar a implementação.',
            actionable: true,
            relevanceScore: 0.8
          });
        } else {
          tips.push({
            id: 'good_selection',
            type: 'success',
            title: 'Ótima Seleção!',
            description: `${state.selectedModules.length} módulos é uma quantidade ideal para começar.`,
            actionable: false,
            relevanceScore: 0.7
          });
        }
        break;
        
      case 2: // Configuration
        const unconfiguredModules = state.selectedModules.filter(
          moduleId => !state.moduleConfigurations[moduleId]
        );
        
        if (unconfiguredModules.length > 0) {
          tips.push({
            id: 'pending_config',
            type: 'guidance',
            title: 'Configuração Pendente',
            description: `Configure os atalhos para ${unconfiguredModules.length} módulo(s) restante(s).`,
            actionable: true,
            relevanceScore: 0.9
          });
        }
        break;
    }

    // Behavior-based tips
    if (userBehavior?.hesitationPoints?.includes(state.currentStep)) {
      tips.push({
        id: 'hesitation_help',
        type: 'guidance',
        title: 'Precisa de Ajuda?',
        description: 'Esta etapa parece estar causando dúvidas. Clique no ícone de ajuda para orientações.',
        actionable: true,
        relevanceScore: 0.8
      });
    }

    // Company-specific tips
    if (companyData) {
      if (companyData.sector === 'manufacturing' && !state.selectedModules.includes('inventario_gee')) {
        tips.push({
          id: 'manufacturing_gee',
          type: 'optimization',
          title: 'Recomendação para Indústria',
          description: 'Empresas do setor industrial frequentemente se beneficiam do módulo de Inventário GEE.',
          actionable: true,
          relevanceScore: 0.85
        });
      }
    }

    return tips.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
  }, [state, userBehavior, companyData]);

  const generateInsights = useCallback(() => {
    const newInsights: OnboardingInsight[] = [];

    // Time optimization insights
    if (userBehavior?.timeSpentPerStep) {
      const averageTime = userBehavior.timeSpentPerStep.reduce((sum, time) => sum + time, 0) / userBehavior.timeSpentPerStep.length;
      if (averageTime > 180) { // More than 3 minutes per step
        newInsights.push({
          type: 'time_optimization',
          message: 'Você pode acelerar o processo usando as recomendações inteligentes.',
          confidence: 0.7,
          impact: 'medium'
        });
      }
    }

    // Module recommendation insights
    if (state.selectedModules.length > 0) {
      const moduleComplexity = state.selectedModules.length * 2 + 
        Object.keys(state.moduleConfigurations).length;
      
      if (moduleComplexity > 10) {
        newInsights.push({
          type: 'module_recommendation',
          message: 'Configuração complexa detectada. Considere implementar por fases.',
          confidence: 0.8,
          impact: 'high'
        });
      }
    }

    // Completion prediction
    const completionRate = (state.currentStep / (state.totalSteps - 1)) * 100;
    if (completionRate > 75) {
      newInsights.push({
        type: 'completion_prediction',
        message: 'Você está quase terminando! Faltam apenas alguns minutos.',
        confidence: 0.9,
        impact: 'high'
      });
    }

    return newInsights;
  }, [state, userBehavior]);

  useEffect(() => {
    setIsAnalyzing(true);
    
    const analyzeTimeout = setTimeout(() => {
      setSmartTips(generateSmartTips());
      setInsights(generateInsights());
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(analyzeTimeout);
  }, [state.currentStep, state.selectedModules, generateSmartTips, generateInsights]);

  const getTipIcon = (type: SmartTip['type']) => {
    switch (type) {
      case 'guidance': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'success': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getTipStyles = (type: SmartTip['type']) => {
    switch (type) {
      case 'guidance': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'optimization': return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Analisando seu progresso...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (smartTips.length === 0 && insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Smart Tips */}
      {smartTips.map((tip) => (
        <Card key={tip.id} className={`border ${getTipStyles(tip.type)}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getTipIcon(tip.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(tip.relevanceScore * 100)}% relevante
                  </Badge>
                </div>
                <p className="text-sm opacity-90">{tip.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-indigo-600" />
              <h4 className="font-medium text-indigo-800 text-sm">Insights Inteligentes</h4>
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                  <span className="text-indigo-700">{insight.message}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      insight.impact === 'high' ? 'border-red-300 text-red-700' :
                      insight.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                      'border-green-300 text-green-700'
                    }`}
                  >
                    {insight.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}