import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Target,
  Calendar,
  Shield
} from "lucide-react";
import { getLicenseById } from "@/services/licenses";
import { 
  analyzeLicenseWithAI, 
  getLicenseAnalyses, 
  getLicenseConditions, 
  getLicenseAlerts,
  updateConditionStatus,
  resolveAlert
} from "@/services/licenseAI";
import { toast } from "sonner";

export function LicenciamentoAnalise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: license, isLoading: licenseLoading } = useQuery({
    queryKey: ['license', id],
    queryFn: () => getLicenseById(id!),
    enabled: !!id
  });

  const { data: analyses, isLoading: analysesLoading, refetch: refetchAnalyses } = useQuery({
    queryKey: ['license-analyses', id],
    queryFn: () => getLicenseAnalyses(id!),
    enabled: !!id
  });

  const { data: conditions, isLoading: conditionsLoading, refetch: refetchConditions } = useQuery({
    queryKey: ['license-conditions', id],
    queryFn: () => getLicenseConditions(id!),
    enabled: !!id
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['license-alerts', id],
    queryFn: () => getLicenseAlerts(id!),
    enabled: !!id
  });

  const handleAnalyze = async (analysisType: 'full_analysis' | 'renewal_prediction' | 'compliance_check' = 'full_analysis') => {
    if (!id) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeLicenseWithAI(id, analysisType);
      
      if (result.success) {
        toast.success("Análise de IA concluída com sucesso!");
        // Refresh all data
        refetchAnalyses();
        refetchConditions();
        refetchAlerts();
      } else {
        toast.error("Erro na análise: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao analisar licença");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateCondition = async (conditionId: string, status: string) => {
    try {
      await updateConditionStatus(conditionId, status);
      toast.success("Status da condicionante atualizado!");
      refetchConditions();
    } catch (error) {
      toast.error("Erro ao atualizar condicionante");
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast.success("Alerta resolvido!");
      refetchAlerts();
    } catch (error) {
      toast.error("Erro ao resolver alerta");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (licenseLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="animate-spin h-8 w-8" />
        </div>
      </MainLayout>
    );
  }

  if (!license) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Licença não encontrada.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  const latestAnalysis = analyses?.[0];
  const hasAIData = license.ai_processing_status === 'completed' && latestAnalysis;

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/licenciamento')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Análise Inteligente</h1>
              <p className="text-muted-foreground">{license.name}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleAnalyze('compliance_check')}
              disabled={isAnalyzing}
              variant="outline"
            >
              <Shield className="h-4 w-4 mr-2" />
              Verificar Compliance
            </Button>
            <Button 
              onClick={() => handleAnalyze('full_analysis')}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Analisar com IA
            </Button>
          </div>
        </div>

        {/* AI Status */}
        {license.ai_processing_status && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" />
                    <span className="font-medium">Status da Análise IA</span>
                    <Badge variant={license.ai_processing_status === 'completed' ? 'default' : 'secondary'}>
                      {license.ai_processing_status === 'completed' ? 'Concluída' : 
                       license.ai_processing_status === 'processing' ? 'Processando' : 'Não processada'}
                    </Badge>
                  </div>
                  {license.compliance_score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Score de Compliance:</span>
                      <Progress value={license.compliance_score} className="w-32" />
                      <span className="text-sm font-medium">{license.compliance_score}%</span>
                    </div>
                  )}
                </div>
                {license.ai_confidence_score && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Confiança da IA</p>
                    <p className="text-2xl font-bold">{Math.round(license.ai_confidence_score * 100)}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="conditions">Condicionantes</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="renewal">Renovação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {hasAIData ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Insights Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Insights da IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tipo de Licença</h4>
                      <Badge>{latestAnalysis.ai_insights?.licenseType || license.type}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Órgão Emissor</h4>
                      <p className="text-sm">{latestAnalysis.ai_insights?.issuingBody || license.issuing_body}</p>
                    </div>
                    {latestAnalysis.ai_insights?.processNumber && (
                      <div>
                        <h4 className="font-medium mb-2">Processo</h4>
                        <p className="text-sm font-mono">{latestAnalysis.ai_insights.processNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Métricas Rápidas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Condicionantes</span>
                      <span className="font-bold">{conditions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Alertas Ativos</span>
                      <span className="font-bold text-destructive">{alerts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Score Compliance</span>
                      <span className="font-bold">{license.compliance_score || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Última Análise</span>
                      <span className="text-sm">
                        {license.ai_last_analysis_at 
                          ? new Date(license.ai_last_analysis_at).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Nenhuma análise de IA encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Execute uma análise para obter insights inteligentes sobre esta licença.
                    </p>
                    <Button onClick={() => handleAnalyze('full_analysis')} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Iniciar Análise IA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Condicionantes ({conditions?.length || 0})
                </CardTitle>
                <CardDescription>
                  Condicionantes extraídas automaticamente pela IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conditionsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : conditions && conditions.length > 0 ? (
                  <div className="space-y-4">
                    {conditions.map((condition) => (
                      <div key={condition.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm mb-2">{condition.condition_text}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getPriorityColor(condition.priority)}>
                                {condition.priority === 'high' ? 'Alta' : 
                                 condition.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                              {condition.condition_category && (
                                <Badge variant="outline">{condition.condition_category}</Badge>
                              )}
                              {condition.ai_extracted && (
                                <Badge variant="secondary">
                                  <Brain className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            {condition.due_date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Prazo: {new Date(condition.due_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateCondition(condition.id, 'completed')}
                              disabled={condition.status === 'completed'}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma condicionante encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Ativos ({alerts?.length || 0})
                </CardTitle>
                <CardDescription>
                  Alertas e recomendações geradas pela IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Alert key={alert.id} className={
                        alert.severity === 'critical' ? 'border-destructive' : ''
                      }>
                        <AlertTriangle className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{alert.title}</h4>
                            <div className="flex gap-2">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity === 'critical' ? 'Crítico' :
                                 alert.severity === 'high' ? 'Alto' :
                                 alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                              </Badge>
                              {alert.action_required && (
                                <Badge variant="outline">Ação Requerida</Badge>
                              )}
                            </div>
                          </div>
                          <AlertDescription>{alert.message}</AlertDescription>
                          {alert.due_date && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Prazo: {new Date(alert.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolver
                            </Button>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-muted-foreground">Nenhum alerta ativo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renewal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Recomendações de Renovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasAIData && latestAnalysis.ai_insights?.renewalRecommendation ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Data Recomendada para Início</h4>
                      <p className="text-sm">
                        {latestAnalysis.ai_insights.renewalRecommendation.startDate 
                          ? new Date(latestAnalysis.ai_insights.renewalRecommendation.startDate).toLocaleDateString('pt-BR')
                          : 'Não definida'
                        }
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Urgência</h4>
                      <Badge variant={
                        latestAnalysis.ai_insights.renewalRecommendation.urgency === 'high' ? 'destructive' :
                        latestAnalysis.ai_insights.renewalRecommendation.urgency === 'medium' ? 'default' : 'secondary'
                      }>
                        {latestAnalysis.ai_insights.renewalRecommendation.urgency === 'high' ? 'Alta' :
                         latestAnalysis.ai_insights.renewalRecommendation.urgency === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    {latestAnalysis.ai_insights.renewalRecommendation.requiredDocuments?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Documentos Necessários</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {latestAnalysis.ai_insights.renewalRecommendation.requiredDocuments.map((doc: string, index: number) => (
                            <li key={index} className="text-sm">{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Execute uma análise para obter recomendações de renovação</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Histórico de Análises
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysesLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : analyses && analyses.length > 0 ? (
                  <div className="space-y-4">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            {analysis.analysis_type === 'full_analysis' ? 'Análise Completa' :
                             analysis.analysis_type === 'compliance_check' ? 'Verificação Compliance' :
                             analysis.analysis_type === 'renewal_prediction' ? 'Predição Renovação' : 
                             analysis.analysis_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(analysis.created_at).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Confiança:</span>
                            <span className="ml-1 font-medium">{Math.round(analysis.confidence_score * 100)}%</span>
                          </div>
                          {analysis.processing_time_ms && (
                            <div>
                              <span className="text-sm text-muted-foreground">Tempo:</span>
                              <span className="ml-1 font-medium">{Math.round(analysis.processing_time_ms / 1000)}s</span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-muted-foreground">Modelo:</span>
                            <span className="ml-1 font-medium">{analysis.ai_model_used}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma análise anterior encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}