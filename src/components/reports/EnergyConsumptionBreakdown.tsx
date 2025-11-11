import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Zap, Leaf, TrendingUp, Database } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EnergyConsumptionResult } from "@/services/integratedReportsHelpers";

interface EnergyConsumptionBreakdownProps {
  data: EnergyConsumptionResult;
}

const COLORS = {
  renewable: 'hsl(var(--chart-2))',
  nonRenewable: 'hsl(var(--chart-1))',
  electricity: 'hsl(var(--chart-3))',
  fuel: 'hsl(var(--chart-4))',
  thermal: 'hsl(var(--chart-5))'
};

export function EnergyConsumptionBreakdown({ data }: EnergyConsumptionBreakdownProps) {
  // Dados para gráfico de pizza (Renovável vs Não Renovável)
  const renewabilityData = [
    { name: 'Renovável', value: data.renewable_kwh, color: COLORS.renewable },
    { name: 'Não Renovável', value: data.non_renewable_kwh, color: COLORS.nonRenewable }
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras (Por Categoria)
  const categoryData = [
    { name: 'Eletricidade', value: data.electricity_kwh, color: COLORS.electricity },
    { name: 'Combustíveis', value: data.fuel_kwh, color: COLORS.fuel },
    { name: 'Térmico', value: data.thermal_kwh, color: COLORS.thermal }
  ].filter(item => item.value > 0);

  // Top 5 fontes de energia
  const topSources = [...data.breakdown]
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);

  const formatKwh = (kwh: number) => {
    if (kwh >= 1000000) return `${(kwh / 1000000).toFixed(2)} GWh`;
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
    return `${kwh.toFixed(2)} kWh`;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Consumo Total de Energia (GRI 302-1)
          </CardTitle>
          <CardDescription>
            Quantidade total de energia consumida pela organização no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg shadow-sm border-2 border-primary">
              <div className="text-3xl font-bold text-primary">{formatKwh(data.total_kwh)}</div>
              <div className="text-sm text-muted-foreground">Total Anual</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{data.renewable_percentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Renovável</div>
              <Leaf className="h-4 w-4 mx-auto mt-1 text-green-600" />
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <div className="text-2xl font-bold">{formatKwh(data.electricity_kwh)}</div>
              <div className="text-sm text-muted-foreground">Eletricidade</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <div className="text-2xl font-bold">{formatKwh(data.fuel_kwh + data.thermal_kwh)}</div>
              <div className="text-sm text-muted-foreground">Combustíveis + Térmico</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Renewable vs Non-Renewable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Distribuição por Tipo de Fonte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={renewabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {renewabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatKwh(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.renewable }} />
                <span className="text-sm">Renovável</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.nonRenewable }} />
                <span className="text-sm">Não Renovável</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Consumo por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}M` : value} />
                <Tooltip formatter={(value: number) => formatKwh(value)} />
                <Bar dataKey="value" fill={COLORS.electricity}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Principais Fontes de Energia (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSources.map((source, index) => {
              const percentage = (source.kwh / data.total_kwh) * 100;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.source}</span>
                      {source.is_renewable && (
                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                          <Leaf className="h-3 w-3 mr-1" />
                          Renovável
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{source.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatKwh(source.kwh)}</div>
                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% do total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer Alert */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>Nota Metodológica:</strong> Os valores foram calculados aplicando fatores de conversão IPCC/MCTI para combustíveis.
          Fontes classificadas como renováveis: solar, eólica, hidrelétrica, biomassa, biogás, etanol, biodiesel, bagaço de cana, lenha e carvão vegetal.
        </AlertDescription>
      </Alert>
    </div>
  );
}
