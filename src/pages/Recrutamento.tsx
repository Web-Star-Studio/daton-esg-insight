import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Clock,
  MapPin,
  Eye,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useJobPostings, 
  useJobApplications, 
  useInterviews, 
  useRecruitmentStats,
  useDeleteJobPosting,
  useDeleteJobApplication,
  useDeleteInterview
} from "@/hooks/useRecruitment";
import JobPostingModal from "@/components/JobPostingModal";
import JobApplicationModal from "@/components/JobApplicationModal";
import InterviewModal from "@/components/InterviewModal";
import { JobPosting, JobApplication, Interview } from "@/services/recruitment";
import { useToast } from "@/hooks/use-toast";

export default function Recrutamento() {
  const { toast } = useToast();
  const [jobPostingModalOpen, setJobPostingModalOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Real data queries
  const { data: jobPostings = [], isLoading: jobsLoading } = useJobPostings();
  const { data: jobApplications = [], isLoading: applicationsLoading } = useJobApplications();
  const { data: interviewsData = [], isLoading: interviewsLoading } = useInterviews();
  const { data: stats, isLoading: statsLoading } = useRecruitmentStats();
  
  const deleteJobMutation = useDeleteJobPosting();
  const deleteApplicationMutation = useDeleteJobApplication();
  const deleteInterviewMutation = useDeleteInterview();

  const handleDeleteJob = (job: JobPosting) => {
    if (confirm('Tem certeza que deseja excluir esta vaga?')) {
      deleteJobMutation.mutate(job.id, {
        onSuccess: () => {
          toast({
            title: "Vaga excluída",
            description: "A vaga foi removida com sucesso.",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao excluir",
            description: "Não foi possível excluir a vaga.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleDeleteApplication = (application: JobApplication) => {
    if (confirm('Tem certeza que deseja excluir esta candidatura?')) {
      deleteApplicationMutation.mutate(application.id, {
        onSuccess: () => {
          toast({
            title: "Candidatura excluída",
            description: "A candidatura foi removida com sucesso.",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao excluir",
            description: "Não foi possível excluir a candidatura.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleDeleteInterview = (interview: Interview) => {
    if (confirm('Tem certeza que deseja cancelar esta entrevista?')) {
      deleteInterviewMutation.mutate(interview.id, {
        onSuccess: () => {
          toast({
            title: "Entrevista cancelada",
            description: "A entrevista foi cancelada com sucesso.",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao cancelar",
            description: "Não foi possível cancelar a entrevista.",
            variant: "destructive",
          });
        }
      });
    }
  };

  // Filter functions
  const filteredJobPostings = jobPostings.filter(job => 
    (statusFilter === "all" || job.status.toLowerCase() === statusFilter) &&
    (searchTerm === "" || 
     job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     job.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredApplications = jobApplications.filter(app => 
    searchTerm === "" || 
    app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInterviews = interviewsData.filter(interview => 
    searchTerm === "" || 
    interview.job_application?.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsCards = [
    {
      title: "Vagas Abertas",
      value: stats?.openPositions || 0,
      description: "Posições ativas",
      icon: Briefcase,
      trend: "+2 esta semana"
    },
    {
      title: "Candidaturas",
      value: stats?.totalApplications || 0,
      description: "Total recebidas",
      icon: Users,
      trend: `+${stats?.thisMonthApplications || 0} este mês`
    },
    {
      title: "Entrevistas",
      value: stats?.upcomingInterviews || 0,
      description: "Agendadas",
      icon: Calendar,
      trend: "Próximas semanas"
    },
    {
      title: "Tempo Médio",
      value: `${stats?.averageTimeToHire || 28} dias`,
      description: "Para contratação",
      icon: Clock,
      trend: "-3 dias vs mês anterior"
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ativa": 
      case "active": 
      case "aprovado": 
      case "agendada":
      case "confirmada": return "default";
      case "pausada": 
      case "em análise": 
      case "em processo": 
      case "pendente": return "secondary";
      case "encerrada": 
      case "rejeitado": return "destructive";
      case "finalista": return "outline";
      default: return "secondary";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "alta": return "destructive";
      case "média": return "secondary";
      case "baixa": return "outline";
      default: return "secondary";
    }
  };

  if (jobsLoading || applicationsLoading || interviewsLoading || statsLoading) {
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
          <h1 className="text-3xl font-bold">Recrutamento e Seleção</h1>
          <p className="text-muted-foreground">
            Gestão completa do processo de recrutamento e seleção
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
            <Button onClick={() => setJobPostingModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="jobs">Vagas</TabsTrigger>
          <TabsTrigger value="candidates">Candidatos</TabsTrigger>
          <TabsTrigger value="interviews">Entrevistas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
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

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vagas Ativas</CardTitle>
                <CardDescription>Posições em recrutamento ativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobPostings.filter(job => job.status === 'Ativa').slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.department} • {jobApplications.filter(app => app.job_posting_id === job.id).length} candidaturas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(job.priority || "média")}>
                          {job.priority}
                        </Badge>
                        <Badge variant={getStatusVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {jobPostings.filter(job => job.status === 'Ativa').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma vaga ativa encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas Entrevistas</CardTitle>
                <CardDescription>Entrevistas agendadas para esta semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewsData.slice(0, 3).map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {typeof interview.job_application === 'object' && interview.job_application?.candidate_name || 'Candidato'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {typeof interview.job_application === 'object' && interview.job_application?.job_posting?.title || 'Vaga'} • {interview.interview_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interview.scheduled_date).toLocaleDateString('pt-BR')} às {interview.scheduled_time}
                        </p>
                      </div>
                        <Badge variant={getStatusVariant(interview.status)}>
                          {interview.status}
                        </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Vagas</CardTitle>
                  <CardDescription>Gerencie suas vagas abertas e processo seletivo</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar vagas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="encerrada">Encerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setJobPostingModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Vaga
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJobPostings.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {job.department}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location || "Não informado"}
                          </span>
                          <span>{job.employment_type} • {job.level}</span>
                        </div>
                        {job.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(job.priority || "média")}>
                          {job.priority}
                        </Badge>
                        <Badge variant={getStatusVariant(job.status)}>
                          {job.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingJob(job)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteJob(job)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {jobApplications.filter(app => app.job_posting_id === job.id).length} candidaturas
                          </span>
                          <span>Publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedJobForApplications(job.id);
                            setApplicationModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Candidatura
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedJobForApplications(job.id);
                            // Here you could navigate to a candidates view filtered by this job
                          }}
                        >
                          Ver Candidatos ({jobApplications.filter(app => app.job_posting_id === job.id).length})
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredJobPostings.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma vaga encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {jobPostings.length === 0 
                        ? "Crie sua primeira vaga para começar o processo de recrutamento."
                        : "Tente ajustar os filtros para encontrar outras vagas."
                      }
                    </p>
                    <Button onClick={() => setJobPostingModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Vaga
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Banco de Candidatos</CardTitle>
                  <CardDescription>Gerencie candidatos e acompanhe o processo seletivo</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar candidatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => setApplicationModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Candidatura
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {application.candidate_name?.split(' ').map(n => n[0]).join('') || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{application.candidate_name || 'Nome não informado'}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Vaga: {jobPostings.find(job => job.id === application.job_posting_id)?.title || 'Vaga não encontrada'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {application.candidate_email || 'Email não informado'}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {application.candidate_phone || 'Telefone não informado'}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {application.candidate_location || 'Localização não informada'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="font-medium">Experiência:</span> {application.experience_years ? `${application.experience_years} anos` : 'Não informado'} • 
                              <span className="font-medium ml-2">Etapa:</span> {application.current_stage || 'Análise inicial'}
                            </p>
                            {application.score && (
                              <div className="flex items-center mt-1">
                                <span className="text-sm font-medium mr-2">Score:</span>
                                <Progress value={application.score} className="w-20 h-2" />
                                <span className="text-sm ml-2">{application.score}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(application.status)}>
                          {application.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingApplication(application)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // Create interview for this application
                              setEditingInterview({
                                id: '',
                                company_id: '',
                                job_application_id: application.id,
                                interviewer_user_id: '',
                                interview_type: 'RH',
                                scheduled_date: '',
                                scheduled_time: '',
                                duration_minutes: 60,
                                location_type: 'Presencial',
                                meeting_link: '',
                                notes: '',
                                feedback: '',
                                score: null,
                                status: 'Agendada',
                                created_by_user_id: '',
                                created_at: '',
                                updated_at: ''
                              });
                              setInterviewModalOpen(true);
                            }}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar Entrevista
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteApplication(application)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma candidatura encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {jobApplications.length === 0 
                        ? "Ainda não há candidaturas. Elas aparecerão aqui conforme forem recebidas."
                        : "Tente ajustar o termo de busca para encontrar outras candidaturas."
                      }
                    </p>
                    <Button onClick={() => setApplicationModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Candidatura
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Agenda de Entrevistas</CardTitle>
                  <CardDescription>Gerencie e acompanhe suas entrevistas</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar entrevistas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => setInterviewModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Entrevista
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <div key={interview.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {interview.job_application?.candidate_name || 'Candidato não informado'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {interview.job_application?.job_posting?.title || 'Vaga não informada'} • {interview.interview_type}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(interview.scheduled_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {interview.scheduled_time} ({interview.duration_minutes}min)
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {interview.location_type}
                          </span>
                        </div>
                        {interview.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            <strong>Observações:</strong> {interview.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(interview.status)}>
                          {interview.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingInterview(interview)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteInterview(interview)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredInterviews.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma entrevista encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {interviewsData.length === 0 
                        ? "Ainda não há entrevistas agendadas. Comece agendando uma entrevista."
                        : "Tente ajustar o termo de busca para encontrar outras entrevistas."
                      }
                    </p>
                    <Button onClick={() => setInterviewModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar Entrevista
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Recrutamento</CardTitle>
              <CardDescription>Acompanhe o progresso dos candidatos no funil de seleção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Pipeline Visual</h3>
                <p className="text-muted-foreground mb-4">
                  Visualize o progresso dos candidatos através das etapas do processo seletivo.
                </p>
                <Button>Configurar Pipeline</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Modals */}
      <JobPostingModal
        isOpen={jobPostingModalOpen || editingJob !== null}
        onClose={() => {
          setJobPostingModalOpen(false);
          setEditingJob(null);
        }}
        jobPosting={editingJob || undefined}
      />

      <JobApplicationModal
        isOpen={applicationModalOpen || editingApplication !== null}
        onClose={() => {
          setApplicationModalOpen(false);
          setEditingApplication(null);
        }}
        jobApplication={editingApplication || undefined}
        preselectedJobId={selectedJobForApplications || undefined}
      />

      <InterviewModal
        isOpen={interviewModalOpen || editingInterview !== null}
        onClose={() => {
          setInterviewModalOpen(false);
          setEditingInterview(null);
        }}
        interview={editingInterview || undefined}
      />
    </div>
  );
}