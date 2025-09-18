import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Shield, 
  GraduationCap, 
  Heart,
  Plus,
  TrendingUp,
  AlertTriangle,
  Activity
} from "lucide-react";
import { getEmployees, getEmployeesStats } from "@/services/employees";
import { getSafetyIncidents, getSafetyMetrics } from "@/services/safetyIncidents";
import { getTrainingPrograms, getTrainingMetrics } from "@/services/trainingPrograms";
import { getSocialProjects, getSocialImpactMetrics } from "@/services/socialProjects";
import { MainLayout } from "@/components/MainLayout";

export default function SocialESG() {
  const [activeTab, setActiveTab] = useState("overview");

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

  const { data: socialMetrics } = useQuery({
    queryKey: ['social-metrics'],
    queryFn: getSocialImpactMetrics
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  const { data: safetyIncidents } = useQuery({
    queryKey: ['safety-incidents'],
    queryFn: getSafetyIncidents
  });

  const { data: trainingPrograms } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms
  });

  const { data: socialProjects } = useQuery({
    queryKey: ['social-projects'],
    queryFn: getSocialProjects
  });

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ESG Social</h1>
          <p className="text-muted-foreground">
            Gestão completa dos aspectos sociais da sustentabilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="employees">Colaboradores</TabsTrigger>
          <TabsTrigger value="safety">Saúde & Segurança</TabsTrigger>
          <TabsTrigger value="training">Desenvolvimento</TabsTrigger>
          <TabsTrigger value="social">Impacto Social</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
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
                  {trainingMetrics?.averageHoursPerEmployee || 0} média/colaborador
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

          <Card>
            <CardHeader>
              <CardTitle>Performance de Treinamento</CardTitle>
              <CardDescription>Distribuição de treinamentos por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trainingMetrics?.categoryDistribution && Object.entries(trainingMetrics.categoryDistribution).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{category}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Conclusão</span>
                  <span className="font-medium">{trainingMetrics?.completionRate?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={trainingMetrics?.completionRate || 0} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Colaboradores</CardTitle>
                  <CardDescription>Cadastro e informações dos colaboradores</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Colaborador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Colaboradores</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão completa de colaboradores
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá cadastro, dados demográficos, avaliações e muito mais
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Saúde e Segurança</CardTitle>
                  <CardDescription>Gestão de incidentes e indicadores de segurança</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Incidente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Saúde e Segurança</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão de SST
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá registro de incidentes, indicadores LTIFR, TRIFR e programas de segurança
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Desenvolvimento e Treinamento</CardTitle>
                  <CardDescription>Programas de capacitação e desenvolvimento</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Programa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Desenvolvimento</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão de treinamentos
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá programas de treinamento, avaliações, certificações e planos de desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Impacto Social</CardTitle>
                  <CardDescription>Projetos e iniciativas de responsabilidade social</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Impacto Social</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão de projetos sociais
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá gestão de projetos, monitoramento de impacto, parcerias e investimento social
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  );
}