import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { getProjectResources } from '@/services/projectManagement';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProjectResourcesWidgetProps {
  projectId: string;
}

export function ProjectResourcesWidget({ projectId }: ProjectResourcesWidgetProps) {
  const [viewType, setViewType] = useState<'overview' | 'allocation' | 'costs'>('overview');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: () => getProjectResources(projectId),
  });

  // Calculate resource metrics
  const totalResources = resources.length;
  const activeResources = resources.filter(r => r.status === 'Ativo').length;
  const totalAllocation = resources.reduce((acc, r) => acc + (r.allocation_percentage || 0), 0);
  const avgAllocation = totalResources > 0 ? totalAllocation / totalResources : 0;
  const totalCost = resources.reduce((acc, r) => 
    acc + (r.hourly_rate * (r.allocation_percentage / 100) * 8 * 22), 0); // Monthly cost estimate

  // Prepare data for charts
  const allocationData = resources.map(resource => ({
    name: resource.role_name,
    allocation: resource.allocation_percentage,
    role: resource.role_name
  }));

  const roleDistribution = resources.reduce((acc, resource) => {
    const role = resource.role_name;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: role,
    value: count,
    fill: `hsl(${Math.random() * 360}, 70%, 60%)`
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recursos do Projeto</h2>
          <p className="text-muted-foreground">
            Gerenciamento e alocação de recursos humanos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewType === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('overview')}
            >
              Visão Geral
            </Button>
            <Button
              variant={viewType === 'allocation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('allocation')}
            >
              Alocação
            </Button>
            <Button
              variant={viewType === 'costs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('costs')}
            >
              Custos
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Alocar Recurso
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Recursos</p>
                <p className="text-2xl font-bold">{totalResources}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recursos Ativos</p>
                <p className="text-2xl font-bold">{activeResources}</p>
                <Progress value={(activeResources / totalResources) * 100} className="mt-2" />
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alocação Média</p>
                <p className="text-2xl font-bold">{Math.round(avgAllocation)}%</p>
                <Progress value={avgAllocation} className="mt-2" />
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custo Mensal</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view type */}
      {viewType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resources List */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Alocados</CardTitle>
              <CardDescription>
                Lista de todos os recursos do projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum recurso alocado</p>
                  <p className="text-sm">Comece adicionando recursos ao projeto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {resource.role_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {resource.role_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {resource.role_name}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(resource.start_date)}
                            {resource.end_date && ` - ${formatDate(resource.end_date)}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={resource.status === 'Ativo' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {resource.status}
                        </Badge>
                        <p className="text-sm font-medium">{resource.allocation_percentage}%</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(resource.hourly_rate)}/hora
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Função</CardTitle>
              <CardDescription>
                Divisão dos recursos por tipo de função
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roleData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Sem dados para exibir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewType === 'allocation' && (
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Alocação</CardTitle>
            <CardDescription>
              Percentual de alocação por recurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      domain={[0, 100]}
                      label={{ value: 'Alocação (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Alocação']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="allocation" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Sem dados de alocação para exibir</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewType === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Custos</CardTitle>
              <CardDescription>
                Detalhamento dos custos por recurso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource) => {
                  const monthlyCost = resource.hourly_rate * (resource.allocation_percentage / 100) * 8 * 22;
                  
                  return (
                    <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {resource.role_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {resource.allocation_percentage}% • {formatCurrency(resource.hourly_rate)}/hora
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(monthlyCost)}</p>
                        <p className="text-xs text-muted-foreground">por mês</p>
                      </div>
                    </div>
                  );
                })}
                
                {resources.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Mensal:</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Recursos</CardTitle>
              <CardDescription>
                Problemas e recomendações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Over-allocation warning */}
                {resources.some(r => r.allocation_percentage > 100) && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">Sobre-alocação detectada</p>
                      <p className="text-sm text-red-600">
                        Alguns recursos estão alocados acima de 100%
                      </p>
                    </div>
                  </div>
                )}

                {/* High cost warning */}
                {totalCost > 50000 && (
                  <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium text-yellow-800">Custo elevado</p>
                      <p className="text-sm text-yellow-600">
                        O custo mensal do projeto está alto: {formatCurrency(totalCost)}
                      </p>
                    </div>
                  </div>
                )}

                {/* All good */}
                {!resources.some(r => r.allocation_percentage > 100) && totalCost <= 50000 && resources.length > 0 && (
                  <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Users className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-green-800">Recursos bem alocados</p>
                      <p className="text-sm text-green-600">
                        Nenhum problema identificado na alocação
                      </p>
                    </div>
                  </div>
                )}

                {resources.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum recurso para analisar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}