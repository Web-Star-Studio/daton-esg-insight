import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import { WhistleblowerAnalysisResult } from "@/services/whistleblowerAnalysis";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface WhistleblowerAnalysisDashboardProps {
  data: WhistleblowerAnalysisResult;
  year: number;
}

export function WhistleblowerAnalysisDashboard({ data, year }: WhistleblowerAnalysisDashboardProps) {
  // Cores do design system
  const COLORS = {
    primary: 'hsl(var(--primary))',
    destructive: 'hsl(var(--destructive))',
    warning: 'hsl(var(--warning) / 0.8)',
    success: 'hsl(var(--success))',
    muted: 'hsl(var(--muted))'
  };

  const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];
  const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#fbbf24', '#3b82f6'];

  // Alertas inteligentes
  const alerts = [];
  
  const criticalOpenReports = data.by_priority.find(p => p.priority === 'Crítica')?.count || 0;
  if (criticalOpenReports > 0 && data.open_reports > 0) {
    alerts.push({
      severity: 'error' as const,
      message: `URGENTE: ${criticalOpenReports} denúncias de prioridade CRÍTICA em aberto. Investigar imediatamente.`
    });
  }

  if (data.resolution_metrics.reports_overdue > 0) {
    alerts.push({
      severity: 'error' as const,
      message: `⚠️ ${data.resolution_metrics.reports_overdue} denúncias abertas há mais de 90 dias. Risco de compliance ISO 37001.`
    });
  }

  if (data.resolution_metrics.resolution_rate < 70) {
    alerts.push({
      severity: 'warning' as const,
      message: `Taxa de resolução de ${data.resolution_metrics.resolution_rate.toFixed(1)}% está abaixo do benchmark (≥80%). Revisar processos de investigação.`
    });
  }

  if (data.recurrence_analysis.systemic_issues_count > 0) {
    alerts.push({
      severity: 'error' as const,
      message: `🔴 ${data.recurrence_analysis.systemic_issues_count} problema(s) sistêmico(s) detectado(s). Implementar ações corretivas estruturais.`
    });
  }

  if (data.comparison.change_percentage > 30) {
    alerts.push({
      severity: 'warning' as const,
      message: `Aumento de ${data.comparison.change_percentage.toFixed(1)}% no volume de denúncias. Avaliar clima organizacional.`
    });
  }

  if (data.compliance_status.channel_utilization_rate < 1) {
    alerts.push({
      severity: 'info' as const,
      message: `Taxa de utilização do canal baixa (${data.compliance_status.channel_utilization_rate.toFixed(2)}/100 funcionários). Considerar aumentar divulgação.`
    });
  }

  if (data.comparison.is_improving && data.comparison.resolution_rate_change > 10) {
    alerts.push({
      severity: 'success' as const,
      message: `✅ Melhoria de ${data.comparison.resolution_rate_change.toFixed(1)}% na taxa de resolução! Continue o bom trabalho.`
    });
  }

  if (!data.compliance_status.gri_2_26_compliant) {
    alerts.push({
      severity: 'warning' as const,
      message: `⚠️ Não conforme com GRI 2-26. Dados insuficientes para reporte de denúncias.`
    });
  }

  if (!data.compliance_status.iso_37001_compliant) {
    alerts.push({
      severity: 'warning' as const,
      message: `⚠️ Não conforme com ISO 37001 (Sistema de Gestão Antissuborno). Revisar procedimentos.`
    });
  }

  // Badge de desempenho
  const getPerformanceBadgeVariant = () => {
    switch (data.performance_classification) {
      case 'Excelente':
        return 'default';
      case 'Bom':
        return 'secondary';
      case 'Atenção':
        return 'outline';
      case 'Crítico':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Card Principal - Visão Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Análise do Canal de Denúncias (GRI 2-26)
              </CardTitle>
              <CardDescription>
                Indicadores de compliance e eficácia do canal de ética
              </CardDescription>
            </div>
            <Badge variant={getPerformanceBadgeVariant()}>
              {data.performance_classification}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-3xl font-bold text-primary">{data.total_reports}</div>
              <p className="text-sm text-muted-foreground">Total de Denúncias</p>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: COLORS.warning }}>{data.open_reports}</div>
              <p className="text-sm text-muted-foreground">Abertas</p>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: COLORS.success }}>
                {data.resolution_metrics.resolution_rate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">
                {data.resolution_metrics.avg_resolution_time_days.toFixed(0)} dias
              </div>
              <p className="text-sm text-muted-foreground">Tempo Médio Resolução</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={alert.severity === 'error' ? 'destructive' : 'default'}
              className={
                alert.severity === 'success' ? 'border-green-500 bg-green-50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                alert.severity === 'info' ? 'border-blue-500 bg-blue-50' :
                ''
              }
            >
              {alert.severity === 'error' && <AlertTriangle className="h-4 w-4" />}
              {alert.severity === 'warning' && <AlertCircle className="h-4 w-4" />}
              {alert.severity === 'success' && <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Taxa de Resolução */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress value={data.resolution_metrics.resolution_rate} className="h-4" />
              <p className="text-sm mt-2">
                {data.resolution_metrics.resolution_rate.toFixed(1)}% das denúncias foram resolvidas
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-xl font-bold text-green-600">
                  {data.resolution_metrics.reports_under_30_days}
                </div>
                <p className="text-xs text-muted-foreground">&lt;30 dias</p>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-xl font-bold text-yellow-600">
                  {data.resolution_metrics.reports_30_90_days}
                </div>
                <p className="text-xs text-muted-foreground">30-90 dias</p>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-xl font-bold text-red-600">
                  {data.resolution_metrics.reports_over_90_days}
                </div>
                <p className="text-xs text-muted-foreground">&gt;90 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparação com Período Anterior */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparação com Período Anterior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total de Denúncias:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{data.total_reports}</span>
                {data.comparison.change_percentage > 0 ? (
                  <Badge variant="destructive" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{data.comparison.change_percentage.toFixed(1)}%
                  </Badge>
                ) : data.comparison.change_percentage < 0 ? (
                  <Badge variant="default" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {data.comparison.change_percentage.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Minus className="h-3 w-3" />
                    0%
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Taxa de Resolução:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{data.resolution_metrics.resolution_rate.toFixed(1)}%</span>
                {data.comparison.resolution_rate_change > 0 ? (
                  <Badge variant="default" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{data.comparison.resolution_rate_change.toFixed(1)}%
                  </Badge>
                ) : data.comparison.resolution_rate_change < 0 ? (
                  <Badge variant="destructive" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {data.comparison.resolution_rate_change.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Minus className="h-3 w-3" />
                    0%
                  </Badge>
                )}
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {data.comparison.is_improving ? (
                  <span className="text-green-600">✓ Melhorando</span>
                ) : (
                  <span className="text-red-600">⚠ Precisa Atenção</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problemas Sistêmicos */}
      {data.recurrence_analysis.systemic_issues_count > 0 && (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Problemas Sistêmicos Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recurrence_analysis.categories_with_recurrence.map((issue) => (
                <Alert key={issue.category} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{issue.category}</strong>: {issue.count} denúncias recorrentes (≥3 em 6 meses - provável problema sistêmico)
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Breakdown por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Denúncias por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Denúncias por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.by_priority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary}>
                  {data.by_priority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Categorias de Denúncias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Categoria</th>
                  <th className="text-right py-2">Quantidade</th>
                  <th className="text-right py-2">% do Total</th>
                  <th className="text-right py-2">Tendência</th>
                  <th className="text-right py-2">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.top_5_categories.map((cat) => {
                  const categoryDetail = data.by_category.find(c => c.category === cat.category);
                  return (
                    <tr key={cat.category} className="border-b">
                      <td className="py-2">{cat.category}</td>
                      <td className="text-right">{cat.count}</td>
                      <td className="text-right">{cat.percentage_of_total.toFixed(1)}%</td>
                      <td className="text-right">
                        {cat.trend === 'increasing' && (
                          <Badge variant="destructive" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                          </Badge>
                        )}
                        {cat.trend === 'decreasing' && (
                          <Badge variant="default" className="gap-1">
                            <TrendingDown className="h-3 w-3" />
                          </Badge>
                        )}
                        {cat.trend === 'stable' && (
                          <Badge variant="outline" className="gap-1">
                            <Minus className="h-3 w-3" />
                          </Badge>
                        )}
                      </td>
                      <td className="text-right">
                        {categoryDetail?.avg_resolution_days.toFixed(0)} dias
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tendência Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendência Mensal (Últimos 12 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="reports_received" 
                stroke={COLORS.primary} 
                name="Recebidas"
              />
              <Line 
                type="monotone" 
                dataKey="reports_resolved" 
                stroke={COLORS.success} 
                name="Resolvidas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance (GRI 2-26, ISO 37001)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Canal de Denúncias Disponível:</span>
                {data.compliance_status.has_whistleblower_channel ? (
                  <Badge variant="default">✓ Sim</Badge>
                ) : (
                  <Badge variant="destructive">✗ Não</Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Utilização:</span>
                <span className="font-bold">
                  {data.compliance_status.channel_utilization_rate.toFixed(2)}/100 funcionários
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">GRI 2-26 Compliant:</span>
                {data.compliance_status.gri_2_26_compliant ? (
                  <Badge variant="default">✓ Conforme</Badge>
                ) : (
                  <Badge variant="destructive">✗ Não Conforme</Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">ISO 37001 Compliant:</span>
                {data.compliance_status.iso_37001_compliant ? (
                  <Badge variant="default">✓ Conforme</Badge>
                ) : (
                  <Badge variant="destructive">✗ Não Conforme</Badge>
                )}
              </div>
              
              {data.compliance_status.missing_data.length > 0 && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Dados faltantes:</strong>
                    <ul className="list-disc ml-4 mt-1">
                      {data.compliance_status.missing_data.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benchmarks Setoriais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparação com Benchmarks Setoriais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Denúncias/100 funcionários:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {data.compliance_status.channel_utilization_rate.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (benchmark: {data.sector_benchmark.reports_per_100_employees})
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Tempo médio de resolução:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {data.resolution_metrics.avg_resolution_time_days.toFixed(0)} dias
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (benchmark: {data.sector_benchmark.typical_resolution_time_days} dias)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de resolução:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {data.resolution_metrics.resolution_rate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (benchmark: {data.sector_benchmark.typical_resolution_rate}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
