import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Brain, Target, Zap, AlertTriangle, 
  CheckCircle2, Clock, BarChart3, Lightbulb, Star,
  ArrowUp, ArrowDown, Activity, Gauge
} from 'lucide-react';

interface PredictionModel {
  id: string;
  name: string;
  accuracy: number;
  confidence: number;
  predictions: Prediction[];
}

interface Prediction {
  id: string;
  type: 'completion_time' | 'success_probability' | 'abandonment_risk' | 'optimal_path' | 'engagement_score';
  value: number | string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  action?: {
    label: string;
    callback: () => void;
  };
}

interface UserBehaviorPattern {
  sessionDuration: number;
  clickPatterns: string[];
  hesitationPoints: number[];
  backtrackingCount: number;
  helpRequests: number;
  formCompletionRate: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface PredictiveAnalyticsEngineProps {
  currentStep: number;
  totalSteps: number;
  selectedModules: string[];
  companyProfile?: any;
  userBehavior: UserBehaviorPattern;
  onPredictionAction?: (actionId: string, prediction: Prediction) => void;
}

const BEHAVIORAL_PATTERNS = {
  'high_engagement': {
    minSessionDuration: 300, // 5 minutes
    maxHesitationPoints: 1,
    minFormCompletionRate: 0.8,
    characteristics: ['quick_progression', 'low_help_requests', 'focused_clicks']
  },
  'medium_engagement': {
    minSessionDuration: 120, // 2 minutes
    maxHesitationPoints: 3,
    minFormCompletionRate: 0.6,
    characteristics: ['moderate_progression', 'some_help_requests', 'exploratory_clicks']
  },
  'low_engagement': {
    minSessionDuration: 60, // 1 minute
    maxHesitationPoints: 5,
    minFormCompletionRate: 0.4,
    characteristics: ['slow_progression', 'high_help_requests', 'scattered_clicks']
  }
};

export function PredictiveAnalyticsEngine({
  currentStep,
  totalSteps,
  selectedModules,
  companyProfile,
  userBehavior,
  onPredictionAction
}: PredictiveAnalyticsEngineProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [userSegment, setUserSegment] = useState<string>('');
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    runPredictiveAnalysis();
  }, [currentStep, userBehavior, selectedModules]);

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate ML processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const segment = classifyUserSegment();
    setUserSegment(segment);
    
    const generatedPredictions = generatePredictions(segment);
    setPredictions(generatedPredictions);
    
    const predictiveModels = generateModels(generatedPredictions);
    setModels(predictiveModels);
    
    const score = calculateOverallScore(generatedPredictions);
    setOverallScore(score);
    
    setIsAnalyzing(false);
  };

  const classifyUserSegment = (): string => {
    const {
      sessionDuration,
      hesitationPoints,
      formCompletionRate,
      helpRequests,
      backtrackingCount
    } = userBehavior;

    // Advanced segmentation algorithm
    let score = 0;
    
    // Session engagement score
    if (sessionDuration > 300) score += 3;
    else if (sessionDuration > 120) score += 2;
    else score += 1;
    
    // Decision confidence score
    if (hesitationPoints.length < 2) score += 3;
    else if (hesitationPoints.length < 4) score += 2;
    else score += 1;
    
    // Task completion score
    if (formCompletionRate > 0.8) score += 3;
    else if (formCompletionRate > 0.6) score += 2;
    else score += 1;
    
    // Self-sufficiency score
    if (helpRequests < 2) score += 2;
    else if (helpRequests < 4) score += 1;
    
    // Navigation efficiency score
    if (backtrackingCount < 2) score += 2;
    else if (backtrackingCount < 4) score += 1;

    // Classify based on total score
    if (score >= 12) return 'power_user';
    if (score >= 9) return 'engaged_user';
    if (score >= 6) return 'casual_user';
    return 'struggling_user';
  };

  const generatePredictions = (segment: string): Prediction[] => {
    const predictions: Prediction[] = [];
    const progress = currentStep / totalSteps;
    
    // Completion Time Prediction
    const baseTime = getBaseCompletionTime(segment);
    const adjustedTime = baseTime * (1 - progress) * getComplexityMultiplier();
    
    predictions.push({
      id: 'completion_time',
      type: 'completion_time',
      value: Math.round(adjustedTime),
      confidence: 0.85,
      impact: 'medium',
      recommendation: adjustedTime > 300 
        ? 'Considere usar atalhos inteligentes para acelerar o processo'
        : 'Você está no ritmo ideal para completar rapidamente'
    });

    // Success Probability
    const successProb = calculateSuccessProbability(segment);
    predictions.push({
      id: 'success_probability',
      type: 'success_probability',
      value: Math.round(successProb * 100),
      confidence: 0.78,
      impact: successProb < 0.7 ? 'high' : 'low',
      recommendation: successProb < 0.7 
        ? 'Recomendamos ativar assistência guiada para aumentar suas chances de sucesso'
        : 'Excelente! Você tem alta probabilidade de completar com sucesso',
      action: successProb < 0.7 ? {
        label: 'Ativar Assistência',
        callback: () => onPredictionAction?.('activate_assistance', predictions.find(p => p.id === 'success_probability')!)
      } : undefined
    });

    // Abandonment Risk
    const abandonmentRisk = calculateAbandonmentRisk(segment);
    if (abandonmentRisk > 0.3) {
      predictions.push({
        id: 'abandonment_risk',
        type: 'abandonment_risk',
        value: Math.round(abandonmentRisk * 100),
        confidence: 0.82,
        impact: 'high',
        recommendation: 'Alto risco de abandono detectado. Sugerimos simplificar o processo ou oferecer suporte',
        action: {
          label: 'Ativar Modo Simplificado',
          callback: () => onPredictionAction?.('activate_simple_mode', predictions.find(p => p.id === 'abandonment_risk')!)
        }
      });
    }

    // Engagement Score
    const engagementScore = calculateEngagementScore(segment);
    predictions.push({
      id: 'engagement_score',
      type: 'engagement_score',
      value: Math.round(engagementScore),
      confidence: 0.88,
      impact: engagementScore < 60 ? 'high' : 'low',
      recommendation: engagementScore < 60 
        ? 'Baixo engajamento detectado. Considere gamificação ou conteúdo interativo'
        : 'Excelente engajamento! Continue neste ritmo'
    });

    // Optimal Path Prediction
    const optimalPath = predictOptimalPath(segment);
    predictions.push({
      id: 'optimal_path',
      type: 'optimal_path',
      value: optimalPath,
      confidence: 0.75,
      impact: 'medium',
      recommendation: 'Caminho otimizado baseado no seu perfil e comportamento',
      action: {
        label: 'Seguir Caminho Sugerido',
        callback: () => onPredictionAction?.('follow_optimal_path', predictions.find(p => p.id === 'optimal_path')!)
      }
    });

    return predictions;
  };

  const getBaseCompletionTime = (segment: string): number => {
    switch (segment) {
      case 'power_user': return 180; // 3 minutes
      case 'engaged_user': return 300; // 5 minutes
      case 'casual_user': return 480; // 8 minutes
      case 'struggling_user': return 720; // 12 minutes
      default: return 360; // 6 minutes
    }
  };

  const getComplexityMultiplier = (): number => {
    const moduleCount = selectedModules.length;
    const profileComplexity = companyProfile ? 1.2 : 1.0;
    return (1 + (moduleCount * 0.1)) * profileComplexity;
  };

  const calculateSuccessProbability = (segment: string): number => {
    let baseProb = 0.7;
    
    switch (segment) {
      case 'power_user': baseProb = 0.95; break;
      case 'engaged_user': baseProb = 0.85; break;
      case 'casual_user': baseProb = 0.65; break;
      case 'struggling_user': baseProb = 0.45; break;
    }
    
    // Adjust based on progress
    const progressBonus = (currentStep / totalSteps) * 0.2;
    
    // Adjust based on behavior
    const behaviorPenalty = (userBehavior.hesitationPoints.length * 0.05) + 
                           (userBehavior.backtrackingCount * 0.03);
    
    return Math.max(0.1, Math.min(0.99, baseProb + progressBonus - behaviorPenalty));
  };

  const calculateAbandonmentRisk = (segment: string): number => {
    let baseRisk = 0.2;
    
    switch (segment) {
      case 'power_user': baseRisk = 0.05; break;
      case 'engaged_user': baseRisk = 0.15; break;
      case 'casual_user': baseRisk = 0.35; break;
      case 'struggling_user': baseRisk = 0.55; break;
    }
    
    // Increase risk based on negative behaviors
    const behaviorRisk = (userBehavior.hesitationPoints.length * 0.08) +
                        (userBehavior.backtrackingCount * 0.1) +
                        (userBehavior.helpRequests * 0.05);
    
    // Decrease risk based on progress
    const progressReduction = (currentStep / totalSteps) * 0.3;
    
    return Math.max(0, Math.min(0.9, baseRisk + behaviorRisk - progressReduction));
  };

  const calculateEngagementScore = (segment: string): number => {
    let baseScore = 50;
    
    switch (segment) {
      case 'power_user': baseScore = 90; break;
      case 'engaged_user': baseScore = 75; break;
      case 'casual_user': baseScore = 55; break;
      case 'struggling_user': baseScore = 35; break;
    }
    
    // Adjust based on session metrics
    const sessionBonus = Math.min(20, userBehavior.sessionDuration / 30);
    const completionBonus = userBehavior.formCompletionRate * 15;
    const helpPenalty = userBehavior.helpRequests * 3;
    
    return Math.max(0, Math.min(100, baseScore + sessionBonus + completionBonus - helpPenalty));
  };

  const predictOptimalPath = (segment: string): string => {
    const paths = {
      'power_user': 'Caminho Rápido: Configuração Avançada → Módulos Específicos → Finalização',
      'engaged_user': 'Caminho Padrão: Tutorial → Seleção Guiada → Configuração → Finalização',
      'casual_user': 'Caminho Assistido: Introdução → Recomendações → Configuração Simples',
      'struggling_user': 'Caminho Simplificado: Básicos → Assistente IA → Configuração Mínima'
    };
    
    return paths[segment as keyof typeof paths] || paths.casual_user;
  };

  const generateModels = (predictions: Prediction[]): PredictionModel[] => {
    return [
      {
        id: 'completion_model',
        name: 'Modelo de Tempo de Completação',
        accuracy: 0.87,
        confidence: 0.82,
        predictions: predictions.filter(p => p.type === 'completion_time')
      },
      {
        id: 'success_model',
        name: 'Modelo de Probabilidade de Sucesso',
        accuracy: 0.91,
        confidence: 0.85,
        predictions: predictions.filter(p => p.type === 'success_probability')
      },
      {
        id: 'engagement_model',
        name: 'Modelo de Engajamento',
        accuracy: 0.79,
        confidence: 0.88,
        predictions: predictions.filter(p => p.type === 'engagement_score')
      }
    ];
  };

  const calculateOverallScore = (predictions: Prediction[]): number => {
    const weights = {
      completion_time: 0.2,
      success_probability: 0.3,
      abandonment_risk: 0.25,
      engagement_score: 0.15,
      optimal_path: 0.1
    };
    
    let weightedScore = 0;
    predictions.forEach(prediction => {
      const weight = weights[prediction.type as keyof typeof weights] || 0.1;
      const normalizedValue = typeof prediction.value === 'number' 
        ? Math.min(100, Math.max(0, prediction.value)) 
        : 50;
      
      // Invert abandonment risk for scoring
      const score = prediction.type === 'abandonment_risk' 
        ? 100 - normalizedValue 
        : normalizedValue;
        
      weightedScore += score * weight * prediction.confidence;
    });
    
    return Math.round(weightedScore);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSegmentInfo = (segment: string) => {
    const info = {
      'power_user': { 
        label: 'Usuário Experiente', 
        color: 'text-purple-600 bg-purple-50',
        icon: <Zap className="h-4 w-4" />
      },
      'engaged_user': { 
        label: 'Usuário Engajado', 
        color: 'text-blue-600 bg-blue-50',
        icon: <TrendingUp className="h-4 w-4" />
      },
      'casual_user': { 
        label: 'Usuário Casual', 
        color: 'text-green-600 bg-green-50',
        icon: <Activity className="h-4 w-4" />
      },
      'struggling_user': { 
        label: 'Usuário com Dificuldades', 
        color: 'text-orange-600 bg-orange-50',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    };
    
    return info[segment as keyof typeof info] || info.casual_user;
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-purple/5 to-blue/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto">
              <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Análise Preditiva em Andamento
              </h3>
              <p className="text-sm text-muted-foreground">
                Processando padrões comportamentais e gerando previsões inteligentes...
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Analisando comportamento</span>
                <span>87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const segmentInfo = getSegmentInfo(userSegment);

  return (
    <div className="space-y-6">
      {/* Overall Analytics Dashboard */}
      <Card className="border-primary/20 bg-gradient-to-r from-purple/5 to-blue/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Analytics Preditiva</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Insights comportamentais em tempo real
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Score Geral</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Segment */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${segmentInfo.color}`}>
                {segmentInfo.icon}
              </div>
              <div>
                <h4 className="font-medium text-foreground">Perfil Identificado</h4>
                <p className="text-sm text-muted-foreground">{segmentInfo.label}</p>
              </div>
            </div>
            <Badge variant="outline" className="px-3">
              {Math.round(models[0]?.accuracy * 100 || 85)}% precisão
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {predictions.slice(0, 4).map((prediction) => (
              <div key={prediction.id} className="text-center p-3 bg-background rounded-lg border border-border/50">
                <div className="text-xl font-bold text-foreground mb-1">
                  {typeof prediction.value === 'number' 
                    ? `${prediction.value}${prediction.type.includes('time') ? 's' : prediction.type.includes('probability') || prediction.type.includes('score') ? '%' : ''}`
                    : prediction.value
                  }
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {prediction.type.replace('_', ' ')}
                </p>
                <div className="mt-2">
                  <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    prediction.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                    prediction.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <Gauge className="h-3 w-3" />
                    {Math.round(prediction.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Previsões Detalhadas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Análises preditivas baseadas em machine learning e padrões comportamentais
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className={`p-4 rounded-lg border-2 ${
                  prediction.impact === 'high' ? 'border-red-200 bg-red-50/50' :
                  prediction.impact === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
                  'border-green-200 bg-green-50/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        prediction.impact === 'high' ? 'bg-red-100 text-red-600' :
                        prediction.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {prediction.type === 'completion_time' && <Clock className="h-4 w-4" />}
                        {prediction.type === 'success_probability' && <CheckCircle2 className="h-4 w-4" />}
                        {prediction.type === 'abandonment_risk' && <AlertTriangle className="h-4 w-4" />}
                        {prediction.type === 'engagement_score' && <TrendingUp className="h-4 w-4" />}
                        {prediction.type === 'optimal_path' && <Target className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground capitalize mb-1">
                          {prediction.type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {prediction.recommendation}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {typeof prediction.value === 'number' 
                          ? `${prediction.value}${prediction.type.includes('time') ? 's' : prediction.type.includes('probability') || prediction.type.includes('score') ? '%' : ''}`
                          : prediction.value
                        }
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {Math.round(prediction.confidence * 100)}% confiança
                      </Badge>
                    </div>
                  </div>

                  {prediction.action && (
                    <div className="flex justify-end">
                      <Button
                        onClick={prediction.action.callback}
                        size="sm"
                        variant={prediction.impact === 'high' ? 'default' : 'outline'}
                        className="h-8"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {prediction.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <BarChart3 className="h-5 w-5" />
            Performance dos Modelos
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {models.map((model) => (
              <div key={model.id} className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                <h4 className="font-medium text-indigo-900 mb-3">{model.name}</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-700">Precisão</span>
                      <span className="font-medium">{Math.round(model.accuracy * 100)}%</span>
                    </div>
                    <Progress value={model.accuracy * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-700">Confiança</span>
                      <span className="font-medium">{Math.round(model.confidence * 100)}%</span>
                    </div>
                    <Progress value={model.confidence * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}