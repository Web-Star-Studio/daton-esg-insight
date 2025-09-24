import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Phone
} from "lucide-react";
import { getEmployeesStats } from "@/services/employees";

export default function Recrutamento() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");

  const { data: employeeStats, isLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
  });

  // Mock data for recruitment
  const recruitmentStats = {
    openPositions: 8,
    totalApplications: 145,
    interviewsScheduled: 23,
    hiredThisMonth: 5,
    averageTimeToHire: 28
  };

  const jobOpenings = [
    {
      id: 1,
      title: "Desenvolvedor Full Stack",
      department: "Tecnologia",
      location: "São Paulo, SP",
      type: "CLT",
      level: "Pleno",
      applications: 34,
      status: "Ativa",
      postedDate: "2024-01-15",
      priority: "Alta"
    },
    {
      id: 2,
      title: "Analista de Marketing",
      department: "Marketing",
      location: "Remote",
      type: "CLT",
      level: "Júnior",
      applications: 28,
      status: "Ativa",
      postedDate: "2024-01-20",
      priority: "Média"
    },
    {
      id: 3,
      title: "Gerente de Vendas",
      department: "Comercial",
      location: "Rio de Janeiro, RJ",
      type: "CLT",
      level: "Sênior",
      applications: 15,
      status: "Pausada",
      postedDate: "2024-01-10",
      priority: "Alta"
    },
    {
      id: 4,
      title: "Designer UX/UI",
      department: "Design",
      location: "São Paulo, SP",
      type: "PJ",
      level: "Pleno",
      applications: 42,
      status: "Ativa",
      postedDate: "2024-01-25",
      priority: "Média"
    }
  ];

  const candidates = [
    {
      id: 1,
      name: "Ana Silva",
      email: "ana.silva@email.com",
      phone: "(11) 99999-1234",
      position: "Desenvolvedor Full Stack",
      stage: "Entrevista Técnica",
      score: 85,
      experience: "3 anos",
      location: "São Paulo, SP",
      status: "Em Processo"
    },
    {
      id: 2,
      name: "Carlos Santos",
      email: "carlos.santos@email.com",
      phone: "(11) 99999-5678",
      position: "Analista de Marketing",
      stage: "Análise Curricular",
      score: 78,
      experience: "2 anos",
      location: "Remote",
      status: "Em Análise"
    },
    {
      id: 3,
      name: "Mariana Costa",
      email: "mariana.costa@email.com",
      phone: "(21) 99999-9012",
      position: "Designer UX/UI",
      stage: "Entrevista RH",
      score: 92,
      experience: "4 anos",
      location: "Rio de Janeiro, RJ",
      status: "Aprovado"
    },
    {
      id: 4,
      name: "Pedro Oliveira",
      email: "pedro.oliveira@email.com",
      phone: "(11) 99999-3456",
      position: "Gerente de Vendas",
      stage: "Proposta Enviada",
      score: 88,
      experience: "6 anos",
      location: "São Paulo, SP",
      status: "Finalista"
    }
  ];

  const interviews = [
    {
      id: 1,
      candidate: "Ana Silva",
      position: "Desenvolvedor Full Stack",
      interviewer: "João Mendes",
      type: "Técnica",
      date: "2024-02-01",
      time: "14:00",
      status: "Agendada"
    },
    {
      id: 2,
      candidate: "Carlos Santos",
      position: "Analista de Marketing",
      interviewer: "Maria Ferreira",
      type: "RH",
      date: "2024-02-01",
      time: "10:00",
      status: "Confirmada"
    },
    {
      id: 3,
      candidate: "Mariana Costa",
      position: "Designer UX/UI",
      interviewer: "Roberto Lima",
      type: "Portfolio",
      date: "2024-02-02",
      time: "16:00",
      status: "Pendente"
    }
  ];

  const statsCards = [
    {
      title: "Vagas Abertas",
      value: recruitmentStats.openPositions,
      description: "Posições ativas",
      icon: Briefcase,
      trend: "+2 esta semana"
    },
    {
      title: "Candidaturas",
      value: recruitmentStats.totalApplications,
      description: "Total recebidas",
      icon: Users,
      trend: "+12 hoje"
    },
    {
      title: "Entrevistas",
      value: recruitmentStats.interviewsScheduled,
      description: "Agendadas",
      icon: Calendar,
      trend: "5 esta semana"
    },
    {
      title: "Tempo Médio",
      value: `${recruitmentStats.averageTimeToHire} dias`,
      description: "Para contratação",
      icon: Clock,
      trend: "-3 dias vs mês anterior"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativa": return "bg-green-100 text-green-800";
      case "Pausada": return "bg-yellow-100 text-yellow-800";
      case "Encerrada": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "bg-red-100 text-red-800";
      case "Média": return "bg-yellow-100 text-yellow-800";
      case "Baixa": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCandidateStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado": return "bg-green-100 text-green-800";
      case "Rejeitado": return "bg-red-100 text-red-800";
      case "Em Processo": return "bg-blue-100 text-blue-800";
      case "Em Análise": return "bg-yellow-100 text-yellow-800";
      case "Finalista": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
          <Button>
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
                  {jobOpenings.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.department} • {job.applications} candidaturas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{interview.candidate}</p>
                        <p className="text-sm text-muted-foreground">
                          {interview.position} • {interview.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {interview.date} às {interview.time} - {interview.interviewer}
                        </p>
                      </div>
                      <Badge variant={interview.status === "Confirmada" ? "default" : "secondary"}>
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
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Vaga
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobOpenings.map((job) => (
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
                            {job.location}
                          </span>
                          <span>{job.type} • {job.level}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {job.applications} candidaturas
                        </span>
                        <span>Publicada em {new Date(job.postedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button size="sm">
                          Ver Candidatos
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Candidato para {candidate.position}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {candidate.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {candidate.phone}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {candidate.location}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="font-medium">Experiência:</span> {candidate.experience} • 
                              <span className="font-medium ml-2">Etapa:</span> {candidate.stage}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm font-medium mr-2">Score:</span>
                              <Progress value={candidate.score} className="w-20 h-2" />
                              <span className="text-sm ml-2">{candidate.score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCandidateStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Entrevistas</CardTitle>
              <CardDescription>Gerencie e acompanhe suas entrevistas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Agenda de Entrevistas</h3>
                <p className="text-muted-foreground mb-4">
                  Visualize e gerencie todas as entrevistas agendadas.
                </p>
                <Button>Agendar Entrevista</Button>
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
    </div>
  );
}