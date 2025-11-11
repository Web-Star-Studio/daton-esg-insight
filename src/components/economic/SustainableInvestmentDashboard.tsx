import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  Target,
  Award
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { SustainableInvestmentResult } from "@/services/sustainableInvestmentAnalysis";
import { getSectorBenchmark, classifyInvestmentLevel } from "@/data/sustainableInvestmentBenchmarks";

interface SustainableInvestmentDashboardProps {
  data: SustainableInvestmentResult;
  year: number;
  sector?: string;
}

const ESG_COLORS = {
  Ambiental: '#10b981',
  Social: '#3b82f6',
  Governança: '#8b5cf6',
};

export function SustainableInvestmentDashboard({ data, year, sector }: SustainableInvestmentDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const benchmark = getSectorBenchmark(sector);
  const investmentLevel = classifyInvestmentLevel(data.investment_percentage_revenue, benchmark);

  // Preparar dados para gráfico de pizza ESG
  const esgData = [
    { name: 'Ambiental', value: data.environmental_investment, fill: ESG_COLORS.Ambiental },
    { name: 'Social', value: data.social_investment, fill: ESG_COLORS.Social },
    { name: 'Governança', value: data.governance_investment, fill: ESG_COLORS.Governança },
  ].filter(item => item.value > 0);

  // Alertas inteligentes
  const alerts = [];
  
  if (data.investment_percentage_revenue < benchmark.investment_percentage_revenue_low) {
    alerts.push({
      severity: 'warning' as const,
      message: `Investimento em ESG (${data.investment_percentage_revenue.toFixed(2)}% da receita) está abaixo do mínimo setorial (${benchmark.investment_percentage_revenue_low}%). Considerar aumentar investimentos.`
    });
  }
  
  if (data.investment_percentage_revenue > benchmark.investment_percentage_revenue_high) {
    alerts.push({
      severity: 'success' as const,
      message: `✅ Investimento em ESG (${data.investment_percentage_revenue.toFixed(2)}% da receita) está acima da média setorial! Excelente compromisso com sustentabilidade.`
    });
  }
  
  if (data.total_projects_count === 0) {
    alerts.push({
      severity: 'error' as const,
      message: `⚠️ Nenhum projeto ESG registrado. Cadastrar projetos sociais, ambientais ou de governança para cálculo automático.`
    });
  }
  
  if (!data.gri_201_1_compliant || !data.gri_203_1_compliant) {
    alerts.push({
      severity: 'warning' as const,
      message: `⚠️ Não conforme com GRI 201-1 ou 203-1. Completar dados de investimentos sustentáveis.`
    });
  }
  
  if (!data.is_increasing && Math.abs(data.investment_growth_percentage) > 10) {
    alerts.push({
      severity: 'warning' as const,
      message: `Investimentos sustentáveis reduziram ${Math.abs(data.investment_growth_percentage).toFixed(1)}% vs período anterior. Avaliar impacto na estratégia ESG.`
    });
  }

  const capexRatio = data.capex_percentage / 100;
  if (data.total_sustainable_investment > 0 && Math.abs(capexRatio - benchmark.capex_opex_ratio) > 0.2) {
    alerts.push({
      severity: 'info' as const,
      message: `Razão CAPEX/OPEX (${capexRatio.toFixed(2)}) difere do típico setorial (${benchmark.capex_opex_ratio}). Verificar se a distribuição está alinhada com a estratégia.`
    });
  }

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Investimentos em Projetos Sustentáveis (GRI 201-1, 203-1)
          </CardTitle>
          <CardDescription>
            Total de CAPEX e OPEX destinados a iniciativas ESG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total */}
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                {formatCurrency(data.total_sustainable_investment)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total Investido em Projetos ESG ({data.total_projects_count} projetos)
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline">
                  {data.investment_percentage_revenue.toFixed(2)}% da Receita
                </Badge>
                <Badge 
                  variant={investmentLevel === 'Excelente' || investmentLevel === 'Bom' ? 'default' : 'secondary'}
                  className={
                    investmentLevel === 'Excelente' ? 'bg-green-600' :
                    investmentLevel === 'Bom' ? 'bg-blue-600' :
                    investmentLevel === 'Adequado' ? 'bg-yellow-600' :
                    investmentLevel === 'Atenção' ? 'bg-orange-600' :
                    'bg-red-600'
                  }
                >
                  {investmentLevel}
                </Badge>
                {data.is_above_sector_average && (
                  <Badge variant="default" className="bg-green-600">
                    <Award className="h-3 w-3 mr-1" />
                    Acima da Média Setorial
                  </Badge>
                )}
              </div>
            </div>
            
            {/* CAPEX vs OPEX */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(data.capex_sustainable)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">CAPEX</p>
                <p className="text-xs text-blue-600 font-semibold">
                  {data.capex_percentage.toFixed(1)}% do total
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Infraestrutura, Equipamentos, Ativos Fixos
                </p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(data.opex_sustainable)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">OPEX</p>
                <p className="text-xs text-orange-600 font-semibold">
                  {data.opex_percentage.toFixed(1)}% do total
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Operações, Manutenção, Treinamentos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert 
              key={index}
              variant={alert.severity === 'error' ? 'destructive' : 'default'}
              className={
                alert.severity === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                alert.severity === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
                ''
              }
            >
              {alert.severity === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Categoria ESG */}
        {esgData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria ESG</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={esgData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${((entry.value / data.total_sustainable_investment) * 100).toFixed(1)}%`}
                  >
                    {esgData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 border rounded">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(data.environmental_investment)}
                  </div>
                  <div className="text-xs text-muted-foreground">Ambiental</div>
                </div>
                <div className="text-center p-2 border rounded">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(data.social_investment)}
                  </div>
                  <div className="text-xs text-muted-foreground">Social</div>
                </div>
                <div className="text-center p-2 border rounded">
                  <div className="text-sm font-semibold text-purple-600">
                    {formatCurrency(data.governance_investment)}
                  </div>
                  <div className="text-xs text-muted-foreground">Governança</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evolução dos Investimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos Investimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Período Anterior:</span>
                <span className="font-bold">{formatCurrency(data.previous_period_investment)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Período Atual:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(data.total_sustainable_investment)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-semibold">Crescimento:</span>
                <div className="flex items-center gap-2">
                  {data.is_increasing ? (
                    <Badge variant="default" className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{data.investment_growth_percentage.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {data.investment_growth_percentage.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Status dos Projetos</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-xl font-bold">{data.total_projects_count}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-xl font-bold text-green-600">{data.active_projects_count}</div>
                    <div className="text-xs text-muted-foreground">Ativos</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-xl font-bold text-blue-600">{data.completed_projects_count}</div>
                    <div className="text-xs text-muted-foreground">Concluídos</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras - Tipo de Projeto */}
      {data.by_project_type.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Investimentos por Tipo de Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.by_project_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="investment" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela Detalhada */}
      {data.by_project_type.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Projetos ESG</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Projeto</TableHead>
                  <TableHead>Categoria ESG</TableHead>
                  <TableHead className="text-right">Projetos</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_project_type.map((project, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{project.type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: ESG_COLORS[project.category],
                          color: ESG_COLORS[project.category]
                        }}
                      >
                        {project.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{project.projects_count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(project.investment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {project.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Compliance GRI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Compliance GRI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">GRI 201-1 (Desempenho Econômico):</span>
              {data.gri_201_1_compliant ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conforme
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Não Conforme
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">GRI 203-1 (Impactos Econômicos Indiretos):</span>
              {data.gri_203_1_compliant ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conforme
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Não Conforme
                </Badge>
              )}
            </div>
            
            {data.missing_data.length > 0 && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Dados Faltantes</AlertTitle>
                <AlertDescription className="text-xs">
                  <ul className="list-disc ml-4 mt-1">
                    {data.missing_data.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Setorial */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Benchmark Setorial ({benchmark.sector})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-semibold text-muted-foreground">Mínimo</div>
              <div>{benchmark.investment_percentage_revenue_low}% da receita</div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Típico</div>
              <div>{benchmark.investment_percentage_revenue_typical}% da receita</div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground">Excelente</div>
              <div>{benchmark.investment_percentage_revenue_high}% da receita</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Fonte: {benchmark.source}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
