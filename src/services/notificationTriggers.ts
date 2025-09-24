import { supabase } from "@/integrations/supabase/client";
import { createNotification, triggerSmartNotifications } from "./notifications";
import { toast } from "sonner";

export interface BusinessEvent {
  type: 'emission_data_added' | 'goal_updated' | 'license_expiring' | 'audit_finding_created' | 
        'compliance_task_overdue' | 'document_uploaded' | 'quality_issue_detected' | 
        'gri_indicator_updated' | 'risk_assessment_completed';
  entityId: string;
  entityType: string;
  entityName: string;
  metadata?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

class NotificationTriggersService {
  private static instance: NotificationTriggersService;
  
  static getInstance(): NotificationTriggersService {
    if (!NotificationTriggersService.instance) {
      NotificationTriggersService.instance = new NotificationTriggersService();
    }
    return NotificationTriggersService.instance;
  }

  // Main trigger function for business events
  async triggerEvent(event: BusinessEvent): Promise<void> {
    try {
      console.log('Triggering notification event:', event);
      
      // Generate appropriate notification based on event type
      const notification = await this.generateNotificationForEvent(event);
      
      if (notification) {
        await createNotification(
          notification.title,
          notification.message,
          notification.type as 'info' | 'success' | 'warning' | 'error',
          notification.actionUrl,
          notification.actionLabel,
          notification.category,
          notification.priority,
          { ...event.metadata, eventType: event.type }
        );

        // Trigger smart notifications for additional processing
        await triggerSmartNotifications(event.type);
      }
    } catch (error) {
      console.error('Error triggering notification event:', error);
    }
  }

  // Generate notification content based on event type
  private async generateNotificationForEvent(event: BusinessEvent) {
    switch (event.type) {
      case 'emission_data_added':
        return {
          title: 'Novos dados de emissão registrados',
          message: `Dados de emissão adicionados para ${event.entityName}`,
          type: 'info' as 'info' | 'success' | 'warning' | 'error',
          actionUrl: '/inventario-gee',
          actionLabel: 'Ver Inventário',
          category: 'emissions',
          priority: 'medium'
        };

      case 'goal_updated':
        const progressText = event.metadata?.progress ? `${event.metadata.progress}%` : '';
        return {
          title: 'Meta atualizada',
          message: `Progresso da meta "${event.entityName}" ${progressText}`,
          type: 'success' as const,
          actionUrl: '/metas',
          actionLabel: 'Ver Metas',
          category: 'goals',
          priority: 'medium'
        };

      case 'license_expiring':
        const daysToExpiry = event.metadata?.daysToExpiry || 0;
        return {
          title: 'Licença próxima do vencimento',
          message: `Licença "${event.entityName}" vence em ${daysToExpiry} dias`,
          type: daysToExpiry <= 30 ? 'error' : 'warning' as const,
          actionUrl: '/licenciamento',
          actionLabel: 'Ver Licenças',
          category: 'compliance',
          priority: daysToExpiry <= 30 ? 'critical' : 'high'
        };

      case 'audit_finding_created':
        return {
          title: 'Nova não-conformidade identificada',
          message: `Não-conformidade "${event.entityName}" criada`,
          type: 'warning' as const,
          actionUrl: '/auditoria',
          actionLabel: 'Ver Auditoria',
          category: 'audit',
          priority: event.severity === 'critical' ? 'critical' : 'high'
        };

      case 'compliance_task_overdue':
        return {
          title: 'Tarefa de compliance em atraso',
          message: `Tarefa "${event.entityName}" está em atraso`,
          type: 'error' as const,
          actionUrl: '/compliance',
          actionLabel: 'Ver Tarefas',
          category: 'compliance',
          priority: 'critical'
        };

      case 'document_uploaded':
        return {
          title: 'Novo documento adicionado',
          message: `Documento "${event.entityName}" foi carregado`,
          type: 'info' as const,
          actionUrl: '/documentos',
          actionLabel: 'Ver Documentos',
          category: 'documents',
          priority: 'low'
        };

      case 'quality_issue_detected':
        return {
          title: 'Problema de qualidade detectado',
          message: `Problema identificado: ${event.entityName}`,
          type: 'error' as const,
          actionUrl: '/quality-dashboard',
          actionLabel: 'Ver Qualidade',
          category: 'quality',
          priority: 'high'
        };

      case 'gri_indicator_updated':
        return {
          title: 'Indicador GRI atualizado',
          message: `Indicador "${event.entityName}" foi atualizado`,
          type: 'success' as const,
          actionUrl: '/indicadores-gri',
          actionLabel: 'Ver Indicadores',
          category: 'gri',
          priority: 'medium'
        };

      case 'risk_assessment_completed':
        return {
          title: 'Avaliação de risco concluída',
          message: `Avaliação "${event.entityName}" foi finalizada`,
          type: 'info' as const,
          actionUrl: '/gestao-riscos',
          actionLabel: 'Ver Riscos',
          category: 'risk',
          priority: 'medium'
        };

      default:
        return null;
    }
  }

  // Specific trigger methods for common events
  async onEmissionDataAdded(activityDataId: string, activityName: string, co2Amount: number) {
    await this.triggerEvent({
      type: 'emission_data_added',
      entityId: activityDataId,
      entityType: 'activity_data',
      entityName: activityName,
      metadata: { co2Amount },
      severity: co2Amount > 100 ? 'high' : 'medium'
    });
  }

  async onGoalUpdated(goalId: string, goalName: string, progress: number, previousProgress: number) {
    const progressChange = progress - previousProgress;
    await this.triggerEvent({
      type: 'goal_updated',
      entityId: goalId,
      entityType: 'goal',
      entityName: goalName,
      metadata: { progress, previousProgress, progressChange },
      severity: progress >= 80 ? 'low' : progress >= 50 ? 'medium' : 'high'
    });
  }

  async onLicenseExpiring(licenseId: string, licenseName: string, daysToExpiry: number) {
    await this.triggerEvent({
      type: 'license_expiring',
      entityId: licenseId,
      entityType: 'license',
      entityName: licenseName,
      metadata: { daysToExpiry },
      severity: daysToExpiry <= 30 ? 'critical' : daysToExpiry <= 60 ? 'high' : 'medium'
    });
  }

  async onAuditFindingCreated(findingId: string, findingDescription: string, severity: string) {
    await this.triggerEvent({
      type: 'audit_finding_created',
      entityId: findingId,
      entityType: 'audit_finding',
      entityName: findingDescription,
      metadata: { severity },
      severity: severity as any
    });
  }

  async onComplianceTaskOverdue(taskId: string, taskName: string, daysPastDue: number) {
    await this.triggerEvent({
      type: 'compliance_task_overdue',
      entityId: taskId,
      entityType: 'compliance_task',
      entityName: taskName,
      metadata: { daysPastDue },
      severity: 'critical'
    });
  }

  async onDocumentUploaded(documentId: string, documentName: string, fileType: string) {
    await this.triggerEvent({
      type: 'document_uploaded',
      entityId: documentId,
      entityType: 'document',
      entityName: documentName,
      metadata: { fileType },
      severity: 'low'
    });
  }

  async onQualityIssueDetected(issueId: string, issueDescription: string, severity: string) {
    await this.triggerEvent({
      type: 'quality_issue_detected',
      entityId: issueId,
      entityType: 'quality_issue',
      entityName: issueDescription,
      metadata: { severity },
      severity: severity as any
    });
  }

  async onGRIIndicatorUpdated(indicatorId: string, indicatorCode: string, value: any) {
    await this.triggerEvent({
      type: 'gri_indicator_updated',
      entityId: indicatorId,
      entityType: 'gri_indicator',
      entityName: `GRI ${indicatorCode}`,
      metadata: { value },
      severity: 'medium'
    });
  }

