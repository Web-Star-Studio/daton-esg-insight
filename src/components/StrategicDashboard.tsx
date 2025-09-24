import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StrategicMetrics {
  strategicMaps: number;
  activeOKRs: number;
  completedOKRs: number;
  swotAnalyses: number;
  objectives: number;
  averageProgress: number;
}

export default function StrategicDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["strategic-metrics"],
    queryFn: async (): Promise<StrategicMetrics> => {
      // Strategic Maps
      const { data: maps } = await supabase
        .from("strategic_maps")
        .select("id");

      // OKRs
      const { data: okrs } = await supabase
        .from("okrs")
        .select("id, status, progress_percentage");

      // SWOT Analyses
      const { data: swot } = await supabase
        .from("swot_analysis")
        .select("id");

      // BSC Objectives
      const { data: objectives } = await supabase
        .from("bsc_objectives")
        .select("id");

      const activeOKRs = okrs?.filter(okr => okr.status === 'active').length || 0;
      const completedOKRs = okrs?.filter(okr => okr.status === 'completed').length || 0;
      const averageProgress = okrs?.length ? 
        okrs.reduce((sum, okr) => sum + (okr.progress_percentage || 0), 0) / okrs.length : 0;

      return {
        strategicMaps: maps?.length || 0,
        activeOKRs,
        completedOKRs,
        swotAnalyses: swot?.length || 0,
        objectives: objectives?.length || 0,
        averageProgress: Math.round(averageProgress)
      };
    },
  });

  const { data: recentOKRs } = useQuery({
    queryKey: ["recent-okrs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("okrs")
        .select(`
          id,
          title,
          status,
          progress_percentage,
          quarter,
          year
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: upcomingKRs } = useQuery({
    queryKey: ["upcoming-key-results"],
    queryFn: async () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const { data, error } = await supabase
        .from("key_results")
        .select(`
          id,
          title,
          due_date,
          progress_percentage,
          status,
          okrs!inner(title)
        `)
        .lte("due_date", nextMonth.toISOString().split('T')[0])
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': case 'in_progress': return 'secondary';
      case 'at_risk': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completo';
      case 'active': return 'Ativo';
      case 'in_progress': return 'Em Andamento';
      case 'at_risk': return 'Em Risco';
      case 'draft': return 'Rascunho';
      case 'not_started': return 'Não Iniciado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Estratégico</h2>
        <p className="text-muted-foreground">
          Acompanhamento consolidado dos objetivos e métricas estratégicas
        </p>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapas Estratégicos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.strategicMaps || 0}</div>
            <p className="text-xs text-muted-foreground">
              Mapas criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OKRs Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeOKRs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises SWOT</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.swotAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Análises realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageProgress || 0}%</div>
            <Progress value={metrics?.averageProgress || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* OKRs Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              OKRs Recentes
            </CardTitle>
            <CardDescription>
              Últimos objetivos criados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOKRs?.map((okr) => (
              <div key={okr.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{okr.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {okr.quarter} {okr.year}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(okr.status) as any} className="text-xs">
                    {getStatusLabel(okr.status)}
                  </Badge>
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      {Math.round(okr.progress_percentage || 0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {!recentOKRs?.length && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhum OKR encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resultados-Chave com Prazo Próximo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Prazos Próximos
            </CardTitle>
            <CardDescription>
              Resultados-chave que vencem no próximo mês
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingKRs?.map((kr) => (
              <div key={kr.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{kr.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(kr as any).okrs.title}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(kr.status) as any} className="text-xs">
                    {getStatusLabel(kr.status)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>Progresso: {Math.round(kr.progress_percentage || 0)}%</span>
                    <span>Prazo: {new Date(kr.due_date).toLocaleDateString()}</span>
                  </div>
                  <Progress value={kr.progress_percentage || 0} className="h-1" />
                </div>
              </div>
            ))}
            
            {!upcomingKRs?.length && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhum prazo próximo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {metrics?.completedOKRs || 0}
              </div>
              <p className="text-sm text-muted-foreground">OKRs Completos</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics?.activeOKRs || 0}
              </div>
              <p className="text-sm text-muted-foreground">OKRs em Andamento</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {metrics?.objectives || 0}
              </div>
              <p className="text-sm text-muted-foreground">Objetivos BSC</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}