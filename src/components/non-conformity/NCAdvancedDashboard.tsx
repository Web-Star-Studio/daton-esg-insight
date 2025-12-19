/**
 * NCAdvancedDashboard - Dashboard avançado com gráficos e indicadores de SLA
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { nonConformityService, NCDashboardStats, NonConformity, NCTask } from "@/services/nonConformityService";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cores por etapa
const STAGE_COLORS = {
  1: "hsl(var(--chart-1))",
  2: "hsl(var(--chart-2))",
  3: "hsl(var(--chart-3))",
  4: "hsl(var(--chart-4))",
  5: "hsl(var(--chart-5))",
  6: "hsl(220, 70%, 50%)"
};

// Cores por severidade
const SEVERITY_COLORS = {
  "Crítica": "hsl(0, 84%, 60%)",
  "Alta": "hsl(25, 95%, 53%)",
  "Média": "hsl(48, 96%, 53%)",
  "Baixa": "hsl(142, 76%, 36%)"
};

// Nomes das etapas
const STAGE_NAMES: Record<number, string> = {
  1: "Registro",
  2: "Ação Imediata",
  3: "Análise de Causa",
  4: "Planejamento",
  5: "Implementação",
  6: "Eficácia"
};

interface NCAdvancedDashboardProps {
  nonConformities: NonConformity[];
}

export function NCAdvancedDashboard({ nonConformities }: NCAdvancedDashboardProps) {
  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["nc-dashboard-stats"],
    queryFn: () => nonConformityService.getDashboardStats(),
    staleTime: 60 * 1000
  });

  // Buscar todas as tarefas para indicadores de SLA
  const { data: allTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["nc-all-tasks"],
    queryFn: () => nonConformityService.getTasks(),
    staleTime: 60 * 1000
  });

  // Calcular métricas de SLA
  const slaMetrics = calculateSLAMetrics(allTasks || []);
  
  // Calcular distribuição por severidade
  const severityData = calculateSeverityDistribution(nonConformities);
  
  // Calcular distribuição por etapa
  const stageData = calculateStageDistribution(nonConformities);
  
  // Calcular tendência mensal
  const monthlyTrend = calculateMonthlyTrend(nonConformities);

  if (loadingStats || loadingTasks) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Linha 1: Cards de Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="NCs Abertas"
          value={stats?.total_open || nonConformities.filter(nc => nc.status !== "Fechada").length}
          icon={<AlertCircle className="h-5 w-5" />}
          trend={calculateTrend(nonConformities, "open")}
          color="orange"
        />
        <StatCard
          title="NCs Fechadas"
          value={stats?.total_closed || nonConformities.filter(nc => nc.status === "Fechada").length}
          icon={<CheckCircle className="h-5 w-5" />}
          trend={calculateTrend(nonConformities, "closed")}
          color="green"
        />
        <StatCard
          title="Tarefas Atrasadas"
          value={slaMetrics.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          subtitle={`${slaMetrics.overduePercentage.toFixed(1)}% do total`}
          color="red"
          highlight={slaMetrics.overdue > 0}
        />
        <StatCard
          title="Taxa de Resolução"
          value={`${calculateResolutionRate(nonConformities).toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          trend={calculateTrend(nonConformities, "resolution")}
          color="blue"
        />
      </div>

      {/* Linha 2: Gráficos de Pizza - Etapas e Severidade */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribuição por Etapa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição por Etapa
            </CardTitle>
            <CardDescription>
              NCs ativas distribuídas por etapa do fluxo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {stageData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STAGE_COLORS[(entry.stage as keyof typeof STAGE_COLORS) || 1]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'NCs']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Severidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Distribuição por Severidade
            </CardTitle>
            <CardDescription>
              Classificação das NCs por nível de severidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {severityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || '#888'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'NCs']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Indicadores de SLA e Tarefas por Tipo */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Indicadores de SLA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Indicadores de SLA
            </CardTitle>
            <CardDescription>
              Monitoramento de prazos e atrasos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SLAIndicator
              label="Tarefas no Prazo"
              value={slaMetrics.onTime}
              total={slaMetrics.total}
              color="green"
            />
            <SLAIndicator
              label="Vencendo Hoje"
              value={slaMetrics.dueToday}
              total={slaMetrics.total}
              color="yellow"
            />
            <SLAIndicator
              label="Próximos 3 Dias"
              value={slaMetrics.dueSoon}
              total={slaMetrics.total}
              color="orange"
            />
            <SLAIndicator
              label="Atrasadas"
              value={slaMetrics.overdue}
              total={slaMetrics.total}
              color="red"
            />
            
            {/* Lista de tarefas críticas */}
            {slaMetrics.criticalTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Tarefas Críticas
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {slaMetrics.criticalTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{task.title}</span>
                      <Badge variant={task.daysOverdue > 0 ? "destructive" : "secondary"} className="text-xs">
                        {task.daysOverdue > 0 
                          ? `${task.daysOverdue}d atrasada`
                          : task.daysOverdue === 0 
                            ? "Hoje"
                            : `${Math.abs(task.daysOverdue)}d restantes`
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Tarefas por Tipo
            </CardTitle>
            <CardDescription>
              Distribuição de tarefas pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculateTasksByType(allTasks || [])}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={75}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="pendentes" 
                    name="Pendentes" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="concluidas" 
                    name="Concluídas" 
                    fill="hsl(var(--chart-2))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 4: Tendência Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência Mensal
          </CardTitle>
          <CardDescription>
            Evolução de NCs abertas vs fechadas nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="abertas" 
                  name="Abertas"
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="fechadas" 
                  name="Fechadas"
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Linha 5: Cards de Contadores por Severidade */}
      <div className="grid gap-4 md:grid-cols-4">
        {["Crítica", "Alta", "Média", "Baixa"].map((severity) => {
          const count = nonConformities.filter(nc => nc.severity === severity && nc.status !== "Fechada").length;
          return (
            <SeverityCard 
              key={severity}
              severity={severity}
              count={count}
              total={nonConformities.filter(nc => nc.status !== "Fechada").length}
            />
          );
        })}
      </div>
    </div>
  );
}

