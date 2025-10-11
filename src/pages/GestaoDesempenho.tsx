import { useState, useEffect } from "react";
import { Plus, Target, Award, Calendar, Users, FileText, Download, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { 
  getPerformanceStats, 
  getPerformanceEvaluations, 
  getEmployeeGoals,
  initializeDefaultCriteria 
} from "@/services/employeePerformance";
import { getCompetencyMatrix, getEmployeeCompetencyAssessments, getCompetencyGapAnalysis } from "@/services/competencyService";
import { generatePerformanceReport, generateCompetencyGapReport, generateGoalsReport, exportToCSV } from "@/services/reportService";
import { PerformanceEvaluationModal } from "@/components/PerformanceEvaluationModal";
import { EvaluationCycleModal } from "@/components/EvaluationCycleModal";
import { EditGoalModal } from "@/components/EditGoalModal";
import { CompetencyModal } from "@/components/CompetencyModal";
import { CompetencyAssessmentModal } from "@/components/CompetencyAssessmentModal";
import { CompetencyTable } from "@/components/CompetencyTable";
import { CompetencyGapChart } from "@/components/CompetencyGapChart";
import { PerformanceTrendChart } from "@/components/PerformanceTrendChart";
import { ReportsSection } from "@/components/ReportsSection";
import { PerformanceStatsCards, PerformanceDistributionCard, GoalsProgressCard } from "@/components/PerformanceStatsCards";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthErrorFallback } from "@/components/fallbacks/AuthErrorFallback";
import { DataErrorFallback } from "@/components/fallbacks/DataErrorFallback";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Component de fallback para erros específicos de dados
const PerformanceErrorFallback = ({ error, retry }: { error?: Error; retry: () => void }) => (
  <DataErrorFallback 
    error={error}
    retry={retry}
    title="Problema no Módulo de Desempenho"
    moduleName="gestão de desempenho"
  />
);

