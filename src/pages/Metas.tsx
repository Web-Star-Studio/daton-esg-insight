import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag, TrendingUp, AlertTriangle, BarChart3, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGoals, getDashboardStats, type GoalListItem } from "@/services/goals";
import { toast } from "@/hooks/use-toast";

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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Painel de Metas de Sustentabilidade
          </h1>
          <Button 
            className="gap-2"
            onClick={() => navigate("/metas/nova")}
          >
            <Plus className="h-4 w-4" />
            Criar Nova Meta
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metas Ativas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas Ativas
              </CardTitle>
              <Flag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? "--" : stats?.activeGoals || 0}
              </div>
            </CardContent>
          </Card>

          {/* Progresso Médio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso Médio das Metas
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent className="flex items-center justify-center pt-4">
              <CircularProgress value={isLoading ? 0 : stats?.averageProgress || 0} />
            </CardContent>
          </Card>

          {/* Metas em Atraso */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas em Atraso
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? "--" : stats?.delayedGoals || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Meta</TableHead>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Linha de Base</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Prazo Final</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
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
                  ) : goals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma meta cadastrada ainda. Clique em "Criar Nova Meta" para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    goals.map((goal) => (
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
                          <div className="flex items-center gap-2">
                            <Progress value={goal.current_progress_percent} className="w-20" />
                            <span className="text-sm font-medium min-w-[3rem]">
                              {Math.round(goal.current_progress_percent)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${getStatusColor(goal.status)} border-0`}
                          >
                            {goal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Atualizar Progresso"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar Meta"
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
      </div>
    </MainLayout>
  );
}