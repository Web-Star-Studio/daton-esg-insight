import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, Brain, Target, Sparkles, TrendingUp, 
  Users, Building, Leaf, BarChart3, Shield, Award,
  Zap, Star, ArrowRight, CheckCircle2, Lightbulb
} from 'lucide-react';

interface PersonalizationProfile {
  industry: string;
  companySize: string;
  esgMaturity: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  challenges: string[];
  timeline: string;
  budget: 'small' | 'medium' | 'large';
  teamSize: number;
  currentTools: string[];
}

interface PersonalizationSuggestion {
  id: string;
  type: 'module' | 'feature' | 'workflow' | 'integration';
  title: string;
  description: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  priority: number;
  icon: React.ReactNode;
  color: string;
}

interface AdvancedPersonalizationEngineProps {
  companyProfile?: PersonalizationProfile;
  currentStep: number;
  selectedModules: string[];
  userBehavior: {
    timeSpentPerStep: number[];
    clickPatterns: string[];
    hesitationPoints: number[];
  };
  onSuggestionApplied?: (suggestion: PersonalizationSuggestion) => void;
}

const INDUSTRY_RECOMMENDATIONS: Record<string, PersonalizationSuggestion[]> = {
  manufacturing: [
    {
      id: 'manufacturing_gee',
      type: 'module',
      title: 'Inventário GEE Industrial',
      description: 'Monitoramento de emissões específico para processos industriais',
      reasoning: 'Indústrias têm alta pegada de carbono e necessidades regulatórias rigorosas',
      impact: 'high',
      effort: 'moderate',
      priority: 1,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      id: 'quality_system',
      type: 'module',
      title: 'Sistema de Qualidade Integrado',
      description: 'SGQ com foco em ISO 9001 e 14001 para indústrias',
      reasoning: 'Setor manufacturing precisa de controle rigoroso de qualidade e meio ambiente',
      impact: 'high',
      effort: 'moderate',
      priority: 2,
      icon: <Award className="h-4 w-4" />,
      color: 'text-blue-600'
    }
  ],
  services: [
    {
      id: 'performance_management',
      type: 'module',
      title: 'Gestão de Desempenho ESG',
      description: 'Foco em capital humano e impacto social',
      reasoning: 'Empresas de serviços dependem principalmente do capital humano',
      impact: 'high',
      effort: 'easy',
      priority: 1,
      icon: <Users className="h-4 w-4" />,
      color: 'text-purple-600'
    }
  ],
  retail: [
    {
      id: 'supply_chain_esg',
      type: 'feature',
      title: 'ESG na Cadeia de Suprimentos',
      description: 'Rastreamento de fornecedores e impacto ambiental',
      reasoning: 'Varejo tem cadeia complexa com impactos socioambientais distribuídos',
      impact: 'high',
      effort: 'complex',
      priority: 1,
      icon: <Leaf className="h-4 w-4" />,
      color: 'text-green-600'
    }
  ]
};

