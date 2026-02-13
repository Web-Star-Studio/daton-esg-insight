import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  UserPlus,
  Eye,
  Edit,
  MessageSquare
} from "lucide-react";
import { formatDateDisplay } from "@/utils/dateUtils";
import { toast } from "sonner";
import { 
  useCareerStatistics,
  useCareerDevelopmentPlans,
  useSuccessionPlans,
  useInternalJobPostings,
  useMentoringRelationships,
  type CareerDevelopmentPlan
} from "@/services/careerDevelopment";
import { PDIFormModal } from "@/components/PDIFormModal";
import { PDIDetailsModal } from "@/components/PDIDetailsModal";
import { MentorshipProgramModal } from "@/components/MentorshipProgramModal";
import { CompetencyMatrixModal } from "@/components/CompetencyMatrixModal";
import { SuccessionPlanModal } from "@/components/SuccessionPlanModal";
import { SuccessionCandidateModal } from "@/components/SuccessionCandidateModal";
import { InternalJobPostingModal } from "@/components/InternalJobPostingModal";
import { InternalJobDetailsModal } from "@/components/InternalJobDetailsModal";
import { InternalJobApplicationModal } from "@/components/InternalJobApplicationModal";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isNewPDIModalOpen, setIsNewPDIModalOpen] = useState(false);
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CareerDevelopmentPlan | null>(null);
  const [editingPDI, setEditingPDI] = useState<CareerDevelopmentPlan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompetencyMatrixModalOpen, setIsCompetencyMatrixModalOpen] = useState(false);
  const [isNewSuccessionPlanOpen, setIsNewSuccessionPlanOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [selectedSuccessionPlan, setSelectedSuccessionPlan] = useState<any>(null);
  
  // Internal Job Postings states
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [jobFilterDepartment, setJobFilterDepartment] = useState("all");
  const [jobFilterStatus, setJobFilterStatus] = useState("all");
  
  const handlePDISuccess = () => {
    setActiveTab("pdi");
  };

  const { data: careerStats, isLoading: statsLoading } = useCareerStatistics();
  const { data: careerPlans, isLoading: plansLoading } = useCareerDevelopmentPlans();
  const { data: successionPlans } = useSuccessionPlans();
  const { data: internalJobs } = useInternalJobPostings();
  const { data: mentoringRelationships } = useMentoringRelationships();

  const handleViewDetails = (plan: CareerDevelopmentPlan) => {
    setSelectedPlan(plan);
    setIsDetailsModalOpen(true);
  };

  const handleScheduleMeeting = (plan: CareerDevelopmentPlan) => {
    const mentorName = plan.mentor?.full_name || "mentor";
    toast.success(`Reunião 1:1 agendada com ${mentorName} para discutir o PDI de ${plan.employee?.full_name}`);
  };

  const handleEditPDI = (plan: CareerDevelopmentPlan) => {
    setIsDetailsModalOpen(false); // Fechar modal de detalhes
    setEditingPDI(plan);
    setIsNewPDIModalOpen(true);
  };

  const filteredPlans = careerPlans?.filter(plan => {
    const matchesSearch = plan.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.employee?.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || plan.employee?.department === filterDepartment;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Desenvolvimento de Carreira</h1>
          <p className="text-muted-foreground mt-2">
            Planejamento de carreiras, sucessão e crescimento profissional
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsCompetencyMatrixModalOpen(true)} className="flex-1 sm:flex-none">
            <BookOpen className="w-4 h-4 mr-2" />
            Matriz de Competências
          </Button>
          <Button variant="outline" onClick={() => setIsMentorshipModalOpen(true)} className="flex-1 sm:flex-none">
            <MessageSquare className="w-4 h-4 mr-2" />
            Mentoria
          </Button>
          <Button onClick={() => setIsNewPDIModalOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            Novo PDI
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="dashboard" className="min-w-fit">Dashboard</TabsTrigger>
          <TabsTrigger value="pdi" className="min-w-fit">PDIs</TabsTrigger>
          <TabsTrigger value="sucessao" className="min-w-fit">Sucessão</TabsTrigger>
          <TabsTrigger value="vagas" className="min-w-fit">Vagas Internas</TabsTrigger>
          <TabsTrigger value="mentoria" className="min-w-fit">Mentoria</TabsTrigger>
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
          </div>

          {/* Career Plans List */}
          <Card>
            <CardHeader>
              <CardTitle>Planos de Desenvolvimento Individual (PDI)</CardTitle>
              <CardDescription>Acompanhamento dos planos de carreira dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPlans?.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum PDI encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando planos de desenvolvimento para os funcionários
                    </p>
                    <Button onClick={() => setIsNewPDIModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro PDI
                    </Button>
                  </div>
                ) : (
                  filteredPlans?.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{plan.employee?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{plan.employee?.employee_code} • {plan.employee?.department}</p>
                            <p className="text-sm">
                              <span className="font-medium">De:</span> {plan.current_position} → 
                              <span className="font-medium"> Para:</span> {plan.target_position}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusColor(plan.status)}>{plan.status}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Meta: {formatDateDisplay(plan.target_date)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Progresso</span>
                            <span className="text-sm font-medium">{plan.progress_percentage}%</span>
                          </div>
                          <Progress value={plan.progress_percentage} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Mentor: {plan.mentor?.full_name || "Não definido"}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(plan)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sucessao" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Planejamento de Sucessão</h3>
              <p className="text-sm text-muted-foreground">
                Identificação e preparação de sucessores para posições críticas
              </p>
            </div>
            <Button onClick={() => setIsNewSuccessionPlanOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano de Sucessão
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Posições Críticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successionPlans?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Planos ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Candidatos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {successionPlans?.reduce((acc, plan) => acc + (plan.candidates?.length || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Em desenvolvimento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Prontidão Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const allCandidates = successionPlans?.flatMap(p => p.candidates || []) || [];
                    const avgScore = allCandidates.length > 0
                      ? Math.round(
                          allCandidates.reduce((acc, c) => acc + (c.readiness_score || 0), 0) /
                            allCandidates.length
                        )
                      : 0;
                    return `${avgScore}%`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score geral
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Succession Plans List */}
          {successionPlans && successionPlans.length > 0 ? (
            <div className="space-y-4">
              {successionPlans.map((plan) => {
                const getReadinessColor = (level: string) => {
                  switch (level) {
                    case "Pronto Agora":
                      return "default";
                    case "1-2 Anos":
                      return "secondary";
                    case "3+ Anos":
                      return "outline";
                    default:
                      return "outline";
                  }
                };

                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {plan.position_title}
                            <Badge variant={getCriticalColor(plan.critical_level)}>
                              {plan.critical_level}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {plan.department}
                            {plan.current_holder && (
                              <span className="ml-2">
                                • Atual: {plan.current_holder.full_name}
                              </span>
                            )}
                          </CardDescription>
                          {plan.expected_retirement_date && (
                            <p className="text-xs text-muted-foreground">
                              Desocupação prevista: {new Date(plan.expected_retirement_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Candidates List */}
                      {plan.candidates && plan.candidates.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Candidatos à Sucessão</h4>
                          <div className="space-y-3">
                            {plan.candidates.map((candidate: any) => (
                              <div
                                key={candidate.id}
                                className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {candidate.employee?.full_name
                                      ?.split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm">
                                      {candidate.employee?.full_name}
                                    </p>
                                    <Badge variant={getReadinessColor(candidate.readiness_level)} className="text-xs">
                                      {candidate.readiness_level}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {candidate.employee?.position}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Prontidão</span>
                                      <span className="font-medium">{candidate.readiness_score}%</span>
                                    </div>
                                    <Progress value={candidate.readiness_score} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum candidato identificado</p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedSuccessionPlan(plan);
                          setIsAddCandidateOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Candidato
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum plano de sucessão</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Crie planos de sucessão para identificar e preparar candidatos para posições críticas
                </p>
                <Button onClick={() => setIsNewSuccessionPlanOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vagas" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Vagas Internas</h3>
              <p className="text-sm text-muted-foreground">
                Oportunidades de crescimento e mobilidade interna
              </p>
            </div>
            <Button onClick={() => setIsNewJobModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga Interna
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {internalJobs?.filter(j => j.status === "Aberto").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Vagas Abertas</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{internalJobs?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total de Vagas</p>
                  </div>
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {internalJobs?.filter(j => j.status === "Preenchido").length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Vagas Preenchidas</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar por título ou departamento..."
              value={jobSearchTerm}
              onChange={(e) => setJobSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={jobFilterDepartment} onValueChange={setJobFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Operações">Operações</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobFilterStatus} onValueChange={setJobFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Fechado">Fechado</SelectItem>
                <SelectItem value="Preenchido">Preenchido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Postings Grid */}
          {internalJobs?.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
                                 job.department.toLowerCase().includes(jobSearchTerm.toLowerCase());
            const matchesDepartment = jobFilterDepartment === "all" || job.department === jobFilterDepartment;
            const matchesStatus = jobFilterStatus === "all" || job.status === jobFilterStatus;
            
            return matchesSearch && matchesDepartment && matchesStatus;
          }).length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {jobSearchTerm || jobFilterDepartment !== "all" || jobFilterStatus !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando vagas internas para mobilidade de funcionários"}
              </p>
              {!jobSearchTerm && jobFilterDepartment === "all" && jobFilterStatus === "all" && (
                <Button onClick={() => setIsNewJobModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Vaga
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {internalJobs
                ?.filter(job => {
                  const matchesSearch = job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
                                       job.department.toLowerCase().includes(jobSearchTerm.toLowerCase());
                  const matchesDepartment = jobFilterDepartment === "all" || job.department === jobFilterDepartment;
                  const matchesStatus = jobFilterStatus === "all" || job.status === jobFilterStatus;
                  
                  return matchesSearch && matchesDepartment && matchesStatus;
                })
                .map((job) => {
                  const isDeadlinePassed = new Date(job.application_deadline) < new Date();
                  
                  return (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                        </div>
                        <CardDescription>{job.department}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {job.level && <Badge variant="outline">{job.level}</Badge>}
                          {job.employment_type && <Badge variant="outline">{job.employment_type}</Badge>}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Prazo: {formatDateDisplay(job.application_deadline)}
                          </span>
                        </div>
                        
                        {isDeadlinePassed && (
                          <Badge variant="secondary" className="text-xs">
                            Prazo encerrado
                          </Badge>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedJob(job);
                              setIsJobDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                          {job.status === "Aberto" && !isDeadlinePassed && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedJob(job);
                                setIsApplyModalOpen(true);
                              }}
                            >
                              Candidatar-se
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentoria" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Programa de Mentoria</h3>
              <p className="text-muted-foreground">Relacionamentos mentor-mentorado e acompanhamento</p>
            </div>
            <Button onClick={() => setIsMentorshipModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Mentoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{mentoringRelationships?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Relacionamentos Ativos</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {mentoringRelationships?.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma mentoria ativa</h3>
                <p className="text-muted-foreground mb-4">
                  Crie relacionamentos de mentoria para acelerar o desenvolvimento
                </p>
                <Button onClick={() => setIsMentorshipModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Iniciar Primeira Mentoria
                </Button>
              </div>
            ) : (
              mentoringRelationships?.map((relationship) => (
                <Card key={relationship.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{relationship.program_name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Mentor: {relationship.mentor?.full_name}</span>
                          <span>Mentorado: {relationship.mentee?.full_name}</span>
                        </div>
                      </div>
                      <Badge variant={relationship.status === 'Ativo' ? 'default' : 'secondary'}>
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PDIFormModal
        isOpen={isNewPDIModalOpen}
        onClose={() => {
          setIsNewPDIModalOpen(false);
          setEditingPDI(null);
        }}
        onSuccess={handlePDISuccess}
        plan={editingPDI}
      />

      <PDIDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        plan={selectedPlan}
        onEdit={handleEditPDI}
      />

      <MentorshipProgramModal
        isOpen={isMentorshipModalOpen}
        onClose={() => setIsMentorshipModalOpen(false)}
      />

      <CompetencyMatrixModal
        open={isCompetencyMatrixModalOpen}
        onOpenChange={setIsCompetencyMatrixModalOpen}
      />

      <SuccessionPlanModal
        isOpen={isNewSuccessionPlanOpen}
        onClose={() => setIsNewSuccessionPlanOpen(false)}
        onSuccess={() => {
          // Plans will be automatically refetched via query invalidation
        }}
      />

      <SuccessionCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => {
          setIsAddCandidateOpen(false);
          setSelectedSuccessionPlan(null);
        }}
        successionPlanId={selectedSuccessionPlan?.id || ""}
        existingCandidateIds={selectedSuccessionPlan?.candidates?.map((c: any) => c.employee_id) || []}
        onSuccess={() => {
          // Candidates will be automatically refetched via query invalidation
        }}
      />

      <InternalJobPostingModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
      />

      <InternalJobDetailsModal
        isOpen={isJobDetailsModalOpen}
        onClose={() => {
          setIsJobDetailsModalOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        onApply={() => {
          setIsJobDetailsModalOpen(false);
          setIsApplyModalOpen(true);
        }}
        hasApplied={false}
      />

      <InternalJobApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        employeeId="mock-employee-id"
        onSuccess={() => {
          setIsJobDetailsModalOpen(false);
          setSelectedJob(null);
        }}
      />
    </div>
  );
}