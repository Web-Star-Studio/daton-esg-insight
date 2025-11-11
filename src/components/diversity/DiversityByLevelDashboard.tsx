import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import type { DiversityByLevelResult } from "@/services/diversityByLevelAnalysis";

interface DiversityByLevelDashboardProps {
  data: DiversityByLevelResult;
  year: number;
}

const GENDER_COLORS = {
  women: 'hsl(var(--chart-1))',
  men: 'hsl(var(--chart-2))',
  other: 'hsl(var(--chart-3))'
};

const ETHNICITY_COLORS = {
  Branco: 'hsl(var(--chart-1))',
  Preto: 'hsl(var(--chart-2))',
  Pardo: 'hsl(var(--chart-3))',
  Amarelo: 'hsl(var(--chart-4))',
  Indígena: 'hsl(var(--chart-5))',
  'Não declarado': 'hsl(var(--muted))'
};

export function DiversityByLevelDashboard({ data, year }: DiversityByLevelDashboardProps) {
  // Prepare data for charts
  const hierarchyChartData = data.by_hierarchy_level.map(level => ({
    level: level.level,
    Mulheres: level.women_percentage,
    Homens: level.men_percentage,
    Outros: level.other_gender_percentage
  }));

  const pipelineChartData = data.pipeline_analysis.funnel.map(item => ({
    level: item.level,
    'Mulheres (%)': item.women_percentage,
    'PCD (%)': item.pcd_percentage,
    'Minorias (%)': item.minorities_percentage
  }));

  // Ethnicity distribution (total)
  const totalEthnicity = data.by_hierarchy_level.reduce((acc, level) => {
    acc.Branco += level.white_count;
    acc.Preto += level.black_count;
    acc.Pardo += level.brown_count;
    acc.Amarelo += level.asian_count;
    acc.Indígena += level.indigenous_count;
    acc['Não declarado'] += level.not_declared_count;
    return acc;
  }, { Branco: 0, Preto: 0, Pardo: 0, Amarelo: 0, Indígena: 0, 'Não declarado': 0 });

  const ethnicityPieData = Object.entries(totalEthnicity)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  // Generate alerts
  const alerts = [];

  // C-Level diversity
  const cLevelData = data.by_hierarchy_level.find(l => l.level === 'C-Level');
  if (cLevelData && cLevelData.women_percentage < 20) {
    alerts.push({
      severity: 'error' as const,
      icon: AlertTriangle,
      message: `CRÍTICO: C-Level com apenas ${cLevelData.women_percentage.toFixed(1)}% de mulheres. Meta ESG: ≥30% até 2030.`
    });
  }

  // Quota law
  if (!data.quota_law_compliance.is_compliant) {
    alerts.push({
      severity: 'error' as const,
      icon: AlertTriangle,
      message: `LEGAL: Não cumprimento da Lei 8.213/91. Faltam ${data.quota_law_compliance.missing_pcd_hires} contratações de PCD (cota: ${(data.quota_law_compliance.required_pcd_percentage * 100).toFixed(0)}%).`
    });
  }

  // Leadership gap
  if (data.pipeline_analysis.leadership_diversity_gap > 30) {
    alerts.push({
      severity: 'warning' as const,
      icon: AlertTriangle,
      message: `Gap de diversidade de ${data.pipeline_analysis.leadership_diversity_gap.toFixed(1)}% entre liderança e base operacional.`
    });
  }

  // Pay equity
  if (data.pay_equity_preview.has_significant_gap) {
    alerts.push({
      severity: 'warning' as const,
      icon: AlertTriangle,
      message: `Gap salarial de ${data.pay_equity_preview.pay_gap_percentage.toFixed(1)}% entre homens e mulheres. Revisar política salarial (GRI 405-2).`
    });
  }

  // Improvement
  if (data.comparison.is_improving && data.comparison.change_women_percentage > 5) {
    alerts.push({
      severity: 'success' as const,
      icon: CheckCircle2,
      message: `✅ Aumento de ${data.comparison.change_women_percentage.toFixed(1)}% na representação feminina vs. período anterior!`
    });
  }

  // Data completeness
  if (!data.gri_405_1_compliance.breakdown_complete) {
    alerts.push({
      severity: 'info' as const,
      icon: Info,
      message: 'Dados incompletos: Preencher campos gender e ethnicity para >90% dos funcionários (compliance GRI 405-1).'
    });
  }

  const getPerformanceBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'Excelente': return 'default';
      case 'Bom': return 'secondary';
      case 'Atenção': return 'outline';
      case 'Crítico': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Diversidade por Nível Hierárquico (GRI 405-1)
              </CardTitle>
              <CardDescription>
                Análise completa de diversidade na estrutura organizacional - Ano {year}
              </CardDescription>
            </div>
            <Badge variant={getPerformanceBadgeVariant(data.performance_classification)}>
              {data.performance_classification}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mulheres</span>
                {data.comparison.change_women_percentage !== 0 && (
                  <span className={`text-xs flex items-center gap-1 ${data.comparison.change_women_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.comparison.change_women_percentage > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(data.comparison.change_women_percentage).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-pink-600">
                {data.women_percentage.toFixed(1)}%
              </div>
              <Progress value={data.women_percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.total_women} de {data.total_employees} funcionários
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">PCD</span>
                <Badge variant={data.quota_law_compliance.is_compliant ? 'default' : 'destructive'} className="text-xs">
                  Lei 8.213/91
                </Badge>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {data.pcd_percentage.toFixed(1)}%
              </div>
              <Progress value={data.pcd_percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.total_pcd} funcionários PCD | Cota: {(data.quota_law_compliance.required_pcd_percentage * 100).toFixed(0)}%
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Minorias Étnicas</span>
              <div className="text-3xl font-bold text-blue-600">
                {data.minorities_percentage.toFixed(1)}%
              </div>
              <Progress value={data.minorities_percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.total_minorities_ethnicity} funcionários (Preto, Pardo, Amarelo, Indígena)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
              <alert.icon className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Diversity by Hierarchy Level - Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Gênero por Nível Hierárquico</CardTitle>
          <CardDescription>Breakdown de diversidade em cada nível da organização</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hierarchyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Mulheres" stackId="a" fill={GENDER_COLORS.women} />
              <Bar dataKey="Homens" stackId="a" fill={GENDER_COLORS.men} />
              <Bar dataKey="Outros" stackId="a" fill={GENDER_COLORS.other} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Pipeline de Talentos</CardTitle>
          <CardDescription>
            Visualização da diversidade ao longo da hierarquia organizacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pipelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Mulheres (%)" stroke={GENDER_COLORS.women} strokeWidth={2} />
              <Line type="monotone" dataKey="PCD (%)" stroke={GENDER_COLORS.other} strokeWidth={2} />
              <Line type="monotone" dataKey="Minorias (%)" stroke={GENDER_COLORS.men} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

          {/* Leadership Gap */}
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="font-medium">Gap de Diversidade na Liderança:</span>
              <span className={`text-xl font-bold ${data.pipeline_analysis.leadership_diversity_gap > 20 ? 'text-red-600' : 'text-green-600'}`}>
                {data.pipeline_analysis.leadership_diversity_gap.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Diferença entre diversidade na base operacional vs. liderança (C-Level + Diretoria)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detailed Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Breakdown Detalhado por Nível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nível</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Mulheres</th>
                    <th className="text-right py-2">PCD</th>
                    <th className="text-right py-2">Minorias</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_hierarchy_level.map((level) => (
                    <tr key={level.level} className="border-b">
                      <td className="py-2 font-medium">{level.level}</td>
                      <td className="text-right">{level.total_employees}</td>
                      <td className="text-right">
                        {level.women_count} ({level.women_percentage.toFixed(1)}%)
                      </td>
                      <td className="text-right">
                        {level.pcd_count} ({level.pcd_percentage.toFixed(1)}%)
                      </td>
                      <td className="text-right">
                        {(level.black_count + level.brown_count + level.asian_count + level.indigenous_count)} ({(level.black_percentage + level.brown_percentage + level.asian_percentage + level.indigenous_percentage).toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pay Equity (GRI 405-2) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Equidade Salarial (GRI 405-2)</span>
              <Badge variant="outline">Preview</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Salário médio mulheres:</span>
              <span className="font-bold">R$ {data.pay_equity_preview.avg_salary_women.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Salário médio homens:</span>
              <span className="font-bold">R$ {data.pay_equity_preview.avg_salary_men.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Gap salarial:</span>
                <span className={`text-xl font-bold ${data.pay_equity_preview.has_significant_gap ? 'text-red-600' : 'text-green-600'}`}>
                  {data.pay_equity_preview.pay_gap_percentage.toFixed(1)}%
                </span>
              </div>
              {data.pay_equity_preview.has_significant_gap && (
                <Badge variant="destructive" className="mt-2 w-full justify-center">
                  Gap significativo (&gt;10%)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ethnicity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Étnica Total</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ethnicityPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / data.total_employees) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ethnicityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ETHNICITY_COLORS[entry.name as keyof typeof ETHNICITY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top/Bottom Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Top 5 Departamentos Diversos</CardTitle>
            <CardDescription>Maior índice de diversidade (Simpson Index)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_5_diverse_departments.map((dept, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{dept.department}</span>
                    <Badge variant="default">{dept.diversity_score.toFixed(0)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dept.women_percentage.toFixed(1)}% mulheres | {dept.pcd_percentage.toFixed(1)}% PCD | {dept.minorities_percentage.toFixed(1)}% minorias
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Departamentos que Precisam de Atenção</CardTitle>
            <CardDescription>Menor índice de diversidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.bottom_5_diverse_departments.map((dept, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{dept.department}</span>
                    <Badge variant="outline">{dept.diversity_score.toFixed(0)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dept.women_percentage.toFixed(1)}% mulheres | {dept.pcd_percentage.toFixed(1)}% PCD | {dept.minorities_percentage.toFixed(1)}% minorias
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRI Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status de Compliance GRI 405-1</span>
            <Badge variant={data.gri_405_1_compliance.is_compliant ? 'default' : 'secondary'}>
              {data.gri_405_1_compliance.is_compliant ? 'Conforme' : 'Não Conforme'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.gri_405_1_compliance.missing_data.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Dados Faltantes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.gri_405_1_compliance.missing_data.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.gri_405_1_compliance.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recomendações:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.gri_405_1_compliance.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.gri_405_1_compliance.is_compliant && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Todos os requisitos GRI 405-1 atendidos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