const MATURITY_RECOMMENDATIONS: Record<string, PersonalizationSuggestion[]> = {
  beginner: [
    {
      id: 'basic_setup',
      type: 'workflow',
      title: 'Setup Básico Guiado',
      description: 'Configuração passo-a-passo com templates prontos',
      reasoning: 'Iniciantes precisam de orientação estruturada e exemplos práticos',
      impact: 'high',
      effort: 'easy',
      priority: 1,
      icon: <Target className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      id: 'training_modules',
      type: 'feature',
      title: 'Módulos de Capacitação ESG',
      description: 'Treinamentos interativos sobre conceitos ESG fundamentais',
      reasoning: 'Base teórica sólida é essencial para iniciantes',
      impact: 'medium',
      effort: 'easy',
      priority: 2,
      icon: <Lightbulb className="h-4 w-4" />,
      color: 'text-yellow-600'
    }
  ],
  intermediate: [
    {
      id: 'automation_tools',
      type: 'feature',
      title: 'Automação de Processos',
      description: 'Workflows automatizados para coleta e análise de dados',
      reasoning: 'Empresas intermediárias podem implementar automações para eficiência',
      impact: 'high',
      effort: 'moderate',
      priority: 1,
      icon: <Zap className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ],
  advanced: [
    {
      id: 'ai_insights',
      type: 'feature',
      title: 'Insights de IA Avançados',
      description: 'Análises preditivas e recomendações baseadas em IA',
      reasoning: 'Usuários avançados podem aproveitar IA para insights estratégicos',
      impact: 'high',
      effort: 'easy',
      priority: 1,
      icon: <Brain className="h-4 w-4" />,
      color: 'text-purple-600'
    }
  ]
};

const SIZE_RECOMMENDATIONS: Record<string, PersonalizationSuggestion[]> = {
  small: [
    {
      id: 'streamlined_workflow',
      type: 'workflow',
      title: 'Fluxo Simplificado',
      description: 'Interface otimizada para equipes pequenas',
      reasoning: 'Empresas pequenas precisam de processos enxutos e eficientes',
      impact: 'medium',
      effort: 'easy',
      priority: 1,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600'
    }
  ],
  medium: [
    {
      id: 'department_management',
      type: 'feature',
      title: 'Gestão por Departamentos',
      description: 'Organização e permissões por setores da empresa',
      reasoning: 'Empresas médias têm estrutura departamental que precisa ser refletida no sistema',
      impact: 'high',
      effort: 'moderate',
      priority: 1,
      icon: <Building className="h-4 w-4" />,
      color: 'text-blue-600'
    }
  ],
  large: [
    {
      id: 'enterprise_features',
      type: 'feature',
      title: 'Recursos Corporativos',
      description: 'Dashboard executivo e relatórios avançados',
      reasoning: 'Grandes empresas precisam de visibilidade estratégica e relatórios complexos',
      impact: 'high',
      effort: 'moderate',
      priority: 1,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-purple-600'
    }
  ]
};

export function AdvancedPersonalizationEngine({
  companyProfile,
  currentStep,
  selectedModules,
  userBehavior,
  onSuggestionApplied
}: AdvancedPersonalizationEngineProps) {
  const [suggestions, setSuggestions] = useState<PersonalizationSuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [personalizationScore, setPersonalizationScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    generatePersonalizedSuggestions();
  }, [companyProfile, selectedModules, userBehavior]);

  const generatePersonalizedSuggestions = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const allSuggestions: PersonalizationSuggestion[] = [];
      
      // Industry-based suggestions
      if (companyProfile?.industry) {
        const industrySuggestions = INDUSTRY_RECOMMENDATIONS[companyProfile.industry] || [];
        allSuggestions.push(...industrySuggestions);
      }
      
      // Maturity-based suggestions
      if (companyProfile?.esgMaturity) {
        const maturitySuggestions = MATURITY_RECOMMENDATIONS[companyProfile.esgMaturity] || [];
        allSuggestions.push(...maturitySuggestions);
      }
      
      // Size-based suggestions
      if (companyProfile?.companySize) {
        const sizeSuggestions = SIZE_RECOMMENDATIONS[companyProfile.companySize] || [];
        allSuggestions.push(...sizeSuggestions);
      }

      // Behavior-based suggestions
      const behaviorSuggestions = generateBehaviorBasedSuggestions();
      allSuggestions.push(...behaviorSuggestions);

      // Goal-based suggestions
      const goalSuggestions = generateGoalBasedSuggestions();
      allSuggestions.push(...goalSuggestions);

      // Remove duplicates and sort by priority
      const uniqueSuggestions = allSuggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.id === suggestion.id)
        )
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 6); // Limit to top 6 suggestions

      setSuggestions(uniqueSuggestions);
      calculatePersonalizationScore(uniqueSuggestions);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateBehaviorBasedSuggestions = (): PersonalizationSuggestion[] => {
    const suggestions: PersonalizationSuggestion[] = [];
    
    // If user is hesitating
    if (userBehavior.hesitationPoints.length > 0) {
      suggestions.push({
        id: 'guided_assistance',
        type: 'feature',
        title: 'Assistência Guiada Aprimorada',
        description: 'Tooltips contextuais e ajuda em tempo real',
        reasoning: 'Detectamos hesitação em alguns pontos - ajuda contextual pode acelerar o processo',
        impact: 'medium',
        effort: 'easy',
        priority: 2,
        icon: <Lightbulb className="h-4 w-4" />,
        color: 'text-yellow-600'
      });
    }

    // If user is moving fast
    const avgTimePerStep = userBehavior.timeSpentPerStep.reduce((a, b) => a + b, 0) / userBehavior.timeSpentPerStep.length;
    if (avgTimePerStep < 60) {
      suggestions.push({
        id: 'power_user_features',
        type: 'feature',
        title: 'Recursos para Usuários Avançados',
        description: 'Atalhos de teclado e configurações rápidas',
        reasoning: 'Você está navegando rapidamente - recursos avançados podem ser úteis',
        impact: 'medium',
        effort: 'easy',
        priority: 3,
        icon: <Zap className="h-4 w-4" />,
        color: 'text-orange-600'
      });
    }

    return suggestions;
  };

  const generateGoalBasedSuggestions = (): PersonalizationSuggestion[] => {
    const suggestions: PersonalizationSuggestion[] = [];
    
    if (companyProfile?.primaryGoals?.includes('compliance')) {
      suggestions.push({
        id: 'compliance_dashboard',
        type: 'feature',
        title: 'Dashboard de Compliance',
        description: 'Monitoramento centralizado de conformidade regulatória',
        reasoning: 'Compliance é uma prioridade - dashboard específico otimiza o acompanhamento',
        impact: 'high',
        effort: 'moderate',
        priority: 1,
        icon: <Shield className="h-4 w-4" />,
        color: 'text-red-600'
      });
    }

    if (companyProfile?.primaryGoals?.includes('sustainability')) {
      suggestions.push({
        id: 'sustainability_metrics',
        type: 'feature',
        title: 'Métricas de Sustentabilidade',
        description: 'KPIs ambientais e sociais personalizados',
        reasoning: 'Foco em sustentabilidade demanda métricas específicas e acompanhamento detalhado',
        impact: 'high',
        effort: 'moderate',
        priority: 1,
        icon: <Leaf className="h-4 w-4" />,
        color: 'text-green-600'
      });
    }

    return suggestions;
  };

  const calculatePersonalizationScore = (suggestions: PersonalizationSuggestion[]) => {
    let score = 0;
    
    // Base score from profile completeness
    if (companyProfile?.industry) score += 20;
    if (companyProfile?.esgMaturity) score += 20;
    if (companyProfile?.companySize) score += 15;
    if (companyProfile?.primaryGoals?.length) score += 15;
    if (companyProfile?.timeline) score += 10;
    
    // Score from applied suggestions
    score += appliedSuggestions.length * 5;
    
    // Score from module selection alignment
    if (selectedModules.length > 0) score += 10;
    
    setPersonalizationScore(Math.min(score, 100));
  };

  const applySuggestion = (suggestion: PersonalizationSuggestion) => {
    if (!appliedSuggestions.includes(suggestion.id)) {
      setAppliedSuggestions(prev => [...prev, suggestion.id]);
      onSuggestionApplied?.(suggestion);
      calculatePersonalizationScore(suggestions);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'complex': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
              <Brain className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Analisando Perfil da Empresa
              </h3>
              <p className="text-sm text-muted-foreground">
                Gerando recomendações personalizadas baseadas no seu perfil...
              </p>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalization Score */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Personalização Inteligente</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sistema adaptado ao perfil da sua empresa
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {personalizationScore}%
              </div>
              <p className="text-xs text-muted-foreground">Personalizado</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Progress value={personalizationScore} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Configuração básica</span>
            <span>Totalmente personalizado</span>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestões Personalizadas
            <Badge variant="outline" className="ml-auto">
              {suggestions.filter(s => !appliedSuggestions.includes(s.id)).length} novas
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Recomendações baseadas no perfil da empresa e comportamento de uso
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const isApplied = appliedSuggestions.includes(suggestion.id);
              
              return (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isApplied 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-border/50 bg-card hover:border-primary/20 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-background shadow-sm ${suggestion.color}`}>
                          {suggestion.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {suggestion.title}
                            {isApplied && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getEffortColor(suggestion.effort)}`}>
                          {suggestion.effort}
                        </Badge>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/20">
                      <p className="text-sm text-muted-foreground">
                        <strong>Por que recomendamos:</strong> {suggestion.reasoning}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          Prioridade {suggestion.priority}
                        </span>
                      </div>
                      
                      {!isApplied ? (
                        <Button
                          onClick={() => applySuggestion(suggestion)}
                          size="sm"
                          className="h-8"
                        >
                          Aplicar
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <Badge className="bg-green-600 text-white">
                          ✓ Aplicado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {suggestions.filter(s => !appliedSuggestions.includes(s.id)).length === 0 && (
            <div className="text-center py-8">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Personalização Completa!
              </h3>
              <p className="text-sm text-muted-foreground">
                Todas as sugestões foram aplicadas. Seu sistema está 100% personalizado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}