  async onRiskAssessmentCompleted(assessmentId: string, assessmentName: string, riskLevel: string) {
    await this.triggerEvent({
      type: 'risk_assessment_completed',
      entityId: assessmentId,
      entityType: 'risk_assessment',
      entityName: assessmentName,
      metadata: { riskLevel },
      severity: riskLevel === 'Alto' || riskLevel === 'Crítico' ? 'high' : 'medium'
    });
  }

  // Automatic monitoring setup
  setupRealtimeMonitoring() {
    // Monitor emission data changes
    supabase
      .channel('emission-monitoring')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activity_data' },
        async (payload) => {
          if (payload.new) {
            const activityData = payload.new as any;
            await this.onEmissionDataAdded(
              activityData.id,
              `Atividade ${activityData.id}`,
              activityData.quantity || 0
            );
          }
        }
      )
      .subscribe();

    // Monitor goal progress updates
    supabase
      .channel('goal-monitoring')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'goal_progress_updates' },
        async (payload) => {
          if (payload.new) {
            const update = payload.new as any;
            // Get goal details
            const { data: goal } = await supabase
              .from('goals')
              .select('name')
              .eq('id', update.goal_id)
              .single();
            
            if (goal) {
              await this.onGoalUpdated(
                update.goal_id,
                goal.name,
                update.progress_percentage || 0,
                0 // We'd need to fetch previous value for accurate change
              );
            }
          }
        }
      )
      .subscribe();

    // Monitor document uploads
    supabase
      .channel('document-monitoring')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'documents' },
        async (payload) => {
          if (payload.new) {
            const document = payload.new as any;
            await this.onDocumentUploaded(
              document.id,
              document.file_name,
              document.file_type
            );
          }
        }
      )
      .subscribe();

    // Monitor audit findings
    supabase
      .channel('audit-monitoring')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_findings' },
        async (payload) => {
          if (payload.new) {
            const finding = payload.new as any;
            await this.onAuditFindingCreated(
              finding.id,
              finding.description || 'Nova não-conformidade',
              finding.severity || 'medium'
            );
          }
        }
      )
      .subscribe();

    console.log('Real-time notification monitoring setup complete');
  }

  // License expiration checker (to be run periodically)
  async checkLicenseExpirations() {
    try {
      const { data: licenses } = await supabase
        .from('licenses')
        .select('id, name, expiration_date, status')
        .eq('status', 'Ativa')
        .not('expiration_date', 'is', null);

      if (licenses) {
        const now = new Date();
        
        for (const license of licenses) {
          const expirationDate = new Date(license.expiration_date);
          const daysToExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check if license is expiring within 90 days
          if (daysToExpiry <= 90 && daysToExpiry > 0) {
            await this.onLicenseExpiring(license.id, license.name, daysToExpiry);
          }
        }
      }
    } catch (error) {
      console.error('Error checking license expirations:', error);
    }
  }

  // Compliance task overdue checker
  async checkOverdueTasks() {
    try {
      const { data: tasks } = await supabase
        .from('compliance_tasks')
        .select('id, title, due_date, status')
        .eq('status', 'Pendente')
        .lt('due_date', new Date().toISOString());

      if (tasks) {
        const now = new Date();
        
        for (const task of tasks) {
          const dueDate = new Date(task.due_date);
          const daysPastDue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          await this.onComplianceTaskOverdue(task.id, task.title, daysPastDue);
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }
}

// Export singleton instance
export const notificationTriggers = NotificationTriggersService.getInstance();

// Export convenience functions
export const {
  triggerEvent,
  onEmissionDataAdded,
  onGoalUpdated,
  onLicenseExpiring,
  onAuditFindingCreated,
  onComplianceTaskOverdue,
  onDocumentUploaded,
  onQualityIssueDetected,
  onGRIIndicatorUpdated,
  onRiskAssessmentCompleted,
  setupRealtimeMonitoring,
  checkLicenseExpirations,
  checkOverdueTasks
} = NotificationTriggersService.prototype;