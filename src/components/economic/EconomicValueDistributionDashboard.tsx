import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  DollarSign, 
  Heart, 
  ShoppingCart,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { EconomicValueDistributionResult } from "@/services/economicValueDistribution";

interface EconomicValueDistributionDashboardProps {
  data: EconomicValueDistributionResult;
  year: number;
}

export function EconomicValueDistributionDashboard({ data, year }: EconomicValueDistributionDashboardProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Alertas inteligentes
  const alerts = [];
  
  if (data.retained.value < 0) {
    alerts.push({
      severity: 'error',
      message: `🔴 ATENÇÃO: Valor Econômico Retido negativo (R$ ${formatCurrency(Math.abs(data.retained.value))}). A empresa distribuiu mais valor do que gerou, indicando possível descapitalização.`
    });
  }
  
  if (data.retained.percentage_of_generated > 50) {
    alerts.push({
      severity: 'warning',
      message: `⚠️ Valor Retido muito alto (${data.retained.percentage_of_generated.toFixed(1)}%). Avaliar se a distribuição para stakeholders está adequada.`
    });
  }
  
  if (data.distribution_percentage.community < 0.5) {
    alerts.push({
      severity: 'info',
      message: `💡 Investimentos na comunidade representam apenas ${data.distribution_percentage.community.toFixed(2)}% do valor gerado. Considerar ampliar investimentos sociais.`
    });
  }
  
  if (data.distribution_percentage.government > 30) {
    alerts.push({
      severity: 'warning',
      message: `⚠️ Carga tributária elevada: ${data.distribution_percentage.government.toFixed(1)}% do valor gerado vai para impostos.`
    });
  }
  
  if (!data.gri_201_1_compliant) {
    alerts.push({
      severity: 'error',
      message: `🔴 GRI 201-1 não conforme (${data.completeness_percentage.toFixed(0)}% completo). Completar dados obrigatórios para compliance.`
    });
  }
  
  if (data.growth.deg_percentage < -10) {
    alerts.push({
      severity: 'error',
      message: `🔴 Valor Econômico Gerado reduziu ${Math.abs(data.growth.deg_percentage).toFixed(1)}% vs período anterior. Avaliar causas da queda de receita.`
    });
  }
  
  if (data.distribution_percentage.community > 2 && data.distribution_percentage.employees > 25) {
    alerts.push({
      severity: 'success',
      message: `✅ Excelente distribuição de valor! ${data.distribution_percentage.employees.toFixed(1)}% para empregados e ${data.distribution_percentage.community.toFixed(1)}% para comunidade.`
    });
  }

  const pieData = [
    { name: 'Custos Operacionais', value: data.distributed.operational_costs.total, fill: 'hsl(var(--chart-1))', percentage: data.distribution_percentage.operational_costs },
    { name: 'Empregados', value: data.distributed.employees.total, fill: 'hsl(var(--chart-2))', percentage: data.distribution_percentage.employees },
    { name: 'Governo', value: data.distributed.government.total, fill: 'hsl(var(--chart-3))', percentage: data.distribution_percentage.government },
    { name: 'Provedores de Capital', value: data.distributed.capital_providers.total, fill: 'hsl(var(--chart-4))', percentage: data.distribution_percentage.capital_providers },
    { name: 'Comunidade', value: data.distributed.community.total, fill: 'hsl(var(--chart-5))', percentage: data.distribution_percentage.community },
    { name: 'Valor Retido', value: data.retained.value, fill: 'hsl(var(--muted))', percentage: data.retained.percentage_of_generated }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {alerts.map((alert, index) => (
        <Alert key={index} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}

      {/* Card Principal - Visão Geral DVA */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            GRI 201-1: Valor Econômico Gerado e Distribuído (DVA)
          </CardTitle>
          <CardDescription>
            Demonstração de como a empresa cria e distribui valor para stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                R$ {formatCurrency(data.generated.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Valor Econômico Gerado (DEG)
              </p>
              <Badge variant="outline" className="mt-2">
                100% Base
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                R$ {formatCurrency(data.distributed.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Valor Econômico Distribuído (DED)
              </p>
              <Badge variant="outline" className="mt-2">
                {(100 - data.retained.percentage_of_generated).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                R$ {formatCurrency(data.retained.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Valor Econômico Retido (VER)
              </p>
              <Badge variant="outline" className="mt-2">
                {data.retained.percentage_of_generated.toFixed(1)}% do total
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded text-center text-sm text-muted-foreground">
            <strong>Fórmula:</strong> VER = DEG - DED | 
            R$ {formatCurrency(data.retained.value)} = 
            R$ {formatCurrency(data.generated.total)} - 
            R$ {formatCurrency(data.distributed.total)}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza e Tabela */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Valor por Stakeholder</CardTitle>
            <CardDescription>
              Como o valor econômico foi distribuído entre diferentes grupos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.percentage.toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`R$ ${formatCurrency(value)}`, 'Valor']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stakeholder_ranking.slice(0, 6).map((stakeholder, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1} {stakeholder.stakeholder}</TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {formatCurrency(stakeholder.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {stakeholder.percentage.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cards Detalhados - Breakdown por Categoria */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Custos Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Matérias-primas:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.operational_costs.raw_materials)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fornecedores:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.operational_costs.suppliers)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outros custos:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.operational_costs.other)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-orange-600 dark:text-orange-400">R$ {formatCurrency(data.distributed.operational_costs.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empregados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Salários:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.employees.salaries)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Benefícios:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.employees.benefits)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-blue-600 dark:text-blue-400">R$ {formatCurrency(data.distributed.employees.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Governo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Imposto de Renda:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.government.income_taxes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Impostos sobre vendas:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.government.sales_taxes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Encargos sobre folha:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.government.payroll_taxes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outros impostos:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.government.other_taxes)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-green-600 dark:text-green-400">R$ {formatCurrency(data.distributed.government.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Provedores de Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Juros:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.capital_providers.interest_payments)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dividendos:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.capital_providers.dividends)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amortizações:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.capital_providers.loan_repayments)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-purple-600 dark:text-purple-400">R$ {formatCurrency(data.distributed.capital_providers.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Comunidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Doações:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.community.donations)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Patrocínios:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.community.sponsorships)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Infraestrutura:</span>
                <span className="font-semibold">R$ {formatCurrency(data.distributed.community.infrastructure)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-cyan-600 dark:text-cyan-400">R$ {formatCurrency(data.distributed.community.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução vs Período Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>DEG:</span>
                <Badge variant={data.growth.deg_percentage > 0 ? "default" : "destructive"} className="gap-1">
                  {data.growth.deg_percentage > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.growth.deg_percentage > 0 ? "+" : ""}{data.growth.deg_percentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>DED:</span>
                <Badge variant={data.growth.ded_percentage > 0 ? "default" : "destructive"} className="gap-1">
                  {data.growth.ded_percentage > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.growth.ded_percentage > 0 ? "+" : ""}{data.growth.ded_percentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>VER:</span>
                <Badge variant={data.growth.ver_percentage > 0 ? "default" : "destructive"} className="gap-1">
                  {data.growth.ver_percentage > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.growth.ver_percentage > 0 ? "+" : ""}{data.growth.ver_percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Compliance GRI 201-1 */}
      <Card className={data.gri_201_1_compliant ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.gri_201_1_compliant ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Compliance GRI 201-1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Completude dos Dados:</span>
                <span className="text-sm font-bold">{data.completeness_percentage.toFixed(0)}%</span>
              </div>
              <Progress 
                value={data.completeness_percentage} 
                className="h-3"
              />
            </div>
            
            <div className="flex items-center justify-center">
              {data.gri_201_1_compliant ? (
                <Badge className="bg-green-600">
                  ✓ GRI 201-1 CONFORME
                </Badge>
              ) : (
                <Badge variant="destructive">
                  ✗ GRI 201-1 NÃO CONFORME
                </Badge>
              )}
            </div>
            
            {data.missing_data.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Dados Faltantes para Compliance:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc ml-4 mt-2 text-xs">
                    {data.missing_data.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {data.gri_201_1_compliant && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Todos os componentes obrigatórios do GRI 201-1 foram preenchidos. 
                  O relatório está pronto para publicação.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
