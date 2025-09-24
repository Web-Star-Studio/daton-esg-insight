import { useState } from "react";
import { Plus, TrendingUp, Target, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function GestaoDesempenho() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");

  // Mock data for performance stats
  const performanceStats = [
    {
      title: "Avaliações Pendentes",
      value: "12",
      description: "Avaliações aguardando preenchimento",
      icon: Calendar,
      color: "text-amber-600"
    },
    {
      title: "Meta de Conclusão",
      value: "85%",
      description: "Das avaliações foram concluídas",
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Média Geral",
      value: "4.2",
      description: "Nota média das avaliações",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Top Performers",
      value: "18",
      description: "Funcionários com nota ≥ 4.5",
      icon: Award,
      color: "text-purple-600"
    }
  ];

  // Mock data for evaluations
  const evaluations = [
    {
      id: 1,
      employee: "Ana Silva",
      position: "Analista de Marketing",
      period: "2024 - 1º Semestre",
      status: "Concluída",
      score: 4.5,
      evaluator: "João Santos"
    },
    {
      id: 2,
      employee: "Carlos Oliveira",
      position: "Desenvolvedor Senior",
      period: "2024 - 1º Semestre",
      status: "Pendente",
      score: null,
      evaluator: "Maria Costa"
    },
    {
      id: 3,
      employee: "Fernanda Lima",
      position: "Gerente de Vendas",
      period: "2024 - 1º Semestre",
      status: "Em Andamento",
      score: null,
      evaluator: "Ricardo Alves"
    }
  ];

  // Mock data for goals
  const goals = [
    {
      id: 1,
      employee: "Ana Silva",
      goal: "Aumentar conversão de leads em 15%",
      progress: 80,
      deadline: "31/12/2024",
      status: "Em Progresso"
    },
    {
      id: 2,
      employee: "Carlos Oliveira",
      goal: "Reduzir bugs em produção em 30%",
      progress: 60,
      deadline: "30/11/2024",
      status: "Em Progresso"
    },
    {
      id: 3,
      employee: "Fernanda Lima",
      goal: "Atingir R$ 500k em vendas",
      progress: 95,
      deadline: "31/12/2024",
      status: "Quase Concluída"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída":
        return "bg-green-100 text-green-800";
      case "Em Andamento":
        return "bg-blue-100 text-blue-800";
      case "Pendente":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "Concluída":
        return "bg-green-100 text-green-800";
      case "Em Progresso":
        return "bg-blue-100 text-blue-800";
      case "Quase Concluída":
        return "bg-purple-100 text-purple-800";
      case "Atrasada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Desempenho</h1>
          <p className="text-muted-foreground">
            Gerencie avaliações, metas e desenvolvimento dos funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Ciclo de Avaliação
          </Button>
          <Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Notas</CardTitle>
                <CardDescription>
                  Distribuição das avaliações por faixa de nota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-24 text-sm">5.0 - 4.5</div>
                    <Progress value={30} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">30%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">4.4 - 4.0</div>
                    <Progress value={45} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">45%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">3.9 - 3.5</div>
                    <Progress value={20} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">20%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">&lt; 3.5</div>
                    <Progress value={5} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">5%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progresso das Metas</CardTitle>
                <CardDescription>
                  Acompanhamento das metas por departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-24 text-sm">Vendas</div>
                    <Progress value={85} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">85%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">Marketing</div>
                    <Progress value={72} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">72%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">TI</div>
                    <Progress value={68} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">68%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-sm">RH</div>
                    <Progress value={90} className="mx-4" />
                    <div className="w-12 text-sm text-muted-foreground">90%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Avaliações de Desempenho</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Avaliações</CardTitle>
              <CardDescription>
                Acompanhe o status das avaliações de desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{evaluation.employee}</p>
                          <p className="text-sm text-muted-foreground">{evaluation.position}</p>
                        </div>
                        <div>
                          <p className="text-sm">{evaluation.period}</p>
                          <p className="text-sm text-muted-foreground">Avaliador: {evaluation.evaluator}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {evaluation.score && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{evaluation.score}</p>
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
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Metas e Objetivos</h2>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acompanhamento de Metas</CardTitle>
              <CardDescription>
                Progresso das metas individuais dos funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{goal.employee}</p>
                        <p className="text-sm text-muted-foreground">{goal.goal}</p>
                      </div>
                      <Badge className={getGoalStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Progresso</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Prazo: {goal.deadline}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestão de Competências</h2>
            <Button>
              <Award className="h-4 w-4 mr-2" />
              Definir Competências
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Matriz de Competências</CardTitle>
              <CardDescription>
                Em desenvolvimento - Funcionalidade será implementada em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Matriz de competências e planos de desenvolvimento em construção
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Relatórios de Desempenho</h2>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Gerar Relatório
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
                <Button variant="outline" className="w-full">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Metas</CardTitle>
                <CardDescription>
                  Progresso e conclusão das metas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking de Performance</CardTitle>
                <CardDescription>
                  Top performers por departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}