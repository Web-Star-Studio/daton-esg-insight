import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface TrendDataPoint {
  period: string;
  nonConformities: number;
  resolved: number;
  customer_complaints: number;
  quality_score: number;
  target_line: number;
}

interface QualityTrendsAnalyzerProps {
  className?: string;
}

export const QualityTrendsAnalyzer: React.FC<QualityTrendsAnalyzerProps> = ({ 
  className 
}) => {
  // Fetch real historical data from database
  const { data: ncsData, isLoading } = useQuery({
    queryKey: ['quality-trends-history'],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data, error } = await supabase
        .from('non_conformities')
        .select('created_at, status, severity')
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartConfig = {
    nonConformities: {
      label: "Não Conformidades",
      color: "hsl(var(--destructive))",
    },
    resolved: {
      label: "Resolvidas",
      color: "hsl(var(--success))",
    },
    qualityScore: {
      label: "Score Qualidade",
      color: "hsl(var(--primary))",
    },
    pending: {
      label: "Pendentes",
      color: "hsl(var(--warning))",
    },
  };

  // Process historical data into monthly trends
  const trendData: TrendDataPoint[] = useMemo(() => {
    if (!ncsData) return [];

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Generate last 12 months labels
    const last12Months = [...Array(12)].map((_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      return months[monthIndex];
    });

    // Group NCs by month
    const monthlyStats: Record<string, { total: number; resolved: number; critical: number }> = {};
    
    ncsData.forEach(nc => {
      const date = new Date(nc.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { total: 0, resolved: 0, critical: 0 };
      }
      
      monthlyStats[monthKey].total++;
      
      if (nc.status === 'Fechada' || nc.status === 'Resolvida') {
        monthlyStats[monthKey].resolved++;
      }
      
      if (nc.severity === 'Crítica' || nc.severity === 'Alta') {
        monthlyStats[monthKey].critical++;
      }
    });

    // Build trend data for last 12 months
    return last12Months.map((month, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - 11 + index);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const stats = monthlyStats[monthKey] || { total: 0, resolved: 0, critical: 0 };
      
      // Calculate quality score based on NCs
      const qualityScore = Math.max(0, 100 - (stats.total * 4) - (stats.critical * 6));
      
      return {
        period: month,
        nonConformities: stats.total,
        resolved: stats.resolved,
        customer_complaints: stats.critical,
        quality_score: qualityScore,
        target_line: 85
      };
    });
  }, [ncsData]);

  // Analyze trends
  const trendAnalysis = useMemo(() => {
    const recent3Months = trendData.slice(-3);
    const previous3Months = trendData.slice(-6, -3);
    
    const recentAvgNCs = recent3Months.reduce((a, b) => a + b.nonConformities, 0) / 3;
    const previousAvgNCs = previous3Months.reduce((a, b) => a + b.nonConformities, 0) / 3;
    
    // Proteção contra divisão por zero
    const ncTrend = previousAvgNCs === 0 
      ? (recentAvgNCs > 0 ? 100 : 0)
      : ((recentAvgNCs - previousAvgNCs) / previousAvgNCs) * 100;
    
    const recentQualityScore = recent3Months.reduce((a, b) => a + b.quality_score, 0) / 3;
    const previousQualityScore = previous3Months.reduce((a, b) => a + b.quality_score, 0) / 3;
    
    // Proteção contra divisão por zero
    const qualityTrend = previousQualityScore === 0
      ? 0
      : ((recentQualityScore - previousQualityScore) / previousQualityScore) * 100;
    
    const totalNCs = trendData.reduce((a, b) => a + b.nonConformities, 0);
    const totalResolved = trendData.reduce((a, b) => a + b.resolved, 0);
    
    // Proteção contra divisão por zero
    const resolutionRate = totalNCs === 0 ? 0 : (totalResolved / totalNCs) * 100;
    
    return {
      ncTrend: Number(ncTrend.toFixed(1)),
      qualityTrend: Number(qualityTrend.toFixed(1)),
      resolutionRate: Number(resolutionRate.toFixed(1)),
      avgQualityScore: Number(recentQualityScore.toFixed(1)),
      totalNCs,
      totalResolved
    };
  }, [trendData]);

  const insights = useMemo(() => {
    const alerts = [];
    
    // Só mostrar alerta se houver dados comparáveis
    if (trendAnalysis.ncTrend > 15 && isFinite(trendAnalysis.ncTrend)) {
      alerts.push({
        type: 'warning',
        message: `Aumento significativo de ${trendAnalysis.ncTrend}% nas NCs nos últimos 3 meses`
      });
    }
    
    // Alerta para primeiras NCs registradas
    const previousNCs = trendData.slice(-6, -3).reduce((a, b) => a + b.nonConformities, 0);
    if (previousNCs === 0 && trendAnalysis.totalNCs > 0) {
      alerts.push({
        type: 'info',
        message: `Primeiras NCs registradas no período de análise. Continue monitorando para identificar tendências.`
      });
    }
    
    if (trendAnalysis.qualityTrend < -5 && isFinite(trendAnalysis.qualityTrend)) {
      alerts.push({
        type: 'error',
        message: `Queda no índice de qualidade: ${Math.abs(trendAnalysis.qualityTrend)}%`
      });
    }
    
    if (trendAnalysis.resolutionRate < 70 && trendAnalysis.totalNCs > 0) {
      alerts.push({
        type: 'warning',
        message: `Taxa de resolução baixa: ${trendAnalysis.resolutionRate}%`
      });
    }
    
    if (trendAnalysis.qualityTrend > 10 && isFinite(trendAnalysis.qualityTrend)) {
      alerts.push({
        type: 'success',
        message: `Melhoria consistente na qualidade: +${trendAnalysis.qualityTrend}%`
      });
    }
    
    return alerts;
  }, [trendAnalysis, trendData]);

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <div className="h-4 w-4" />; // Neutral
  };

  const getTrendColor = (trend: number, isReverse: boolean = false) => {
    if (isReverse) {
      return trend > 0 ? 'text-destructive' : trend < 0 ? 'text-success' : 'text-muted-foreground';
    }
    return trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Análise de Tendências</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Carregando dados históricos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendData || trendData.length === 0 || trendData.every(d => d.nonConformities === 0)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Análise de Tendências</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ainda não há dados históricos suficientes para análise de tendências.
              Continue registrando não conformidades para visualizar as tendências ao longo do tempo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência NCs</CardTitle>
            {getTrendIcon(trendAnalysis.ncTrend)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrendColor(trendAnalysis.ncTrend, true)}`}>
              {trendAnalysis.ncTrend > 0 ? '+' : ''}{trendAnalysis.ncTrend}%
            </div>
            <p className="text-xs text-muted-foreground">
              últimos 3 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade Geral</CardTitle>
            {getTrendIcon(trendAnalysis.qualityTrend)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrendColor(trendAnalysis.qualityTrend)}`}>
              {trendAnalysis.qualityTrend > 0 ? '+' : ''}{trendAnalysis.qualityTrend}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Resolução</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${trendAnalysis.resolutionRate === 0 && trendAnalysis.totalNCs > 0 ? 'text-warning' : ''}`}>
              {trendAnalysis.resolutionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {trendAnalysis.totalResolved} de {trendAnalysis.totalNCs} casos resolvidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendAnalysis.avgQualityScore}</div>
            <p className="text-xs text-muted-foreground">
              pontuação atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Alerts */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <Alert key={index} className={
              insight.type === 'error' ? 'border-destructive' :
              insight.type === 'warning' ? 'border-warning' :
              'border-success'
            }>
              {insight.type === 'error' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : insight.type === 'warning' ? (
                <Info className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              <AlertDescription>{insight.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Trend Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Análise Detalhada</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-muted/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Tendências dos Últimos 12 Meses</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="colorNCs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Não Conformidades', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Score Qualidade', angle: 90, position: 'insideRight' }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `Período: ${value}`}
                      />
                    }
                  />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="nonConformities"
                    fill="url(#colorNCs)"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Não Conformidades"
                  />
                  
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="resolved"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 4 }}
                    name="Resolvidas"
                  />
                  
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="quality_score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                    name="Score Qualidade"
                  />
                  
                  <ReferenceLine 
                    yAxisId="right" 
                    y={85} 
                    stroke="hsl(var(--warning))" 
                    strokeDasharray="5 5" 
                    label="Meta Qualidade" 
                  />
                </ComposedChart>
              </ChartContainer>
              
              <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span className="text-muted-foreground">Não Conformidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-success rounded"></div>
                  <span className="text-muted-foreground">Resolvidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-primary rounded"></div>
                  <span className="text-muted-foreground">Score Qualidade</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-warning rounded border border-warning"></div>
                  <span className="text-muted-foreground">Meta (85)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Não Conformidades vs Resoluções</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="nonConformities" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--destructive))", strokeWidth: 0, r: 4 }}
                      name="Abertas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 4 }}
                      name="Resolvidas"
                    />
                  </LineChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-destructive rounded"></div>
                    <span className="text-muted-foreground">Abertas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-success rounded"></div>
                    <span className="text-muted-foreground">Resolvidas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Score de Qualidade</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                    />
                    <YAxis 
                      domain={[60, 100]}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="quality_score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 5 }}
                      name="Score Qualidade"
                    />
                    <ReferenceLine 
                      y={85} 
                      stroke="hsl(var(--warning))" 
                      strokeDasharray="5 5" 
                      label="Meta" 
                    />
                  </LineChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-primary rounded"></div>
                    <span className="text-muted-foreground">Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-warning rounded border border-warning"></div>
                    <span className="text-muted-foreground">Meta (85)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa Trimestral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">Q4 2024</div>
                  <div className="text-sm text-muted-foreground mb-2">Atual</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">NCs:</span>
                      <Badge variant="outline">45</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Qualidade:</span>
                      <Badge variant="default">87%</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">Q3 2024</div>
                  <div className="text-sm text-muted-foreground mb-2">Anterior</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">NCs:</span>
                      <Badge variant="outline">52</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Qualidade:</span>
                      <Badge variant="secondary">83%</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-success">Variação</div>
                  <div className="text-sm text-muted-foreground mb-2">Tendência</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">NCs:</span>
                      <Badge variant="outline" className="text-success">-13%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Qualidade:</span>
                      <Badge variant="default" className="text-success">+5%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityTrendsAnalyzer;