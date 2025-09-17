import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Calendar,
  BarChart3
} from "lucide-react";

interface Insight {
  type: 'trend' | 'alert' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  confidence: number;
  data_points?: string[];
}

interface Recommendation {
  title: string;
  description: string;
  potential_reduction?: number;
  priority: 'high' | 'medium' | 'low';
  implementation_time?: string;
  cost_estimate?: string;
  roi_estimate?: string;
}

interface IntelligentInsightsProps {
  insights: string[] | Insight[];
  recommendations: Recommendation[];
  isLoading?: boolean;
}

export function IntelligentInsights({ insights, recommendations, isLoading }: IntelligentInsightsProps) {
  // Convert string insights to structured format if needed
  const structuredInsights: Insight[] = insights.map(insight => {
    if (typeof insight === 'string') {
      return {
        type: insight.includes('redução') || insight.includes('oportunidade') ? 'opportunity' : 
              insight.includes('aumento') || insight.includes('atenção') ? 'alert' : 'trend',
        title: insight.split(' - ')[0] || insight.substring(0, 50) + '...',
        description: insight,
        impact: insight.includes('70%') || insight.includes('maior') ? 'high' : 
                insight.includes('40%') || insight.includes('médio') ? 'medium' : 'low',
        confidence: 85 + Math.random() * 15 // Mock confidence score
      };
    }
    return insight;
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return BarChart3;
      case 'alert': return AlertTriangle;
      case 'opportunity': return Target;
      case 'achievement': return CheckCircle2;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: string, impact?: string) => {
    if (type === 'alert') return 'destructive';
    if (type === 'achievement') return 'secondary';
    if (type === 'opportunity') return 'default';
    return impact === 'high' ? 'secondary' : 'outline';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const topInsights = structuredInsights
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);

  const highPriorityRecommendations = recommendations
    .filter(r => r.priority === 'high')
    .slice(0, 3);

  const quickWins = recommendations
    .filter(r => r.potential_reduction && r.potential_reduction >= 10)
    .sort((a, b) => (b.potential_reduction || 0) - (a.potential_reduction || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <SmartSkeleton variant="card" />
              </CardContent>
            </Card>
          ))
        ) : topInsights.length > 0 ? (
          topInsights.map((insight, index) => {
            const IconComponent = getInsightIcon(insight.type);
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-muted">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={getInsightColor(insight.type, insight.impact) as "default" | "destructive" | "secondary" | "outline"}
                        >
                          {insight.type === 'trend' ? 'Tendência' :
                           insight.type === 'alert' ? 'Alerta' :
                           insight.type === 'opportunity' ? 'Oportunidade' : 'Conquista'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {insight.confidence.toFixed(0)}% confiança
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      
                      {insight.data_points && insight.data_points.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Baseado em: </span>
                          <span>{insight.data_points.slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Coletando insights dos seus dados...</p>
            <p className="text-sm">Adicione mais dados de emissões para obter insights personalizados</p>
          </div>
        )}
      </div>

      {/* High Priority Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Recomendações Prioritárias</span>
            <Badge variant="destructive" className="ml-auto">
              Alta Prioridade
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SmartSkeleton variant="list" className="space-y-4" />
          ) : highPriorityRecommendations.length > 0 ? (
            <div className="space-y-4">
              {highPriorityRecommendations.map((rec, index) => (
                <div key={index} className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs">
                        {rec.potential_reduction && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span>Redução: {rec.potential_reduction}%</span>
                          </div>
                        )}
                        {rec.implementation_time && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>Prazo: {rec.implementation_time}</span>
                          </div>
                        )}
                        {rec.cost_estimate && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-secondary" />
                            <span>Custo: {rec.cost_estimate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="ml-4">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p>Excelente! Nenhuma ação crítica pendente.</p>
              <p className="text-sm">Continue monitorando e otimizando suas emissões.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Oportunidades de Quick Wins</span>
            <Badge variant="secondary" className="ml-auto">
              Alto Impacto
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SmartSkeleton variant="list" className="space-y-3" />
          ) : quickWins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickWins.map((win, index) => (
                <div key={index} className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1 rounded-full bg-primary/20">
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                    <Badge variant="secondary">
                      -{win.potential_reduction}%
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-sm mb-2">{win.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{win.description}</p>
                  
                  <div className="space-y-1 text-xs">
                    {win.roi_estimate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROI:</span>
                        <span className="font-medium text-primary">{win.roi_estimate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridade:</span>
                      <Badge variant={getPriorityColor(win.priority) as "default" | "destructive" | "secondary" | "outline"}>
                        {win.priority === 'high' ? 'Alta' : win.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-3">
                    Implementar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma oportunidade de quick win identificada</p>
              <p className="text-sm">Continue coletando dados para identificar oportunidades</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Todas as Recomendações</span>
            <Badge variant="outline" className="ml-auto">
              {recommendations.length} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SmartSkeleton variant="list" className="space-y-3" />
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <Badge variant={getPriorityColor(rec.priority) as "default" | "destructive" | "secondary" | "outline"}>
                      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rec.title}</p>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  
                  {rec.potential_reduction && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">-{rec.potential_reduction}%</p>
                      <p className="text-xs text-muted-foreground">redução</p>
                    </div>
                  )}
                  
                  <Button variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {recommendations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma recomendação disponível</p>
                  <p className="text-sm">Adicione mais dados para receber recomendações personalizadas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}