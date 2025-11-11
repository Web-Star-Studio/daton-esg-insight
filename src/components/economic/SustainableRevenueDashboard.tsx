/**
 * Sustainable Revenue Dashboard (GRI 201-1, 203-2)
 * Displays revenue from sustainable products/services with ESG ROI analysis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  Target,
  Award,
  BarChart3
} from "lucide-react";
import { SustainableRevenueResult } from "@/services/sustainableRevenueAnalysis";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface SustainableRevenueDashboardProps {
  data: SustainableRevenueResult;
  year: number;
}

const CATEGORY_COLORS = {
  'Energia Limpa': '#10b981',
  'Produtos Reciclados': '#3b82f6',
  'Economia Circular': '#8b5cf6',
  'Programas Sociais': '#f59e0b',
  'Serviços Sustentáveis': '#06b6d4',
  'Outros ESG': '#64748b'
};

export function SustainableRevenueDashboard({ data, year }: SustainableRevenueDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Prepare chart data
  const pieChartData = data.detailed_breakdown.map(item => ({
    name: item.category,
    value: item.revenue,
    percentage: item.percentage_of_esg_revenue
  }));

  // Generate alerts
  const alerts = [];
  
  if (data.sustainable_revenue_percentage < data.sector_benchmark.low) {
    alerts.push({
      severity: 'warning',
      title: 'Baixa Receita ESG',
      message: `Receita ESG (${data.sustainable_revenue_percentage.toFixed(1)}%) está abaixo do mínimo setorial (${data.sector_benchmark.low}%). Oportunidade de ampliar portfólio sustentável.`
    });
  }
  
  if (data.sustainable_revenue_percentage >= data.sector_benchmark.excellence) {
    alerts.push({
      severity: 'success',
      title: 'Excelência em Receita ESG',
      message: `${data.sustainable_revenue_percentage.toFixed(1)}% da receita vem de produtos/serviços sustentáveis. Destaque no setor!`
    });
  }
  
  if (data.sustainable_revenue_roi < 0) {
    alerts.push({
      severity: 'warning',
      title: 'ROI Negativo',
      message: `ROI de sustentabilidade negativo (${data.sustainable_revenue_roi.toFixed(1)}%). Investimentos ESG ainda não retornaram valor equivalente.`
    });
  }
  
  if (data.sustainable_revenue_roi > 100) {
    alerts.push({
      severity: 'success',
      title: 'ROI Excelente',
      message: `ROI de sustentabilidade de ${data.sustainable_revenue_roi.toFixed(1)}%! Investimentos ESG estão gerando retorno significativo.`
    });
  }
  
  if (!data.is_increasing && Math.abs(data.growth_percentage) > 10) {
    alerts.push({
      severity: 'error',
      title: 'Redução de Receita ESG',
      message: `Receita ESG reduziu ${Math.abs(data.growth_percentage).toFixed(1)}% vs período anterior. Avaliar causas e tomar ações corretivas.`
    });
  }
  
  if (data.sustainable_revenue_total === 0) {
    alerts.push({
      severity: 'error',
      title: 'Nenhuma Receita ESG',
      message: 'Nenhuma receita ESG registrada. Cadastrar produtos/serviços sustentáveis para cálculo automático e compliance GRI.'
    });
  }
  
  if (!data.gri_201_1_compliant || !data.gri_203_2_compliant) {
    alerts.push({
      severity: 'warning',
      title: 'Não Conforme GRI',
      message: 'Não conforme com GRI 201-1 ou 203-2. Completar dados de receita sustentável.'
    });
  }

  return (
    <div className="space-y-6">
      {/* Main Card - Total ESG Revenue */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Receita de Produtos/Serviços Sustentáveis (GRI 201-1, 203-2)
          </CardTitle>
          <CardDescription>
            Receita proveniente de produtos/serviços com benefícios ambientais ou sociais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total */}
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                R$ {formatCurrency(data.sustainable_revenue_total)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Receita ESG Total ({year})
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className="text-lg">
                  {data.sustainable_revenue_percentage.toFixed(1)}% da Receita Total
                </Badge>
                <Badge variant="secondary">{data.performance_level}</Badge>
                {data.is_above_sector_average && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Acima da Média Setorial ({data.sector_average_percentage.toFixed(1)}%)
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Progress Bar vs Sectoral Excellence */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso vs Excelência Setorial</span>
                <span className="font-semibold">
                  {data.sustainable_revenue_percentage.toFixed(1)}% / {data.sector_benchmark.excellence}%
                </span>
              </div>
              <Progress 
                value={(data.sustainable_revenue_percentage / data.sector_benchmark.excellence) * 100} 
                max={100}
                className="h-3"
              />
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                <div className="text-center">
                  <div>Baixo</div>
                  <div className="font-semibold">{data.sector_benchmark.low}%</div>
                </div>
                <div className="text-center">
                  <div>Típico</div>
                  <div className="font-semibold">{data.sector_benchmark.typical}%</div>
                </div>
                <div className="text-center">
                  <div>Alto</div>
                  <div className="font-semibold">{data.sector_benchmark.high}%</div>
                </div>
                <div className="text-center">
                  <div>Excelência</div>
                  <div className="font-semibold">{data.sector_benchmark.excellence}%</div>
                </div>
              </div>
            </div>
            
            {/* Comparison: ESG Revenue vs Total Revenue */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  R$ {formatCurrency(data.sustainable_revenue_total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receita ESG</p>
                <p className="text-xs text-green-600 font-semibold">
                  {data.sustainable_revenue_percentage.toFixed(1)}% do total
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">
                  R$ {formatCurrency(data.total_revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receita Total</p>
                <p className="text-xs text-gray-600 font-semibold">
                  100% (baseline)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ESG ROI Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            ROI de Sustentabilidade
          </CardTitle>
          <CardDescription>
            Retorno sobre Investimentos ESG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  R$ {formatCurrency(data.sustainable_revenue_total)}
                </div>
                <p className="text-xs text-muted-foreground">Receita ESG</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  R$ {formatCurrency(data.total_sustainable_investment)}
                </div>
                <p className="text-xs text-muted-foreground">Investimento ESG</p>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${data.sustainable_revenue_roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.sustainable_revenue_roi.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">ROI ESG</p>
              </div>
            </div>
            
            {/* Net ESG Value */}
            <div className="p-3 bg-blue-50 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">
                R$ {formatCurrency(data.net_esg_value)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor Líquido ESG (Receita - Investimento)
              </p>
            </div>
            
            {data.payback_period_years && data.payback_period_years < 10 && (
              <div className="p-3 bg-green-50 rounded text-center">
                <p className="text-sm">
                  <strong>Payback estimado:</strong> {data.payback_period_years.toFixed(1)} anos
                </p>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Fórmula:</strong> ROI = (Receita ESG - Investimento ESG) / Investimento ESG × 100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Category Breakdown */}
      {pieChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receita ESG por Categoria</CardTitle>
            <CardDescription>Distribuição da receita sustentável</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${formatCurrency(value)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Growth Card */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita ESG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Período Anterior:</span>
              <span className="font-bold">R$ {formatCurrency(data.previous_period_revenue)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Período Atual:</span>
              <span className="font-bold text-green-600">
                R$ {formatCurrency(data.sustainable_revenue_total)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t">
              <span>Crescimento:</span>
              <div className="flex items-center gap-2">
                {data.is_increasing ? (
                  <Badge variant="default" className="bg-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{data.growth_percentage.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {data.growth_percentage.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      {data.detailed_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria ESG</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Receita (R$)</TableHead>
                  <TableHead className="text-right">% da Receita ESG</TableHead>
                  <TableHead className="text-right">% da Receita Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.detailed_breakdown.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748b' }}
                      />
                      {item.category}
                    </TableCell>
                    <TableCell className="text-right">R$ {formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right">
                      {item.percentage_of_esg_revenue.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {((item.revenue / data.total_revenue) * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.map((alert, idx) => (
        <Alert 
          key={idx}
          variant={alert.severity === 'error' ? 'destructive' : 'default'}
          className={
            alert.severity === 'success' ? 'border-green-500 bg-green-50' :
            alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''
          }
        >
          {alert.severity === 'success' ? <Award className="h-4 w-4 text-green-600" /> :
           alert.severity === 'warning' ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
           <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}

      {/* GRI Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance GRI</CardTitle>
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
              <span className="text-sm">GRI 203-2 (Impactos Econômicos Indiretos):</span>
              {data.gri_203_2_compliant ? (
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
                <AlertDescription className="text-xs">
                  <strong>Dados faltantes:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    {data.missing_data.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
