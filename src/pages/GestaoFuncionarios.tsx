import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, TrendingUp, Building2, Briefcase, Calendar } from 'lucide-react';
import { EmployeesList } from '@/components/EmployeesList';
import { EmployeeModal } from '@/components/EmployeeModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeesStats, type Employee } from '@/services/employees';

export default function GestaoFuncionarios() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
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

  const handleModalClose = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: getEmployeesStats,
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie informações, contratos e dados dos funcionários
          </p>
        </div>
        <Button onClick={handleCreateEmployee}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Funcionários</span>
          </TabsTrigger>
          <TabsTrigger value="diversidade" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Diversidade</span>
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
          />
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
                  <h3 className="text-lg font-semibold mb-4">Distribuição por Departamento</h3>
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Implementação em desenvolvimento
                    </p>
                  </div>
                </div>
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
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Relatório de Funcionários</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>Indicadores de Performance</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Building2 className="w-6 h-6" />
                  <span>Análise por Departamento</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span>Relatório de Presença</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Briefcase className="w-6 h-6" />
                  <span>Análise Salarial</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <UserPlus className="w-6 h-6" />
                  <span>Turnover Report</span>
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
    </div>
  );
}