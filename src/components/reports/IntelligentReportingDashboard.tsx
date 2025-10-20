import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { intelligentReportingService } from "@/services/intelligentReporting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function IntelligentReportingDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['reporting-analytics'],
    queryFn: () => intelligentReportingService.getReportingAnalytics(),
  });

  const { data: insights } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: () => intelligentReportingService.generateReportInsights('esg', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }),
  });

  const highPriorityInsights = insights?.filter(i => i.priority === 'high') || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Relatórios Gerados</p>
                <p className="text-2xl font-bold">{analytics?.total_reports_generated || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acurácia Média IA</p>
                <p className="text-2xl font-bold">{analytics?.ai_accuracy_average || 0}%</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Insights Gerados</p>
                <p className="text-2xl font-bold">{analytics?.insights_generated || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Economizado</p>
                <p className="text-2xl font-bold">{analytics?.time_saved_hours || 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Insights */}
      {highPriorityInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Insights de Alta Prioridade
            </CardTitle>
            <CardDescription>
              Questões que requerem atenção imediata em seus relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {insight.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {insight.confidence}% confiança
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {insight.data_source}
                    </Badge>
                    {insight.actionable && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Acionável
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios por Categoria</CardTitle>
            <CardDescription>Distribuição dos relatórios gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.top_categories || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
            <CardDescription>Relatórios e insights gerados por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="reports" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Relatórios"
                />
                <Line 
                  type="monotone" 
                  dataKey="insights" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Insights"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}