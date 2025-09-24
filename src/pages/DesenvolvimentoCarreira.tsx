import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  BookOpen, 
  ArrowUp, 
  User, 
  Star, 
  Briefcase, 
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock functions - replace with actual API calls
const getCareerStats = async () => {
  return {
    totalEmployees: 247,
    activeIDPs: 145,
    promotionsThisYear: 23,
    skillGapsCovered: 78,
    mentorshipPairs: 34,
    successionsPlanned: 12,
    internalMobility: 15,
    careerSatisfaction: 4.2
  };
};

const getCareerPlans = async () => {
  return [
    {
      id: "1",
      employeeName: "Ana Silva",
      employeeCode: "EMP001",
      currentPosition: "Analista de RH Jr.",
      targetPosition: "Analista de RH Pleno",
      department: "Recursos Humanos",
      startDate: "2024-01-15",
      targetDate: "2024-12-15",
      progress: 65,
      status: "Em Andamento",
      mentor: "Carlos Santos",
      skills: ["Recrutamento", "Treinamento", "Análise de Dados"]
    },
    {
      id: "2",
      employeeName: "João Oliveira",
      employeeCode: "EMP002",
      currentPosition: "Desenvolvedor Jr.",
      targetPosition: "Desenvolvedor Sênior",
      department: "TI",
      startDate: "2024-02-01",
      targetDate: "2025-01-31",
      progress: 40,
      status: "Em Andamento",
      mentor: "Maria Costa",
      skills: ["React", "Node.js", "Liderança Técnica"]
    }
  ];
};

const getSuccessionPlans = async () => {
  return [
    {
      id: "1",
      position: "Gerente de RH",
      currentHolder: "Carlos Santos",
      successors: [
        { name: "Ana Silva", readiness: "Pronto em 6 meses", score: 85 },
        { name: "Mariana Costa", readiness: "Pronto em 12 meses", score: 75 }
      ],
      department: "Recursos Humanos",
      criticalLevel: "Alto",
      retirementDate: "2025-06-01"
    },
    {
      id: "2",
      position: "Líder Técnico",
      currentHolder: "Maria Costa",
      successors: [
        { name: "João Oliveira", readiness: "Pronto em 9 meses", score: 80 },
        { name: "Pedro Silva", readiness: "Pronto em 18 meses", score: 70 }
      ],
      department: "TI",
      criticalLevel: "Médio",
      retirementDate: "2026-12-01"
    }
  ];
};

const getInternalJobs = async () => {
  return [
    {
      id: "1",
      title: "Analista de RH Pleno",
      department: "Recursos Humanos",
      location: "São Paulo - SP",
      type: "Efetivo",
      level: "Pleno",
      applications: 8,
      deadline: "2024-02-15",
      status: "Aberto",
      requirements: ["Superior completo", "2+ anos de experiência", "Excel Avançado"]
    },
    {
      id: "2",
      title: "Coordenador de Vendas",
      department: "Comercial",
      location: "Rio de Janeiro - RJ",
      type: "Efetivo",
      level: "Coordenação",
      applications: 12,
      deadline: "2024-02-20",
      status: "Aberto",
      requirements: ["Superior completo", "5+ anos em vendas", "Liderança de equipes"]
    }
  ];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Em Andamento":
      return "default";
    case "Concluído":
      return "default";
    case "Pausado":
      return "secondary";
    case "Cancelado":
      return "destructive";
    case "Aberto":
      return "default";
    case "Fechado":
      return "secondary";
    default:
      return "outline";
  }
};

const getCriticalColor = (level: string) => {
  switch (level) {
    case "Alto":
      return "destructive";
    case "Médio":
      return "secondary";
    case "Baixo":
      return "default";
    default:
      return "outline";
  }
};

