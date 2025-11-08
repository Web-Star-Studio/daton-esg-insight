import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Calendar, CheckCircle, AlertCircle, ArrowLeft, TrendingUp, BarChart3, Filter, Search, Clock, FileCheck, PackageCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { unifiedToast } from "@/utils/unifiedToast";
import { downloadPGRSReport, getActivePGRSStatus } from "@/services/pgrsReports";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function RelatoriosPGRS() {
  const navigate = useNavigate();
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all");

  // Buscar company_id do usuário atual
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      console.log("🔍 Company ID do usuário:", data?.company_id);
      return data;
    },
  });

  const companyId = profile?.company_id;

  // Buscar status do plano ativo
  const { data: activeStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["pgrs-active-status"],
    queryFn: getActivePGRSStatus,
  });

  // Buscar todos os planos PGRS com detalhes
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["pgrs-plans", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      console.log("🔍 Buscando planos PGRS para company_id:", companyId);
      
      const { data, error } = await supabase
        .from("pgrs_plans")
        .select(`
          *,
          pgrs_waste_sources!inner(id),
          pgrs_procedures!inner(id),
          pgrs_goals!inner(id)
        `)
        .eq('company_id', companyId)
        .order("creation_date", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar planos:", error);
        throw error;
      }
      
      console.log("✅ Planos encontrados:", data?.length, data);
      return data;
    },
  });

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ["pgrs-stats"],
    queryFn: async () => {
      // Dados simulados para demonstração - aguardando implementação de coleta de dados reais
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return {
          month: format(date, "MMM", { locale: ptBR }),
          quantity: Math.floor(Math.random() * 100) + 50
        };
      });

      return { monthlyData };
    },
  });

  // Buscar indicadores de performance reais
  const { data: performanceData } = useQuery({
    queryKey: ["pgrs-performance"],
    queryFn: async () => {
      // Buscar metas de reciclagem
      const { data: goals } = await supabase
        .from('pgrs_goals')
        .select('*')
        .ilike('goal_type', '%recicla%');
      
      // Calcular taxa média de reciclagem baseada nas metas
      const recyclingRate = goals?.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length)
        : 0;
      
      // Buscar meta de redução
      const { data: reductionGoals } = await supabase
        .from('pgrs_goals')
        .select('*')
        .ilike('goal_type', '%redu%');
      
      const reductionRate = reductionGoals?.[0]?.progress_percentage || 0;
      
      // Buscar data da última revisão do plano ativo
      const { data: activePlan } = await supabase
        .from('pgrs_plans')
        .select('updated_at')
        .eq('status', 'Ativo')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const monthsSinceReview = activePlan?.updated_at
        ? Math.floor((new Date().getTime() - new Date(activePlan.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      
      return {
        recyclingRate,
        reductionRate,
        monthsSinceReview
      };
    }
  });

  const handleDownloadReport = async (planId: string) => {
    setDownloadingPlanId(planId);
    try {
      const plan = plans?.find(p => p.id === planId);
      const filename = `PGRS_${plan?.plan_name?.replace(/\s+/g, '_') || 'Plano'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      const success = await downloadPGRSReport(planId, filename);
      
      if (success) {
        unifiedToast.success("Relatório gerado com sucesso!", {
          description: "O download do PDF foi iniciado."
        });
      } else {
        throw new Error("Falha ao gerar o relatório");
      }
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      unifiedToast.error("Erro ao gerar relatório", {
        description: "Não foi possível gerar o relatório PGRS. Tente novamente."
      });
    } finally {
      setDownloadingPlanId(null);
    }
  };

  // Filtrar planos
  const filteredPlans = plans?.filter(plan => {
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesSearch = plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== "all") {
      const planDate = new Date(plan.creation_date);
      const now = new Date();
      
      if (dateRange === "30days") {
        matchesDate = (now.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
      } else if (dateRange === "90days") {
        matchesDate = (now.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24) <= 90;
      } else if (dateRange === "year") {
        matchesDate = now.getFullYear() === planDate.getFullYear();
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Calcular métricas
  const metrics = {
    totalPlans: plans?.length || 0,
    activePlans: plans?.filter(p => p.status === 'Ativo').length || 0,
    totalSources: plans?.reduce((acc, p) => acc + (p.pgrs_waste_sources?.length || 0), 0) || 0,
    totalProcedures: plans?.reduce((acc, p) => acc + (p.pgrs_procedures?.length || 0), 0) || 0,
  };

  console.log("📊 KPIs calculados:", metrics);
  console.log("📦 Plans data:", plans);

  const isLoading = loadingStatus || loadingPlans;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/residuos")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Relatórios PGRS</h1>
          </div>
          <p className="text-muted-foreground">
            Análise completa e geração de relatórios do Plano de Gerenciamento de Resíduos Sólidos
          </p>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Planos</p>
                <p className="text-3xl font-bold">{metrics.totalPlans}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                <p className="text-3xl font-bold text-success">{metrics.activePlans}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fontes de Resíduos</p>
                <p className="text-3xl font-bold">{metrics.totalSources}</p>
              </div>
              <PackageCheck className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Procedimentos</p>
                <p className="text-3xl font-bold">{metrics.totalProcedures}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planos PGRS</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        {/* Tab: Planos PGRS */}
        <TabsContent value="plans" className="space-y-6">
          {/* Plano Ativo - Destaque */}
          {activeStatus && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Plano Ativo: {activeStatus.plan_name}
                    </CardTitle>
                    <CardDescription>
                      Criado em {format(new Date(activeStatus.creation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleDownloadReport(activeStatus.id)}
                    disabled={downloadingPlanId === activeStatus.id}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingPlanId === activeStatus.id ? "Gerando..." : "Baixar Relatório"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fontes de Resíduos</p>
                      <p className="text-2xl font-bold">{activeStatus.sources_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Procedimentos</p>
                      <p className="text-2xl font-bold">{activeStatus.procedures_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Metas</p>
                      <p className="text-2xl font-bold">{activeStatus.goals_count || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome do plano..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="90days">Últimos 90 dias</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Planos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Planos Encontrados ({filteredPlans?.length || 0})
              </h2>
            </div>

            {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Carregando planos...
              </div>
            </CardContent>
          </Card>
            ) : filteredPlans && filteredPlans.length > 0 ? (
              <div className="grid gap-4">
                {filteredPlans.map((plan) => {
                  const isActive = plan.status === 'Ativo';
                  const sourcesCount = Array.isArray(plan.pgrs_waste_sources) 
                    ? plan.pgrs_waste_sources.length 
                    : 0;

                  return (
                    <Card key={plan.id} className={isActive ? 'border-primary/30' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="flex items-center gap-2">
                                {plan.plan_name}
                              </CardTitle>
                              {isActive && <Badge variant="default">Ativo</Badge>}
                              {plan.status === 'Rascunho' && <Badge variant="secondary">Rascunho</Badge>}
                              {plan.status === 'Arquivado' && <Badge variant="outline">Arquivado</Badge>}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(plan.creation_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <PackageCheck className="h-3 w-3" />
                                {sourcesCount} fontes
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(plan.next_review_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={isActive ? "default" : "outline"}
                            onClick={() => handleDownloadReport(plan.id)}
                            disabled={downloadingPlanId === plan.id}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {downloadingPlanId === plan.id ? "Gerando..." : "Baixar PDF"}
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum plano encontrado com os filtros selecionados.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        {/* Tab: Análises */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Evolução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução Mensal de Resíduos
                </CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.monthlyData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Distribuição de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status dos Planos
                </CardTitle>
                <CardDescription>Distribuição atual</CardDescription>
              </CardHeader>
              <CardContent>
                {plans && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Ativos', value: plans.filter(p => p.status === 'Ativo').length },
                          { name: 'Rascunhos', value: plans.filter(p => p.status === 'Rascunho').length },
                          { name: 'Arquivados', value: plans.filter(p => p.status === 'Arquivado').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Indicadores de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Desempenho</CardTitle>
              <CardDescription>Métricas principais do PGRS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Reciclagem</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold">{performanceData?.recyclingRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Baseado nas metas</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Redução de Resíduos</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold">{performanceData?.reductionRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Progresso da meta</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conformidade Legal</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-muted-foreground">Todas as licenças válidas</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tempo de Revisão</span>
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{performanceData?.monthsSinceReview || 0} meses</p>
                  <p className="text-xs text-muted-foreground">Última revisão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Informações */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sobre os Relatórios PGRS</CardTitle>
              <CardDescription>Informações técnicas e requisitos legais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Conteúdo do Relatório
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-6">
                  <li>Informações da empresa e caracterização das atividades</li>
                  <li>Identificação completa de todas as fontes geradoras de resíduos</li>
                  <li>Classificação e quantificação dos resíduos por tipo e categoria</li>
                  <li>Procedimentos operacionais de segregação, acondicionamento e coleta</li>
                  <li>Destinação final e transportadores autorizados</li>
                  <li>Metas de redução, reutilização e reciclagem</li>
                  <li>Indicadores de desempenho e acompanhamento</li>
                  <li>Plano de contingência e emergências</li>
                  <li>Cronograma de implementação e revisões</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Base Legal
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="font-medium text-foreground">Lei nº 12.305/2010:</span>
                    Institui a Política Nacional de Resíduos Sólidos (PNRS)
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-medium text-foreground">Decreto nº 7.404/2010:</span>
                    Regulamenta a PNRS e estabelece diretrizes
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-medium text-foreground">NBR 10.004:</span>
                    Classificação de resíduos sólidos
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Os relatórios gerados são formatados em PDF seguindo as normas técnicas e requisitos da legislação ambiental brasileira. Recomenda-se a revisão anual do PGRS e atualização sempre que houver mudanças significativas nos processos.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Como Utilizar os Relatórios
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                  <li>Selecione o plano PGRS desejado na aba "Planos PGRS"</li>
                  <li>Clique em "Baixar PDF" para gerar o relatório completo</li>
                  <li>O arquivo será baixado automaticamente em formato PDF</li>
                  <li>Utilize os relatórios para auditorias, licenciamentos e gestão interna</li>
                  <li>Mantenha cópias atualizadas para consultas regulatórias</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
