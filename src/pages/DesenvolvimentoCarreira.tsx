import { useState } from "react";
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
  UserPlus,
  Eye,
  Edit,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [isNewPDIModalOpen, setIsNewPDIModalOpen] = useState(false);
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CareerDevelopmentPlan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompetencyMatrixModalOpen, setIsCompetencyMatrixModalOpen] = useState(false);

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
    toast.info(`Abrindo editor do PDI de ${plan.employee?.full_name}`);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Desenvolvimento de Carreira</h1>
          <p className="text-muted-foreground mt-2">
            Planejamento de carreiras, sucessão e crescimento profissional
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCompetencyMatrixModalOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Matriz de Competências
          </Button>
          <Button variant="outline" onClick={() => setIsMentorshipModalOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Mentoria
          </Button>
          <Button onClick={() => setIsNewPDIModalOpen(true)}>
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
                            Meta: {format(new Date(plan.target_date), "dd/MM/yyyy", { locale: ptBR })}
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
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Planejamento de Sucessão</h3>
            <p className="text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </TabsContent>

        <TabsContent value="vagas" className="space-y-6">
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Vagas Internas</h3>
            <p className="text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento
            </p>
          </div>
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
        onClose={() => setIsNewPDIModalOpen(false)}
        onSuccess={() => {
          setIsNewPDIModalOpen(false);
          toast.success("PDI criado com sucesso!");
        }}
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
    </div>
  );
}