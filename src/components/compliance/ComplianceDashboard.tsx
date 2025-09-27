import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Bell,
  Download,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCompliance } from '@/contexts/ComplianceContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ComplianceDashboard() {
  const { 
    stats, 
    statsLoading, 
    criticalTasks, 
    overdueTasks, 
    upcomingTasks,
    setShowTaskModal,
    setShowRequirementModal 
  } = useCompliance();

  const riskData = React.useMemo(() => {
    if (!criticalTasks.length && !overdueTasks.length && !upcomingTasks.length) return [];
    
    const total = criticalTasks.length + overdueTasks.length + upcomingTasks.length;
    return [
      { name: 'Crítico', value: Math.round((criticalTasks.length / total) * 100), color: '#dc2626' },
      { name: 'Em Atraso', value: Math.round((overdueTasks.length / total) * 100), color: '#ef4444' },
      { name: 'Próximo Vencimento', value: Math.round((upcomingTasks.length / total) * 100), color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [criticalTasks, overdueTasks, upcomingTasks]);

  const complianceScore = React.useMemo(() => {
    if (!stats?.totalTasks || stats.totalTasks === 0) return 0;
    const completedTasks = stats.totalTasks - (stats.pendingTasks || 0) - (stats.overdueTasks || 0);
    return Math.round((completedTasks / stats.totalTasks) * 100);
  }, [stats]);

  const exportComplianceReport = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Score de Conformidade', `${complianceScore}%`],
      ['Total de Requisitos', stats?.totalRequirements?.toString() || '0'],
      ['Tarefas Pendentes', stats?.pendingTasks?.toString() || '0'],
      ['Tarefas em Atraso', stats?.overdueTasks?.toString() || '0'],
      ['Vencendo em 30 Dias', stats?.duingSoon?.toString() || '0'],
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Conformidade</h1>
          <p className="text-muted-foreground">Monitore e gerencie todas as obrigações regulatórias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportComplianceReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button onClick={() => setShowRequirementModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Requisito
          </Button>
          <Button onClick={() => setShowTaskModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(criticalTasks.length > 0 || overdueTasks.length > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Atenção: {overdueTasks.length} tarefas em atraso e {criticalTasks.length} tarefas críticas requerem ação imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Conformidade</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceScore}%</div>
            <div className="mt-2">
              <Progress value={complianceScore} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em tarefas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisitos Mapeados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalRequirements || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Regulamentações cadastradas
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
              {statsLoading ? '...' : stats?.pendingTasks || 0}
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
              {statsLoading ? '...' : stats?.duingSoon || 0}
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
              {statsLoading ? '...' : stats?.overdueTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ação imediata necessária
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats?.totalTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastradas no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        {riskData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Riscos por Prazo</CardTitle>
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
              <div className="mt-4 grid grid-cols-1 gap-2">
                {riskData.map((item, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Conformidade</span>
                <span className="text-2xl font-bold text-green-600">{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{upcomingTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Próximos 7 dias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalTasks ? Math.round(((stats.totalTasks - (stats.pendingTasks || 0) - (stats.overdueTasks || 0)) / stats.totalTasks) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Tarefas Concluídas</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {(criticalTasks.length > 0 || upcomingTasks.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Atividades Importantes</CardTitle>
            <p className="text-sm text-muted-foreground">Tarefas que requerem atenção imediata</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence em: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {task.responsible?.full_name && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {task.responsible.full_name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {upcomingTasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <Clock className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence em: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {task.responsible?.full_name && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {task.responsible.full_name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}