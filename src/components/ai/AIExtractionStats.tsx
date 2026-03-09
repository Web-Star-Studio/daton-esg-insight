import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, AlertTriangle, TrendingUp, FileText } from 'lucide-react';

export function AIExtractionStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-extraction-stats'],
    queryFn: async () => {
      // Fetch extraction statistics
      const { data: jobs, error: jobsError } = await supabase
        .from('document_extraction_jobs')
        .select('status, confidence_score, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (jobsError) throw jobsError;

      // Fetch preview statistics
      const { data: previews, error: previewsError } = await supabase
        .from('extracted_data_preview')
        .select('validation_status, confidence_scores')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (previewsError) throw previewsError;

      // Calculate metrics
      const totalJobs = jobs?.length || 0;
      const completedJobs = jobs?.filter(j => j.status === 'Concluído').length || 0;
      const errorJobs = jobs?.filter(j => j.status === 'Erro').length || 0;
      
      const avgConfidence = jobs
        ?.filter(j => j.confidence_score)
        .reduce((acc, j) => acc + (j.confidence_score || 0), 0) / (completedJobs || 1);

      const approvedCount = previews?.filter(p => p.validation_status === 'Aprovado').length || 0;
      const pendingCount = previews?.filter(p => p.validation_status === 'Pendente').length || 0;
      const rejectedCount = previews?.filter(p => p.validation_status === 'Rejeitado').length || 0;
      
      const approvalRate = previews?.length ? (approvedCount / previews.length) * 100 : 0;

      return {
        totalJobs,
        completedJobs,
        errorJobs,
        avgConfidence: avgConfidence * 100,
        approvedCount,
        pendingCount,
        rejectedCount,
        approvalRate,
        successRate: totalJobs ? (completedJobs / totalJobs) * 100 : 0
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading || !stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documentos Processados</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completedJobs} concluídos • {stats.errorJobs} com erro
          </p>
          <Progress value={stats.successRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgConfidence.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Confiança da IA nas extrações
          </p>
          <Progress value={stats.avgConfidence} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.approvedCount} aprovadas • {stats.rejectedCount} rejeitadas
          </p>
          <Progress value={stats.approvalRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando revisão manual
          </p>
          <Progress 
            value={(stats.pendingCount / Math.max(stats.totalJobs, 1)) * 100} 
            className="mt-2" 
          />
        </CardContent>
      </Card>
    </div>
  );
}
