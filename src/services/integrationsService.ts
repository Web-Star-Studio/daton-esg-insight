import { supabase } from '@/integrations/supabase/client';
import handleServiceError from '@/utils/errorHandler';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'zapier' | 'email' | 'api' | 'webhook' | 'slack' | 'teams';
  isActive: boolean;
  settings: Record<string, any>;
  triggers: string[];
  lastTriggered?: Date;
  errorCount?: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  source: string;
  companyId: string;
}

class IntegrationsService {
  private integrations: Map<string, IntegrationConfig> = new Map();

  async getIntegrations(companyId: string): Promise<IntegrationConfig[]> {
    try {
      // Placeholder - would need database table
      return Array.from(this.integrations.values()).filter(integration => 
        integration.settings.companyId === companyId
      );
    } catch (error) {
      throw handleServiceError.handle(error, { function: 'getIntegrations' });
    }
  }

  async saveIntegration(companyId: string, config: IntegrationConfig): Promise<void> {
    try {
      // Store in memory for now - would need database table
      config.settings.companyId = companyId;
      this.integrations.set(config.id, config);
    } catch (error) {
      throw handleServiceError.handle(error, { function: 'saveIntegration' });
    }
  }

  async triggerWebhook(integrationId: string, payload: WebhookPayload): Promise<boolean> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      const webhookUrl = integration.settings.webhookUrl;
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      // Update last triggered
      await this.updateIntegrationStats(integrationId, true);
      
      return true;
    } catch (error) {
      console.error('Webhook trigger failed:', error);
      await this.updateIntegrationStats(integrationId, false);
      return false;
    }
  }

  private async updateIntegrationStats(integrationId: string, success: boolean): Promise<void> {
    const integrationData = this.integrations.get(integrationId);
    if (!integrationData) return;

    const updates: any = {
      last_triggered: new Date().toISOString()
    };

    if (!success) {
      updates.error_count = (integrationData.errorCount || 0) + 1;
    } else {
      updates.error_count = 0;
    }

    // Update in memory - would need database table
    const updatedIntegration = this.integrations.get(integrationId);
    if (updatedIntegration) {
      updatedIntegration.lastTriggered = new Date(updates.last_triggered);
      updatedIntegration.errorCount = updates.error_count;
    }
  }

  async sendEmail(config: {
    to: string[];
    subject: string;
    body: string;
    attachments?: { name: string; data: Blob }[];
  }): Promise<boolean> {
    try {
      // Call email service edge function
      const { error } = await supabase.functions.invoke('send-email', {
        body: config
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  async sendSlackMessage(config: {
    webhookUrl: string;
    message: string;
    channel?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: config.message,
          channel: config.channel
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Slack message failed:', error);
      return false;
    }
  }

  async sendTeamsMessage(config: {
    webhookUrl: string;
    title: string;
    message: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '0076D7',
          summary: config.title,
          sections: [{
            activityTitle: config.title,
            activitySubtitle: 'Sistema ESG',
            text: config.message
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Teams message failed:', error);
      return false;
    }
  }

  async triggerIntegrations(event: string, data: any, companyId: string): Promise<void> {
    const activeIntegrations = Array.from(this.integrations.values())
      .filter(integration => 
        integration.isActive && 
        integration.triggers.includes(event)
      );

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      source: 'ESG Management System',
      companyId
    };

    // Trigger all matching integrations
    const promises = activeIntegrations.map(async (integration) => {
      try {
        switch (integration.type) {
          case 'zapier':
          case 'webhook':
            return await this.triggerWebhook(integration.id, payload);
          
          case 'slack':
            if (integration.settings.webhookUrl) {
              return await this.sendSlackMessage({
                webhookUrl: integration.settings.webhookUrl,
                message: `${event}: ${JSON.stringify(data)}`,
                channel: integration.settings.channel
              });
            }
            break;
          
          case 'teams':
            if (integration.settings.webhookUrl) {
              return await this.sendTeamsMessage({
                webhookUrl: integration.settings.webhookUrl,
                title: event,
                message: JSON.stringify(data, null, 2)
              });
            }
            break;
          
          case 'email':
            if (integration.settings.recipients) {
              return await this.sendEmail({
                to: integration.settings.recipients,
                subject: `ESG System Alert: ${event}`,
                body: JSON.stringify(data, null, 2)
              });
            }
            break;
        }
      } catch (error) {
        console.error(`Integration ${integration.id} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  getDefaultIntegrationTemplates(): Partial<IntegrationConfig>[] {
    return [
      {
        name: 'Zapier Automation',
        type: 'zapier',
        triggers: ['emission_calculated', 'goal_updated', 'compliance_due'],
        settings: {
          webhookUrl: '',
          description: 'Trigger Zapier workflows for automated actions'
        }
      },
      {
        name: 'Email Notifications',
        type: 'email',
        triggers: ['critical_alert', 'report_generated', 'audit_finding'],
        settings: {
          recipients: [],
          template: 'default',
          description: 'Send email notifications for important events'
        }
      },
      {
        name: 'Slack Alerts',
        type: 'slack',
        triggers: ['non_conformity_created', 'risk_elevated', 'deadline_approaching'],
        settings: {
          webhookUrl: '',
          channel: '#esg-alerts',
          description: 'Send alerts to Slack channels'
        }
      },
      {
        name: 'Microsoft Teams',
        type: 'teams',
        triggers: ['monthly_report', 'compliance_status', 'esg_milestone'],
        settings: {
          webhookUrl: '',
          description: 'Send notifications to Microsoft Teams'
        }
      },
      {
        name: 'Custom API',
        type: 'api',
        triggers: ['data_updated', 'calculation_completed'],
        settings: {
          apiUrl: '',
          apiKey: '',
          method: 'POST',
          description: 'Custom API integration for external systems'
        }
      }
    ];
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) throw new Error('Integration not found');

      const testPayload: WebhookPayload = {
        event: 'integration_test',
        timestamp: new Date().toISOString(),
        data: { message: 'This is a test from ESG Management System' },
        source: 'ESG Management System',
        companyId: 'test'
      };

      switch (integration.type) {
        case 'zapier':
        case 'webhook':
          return await this.triggerWebhook(integrationId, testPayload);
        
        case 'slack':
          return await this.sendSlackMessage({
            webhookUrl: integration.settings.webhookUrl,
            message: '🧪 Test message from ESG Management System',
            channel: integration.settings.channel
          });
        
        case 'teams':
          return await this.sendTeamsMessage({
            webhookUrl: integration.settings.webhookUrl,
            title: 'Integration Test',
            message: 'This is a test message from ESG Management System'
          });
        
        case 'email':
          return await this.sendEmail({
            to: integration.settings.recipients || ['test@example.com'],
            subject: 'ESG System Integration Test',
            body: 'This is a test email from ESG Management System'
          });
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Integration test failed:', error);
      return false;
    }
  }

  async getIntegrationLogs(integrationId: string): Promise<any[]> {
    try {
      // Placeholder - would need database table
      return [];
    } catch (error) {
      console.error('Failed to fetch integration logs:', error);
      return [];
    }
  }

  async logIntegrationEvent(integrationId: string, event: string, success: boolean, details?: any): Promise<void> {
    try {
      // Placeholder - would need database table
      console.log('Integration event:', { integrationId, event, success, details });
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }
}

export const integrationsService = new IntegrationsService();