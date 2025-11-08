import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Shield, 
  GraduationCap, 
  Heart,
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Pencil,
  MapPin,
  Calendar
} from "lucide-react";
import { getEmployeesStats } from "@/services/employees";
import { getSafetyMetrics } from "@/services/safetyIncidents";
import { getTrainingMetrics } from "@/services/trainingPrograms";
import { getSocialImpactMetrics, getSocialProjects, SocialProject } from "@/services/socialProjects";
import { ModuleSummaryCard } from "@/components/ModuleSummaryCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SocialProjectModal } from "@/components/social/SocialProjectModal";
import { QuickActionModal } from "@/components/social/QuickActionModal";
import { format } from "date-fns";


export default function SocialESG() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SocialProject | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check for action parameter in URL
  useEffect(() => {
    if (searchParams.get("action") === "new-project") {
      setIsProjectModalOpen(true);
      setSearchParams({}); // Clear the param
    }
  }, [searchParams, setSearchParams]);

  // Only essential queries for dashboard KPIs
  const { data: employeesStats } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: getEmployeesStats
  });

  const { data: safetyMetrics } = useQuery({
    queryKey: ['safety-metrics'],
    queryFn: getSafetyMetrics
  });

  const { data: trainingMetrics } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: getTrainingMetrics
  });

  const { data: socialMetrics, refetch: refetchSocialMetrics } = useQuery({
    queryKey: ['social-metrics'],
    queryFn: getSocialImpactMetrics
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['social-projects'],
    queryFn: getSocialProjects
  });

  const handleProjectSuccess = () => {
    refetchSocialMetrics();
    queryClient.invalidateQueries({ queryKey: ['social-projects'] });
    setSelectedProject(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Planejado':
        return 'outline border-blue-500 text-blue-700';
      case 'Em Andamento':
        return 'outline border-yellow-500 text-yellow-700';
      case 'Concluído':
        return 'outline border-green-500 text-green-700';
      case 'Cancelado':
        return 'outline border-gray-500 text-gray-700';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground">ESG Social</h1>
        <p className="text-muted-foreground">
          Gestão completa dos aspectos sociais da sustentabilidade
        </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsQuickActionModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="social">Impacto Social</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeesStats?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {employeesStats?.activeEmployees || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">LTIFR</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safetyMetrics?.ltifr || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa de frequência de acidentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Treinamento</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingMetrics?.totalHoursTrained || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {trainingMetrics?.averageHoursPerEmployee || 0} média/funcionário
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Sociais</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {socialMetrics?.activeProjects || 0} ativos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Diversidade e Inclusão</CardTitle>
                <CardDescription>Distribuição demográfica da força de trabalho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeesStats?.genderDistribution && Object.entries(employeesStats.genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="flex items-center justify-between">
                    <span className="text-sm">{gender}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / (employeesStats.totalEmployees || 1)) * 100} 
                        className="w-20" 
                      />
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Segurança</CardTitle>
                <CardDescription>Principais métricas de saúde e segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total de Incidentes</span>
                  <Badge variant={safetyMetrics?.totalIncidents ? "destructive" : "secondary"}>
                    {safetyMetrics?.totalIncidents || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dias Perdidos</span>
                  <Badge variant="outline">
                    {safetyMetrics?.daysLostTotal || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Com Tratamento Médico</span>
                  <Badge variant="secondary">
                    {safetyMetrics?.withMedicalTreatment || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Access Cards */}
          <div className="space-y-6">
            <ModuleSummaryCard
              title="Gestão de Funcionários"
              description="Sistema completo de recursos humanos"
              icon={Users}
              metrics={[
                { label: 'Funcionários', value: employeesStats?.totalEmployees || 0 },
                { label: 'Departamentos', value: employeesStats?.departments || 0 },
                { label: 'Ativos', value: employeesStats?.activeEmployees || 0 },
                { label: 'Salário Médio', value: `R$ ${(employeesStats?.avgSalary || 0).toLocaleString()}` }
              ]}
              onAccess={() => navigate('/gestao-funcionarios')}
            />

            <ModuleSummaryCard
              title="Segurança do Trabalho"
              description="Sistema de SST e bem-estar ocupacional"
              icon={Shield}
              metrics={[
                { label: 'LTIFR', value: safetyMetrics?.ltifr?.toFixed(2) || '0.00', variant: 'success' },
                { label: 'Incidentes', value: safetyMetrics?.totalIncidents || 0, variant: safetyMetrics?.totalIncidents ? 'warning' : 'success' },
                { label: 'Com Tratamento', value: safetyMetrics?.withMedicalTreatment || 0, variant: 'warning' },
                { label: 'Dias Perdidos', value: safetyMetrics?.daysLostTotal || 0, variant: 'destructive' }
              ]}
              onAccess={() => navigate('/seguranca-trabalho')}
            />

            <ModuleSummaryCard
              title="Gestão de Treinamentos"
              description="Programas de capacitação e desenvolvimento"
              icon={GraduationCap}
              metrics={[
                { label: 'Horas Totais', value: trainingMetrics?.totalHoursTrained || 0 },
                { label: 'Média/Funcionário', value: `${trainingMetrics?.averageHoursPerEmployee || 0}h` },
                { label: 'Taxa Conclusão', value: `${trainingMetrics?.completionRate?.toFixed(1) || 0}%`, variant: 'success' },
                { label: 'Treinamentos', value: trainingMetrics?.totalTrainings || 0 }
              ]}
              onAccess={() => navigate('/gestao-treinamentos')}
            />
          </div>
        </TabsContent>


        <TabsContent value="social" className="space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {socialMetrics?.activeProjects || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(socialMetrics?.totalInvestment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orçamento total: R$ {(socialMetrics?.totalBudget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beneficiários Alcançados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics?.beneficiariesReached || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Pessoas impactadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilização de Orçamento</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(socialMetrics?.budgetUtilization || 0).toFixed(1)}%</div>
                <Progress value={socialMetrics?.budgetUtilization || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Projetos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Projetos Sociais</CardTitle>
                  <CardDescription>Gerencie todos os projetos de impacto social da empresa</CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedProject(null);
                  setIsProjectModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum projeto cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece criando seu primeiro projeto social
                  </p>
                  <Button onClick={() => {
                    setSelectedProject(null);
                    setIsProjectModalOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Projeto
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Investimento</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeVariant(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{project.location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          R$ {(project.invested_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : '-'} - {project.end_date ? format(new Date(project.end_date), 'dd/MM/yyyy') : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProject(project as SocialProject);
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SocialProjectModal 
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        onSuccess={handleProjectSuccess}
        project={selectedProject}
      />

      <QuickActionModal
        open={isQuickActionModalOpen}
        onOpenChange={setIsQuickActionModalOpen}
      />
    </div>
  );
}