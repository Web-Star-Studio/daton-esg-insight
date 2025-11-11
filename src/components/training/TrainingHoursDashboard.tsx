import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Clock, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle2, BookOpen, Award } from "lucide-react";
import type { TrainingHoursResult } from "@/services/trainingHoursAnalysis";

interface TrainingHoursDashboardProps {
  data: TrainingHoursResult;
  year: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export function TrainingHoursDashboard({ data, year }: TrainingHoursDashboardProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Excelente': return 'default';
      case 'Bom': return 'secondary';
      case 'Atenção': return 'outline';
      case 'Crítico': return 'destructive';
      default: return 'outline';
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  // Preparar dados de gênero para gráfico
  const genderChartData = [
    { name: 'Homens', hours: data.by_gender.men.avg_hours, count: data.by_gender.men.employee_count },
    { name: 'Mulheres', hours: data.by_gender.women.avg_hours, count: data.by_gender.women.employee_count },
    { name: 'Outros', hours: data.by_gender.other.avg_hours, count: data.by_gender.other.employee_count }
  ].filter(item => item.count > 0);

  // Smart Alerts
  const alerts = [];

  if (data.performance_classification === 'Crítico') {
    alerts.push({
      type: 'destructive',
      message: `🔴 CRÍTICO: Média abaixo de 60% do benchmark setorial (${data.sector_benchmark}h). Urgente: revisar política de treinamento.`
    });
  }

  if (data.employees_without_training.percentage > 20) {
    alerts.push({
      type: 'warning',
      message: `⚠️ ATENÇÃO: ${data.employees_without_training.percentage}% dos funcionários sem treinamento no período. Planejar ações de capacitação.`
    });
  }

  if (data.comparison.is_improving && data.comparison.change_percentage > 20) {
    alerts.push({
      type: 'success',
      message: `✅ EXCELENTE: Aumento de ${data.comparison.change_percentage.toFixed(1)}% em horas de treinamento vs. período anterior!`
    });
  }

  if (data.data_quality === 'low') {
    alerts.push({
      type: 'warning',
      message: `📊 Qualidade de dados baixa: ${data.data_completeness_percent}% dos treinamentos têm duração registrada. Atualizar registros.`
    });
  }

  if (!data.gri_404_1_compliance.is_compliant) {
    alerts.push({
      type: 'warning',
      message: `⚠️ GRI 404-1 não conforme: Dados insuficientes para reporte. Ver recomendações abaixo.`
    });
  }

  return (
    <div className="space-y-6">
      {/* Header com métrica principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Média de Horas de Treinamento por Colaborador
              </CardTitle>
              <CardDescription>GRI 404-1 | ISO 30414 - Análise de {year}</CardDescription>
            </div>
            <Badge variant={getClassificationColor(data.performance_classification)}>
              {data.performance_classification}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-4xl font-bold text-primary">
                {data.average_hours_per_employee}h
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Média por funcionário
              </p>
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {data.total_training_hours.toLocaleString()}h
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total de horas ministradas
              </p>
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {data.total_employees}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Funcionários ativos
              </p>
            </div>
            <div>
              <div className="text-2xl font-semibold flex items-center gap-1">
                {data.comparison.is_improving ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                {Math.abs(data.comparison.change_percentage)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                vs. período anterior
              </p>
            </div>
          </div>

          {/* Comparação com benchmark */}
          <div className="mt-4 p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Comparação com Benchmark Setorial</span>
              <span className="text-sm text-muted-foreground">{data.sector_benchmark}h</span>
            </div>
            <Progress 
              value={Math.min((data.average_hours_per_employee / data.sector_benchmark) * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {data.performance_vs_benchmark > 0 ? '+' : ''}{data.performance_vs_benchmark.toFixed(1)}% 
              {data.performance_vs_benchmark > 0 ? ' acima' : ' abaixo'} do benchmark
            </p>
          </div>

          {/* Qualidade de dados */}
          <div className="mt-3">
            <span className="text-sm font-medium">Qualidade dos Dados: </span>
            <span className={`text-sm font-semibold ${getDataQualityColor(data.data_quality)}`}>
              {data.data_quality === 'high' ? 'Alta' : data.data_quality === 'medium' ? 'Média' : 'Baixa'}
            </span>
            <span className="text-sm text-muted-foreground ml-2">
              ({data.data_completeness_percent}% dos treinamentos com duração registrada)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Alertas inteligentes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Alert key={idx} variant={alert.type as any}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Breakdown por Gênero */}
      {genderChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Breakdown por Gênero (GRI 404-1)
            </CardTitle>
            <CardDescription>Média de horas de treinamento por gênero</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genderChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="hsl(var(--primary))" name="Média de Horas" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {genderChartData.map((item, idx) => (
                <div key={idx} className="text-center p-2 border rounded">
                  <div className="text-lg font-semibold">{item.hours.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.count} funcionários</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown por Departamento */}
      {data.by_department.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown por Departamento</CardTitle>
            <CardDescription>Top 10 departamentos por média de horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.by_department.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Média de Horas', position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="department" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="avg_hours" fill="hsl(var(--secondary))" name="Média de Horas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Breakdown por Categoria */}
      {data.by_category.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Breakdown por Categoria de Treinamento
            </CardTitle>
            <CardDescription>Distribuição de horas por tipo de treinamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.by_category}
                    dataKey="total_hours"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category}: ${entry.percentage_of_total.toFixed(1)}%`}
                  >
                    {data.by_category.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.by_category.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm font-medium">{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{cat.total_hours.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">{cat.training_count} treinamentos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Obrigatórios vs Opcionais */}
      <Card>
        <CardHeader>
          <CardTitle>Treinamentos Obrigatórios vs Opcionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Obrigatórios</div>
              <div className="text-2xl font-bold">{data.mandatory_vs_optional.mandatory.total_hours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground mt-1">
                {data.mandatory_vs_optional.mandatory.percentage.toFixed(1)}% do total
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.mandatory_vs_optional.mandatory.training_count} treinamentos
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Opcionais</div>
              <div className="text-2xl font-bold">{data.mandatory_vs_optional.optional.total_hours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground mt-1">
                {data.mandatory_vs_optional.optional.percentage.toFixed(1)}% do total
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.mandatory_vs_optional.optional.training_count} treinamentos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tendência Mensal */}
      {data.monthly_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal de Treinamentos</CardTitle>
            <CardDescription>Evolução das horas de treinamento ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_hours_per_employee" stroke="hsl(var(--primary))" name="Média Horas/Funcionário" />
                <Line type="monotone" dataKey="trainings_completed" stroke="hsl(var(--secondary))" name="Treinamentos Concluídos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gaps de Treinamento */}
      {data.employees_without_training.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Gaps de Treinamento
            </CardTitle>
            <CardDescription>
              {data.employees_without_training.count} funcionários ({data.employees_without_training.percentage}%) sem treinamento no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.employees_without_training.employee_list.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-muted-foreground">{emp.department}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Contratado: {new Date(emp.hire_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {data.top_10_employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top 10 Funcionários
            </CardTitle>
            <CardDescription>Colaboradores com mais horas de treinamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.top_10_employees.map((emp, idx) => (
                <div key={emp.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="font-medium">{emp.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{emp.total_hours.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">{emp.trainings_completed} treinamentos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRI 404-1 Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.gri_404_1_compliance.is_compliant ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            GRI 404-1 Compliance
          </CardTitle>
          <CardDescription>
            Status: {data.gri_404_1_compliance.is_compliant ? 'Conforme' : 'Não Conforme'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data.gri_404_1_compliance.is_compliant && (
            <div className="space-y-4">
              {data.gri_404_1_compliance.missing_data.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Dados Faltantes:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {data.gri_404_1_compliance.missing_data.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.gri_404_1_compliance.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recomendações:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {data.gri_404_1_compliance.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {data.gri_404_1_compliance.is_compliant && (
            <p className="text-sm text-muted-foreground">
              Todos os requisitos GRI 404-1 foram atendidos. Dados prontos para reporte de sustentabilidade.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nota Metodológica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nota Metodológica</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p><strong>GRI 404-1:</strong> Média de horas de treinamento por ano por funcionário</p>
          <p><strong>ISO 30414:</strong> Capital Humano - Desenvolvimento e Formação</p>
          <p><strong>Fórmula:</strong> Total de Horas de Treinamento / Número de Colaboradores</p>
          <p><strong>Fontes:</strong> training_programs, employee_trainings, employees</p>
          <p><strong>Benchmark:</strong> {data.sector_benchmark}h (setor geral - OIT)</p>
          <p><strong>Calculado em:</strong> {new Date(data.calculation_date).toLocaleString('pt-BR')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
