import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, Clock, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMetrics {
  metric_date: string;
  documents_processed: number;
  auto_approved_count: number;
  manual_review_count: number;
  rejected_count: number;
  average_confidence: number;
  average_processing_time_ms: number;
  success_rate: number;
}

interface DocumentPattern {
  id: string;
  pattern_name: string;
  document_type: string;
  success_rate: number;
  usage_count: number;
  last_used_at: string;
}

export function AIPerformanceDashboard() {
  const { selectedCompany } = useCompany();
  const [metrics, setMetrics] = useState<AIMetrics[]>([]);
  const [patterns, setPatterns] = useState<DocumentPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany?.id) {
      loadMetrics();
      loadPatterns();
    }
  }, [selectedCompany?.id]);

  const loadMetrics = async () => {
    if (!selectedCompany?.id) return;
    
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .gte('metric_date', thirtyDaysAgo)
        .order('metric_date', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatterns = async () => {
    if (!selectedCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('document_patterns')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPatterns(data || []);
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
  };

  const calculateKPIs = () => {
    if (metrics.length === 0) return {
      automationRate: 0,
      avgConfidence: 0,
      avgProcessingTime: 0,
      rejectionRate: 0,
      trend: 0
    };

    const latestWeek = metrics.slice(-7);
    const previousWeek = metrics.slice(-14, -7);

    const totalProcessed = latestWeek.reduce((sum, m) => sum + m.documents_processed, 0);
    const autoApproved = latestWeek.reduce((sum, m) => sum + m.auto_approved_count, 0);
    const rejected = latestWeek.reduce((sum, m) => sum + m.rejected_count, 0);
    
    const automationRate = totalProcessed > 0 ? (autoApproved / totalProcessed) * 100 : 0;
    const rejectionRate = totalProcessed > 0 ? (rejected / totalProcessed) * 100 : 0;
    
    const avgConfidence = latestWeek.reduce((sum, m) => sum + (m.average_confidence || 0), 0) / latestWeek.length;
    const avgProcessingTime = latestWeek.reduce((sum, m) => sum + (m.average_processing_time_ms || 0), 0) / latestWeek.length;

    // Calculate trend
    const prevAutomationRate = previousWeek.length > 0
      ? (previousWeek.reduce((sum, m) => sum + m.auto_approved_count, 0) / 
         previousWeek.reduce((sum, m) => sum + m.documents_processed, 0)) * 100
      : 0;
    
    const trend = automationRate - prevAutomationRate;

    return {
      automationRate: Math.round(automationRate),
      avgConfidence: Math.round(avgConfidence),
      avgProcessingTime: Math.round(avgProcessingTime / 1000),
      rejectionRate: Math.round(rejectionRate),
      trend: Math.round(trend)
    };
  };

  const prepareChartData = () => {
    return metrics.map(m => ({
      date: format(new Date(m.metric_date), 'dd/MMM', { locale: ptBR }),
      confidence: m.average_confidence || 0,
      processed: m.documents_processed,
      autoApproved: m.auto_approved_count,
      manualReview: m.manual_review_count,
      rejected: m.rejected_count
    }));
  };

  const prepareDistributionData = () => {
    const totalProcessed = metrics.reduce((sum, m) => sum + m.documents_processed, 0);
    const totalAuto = metrics.reduce((sum, m) => sum + m.auto_approved_count, 0);
    const totalManual = metrics.reduce((sum, m) => sum + m.manual_review_count, 0);
    const totalRejected = metrics.reduce((sum, m) => sum + m.rejected_count, 0);

    return [
      { name: 'Auto-aprovado', value: totalAuto, color: 'hsl(var(--success))' },
      { name: 'Revisão Manual', value: totalManual, color: 'hsl(var(--warning))' },
      { name: 'Rejeitado', value: totalRejected, color: 'hsl(var(--destructive))' }
    ];
  };

  const kpis = calculateKPIs();
  const chartData = prepareChartData();
  const distributionData = prepareDistributionData();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <Brain className="h-8 w-8 animate-pulse text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Performance da IA
              </CardTitle>
              <CardDescription>Últimos 30 dias de métricas e análises</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {metrics.length} dias de dados
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Taxa de Automação</p>
                    <p className="text-3xl font-bold text-primary">{kpis.automationRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-primary opacity-20" />
                </div>
                {kpis.trend !== 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className={`h-3 w-3 ${kpis.trend > 0 ? 'text-success' : 'text-destructive'}`} />
                    <span className={`text-xs ${kpis.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                      {kpis.trend > 0 ? '+' : ''}{kpis.trend}% vs semana anterior
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Confiança Média</p>
                    <p className="text-3xl font-bold">{kpis.avgConfidence}%</p>
                  </div>
                  <Brain className="h-8 w-8 text-primary opacity-20" />
                </div>
                <Progress value={kpis.avgConfidence} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
                    <p className="text-3xl font-bold">{kpis.avgProcessingTime}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary opacity-20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Por documento</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Taxa de Rejeição</p>
                    <p className="text-3xl font-bold">{kpis.rejectionRate}%</p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive opacity-20" />
                </div>
                <Progress value={100 - kpis.rejectionRate} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="distribution">Distribuição</TabsTrigger>
              <TabsTrigger value="patterns">Padrões</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução da Confiança</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Confiança (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Volume de Processamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="autoApproved" fill="hsl(var(--success))" name="Auto-aprovado" />
                      <Bar dataKey="manualReview" fill="hsl(var(--warning))" name="Revisão Manual" />
                      <Bar dataKey="rejected" fill="hsl(var(--destructive))" name="Rejeitado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Decisões</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 10 Padrões de Documentos</CardTitle>
                  <CardDescription>Padrões mais utilizados pela IA</CardDescription>
                </CardHeader>
                <CardContent>
                  {patterns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum padrão identificado ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patterns.map((pattern, index) => (
                        <div key={pattern.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="min-w-[30px] justify-center">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{pattern.pattern_name}</p>
                              <p className="text-xs text-muted-foreground">{pattern.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{pattern.success_rate}%</p>
                              <p className="text-xs text-muted-foreground">Sucesso</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{pattern.usage_count}</p>
                              <p className="text-xs text-muted-foreground">Usos</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}