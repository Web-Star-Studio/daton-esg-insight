import { useState, useMemo } from "react";
import { Plus, AlertTriangle, FileText, TrendingUp, Calendar, Filter, Download, Bell, Shield, BarChart3, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCompliance } from '@/hooks/data/useCompliance';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { complianceService } from "@/services/compliance";
import { ComplianceTaskModal } from "@/components/ComplianceTaskModal";
import { RegulatoryRequirementModal } from "@/components/RegulatoryRequirementModal";
import { TaskCalendarView } from "@/components/TaskCalendarView";
import { RequirementsLibrary } from "@/components/RequirementsLibrary";
import ComplianceStrategyDashboard from "@/components/ComplianceStrategyDashboard";


export default function Compliance() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("dashboard");

  const { tasks, stats, trendData, riskData, isLoading } = useCompliance();

  const mockComplianceScore = stats.completionRate;
  const mockNotifications = [
    { 
      id: 1, 
      type: "warning", 
      message: `${stats.duingSoon} tarefas vencem nos próximos 30 dias`, 
      time: "atualizado agora" 
    },
    { 
      id: 2, 
      type: "alert", 
      message: `${stats.overdueTasks} tarefas em atraso`, 
      time: "atualizado agora" 
    },
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return 'text-red-600';
    if (score >= 70) return 'text-orange-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const exportComplianceReport = () => {
    const csvContent = [
      ['Tarefa', 'Status', 'Prioridade', 'Vencimento', 'Responsável'],
      ...filteredTasks.map(task => [
        task.title,
        task.status,
        task.priority,
        task.due_date,
        task.responsible
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Conformidade Regulatória</h1>
          <p className="text-muted-foreground">Monitore e gerencie todas as obrigações regulatórias da empresa</p>
        </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportComplianceReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Alert for critical notifications */}
        {mockNotifications.some(n => n.type === 'alert') && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Atenção: Existem {mockNotifications.filter(n => n.type === 'alert').length} alertas críticos que requerem ação imediata.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Conformidade</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{mockComplianceScore}%</div>
              <div className="mt-2">
                <Progress value={mockComplianceScore} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +2% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obrigações Mapeadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.totalRequirements}
              </div>
              <p className="text-xs text-muted-foreground">
                Requisitos regulatórios cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : stats.pendingTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencendo em 30 Dias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {isLoading ? '...' : stats.duingSoon}
              </div>
              <p className="text-xs text-muted-foreground">
                Requer atenção urgente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? '...' : stats.overdueTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Prazo vencido - Ação imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : tasks.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Completadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs with Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="strategy">Plano Estratégico</TabsTrigger>
            <TabsTrigger value="tasks">Gestão de Tarefas</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="requirements">Matriz Regulatória</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Trend Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Tendência de Conformidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completadas" />
                      <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pendentes" />
                      <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} name="Em Atraso" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Distribuição de Riscos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {riskData.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notificações Recentes</CardTitle>
                <p className="text-sm text-muted-foreground">Alertas e atualizações importantes</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Bell className={`h-4 w-4 mt-0.5 ${notification.type === 'alert' ? 'text-red-500' : notification.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <ComplianceStrategyDashboard />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Gestão Avançada de Tarefas</h2>
                <p className="text-sm text-muted-foreground">
                  Monitore e gerencie todas as tarefas de compliance com análise de risco
                </p>
              </div>
              <Button onClick={() => setShowTaskModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="overdue">Em Atraso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Tasks Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Score de Risco</TableHead>
                      <TableHead>Evidências</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                            <span className="text-sm capitalize">{task.status.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(task.due_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm">{task.responsible}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {task.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">-</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Calendário de Obrigações</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie todas as tarefas de compliance com prazos e responsáveis
                </p>
              </div>
              <Button onClick={() => setShowTaskModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agendar Tarefa
              </Button>
            </div>
            
            <TaskCalendarView />
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Matriz Regulatória</h2>
                <p className="text-sm text-muted-foreground">
                  Base de conhecimento de todas as leis, normas e regulamentos aplicáveis
                </p>
              </div>
              <Button onClick={() => setShowRequirementModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Mapear Requisito
              </Button>
            </div>
            
            <RequirementsLibrary />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Análises de Conformidade</h2>
              <p className="text-sm text-muted-foreground">
                Insights avançados sobre desempenho e tendências de compliance
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { category: 'Ambiental', score: 92 },
                      { category: 'Trabalhista', score: 85 },
                      { category: 'Fiscal', score: 78 },
                      { category: 'Sanitário', score: 95 },
                      { category: 'Segurança', score: 88 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Compliance Evolution */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Conformidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jan', score: 82 },
                      { month: 'Fev', score: 85 },
                      { month: 'Mar', score: 83 },
                      { month: 'Abr', score: 87 },
                      { month: 'Mai', score: 89 },
                      { month: 'Jun', score: 87 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insights Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border">
                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                    <h3 className="font-semibold">Melhoria Contínua</h3>
                    <p className="text-sm text-muted-foreground">Score de conformidade aumentou 5% nos últimos 3 meses</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <h3 className="font-semibold">Área de Atenção</h3>
                    <p className="text-sm text-muted-foreground">Compliance fiscal requer maior atenção - 78% de score</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <CheckCircle2 className="h-8 w-8 text-blue-500 mb-2" />
                    <h3 className="font-semibold">Destaque</h3>
                    <p className="text-sm text-muted-foreground">95% de conformidade em questões sanitárias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Modals */}
      <ComplianceTaskModal 
        open={showTaskModal} 
        onOpenChange={setShowTaskModal}
      />
      
      <RegulatoryRequirementModal 
        open={showRequirementModal} 
        onOpenChange={setShowRequirementModal}
      />
    </div>
  );
}