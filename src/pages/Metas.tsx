import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { CardWithAI } from "@/components/CardWithAI";
import { GlobalSearchInterface } from "@/components/GlobalSearchInterface";
import { PredictiveDashboard } from "@/components/PredictiveDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag, TrendingUp, AlertTriangle, BarChart3, Pencil, Plus, Target, Users, Calendar, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGoals, getDashboardStats, type GoalListItem } from "@/services/goals";
import { toast } from "@/hooks/use-toast";
import { GoalProgressUpdateModal } from "@/components/GoalProgressUpdateModal";
import { EditGoalModal } from "@/components/EditGoalModal";
import { TargetTrackingModal } from "@/components/TargetTrackingModal";
import { DuplicateGoalModal } from "@/components/DuplicateGoalModal";
import { GoalStatusBadge } from "@/components/GoalStatusBadge";
import { GoalProgressDisplay } from "@/components/GoalProgressDisplay";
import { GoalsFiltersBar } from "@/components/GoalsFiltersBar";
import { useGoalsFilters } from "@/hooks/useGoalsFilters";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ value, size = 120, strokeWidth = 8 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--success))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-success">{value}%</span>
      </div>
    </div>
  );
}

// Helper function to format metric display
const getMetricDisplay = (metricKey: string): string => {
  const metricMap: Record<string, string> = {
    'emissoes-totais': 'Emissões Totais (tCO₂e)',
    'emissoes-escopo1': 'Emissões Escopo 1 (tCO₂e)',
    'emissoes-escopo2': 'Emissões Escopo 2 (tCO₂e)',
    'taxa-reciclagem': '% de Resíduos Reciclados',
    'geracao-residuos': 'Geração Total de Resíduos (ton)',
    'consumo-eletricidade': 'Consumo de Eletricidade (kWh)',
    'consumo-agua': 'Consumo de Água (m³)',
  };
  return metricMap[metricKey] || metricKey;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "No Caminho Certo":
      return "default";
    case "Atenção Necessária":
      return "secondary";
    case "Atingida":
      return "default";
    case "Atrasada":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "No Caminho Certo":
      return "bg-success text-success-foreground";
    case "Atenção Necessária":
      return "bg-warning text-warning-foreground";
    case "Atingida":
      return "bg-accent text-accent-foreground";
    case "Atrasada":
      return "bg-destructive text-destructive-foreground";
    default:
      return "";
  }
};

export default function Metas() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<GoalListItem | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Fetch goals data
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  // Filter and sort goals
  const {
    filters,
    filteredAndSortedGoals,
    updateFilter,
    resetFilters,
    totalCount,
    filteredCount,
  } = useGoalsFilters(goals);

  const isLoading = goalsLoading || statsLoading;

  if (goalsError) {
    toast({
      title: "Erro ao carregar metas",
      description: "Não foi possível carregar as metas. Tente novamente.",
      variant: "destructive",
    });
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Painel de Metas de Sustentabilidade
            </h1>
            <p className="text-muted-foreground">
              Monitore o progresso das suas metas ambientais e de sustentabilidade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearchInterface onNavigate={(path) => navigate(path)} />
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              size="sm"
            >
              Atualizar
            </Button>
            <Button 
              className="gap-2"
              onClick={() => navigate("/metas/nova")}
            >
              <Plus className="h-4 w-4" />
              Criar Nova Meta
            </Button>
          </div>
        </div>

        {/* Predictive Insights */}
        <PredictiveDashboard />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Metas Ativas */}
          <CardWithAI
            cardType="goals_active"
            cardData={{ 
              activeGoals: stats?.activeGoals || 0,
              totalGoals: totalCount,
              averageProgress: stats?.averageProgress || 0 
            }}
            title="Metas Ativas"
            value={stats?.activeGoals || 0}
            subtitle="metas em andamento"
            isLoading={isLoading}
          />

          {/* Progresso Médio */}
          <CardWithAI
            cardType="goals_progress"
            cardData={{ 
              averageProgress: stats?.averageProgress || 0,
              activeGoals: stats?.activeGoals || 0,
              delayedGoals: stats?.delayedGoals || 0 
            }}
            title="Progresso Médio"
            value={`${stats?.averageProgress || 0}%`}
            subtitle="das metas concluídas"
            isLoading={isLoading}
          />

          {/* Metas em Atraso */}
          <CardWithAI
            cardType="goals_delayed"
            cardData={{ 
              delayedGoals: stats?.delayedGoals || 0,
              totalGoals: totalCount,
              urgentGoals: stats?.delayedGoals || 0 
            }}
            title="Em Atraso"
            value={stats?.delayedGoals || 0}
            subtitle="metas atrasadas"
            isLoading={isLoading}
          />

          {/* Total de Metas */}
          <CardWithAI
            cardType="goals_total"
            cardData={{ 
              totalGoals: totalCount,
              activeGoals: stats?.activeGoals || 0,
              completedGoals: (totalCount - (stats?.activeGoals || 0)) 
            }}
            title="Total de Metas"
            value={totalCount}
            subtitle="metas cadastradas"
            isLoading={isLoading}
          />
        </div>

        {/* Goals Management Section */}
        <Card className="shadow-card">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Gerenciamento de Metas</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/metas/nova")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Meta
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <GoalsFiltersBar
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              totalCount={totalCount}
              filteredCount={filteredCount}
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome da Meta</TableHead>
                    <TableHead className="min-w-[180px]">Métrica</TableHead>
                    <TableHead className="min-w-[100px]">Linha de Base</TableHead>
                    <TableHead className="min-w-[100px]">Alvo</TableHead>
                    <TableHead className="min-w-[120px]">Prazo Final</TableHead>
                    <TableHead className="min-w-[150px]">Progresso</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="text-right min-w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAndSortedGoals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Target className="h-12 w-12 text-muted-foreground/50" />
                          <div className="text-center">
                            <p className="font-medium text-muted-foreground">
                              {totalCount === 0 ? 'Nenhuma meta cadastrada' : 'Nenhuma meta encontrada'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {totalCount === 0 
                                ? 'Clique em "Nova Meta" para criar sua primeira meta'
                                : 'Tente ajustar os filtros para encontrar suas metas'
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedGoals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getMetricDisplay(goal.metric_key)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">--</TableCell>
                        <TableCell className="font-medium">{goal.target_value}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(goal.deadline_date)}
                        </TableCell>
                        <TableCell>
                          <GoalProgressDisplay 
                            progress={goal.current_progress_percent}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <GoalStatusBadge status={goal.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Ver Trilha de Metas"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowTrackingModal(true);
                              }}
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Atualizar Progresso"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowProgressModal(true);
                              }}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Duplicar Meta"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowDuplicateModal(true);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar Meta"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowEditModal(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <GoalProgressUpdateModal
          open={showProgressModal}
          onOpenChange={setShowProgressModal}
          goalId={selectedGoal?.id || null}
          goalName={selectedGoal?.name || ''}
          currentProgress={selectedGoal?.current_progress_percent || 0}
          targetValue={selectedGoal?.target_value || 0}
        />

        <EditGoalModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          goalId={selectedGoal?.id || null}
        />

        <TargetTrackingModal
          open={showTrackingModal}
          onOpenChange={setShowTrackingModal}
          goal={selectedGoal}
        />

        <DuplicateGoalModal
          open={showDuplicateModal}
          onOpenChange={setShowDuplicateModal}
          goalId={selectedGoal?.id || null}
        />
      </div>
    </MainLayout>
  );
}