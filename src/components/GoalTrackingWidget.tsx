import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { useSmartCache } from "@/hooks/useSmartCache";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { differenceInDays, differenceInMonths } from "date-fns";
import { formatDateDisplay } from "@/utils/dateUtils";

interface GoalTrackingWidgetProps {
  currentEmissions: number;
  isLoading?: boolean;
}

const getGoals = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('status', 'No Caminho Certo')
    .order('deadline_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

export function GoalTrackingWidget({ currentEmissions, isLoading }: GoalTrackingWidgetProps) {
  const { data: goals, isLoading: isGoalsLoading } = useSmartCache({
    queryKey: ['goals', 'active'],
    queryFn: getGoals,
    priority: 'high',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const loading = isLoading || isGoalsLoading;

  const calculateProgress = (goal: any) => {
    const startValue = goal.baseline_value || currentEmissions * 1.2; // Assume 20% higher baseline if not set
    const targetValue = goal.target_value;
    const currentValue = currentEmissions;
    
    // For emission reduction goals
    const totalReduction = startValue - targetValue;
    const currentReduction = startValue - currentValue;
    return Math.min(100, Math.max(0, (currentReduction / totalReduction) * 100));
  };

  const getGoalStatus = (goal: any) => {
    const progress = calculateProgress(goal);
    const daysRemaining = differenceInDays(new Date(goal.deadline_date), new Date());
    const monthsTotal = differenceInMonths(new Date(goal.deadline_date), new Date(goal.created_at));
    const monthsElapsed = monthsTotal - differenceInMonths(new Date(goal.deadline_date), new Date());
    const expectedProgress = monthsTotal > 0 ? (monthsElapsed / monthsTotal) * 100 : 0;

    if (progress >= 100) return { status: 'completed', color: 'secondary', icon: CheckCircle2 };
    if (daysRemaining < 0) return { status: 'overdue', color: 'destructive', icon: AlertTriangle };
    if (progress < expectedProgress - 20) return { status: 'at_risk', color: 'destructive', icon: AlertTriangle };
    if (progress < expectedProgress - 10) return { status: 'behind', color: 'secondary', icon: Clock };
    if (progress >= expectedProgress + 10) return { status: 'ahead', color: 'secondary', icon: TrendingUp };
    return { status: 'on_track', color: 'default', icon: Target };
  };

  const generateProgressChart = (goal: any) => {
    const monthsTotal = differenceInMonths(new Date(goal.deadline_date), new Date(goal.created_at));
    const currentProgress = calculateProgress(goal);
    const currentMonthIndex = differenceInMonths(new Date(), new Date(goal.created_at));
    
    return Array.from({ length: monthsTotal + 1 }, (_, i) => {
      const expectedProgress = monthsTotal > 0 ? (i / monthsTotal) * 100 : 0;
      
      // Use real progress for current month, proportional progress for past months, null for future
      let actualProgress: number | null = null;
      if (i === currentMonthIndex) {
        actualProgress = currentProgress;
      } else if (i < currentMonthIndex) {
        // Calculate proportional progress for past months (linear interpolation to current)
        actualProgress = currentMonthIndex > 0 
          ? (currentProgress / currentMonthIndex) * i 
          : 0;
      }
      // Future months remain null (no data yet)
      
      return {
        month: i,
        expected: expectedProgress,
        actual: actualProgress,
        target: i === monthsTotal ? 100 : null
      };
    });
  };

  const activeGoals = goals?.filter(goal => {
    const daysRemaining = differenceInDays(new Date(goal.deadline_date), new Date());
    return daysRemaining >= 0;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Metas Ativas</p>
                <p className="text-2xl font-bold">
                  {loading ? <SmartSkeleton variant="card" className="w-8 h-6" /> : activeGoals.length}
                </p>
                <p className="text-xs text-muted-foreground">em progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">
                  {loading ? <SmartSkeleton variant="card" className="w-8 h-6" /> : 
                   goals?.filter(g => calculateProgress(g) >= 100).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">100% atingidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-secondary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Em Risco</p>
                <p className="text-2xl font-bold">
                  {loading ? <SmartSkeleton variant="card" className="w-8 h-6" /> : 
                   goals?.filter(g => getGoalStatus(g).status === 'at_risk').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">requer atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Próximo Prazo</p>
                <p className="text-2xl font-bold">
                  {loading ? <SmartSkeleton variant="card" className="w-16 h-6" /> : 
                   activeGoals.length > 0 ? 
                   Math.min(...activeGoals.map(g => differenceInDays(new Date(g.deadline_date), new Date()))) + 'd' : 
                   'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">dias restantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Metas Ativas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SmartSkeleton variant="list" className="space-y-4" />
          ) : activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal, index) => {
                const progress = calculateProgress(goal);
                const status = getGoalStatus(goal);
                const StatusIcon = status.icon;
                const daysRemaining = differenceInDays(new Date(goal.deadline_date), new Date());

                return (
                  <div key={index} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{goal.name || `Meta de redução de emissões`}</h4>
                          <Badge variant={status.color as "default" | "destructive" | "secondary" | "outline"} className="flex items-center space-x-1">
                            <StatusIcon className="h-3 w-3" />
                            <span className="capitalize">{status.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {goal.description || `Reduzir emissões para ${goal.target_value} tCO₂e até ${formatDateDisplay(goal.deadline_date)}`}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Progresso: </span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Prazo: </span>
                            <span className="font-medium">
                              {daysRemaining > 0 ? `${daysRemaining} dias` : 'Vencida'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Meta: </span>
                            <span className="font-medium">{goal.target_value} tCO₂e</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{progress.toFixed(1)}% de 100%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Mini progress chart */}
                    <div className="h-[100px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateProgressChart(goal)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: number) => [`${value?.toFixed(1)}%`, '']}
                          />
                          <Line 
                            dataKey="expected" 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="5 5"
                            dot={false}
                            name="Esperado"
                          />
                          <Line 
                            dataKey="actual" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            name="Atual"
                          />
                          <ReferenceLine y={100} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta ativa encontrada</p>
              <p className="text-sm">Crie suas primeiras metas de redução de emissões</p>
              <Button variant="outline" className="mt-4">
                Criar Nova Meta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Próximas Ações Recomendadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {goals?.filter(g => getGoalStatus(g).status === 'at_risk').map((goal, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/10">
                <AlertTriangle className="h-4 w-4 text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Meta em risco: {goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Acelerar ações de redução para atingir {goal.target_value} tCO₂e até {formatDateDisplay(goal.deadline_date)}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm">Todas as metas estão no caminho certo!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}