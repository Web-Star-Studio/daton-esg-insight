import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Users, 
  Award, 
  TrendingUp,
  Clock,
  Target,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Mock services - these would be real services
const getTrainingPrograms = async () => {
  return [
    {
      id: '1',
      title: 'Segurança do Trabalho - NR35',
      description: 'Treinamento obrigatório sobre trabalho em altura',
      category: 'Segurança',
      duration: 40,
      status: 'Ativo',
      participants: 25,
      completion_rate: 80,
      next_session: '2024-02-15',
      is_mandatory: true
    },
    {
      id: '2', 
      title: 'Liderança e Gestão de Equipes',
      description: 'Desenvolvimento de habilidades de liderança',
      category: 'Desenvolvimento',
      duration: 24,
      status: 'Ativo',
      participants: 15,
      completion_rate: 60,
      next_session: '2024-02-20',
      is_mandatory: false
    }
  ];
};

const getTrainingStats = async () => {
  return {
    totalPrograms: 12,
    activePrograms: 8,
    totalParticipants: 156,
    avgCompletionRate: 75,
    upcomingSessions: 5,
    certificationsIssued: 89
  };
};

export default function GestaoTreinamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms,
  });

  const { data: stats } = useQuery({
    queryKey: ['training-stats'],
    queryFn: getTrainingStats,
  });

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || program.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Planejado': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Segurança': return 'bg-red-100 text-red-800';
      case 'Desenvolvimento': return 'bg-purple-100 text-purple-800';
      case 'Técnico': return 'bg-blue-100 text-blue-800';
      case 'Compliance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statsCards = [
    {
      title: 'Programas de Treinamento',
      value: stats?.totalPrograms || 0,
      icon: BookOpen,
      trend: '+2 novos',
      description: 'programas cadastrados'
    },
    {
      title: 'Participantes Ativos',
      value: stats?.totalParticipants || 0,
      icon: Users,
      trend: '+15%',
      description: 'funcionários em treinamento'
    },
    {
      title: 'Taxa de Conclusão Média',
      value: `${stats?.avgCompletionRate || 0}%`,
      icon: Target,
      trend: '+5%',
      description: 'taxa de aproveitamento'
    },
    {
      title: 'Certificações Emitidas',
      value: stats?.certificationsIssued || 0,
      icon: Award,
      trend: '+12',
      description: 'no último mês'
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Treinamentos</h1>
          <p className="text-muted-foreground">
            Gerencie programas de treinamento, desenvolvimento e certificações
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="programas" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Programas</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="participantes" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Participantes</span>
          </TabsTrigger>
          <TabsTrigger value="certificacoes" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Certificações</span>
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

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Sessões</CardTitle>
                <CardDescription>
                  Treinamentos agendados para as próximas semanas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programs.slice(0, 3).map((program) => (
                    <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{program.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(program.next_session).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {program.participants} inscritos
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Treinamentos</CardTitle>
                <CardDescription>
                  Taxa de conclusão por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Segurança', 'Desenvolvimento', 'Técnico'].map((category) => {
                    const rate = Math.floor(Math.random() * 40) + 60;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {rate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programas de Treinamento</CardTitle>
                  <CardDescription>
                    Gerencie todos os programas de treinamento da organização
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar programas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{program.title}</h3>
                          {program.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground">{program.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <Badge className={getCategoryColor(program.category)}>
                            {program.category}
                          </Badge>
                          <Badge className={getStatusColor(program.status)}>
                            {program.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {program.duration}h
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {program.participants} participantes
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Target className="w-3 h-3" />
                            {program.completion_rate}% conclusão
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Gerenciar
                      </Button>
                      <Button size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Treinamentos</CardTitle>
              <CardDescription>
                Visualize e gerencie o cronograma de treinamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Calendário de treinamentos em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participantes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Participantes</CardTitle>
              <CardDescription>
                Acompanhe o progresso e performance dos participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Gestão de participantes em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificações e Diplomas</CardTitle>
              <CardDescription>
                Gerencie certificações emitidas e validades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Sistema de certificações em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}