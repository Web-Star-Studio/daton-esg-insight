import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, TrendingUp, Building2, Briefcase, Calendar, FileText, Gift, BarChart3, Settings, Plus, Edit, Upload } from 'lucide-react';
import { EmployeesList } from '@/components/EmployeesList';
import { EmployeeModal } from '@/components/EmployeeModal';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import { EmployeeReportsModal } from '@/components/EmployeeReportsModal';
import { BenefitManagementModal } from '@/components/BenefitManagementModal';
import { BenefitConfigurationModal } from '@/components/BenefitConfigurationModal';
import { EmployeeImportSection } from '@/components/EmployeeImportSection';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeesStats, type Employee } from '@/services/employees';
import { useBenefits, getBenefitStats } from '@/services/benefits';

export default function GestaoFuncionarios() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [isBenefitConfigModalOpen, setIsBenefitConfigModalOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('employees');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
  };

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsEmployeeDetailModalOpen(true);
  };

  const handleEditFromDetail = () => {
    setEditingEmployee(viewingEmployee);
    setIsEmployeeDetailModalOpen(false);
    setIsEmployeeModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDetailModalClose = () => {
    setIsEmployeeDetailModalOpen(false);
    setViewingEmployee(null);
  };

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: getEmployeesStats,
  });

  // Fetch benefits
  const { queryKey: benefitsQueryKey, queryFn: benefitsQueryFn } = useBenefits();
  const { data: benefits = [] } = useQuery({
    queryKey: benefitsQueryKey,
    queryFn: benefitsQueryFn,
  });

  // Fetch benefit stats
  const { data: benefitStats } = useQuery({
    queryKey: ['benefit-stats'],
    queryFn: getBenefitStats,
  });

  const statsCards = [
    {
      title: 'Total de Funcionários',
      value: stats?.totalEmployees || 0,
      icon: Users,
      trend: '+12%',
      description: 'em relação ao mês anterior'
    },
    {
      title: 'Funcionários Ativos',
      value: stats?.activeEmployees || 0,
      icon: TrendingUp,
      trend: '+8%',
      description: 'funcionários ativos'
    },
    {
      title: 'Departamentos',
      value: stats?.departments || 0,
      icon: Building2,
      trend: 'Estável',
      description: 'departamentos cadastrados'
    },
    {
      title: 'Salário Médio',
      value: `R$ ${(stats?.avgSalary || 0).toLocaleString('pt-BR')}`,
      icon: Briefcase,
      trend: '+5%',
      description: 'salário médio mensal'
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Colaboradores</h1>
        <p className="text-muted-foreground">
          Gerencie informações, contratos e dados dos funcionários
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Funcionários</span>
          </TabsTrigger>
          <TabsTrigger value="importacao" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Importação</span>
          </TabsTrigger>
          <TabsTrigger value="diversidade" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Diversidade</span>
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Benefícios</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.trend} {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats?.genderDistribution && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Gênero</CardTitle>
                <CardDescription>
                  Análise da diversidade de gênero na empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(stats.genderDistribution).map(([gender, count]) => (
                    <div key={gender} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{count as number}</div>
                      <div className="text-sm text-muted-foreground">{gender}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="funcionarios" className="space-y-4">
          <EmployeesList 
            onEditEmployee={handleEditEmployee}
            onCreateEmployee={handleCreateEmployee}
            onViewEmployee={handleViewEmployee}
          />
        </TabsContent>

        <TabsContent value="importacao" className="space-y-4">
          <EmployeeImportSection />
        </TabsContent>

        <TabsContent value="diversidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Diversidade e Inclusão</CardTitle>
              <CardDescription>
                Métricas de diversidade, equidade e inclusão na organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Diversidade de Gênero</h3>
                  {stats?.genderDistribution && (
                    <div className="space-y-2">
                      {Object.entries(stats.genderDistribution).map(([gender, count]) => {
                        const percentage = ((count as number) / (stats.totalEmployees || 1)) * 100;
                        return (
                          <div key={gender} className="flex items-center justify-between">
                            <span className="text-sm">{gender}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Métricas de Inclusão</h3>
                  <div className="space-y-4">
                    <div className="text-center p-6 border rounded-lg bg-muted/10">
                      <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Análises detalhadas de diversidade e inclusão
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Benefícios</CardTitle>
                  <CardDescription>
                    Configure e gerencie benefícios oferecidos aos funcionários
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedBenefit(null);
                  setIsBenefitModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Benefício
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de Benefícios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{benefits.length}</div>
                    <p className="text-xs text-muted-foreground">
                      benefícios cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {(benefitStats?.totalBenefitsCost || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      custo mensal
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Participação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {benefitStats?.benefitParticipation || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      taxa de adesão
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit: any) => (
                  <div key={benefit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{benefit.name}</p>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={benefit.is_active ? "default" : "secondary"}>
                            {benefit.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            R$ {(benefit.monthly_cost || 0).toLocaleString()}/mês
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {benefit.participants || 0} participantes
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBenefit(benefit);
                          setIsBenefitConfigModalOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configurar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBenefit(benefit);
                          setIsBenefitModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {benefits.length === 0 && (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum benefício cadastrado
                    </p>
                    <Button className="mt-4" onClick={() => {
                      setSelectedBenefit(null);
                      setIsBenefitModalOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Benefício
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de RH</CardTitle>
              <CardDescription>
                Gere relatórios personalizados sobre funcionários e indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('employees');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <FileText className="w-6 h-6" />
                  <span>Gerar Relatórios</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('turnover');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <TrendingUp className="w-6 h-6" />
                  <span>Análise de Performance</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('departments');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <Building2 className="w-6 h-6" />
                  <span>Análise por Departamento</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('diversity');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <Calendar className="w-6 h-6" />
                  <span>Controle de Ponto</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('salaries');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <Briefcase className="w-6 h-6" />
                  <span>Análise Salarial</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    setReportType('turnover');
                    setIsReportsModalOpen(true);
                  }}
                >
                  <UserPlus className="w-6 h-6" />
                  <span>Turnover Analysis</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        employee={editingEmployee}
      />

      <EmployeeDetailModal
        isOpen={isEmployeeDetailModalOpen}
        onClose={handleDetailModalClose}
        onEdit={handleEditFromDetail}
        employee={viewingEmployee}
      />

      <EmployeeReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        initialReportType={reportType}
      />

      <BenefitManagementModal
        open={isBenefitModalOpen}
        onOpenChange={(open) => setIsBenefitModalOpen(open)}
        benefit={selectedBenefit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['benefits'] });
          queryClient.invalidateQueries({ queryKey: ['benefit-stats'] });
          setIsBenefitModalOpen(false);
        }}
      />

      <BenefitConfigurationModal
        open={isBenefitConfigModalOpen}
        onOpenChange={setIsBenefitConfigModalOpen}
        benefit={selectedBenefit}
      />
    </div>
  );
}
