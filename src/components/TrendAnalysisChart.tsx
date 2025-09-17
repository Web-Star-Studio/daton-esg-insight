import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Target,
  AlertCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  Legend
} from "recharts";
import { format, addMonths, parseISO } from "date-fns";

interface TrendData {
  month: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

interface TrendAnalysisChartProps {
  data: TrendData[];
  isLoading?: boolean;
}

export function TrendAnalysisChart({ data, isLoading }: TrendAnalysisChartProps) {
  // Generate predictions for next 6 months
  const generatePredictions = (historicalData: TrendData[]) => {
    if (!historicalData || historicalData.length < 3) return [];
    
    const lastMonths = historicalData.slice(-6);
    const avgGrowth = lastMonths.reduce((acc, curr, index) => {
      if (index === 0) return acc;
      const prev = lastMonths[index - 1];
      return acc + ((curr.total - prev.total) / prev.total);
    }, 0) / (lastMonths.length - 1);

    const lastValue = lastMonths[lastMonths.length - 1];
    const predictions = [];
    
    for (let i = 1; i <= 6; i++) {
      const predicted = lastValue.total * Math.pow(1 + avgGrowth, i);
      predictions.push({
        month: format(addMonths(new Date(), i), 'MMM/yyyy'),
        total: predicted,
        isPrediction: true
      });
    }
    
    return predictions;
  };

  const predictions = generatePredictions(data);
  const combinedData = [...data.map(d => ({...d, isPrediction: false})), ...predictions];

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  };

  const totalTrend = calculateTrend(data.map(d => d.total));
  const scope1Trend = calculateTrend(data.map(d => d.scope1));
  const scope2Trend = calculateTrend(data.map(d => d.scope2));

  // Seasonal analysis
  const monthlyAverages = data.reduce((acc, curr) => {
    const month = curr.month.split('/')[0];
    if (!acc[month]) acc[month] = [];
    acc[month].push(curr.total);
    return acc;
  }, {} as Record<string, number[]>);

  const seasonalPattern = Object.entries(monthlyAverages).map(([month, values]) => ({
    month,
    average: values.reduce((a, b) => a + b, 0) / values.length,
    variation: Math.max(...values) - Math.min(...values)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isPredicted = payload[0]?.payload?.isPrediction;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label} {isPredicted && "(Previsão)"}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(1)} tCO₂e`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {totalTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tendência Total</p>
                <p className="text-2xl font-bold">{Math.abs(totalTrend).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {totalTrend >= 0 ? 'Aumento' : 'Redução'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {scope1Trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-warning" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Escopo 1</p>
                <p className="text-2xl font-bold">{Math.abs(scope1Trend).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">últimos 3 meses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sazonalidade</p>
                <p className="text-2xl font-bold">
                  {seasonalPattern.length > 0 ? 
                    Math.max(...seasonalPattern.map(s => s.variation)).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-muted-foreground">variação mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-info" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Próximos 6 meses</p>
                <p className="text-2xl font-bold">
                  {predictions.length > 0 ? 
                    predictions[predictions.length - 1].total.toFixed(0) : '0'}
                </p>
                <p className="text-xs text-muted-foreground">tCO₂e previsto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Análise de Tendências e Projeções</span>
            <Badge variant="outline" className="ml-auto">
              Histórico + Previsão
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Historical data */}
                  <Line 
                    dataKey="scope1" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                    name="Escopo 1"
                  />
                  <Line 
                    dataKey="scope2" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                    name="Escopo 2"
                  />
                  <Line 
                    dataKey="scope3" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                    name="Escopo 3"
                  />
                  
                  {/* Prediction line */}
                  <Line 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 0 }}
                    name="Projeção Total"
                  />
                  
                  {/* Current month reference line */}
                  <ReferenceLine 
                    x={format(new Date(), 'MMM/yyyy')} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="2 2"
                    label={{ value: "Hoje", position: "top" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Padrão Sazonal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalPattern}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} tCO₂e`, 'Média Mensal']}
                  />
                  <Area 
                    dataKey="average" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Insights da Tendência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalTrend > 10 && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tendência de Alta Preocupante</p>
                  <p className="text-xs text-muted-foreground">
                    Emissões crescendo {totalTrend.toFixed(1)}% - revisar estratégias de redução
                  </p>
                </div>
              </div>
            )}
            
            {Math.abs(totalTrend) < 5 && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-success/10">
                <Target className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Emissões Estáveis</p>
                  <p className="text-xs text-muted-foreground">
                    Variação baixa indica boa gestão - mantenha o foco
                  </p>
                </div>
              </div>
            )}
            
            {totalTrend < -5 && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-success/10">
                <TrendingDown className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Redução Consistente</p>
                  <p className="text-xs text-muted-foreground">
                    Excelente progresso na redução de emissões
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Análise Sazonal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium">Picos Sazonais Identificados:</p>
              {seasonalPattern
                .sort((a, b) => b.average - a.average)
                .slice(0, 2)
                .map((pattern, index) => (
                  <div key={index} className="flex justify-between mt-2">
                    <span>{pattern.month}</span>
                    <span className="font-medium">{pattern.average.toFixed(1)} tCO₂e</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}