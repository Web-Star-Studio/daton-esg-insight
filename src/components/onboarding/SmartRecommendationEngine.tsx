import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, TrendingUp, Target, Lightbulb, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SmartRecommendation {
  moduleId: string;
  confidence: number;
  reasons: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedROI: string;
  implementationTime: string;
}

interface SmartRecommendationEngineProps {
  onRecommendationsReady: (recommendations: SmartRecommendation[]) => void;
  companyData?: {
    sector?: string;
    size?: string;
    goals?: string[];
  };
}

export function SmartRecommendationEngine({ 
  onRecommendationsReady, 
  companyData 
}: SmartRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    generateSmartRecommendations();
  }, [companyData]);

  const generateSmartRecommendations = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const industryRecommendations: Record<string, SmartRecommendation[]> = {
      manufacturing: [
        {
          moduleId: 'inventario_gee',
          confidence: 95,
          reasons: ['Alto consumo energético', 'Requisitos regulatórios', 'Pressão de stakeholders'],
          priority: 'high',
          estimatedROI: '250% em 18 meses',
          implementationTime: '2-3 semanas'
        },
        {
          moduleId: 'qualidade',
          confidence: 90,
          reasons: ['Certificações ISO necessárias', 'Melhoria de processos', 'Redução de defeitos'],
          priority: 'high',
          estimatedROI: '180% em 12 meses',
          implementationTime: '3-4 semanas'
        },
        {
          moduleId: 'gestao_licencas',
          confidence: 85,
          reasons: ['Múltiplas licenças ambientais', 'Complexidade regulatória', 'Riscos de não conformidade'],
          priority: 'medium',
          estimatedROI: '150% em 6 meses',
          implementationTime: '1-2 semanas'
        }
      ],
      services: [
        {
          moduleId: 'performance',
          confidence: 90,
          reasons: ['Capital humano crítico', 'Retenção de talentos', 'Produtividade da equipe'],
          priority: 'high',
          estimatedROI: '200% em 12 meses',
          implementationTime: '2-3 semanas'
        },
        {
          moduleId: 'gestao_pessoas',
          confidence: 85,
          reasons: ['Capacitação contínua', 'Inovação necessária', 'Competitividade'],
          priority: 'high',
          estimatedROI: '160% em 9 meses',
          implementationTime: '1-2 semanas'
        },
        {
          moduleId: 'inventario_gee',
          confidence: 70,
          reasons: ['Viagens corporativas', 'Escritórios múltiplos', 'Consumo energético'],
          priority: 'medium',
          estimatedROI: '120% em 15 meses',
          implementationTime: '2-3 semanas'
        }
      ],
      default: [
        {
          moduleId: 'performance',
          confidence: 80,
          reasons: ['Gestão de pessoas essencial', 'Melhoria da produtividade', 'Desenvolvimento organizacional'],
          priority: 'high',
          estimatedROI: '180% em 12 meses',
          implementationTime: '2-3 semanas'
        },
        {
          moduleId: 'inventario_gee',
          confidence: 75,
          reasons: ['Sustentabilidade corporativa', 'Relatórios ESG', 'Competitividade'],
          priority: 'medium',
          estimatedROI: '140% em 18 meses',
          implementationTime: '2-3 semanas'
        },
        {
          moduleId: 'qualidade',
          confidence: 70,
          reasons: ['Melhoria contínua', 'Padronização de processos', 'Certificações'],
          priority: 'medium',
          estimatedROI: '160% em 15 meses',
          implementationTime: '3-4 semanas'
        }
      ]
    };

    const sector = companyData?.sector?.toLowerCase() || 'default';
    const recommendationKey = Object.keys(industryRecommendations).find(key => 
      sector.includes(key)
    ) || 'default';

    const smartRecommendations = industryRecommendations[recommendationKey];
    
    setRecommendations(smartRecommendations);
    onRecommendationsReady(smartRecommendations);
    setIsAnalyzing(false);
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                🧠 Analisando seu perfil empresarial...
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Processando dados do setor
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  Identificando necessidades prioritárias
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  Calculando ROI potencial
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">
              ✨ Recomendações Inteligentes
            </h3>
            <p className="text-sm text-green-600">
              Baseado no perfil da sua empresa
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div
              key={rec.moduleId}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={rec.priority === 'high' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {rec.confidence}% match
                  </Badge>
                  {rec.priority === 'high' && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      Prioritário
                    </Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-800">ROI: {rec.estimatedROI}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3 w-3 text-blue-600" />
                    <span className="text-gray-600">{rec.reasons[0]}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {rec.implementationTime}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 <strong>Dica:</strong> Começar com os módulos prioritários pode gerar resultados 
            mais rápidos e facilitar a adoção da plataforma pela sua equipe.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}