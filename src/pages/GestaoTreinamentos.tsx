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
  Settings,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Import components
import { TrainingProgramModal } from '@/components/TrainingProgramModal';
import { EmployeeTrainingModal } from '@/components/EmployeeTrainingModal';
import { TrainingCalendar } from '@/components/TrainingCalendar';
import { TrainingCertificationModal } from '@/components/TrainingCertificationModal';
import { BenefitManagementModal } from '@/components/BenefitManagementModal';
import { BenefitConfigurationModal } from '@/components/BenefitConfigurationModal';

// Import services
import { 
  getTrainingPrograms, 
  getEmployeeTrainings, 
  getTrainingMetrics,
  TrainingProgram,
  EmployeeTraining,
  deleteTrainingProgram 
} from '@/services/trainingPrograms';
import { useBenefits, getBenefitStats } from '@/services/benefits';

export default function GestaoTreinamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isEmployeeTrainingModalOpen, setIsEmployeeTrainingModalOpen] = useState(false);
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [isBenefitConfigModalOpen, setIsBenefitConfigModalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  
  // Selected items
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<EmployeeTraining | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch training programs
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms,
  });

  // Fetch employee trainings
  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ['employee-trainings'],
    queryFn: getEmployeeTrainings,
  });

  // Fetch training metrics
  const { data: trainingMetrics } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: getTrainingMetrics,
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

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || program.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Generate calendar events from training data
  const calendarEvents = employeeTrainings
    .filter(training => training.completion_date)
    .map((training, index) => ({
      id: training.id,
      title: training.training_program?.name || 'Treinamento',
      start: new Date(training.completion_date!),
      end: new Date(training.completion_date!),
      resource: {
        program: training.training_program?.name || 'N/A',
        category: training.training_program?.category || 'Outros',
        participants: 1,
        instructor: training.trainer || 'Não informado',
        location: 'Sala de Treinamento'
      }
    }));

  const handleDeleteProgram = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o programa "${name}"?`)) {
      try {
        await deleteTrainingProgram(id);
        toast({
          title: "Sucesso",
          description: "Programa de treinamento excluído com sucesso!",
        });
        queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir programa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewProgram = () => {
    setSelectedProgram(null);
    setIsProgramModalOpen(true);
  };

  const handleEditProgram = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setIsProgramModalOpen(true);
  };

  const handleNewEmployeeTraining = () => {
    setSelectedTraining(null);
    setIsEmployeeTrainingModalOpen(true);
  };

  const handleViewCertification = (training: any) => {
    const certificationData = {
      id: training.id,
      employeeName: training.employee?.full_name || 'N/A',
      employeeCode: training.employee?.employee_code || 'N/A',
      programName: training.training_program?.name || 'N/A',
      category: training.training_program?.category || 'N/A',
      completionDate: training.completion_date || new Date().toISOString(),
      score: training.score || 0,
      duration: training.training_program?.duration_hours || 0,
      instructor: training.trainer || 'Não informado'
    };
    
    setSelectedCertification(certificationData);
    setIsCertificationModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Planejado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Suspenso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Segurança': return 'bg-red-100 text-red-800';
      case 'Desenvolvimento': return 'bg-purple-100 text-purple-800';
      case 'Técnico': return 'bg-blue-100 text-blue-800';
      case 'Compliance': return 'bg-yellow-100 text-yellow-800';
      case 'Liderança': return 'bg-green-100 text-green-800';
      case 'Qualidade': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrainingStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800';
      case 'Inscrito': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-gray-100 text-gray-800';
      case 'Reprovado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats cards for dashboard
  const statsCards = [
    {
      title: 'Programas de Treinamento',
      value: programs.length,
      icon: BookOpen,
      trend: programs.filter(p => p.status === 'Ativo').length + ' ativos',
      description: 'programas cadastrados'
    },
    {
      title: 'Participantes',
      value: employeeTrainings.length,
      icon: Users,
      trend: '+' + employeeTrainings.filter(t => t.status === 'Concluído').length + ' concluídos',
      description: 'participações registradas'
    },
    {
      title: 'Taxa de Conclusão',
      value: trainingMetrics?.completionRate ? `${Math.round(trainingMetrics.completionRate)}%` : '0%',
      icon: Target,
      trend: trainingMetrics?.completedTrainings + '/' + trainingMetrics?.totalTrainings,
      description: 'média de aproveitamento'
    },
    {
      title: 'Horas de Treinamento',
      value: trainingMetrics?.totalHoursTrained || 0,
      icon: Clock,
      trend: trainingMetrics?.averageHoursPerEmployee?.toFixed(1) + 'h/funcionário',
      description: 'horas totais ministradas'
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
        <Button onClick={handleNewProgram}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="programas" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Programas</span>
          </TabsTrigger>
          <TabsTrigger value="participantes" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Participantes</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="certificacoes" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Certificações</span>
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Benefícios</span>
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
                <CardTitle>Próximos Treinamentos</CardTitle>
                <CardDescription>
                  Sessões programadas para as próximas semanas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calendarEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(event.start, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(event.resource.category)}>
                        {event.resource.category}
                      </Badge>
                    </div>
                  ))}
                  
                  {calendarEvents.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">
                        Nenhum treinamento programado
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
                <CardDescription>
                  Taxa de conclusão por categoria de treinamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(trainingMetrics?.categoryDistribution || {}).map(([category, count]) => {
                    const totalInCategory = count as number;
                    const completed = employeeTrainings.filter(t => 
                      t.training_program?.category === category && t.status === 'Concluído'
                    ).length;
                    const rate = totalInCategory > 0 ? Math.round((completed / totalInCategory) * 100) : 0;
                    
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
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Liderança">Liderança</SelectItem>
                    <SelectItem value="Qualidade">Qualidade</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
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
                          <h3 className="font-semibold text-lg">{program.name}</h3>
                          {program.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground">{program.description || "Sem descrição"}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <Badge className={getCategoryColor(program.category || 'Outros')}>
                            {program.category || 'Outros'}
                          </Badge>
                          <Badge className={getStatusColor(program.status)}>
                            {program.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {program.duration_hours || 0}h
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {employeeTrainings.filter(t => t.training_program_id === program.id).length} participantes
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProgram(program)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProgram(program.id, program.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredPrograms.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                      ? "Nenhum programa encontrado com os filtros aplicados." 
                      : "Nenhum programa de treinamento cadastrado."}
                  </p>
                  <Button className="mt-4" onClick={handleNewProgram}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Programa
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="participantes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Participantes em Treinamentos</CardTitle>
                  <CardDescription>
                    Acompanhe o progresso e registre participações
                  </CardDescription>
                </div>
                <Button onClick={handleNewEmployeeTraining}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Participação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeTrainings.map((training) => (
                  <div key={training.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{training.employee?.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {training.training_program?.name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTrainingStatusColor(training.status)}>
                            {training.status}
                          </Badge>
                          {training.score && (
                            <span className="text-sm text-muted-foreground">
                              Nota: {training.score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {training.status === 'Concluído' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCertification(training)}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Certificado
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {employeeTrainings.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma participação registrada
                    </p>
                    <Button className="mt-4" onClick={handleNewEmployeeTraining}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Primeira Participação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <TrainingCalendar 
            events={calendarEvents}
            onEventClick={(event) => console.log('Event clicked:', event)}
            onNewEventClick={() => console.log('New event')}
          />
        </TabsContent>

        <TabsContent value="certificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificações e Diplomas</CardTitle>
              <CardDescription>
                Certificados emitidos e controle de validades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeTrainings
                  .filter(training => training.status === 'Concluído')
                  .map((training) => (
                    <div key={training.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{training.employee?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {training.training_program?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Concluído em {training.completion_date ? format(new Date(training.completion_date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCertification(training)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Baixar Certificado
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {employeeTrainings.filter(training => training.status === 'Concluído').length === 0 && (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma certificação emitida ainda
                    </p>
                  </div>
                )}
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
                <Button onClick={() => setIsBenefitModalOpen(true)}>
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
                        <Settings className="w-5 h-5 text-green-600" />
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
                    <p className="text-muted-foreground">
                      Nenhum benefício cadastrado
                    </p>
                    <Button className="mt-4" onClick={() => setIsBenefitModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Benefício
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TrainingProgramModal
        open={isProgramModalOpen}
        onOpenChange={setIsProgramModalOpen}
        program={selectedProgram}
      />

      <EmployeeTrainingModal
        open={isEmployeeTrainingModalOpen}
        onOpenChange={setIsEmployeeTrainingModalOpen}
        training={selectedTraining}
      />

      <TrainingCertificationModal
        open={isCertificationModalOpen}
        onOpenChange={setIsCertificationModalOpen}
        certification={selectedCertification}
      />

      <BenefitManagementModal
        open={isBenefitModalOpen}
        onOpenChange={setIsBenefitModalOpen}
        benefit={selectedBenefit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['benefits'] });
          queryClient.invalidateQueries({ queryKey: ['benefit-stats'] });
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