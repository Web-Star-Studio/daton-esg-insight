import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  Search, 
  Filter, 
  Download,
  Settings,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import CrossPlatformAnalytics from "./CrossPlatformAnalytics";
import { UnifiedDashboardWidget } from "./UnifiedDashboardWidget";
import { PredictiveQualityWidget } from "./PredictiveQualityWidget";
import { RealtimeReportingWidget } from "./RealtimeReportingWidget";
import { useIntelligenceInsights } from "@/services/crossPlatformAnalytics";
import { useIntelligentRecommendations } from "@/hooks/data/useIntelligentRecommendations";
import { useNavigate } from "react-router-dom";

const IntelligenceHub = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: insights } = useIntelligenceInsights();
  const { data: recommendations = [], isLoading: recommendationsLoading } = useIntelligentRecommendations();
  const navigate = useNavigate();

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = searchTerm === "" || 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      rec.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Central de Inteligência
          </h1>
          <p className="text-muted-foreground">
            Hub integrado de análises avançadas e insights de IA cross-platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnifiedDashboardWidget />
            <PredictiveQualityWidget />
          </div>
          <RealtimeReportingWidget />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CrossPlatformAnalytics />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recomendações de IA
              </CardTitle>
              <CardDescription>
                Sugestões inteligentes baseadas em análise de dados cross-platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar recomendações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {recommendationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">Tudo em dia!</p>
                  <p className="text-sm">Não há recomendações urgentes no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(rec.status)}
                        <h4 className="font-medium">{rec.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Alta' : 
                           rec.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Impacto Estimado</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{rec.estimated_impact}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tempo de Implementação</p>
                        <p className="font-medium">{rec.implementation_time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                          {rec.status === 'pending' ? 'Pendente' :
                           rec.status === 'in_progress' ? 'Em Andamento' : 'Concluído'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {rec.actionUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(rec.actionUrl!)}
                        >
                          Ver Detalhes
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => {
                          if (rec.actionUrl) {
                            navigate(rec.actionUrl);
                          }
                        }}
                      >
                        {rec.actionUrl ? 'Ir para Módulo' : 'Implementar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedDashboardWidget />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Qualidade Preditiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictiveQualityWidget />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Relatórios Dinâmicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealtimeReportingWidget />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insights Detalhados</CardTitle>
              <CardDescription>
                Análise profunda dos insights gerados pela IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'}>
                      {insight.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>

                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div>
                      <span className="font-medium">Confiança: </span>
                      <Progress value={insight.confidence * 100} className="w-16 h-2 inline-block" />
                      <span className="ml-2">{Math.round(insight.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {insight.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligenceHub;