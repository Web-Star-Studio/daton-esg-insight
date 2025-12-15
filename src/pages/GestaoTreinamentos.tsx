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
  Download,
  Eye,
  Edit,
  Trash2,
  CalendarClock,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Import components
import { TrainingProgramModal } from '@/components/TrainingProgramModal';
import { EmployeeTrainingModal } from '@/components/EmployeeTrainingModal';
import { TrainingCalendar } from '@/components/TrainingCalendar';
import { TrainingCertificationModal } from '@/components/TrainingCertificationModal';
import { TrainingReportsModal } from '@/components/TrainingReportsModal';
import { TrainingScheduleModal } from '@/components/TrainingScheduleModal';
import { TrainingDashboardCharts } from '@/components/TrainingDashboardCharts';
import { TrainingComplianceMatrix } from '@/components/TrainingComplianceMatrix';
import { TrainingProgramDetailModal } from '@/components/TrainingProgramDetailModal';
import { RescheduleTrainingModal } from '@/components/RescheduleTrainingModal';
import { TrainingHoursExportModal } from '@/components/social/TrainingHoursExportModal';

// Import services
import { 
  getTrainingPrograms, 
  getEmployeeTrainings, 
  getTrainingMetrics,
  TrainingProgram,
  EmployeeTraining,
  deleteTrainingProgram 
} from '@/services/trainingPrograms';
import { getTrainingCategories } from '@/services/trainingCategories';

export default function GestaoTreinamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isEmployeeTrainingModalOpen, setIsEmployeeTrainingModalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Selected items
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<EmployeeTraining | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  
  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProgramForDetail, setSelectedProgramForDetail] = useState<TrainingProgram | null>(null);
  
  // Reschedule modal state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [programToReschedule, setProgramToReschedule] = useState<TrainingProgram | null>(null);
  
  // Export hours modal state
  const [isExportHoursModalOpen, setIsExportHoursModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force fresh data on component mount
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['training-programs'] });
    queryClient.invalidateQueries({ queryKey: ['employee-trainings'] });
    queryClient.invalidateQueries({ queryKey: ['training-metrics'] });
  }, [queryClient]);

  // Fetch training programs
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch training categories for dynamic filter
  const { data: categories = [] } = useQuery({
    queryKey: ['training-categories'],
    queryFn: getTrainingCategories,
  });

  // Fetch employee trainings
  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ['employee-trainings'],
    queryFn: getEmployeeTrainings,
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Fetch training metrics
  const { data: trainingMetrics } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: getTrainingMetrics,
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

  const handleViewProgram = (program: TrainingProgram) => {
    setSelectedProgramForDetail(program);
    setIsDetailModalOpen(true);
  };

  const handleRescheduleProgram = (program: TrainingProgram) => {
    setProgramToReschedule(program);
    setIsRescheduleModalOpen(true);
  };

  const handleNewEmployeeTraining = () => {
    setSelectedTraining(null);
    setIsEmployeeTrainingModalOpen(true);
  };

  const handleComplianceRegisterTraining = (employeeId: string, programId: string) => {
    // Pre-fill the training modal with employee and program
    setSelectedTraining({
      employee_id: employeeId,
      training_program_id: programId,
      status: "Inscrito",
    } as any);
    setIsEmployeeTrainingModalOpen(true);
  };

  const handleViewTraining = (training: EmployeeTraining) => {
    setSelectedTraining(training);
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
      case 'Planejado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em Andamento': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Pendente Avaliação': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Concluído': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
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
      trend: programs.filter(p => p.status === 'Em Andamento' || p.status === 'Planejado').length + ' em andamento/planejados',
      description: 'programas cadastrados',
      color: 'text-blue-600'
    },
    {
      title: 'Participantes',
      value: employeeTrainings.length,
      icon: Users,
      trend: '+' + employeeTrainings.filter(t => t.status === 'Concluído').length + ' concluídos',
      description: 'participações registradas',
      color: 'text-green-600'
    },
    {
      title: 'Taxa de Compliance',
      value: trainingMetrics?.complianceRate ? `${Math.round(trainingMetrics.complianceRate)}%` : '0%',
      icon: Target,
      trend: trainingMetrics?.expiringIn30Days ? `${trainingMetrics.expiringIn30Days} expirando` : 'Todos em dia',
      description: 'treinamentos obrigatórios',
      color: 'text-purple-600'
    },
    {
      title: 'Horas de Treinamento',
      value: trainingMetrics?.totalHoursTrained || 0,
      icon: Clock,
      trend: trainingMetrics?.averageHoursPerEmployee?.toFixed(1) + 'h/funcionário',
      description: 'horas totais ministradas',
      color: 'text-orange-600'
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
        <div className="flex gap-2">
          <Button onClick={() => setIsReportsModalOpen(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => setIsExportHoursModalOpen(true)} variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Exportar Horas
          </Button>
          <Button onClick={() => setIsScheduleModalOpen(true)} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Agendar
          </Button>
          <Button onClick={handleNewEmployeeTraining} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Registro
          </Button>
          <Button onClick={handleNewProgram}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Programa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="programas" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Programas</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
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
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.trend}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Advanced Charts */}
          {trainingMetrics && (
            <TrainingDashboardCharts
              trainingsByDepartment={trainingMetrics.trainingsByDepartment || {}}
              monthlyTrend={trainingMetrics.monthlyTrend || []}
              categoryDistribution={trainingMetrics.categoryDistribution || {}}
              statusDistribution={trainingMetrics.statusDistribution || {}}
            />
          )}

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
                  
                  {Object.keys(trainingMetrics?.categoryDistribution || {}).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">
                        Nenhum dado de categoria disponível
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <TrainingComplianceMatrix onRegisterTraining={handleComplianceRegisterTraining} />
        </TabsContent>

        <TabsContent value="programas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programas de Treinamento</CardTitle>
                  <CardDescription>
                    Gerencie os programas de treinamento disponíveis
                  </CardDescription>
                </div>
                <Button onClick={handleNewProgram}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Programa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar programas..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Pendente Avaliação">Pendente Avaliação</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredPrograms.map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        program.is_mandatory ? "bg-red-100" : "bg-blue-100"
                      )}>
                        <BookOpen className={cn(
                          "w-5 h-5",
                          program.is_mandatory ? "text-red-600" : "text-blue-600"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{program.name}</p>
                          {program.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{program.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(program.category)}>
                            {program.category}
                          </Badge>
                          <Badge className={getStatusColor(program.status || 'Ativo')}>
                            {program.status || 'Ativo'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {program.duration_hours}h de duração
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {(program.start_date || program.end_date) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {program.start_date && format(new Date(program.start_date), "dd/MM/yyyy", { locale: ptBR })}
                                {program.start_date && program.end_date && " - "}
                                {program.end_date && format(new Date(program.end_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          {program.responsible_name && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{program.responsible_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProgram(program)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRescheduleProgram(program)}
                        title="Reagendar"
                      >
                        <CalendarClock className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditProgram(program)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProgram(program.id, program.name)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredPrograms.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum programa encontrado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <TrainingCalendar events={calendarEvents} />
        </TabsContent>

        <TabsContent value="certificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificações Emitidas</CardTitle>
              <CardDescription>
                Certificados de conclusão de treinamentos
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

      <TrainingReportsModal
        open={isReportsModalOpen}
        onOpenChange={setIsReportsModalOpen}
      />

      <TrainingScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        schedule={null}
      />

      <TrainingProgramDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        program={selectedProgramForDetail}
        onEdit={() => {
          setIsDetailModalOpen(false);
          if (selectedProgramForDetail) {
            handleEditProgram(selectedProgramForDetail);
          }
        }}
        onAddParticipant={() => {
          setIsDetailModalOpen(false);
          setSelectedTraining({
            training_program_id: selectedProgramForDetail?.id,
          } as any);
          setIsEmployeeTrainingModalOpen(true);
        }}
      />

      <RescheduleTrainingModal
        open={isRescheduleModalOpen}
        onOpenChange={setIsRescheduleModalOpen}
        program={programToReschedule}
      />

      <TrainingHoursExportModal
        open={isExportHoursModalOpen}
        onOpenChange={setIsExportHoursModalOpen}
      />
    </div>
  );
}
