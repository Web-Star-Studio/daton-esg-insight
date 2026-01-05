import { supabase } from "@/integrations/supabase/client";

export interface MailingList {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  contact_count?: number;
  form_count?: number;
  contacts?: MailingContact[];
  forms?: { id: string; title: string }[];
}

export interface MailingContact {
  id: string;
  mailing_list_id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
  status: 'active' | 'bounced' | 'unsubscribed';
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  company_id: string;
  mailing_list_id: string;
  form_id: string;
  subject: string;
  message?: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  responded_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  created_by_user_id: string;
  email_mailing_lists?: { id: string; name: string };
  custom_forms?: { id: string; title: string };
}

class MailingService {
  private async invoke(action: string, data: Record<string, any> = {}) {
    const { data: result, error } = await supabase.functions.invoke('email-mailing-management', {
      body: { action, ...data }
    });

    if (error) {
      throw new Error(error.message || 'Erro ao executar operação');
    }

    if (result?.error) {
      throw new Error(result.error);
    }

    return result;
  }

  async getTemplate(): Promise<string> {
    const result = await this.invoke('GET_TEMPLATE');
    return result.template;
  }

  async getMailingLists(): Promise<MailingList[]> {
    return await this.invoke('GET_MAILING_LISTS');
  }

  async getMailingList(listId: string): Promise<MailingList> {
    return await this.invoke('GET_MAILING_LIST', { listId });
  }

  async createMailingList(data: { name: string; description?: string; formIds?: string[] }): Promise<MailingList> {
    return await this.invoke('CREATE_MAILING_LIST', data);
  }

  async updateMailingList(listId: string, data: { name: string; description?: string; formIds?: string[] }): Promise<MailingList> {
    return await this.invoke('UPDATE_MAILING_LIST', { listId, ...data });
  }

  async deleteMailingList(listId: string): Promise<void> {
    await this.invoke('DELETE_MAILING_LIST', { listId });
  }

  async importContacts(listId: string, csvContent: string): Promise<{ imported: number; total: number }> {
    return await this.invoke('IMPORT_CONTACTS', { listId, csvContent });
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.invoke('DELETE_CONTACT', { contactId });
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    return await this.invoke('GET_CAMPAIGNS');
  }

  async createCampaign(data: { mailingListId: string; formId: string; subject: string; message?: string }): Promise<EmailCampaign> {
    return await this.invoke('CREATE_CAMPAIGN', data);
  }

  async sendCampaign(campaignId: string): Promise<{ success: boolean; sent: number; total: number }> {
    return await this.invoke('SEND_CAMPAIGN', { campaignId });
  }

  async getForms(): Promise<{ id: string; title: string }[]> {
    return await this.invoke('GET_FORMS');
  }
}

export const mailingService = new MailingService();