export default function DesenvolvimentoCarreira() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: careerStats, isLoading: statsLoading } = useQuery({
    queryKey: ["careerStats"],
    queryFn: getCareerStats,
  });

  const { data: careerPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["careerPlans"],
    queryFn: getCareerPlans,
  });

  const { data: successionPlans, isLoading: successionLoading } = useQuery({
    queryKey: ["successionPlans"],
    queryFn: getSuccessionPlans,
  });

  const { data: internalJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["internalJobs"],
    queryFn: getInternalJobs,
  });

  const filteredPlans = careerPlans?.filter(plan => {
    const matchesSearch = plan.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || plan.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-6">
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

  const statsCards = [
    {
      title: "PDIs Ativos",
      value: `${careerStats?.activeIDPs}/${careerStats?.totalEmployees}`,
      description: "Planos de Desenvolvimento",
      icon: Target,
      trend: `${Math.round((careerStats?.activeIDPs || 0) / (careerStats?.totalEmployees || 1) * 100)}% dos funcionários`
    },
    {
      title: "Promoções",
      value: careerStats?.promotionsThisYear?.toString() || "0",
      description: "Este ano",
      icon: TrendingUp,
      trend: "+12% em relação ao ano passado"
    },
    {
      title: "Gaps de Competência",
      value: `${careerStats?.skillGapsCovered}%`,
      description: "Cobertos por treinamento",
      icon: Award,
      trend: "Meta: 85% até dezembro"
    },
    {
      title: "Satisfação Carreira",
      value: `${careerStats?.careerSatisfaction}/5.0`,
      description: "Pesquisa interna",
      icon: Star,
      trend: "+0.3 em relação ao ano passado"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Desenvolvimento de Carreira</h1>
          <p className="text-muted-foreground mt-2">
            Planejamento de carreiras, sucessão e crescimento profissional
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Matriz de Competências
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo PDI
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pdi">PDIs</TabsTrigger>
          <TabsTrigger value="sucessao">Sucessão</TabsTrigger>
          <TabsTrigger value="vagas">Vagas Internas</TabsTrigger>
          <TabsTrigger value="mentoria">Mentoria</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  <p className="text-xs text-primary mt-2">{card.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Career Development Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" />
                  Mobilidade Interna
                </CardTitle>
                <CardDescription>Movimentação de funcionários por departamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Recursos Humanos</span>
                      <span className="text-sm font-medium">5 movimentações</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Tecnologia</span>
                      <span className="text-sm font-medium">8 movimentações</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Vendas</span>
                      <span className="text-sm font-medium">3 movimentações</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Financeiro</span>
                      <span className="text-sm font-medium">2 movimentações</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Competências em Desenvolvimento
                </CardTitle>
                <CardDescription>Top 5 habilidades mais desenvolvidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Liderança</span>
                    <Badge variant="default">34 funcionários</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Comunicação</span>
                    <Badge variant="default">28 funcionários</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Análise de Dados</span>
                    <Badge variant="default">22 funcionários</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gestão de Projetos</span>
                    <Badge variant="default">19 funcionários</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Negociação</span>
                    <Badge variant="default">16 funcionários</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pdi" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar por funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Career Plans List */}
          <Card>
            <CardHeader>
              <CardTitle>Planos de Desenvolvimento Individual (PDI)</CardTitle>
              <CardDescription>Acompanhamento dos planos de carreira dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPlans?.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{plan.employeeName}</h3>
                          <p className="text-sm text-muted-foreground">{plan.employeeCode} • {plan.department}</p>
                          <p className="text-sm">
                            <span className="font-medium">De:</span> {plan.currentPosition} → 
                            <span className="font-medium"> Para:</span> {plan.targetPosition}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusColor(plan.status)}>{plan.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Meta: {format(new Date(plan.targetDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Progresso do PDI</span>
                          <span className="text-sm">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium">Competências em foco:</span>
                        {plan.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          <span className="font-medium">Mentor:</span> {plan.mentor}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-1" />
                            Agendar 1:1
                          </Button>
                          <Button size="sm" variant="outline">
                            Editar PDI
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sucessao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planejamento de Sucessão</CardTitle>
              <CardDescription>Identificação e preparação de sucessores para posições-chave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {successionPlans?.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.position}</h3>
                        <p className="text-sm text-muted-foreground">
                          {plan.department} • Atual: {plan.currentHolder}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aposentadoria prevista: {format(new Date(plan.retirementDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={getCriticalColor(plan.criticalLevel)}>
                        Criticidade {plan.criticalLevel}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Sucessores Identificados:</h4>
                      {plan.successors.map((successor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{successor.name}</p>
                              <p className="text-sm text-muted-foreground">{successor.readiness}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{successor.score}%</span>
                              <div className="w-16">
                                <Progress value={successor.score} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vagas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vagas Internas</CardTitle>
              <CardDescription>Oportunidades de mobilidade interna</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {internalJobs?.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.department} • {job.location} • {job.type}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                        <Badge variant="outline">{job.level}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Requisitos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            <UserPlus className="w-4 h-4 inline mr-1" />
                            {job.applications} candidatos
                          </span>
                          <span className="text-sm">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Prazo: {format(new Date(job.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <Button size="sm">Ver Candidatos</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentoria" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Programa de Mentoria</CardTitle>
              <CardDescription>Pareamento mentor-mentorado e acompanhamento</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Programa de Mentoria</h3>
                <p className="text-muted-foreground mb-4">Gerencie pareamentos e acompanhe o progresso das mentorias</p>
                <Button>Gerenciar Mentorias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}