// ==================== Componentes Auxiliares ====================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  color: "orange" | "green" | "red" | "blue";
  highlight?: boolean;
}

function StatCard({ title, value, icon, trend, subtitle, color, highlight }: StatCardProps) {
  const colorClasses = {
    orange: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
    green: "text-green-500 bg-green-100 dark:bg-green-900/30",
    red: "text-red-500 bg-red-100 dark:bg-red-900/30",
    blue: "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
  };

  return (
    <Card className={highlight ? "border-destructive/50 bg-destructive/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs flex items-center gap-1 ${
            trend.isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}% vs mês anterior
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface SLAIndicatorProps {
  label: string;
  value: number;
  total: number;
  color: "green" | "yellow" | "orange" | "red";
}

function SLAIndicator({ label, value, total, color }: SLAIndicatorProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-red-500"
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        // Using inline style for dynamic color
        style={{ 
          // @ts-ignore
          '--progress-background': colorClasses[color].replace('bg-', '')
        }}
      />
    </div>
  );
}

interface SeverityCardProps {
  severity: string;
  count: number;
  total: number;
}

function SeverityCard({ severity, count, total }: SeverityCardProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const severityConfig = {
    "Crítica": { 
      color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />
    },
    "Alta": { 
      color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200",
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    "Média": { 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200",
      icon: <Clock className="h-5 w-5 text-yellow-500" />
    },
    "Baixa": { 
      color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    }
  };

  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig["Baixa"];

  return (
    <Card className={`border ${config.color.split(' ').filter(c => c.includes('border')).join(' ')}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={config.color}>
            {severity}
          </Badge>
          {config.icon}
        </div>
        <div className="text-3xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          {percentage.toFixed(1)}% das NCs abertas
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== Funções de Cálculo ====================

function calculateSLAMetrics(tasks: NCTask[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pendingTasks = tasks.filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada');
  
  const overdue = pendingTasks.filter(t => {
    const dueDate = new Date(t.due_date);
    return isBefore(dueDate, today);
  }).length;
  
  const dueToday = pendingTasks.filter(t => {
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }).length;
  
  const threeDaysFromNow = addDays(today, 3);
  const dueSoon = pendingTasks.filter(t => {
    const dueDate = new Date(t.due_date);
    return isAfter(dueDate, today) && isBefore(dueDate, threeDaysFromNow);
  }).length;
  
  const onTime = pendingTasks.length - overdue;
  
  const criticalTasks = pendingTasks
    .map(t => {
      const dueDate = new Date(t.due_date);
      return {
        ...t,
        daysOverdue: differenceInDays(today, dueDate)
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    total: pendingTasks.length,
    overdue,
    overduePercentage: pendingTasks.length > 0 ? (overdue / pendingTasks.length) * 100 : 0,
    dueToday,
    dueSoon,
    onTime,
    criticalTasks
  };
}

function calculateSeverityDistribution(ncs: NonConformity[]) {
  const openNCs = ncs.filter(nc => nc.status !== "Fechada");
  const severities = ["Crítica", "Alta", "Média", "Baixa"];
  
  return severities.map(severity => ({
    name: severity,
    value: openNCs.filter(nc => nc.severity === severity).length
  })).filter(item => item.value > 0);
}

function calculateStageDistribution(ncs: NonConformity[]) {
  const openNCs = ncs.filter(nc => nc.status !== "Fechada");
  
  return [1, 2, 3, 4, 5, 6].map(stage => ({
    name: STAGE_NAMES[stage],
    stage,
    value: openNCs.filter(nc => nc.current_stage === stage).length
  })).filter(item => item.value > 0);
}

function calculateMonthlyTrend(ncs: NonConformity[]) {
  const months: Record<string, { abertas: number; fechadas: number }> = {};
  const today = new Date();
  
  // Últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = format(date, "MMM/yy", { locale: ptBR });
    months[monthKey] = { abertas: 0, fechadas: 0 };
  }
  
  ncs.forEach(nc => {
    const createdDate = new Date(nc.created_at);
    const monthKey = format(createdDate, "MMM/yy", { locale: ptBR });
    
    if (months[monthKey] !== undefined) {
      months[monthKey].abertas++;
    }
    
    if (nc.status === "Fechada" && nc.completion_date) {
      const closedDate = new Date(nc.completion_date);
      const closedMonthKey = format(closedDate, "MMM/yy", { locale: ptBR });
      
      if (months[closedMonthKey] !== undefined) {
        months[closedMonthKey].fechadas++;
      }
    }
  });
  
  return Object.entries(months).map(([month, data]) => ({
    month,
    ...data
  }));
}

function calculateTasksByType(tasks: NCTask[]) {
  const taskTypes = {
    'registration': 'Registro',
    'immediate_action': 'Ação Imediata',
    'cause_analysis': 'Análise',
    'planning': 'Planejamento',
    'implementation': 'Implementação',
    'effectiveness': 'Eficácia'
  };
  
  return Object.entries(taskTypes).map(([type, name]) => {
    const typeTasks = tasks.filter(t => t.task_type === type);
    return {
      name,
      pendentes: typeTasks.filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada').length,
      concluidas: typeTasks.filter(t => t.status === 'Concluída').length
    };
  });
}

function calculateResolutionRate(ncs: NonConformity[]): number {
  if (ncs.length === 0) return 0;
  const closed = ncs.filter(nc => nc.status === "Fechada").length;
  return (closed / ncs.length) * 100;
}

function calculateTrend(ncs: NonConformity[], type: "open" | "closed" | "resolution"): { value: number; isPositive: boolean } | undefined {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  
  const lastMonthNCs = ncs.filter(nc => {
    const date = new Date(nc.created_at);
    return date >= lastMonth && date < today;
  });
  
  const twoMonthsAgoNCs = ncs.filter(nc => {
    const date = new Date(nc.created_at);
    return date >= twoMonthsAgo && date < lastMonth;
  });
  
  if (twoMonthsAgoNCs.length === 0) return undefined;
  
  let currentValue: number;
  let previousValue: number;
  
  switch (type) {
    case "open":
      currentValue = lastMonthNCs.filter(nc => nc.status !== "Fechada").length;
      previousValue = twoMonthsAgoNCs.filter(nc => nc.status !== "Fechada").length;
      break;
    case "closed":
      currentValue = lastMonthNCs.filter(nc => nc.status === "Fechada").length;
      previousValue = twoMonthsAgoNCs.filter(nc => nc.status === "Fechada").length;
      break;
    case "resolution":
      currentValue = (lastMonthNCs.filter(nc => nc.status === "Fechada").length / lastMonthNCs.length) * 100 || 0;
      previousValue = (twoMonthsAgoNCs.filter(nc => nc.status === "Fechada").length / twoMonthsAgoNCs.length) * 100 || 0;
      break;
  }
  
  if (previousValue === 0) return undefined;
  
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  return {
    value: Math.abs(Math.round(change)),
    isPositive: type === "closed" || type === "resolution" ? change > 0 : change < 0
  };
}

export default NCAdvancedDashboard;
