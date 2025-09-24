import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  Shield
} from "lucide-react";
import {
  useCrossPlatformMetrics,
  useModuleCorrelations,
  usePredictiveModels,
  useIntelligenceInsights,
  calculateRiskScore
} from "@/services/crossPlatformAnalytics";

const CrossPlatformAnalytics = () => {
  const { data: metrics } = useCrossPlatformMetrics();
  const { data: correlations } = useModuleCorrelations();
  const { data: predictions } = usePredictiveModels();
  const { data: insights } = useIntelligenceInsights();

  const riskScore = metrics ? calculateRiskScore(metrics) : 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score ESG</p>
                <p className="text-2xl font-bold">{metrics?.esg_score || 0}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{metrics?.performance_trend || 0}%
                </div>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emissões (tCO2e)</p>
                <p className="text-2xl font-bold">{metrics?.emissions_total?.toFixed(1) || 0}</p>
                <div className="flex items-center text-sm text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  -8.2%
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualidade</p>
                <p className="text-2xl font-bold">{metrics?.quality_score || 0}%</p>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Excelente
                </div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risco Geral</p>
                <p className="text-2xl font-bold">{riskScore}</p>
                <p className={`text-sm ${getRiskLevelColor(metrics?.risk_level || 'low')}`}>
                  {metrics?.risk_level === 'low' ? 'Baixo' :
                   metrics?.risk_level === 'medium' ? 'Médio' :
                   metrics?.risk_level === 'high' ? 'Alto' : 'Crítico'}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${getRiskLevelColor(metrics?.risk_level || 'low')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights Inteligentes</TabsTrigger>
          <TabsTrigger value="correlations">Correlações</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights Inteligentes Cross-Platform
              </CardTitle>
              <CardDescription>
                Análises automáticas baseadas em correlação de dados entre módulos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={getSeverityColor(insight.severity)}>
                      {insight.severity === 'critical' ? 'Crítico' :
                       insight.severity === 'warning' ? 'Atenção' : 'Info'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Módulos:</span>
                      {insight.affected_modules.map((module, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Confiança:</span>
                      <Progress value={insight.confidence * 100} className="w-16 h-2" />
                      <span>{Math.round(insight.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Recomendações:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise de Correlações Entre Módulos
              </CardTitle>
              <CardDescription>
                Identificação de relacionamentos e interdependências entre diferentes áreas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {correlations?.map((correlation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      {correlation.module_a} ⟷ {correlation.module_b}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress value={correlation.correlation_strength * 100} className="w-20" />
                      <Badge variant="outline">
                        {Math.round(correlation.correlation_strength * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Insights:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {correlation.insights.map((insight, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Recomendações:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {correlation.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Modelos Preditivos
              </CardTitle>
              <CardDescription>
                Projeções baseadas em IA para métricas chave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictions?.map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize">
                      {prediction.metric.replace('_', ' ')}
                    </h4>
                    <Badge variant="outline">{prediction.timeframe}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Atual</p>
                      <p className="text-lg font-bold">{prediction.current_value}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Predição</p>
                      <p className="text-lg font-bold text-green-600">
                        {prediction.predicted_value}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confiança</p>
                      <div className="flex items-center gap-2">
                        <Progress value={prediction.confidence * 100} className="flex-1" />
                        <span className="text-sm">{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Fatores principais:</p>
                    <div className="flex flex-wrap gap-1">
                      {prediction.factors.map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
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

export default CrossPlatformAnalytics;