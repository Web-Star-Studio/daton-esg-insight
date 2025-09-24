import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Heart, 
  TrendingUp, 
  FileText, 
  Users, 
  Calculator,
  PiggyBank,
  Shield,
  Plus
} from "lucide-react";
import { getEmployeesStats } from "@/services/employees";

export default function BeneficiosRemuneracao() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");

  const { data: employeeStats, isLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
  });

  // Mock data for benefits and compensation
  const benefitsOverview = {
    totalBenefitsCost: 125000,
    averageSalary: employeeStats?.avgSalary || 0,
    benefitParticipation: 85,
    satisfactionScore: 4.2
  };

  const benefitsPrograms = [
    {
      id: 1,
      name: "Plano de Saúde",
      type: "Saúde",
      participants: 45,
      totalEmployees: employeeStats?.totalEmployees || 50,
      monthlyCost: 15000,
      status: "Ativo"
    },
    {
      id: 2,
      name: "Vale Alimentação",
      type: "Alimentação",
      participants: 48,
      totalEmployees: employeeStats?.totalEmployees || 50,
      monthlyCost: 8000,
      status: "Ativo"
    },
    {
      id: 3,
      name: "Vale Transporte",
      type: "Transporte",
      participants: 35,
      totalEmployees: employeeStats?.totalEmployees || 50,
      monthlyCost: 5500,
      status: "Ativo"
    },
    {
      id: 4,
      name: "Seguro de Vida",
      type: "Seguro",
      participants: 50,
      totalEmployees: employeeStats?.totalEmployees || 50,
      monthlyCost: 2500,
      status: "Ativo"
    }
  ];

  const salaryRanges = [
    { range: "R$ 2.000 - R$ 4.000", count: 15, percentage: 30 },
    { range: "R$ 4.001 - R$ 6.000", count: 12, percentage: 24 },
    { range: "R$ 6.001 - R$ 8.000", count: 10, percentage: 20 },
    { range: "R$ 8.001 - R$ 12.000", count: 8, percentage: 16 },
    { range: "Acima de R$ 12.000", count: 5, percentage: 10 }
  ];

  const statsCards = [
    {
      title: "Custo Total com Benefícios",
      value: `R$ ${benefitsOverview.totalBenefitsCost.toLocaleString()}`,
      description: "Mensal",
      icon: DollarSign,
      trend: "+5.2%"
    },
    {
      title: "Salário Médio",
      value: `R$ ${Math.round(benefitsOverview.averageSalary).toLocaleString()}`,
      description: "Empresa",
      icon: Calculator,
      trend: "+2.8%"
    },
    {
      title: "Participação em Benefícios",
      value: `${benefitsOverview.benefitParticipation}%`,
      description: "Dos funcionários",
      icon: Heart,
      trend: "+1.5%"
    },
    {
      title: "Satisfação",
      value: benefitsOverview.satisfactionScore.toFixed(1),
      description: "Nota média",
      icon: TrendingUp,
      trend: "+0.3"
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Benefícios e Remuneração</h1>
          <p className="text-muted-foreground">
            Gestão de benefícios, salários e compensação dos funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Benefício
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="salaries">Salários</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <span className="text-green-600 mr-1">{card.trend}</span>
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Programas de Benefícios</CardTitle>
                <CardDescription>Visão geral dos benefícios oferecidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefitsPrograms.map((benefit) => (
                    <div key={benefit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {benefit.type === 'Saúde' && <Heart className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Alimentação' && <DollarSign className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Transporte' && <Calculator className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Seguro' && <Shield className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium">{benefit.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {benefit.participants}/{benefit.totalEmployees} funcionários
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {benefit.monthlyCost.toLocaleString()}</p>
                        <Badge variant="outline">{benefit.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição Salarial</CardTitle>
                <CardDescription>Faixas salariais na empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salaryRanges.map((range, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{range.range}</span>
                        <span>{range.count} funcionários ({range.percentage}%)</span>
                      </div>
                      <Progress value={range.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Benefícios</CardTitle>
              <CardDescription>Configure e monitore os benefícios oferecidos pela empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestão de Benefícios</h3>
                <p className="text-muted-foreground mb-4">
                  Configure planos de saúde, vale alimentação, transporte e outros benefícios.
                </p>
                <Button>Configurar Benefícios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Salários</CardTitle>
              <CardDescription>Administre salários, reajustes e estrutura de cargos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Gestão Salarial</h3>
                <p className="text-muted-foreground mb-4">
                  Defina faixas salariais, aplique reajustes e monitore a equidade salarial.
                </p>
                <Button>Gerenciar Salários</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Compensação</CardTitle>
              <CardDescription>Análises avançadas de benefícios e remuneração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Análise Avançada</h3>
                <p className="text-muted-foreground mb-4">
                  Compare com mercado, analise custos e otimize a estratégia de compensação.
                </p>
                <Button>Ver Análises</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Relatórios detalhados sobre benefícios e remuneração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Folha de Pagamento</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Custos por Funcionário</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Análise de Benefícios</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Evolução Salarial</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}