import { useEffect, useCallback } from 'react';
import { notificationTriggers } from '@/services/notificationTriggers';
import { useQuery } from '@tanstack/react-query';

export const useNotificationTriggers = () => {
  // Setup real-time monitoring on component mount
  useEffect(() => {
    console.log('Setting up notification triggers...');
    notificationTriggers.setupRealtimeMonitoring();
    
    return () => {
      console.log('Notification triggers cleanup');
      // Cleanup would be handled by Supabase client
    };
  }, []);

  // Periodic checks for time-based events
  const { data: licenseCheck } = useQuery({
    queryKey: ['license-expiration-check'],
    queryFn: () => notificationTriggers.checkLicenseExpirations(),
    refetchInterval: 24 * 60 * 60 * 1000, // Check daily
    staleTime: 23 * 60 * 60 * 1000, // 23 hours
  });

  const { data: taskCheck } = useQuery({
    queryKey: ['overdue-task-check'],
    queryFn: () => notificationTriggers.checkOverdueTasks(),
    refetchInterval: 60 * 60 * 1000, // Check hourly
    staleTime: 50 * 60 * 1000, // 50 minutes
  });

  // Verificação diária de prazos de avaliação de eficácia de treinamentos
  const { data: trainingEfficacyCheck } = useQuery({
    queryKey: ['training-efficacy-check'],
    queryFn: () => notificationTriggers.checkTrainingEfficacyDeadlines(),
    refetchInterval: 24 * 60 * 60 * 1000, // Verificar diariamente
    staleTime: 23 * 60 * 60 * 1000, // 23 horas
  });

  // Manual trigger functions for components
  const triggerEmissionDataAdded = useCallback((activityDataId: string, activityName: string, co2Amount: number) => {
    return notificationTriggers.onEmissionDataAdded(activityDataId, activityName, co2Amount);
  }, []);

  const triggerGoalUpdated = useCallback((goalId: string, goalName: string, progress: number, previousProgress: number) => {
    return notificationTriggers.onGoalUpdated(goalId, goalName, progress, previousProgress);
  }, []);

  const triggerDocumentUploaded = useCallback((documentId: string, documentName: string, fileType: string) => {
    return notificationTriggers.onDocumentUploaded(documentId, documentName, fileType);
  }, []);

  const triggerAuditFindingCreated = useCallback((findingId: string, findingDescription: string, severity: string) => {
    return notificationTriggers.onAuditFindingCreated(findingId, findingDescription, severity);
  }, []);

  const triggerQualityIssueDetected = useCallback((issueId: string, issueDescription: string, severity: string) => {
    return notificationTriggers.onQualityIssueDetected(issueId, issueDescription, severity);
  }, []);

  const triggerGRIIndicatorUpdated = useCallback((indicatorId: string, indicatorCode: string, value: any) => {
    return notificationTriggers.onGRIIndicatorUpdated(indicatorId, indicatorCode, value);
  }, []);

  const triggerRiskAssessmentCompleted = useCallback((assessmentId: string, assessmentName: string, riskLevel: string) => {
    return notificationTriggers.onRiskAssessmentCompleted(assessmentId, assessmentName, riskLevel);
  }, []);

  const triggerTrainingEfficacyPending = useCallback((trainingId: string, trainingName: string, daysRemaining: number) => {
    return notificationTriggers.onTrainingEfficacyPending(trainingId, trainingName, daysRemaining);
  }, []);

  return {
    // Manual trigger functions
    triggerEmissionDataAdded,
    triggerGoalUpdated,
    triggerDocumentUploaded,
    triggerAuditFindingCreated,
    triggerQualityIssueDetected,
    triggerGRIIndicatorUpdated,
    triggerRiskAssessmentCompleted,
    triggerTrainingEfficacyPending,
    
    // Status
    isMonitoringActive: true,
    trainingEfficacyCheck,
  };
};