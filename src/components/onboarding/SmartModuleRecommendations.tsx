import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Award, 
  Leaf, 
  Shield, 
  Target,
  CheckCircle,
  Clock,
  Star,
  Zap
} from "lucide-react";

interface SmartModuleRecommendationsProps {
  companyProfile?: any;
  selectedModules: string[];
  onModuleRecommendation: (moduleIds: string[]) => void;
}

interface ModuleRecommendation {
  moduleId: string;
  name: string;
  icon: any;
  confidence: number;
  reasons: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedROI: string;
  implementationTime: string;
  benefits: string[];
}

const MODULE_METADATA = {
  inventario_gee: {
    name: 'Inventário GEE',
    icon: Leaf,
    benefits: ['Compliance ESG', 'Redução de custos', 'Relatórios automáticos']
  },
  gestao_licencas: {
    name: 'Licenças Ambientais',
    icon: Shield,
    benefits: ['Evitar multas', 'Controle de prazos', 'Gestão centralizada']
  },
  qualidade: {
    name: 'Sistema de Qualidade',
    icon: Award,
    benefits: ['Melhoria contínua', 'Certificações', 'Padronização']
  },
  performance: {
    name: 'Performance',
    icon: TrendingUp,
    benefits: ['KPIs em tempo real', 'Tomada de decisão', 'Monitoramento']
  },
  gestao_pessoas: {
    name: 'Gestão de Pessoas',
    icon: Users,
    benefits: ['Engajamento', 'Desenvolvimento', 'Retenção de talentos']
  }
};

export function SmartModuleRecommendations({ 
  companyProfile, 
  selectedModules, 
  onModuleRecommendation 
}: SmartModuleRecommendationsProps) {
  
  const generateRecommendations = (): ModuleRecommendation[] => {
    const recommendations: ModuleRecommendation[] = [];
    
    // Análise baseada no setor
    if (companyProfile?.sector === 'industrial' || companyProfile?.sector === 'manufacturing') {
      recommendations.push({
        moduleId: 'inventario_gee',
        name: 'Inventário GEE',
        icon: Leaf,
        confidence: 95,
        reasons: [
          'Setor industrial com altas emissões',
          'Compliance obrigatório para grandes emissores',
          'Potencial de redução de custos energéticos'
        ],
        priority: 'critical',
        estimatedROI: '15-25%',
        implementationTime: '2-3 semanas',
        benefits: ['Compliance ESG', 'Redução de custos', 'Relatórios automáticos']
      });

      recommendations.push({
        moduleId: 'gestao_licencas',
        name: 'Licenças Ambientais',
        icon: Shield,
        confidence: 90,
        reasons: [
          'Múltiplas licenças ambientais requeridas',
          'Risco alto de multas por descumprimento',
          'Processos complexos de renovação'
        ],
        priority: 'critical',
        estimatedROI: '20-30%',
        implementationTime: '1-2 semanas',
        benefits: ['Evitar multas', 'Controle de prazos', 'Gestão centralizada']
      });
    }

    // Análise baseada no tamanho da empresa
    if (companyProfile?.size === 'grande' || companyProfile?.employee_count > 100) {
      recommendations.push({
        moduleId: 'gestao_pessoas',
        name: 'Gestão de Pessoas',
        icon: Users,
        confidence: 85,
        reasons: [
          'Grande número de colaboradores',
          'Necessidade de processos estruturados',
          'Compliance trabalhista complexo'
        ],
        priority: 'high',
        estimatedROI: '10-20%',
        implementationTime: '3-4 semanas',
        benefits: ['Engajamento', 'Desenvolvimento', 'Retenção de talentos']
      });
    }

    // Recomendações universais
    if (!recommendations.find(r => r.moduleId === 'qualidade')) {
      recommendations.push({
        moduleId: 'qualidade',
        name: 'Sistema de Qualidade',
        icon: Award,
        confidence: 80,
        reasons: [
          'Melhoria contínua de processos',
          'Padronização operacional',
          'Preparação para certificações'
        ],
        priority: 'high',
        estimatedROI: '12-18%',
        implementationTime: '2-3 semanas',
        benefits: ['Melhoria contínua', 'Certificações', 'Padronização']
      });
    }

    recommendations.push({
      moduleId: 'performance',
      name: 'Performance',
      icon: TrendingUp,
      confidence: 75,
      reasons: [
        'Monitoramento de KPIs essencial',
        'Tomada de decisão baseada em dados',
        'Visibilidade operacional'
      ],
      priority: 'medium',
      estimatedROI: '8-15%',
      implementationTime: '1-2 semanas',
      benefits: ['KPIs em tempo real', 'Tomada de decisão', 'Monitoramento']
    });

    return recommendations
      .filter(r => !selectedModules.includes(r.moduleId))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  };

  const recommendations = generateRecommendations();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Zap className="h-3 w-3" />;
      case 'high': return <Star className="h-3 w-3" />;
      case 'medium': return <Target className="h-3 w-3" />;
      default: return <CheckCircle className="h-3 w-3" />;
    }
  };

  const handleAcceptRecommendations = () => {
    const topRecommendations = recommendations
      .filter(r => r.priority === 'critical' || r.priority === 'high')
      .map(r => r.moduleId);
    
    onModuleRecommendation([...selectedModules, ...topRecommendations]);
  };

  const handleAcceptAll = () => {
    const allRecommended = recommendations.map(r => r.moduleId);
    onModuleRecommendation([...selectedModules, ...allRecommended]);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Recomendações Inteligentes
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            IA Personalizada
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseado no perfil da sua empresa, recomendamos os seguintes módulos:
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          
          return (
            <div key={rec.moduleId} className="p-4 bg-card rounded-lg border border-border/50 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{rec.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs px-2 py-1 ${getPriorityColor(rec.priority)}`}>
                        {getPriorityIcon(rec.priority)}
                        <span className="ml-1 capitalize">{rec.priority}</span>
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{rec.confidence}% match</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rec.implementationTime}
                  </div>
                  <div className="font-medium text-green-600 mt-1">
                    ROI: {rec.estimatedROI}
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Compatibilidade</span>
                  <span className="font-medium">{rec.confidence}%</span>
                </div>
                <Progress value={rec.confidence} className="h-1.5" />
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Por que recomendamos:
                </h5>
                <ul className="text-sm space-y-1">
                  {rec.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2">
                {rec.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleAcceptRecommendations}
            className="w-full bg-gradient-to-r from-primary to-primary/90"
          >
            <Star className="mr-2 h-4 w-4" />
            Aceitar Recomendações Principais
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleAcceptAll}
            className="w-full"
          >
            Aceitar Todas as Recomendações
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded">
          Recomendações baseadas em análise de perfil empresarial e melhores práticas do setor
        </div>
      </CardContent>
    </Card>
  );
}