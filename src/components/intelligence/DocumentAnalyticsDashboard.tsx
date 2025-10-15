import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

export function DocumentAnalyticsDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['ai-performance-metrics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: recentFeedback } = useQuery({
    queryKey: ['recent-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extraction_feedback')
        .select('feedback_type, accuracy_score')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando analytics...</span>
        </div>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Sem dados de analytics ainda</p>
          <p className="text-sm mt-2">
            Os dados aparecerão conforme você processar documentos
          </p>
        </div>
      </Card>
    );
  }

  // Calcular métricas agregadas
  const totalProcessed = metrics.reduce((sum, m) => sum + m.documents_processed, 0);
  const totalApproved = metrics.reduce((sum, m) => sum + m.auto_approved_count, 0);
  const totalReviewed = metrics.reduce((sum, m) => sum + m.manual_review_count, 0);
  const avgConfidence =
    metrics.reduce((sum, m) => sum + (m.avg_confidence || 0), 0) / metrics.length;
  const avgAccuracy =
    metrics.reduce((sum, m) => sum + (m.accuracy_rate || 0), 0) / metrics.length;

  // Dados para gráficos
  const chartData = metrics.map((m) => ({
    date: new Date(m.metric_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    processados: m.documents_processed,
    aprovados: m.auto_approved_count,
    revisados: m.manual_review_count,
    confianca: m.avg_confidence,
    precisao: m.accuracy_rate,
  }));

  // Distribuição de feedback
  const feedbackDistribution = recentFeedback
    ? [
        {
          name: 'Excelente',
          value: recentFeedback.filter((f) => f.feedback_type === 'excellent').length,
          color: '#22c55e',
        },
        {
          name: 'Bom',
          value: recentFeedback.filter((f) => f.feedback_type === 'good').length,
          color: '#3b82f6',
        },
        {
          name: 'Razoável',
          value: recentFeedback.filter((f) => f.feedback_type === 'fair').length,
          color: '#f59e0b',
        },
        {
          name: 'Ruim',
          value: recentFeedback.filter((f) => f.feedback_type === 'poor').length,
          color: '#ef4444',
        },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Performance da IA</h3>
        <p className="text-sm text-muted-foreground">
          Análise dos últimos 30 dias de processamento de documentos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Processado</p>
              <p className="text-2xl font-bold">{totalProcessed}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Auto-Aprovados</p>
              <p className="text-2xl font-bold">{totalApproved}</p>
              <Badge variant="secondary" className="mt-1">
                {totalProcessed > 0
                  ? Math.round((totalApproved / totalProcessed) * 100)
                  : 0}
                %
              </Badge>
            </div>
            <CheckCircle className="h-8 w-8 text-success opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Confiança Média</p>
              <p className="text-2xl font-bold">{Math.round(avgConfidence)}%</p>
            </div>
            <Target className="h-8 w-8 text-warning opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Precisão</p>
              <p className="text-2xl font-bold">{Math.round(avgAccuracy)}%</p>
            </div>
            <Target className="h-8 w-8 text-success opacity-50" />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-4">Documentos Processados por Dia</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="processados" fill="hsl(var(--primary))" name="Processados" />
              <Bar dataKey="aprovados" fill="hsl(var(--success))" name="Aprovados" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium mb-4">Confiança e Precisão ao Longo do Tempo</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="confianca"
                stroke="hsl(var(--primary))"
                name="Confiança %"
              />
              <Line
                type="monotone"
                dataKey="precisao"
                stroke="hsl(var(--success))"
                name="Precisão %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {feedbackDistribution.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium mb-4">Distribuição de Feedback dos Usuários</h4>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feedbackDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {feedbackDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
