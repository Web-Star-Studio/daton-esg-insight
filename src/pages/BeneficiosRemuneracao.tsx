import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  Heart, 
  TrendingUp, 
  FileText, 
  Users, 
  Calculator,
  PiggyBank,
  Shield,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Settings,
} from "lucide-react";
import { getEmployeesStats, useEmployees } from "@/services/employees";
import { useBenefits, getBenefitStats, deleteBenefit, type Benefit } from "@/services/benefits";
import { BenefitManagementModal } from "@/components/BenefitManagementModal";
import { SalaryManagementModal } from "@/components/SalaryManagementModal";
import { BenefitsReportModal } from "@/components/BenefitsReportModal";
import { BenefitConfigurationModal } from "@/components/BenefitConfigurationModal";
import { toast } from "sonner";

export default function BeneficiosRemuneracao() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");
  const [searchTerm, setSearchTerm] = useState("");
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [configurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [selectedBenefitForConfig, setSelectedBenefitForConfig] = useState<{id: string, name: string, type: string} | null>(null);

  const queryClient = useQueryClient();

  const { data: employeeStats, isLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
  });

  const { data: employees = [] } = useEmployees();

  const { data: benefits = [], isLoading: benefitsLoading, refetch: refetchBenefits } = useQuery(useBenefits());

  const { data: benefitStats, isLoading: statsLoading } = useQuery({
    queryKey: ['benefit-stats'],
    queryFn: getBenefitStats,
  });

  // Real data for benefits and compensation
  const benefitsOverview = {
    totalBenefitsCost: benefitStats?.totalBenefitsCost || 0,
    averageSalary: employeeStats?.avgSalary || 0,
    benefitParticipation: benefitStats?.benefitParticipation || 0,
    satisfactionScore: 4.2 // This could come from surveys
  };

  const benefitsPrograms = benefits
    .filter(benefit => 
      benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(benefit => ({
      id: benefit.id,
      name: benefit.name,
      type: benefit.type,
      participants: benefit.participants || 0,
      totalEmployees: benefit.total_employees || employeeStats?.totalEmployees || 0,
      monthlyCost: benefit.monthly_cost || 0,
      status: benefit.is_active ? "Ativo" : "Inativo",
      provider: benefit.provider || "",
      contractNumber: benefit.contract_number || "",
      description: benefit.description || "",
      eligibilityRules: benefit.eligibility_rules || "",
      isActive: benefit.is_active
    }));

  const handleDeleteBenefit = async (benefitId: string) => {
    try {
      await deleteBenefit(benefitId);
      toast.success("Benefício removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      queryClient.invalidateQueries({ queryKey: ['benefit-stats'] });
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error("Erro ao remover benefício");
    }
  };

  const handleBenefitSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['benefits'] });
    queryClient.invalidateQueries({ queryKey: ['benefit-stats'] });
    toast.success("Lista de benefícios atualizada!");
  };

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

  if (isLoading || benefitsLoading || statsLoading) {
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
          <Button variant="outline" onClick={() => setReportsModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => setBenefitModalOpen(true)}>
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
                    <span className="text-emerald-600 mr-1">{card.trend}</span>
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
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">R$ {benefit.monthlyCost.toLocaleString()}</p>
                          <Badge variant={benefit.status === 'Ativo' ? 'default' : 'secondary'}>
                            {benefit.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBenefit(benefit as unknown as Benefit);
                                setBenefitModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteBenefit(benefit.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar benefícios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
            <Button onClick={() => setBenefitModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Benefício
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitsPrograms.length > 0 ? (
              benefitsPrograms.map((benefit) => (
                <Card key={benefit.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {benefit.type === 'Saúde' && <Heart className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Alimentação' && <DollarSign className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Transporte' && <Calculator className="h-4 w-4 text-primary" />}
                          {benefit.type === 'Seguro' && <Shield className="h-4 w-4 text-primary" />}
                        </div>
                        <Badge variant={benefit.status === 'Ativo' ? 'default' : 'secondary'}>
                          {benefit.status}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBenefit(benefit as unknown as Benefit);
                              setBenefitModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBenefitForConfig({
                                id: benefit.id,
                                name: benefit.name,
                                type: benefit.type
                              });
                              setConfigurationModalOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteBenefit(benefit.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-lg">{benefit.name}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.type}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Participantes:</span>
                          <span className="font-medium">
                            {benefit.participants}/{benefit.totalEmployees}
                          </span>
                        </div>
                        <Progress 
                          value={(benefit.participants / benefit.totalEmployees) * 100} 
                          className="h-2" 
                        />
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Custo mensal:</span>
                          <span className="font-medium text-lg">
                            R$ {benefit.monthlyCost.toLocaleString()}
                          </span>
                        </div>
                        {benefit.provider && (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">Fornecedor:</span>
                            <span className="text-xs">{benefit.provider}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? "Nenhum benefício encontrado" : "Nenhum benefício cadastrado"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Tente usar outros termos de busca"
                        : "Configure planos de saúde, vale alimentação, transporte e outros benefícios."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setBenefitModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Benefício
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setSalaryModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Aplicar Reajuste
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Salarial por Funcionário</CardTitle>
                <CardDescription>Lista detalhada dos salários atuais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.position || "Cargo não informado"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {(Math.random() * 8000 + 3000).toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                          <p className="text-xs text-muted-foreground">{employee.department || "Departamento"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Salarial</CardTitle>
                <CardDescription>Estatísticas e insights sobre a folha de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">R$ {Math.round(benefitsOverview.averageSalary).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Salário Médio</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">R$ {(Math.round(benefitsOverview.averageSalary) * 1.5).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Maior Salário</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Distribuição por Faixas</h4>
                    {salaryRanges.map((range, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{range.range}</span>
                          <span>{range.count} ({range.percentage}%)</span>
                        </div>
                        <Progress value={range.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custo total mensal:</span>
                      <span className="font-medium">
                        R$ {(benefitsOverview.averageSalary * (employeeStats?.totalEmployees || 50)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eficiência de Benefícios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Utilização:</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Percentual de funcionários que utilizam pelo menos um benefício
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custo por Funcionário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold">R$ 620</p>
                  <p className="text-xs text-muted-foreground">Custo médio mensal em benefícios</p>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>vs. Mercado:</span>
                      <span className="text-emerald-600 font-medium">-8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Satisfação Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold">{benefitsOverview.satisfactionScore}</p>
                  <p className="text-xs text-muted-foreground">Nota média (1-5)</p>
                  <div className="mt-3">
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-3 h-3 rounded-full ${
                            star <= Math.round(benefitsOverview.satisfactionScore)
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Mercado</CardTitle>
                <CardDescription>Como seus benefícios se comparam ao mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefitsPrograms.slice(0, 4).map((benefit, index) => {
                    const marketComparison = [92, 88, 76, 95][index];
                    return (
                      <div key={benefit.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">{benefit.name}</span>
                          <span className="text-sm font-medium">{marketComparison}% do mercado</span>
                        </div>
                        <Progress value={marketComparison} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências de Custos</CardTitle>
                <CardDescription>Evolução dos custos nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tendência Geral</p>
                      <p className="text-sm text-muted-foreground">Crescimento controlado</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-medium">+2.5%</p>
                      <p className="text-xs text-muted-foreground">vs. mês anterior</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'].map((month, index) => (
                      <div key={month} className="flex justify-between items-center">
                        <span className="text-sm">{month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${60 + (index * 5)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            R$ {(28000 + (index * 1000)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Benefícios e Remuneração</CardTitle>
              <CardDescription>Gere relatórios detalhados e análises personalizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex-col hover:border-primary"
                  onClick={() => setReportsModalOpen(true)}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Folha de Pagamento</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF/Excel</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col hover:border-primary"
                  onClick={() => setReportsModalOpen(true)}
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span>Custos por Funcionário</span>
                  <span className="text-xs text-muted-foreground mt-1">Detalhado</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col hover:border-primary"
                  onClick={() => setReportsModalOpen(true)}
                >
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Análise de Benefícios</span>
                  <span className="text-xs text-muted-foreground mt-1">Comparativo</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col hover:border-primary"
                  onClick={() => setReportsModalOpen(true)}
                >
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Evolução Salarial</span>
                  <span className="text-xs text-muted-foreground mt-1">Histórico</span>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Relatórios Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Demonstrativo de pagamento individual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Relatório de encargos sociais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Análise de turnover salarial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Comparativo de mercado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BenefitManagementModal
        open={benefitModalOpen}
        onOpenChange={(open) => {
          setBenefitModalOpen(open);
          if (!open) setSelectedBenefit(null);
        }}
        benefit={selectedBenefit}
        onSuccess={handleBenefitSuccess}
      />

      <SalaryManagementModal
        open={salaryModalOpen}
        onOpenChange={setSalaryModalOpen}
        onSuccess={() => {
          // Here you would refetch salary data
          toast.success("Dados salariais atualizados!");
        }}
      />

      <BenefitsReportModal
        open={reportsModalOpen}
        onOpenChange={setReportsModalOpen}
      />

      <BenefitConfigurationModal
        open={configurationModalOpen}
        onOpenChange={setConfigurationModalOpen}
        benefit={selectedBenefitForConfig}
      />
    </div>
  );
}