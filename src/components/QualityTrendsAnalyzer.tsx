import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
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
    const ncTrend = ((recentAvgNCs - previousAvgNCs) / previousAvgNCs) * 100;
    
    const recentQualityScore = recent3Months.reduce((a, b) => a + b.quality_score, 0) / 3;
    const previousQualityScore = previous3Months.reduce((a, b) => a + b.quality_score, 0) / 3;
    const qualityTrend = ((recentQualityScore - previousQualityScore) / previousQualityScore) * 100;
    
    const totalNCs = trendData.reduce((a, b) => a + b.nonConformities, 0);
    const totalResolved = trendData.reduce((a, b) => a + b.resolved, 0);
    const resolutionRate = (totalResolved / totalNCs) * 100;
    
    return {
      ncTrend: Number(ncTrend.toFixed(1)),
      qualityTrend: Number(qualityTrend.toFixed(1)),
      resolutionRate: Number(resolutionRate.toFixed(1)),
      avgQualityScore: Number(recentQualityScore.toFixed(1))
    };
  }, [trendData]);

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

  const insights = useMemo(() => {
    const alerts = [];
    
    if (trendAnalysis.ncTrend > 15) {
      alerts.push({
        type: 'warning',
        message: `Aumento significativo de ${trendAnalysis.ncTrend}% nas NCs nos últimos 3 meses`
      });
    }
    
    if (trendAnalysis.qualityTrend < -5) {
      alerts.push({
        type: 'error',
        message: `Queda no índice de qualidade: ${Math.abs(trendAnalysis.qualityTrend)}%`
      });
    }
    
    if (trendAnalysis.resolutionRate < 70) {
      alerts.push({
        type: 'warning',
        message: `Taxa de resolução baixa: ${trendAnalysis.resolutionRate}%`
      });
    }
    
    if (trendAnalysis.qualityTrend > 10) {
      alerts.push({
        type: 'success',
        message: `Melhoria consistente na qualidade: +${trendAnalysis.qualityTrend}%`
      });
    }
    
    return alerts;
  }, [trendAnalysis]);

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
            <div className="text-2xl font-bold">{trendAnalysis.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              dos casos resolvidos
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
          <Card>
            <CardHeader>
              <CardTitle>Tendências dos Últimos 12 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="nonConformities"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    stroke="#ef4444"
                    name="Não Conformidades"
                  />
                  
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="resolved"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Resolvidas"
                  />
                  
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="quality_score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Score Qualidade"
                  />
                  
                  <ReferenceLine 
                    yAxisId="right" 
                    y={85} 
                    stroke="#f59e0b" 
                    strokeDasharray="5 5" 
                    label="Meta Qualidade" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Não Conformidades vs Resoluções</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="nonConformities" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Abertas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Resolvidas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score de Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[60, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="quality_score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Score Qualidade"
                    />
                    <ReferenceLine 
                      y={85} 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5" 
                      label="Meta" 
                    />
                  </LineChart>
                </ResponsiveContainer>
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