import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Clock, Users, TrendingUp, CheckCircle, XCircle, AlertTriangle, Calendar, Timer, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock functions - replace with actual API calls
const getAttendanceStats = async () => {
  return {
    totalEmployees: 247,
    presentToday: 231,
    absentToday: 8,
    lateToday: 8,
    averageHoursWorked: 8.2,
    overtimeHours: 124,
    leaveRequests: 12,
    pendingApprovals: 5
  };
};

const getAttendanceRecords = async () => {
  return [
    {
      id: "1",
      employeeName: "Ana Silva",
      employeeCode: "EMP001",
      department: "Recursos Humanos",
      checkIn: "08:00",
      checkOut: "17:30",
      totalHours: "9h 30m",
      status: "Presente",
      overtime: "1h 30m",
      date: "2024-01-15"
    },
    {
      id: "2",
      employeeName: "Carlos Santos",
      employeeCode: "EMP002",
      department: "TI",
      checkIn: "08:15",
      checkOut: "17:45",
      totalHours: "9h 30m",
      status: "Atraso",
      overtime: "1h 45m",
      date: "2024-01-15"
    },
    {
      id: "3",
      employeeName: "Mariana Costa",
      employeeCode: "EMP003",
      department: "Vendas",
      checkIn: "-",
      checkOut: "-",
      totalHours: "0h",
      status: "Ausente",
      overtime: "0h",
      date: "2024-01-15"
    }
  ];
};

const getLeaveRequests = async () => {
  return [
    {
      id: "1",
      employeeName: "João Oliveira",
      type: "Férias",
      startDate: "2024-01-20",
      endDate: "2024-01-30",
      days: 10,
      status: "Pendente",
      reason: "Férias anuais"
    },
    {
      id: "2",
      employeeName: "Maria Santos",
      type: "Licença Médica",
      startDate: "2024-01-16",
      endDate: "2024-01-18",
      days: 3,
      status: "Aprovado",
      reason: "Atestado médico"
    }
  ];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Presente":
      return "default";
    case "Atraso":
      return "secondary";
    case "Ausente":
      return "destructive";
    case "Aprovado":
      return "default";
    case "Pendente":
      return "secondary";
    case "Rejeitado":
      return "destructive";
    default:
      return "outline";
  }
};

export default function PontoFrequencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const { data: attendanceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["attendanceStats"],
    queryFn: getAttendanceStats,
  });

  const { data: attendanceRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["attendanceRecords"],
    queryFn: getAttendanceRecords,
  });

  const { data: leaveRequests, isLoading: leavesLoading } = useQuery({
    queryKey: ["leaveRequests"],
    queryFn: getLeaveRequests,
  });

  const filteredRecords = attendanceRecords?.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || record.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    
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
      title: "Funcionários Presentes",
      value: `${attendanceStats?.presentToday}/${attendanceStats?.totalEmployees}`,
      description: "Hoje",
      icon: UserCheck,
      trend: "+2% em relação a ontem"
    },
    {
      title: "Média de Horas",
      value: `${attendanceStats?.averageHoursWorked}h`,
      description: "Por funcionário/dia",
      icon: Clock,
      trend: "+0.2h em relação ao mês passado"
    },
    {
      title: "Horas Extras",
      value: `${attendanceStats?.overtimeHours}h`,
      description: "Este mês",
      icon: Timer,
      trend: "-15% em relação ao mês passado"
    },
    {
      title: "Solicitações Pendentes",
      value: attendanceStats?.pendingApprovals.toString() || "0",
      description: "Aguardando aprovação",
      icon: AlertTriangle,
      trend: "3 novas hoje"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ponto e Frequência</h1>
          <p className="text-muted-foreground mt-2">
            Controle de horários, presenças e solicitações de funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Relatório Mensal
          </Button>
          <Button>
            <Clock className="w-4 h-4 mr-2" />
            Registrar Ponto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="escalas">Escalas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
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

          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Resumo do Dia
                </CardTitle>
                <CardDescription>Status dos funcionários hoje</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Presentes
                    </span>
                    <span className="font-semibold">{attendanceStats?.presentToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Atrasos
                    </span>
                    <span className="font-semibold">{attendanceStats?.lateToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Ausentes
                    </span>
                    <span className="font-semibold">{attendanceStats?.absentToday}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Taxa de Presença</div>
                  <Progress 
                    value={(attendanceStats?.presentToday || 0) / (attendanceStats?.totalEmployees || 1) * 100} 
                    className="h-2" 
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((attendanceStats?.presentToday || 0) / (attendanceStats?.totalEmployees || 1) * 100)}% dos funcionários
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendências da Semana
                </CardTitle>
                <CardDescription>Análise de frequência semanal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Segunda-feira</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Terça-feira</span>
                      <span className="text-sm font-medium">96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Quarta-feira</span>
                      <span className="text-sm font-medium">93%</span>
                    </div>
                    <Progress value={93} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Quinta-feira</span>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Sexta-feira</span>
                      <span className="text-sm font-medium">89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registros" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar por funcionário ou código..."
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
                <SelectItem value="Presente">Presente</SelectItem>
                <SelectItem value="Atraso">Atraso</SelectItem>
                <SelectItem value="Ausente">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto - {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
              <CardDescription>Registros de entrada e saída dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords?.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{record.employeeCode} • {record.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Entrada</p>
                        <p className="text-sm text-muted-foreground">{record.checkIn}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Saída</p>
                        <p className="text-sm text-muted-foreground">{record.checkOut}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-sm text-muted-foreground">{record.totalHours}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Extra</p>
                        <p className="text-sm text-muted-foreground">{record.overtime}</p>
                      </div>
                      <Badge variant={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Ausência</CardTitle>
              <CardDescription>Gerenciar pedidos de férias, licenças e faltas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests?.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.type} • {request.days} dias</p>
                        <p className="text-xs text-muted-foreground mt-1">{request.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Período</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.startDate), "dd/MM", { locale: ptBR })} - {format(new Date(request.endDate), "dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      {request.status === "Pendente" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Escalas</CardTitle>
              <CardDescription>Configurar horários de trabalho e turnos</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Escalas de Trabalho</h3>
                <p className="text-muted-foreground mb-4">Configure horários e turnos dos funcionários</p>
                <Button>Gerenciar Escalas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Ponto</CardTitle>
              <CardDescription>Gerar relatórios detalhados de frequência</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Relatórios Avançados</h3>
                <p className="text-muted-foreground mb-4">Análises detalhadas de frequência e produtividade</p>
                <Button>Gerar Relatório</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}