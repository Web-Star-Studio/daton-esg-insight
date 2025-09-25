import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

export default function OuvidoriaClientes() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - será substituído pelos dados reais
  const mockComplaints = [
    {
      id: '1',
      complaint_number: 'RCL-2024-0001',
      customer_name: 'João Silva',
      subject: 'Produto com defeito',
      status: 'Aberta',
      priority: 'Alta',
      created_at: '2024-03-15T10:30:00Z',
      category: 'Qualidade'
    },
    {
      id: '2',
      complaint_number: 'RCL-2024-0002',
      customer_name: 'Maria Santos',
      subject: 'Atraso na entrega',
      status: 'Em Análise',
      priority: 'Média',
      created_at: '2024-03-14T14:20:00Z',
      category: 'Logística'
    }
  ];

  const mockStats = {
    total: 45,
    open: 8,
    resolved: 37,
    avgSatisfaction: 4.2,
    slaCompliance: 92
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberta': return 'bg-red-500';
      case 'Em Análise': return 'bg-yellow-500';
      case 'Resolvida': return 'bg-green-500';
      case 'Escalada': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600';
      case 'Média': return 'text-yellow-600';
      case 'Baixa': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ouvidoria de Clientes</h1>
          <p className="text-muted-foreground">
            Sistema de gestão de reclamações e feedback dos clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reclamação
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total}</div>
            <p className="text-xs text-muted-foreground">reclamações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.open}</div>
            <p className="text-xs text-muted-foreground">aguardando resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.resolved}</div>
            <p className="text-xs text-muted-foreground">concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avgSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">avaliação média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.slaCompliance}%</div>
            <p className="text-xs text-muted-foreground">cumprimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="complaints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="complaints">Reclamações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar reclamações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Prioridade Alta
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Em Atraso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaints List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Reclamações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockComplaints.map((complaint) => (
                  <div 
                    key={complaint.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{complaint.complaint_number}</h4>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                        <span className={`text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{complaint.subject}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Cliente: {complaint.customer_name}</span>
                        <span>Categoria: {complaint.category}</span>
                        <span>{formatDate(complaint.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Reclamações por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Qualidade</span>
                    <span className="font-medium">15 (33%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Logística</span>
                    <span className="font-medium">12 (27%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Atendimento</span>
                    <span className="font-medium">10 (22%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outros</span>
                    <span className="font-medium">8 (18%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Alta Prioridade</span>
                    <span className="font-medium">2.5 dias</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Média Prioridade</span>
                    <span className="font-medium">5.2 dias</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Baixa Prioridade</span>
                    <span className="font-medium">8.1 dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Relatório Mensal de Reclamações
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Análise de Satisfação do Cliente
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  Relatório de SLA
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Dashboard Executivo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}