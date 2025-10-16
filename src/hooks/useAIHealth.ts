import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIHealthMetrics {
  status: 'healthy' | 'degraded' | 'critical';
  avgProcessingTime: number;
  errorRate: number;
  successRate: number;
  queueLength: number;
  lastProcessed: Date | null;
  issues: string[];
}

export function useAIHealth() {
  return useQuery({
    queryKey: ['ai-health'],
    queryFn: async (): Promise<AIHealthMetrics> => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent jobs
      const { data: recentJobs, error: jobsError } = await supabase
        .from('document_extraction_jobs')
        .select('status, created_at, processing_end_time')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Get pending jobs (queue length)
      const { count: queueLength, error: queueError } = await supabase
        .from('document_extraction_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Processando');

      if (queueError) throw queueError;

      // Calculate metrics
      const totalJobs = recentJobs?.length || 0;
      const completedJobs = recentJobs?.filter(j => j.status === 'Concluído') || [];
      const errorJobs = recentJobs?.filter(j => j.status === 'Erro') || [];

      const successRate = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 100;
      const errorRate = totalJobs > 0 ? (errorJobs.length / totalJobs) * 100 : 0;

      // Calculate avg processing time
      const processingTimes = completedJobs
        .filter(j => j.processing_end_time && j.created_at)
        .map(j => {
          const start = new Date(j.created_at).getTime();
          const end = new Date(j.processing_end_time!).getTime();
          return (end - start) / 1000; // seconds
        });

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

      // Last processed job
      const lastProcessed = completedJobs.length > 0 && completedJobs[0].processing_end_time
        ? new Date(completedJobs[0].processing_end_time)
        : null;

      // Determine health status and issues
      const issues: string[] = [];
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

      if (errorRate > 30) {
        status = 'critical';
        issues.push(`Taxa de erro crítica: ${errorRate.toFixed(1)}%`);
      } else if (errorRate > 10) {
        status = 'degraded';
        issues.push(`Taxa de erro elevada: ${errorRate.toFixed(1)}%`);
      }

      if ((queueLength || 0) > 20) {
        status = 'critical';
        issues.push(`Fila crítica: ${queueLength} documentos aguardando`);
      } else if ((queueLength || 0) > 10) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`Fila crescendo: ${queueLength} documentos`);
      }

      if (avgProcessingTime > 60) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`Processamento lento: ${avgProcessingTime.toFixed(1)}s médio`);
      }

      if (!lastProcessed || (now.getTime() - lastProcessed.getTime()) > 30 * 60 * 1000) {
        if (status === 'healthy') status = 'degraded';
        issues.push('Nenhum documento processado recentemente');
      }

      return {
        status,
        avgProcessingTime,
        errorRate,
        successRate,
        queueLength: queueLength || 0,
        lastProcessed,
        issues
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
