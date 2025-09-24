import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { intelligentReportingService } from '@/services/intelligentReporting';
import { useNotificationTriggers } from './useNotificationTriggers';

export const useRealtimeReporting = () => {
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [jobNotifications, setJobNotifications] = useState<Set<string>>(new Set());
  const { triggerDocumentUploaded } = useNotificationTriggers();

  // Monitor report generation jobs
  const { data: templates } = useQuery({
    queryKey: ['realtime-templates'],
    queryFn: () => intelligentReportingService.getSmartReportTemplates(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Monitor insights
  const { data: insights } = useQuery({
    queryKey: ['realtime-insights'],
    queryFn: () => intelligentReportingService.generateReportInsights('esg', {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }),
    refetchInterval: 60000, // Check every minute
  });

  // Auto-notification for completed jobs
  useEffect(() => {
    activeJobs.forEach(async (job) => {
      if (job.status === 'completed' && !jobNotifications.has(job.id)) {
        setJobNotifications(prev => new Set(prev).add(job.id));
        
        await triggerDocumentUploaded(
          job.id,
          `Relatório ${job.template_name || 'Inteligente'}`,
          'PDF'
        );
      }
    });
  }, [activeJobs, triggerDocumentUploaded, jobNotifications]);

  const queueReport = async (templateId: string, parameters: any) => {
    try {
      const job = await intelligentReportingService.queueReportGeneration(templateId, parameters);
      setActiveJobs(prev => [...prev, job]);
      return job;
    } catch (error) {
      console.error('Error queuing report:', error);
      throw error;
    }
  };

  const getUrgentReports = () => {
    return templates?.filter(template => {
      const daysUntilGeneration = Math.ceil(
        (new Date(template.next_generation).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilGeneration <= 3 && daysUntilGeneration > 0;
    }) || [];
  };

  const getHighPriorityInsights = () => {
    return insights?.filter(insight => insight.priority === 'high' && insight.actionable) || [];
  };

  const getReportingStats = () => {
    const completedJobs = activeJobs.filter(job => job.status === 'completed').length;
    const processingJobs = activeJobs.filter(job => job.status === 'processing').length;
    const failedJobs = activeJobs.filter(job => job.status === 'failed').length;

    return {
      total: activeJobs.length,
      completed: completedJobs,
      processing: processingJobs,
      failed: failedJobs,
      successRate: activeJobs.length > 0 ? (completedJobs / activeJobs.length) * 100 : 0
    };
  };

  return {
    activeJobs,
    templates,
    insights,
    urgentReports: getUrgentReports(),
    highPriorityInsights: getHighPriorityInsights(),
    stats: getReportingStats(),
    queueReport,
    setActiveJobs
  };
};