export default function GestaoDesempenho() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [isCompetencyAssessmentModalOpen, setIsCompetencyAssessmentModalOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null);
  const { toast } = useToast();

  // Use auth check hook
  const { isAuthenticated, isLoading: authLoading, error: authError, retry: authRetry } = useAuthCheck();

  // Initialize default criteria only after auth is confirmed
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const initDefaults = async () => {
      try {
        await initializeDefaultCriteria();
      } catch (error) {
        console.error('Erro ao inicializar critérios padrão:', error);
        // Don't show error toast for initialization - it's not critical
      }
    };
    
    initDefaults();
  }, [isAuthenticated]);

  // Fetch real data with error handling - only when authenticated
  const { data: performanceStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: getPerformanceStats,
    enabled: isAuthenticated,
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Handle stats error effect
  useEffect(() => {
    if (statsError) {
      console.error('Error loading performance stats:', statsError);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar as estatísticas de desempenho.",
        variant: "destructive",
      });
    }
  }, [statsError, toast]);

  const { data: evaluationsList = [], isLoading: evaluationsLoading, error: evaluationsError } = useQuery({
    queryKey: ['performance-evaluations'],
    queryFn: getPerformanceEvaluations,
    enabled: isAuthenticated,
    retry: 2
  });

  const { data: goalsList = [], isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['employee-goals'],
    queryFn: getEmployeeGoals,
    enabled: isAuthenticated,
    retry: 2
  });

  // Fetch competency data - only when authenticated  
  const { data: competencies = [], isLoading: competenciesLoading, error: competenciesError } = useQuery({
    queryKey: ['competency-matrix'],
    queryFn: getCompetencyMatrix,
    enabled: isAuthenticated,
    retry: 2
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ['competency-assessments'],
    queryFn: getEmployeeCompetencyAssessments,
    enabled: isAuthenticated,
    retry: 2
  });

  const { data: gaps = [], isLoading: gapsLoading } = useQuery({
    queryKey: ['competency-gaps'],
    queryFn: getCompetencyGapAnalysis,
    enabled: isAuthenticated,
    retry: 2
  });

  // Performance stats for display with safe property access
  const statsCards = [
    {
      title: "Avaliações Pendentes",
      value: (performanceStats as any)?.pending_evaluations?.toString() || "0",
      description: "Avaliações aguardando preenchimento",
      icon: Calendar,
      color: "text-amber-600",
      trend: { value: 5, direction: 'down' as const }
    },
    {
      title: "Meta de Conclusão",
      value: `${(performanceStats as any)?.completion_percentage || 0}%`,
      description: "Das avaliações foram concluídas",
      icon: Target,
      color: "text-blue-600",
      trend: { value: 12, direction: 'up' as const }
    },
    {
      title: "Média Geral",
      value: (performanceStats as any)?.average_score?.toFixed(1) || "0.0",
      description: "Nota média das avaliações",
      icon: TrendingUp,
      color: "text-green-600",
      trend: { value: 3, direction: 'up' as const }
    },
    {
      title: "Top Performers",
      value: (performanceStats as any)?.top_performers?.toString() || "0",
      description: "Funcionários com nota ≥ 4.5",
      icon: Award,
      color: "text-purple-600",
      trend: { value: 8, direction: 'up' as const }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "Concluída":
        return "bg-green-100 text-green-800";
      case "No Caminho Certo":
        return "bg-blue-100 text-blue-800";
      case "Atenção Necessária":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (goal: any) => {
    if (!goal.progress_updates || goal.progress_updates.length === 0) return 0;
    const latest = goal.progress_updates[goal.progress_updates.length - 1];
    return latest.progress_percentage || 0;
  };

  const handleExportReport = async (type: 'performance' | 'competencies' | 'goals') => {
    try {
      let data, filename;
      
      switch (type) {
        case 'performance':
          data = await generatePerformanceReport();
          filename = 'relatorio_avaliacoes';
          break;
        case 'competencies':
          data = await generateCompetencyGapReport();
          filename = 'analise_competencias';
          break;
        case 'goals':
          data = await generateGoalsReport();
          filename = 'acompanhamento_metas';
          break;
      }
      
      exportToCSV(data, filename);
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReports = async () => {
    try {
      const [performance, competencies, goals] = await Promise.all([
        generatePerformanceReport(),
        generateCompetencyGapReport(),
        generateGoalsReport()
      ]);
      
      exportToCSV(performance, 'relatorio_completo_avaliacoes');
      exportToCSV(competencies, 'relatorio_completo_competencias');
      exportToCSV(goals, 'relatorio_completo_metas');
      
      toast({
        title: "Sucesso",
        description: "Todos os relatórios foram exportados!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatórios. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Show auth error state
  if (authError) {
    return (
      <AuthErrorFallback 
        error={authError}
        retry={authRetry}
        title="Acesso ao Módulo de Desempenho"
        description="É necessário estar autenticado para acessar o módulo de gestão de desempenho."
      />
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      <div className="flex items-center justify-between" data-tour="performance-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Desempenho</h1>
          <p className="text-muted-foreground">
            Gerencie avaliações, metas e desenvolvimento dos funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCycleModalOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Ciclo de Avaliação
          </Button>
          <Button onClick={() => setIsEvaluationModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
          <TabsTrigger value="goals">Metas e Objetivos</TabsTrigger>
          <TabsTrigger value="competencies">Competências</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">
                  Erro ao carregar estatísticas de desempenho. Tente recarregar a página.
                </p>
              </CardContent>
            </Card>
          ) : (
            <PerformanceStatsCards stats={statsCards} />
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <PerformanceDistributionCard />
            <GoalsProgressCard />
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <div className="flex items-center justify-between" data-tour="evaluation-cycles">
            <h2 className="text-2xl font-bold">Avaliações de Desempenho</h2>
            <Button onClick={() => setIsEvaluationModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>

          {evaluationsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Avaliações</CardTitle>
                <CardDescription>Carregando avaliações...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                        <div className="h-8 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : evaluationsError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">
                  Erro ao carregar avaliações de desempenho. Tente recarregar a página.
                </p>
              </CardContent>
            </Card>
          ) : (evaluationsList as any[])?.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma avaliação encontrada"
              description="Comece criando sua primeira avaliação de desempenho para acompanhar o desenvolvimento da equipe."
              actionLabel="Criar Primeira Avaliação"
              onAction={() => setIsEvaluationModalOpen(true)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Avaliações</CardTitle>
                <CardDescription>
                  Acompanhe o status das avaliações de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(evaluationsList as any[])?.map((evaluation: any) => (
                    <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{evaluation.employee?.full_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{evaluation.employee?.position || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm">{format(new Date(evaluation.period_start), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(evaluation.period_end), "dd/MM/yyyy", { locale: ptBR })}</p>
                            <p className="text-sm text-muted-foreground">Avaliador: {evaluation.evaluator?.full_name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {evaluation.overall_score && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{evaluation.overall_score}</p>
                            <p className="text-xs text-muted-foreground">Nota</p>
                          </div>
                        )}
                        <Badge className={getStatusColor(evaluation.status)}>
                          {evaluation.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between" data-tour="goals-section">
            <h2 className="text-2xl font-bold">Metas e Objetivos</h2>
            <Button onClick={() => {
              setSelectedGoalId(null);
              setIsGoalModalOpen(true);
            }}>
              <Target className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          {goalsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento de Metas</CardTitle>
                <CardDescription>Carregando metas...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-48"></div>
                        <div className="h-3 bg-muted rounded w-32"></div>
                        <div className="h-2 bg-muted rounded w-full mt-4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : goalsError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">
                  Erro ao carregar metas. Tente recarregar a página.
                </p>
              </CardContent>
            </Card>
          ) : (goalsList as any[])?.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma meta encontrada"
              description="Comece definindo metas e objetivos para acompanhar o progresso da equipe e da organização."
              actionLabel="Criar Primeira Meta"
              onAction={() => {
                setSelectedGoalId(null);
                setIsGoalModalOpen(true);
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento de Metas</CardTitle>
                <CardDescription>
                  Progresso das metas individuais dos funcionários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(goalsList as any[])?.map((goal: any) => {
                    const progress = calculateProgress(goal);
                    return (
                      <div key={goal.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getGoalStatusColor(goal.status)}>
                              {goal.status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedGoalId(goal.id);
                                setIsGoalModalOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">Progresso</span>
                              <span className="text-sm font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {goal.deadline_date && (
                              <span>Prazo: {format(new Date(goal.deadline_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="competencies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestão de Competências</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCompetencyAssessmentModalOpen(true)}>
                <Target className="h-4 w-4 mr-2" />
                Avaliar Competência
              </Button>
              <Button onClick={() => setIsCompetencyModalOpen(true)}>
                <Award className="h-4 w-4 mr-2" />
                Nova Competência
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Competências</CardTitle>
                <CardDescription>
                  Competências definidas para a organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{competencies.length}</div>
                <p className="text-xs text-muted-foreground">
                  Competências cadastradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avaliações Realizadas</CardTitle>
                <CardDescription>
                  Total de avaliações de competência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assessments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Avaliações concluídas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lacunas Críticas</CardTitle>
                <CardDescription>
                  Gaps de competência identificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{(gaps as any[])?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matrix">Matriz de Competências</TabsTrigger>
              <TabsTrigger value="assessments">Avaliações</TabsTrigger>
              <TabsTrigger value="gaps">Análise de Gaps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="matrix" className="space-y-4">
              <CompetencyTable 
                competencies={competencies}
                onEdit={(competency) => {
                  setSelectedCompetency(competency);
                  setIsCompetencyModalOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="assessments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Avaliações</CardTitle>
                  <CardDescription>
                    Todas as avaliações de competência realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assessments.map((assessment: any) => (
                      <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{assessment.competency?.competency_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Funcionário ID: {assessment.employee_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">Atual: {assessment.current_level}</p>
                            <p className="text-sm text-muted-foreground">Meta: {assessment.target_level}</p>
                          </div>
                          <Badge variant={assessment.target_level - assessment.current_level >= 2 ? "destructive" : "secondary"}>
                            Gap: {assessment.target_level - assessment.current_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="gaps" className="space-y-4">
              <CompetencyGapChart data={gaps as any} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Relatórios de Desempenho</h2>
            <Button onClick={handleGenerateReports}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatórios
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relatório de Avaliações</CardTitle>
                <CardDescription>
                  Compilado das avaliações por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleExportReport('performance')}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Competências</CardTitle>
                <CardDescription>
                  Gaps e necessidades de desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleExportReport('competencies')}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acompanhamento de Metas</CardTitle>
                <CardDescription>
                  Progresso e conclusão das metas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleExportReport('goals')}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PerformanceEvaluationModal
        open={isEvaluationModalOpen}
        onOpenChange={setIsEvaluationModalOpen}
      />

      <EvaluationCycleModal
        open={isCycleModalOpen}
        onOpenChange={setIsCycleModalOpen}
      />

      <EditGoalModal
        open={isGoalModalOpen}
        onOpenChange={setIsGoalModalOpen}
        goalId={selectedGoalId}
      />

      <CompetencyModal
        open={isCompetencyModalOpen}
        onOpenChange={setIsCompetencyModalOpen}
        competency={selectedCompetency}
      />

      <CompetencyAssessmentModal
        open={isCompetencyAssessmentModalOpen}
        onOpenChange={setIsCompetencyAssessmentModalOpen}
      />
      </div>
    </ErrorBoundary>
  );
}