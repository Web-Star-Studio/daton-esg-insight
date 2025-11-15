import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetManagement } from '@/services/budgetManagement';
import { cashFlowService } from '@/services/cashFlowService';
import { financialReports } from '@/services/financialReports';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ESGCostCenterToggle } from '@/components/financial/ESGCostCenterToggle';
import { FinancialAlertsPanel } from '@/components/financial/FinancialAlertsPanel';

export default function DashboardFinanceiro() {
  const [esgCostCenterEnabled, setEsgCostCenterEnabled] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary', currentYear],
    queryFn: () => budgetManagement.getBudgetSummary(currentYear),
  });

  const { data: cashFlowSummary } = useQuery({
    queryKey: ['cashflow-summary', currentMonth, currentYear],
    queryFn: () => cashFlowService.getCashFlowSummary(currentMonth, currentYear),
  });

  const { data: dre } = useQuery({
    queryKey: ['dre', currentYear, currentMonth],
    queryFn: () => financialReports.getDRE(currentYear, currentMonth),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-comparison', currentYear],
    queryFn: () => financialReports.getMonthlyComparison(currentYear),
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">Visão geral consolidada das finanças</p>
      </div>

      <ESGCostCenterToggle 
        onToggle={setEsgCostCenterEnabled}
        defaultEnabled={esgCostCenterEnabled}
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashFlowSummary?.monthlyInflows.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              +{dre?.margemBruta.toFixed(1)}% margem bruta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashFlowSummary?.monthlyOutflows.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary?.executionRate.toFixed(1)}% do orçamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dre?.lucroLiquido.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {dre?.margemLiquida.toFixed(1)}% margem líquida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashFlowSummary?.netCashFlow.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo projetado: {cashFlowSummary?.projectedBalance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {budgetSummary && budgetSummary.criticalCategories.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {budgetSummary.criticalCategories.length} categoria(s) com mais de 80% do orçamento utilizado.
          </AlertDescription>
        </Alert>
      )}

      {cashFlowSummary && (cashFlowSummary.overduePayables > 0 || cashFlowSummary.overdueReceivables > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {cashFlowSummary.overduePayables > 0 && (
              <div>Contas a pagar vencidas: {cashFlowSummary.overduePayables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            )}
            {cashFlowSummary.overdueReceivables > 0 && (
              <div>Contas a receber vencidas: {cashFlowSummary.overdueReceivables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Financial Alerts Panel */}
      <FinancialAlertsPanel />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" name="Receitas" />
                <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" name="Despesas" />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--success))" name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias Críticas - Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetSummary?.criticalCategories || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" name="% Utilizado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
