import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialityInteractiveMatrix } from "@/components/MaterialityInteractiveMatrix";
import { MaterialityAssessmentWizard } from "@/components/MaterialityAssessmentWizard";
import { 
  Target, 
  Plus, 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp,
  Eye,
  Settings,
  Play,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getMaterialityThemes,
  getMaterialityAssessments,
  createMaterialityAssessment,
  MaterialityAssessment,
  MaterialityTheme,
  MATERIALITY_CATEGORIES,
  getMaterialityInsights
} from "@/services/materiality";

export default function AnaliseMaterialidade() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<MaterialityAssessment | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const { data: themes = [], isLoading: loadingThemes } = useQuery({
    queryKey: ['materiality-themes'],
    queryFn: () => getMaterialityThemes(),
    enabled: !!user,
  });

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['materiality-assessments'],
    queryFn: () => getMaterialityAssessments(),
    enabled: !!user,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: createMaterialityAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiality-assessments'] });
      toast({
        title: "Sucesso",
        description: "Nova avaliação de materialidade criada",
      });
    },
  });

  const handleCreateAssessment = async (assessment: Omit<MaterialityAssessment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const assessmentWithUser = {
      ...assessment,
      created_by_user_id: user.id,
    };

    await createAssessmentMutation.mutateAsync(assessmentWithUser);
  };

  const handleQuickCreate = () => {
    setShowWizard(true);
  };

  // Dados de exemplo para demonstração
  const sampleMatrix = themes.slice(0, 15).reduce((acc, theme, index) => {
    acc[theme.id] = {
      x: Math.random() * 80 + 20, // 20-100
      y: Math.random() * 80 + 20, // 20-100
      priority: index < 5 ? 'high' : index < 10 ? 'medium' : 'low'
    };
    return acc;
  }, {} as Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>);

  const latestAssessment = assessments[0];
  const insights = latestAssessment && themes.length > 0 ? 
    getMaterialityInsights({
      ...latestAssessment,
      final_matrix: sampleMatrix
    }, themes) : null;

  if (loadingThemes || loadingAssessments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando análise de materialidade...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Análise de Materialidade</h1>
            <p className="text-muted-foreground">
              Identifique e priorize os temas ESG mais relevantes para sua organização
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleQuickCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
            <Button variant="outline" onClick={handleQuickCreate}>
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Wizard Avançado</span>
              <span className="sm:hidden">Wizard</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Temas Disponíveis</p>
                  <p className="text-2xl font-bold">{themes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Avaliações Realizadas</p>
                  <p className="text-2xl font-bold">{assessments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Temas Alta Prioridade</p>
                  <p className="text-2xl font-bold">{insights?.highPriority || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Participação Stakeholders</p>
                  <p className="text-2xl font-bold">{latestAssessment?.stakeholder_participation || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matriz" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matriz">Matriz de Materialidade</TabsTrigger>
            <TabsTrigger value="temas">Biblioteca de Temas</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="matriz" className="space-y-4">
            {Object.keys(sampleMatrix).length > 0 ? (
              <MaterialityInteractiveMatrix
                themes={themes}
                matrix={sampleMatrix}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma matriz disponível</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie uma nova avaliação de materialidade para começar a análise
                  </p>
                  <Button onClick={handleQuickCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Avaliação
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="temas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MATERIALITY_CATEGORIES.map(category => {
                const categoryThemes = themes.filter(theme => theme.category === category.value);
                return (
                  <Card key={category.value}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        {category.label}
                      </CardTitle>
                      <CardDescription>
                        {categoryThemes.length} temas disponíveis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryThemes.slice(0, 5).map(theme => (
                          <div key={theme.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{theme.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {theme.code}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {theme.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {theme.gri_indicators.slice(0, 3).map(indicator => (
                                <Badge key={indicator} variant="secondary" className="text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                              {theme.gri_indicators.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{theme.gri_indicators.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {categoryThemes.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{categoryThemes.length - 5} temas adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-4">
            {assessments.length > 0 ? (
              <div className="grid gap-4">
                {assessments.map(assessment => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{assessment.title}</CardTitle>
                          <CardDescription>
                            {assessment.description} • Ano: {assessment.assessment_year}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              assessment.status === 'completed' ? 'default' :
                              assessment.status === 'survey_open' ? 'secondary' :
                              'outline'
                            }
                          >
                            {assessment.status === 'completed' ? 'Concluída' :
                             assessment.status === 'survey_open' ? 'Survey Aberto' :
                             assessment.status === 'analysis' ? 'Em Análise' :
                             'Rascunho'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{assessment.selected_themes.length}</p>
                          <p className="text-sm text-muted-foreground">Temas Selecionados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{assessment.stakeholder_participation}</p>
                          <p className="text-sm text-muted-foreground">Participantes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {Object.keys(assessment.final_matrix).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Temas Avaliados</p>
                        </div>
                        <div className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Inicie sua primeira análise de materialidade
                  </p>
                  <Button onClick={handleQuickCreate}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Avaliação
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Wizard Modal */}
        <MaterialityAssessmentWizard
          open={showWizard}
          onClose={() => setShowWizard(false)}
          onSubmit={handleCreateAssessment}
          themes={themes}
        />
      </div>
    </MainLayout>
  );
}