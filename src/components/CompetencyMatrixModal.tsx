import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetencyTable } from "@/components/CompetencyTable";
import { CompetencyModal } from "@/components/CompetencyModal";
import { CompetencyAssessmentModal } from "@/components/CompetencyAssessmentModal";
import { CompetencyGapChart } from "@/components/CompetencyGapChart";
import { useQuery } from "@tanstack/react-query";
import { 
  getCompetencyMatrix, 
  getEmployeeCompetencyAssessments,
  CompetencyMatrix 
} from "@/services/competencyService";
import { generateCompetencyGapReport } from "@/services/reportService";
import { Award, Target, AlertTriangle, Plus, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompetencyMatrixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompetencyMatrixModal({ open, onOpenChange }: CompetencyMatrixModalProps) {
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyMatrix | null>(null);

  const { data: competencies = [], isLoading: competenciesLoading } = useQuery({
    queryKey: ['competency-matrix'],
    queryFn: getCompetencyMatrix,
    enabled: open
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ['competency-assessments'],
    queryFn: getEmployeeCompetencyAssessments,
    enabled: open
  });

  const { data: gapAnalysis = [], isLoading: gapsLoading } = useQuery({
    queryKey: ['competency-gaps'],
    queryFn: generateCompetencyGapReport,
    enabled: open
  });

  const handleEditCompetency = (competency: CompetencyMatrix) => {
    setSelectedCompetency(competency);
    setIsCompetencyModalOpen(true);
  };

  const handleNewCompetency = () => {
    setSelectedCompetency(null);
    setIsCompetencyModalOpen(true);
  };

  const totalCompetencies = competencies.length;
  const totalAssessments = assessments.length;
  const criticalGaps = gapAnalysis.filter(gap => gap.average_gap >= 2).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Matriz de Competências</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleNewCompetency}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Competência
              </Button>
              <Button variant="outline" onClick={() => setIsAssessmentModalOpen(true)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Avaliar Competência
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Competências</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCompetencies}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Competências cadastradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliações Realizadas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAssessments}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avaliações de competências
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lacunas Críticas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{criticalGaps}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gaps ≥ 2 níveis
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="matriz" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="matriz">Matriz de Competências</TabsTrigger>
                <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                <TabsTrigger value="gaps">Análise de Gaps</TabsTrigger>
              </TabsList>

              <TabsContent value="matriz" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Competências Cadastradas</CardTitle>
                    <CardDescription>
                      Gerencie as competências da organização com seus níveis e comportamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {competenciesLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Carregando competências...</p>
                      </div>
                    ) : (
                      <CompetencyTable
                        competencies={competencies}
                        onEdit={handleEditCompetency}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="avaliacoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Avaliações</CardTitle>
                    <CardDescription>
                      Todas as avaliações de competências realizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assessmentsLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Carregando avaliações...</p>
                      </div>
                    ) : assessments.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
                        <p className="text-muted-foreground mb-4">
                          Comece avaliando as competências dos funcionários
                        </p>
                        <Button onClick={() => setIsAssessmentModalOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Avaliação
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assessments.map((assessment: any) => (
                          <div key={assessment.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {assessment.competency?.competency_name || "N/A"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {assessment.competency?.competency_category || "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {format(new Date(assessment.assessment_date), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Nível Atual</p>
                                <p className="text-lg font-bold">{assessment.current_level}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Nível Meta</p>
                                <p className="text-lg font-bold">{assessment.target_level}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Gap</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-lg font-bold">
                                    {assessment.target_level - assessment.current_level}
                                  </p>
                                  {(assessment.target_level - assessment.current_level) >= 2 && (
                                    <Badge variant="destructive">Crítico</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {assessment.development_plan && (
                              <div className="mt-4 p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-1">Plano de Desenvolvimento:</p>
                                <p className="text-sm text-muted-foreground">
                                  {assessment.development_plan}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gaps" className="space-y-4">
                {gapsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando análise de gaps...</p>
                  </div>
                ) : (
                  <CompetencyGapChart data={gapAnalysis} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      <CompetencyModal
        open={isCompetencyModalOpen}
        onOpenChange={setIsCompetencyModalOpen}
        competency={selectedCompetency}
      />

      <CompetencyAssessmentModal
        open={isAssessmentModalOpen}
        onOpenChange={setIsAssessmentModalOpen}
      />
    </>
  );
}
