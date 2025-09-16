import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Brain, FileText, AlertTriangle, Calendar, CheckCircle, XCircle, Clock, Target, Upload, RefreshCw, ArrowLeft, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LicenseReconciliationModal } from "@/components/LicenseReconciliationModal";
import { getLicenseById } from "@/services/licenses";
import { getLicenseAnalyses, getLicenseConditions, getLicenseAlerts, analyzeLicenseWithAI } from "@/services/licenseAI";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <Target className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  overdue: <XCircle className="h-4 w-4 text-red-500" />
};

export function LicenciamentoAnalise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // New states for workflow functionality
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [allLicenses, setAllLicenses] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'upload' | 'analysis'>('upload');

  // Switch between list view and single license view
  const { data: license, isLoading: licenseLoading } = useQuery({
    queryKey: ['license', id],
    queryFn: () => getLicenseById(id!),
    enabled: !!id,
  });

  // Load all licenses for upload workflow
  useEffect(() => {
    if (!id) {
      loadAllLicenses();
      setCurrentView('upload');
    } else {
      setCurrentView('analysis');
    }
  }, [id]);

  const loadAllLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const licensesWithDocs = await Promise.all((data || []).map(async (license) => {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, file_name, ai_processing_status')
          .eq('related_id', license.id)
          .eq('related_model', 'license');
        
        return { ...license, documents: docs || [] };
      }));
      
      setAllLicenses(licensesWithDocs);
    } catch (error) {
      console.error('Error loading licenses:', error);
    }
  };

  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['license-analyses', id],
    queryFn: () => getLicenseAnalyses(id!),
    enabled: !!id,
  });

  const { data: conditions, isLoading: conditionsLoading } = useQuery({
    queryKey: ['license-conditions', id],
    queryFn: () => getLicenseConditions(id!),
    enabled: !!id,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['license-alerts', id],
    queryFn: () => getLicenseAlerts(id!),
    enabled: !!id,
  });

  const analyzeWithAI = useMutation({
    mutationFn: () => analyzeLicenseWithAI(id!, 'full_analysis'),
    onSuccess: () => {
      toast({
        title: "Análise iniciada",
        description: "A análise com IA foi iniciada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['license-analyses', id] });
      queryClient.invalidateQueries({ queryKey: ['license-conditions', id] });
      queryClient.invalidateQueries({ queryKey: ['license-alerts', id] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: error.message
      });
    }
  });

  // Upload functionality
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Apenas arquivos PDF são aceitos"
      });
      return;
    }

    setUploadingFile(true);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const { data, error } = await supabase.functions.invoke('license-workflow-processor', {
        body: {
          action: 'upload',
          file: {
            name: file.name,
            type: file.type,
            data: base64Data
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Upload realizado!",
          description: "Análise IA iniciada automaticamente."
        });
        loadAllLicenses();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Erro durante upload",
        description: "Tente novamente"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleReconciliation = (license: any) => {
    setSelectedLicense(license);
    setReconciliationOpen(true);
  };

  const handleReconciliationApprove = async (data: any) => {
    if (!selectedLicense) return;

    const { error } = await supabase.functions.invoke('license-workflow-processor', {
      body: {
        action: 'reconcile',
        licenseId: selectedLicense.id,
        reconciliationData: data
      }
    });

    if (error) throw error;
    
    loadAllLicenses();
  };

  // Workflow View (no ID - list/upload view)
  if (currentView === 'upload') {
    const processingLicenses = allLicenses.filter(l => 
      l.ai_processing_status === 'processing' || l.status === 'Em Análise'
    );
    const pendingReview = allLicenses.filter(l => 
      l.status === 'Aguardando Revisão' || 
      (l.ai_processing_status === 'completed' && l.status !== 'Ativa')
    );
    const completedLicenses = allLicenses.filter(l => 
      l.ai_processing_status === 'completed' || l.status === 'Ativa'
    );

    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/licenciamento')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Análise Inteligente de Licenças</h1>
                <p className="text-muted-foreground">
                  Upload, processamento e análise automática com IA
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload & Análise
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <Clock className="w-4 h-4" />
                Em Progresso ({processingLicenses.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Concluídas ({completedLicenses.length})
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload de Licença Ambiental
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Faça upload da sua licença ambiental
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Apenas arquivos PDF. A IA extrairá automaticamente os dados.
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                      id="pdf-upload"
                      disabled={uploadingFile}
                    />
                    <Button 
                      asChild
                      disabled={uploadingFile}
                      size="lg"
                    >
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        {uploadingFile ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar PDF
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                  
                  {uploadingFile && (
                    <div className="mt-4">
                      <Progress value={50} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground mt-2">
                        Enviando arquivo e iniciando análise IA...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Review */}
              {pendingReview.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Aguardando Revisão ({pendingReview.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingReview.map((license) => (
                        <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="font-medium">
                                {license.name || license.documents?.[0]?.file_name || 'Licença'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {license.ai_confidence_score && `${Math.round(license.ai_confidence_score * 100)}% confiança`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{license.status}</Badge>
                            <Button 
                              size="sm" 
                              onClick={() => handleReconciliation(license)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Revisar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Análises em Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processingLicenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                          <div>
                            <p className="font-medium">
                              {license.documents?.[0]?.file_name || 'Documento de Licença'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Análise IA em andamento...
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Processando</Badge>
                      </div>
                    ))}
                    
                    {processingLicenses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma análise em progresso</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Licenças Processadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedLicenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">
                              {license.name || license.documents?.[0]?.file_name || 'Licença'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {license.type} • {license.ai_confidence_score && `${Math.round(license.ai_confidence_score * 100)}% confiança`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{license.status}</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/licenciamento/${license.id}/analise`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {completedLicenses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma licença processada ainda</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Reconciliation Modal */}
          <LicenseReconciliationModal
            isOpen={reconciliationOpen}
            onClose={() => setReconciliationOpen(false)}
            onApprove={handleReconciliationApprove}
            licenseData={selectedLicense?.ai_extracted_data || {}}
            documentFileName={selectedLicense?.documents?.[0]?.file_name || 'Documento'}
          />
        </div>
      </MainLayout>
    );
  }

  // Analysis View (with ID - single license analysis)
  if (licenseLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">Carregando...</div>
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
            <AlertDescription>Licença não encontrada.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  const latestAnalysis = analyses?.[0];
  const hasDocuments = license.documents && license.documents.length > 0;
  const needsAnalysis = !license.ai_processing_status || license.ai_processing_status === 'not_processed';

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{license.name}</h1>
            <p className="text-muted-foreground">
              {license.type} • {license.issuing_body} • {license.process_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {license.ai_confidence_score && (
              <Badge variant="outline">
                Confiança: {Math.round(license.ai_confidence_score * 100)}%
              </Badge>
            )}
            {license.compliance_score && (
              <Badge variant="outline">
                Compliance: {license.compliance_score}%
              </Badge>
            )}
          </div>
        </div>

        {/* AI Analysis Actions */}
        {hasDocuments && needsAnalysis && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Esta licença possui documentos que podem ser analisados pela IA para extrair condicionantes e gerar alertas automáticos.</span>
              <Button 
                onClick={() => analyzeWithAI.mutate()} 
                disabled={analyzeWithAI.isPending}
                className="ml-4"
              >
                {analyzeWithAI.isPending ? 'Analisando...' : 'Analisar com IA'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="conditions">
              Condicionantes
              {conditions && conditions.length > 0 && (
                <Badge variant="secondary" className="ml-2">{conditions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {alerts && alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analysis">Análises IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* License Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status da Licença</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-2">{license.status}</Badge>
                  <p className="text-xs text-muted-foreground">
                    Válida até: {format(new Date(license.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>

              {/* Compliance Score */}
              {license.compliance_score && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score de Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{license.compliance_score}%</div>
                      <Progress value={license.compliance_score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{license.documents?.length || 0} arquivo(s)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Renewal Recommendation */}
            {latestAnalysis?.ai_insights?.renewalRecommendation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recomendação de Renovação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Iniciar processo em:</p>
                      <p className="text-lg">{format(new Date(latestAnalysis.ai_insights.renewalRecommendation.startDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Urgência:</p>
                      <Badge variant={latestAnalysis.ai_insights.renewalRecommendation.urgency === 'high' ? 'destructive' : 'secondary'}>
                        {latestAnalysis.ai_insights.renewalRecommendation.urgency}
                      </Badge>
                    </div>
                  </div>
                  {latestAnalysis.ai_insights.renewalRecommendation.requiredDocuments?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Documentos Necessários:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {latestAnalysis.ai_insights.renewalRecommendation.requiredDocuments.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            {conditionsLoading ? (
              <div className="text-center py-8">Carregando condicionantes...</div>
            ) : conditions && conditions.length > 0 ? (
              <div className="space-y-4">
                {conditions.map((condition) => (
                  <Card key={condition.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {statusIcons[condition.status as keyof typeof statusIcons]}
                          <Badge variant="outline" className={priorityColors[condition.priority as keyof typeof priorityColors]}>
                            {condition.priority}
                          </Badge>
                          {condition.frequency && (
                            <Badge variant="secondary">{condition.frequency}</Badge>
                          )}
                        </div>
                        {condition.due_date && (
                          <div className="text-sm text-muted-foreground">
                            Vencimento: {format(new Date(condition.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      <p className="text-sm mb-2">{condition.condition_text}</p>
                      {condition.condition_category && (
                        <Badge variant="outline" className="text-xs">
                          {condition.condition_category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma condicionante encontrada. Execute uma análise com IA para extrair condicionantes automaticamente.
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {alertsLoading ? (
              <div className="text-center py-8">Carregando alertas...</div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <Badge className={severityColors[alert.severity as keyof typeof severityColors]}>
                            {alert.severity}
                          </Badge>
                          {alert.action_required && (
                            <Badge variant="destructive">Ação Necessária</Badge>
                          )}
                        </div>
                        {alert.due_date && (
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(alert.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium mb-2">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum alerta ativo. Execute uma análise com IA para gerar alertas automáticos.
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {analysesLoading ? (
              <div className="text-center py-8">Carregando análises...</div>
            ) : analyses && analyses.length > 0 ? (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Análise {analysis.analysis_type}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Confiança: {Math.round(analysis.confidence_score * 100)}%
                          </Badge>
                          <Badge variant="secondary">{analysis.status}</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        {format(new Date(analysis.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })} • 
                        Modelo: {analysis.ai_model_used} • 
                        Tempo: {analysis.processing_time_ms}ms
                      </div>
                      
                      {analysis.ai_insights && (
                        <div className="space-y-4">
                          {analysis.ai_insights.complianceScore && (
                            <div>
                              <h4 className="font-medium mb-2">Score de Compliance</h4>
                              <Progress value={analysis.ai_insights.complianceScore} className="h-2" />
                              <p className="text-sm mt-1">{analysis.ai_insights.complianceScore}%</p>
                            </div>
                          )}
                          
                          {analysis.ai_insights.conditions && analysis.ai_insights.conditions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Condicionantes Extraídas</h4>
                              <p className="text-sm text-muted-foreground">
                                {analysis.ai_insights.conditions.length} condicionante(s) identificada(s)
                              </p>
                            </div>
                          )}
                          
                          {analysis.ai_insights.alerts && analysis.ai_insights.alerts.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Alertas Gerados</h4>
                              <p className="text-sm text-muted-foreground">
                                {analysis.ai_insights.alerts.length} alerta(s) criado(s)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma análise disponível. Execute uma análise com IA para começar.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}